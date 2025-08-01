
import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
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
  };

  // Accept userCreatedDate as a parameter to ensure joinDate is correctly set from the fetched user data.
  const loadUserStats = async (userId, userCreatedDate) => {
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
  };

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
            <h2 className="text-2xl font-bold text-slate-800">Join NovelReads</h2>
            <p className="text-slate-600">
              Create your profile and start your reading journey
            </p>
            <Button onClick={() => User.loginWithRedirect(window.location.href)} className="bg-amber-500 hover:bg-amber-600 text-amber-900">
              Sign In
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
                  {user.full_name || 'Reader'}
                </h1>
                <p className="text-slate-600 mb-4">{user.email}</p>

                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    {user.role === 'admin' ? 'Admin' : 'Reader'}
                  </Badge>
                  {stats.joinDate && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {format(new Date(stats.joinDate), "MMMM yyyy")}</span>
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
                Sign Out
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
              <p className="text-sm text-slate-600">Novels in Library</p>
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
              <p className="text-sm text-slate-600">Completed</p>
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
              <p className="text-sm text-slate-600">Favorites</p>
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
              <p className="text-sm text-slate-600">Chapters Read</p>
            </CardContent>
          </Card>
        </div>

        {/* Reading Achievements */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Reading Achievements
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
                    <h4 className="font-semibold text-slate-800">First Steps</h4>
                    <p className="text-sm text-slate-600">Add your first novel</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.completedNovels >= 1 ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.completedNovels >= 1 ? 'bg-green-500' : 'bg-slate-400'}`}>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Completionist</h4>
                    <p className="text-sm text-slate-600">Finish your first novel</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.favoritesCount >= 3 ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.favoritesCount >= 3 ? 'bg-green-500' : 'bg-slate-400'}`}>
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Favorites Collector</h4>
                    <p className="text-sm text-slate-600">Mark 3 novels as favorites</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.totalChaptersRead >= 50 ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.totalChaptersRead >= 50 ? 'bg-green-500' : 'bg-slate-400'}`}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Chapter Master</h4>
                    <p className="text-sm text-slate-600">Read 50 chapters total</p>
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
