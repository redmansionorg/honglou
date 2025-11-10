
import React, { useState } from "react";
import { syncAuthorProfiles } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AuthorSyncComponent() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        setError(null);
        try {
            const response = await syncAuthorProfiles();
            const data = response.data;
            if (data && data.success) {
                setSyncResult({ success: true, summary: data.summary });
            } else {
                throw new Error(data?.error || "同步作者失败，但未返回明确错误。");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || "同步作者信息时发生未知错误。";
            setError(errorMessage);
            setSyncResult({ success: false, summary: errorMessage });
        }
        setIsSyncing(false);
    };

    return (
        <div className="space-y-6 text-white">
             <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Users className="w-5 h-5"/>
                        同步作者信息
                    </CardTitle>
                    <CardDescription className="text-white/60">
                        从 AuthorRegistry 合约同步所有已注册作者的详细信息。这是一个独立操作，可以随时执行。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>发生错误</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="flex items-center gap-4">
                        <Button 
                            onClick={handleSync} 
                            disabled={isSyncing} 
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                            {isSyncing ? "正在同步作者..." : "同步所有作者"}
                        </Button>
                        {syncResult && (
                           syncResult.success ? (
                               <CheckCircle className="h-6 w-6 text-green-400" />
                           ) : (
                               <AlertTriangle className="h-6 w-6 text-red-400" />
                           )
                        )}
                    </div>
                     {syncResult && (
                        <Alert className={`border-${syncResult.success ? 'green' : 'red'}-500/30 bg-${syncResult.success ? 'green' : 'red'}-500/10`}>
                            <AlertTitle className={`text-${syncResult.success ? 'green' : 'red'}-300`}>
                                {syncResult.success ? "同步完成" : "同步失败"}
                            </AlertTitle>
                            <AlertDescription className="text-white">
                                {syncResult.summary}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
