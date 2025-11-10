
import React, { useState, useEffect, useCallback } from "react";
import { ReadingProgress, Novel, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import NovelCard from "../components/novels/NovelCard";

export default function Library() {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState([]);
  const [novels, setNovels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 【修复】使用 useCallback 包装 loadLibrary，并提供空的依赖数组
  // 因为它内部使用的 setIsloading, setProgress, setNovels 是稳定的，不需要作为依赖
  const loadLibrary = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      const [userProgress, allNovels] = await Promise.all([
        ReadingProgress.filter({ user_id: userId }),
        Novel.filter({ is_published: true })
      ]);
      
      setProgress(userProgress);
      
      const novelIds = userProgress.map(p => p.novel_id);
      const userNovels = allNovels.filter(novel => novelIds.includes(novel.id));
      
      const novelsWithProgress = userNovels.map(novel => {
        const novelProgress = userProgress.find(p => p.novel_id === novel.id);
        return { ...novel, progress: novelProgress };
      });
      
      setNovels(novelsWithProgress);
    } catch (error) {
      console.error("Error loading library:", error);
    }
    setIsLoading(false);
  }, []); // 空依赖数组确保此函数引用稳定

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser) {
        await loadLibrary(currentUser.id); 
      }
    } catch (error) {
      console.log("User not authenticated");
      setIsLoading(false);
    }
  }, [loadLibrary]); // 现在 loadLibrary 是一个稳定的依赖

  useEffect(() => {
    loadUser();
  }, [loadUser]); // loadUser 现在也是稳定的，effect 只会运行一次

  const getNovelsByStatus = (status) => {
    return novels.filter(novel => novel.progress?.reading_status === status);
  };

  const getFavorites = () => {
    return novels.filter(novel => novel.progress?.is_favorite);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent className="space-y-4">
            <BookOpen className="w-16 h-16 text-amber-600 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">加入红楼小说</h2>
            <p className="text-slate-600">
              创建您的个人书架并追踪您的阅读进度
            </p>
            <Button onClick={() => User.loginWithRedirect(window.location.href)} className="bg-amber-500 hover:bg-amber-600 text-amber-900">
              登录继续
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
            我的书架
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            记录您的阅读旅程，发现您的下一个最爱故事
          </p>
        </div>

        {/* Library Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{getNovelsByStatus('reading').length}</p>
              <p className="text-sm text-slate-600">正在阅读</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{getNovelsByStatus('completed').length}</p>
              <p className="text-sm text-slate-600">已完成</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{getNovelsByStatus('plan-to-read').length}</p>
              <p className="text-sm text-slate-600">计划阅读</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{getFavorites().length}</p>
              <p className="text-sm text-slate-600">收藏</p>
            </CardContent>
          </Card>
        </div>

        {/* Library Content */}
        <Tabs defaultValue="reading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80">
            <TabsTrigger value="reading">阅读中</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
            <TabsTrigger value="plan-to-read">计划阅读</TabsTrigger>
            <TabsTrigger value="favorites">收藏</TabsTrigger>
            <TabsTrigger value="dropped">已放弃</TabsTrigger>
          </TabsList>

          <TabsContent value="reading" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[3/4] bg-slate-200 rounded-xl animate-pulse"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : getNovelsByStatus('reading').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getNovelsByStatus('reading').map((novel) => (
                  <div key={novel.id} className="space-y-3">
                    <NovelCard novel={novel} />
                    <div className="px-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">阅读进度</span>
                        <span className="text-sm font-medium text-slate-800">
                          {Math.round(novel.progress.progress_percentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${novel.progress.progress_percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        第 {novel.progress.current_chapter} 章
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={BookOpen}
                title="暂无正在阅读的小说"
                description="开始阅读一部小说来在这里查看它"
                action={
                  <Link to={createPageUrl("Home")}>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-amber-900">
                      发现小说
                    </Button>
                  </Link>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="completed">
            {getNovelsByStatus('completed').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getNovelsByStatus('completed').map((novel) => (
                  <div key={novel.id} className="relative">
                    <Badge className="absolute -top-2 -right-2 z-10 bg-green-500 text-white">
                      已完成
                    </Badge>
                    <NovelCard novel={novel} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={CheckCircle2}
                title="暂无已完成的小说"
                description="完成阅读的小说将出现在这里"
              />
            )}
          </TabsContent>

          <TabsContent value="plan-to-read">
            {getNovelsByStatus('plan-to-read').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getNovelsByStatus('plan-to-read').map((novel) => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Clock}
                title="暂无计划阅读的小说"
                description="添加小说到您的阅读列表来在这里查看"
              />
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {getFavorites().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFavorites().map((novel) => (
                  <div key={novel.id} className="relative">
                    <Heart className="absolute -top-2 -right-2 z-10 w-6 h-6 text-pink-500 fill-pink-500" />
                    <NovelCard novel={novel} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Heart}
                title="暂无收藏的小说"
                description="收藏的小说将出现在这里"
              />
            )}
          </TabsContent>

          <TabsContent value="dropped">
            {getNovelsByStatus('dropped').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getNovelsByStatus('dropped').map((novel) => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={AlertCircle}
                title="暂无放弃的小说"
                description="您停止阅读的小说将出现在这里"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6">{description}</p>
      {action}
    </div>
  );
}
