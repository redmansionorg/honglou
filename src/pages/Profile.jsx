
import React, { useState, useEffect, useCallback } from "react";
import { User, ReadingProgress, Novel } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, CheckCircle2, TrendingUp, Calendar, LogOut } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalNovels: 0,
    completedNovels: 0,
    favoritesCount: 0,
    totalChaptersRead: 0,
    joinDate: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // Accept userCreatedDate as a parameter to ensure joinDate is correctly set from the fetched user data.
  // This function is called by loadUser, so it doesn't need to be memoized with useCallback unless
  // it's passed down to child components that depend on its referential equality.
  // For the current use case, it's fine as a regular function or could be wrapped in useCallback
  // if `loadUser` also depended on it being stable.
  const loadUserStats = useCallback(async (userId, userCreatedDate) => {
    try {
      const [userProgress, allNovels] = await Promise.all([
        ReadingProgress.filter({ user_id: userId }),
        Novel.list() // Note: allNovels is fetched but not used in current stats calculation
      ]);

      const completedCount = userProgress.filter(p => p.reading_status === 'completed').length;
      const favoritesCount = userProgress.filter(p => p.is_favorite).length;
      const totalChaptersRead = userProgress.reduce((sum, p) => sum + (p.current_chapter || 0), 0);

      setStats({
        totalNovels: userProgress.length,
        completedNovels: completedCount,
        favoritesCount,
        totalChaptersRead,
        joinDate: userCreatedDate // Use the passed userCreatedDate
      });
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  }, []); // Empty dependency array as it doesn't depend on any external props/state that would change its logic.

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser) {
        // Pass the created_date from currentUser to loadUserStats to ensure it's available and correct.
        await loadUserStats(currentUser.id, currentUser.created_date);
      }
    } catch (error) {
      console.log("User not authenticated");
    }
    setIsLoading(false);
  }, [loadUserStats]); // loadUser now depends on loadUserStats, so include it in dependencies.

  useEffect(() => {
    loadUser();
  }, [loadUser]); // Corrected: useEffect now depends on the memoized loadUser function.

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent className="space-y-4">
            <BookOpen className="w-16 h-16 text-amber-600 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">加入红楼小说</h2>
            <p className="text-slate-600">
              创建您的个人资料并开始您的阅读之旅
            </p>
            <Button onClick={() => User.loginWithRedirect(window.location.href)} className="bg-amber-500 hover:bg-amber-600 text-amber-900">
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Profile Header */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                  {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  {user.full_name || '读者'}
                </h1>
                <p className="text-slate-600 mb-4">{user.email}</p>

                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    {user.role === 'admin' ? '管理员' : '读者'}
                  </Badge>
                  {stats.joinDate && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>加入于 {format(new Date(stats.joinDate), "yyyy年M月")}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reading Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-center space-y-2">
                <BookOpen className="w-8 h-8 text-blue-500 mx-auto" />
                <span className="text-2xl font-bold text-slate-800">{stats.totalNovels}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <p className="text-sm text-slate-600">书架中的小说</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                <span className="text-2xl font-bold text-slate-800">{stats.completedNovels}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <p className="text-sm text-slate-600">已完成</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-center space-y-2">
                <Heart className="w-8 h-8 text-pink-500 mx-auto" />
                <span className="text-2xl font-bold text-slate-800">{stats.favoritesCount}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <p className="text-sm text-slate-600">收藏</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-center space-y-2">
                <TrendingUp className="w-8 h-8 text-amber-500 mx-auto" />
                <span className="text-2xl font-bold text-slate-800">{stats.totalChaptersRead}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <p className="text-sm text-slate-600">已读章节</p>
            </CardContent>
          </Card>
        </div>

        {/* Reading Achievements */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              阅读成就
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">

              {/* Achievement Cards */}
              <div className={`p-4 rounded-lg border-2 ${stats.totalNovels >= 1 ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.totalNovels >= 1 ? 'bg-green-500' : 'bg-slate-400'}`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">初次尝试</h4>
                    <p className="text-sm text-slate-600">添加您的第一部小说</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.completedNovels >= 1 ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.completedNovels >= 1 ? 'bg-green-500' : 'bg-slate-400'}`}>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">完成主义者</h4>
                    <p className="text-sm text-slate-600">完成您的第一部小说</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.favoritesCount >= 3 ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.favoritesCount >= 3 ? 'bg-green-500' : 'bg-slate-400'}`}>
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">收藏家</h4>
                    <p className="text-sm text-slate-600">收藏 3 部小说</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.totalChaptersRead >= 50 ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.totalChaptersRead >= 50 ? 'bg-green-500' : 'bg-slate-400'}`}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">章节大师</h4>
                    <p className="text-sm text-slate-600">总共阅读 50 个章节</p>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
