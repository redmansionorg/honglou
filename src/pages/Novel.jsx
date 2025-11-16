import React, { useState, useEffect, useCallback } from "react";
import { Novel } from "@/api/entities";
import { ReadingProgress, User } from "@/api/entities";
import { Comment } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Star, Eye, Heart, Clock, Play, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CommentModal from "@/components/comments/CommentModal";
import ShareButton from "@/components/share/ShareButton";
import RatingComponent from "@/components/rating/RatingComponent";
import { getNovelChaptersForList } from "@/api/functions";
import { chapterListCacheManager } from "@/components/utils/ChapterListCacheManager";

export default function NovelPage() {
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [novelCommentCount, setNovelCommentCount] = useState(0);
  const [novelRating, setNovelRating] = useState(0);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const novelId = urlParams.get('id');

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser && novelId) {
        const userProgress = await ReadingProgress.filter({
          user_id: currentUser.id,
          novel_id: novelId
        });
        if (userProgress.length > 0) {
          setProgress(userProgress[0]);
        } else {
          setProgress(null);
        }
      } else {
        setProgress(null);
      }
    } catch (error) {
      console.log("User not authenticated", error);
      setUser(null);
      setProgress(null);
    }
  }, [novelId]);

  const loadNovelData = useCallback(async () => {
    setIsLoading(true);
    try {
      const novelDataResults = await Novel.filter({ id: novelId });
      const novelData = novelDataResults.length > 0 ? novelDataResults[0] : null;

      if (novelData) {
        if (novelData.is_published === false) {
          setNovel(null);
          setIsLoading(false);
          return;
        }

        let updatedNovelData = { ...novelData };
        if (updatedNovelData.reads_count !== undefined) {
          const newReadsCount = (updatedNovelData.reads_count || 0) + 1;
          Novel.update(novelId, { reads_count: newReadsCount }).catch(err =>
            console.error("Failed to update reads count:", err)
          );
          updatedNovelData.reads_count = newReadsCount;
        }
        setNovel(updatedNovelData);
        setNovelRating(updatedNovelData.rating || 0);

        // 【关键优化】使用章节列表缓存和后端函数
        let novelChapters = [];
        const { chapters: cachedChapters, expired } = chapterListCacheManager.getChapters(novelId);

        if (cachedChapters && !expired) {
          novelChapters = cachedChapters;
        } else {
          const chapterResponse = await getNovelChaptersForList({ novel_id: novelId });
          if (chapterResponse.data.success) {
            novelChapters = chapterResponse.data.chapters;
            chapterListCacheManager.setChapters(novelId, novelChapters);
          } else {
            console.error("Failed to fetch chapters from backend:", chapterResponse.data.error);
          }
        }
        
        const comments = await Comment.filter({ target_type: 'novel', target_id: novelId });

        setChapters(novelChapters);
        setNovelCommentCount(comments.length);

      } else {
        setChapters([]);
        setNovelCommentCount(0);
      }

    } catch (error) {
      console.error("Error loading novel:", error);
      setNovelCommentCount(0);
    }
    setIsLoading(false);
  }, [novelId]);

  useEffect(() => {
    if (novelId) {
      loadNovelData();
      loadUser();
    }
  }, [novelId, loadNovelData, loadUser]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.scrollTo(0, 0);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const reloadProgressOnVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUser();
      }
    };

    document.addEventListener('visibilitychange', reloadProgressOnVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', reloadProgressOnVisibilityChange);
    };
  }, [loadUser]);

  const handleRatingUpdate = (newRating, ratingCount) => {
    setNovelRating(newRating);
    setNovel(prev => ({ ...prev, rating: newRating }));
  };

  const handleStartReading = async () => {
    if (chapters.length === 0) return;

    let chapterToReadNumber = 1;

    if (user) {
      const userProgress = await ReadingProgress.filter({ user_id: user.id, novel_id: novelId });
      let currentProgress = userProgress.length > 0 ? userProgress[0] : null;

      if (currentProgress) {
        chapterToReadNumber = currentProgress.current_chapter || 1;
      } else {
        const newProgress = await ReadingProgress.create({
          user_id: user.id,
          novel_id: novelId,
          current_chapter: 1,
          progress_percentage: 0,
          last_read_date: new Date().toISOString(),
          reading_status: "reading"
        });
        setProgress(newProgress);
        chapterToReadNumber = 1;
      }
    }

    const targetChapter = chapters.find(c => c.chapter_number === chapterToReadNumber);
    if (targetChapter) {
      navigate(createPageUrl(`Reader?novelId=${novelId}&chapterId=${targetChapter.id}`));
    } else if (chapters.length > 0) {
      navigate(createPageUrl(`Reader?novelId=${novelId}&chapterId=${chapters[0].id}`));
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      await User.loginWithRedirect(window.location.href);
      return;
    }

    if (progress) {
      await ReadingProgress.update(progress.id, {
        ...progress,
        is_favorite: !progress.is_favorite
      });
      setProgress({ ...progress, is_favorite: !progress.is_favorite });
    } else {
      const newProgress = await ReadingProgress.create({
        user_id: user.id,
        novel_id: novelId,
        current_chapter: 1,
        progress_percentage: 0,
        last_read_date: new Date().toISOString(),
        reading_status: "plan-to-read",
        is_favorite: true
      });
      setProgress(newProgress);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="aspect-[3/4] bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="md:col-span-2 space-y-4">
              <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-32 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">小说未找到或暂未上架</h2>
          <p className="text-slate-600 mb-4">请检查链接是否正确，或该小说可能暂时下架</p>
          <Link to={createPageUrl("Home")}>
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Novel Header */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden shadow-xl">
              {novel.cover_image ? (
                <img
                  src={novel.cover_image}
                  alt={novel.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                  <BookOpen className="w-16 h-16 text-amber-600" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-amber-900 font-semibold"
                onClick={handleStartReading}
                disabled={chapters.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                {chapters.length === 0 ? '暂无章节' : (progress?.current_chapter > 1 && user ? '继续阅读' : '开始阅读')}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={toggleFavorite}
                >
                  <Heart className={`w-4 h-4 ${progress?.is_favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
                  收藏
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowComments(true)}
                >
                  <MessageCircle className="w-4 h-4" />
                  评论
                  {novelCommentCount > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 bg-amber-100 text-amber-800">
                      {novelCommentCount}
                    </Badge>
                  )}
                </Button>
              </div>

              <ShareButton
                url={window.location.href}
                title={novel.title}
                description={novel.description}
                className="w-full"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  {novel.genre}
                </Badge>
                <Badge variant="outline" className={novel.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}>
                  {novel.status === 'completed' ? '已完结' : novel.status === 'ongoing' ? '连载中' : '暂停'}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight">
                {novel.title}
              </h1>

              <p className="text-xl text-slate-600">
                作者：
                {novel.bc_author_address ? (
                  <Link
                    to={createPageUrl(`AuthorPage?address=${novel.bc_author_address}`)}
                    className="text-amber-600 hover:text-amber-700 hover:underline font-medium ml-1 transition-colors duration-200"
                  >
                    {novel.author}
                  </Link>
                ) : (
                  <span className="ml-1">{novel.author}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-6 text-slate-600 flex-wrap">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{novel.reads_count || 0} 阅读</span>
              </div>
              {novel.rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{novel.rating.toFixed(1)} 评分</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{chapters.length} 章节</span>
              </div>
              {progress && user && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{Math.round(progress.progress_percentage)}% 完成</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">简介</h3>
              <p className="text-slate-700 leading-relaxed text-justify">
                {novel.description}
              </p>
            </div>

            {novel.tags && novel.tags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {novel.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-slate-50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <RatingComponent
          novelId={novelId}
          currentRating={novelRating}
          onRatingUpdate={handleRatingUpdate}
        />

        {/* Chapters List */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">章节目录</h2>
              <Badge variant="outline">{chapters.length} 章节</Badge>
            </div>

            {chapters.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">暂无章节</h3>
                <p className="text-slate-500">作者还未发布章节内容</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.map((chapter, index) => (
                  <div key={chapter.id}>
                    <Link
                      to={createPageUrl(`Reader?novelId=${novelId}&chapterId=${chapter.id}`)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-amber-50 transition-colors duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors duration-200">
                          {chapter.chapter_number}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800 group-hover:text-amber-700 transition-colors duration-200">
                            {chapter.title}
                          </h4>
                          {chapter.word_count && (
                            <p className="text-sm text-slate-500">{chapter.word_count.toLocaleString()} 字</p>
                          )}
                        </div>
                      </div>
                      {progress?.current_chapter && parseInt(progress.current_chapter) === parseInt(chapter.chapter_number) && user && (
                        <Badge className="bg-amber-100 text-amber-700">
                          当前
                        </Badge>
                      )}
                    </Link>
                    {index < chapters.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        targetType="novel"
        targetId={novelId}
        targetTitle={novel?.title}
        isMobile={isMobile}
      />
    </div>
  );
}