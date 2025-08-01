import React, { useState } from "react";
import { User, Novel, Chapter, Comment, Like, ReadingProgress, Rating } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function DataCleanupComponent() {
  const [cleanupStatus, setCleanupStatus] = useState({});
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [totalDeleted, setTotalDeleted] = useState(0);

  const cleanupEntity = async (entityName, EntityClass) => {
    try {
      setCleanupStatus(prev => ({ ...prev, [entityName]: 'cleaning' }));
      
      const allRecords = await EntityClass.list(null, 5000); // 获取所有记录
      console.log(`Found ${allRecords.length} ${entityName} records`);
      
      if (allRecords.length === 0) {
        setCleanupStatus(prev => ({ ...prev, [entityName]: 'success' }));
        return 0;
      }

      // 批量删除以提高性能
      const batchSize = 10;
      let deletedCount = 0;
      
      for (let i = 0; i < allRecords.length; i += batchSize) {
        const batch = allRecords.slice(i, i + batchSize);
        const deletePromises = batch.map(async (record) => {
          try {
            await EntityClass.delete(record.id);
            deletedCount++;
            return true;
          } catch (error) {
            console.error(`Failed to delete ${entityName} record ${record.id}:`, error);
            return false;
          }
        });
        
        await Promise.allSettled(deletePromises);
        
        // 短暂延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setCleanupStatus(prev => ({ ...prev, [entityName]: 'success' }));
      return deletedCount;
      
    } catch (error) {
      console.error(`Error cleaning ${entityName}:`, error);
      setCleanupStatus(prev => ({ ...prev, [entityName]: 'error' }));
      return 0;
    }
  };

  const handleFullCleanup = async () => {
    if (!window.confirm('⚠️ 最终警告：这将删除所有应用数据，包括：\n• 所有小说和章节\n• 用户评论和评分\n• 阅读进度记录\n• 点赞数据\n\n此操作无法撤销！确定继续？')) {
      return;
    }

    if (!window.confirm('请最后确认一次：您真的要清空整个数据库吗？')) {
      return;
    }

    setIsCleaningUp(true);
    setCleanupStatus({});
    setTotalDeleted(0);

    try {
      // 按照数据依赖关系的顺序进行清理
      // 先删除依赖数据，最后删除核心数据
      const cleanupOrder = [
        ['Likes', Like],          // 点赞（依赖评论）
        ['Comments', Comment],    // 评论（依赖小说/章节）
        ['Ratings', Rating],      // 评分（依赖小说）
        ['ReadingProgress', ReadingProgress], // 阅读进度（依赖用户和小说）
        ['Chapters', Chapter],    // 章节（依赖小说）
        ['Novels', Novel]         // 小说（核心实体）
      ];

      let totalDeletedCount = 0;
      
      for (const [entityName, EntityClass] of cleanupOrder) {
        console.log(`开始清理 ${entityName}...`);
        const deletedCount = await cleanupEntity(entityName, EntityClass);
        totalDeletedCount += deletedCount;
        setTotalDeleted(totalDeletedCount);
        
        // 给用户一些反馈时间
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      alert(`✅ 数据清理完成！\n\n总共删除了 ${totalDeletedCount} 条记录\n数据库已清空，可以进行新的区块链同步。`);
      
    } catch (error) {
      alert('❌ 清理过程中出现错误，请查看控制台输出。');
      console.error('Cleanup error:', error);
    }

    setIsCleaningUp(false);
  };
  
  // 要清理的所有实体列表（现已包含Rating）
  const entitiesToClean = [
    { name: 'Likes', displayName: '点赞数据' },
    { name: 'Comments', displayName: '评论数据' },
    { name: 'Ratings', displayName: '评分数据' },
    { name: 'ReadingProgress', displayName: '阅读进度' },
    { name: 'Chapters', displayName: '章节数据' },
    { name: 'Novels', displayName: '小说数据' }
  ];

  return (
    <div className="h-full p-6 bg-slate-50 rounded-lg">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            数据库完全清理
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 flex-1">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>危险操作警告：</strong> 此操作将删除所有数据，包括小说、章节、评论、评分、阅读进度等。请确保已经备份重要数据！
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">清理状态</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entitiesToClean.map(({ name, displayName }) => (
                <div 
                  key={name} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm"
                >
                  <div>
                    <span className="font-medium text-slate-700">{displayName}</span>
                    <span className="text-sm text-slate-500 ml-2">({name})</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {cleanupStatus[name] === 'cleaning' && (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-600">清理中...</span>
                      </div>
                    )}
                    {cleanupStatus[name] === 'success' && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">完成</span>
                      </div>
                    )}
                    {cleanupStatus[name] === 'error' && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">出错</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {isCleaningUp && totalDeleted > 0 && (
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium">已删除 {totalDeleted} 条记录</p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-auto border-t">
            <Button 
              onClick={handleFullCleanup}
              disabled={isCleaningUp}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              size="lg"
            >
              {isCleaningUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在清理数据库... ({totalDeleted} 条已删除)
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  开始完全清理数据库
                </>
              )}
            </Button>
            
            <p className="text-xs text-slate-500 text-center mt-2">
              清理顺序：点赞 → 评论 → 评分 → 阅读进度 → 章节 → 小说
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}