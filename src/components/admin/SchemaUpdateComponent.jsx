
import React, { useState } from "react";
import { updateSchema } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, CheckCircle, AlertCircle } from "lucide-react";

export default function SchemaUpdateComponent() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  const handleSchemaUpdate = async () => {
    setIsUpdating(true);
    setUpdateResult(null);
    
    try {
      const response = await updateSchema();
      setUpdateResult(response.data);
    } catch (error) {
      console.error("Schema update error:", error);
      setUpdateResult({ 
        error: error.message,
        success: false 
      });
    }
    
    setIsUpdating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">数据库字段更新</h2>
      </div>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="w-5 h-5 text-blue-400" />
            Schema 更新工具
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-white/80">
            <p className="mb-2">此工具用于更新数据库结构，主要功能包括：</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>为现有小说记录添加 <code className="bg-white/10 px-1 rounded text-amber-300">is_published</code> 字段</li>
              <li>设置默认值为 <code className="bg-white/10 px-1 rounded text-amber-300">true</code>（上架状态）</li>
              <li>确保所有小说在前端正常显示</li>
            </ul>
          </div>

          <Button 
            onClick={handleSchemaUpdate}
            disabled={isUpdating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                更新中...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                更新数据库字段
              </>
            )}
          </Button>

          {updateResult && (
            <Alert className={`border-${updateResult.error ? 'red' : 'green'}-500/30 bg-${updateResult.error ? 'red' : 'green'}-500/10`}>
              {updateResult.error ? (
                <AlertCircle className="h-4 w-4 text-red-400" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-400" />
              )}
              <AlertDescription className={`text-${updateResult.error ? 'red' : 'green'}-200`}>
                {updateResult.error ? (
                  <div>
                    <p className="font-medium">更新失败:</p>
                    <p className="text-sm">{updateResult.error}</p>
                    {updateResult.details && (
                      <p className="text-xs mt-1">{updateResult.details}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">更新成功!</p>
                    <p className="text-sm">{updateResult.message}</p>
                    {updateResult.totalNovels && (
                      <p className="text-xs mt-1">
                        处理了 {updateResult.totalNovels} 本小说，更新了 {updateResult.updatedNovels} 本
                      </p>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
