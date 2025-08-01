
import React, { useState, useEffect } from "react";
import { Novel } from "@/api/entities";
import { Chapter } from "@/api/entities";
import { ReadingProgress, User } from "@/api/entities";
import { Comment } from "@/api/entities"; // Added import for Comment
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Star, Eye, Heart, Clock, ArrowLeft, Play, MessageCircle, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CommentModal from "../components/comments/CommentModal";
import ShareButton from "../components/share/ShareButton";
import RatingComponent from "../components/rating/RatingComponent";

export default function NovelPage() {
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [novelCommentCount, setNovelCommentCount] = useState(0); // 新增状态
  const [novelRating, setNovelRating] = useState(0); // 新增：小说评分状态
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const novelId = urlParams.get('id');

  useEffect(() => {
    if (novelId) {
      loadNovelData();
      loadUser();
    }
  }, [novelId]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // 【关键修复】当用户切换回此页面时，自动重新加载阅读进度
    const reloadProgressOnVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUser();
      }
    };

    document.addEventListener('visibilitychange', reloadProgressOnVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', reloadProgressOnVisibilityChange);
    };
  }, [novelId]); // 依赖 novelId 以确保 loadUser 在正确的上下文中被调用

  const loadUser = async () => {
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
          setProgress(null); // Explicitly set to null if no progress found
        }
      } else {
        setProgress(null); // Clear progress if no user or novelId
      }
    } catch (error) {
      console.log("User not authenticated", error);
      setUser(null); // Ensure user is null if not authenticated
      setProgress(null); // Clear progress if user not authenticated
    }
  };

  const loadNovelData = async () => {
    setIsLoading(true);
    try {
      // 加载所有小说，但检查是否已上架
      const allNovels = await Novel.list();
      const novelData = allNovels.find(n => n.id === novelId);

      if (novelData) {
        // 检查小说是否已上架，如果未上架则不显示
        // novelData.is_published 默认为 true 或 undefined（旧数据），需要显式检查 false
        if (novelData.is_published === false) {
          setNovel(null);
          setIsLoading(false);
          return;
        }

        // 阅读数增加逻辑保持不变
        let updatedNovelData = { ...novelData };
        if (updatedNovelData.reads_count !== undefined) {
          const newReadsCount = (updatedNovelData.reads_count || 0) + 1;
          await Novel.update(novelId, { reads_count: newReadsCount });
          updatedNovelData.reads_count = newReadsCount;
        }
        setNovel(updatedNovelData);
        setNovelRating(updatedNovelData.rating || 0); // 设置评分状态

        // 【关键修复】使用与 Reader 页面相同的 Chapter.filter 方法，这是最可靠的方案
        const [novelChapters, comments] = await Promise.all([
          Chapter.filter({ novel_id: novelId, published: true }, "chapter_number", 5000), // 直接筛选并排序
          Comment.filter({ target_type: 'novel', target_id: novelId })
        ]);

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
  };

  // 处理评分更新的回调
  const handleRatingUpdate = (newRating, ratingCount) => {
    setNovelRating(newRating);
    // 同时更新 novel 状态中的评分
    setNovel(prev => ({ ...prev, rating: newRating }));
  };

  const handleStartReading = async () => {
    if (chapters.length === 0) return;

    let chapterToReadNumber = 1;

    if (user) {
      // 确保在操作前获取最新的进度
      const userProgress = await ReadingProgress.filter({ user_id: user.id, novel_id: novelId });
      let currentProgress = userProgress.length > 0 ? userProgress[0] : null;

      if (currentProgress) {
        chapterToReadNumber = currentProgress.current_chapter || 1;
      } else {
        // 如果没有进度，为用户创建
        const newProgress = await ReadingProgress.create({
          user_id: user.id,
          novel_id: novelId,
          current_chapter: 1,
          progress_percentage: 0,
          last_read_date: new Date().toISOString(),
          reading_status: "reading"
        });
        setProgress(newProgress); // 更新本地状态
        chapterToReadNumber = 1;
      }
    }

    const targetChapter = chapters.find(c => c.chapter_number === chapterToReadNumber);
    if (targetChapter) {
      // 直接导航，不附加任何位置参数
      navigate(createPageUrl(`Reader?novelId=${novelId}&chapterId=${targetChapter.id}`));
    } else if (chapters.length > 0) {
      // 如果找不到目标章节（例如数据错误），则导航到第一章
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
              <p className="text-xl text-slate-600">作者：{novel.author}</p>
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
              {progress && user && ( // Only show progress if user is logged in
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

        {/* Rating Component - 在章节列表之前添加 */}
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
                      {/* 清理后的当前章节显示逻辑 */}
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

      {/* Comment Modal - Moved to the correct position */}
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
