import React, { useState } from "react";
import { User, Novel, Chapter, Comment, Like, ReadingProgress } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";

export default function DataCleanup() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cleanupStatus, setCleanupStatus] = useState({});
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  React.useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setIsAuthorized(currentUser && currentUser.email === 'xeyesu@gmail.com');
    } catch (error) {
      console.log("User not authenticated");
      setIsAuthorized(false);
    }
    setIsLoading(false);
  };

  const cleanupEntity = async (entityName, EntityClass) => {
    try {
      setCleanupStatus(prev => ({ ...prev, [entityName]: 'cleaning' }));
      
      const allRecords = await EntityClass.list();
      console.log(`Found ${allRecords.length} ${entityName} records`);
      
      for (const record of allRecords) {
        await EntityClass.delete(record.id);
      }
      
      setCleanupStatus(prev => ({ ...prev, [entityName]: 'success' }));
      return allRecords.length;
    } catch (error) {
      console.error(`Error cleaning ${entityName}:`, error);
      setCleanupStatus(prev => ({ ...prev, [entityName]: 'error' }));
      throw error;
    }
  };

  const handleFullCleanup = async () => {
    if (!window.confirm('⚠️ 警告：这将删除所有数据，包括小说、章节、评论、用户阅读进度等。此操作无法撤销！\n\n确定要继续吗？')) {
      return;
    }

    if (!window.confirm('请再次确认：您真的要删除所有数据吗？')) {
      return;
    }

    setIsCleaningUp(true);
    setCleanupStatus({});

    try {
      // 按依赖关系顺序清理
      const cleanupOrder = [
        ['Likes', Like],
        ['Comments', Comment],
        ['ReadingProgress', ReadingProgress],
        ['Chapters', Chapter],
        ['Novels', Novel]
      ];

      let totalDeleted = 0;
      
      for (const [entityName, EntityClass] of cleanupOrder) {
        const deletedCount = await cleanupEntity(entityName, EntityClass);
        totalDeleted += deletedCount;
        
        // 短暂延迟以避免过快的请求
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      alert(`清理完成！共删除了 ${totalDeleted} 条记录。`);
      
    } catch (error) {
      alert('清理过程中出现错误，请查看控制台输出。');
      console.error('Cleanup error:', error);
    }

    setIsCleaningUp(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证用户权限中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">数据清理工具</h2>
            <p className="text-gray-600 mb-6">请先登录以访问清理功能</p>
            <Button onClick={() => User.loginWithRedirect(window.location.href)}>
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">访问被拒绝</h2>
            <p className="text-gray-600 mb-2">您没有权限访问此页面</p>
            <p className="text-sm text-gray-500">当前用户: {user.email}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数据清理工具</h1>
          <p className="text-gray-600">管理员: {user.email}</p>
        </div>

        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>危险操作警告：</strong> 此工具将永久删除所有数据，包括小说、章节、评论、用户阅读进度等。操作前请确保您已备份重要数据。
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              数据清理操作
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">清理状态</h3>
              
              {['Likes', 'Comments', 'ReadingProgress', 'Chapters', 'Novels'].map(entityName => (
                <div key={entityName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{entityName}</span>
                  <div className="flex items-center gap-2">
                    {cleanupStatus[entityName] === 'cleaning' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    {cleanupStatus[entityName] === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {cleanupStatus[entityName] === 'error' && (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={handleFullCleanup}
                disabled={isCleaningUp}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                {isCleaningUp ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    正在清理数据...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空所有数据
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}