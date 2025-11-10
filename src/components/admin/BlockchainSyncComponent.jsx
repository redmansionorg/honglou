
import React, { useState, useEffect } from "react";
import { syncNovels } from "@/api/functions";
import { syncChapters } from "@/api/functions";
import { getChapterCountFromChain } from "@/api/functions";
import { Novel } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, BookCopy, Plus, ChevronsRight, FileText, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BlockchainSyncComponent() {
    const [novels, setNovels] = useState([]);
    const [isSyncingNovels, setIsSyncingNovels] = useState(false);
    const [syncingChaptersFor, setSyncingChaptersFor] = useState(null);
    const [fetchingChapterCountFor, setFetchingChapterCountFor] = useState(null);
    
    const [error, setError] = useState(null);
    const [novelSyncResult, setNovelSyncResult] = useState(null);
    const [chapterSyncStatus, setChapterSyncStatus] = useState({});
    const [chainChapterCounts, setChainChapterCounts] = useState({});

    // 页面加载时获取已上架的小说
    useEffect(() => {
        loadPublishedNovels();
    }, []);

    const loadPublishedNovels = async () => {
        try {
            const publishedNovels = await Novel.filter({ is_published: true });
            setNovels(publishedNovels);
        } catch (error) {
            console.error("Error loading published novels:", error);
        }
    };

    const handleSyncNovels = async () => {
        setIsSyncingNovels(true);
        setNovelSyncResult(null);
        setError(null);
        try {
            const response = await syncNovels();
            const data = response.data;
            if (data && data.success) {
                setNovelSyncResult({ 
                    success: true, 
                    summary: data.summary, 
                    stats: data.stats 
                });
                // 重新加载小说列表
                await loadPublishedNovels();
            } else {
                throw new Error(data?.error || "同步小说失败");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || "同步小说时发生错误";
            setError(errorMessage);
            setNovelSyncResult({ success: false, summary: errorMessage });
        }
        setIsSyncingNovels(false);
    };

    const handleFetchChapterCount = async (novelId) => {
        setFetchingChapterCountFor(novelId);
        try {
            const response = await getChapterCountFromChain({ novel_id: novelId });
            const data = response.data;
            if (data.success) {
                setChainChapterCounts(prev => ({ ...prev, [novelId]: data.count }));
            }
        } catch (error) {
            console.error(`无法获取小说章节数:`, error);
        }
        setFetchingChapterCountFor(null);
    };

    const handleSyncChapters = async (novelId, syncType) => {
        setSyncingChaptersFor(`${novelId}-${syncType}`);
        setChapterSyncStatus(prev => ({ ...prev, [novelId]: { status: "syncing", summary: null, type: syncType } }));
        try {
            const response = await syncChapters({ novel_id: novelId, sync_type: syncType });
            const data = response.data;
            if (data && data.success) {
                setChapterSyncStatus(prev => ({ 
                    ...prev, 
                    [novelId]: { status: "success", summary: data.summary, type: syncType }
                }));
                // 重新获取最新的章节数
                await handleFetchChapterCount(novelId);
                // 重新加载小说列表以更新已同步章数
                await loadPublishedNovels();
            } else {
                 throw new Error(data?.error || `同步章节失败`);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || `同步章节时发生错误`;
            setError(errorMessage);
            setChapterSyncStatus(prev => ({ ...prev, [novelId]: { status: "error", summary: errorMessage, type: syncType } }));
        }
        setSyncingChaptersFor(null);
    };

    return (
        <div className="space-y-6 text-white">
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>发生错误</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* 同步小说卡片 */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <FileText className="w-5 h-5"/>
                        同步小说列表
                    </CardTitle>
                    <CardDescription className="text-white/60">
                        从 OpusFactory 合约获取所有小说信息并同步到数据库
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Button 
                            onClick={handleSyncNovels} 
                            disabled={isSyncingNovels} 
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSyncingNovels ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {isSyncingNovels ? "正在同步小说..." : "同步全部小说"}
                        </Button>
                        {novelSyncResult && (
                           novelSyncResult.success ? (
                               <CheckCircle className="h-6 w-6 text-green-400" />
                           ) : (
                               <AlertTriangle className="h-6 w-6 text-red-400" />
                           )
                        )}
                    </div>
                    {novelSyncResult && (
                        <Alert className={`border-${novelSyncResult.success ? 'green' : 'red'}-500/30 bg-${novelSyncResult.success ? 'green' : 'red'}-500/10`}>
                            <AlertTitle className={`text-${novelSyncResult.success ? 'green' : 'red'}-300`}>
                                {novelSyncResult.success ? "同步完成" : "同步失败"}
                            </AlertTitle>
                            <AlertDescription className="text-white">
                                {novelSyncResult.summary}
                            </AlertDescription>
                            {novelSyncResult.success && novelSyncResult.stats && (
                                <div className="mt-2 text-sm text-white/80">
                                    <p>统计信息: 新增 {novelSyncResult.stats.created} 部，更新 {novelSyncResult.stats.updated} 部</p>
                                    {novelSyncResult.stats.skippedUnpublished > 0 && (
                                        <p>跳过下架小说: {novelSyncResult.stats.skippedUnpublished} 部</p>
                                    )}
                                    {novelSyncResult.stats.errors > 0 && (
                                        <p className="text-red-300">错误: {novelSyncResult.stats.errors} 个</p>
                                    )}
                                </div>
                            )}
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* 同步章节卡片 */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <ChevronsRight className="w-5 h-5"/>
                        同步章节内容
                    </CardTitle>
                    <CardDescription className="text-white/60">
                        为每本已上架的小说同步章节内容
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {novels.length === 0 ? (
                        <p className="text-white/60">数据库中没有已上架的小说，请先同步小说列表。</p>
                    ) : (
                        <div className="space-y-3">
                            {/* 表头 */}
                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-white/80 border-b border-white/10 pb-2">
                                <div className="col-span-3">小说名称</div>
                                <div className="col-span-2">作者</div>
                                <div className="col-span-1">已同步</div>
                                <div className="col-span-2">链上最新</div>
                                <div className="col-span-1">待同步</div>
                                <div className="col-span-3">操作</div>
                            </div>

                            {/* 小说列表 */}
                            <div className="max-h-[500px] overflow-y-auto space-y-2">
                                {novels.map(novel => {
                                    const dbCount = novel.total_chapters || 0;
                                    const chainCount = chainChapterCounts[novel.id];
                                    const pendingCount = chainCount !== undefined ? Math.max(0, chainCount - dbCount) : '?';
                                    // needsSync is now only used for visual indicators if desired, not to disable the button
                                    const needsSync = chainCount !== undefined && dbCount < chainCount; 

                                    return (
                                        <div key={novel.id} className="bg-black/20 rounded-lg p-4 border border-white/10">
                                            <div className="grid grid-cols-12 gap-4 items-center">
                                                {/* 小说名称 */}
                                                <div className="col-span-3">
                                                    <h4 className="font-medium text-white text-sm truncate" title={novel.title}>
                                                        {novel.title}
                                                    </h4>
                                                </div>

                                                {/* 作者 */}
                                                <div className="col-span-2">
                                                    <span className="text-white/60 text-sm truncate" title={novel.author}>
                                                        {novel.author}
                                                    </span>
                                                </div>

                                                {/* 已同步章数 */}
                                                <div className="col-span-1">
                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                                                        {dbCount}
                                                    </Badge>
                                                </div>

                                                {/* 链上最新章数 */}
                                                <div className="col-span-2 flex items-center gap-2">
                                                    {chainCount !== undefined ? (
                                                        <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                                                            {chainCount}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-white/30 text-white/60">
                                                            未检测
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                                                        onClick={() => handleFetchChapterCount(novel.id)}
                                                        disabled={fetchingChapterCountFor === novel.id}
                                                        title="检测链上章节数"
                                                    >
                                                        {fetchingChapterCountFor === novel.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Search className="w-3 h-3" />
                                                        )}
                                                    </Button>
                                                </div>

                                                {/* 待同步章数 */}
                                                <div className="col-span-1">
                                                    {pendingCount === '?' ? (
                                                        <span className="text-white/60 text-sm">?</span>
                                                    ) : pendingCount > 0 ? (
                                                        <Badge className="bg-amber-500/20 text-amber-300">
                                                            {pendingCount}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-green-500/20 text-green-300">
                                                            0
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* 同步操作 - 修复增量同步按钮 */}
                                                <div className="col-span-3 flex items-center gap-2">
                                                    <div className="flex items-center">
                                                        {/* 主按钮：直接执行增量同步 - 移除 !needsSync 限制 */}
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white rounded-r-none border-r border-green-500"
                                                            onClick={() => handleSyncChapters(novel.id, 'incremental')}
                                                            disabled={!!syncingChaptersFor}
                                                        >
                                                            {syncingChaptersFor?.startsWith(`${novel.id}-`) ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Plus className="mr-2 h-4 w-4" />
                                                            )}
                                                            增量同步
                                                        </Button>
                                                        
                                                        {/* 下拉按钮：选择同步模式 */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700 text-white rounded-l-none px-2"
                                                                    disabled={!!syncingChaptersFor}
                                                                >
                                                                    ▼
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleSyncChapters(novel.id, 'incremental')}
                                                                >
                                                                    <Plus className="mr-2 h-4 w-4" />
                                                                    增量同步
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleSyncChapters(novel.id, 'full')}
                                                                >
                                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                                    全量同步
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 同步状态显示 */}
                                            {chapterSyncStatus[novel.id] && (
                                                <div className="mt-3">
                                                    <Alert className={`text-xs border-${chapterSyncStatus[novel.id].status === 'success' ? 'green' : 'red'}-500/30 bg-${chapterSyncStatus[novel.id].status === 'success' ? 'green' : 'red'}-500/10`}>
                                                        <AlertDescription className="text-white">
                                                            {chapterSyncStatus[novel.id].summary}
                                                        </AlertDescription>
                                                    </Alert>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
