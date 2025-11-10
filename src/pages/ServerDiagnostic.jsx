import React, { useState, useEffect } from "react";
import { Novel, Chapter, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Clock, Database, Zap } from "lucide-react";

export default function ServerDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResults([]);
    const results = [];
    let totalTime = 0;

    // 测试1: 基础连接测试
    const addResult = (name, status, time, details = '', data = null) => {
      const result = { name, status, time, details, data, timestamp: Date.now() };
      results.push(result);
      setDiagnosticResults([...results]);
      totalTime += time;
    };

    try {
      // 测试用户认证
      const userStart = Date.now();
      try {
        const user = await User.me();
        addResult('用户认证', 'success', Date.now() - userStart, `用户: ${user.full_name || user.email}`, user);
      } catch (error) {
        addResult('用户认证', 'warning', Date.now() - userStart, '未登录状态，这可能影响某些数据访问');
      }

      // 测试小说列表加载
      const novelsStart = Date.now();
      try {
        const novels = await Novel.filter({ is_published: true }, null, 5);
        const novelsTime = Date.now() - novelsStart;
        addResult('小说列表', novels.length > 0 ? 'success' : 'warning', novelsTime, 
          `加载了 ${novels.length} 本小说`, { count: novels.length, samples: novels.slice(0, 2) });
      } catch (error) {
        addResult('小说列表', 'error', Date.now() - novelsStart, `错误: ${error.message}`);
      }

      // 测试所有小说（包括下架）
      const allNovelsStart = Date.now();
      try {
        const allNovels = await Novel.list(null, 10);
        const publishedCount = allNovels.filter(n => n.is_published !== false).length;
        const unpublishedCount = allNovels.filter(n => n.is_published === false).length;
        addResult('所有小说数据', 'success', Date.now() - allNovelsStart, 
          `总计: ${allNovels.length}, 上架: ${publishedCount}, 下架: ${unpublishedCount}`,
          { total: allNovels.length, published: publishedCount, unpublished: unpublishedCount });
      } catch (error) {
        addResult('所有小说数据', 'error', Date.now() - allNovelsStart, `错误: ${error.message}`);
      }

      // 测试章节数据
      const chaptersStart = Date.now();
      try {
        const chapters = await Chapter.filter({ published: true }, null, 10);
        addResult('章节数据', chapters.length > 0 ? 'success' : 'warning', Date.now() - chaptersStart,
          `找到 ${chapters.length} 个已发布章节`, { count: chapters.length });
      } catch (error) {
        addResult('章节数据', 'error', Date.now() - chaptersStart, `错误: ${error.message}`);
      }

      // 测试单个小说详情加载
      const novels = await Novel.filter({ is_published: true }, null, 1);
      if (novels.length > 0) {
        const novelDetailStart = Date.now();
        try {
          const novelChapters = await Chapter.filter({ 
            novel_id: novels[0].id, 
            published: true 
          }, "chapter_number", 50);
          addResult('单本小说章节', 'success', Date.now() - novelDetailStart,
            `《${novels[0].title}》有 ${novelChapters.length} 章`, 
            { novel: novels[0].title, chapters: novelChapters.length });
        } catch (error) {
          addResult('单本小说章节', 'error', Date.now() - novelDetailStart, `错误: ${error.message}`);
        }
      }

      // 生成诊断总结
      const successCount = results.filter(r => r.status === 'success').length;
      const warningCount = results.filter(r => r.status === 'warning').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      setSummary({
        totalTime,
        totalTests: results.length,
        successCount,
        warningCount,
        errorCount,
        avgResponseTime: totalTime / results.length
      });

    } catch (error) {
      addResult('系统错误', 'error', 0, `致命错误: ${error.message}`);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">服务器诊断工具</h1>
          <p className="text-slate-600">检测应用性能和数据加载状况</p>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                诊断中...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                开始诊断
              </>
            )}
          </Button>
        </div>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                诊断总结
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.successCount}</div>
                  <div className="text-sm text-slate-600">成功</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{summary.warningCount}</div>
                  <div className="text-sm text-slate-600">警告</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.errorCount}</div>
                  <div className="text-sm text-slate-600">错误</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(summary.avgResponseTime)}ms</div>
                  <div className="text-sm text-slate-600">平均响应</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>性能评估：</strong>
                  {summary.avgResponseTime < 500 ? '响应速度正常' : 
                   summary.avgResponseTime < 1000 ? '响应速度较慢' : '响应速度很慢'}
                  {summary.errorCount > 0 && ' | 存在数据加载错误'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {diagnosticResults.map((result, index) => (
            <Card key={index} className={`border ${getStatusColor(result.status)}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-medium text-slate-800">{result.name}</h3>
                      <p className="text-sm text-slate-600">{result.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{result.time}ms</div>
                    <div className="text-xs text-slate-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                {result.data && (
                  <div className="mt-3 p-2 bg-white/50 rounded text-xs text-slate-600">
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {diagnosticResults.length > 0 && (
          <Alert>
            <AlertDescription>
              <strong>诊断建议：</strong>
              {summary?.errorCount > 0 && " 存在数据加载错误，请检查网络连接和数据库状态。"}
              {summary?.avgResponseTime > 1000 && " 响应时间过长，可能是服务器性能问题。"}
              {summary?.successCount === summary?.totalTests && " 所有测试通过，系统运行正常。"}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}