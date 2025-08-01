
import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
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
  };

  const loadLibrary = async (userId) => {
    setIsLoading(true);
    try {
      const [userProgress, allNovels] = await Promise.all([
        ReadingProgress.filter({ user_id: userId }),
        // 只加载已上架的小说
        Novel.filter({ is_published: true })
      ]);
      
      setProgress(userProgress);
      
      // Get novels that user has progress on and are published
      const novelIds = userProgress.map(p => p.novel_id);
      const userNovels = allNovels.filter(novel => novelIds.includes(novel.id));
      
      // Attach progress data to novels
      const novelsWithProgress = userNovels.map(novel => {
        const novelProgress = userProgress.find(p => p.novel_id === novel.id);
        return { ...novel, progress: novelProgress };
      });
      
      setNovels(novelsWithProgress);
    } catch (error) {
      console.error("Error loading library:", error);
    }
    setIsLoading(false);
  };

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
            <h2 className="text-2xl font-bold text-slate-800">Join NovelReads</h2>
            <p className="text-slate-600">
              Create your personal library and track your reading progress
            </p>
            <Button onClick={() => User.loginWithRedirect(window.location.href)} className="bg-amber-500 hover:bg-amber-600 text-amber-900">
              Sign In to Continue
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
            My Library
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Keep track of your reading journey and discover your next favorite story
          </p>
        </div>

        {/* Library Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{getNovelsByStatus('reading').length}</p>
              <p className="text-sm text-slate-600">Currently Reading</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{getNovelsByStatus('completed').length}</p>
              <p className="text-sm text-slate-600">Completed</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{getNovelsByStatus('plan-to-read').length}</p>
              <p className="text-sm text-slate-600">Plan to Read</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{getFavorites().length}</p>
              <p className="text-sm text-slate-600">Favorites</p>
            </CardContent>
          </Card>
        </div>

        {/* Library Content */}
        <Tabs defaultValue="reading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80">
            <TabsTrigger value="reading">Reading</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="plan-to-read">Plan to Read</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="dropped">Dropped</TabsTrigger>
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
                        <span className="text-sm text-slate-600">Progress</span>
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
                        Chapter {novel.progress.current_chapter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={BookOpen}
                title="No novels in progress"
                description="Start reading a novel to see it here"
                action={
                  <Link to={createPageUrl("Home")}>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-amber-900">
                      Discover Novels
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
                      Completed
                    </Badge>
                    <NovelCard novel={novel} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={CheckCircle2}
                title="No completed novels"
                description="Finished novels will appear here"
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
                title="No novels planned"
                description="Add novels to your reading list to see them here"
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
                title="No favorite novels"
                description="Mark novels as favorites to see them here"
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
                title="No dropped novels"
                description="Novels you've stopped reading will appear here"
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
