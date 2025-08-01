import React, { useState, useEffect } from "react";
import { Novel } from "@/api/entities";
import { syncNovels } from "@/api/functions";
import { syncChapters } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Book, FileText, AlertCircle, CheckCircle } from "lucide-react";

export default function BlockchainSyncComponent() {
  const [novels, setNovels] = useState([]);
  const [isLoadingNovels, setIsLoadingNovels] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingChapters, setSyncingChapters] = useState({});
  const [syncResult, setSyncResult] = useState(null);
  const [chapterSyncResults, setChapterSyncResults] = useState({});

  useEffect(() => {
    loadNovels();
  }, []);

  const loadNovels = async () => {
    setIsLoadingNovels(true);
    try {
      const allNovels = await Novel.list();
      setNovels(allNovels);
    } catch (error) {
      console.error("Error loading novels:", error);
    }
    setIsLoadingNovels(false);
  };

  const handleSyncNovels = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const response = await syncNovels();
      setSyncResult(response.data);
      await loadNovels();
    } catch (error) {
      console.error("Sync error:", error);
      setSyncResult({ error: error.message });
    }
    setIsSyncing(false);
  };

  const handleSyncChapters = async (novelId, novelTitle) => {
    setSyncingChapters(prev => ({ ...prev, [novelId]: true }));
    try {
      const response = await syncChapters({ novel_id: novelId });
      setChapterSyncResults(prev => ({ 
        ...prev, 
        [novelId]: response.data 
      }));
    } catch (error) {
      console.error("Chapter sync error:", error);
      setChapterSyncResults(prev => ({ 
        ...prev, 
        [novelId]: { error: error.message } 
      }));
    }
    setSyncingChapters(prev => ({ ...prev, [novelId]: false }));
  };

  const blockchainNovels = novels.filter(n => n.bc_contract_address);
  const regularNovels = novels.filter(n => !n.bc_contract_address);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">区块链同步</h2>
        <Button 
          onClick={handleSyncNovels}
          disabled={isSyncing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              同步中...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              同步小说
            </>
          )}
        </Button>
      </div>

      {syncResult && (
        <Alert className={`border-${syncResult.error ? 'red' : 'green'}-500/30 bg-${syncResult.error ? 'red' : 'green'}-500/10`}>
          {syncResult.error ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-400" />
          )}
          <AlertDescription className={`text-${syncResult.error ? 'red' : 'green'}-200`}>
            {syncResult.error ? `同步失败: ${syncResult.error}` : syncResult.stats?.summary || '同步成功'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* 区块链小说 */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Book className="w-5 h-5 text-blue-400" />
              区块链小说 ({blockchainNovels.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingNovels ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            ) : blockchainNovels.length > 0 ? (
              blockchainNovels.map(novel => (
                <div key={novel.id} className="border border-white/20 rounded-lg p-4 bg-white/5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{novel.title}</h3>
                      <p className="text-sm text-white/60 mb-2">作者: {novel.author}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {novel.genre}
                        </Badge>
                        <Badge className="bg-green-500/20 text-green-400">
                          {novel.status}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          {novel.total_chapters || 0} 章节
                        </Badge>
                      </div>
                      <p className="text-xs text-white/40">
                        合约地址: {novel.bc_contract_address}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSyncChapters(novel.id, novel.title)}
                        disabled={syncingChapters[novel.id]}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {syncingChapters[novel.id] ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            同步中
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-3 w-3" />
                            同步章节
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {chapterSyncResults[novel.id] && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      {chapterSyncResults[novel.id].error ? (
                        <p className="text-red-400 text-sm">
                          同步失败: {chapterSyncResults[novel.id].error}
                        </p>
                      ) : (
                        <p className="text-green-400 text-sm">
                          {chapterSyncResults[novel.id].stats?.summary || '章节同步成功'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-white/60 py-8">
                暂无区块链小说数据
              </p>
            )}
          </CardContent>
        </Card>

        {/* 普通小说 */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Book className="w-5 h-5 text-gray-400" />
              普通小说 ({regularNovels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {regularNovels.length > 0 ? (
              <div className="space-y-2">
                {regularNovels.map(novel => (
                  <div key={novel.id} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-white">{novel.title}</h4>
                        <p className="text-sm text-white/60">作者: {novel.author}</p>
                      </div>
                      <Badge className="bg-gray-500/20 text-gray-400">
                        本地创建
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-white/60 py-4">
                暂无普通小说数据
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}