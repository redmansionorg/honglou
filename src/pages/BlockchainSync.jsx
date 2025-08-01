
import React, { useState } from "react";
import { syncNovels } from "@/api/functions";
import { syncChapters } from "@/api/functions";
import { Novel } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BlockchainSync() {
    const [novels, setNovels] = useState([]);
    const [isSyncingNovels, setIsSyncingNovels] = useState(false);
    const [syncingChaptersFor, setSyncingChaptersFor] = useState(null);
    const [error, setError] = useState(null);
    const [novelSyncStatus, setNovelSyncStatus] = useState("idle");
    const [chapterSyncStatus, setChapterSyncStatus] = useState({});
    const [syncStats, setSyncStats] = useState(null); // 新增统计状态

    const handleSyncNovels = async () => {
        setIsSyncingNovels(true);
        setError(null);
        setNovelSyncStatus("syncing");
        setSyncStats(null); // Clear previous stats when starting a new sync
        try {
            const { data } = await syncNovels();
            setNovels(data.novels || data); // 兼容新旧数据格式
            setSyncStats(data.stats); // 保存统计信息
            setNovelSyncStatus("success");
        } catch (err) {
            console.error("Failed to sync novels:", err);
            setError(err.data?.error || "An unknown error occurred while syncing novels.");
            setNovelSyncStatus("error");
        }
        setIsSyncingNovels(false);
    };

    const handleSyncChapters = async (novelId) => {
        setSyncingChaptersFor(novelId);
        setError(null);
        // Ensure chapterSyncStatus is consistently an object with a 'status' property
        setChapterSyncStatus(prev => ({ ...prev, [novelId]: { status: "syncing" } }));
        try {
            const { data } = await syncChapters({ novel_id: novelId });
            setChapterSyncStatus(prev => ({ 
                ...prev, 
                [novelId]: { status: "success", stats: data.stats }
            }));
        } catch (err) {
            console.error(`Failed to sync chapters for novel ${novelId}:`, err);
            setError(err.data?.error || `An unknown error occurred while syncing chapters for novel ${novelId}.`);
            // Ensure chapterSyncStatus is consistently an object with a 'status' property for error
            setChapterSyncStatus(prev => ({ ...prev, [novelId]: { status: "error" } }));
        }
        setSyncingChaptersFor(null);
    };

    const getChapterSyncIcon = (novelId) => {
        // Access the status from the object stored in chapterSyncStatus
        const status = chapterSyncStatus[novelId]?.status; 
        switch (status) {
            case "syncing":
                return <Loader2 className="h-4 w-4 animate-spin" />;
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "error":
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>区块链数据同步</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-600">
                            此工具用于从 Sepolia 区块链同步小说和章节数据到应用数据库。请按顺序执行。
                        </p>
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>错误</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>第一步：同步小说列表</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Button onClick={handleSyncNovels} disabled={isSyncingNovels}>
                                {isSyncingNovels ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                {isSyncingNovels ? "正在同步..." : "开始同步小说"}
                            </Button>
                            {novelSyncStatus === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
                            {novelSyncStatus === 'error' && <AlertTriangle className="h-6 w-6 text-red-500" />}
                        </div>

                        {/* 显示小说同步统计 */}
                        {syncStats && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 className="font-semibold text-green-800 mb-2">同步完成统计</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-700">{syncStats.novelsCreated}</div>
                                        <div className="text-green-600">新增小说</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-700">{syncStats.novelsUpdated}</div>
                                        <div className="text-blue-600">更新小说</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-700">{syncStats.totalProcessed}</div>
                                        <div className="text-slate-600">总处理数</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>第二步：同步章节内容</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {novels.length === 0 ? (
                            <p className="text-slate-500">请先同步小说列表。</p>
                        ) : (
                            novels.map(novel => (
                                <div key={novel.id} className="bg-slate-100 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-slate-800">{novel.title}</span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSyncChapters(novel.id)}
                                                disabled={syncingChaptersFor === novel.id || isSyncingNovels}
                                            >
                                                {syncingChaptersFor === novel.id ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : null}
                                                {syncingChaptersFor === novel.id ? "同步中..." : "同步章节"}
                                            </Button>
                                            {getChapterSyncIcon(novel.id)}
                                        </div>
                                    </div>

                                    {/* 显示章节同步统计 */}
                                    {chapterSyncStatus[novel.id]?.status === "success" && chapterSyncStatus[novel.id]?.stats && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <h5 className="font-medium text-green-800 mb-2 text-sm">章节同步统计</h5>
                                            <div className="grid grid-cols-4 gap-2 text-xs">
                                                <div className="text-center">
                                                    <div className="font-bold text-green-700">{chapterSyncStatus[novel.id].stats.chaptersCreated}</div>
                                                    <div className="text-green-600">新增</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-blue-700">{chapterSyncStatus[novel.id].stats.chaptersUpdated}</div>
                                                    <div className="text-blue-600">更新</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-slate-700">{chapterSyncStatus[novel.id].stats.totalProcessed}</div>
                                                    <div className="text-slate-600">总数</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-red-700">{chapterSyncStatus[novel.id].stats.errors || 0}</div>
                                                    <div className="text-red-600">错误</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
