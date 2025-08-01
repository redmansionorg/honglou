import React, { useState, useEffect, useRef } from "react";
import { Novel } from "@/api/entities";
import { Chapter } from "@/api/entities";
import { ReadingProgress, User } from "@/api/entities";
import { Comment } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Settings, MessageCircle, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CommentModal from "../components/comments/CommentModal";
import ShareButton from "../components/share/ShareButton";
import { Badge } from "@/components/ui/badge";
import { CapacitorIntegration } from "../components/capacitor/CapacitorIntegration";
import { initializeNativeApp } from "../components/capacitor/NativeStyles";

// 简单的throttle函数
function useThrottle(callback, delay) {
  const lastRan = useRef(Date.now());
  
  return (...args) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    }
  };
}

export default function Reader() {
  const [novel, setNovel] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [allChapters, setAllChapters] = useState([]);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('serif');
  const [lineHeight, setLineHeight] = useState(1.7);
  const [showComments, setShowComments] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [paragraphComments, setParagraphComments] = useState({});
  const [chapterCommentCount, setChapterCommentCount] = useState(0);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);

  const paragraphRefs = useRef([]);
  const latestParagraphIndex = useRef(0);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const novelId = urlParams.get('novelId');
  const chapterId = urlParams.get('chapterId');
  const paragraphIndexToScroll = parseInt(urlParams.get('paragraphIndex') || '0', 10);

  // 初始化原生应用
  useEffect(() => {
    initializeNativeApp();
    CapacitorIntegration.initialize();

    // 监听应用生命周期事件
    const handleAppPause = () => {
      // 应用暂停时保存阅读进度
      if (user && progress && latestParagraphIndex.current >= 0) {
        ReadingProgress.update(progress.id, {
          ...progress,
          last_read_paragraph_index: latestParagraphIndex.current,
          last_read_date: new Date().toISOString()
        }).catch(err => console.error("Failed to save progress on pause:", err));
      }
    };

    window.addEventListener('appPause', handleAppPause);
    return () => window.removeEventListener('appPause', handleAppPause);
  }, []);

  // 【核心滚动逻辑】章节切换时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  useEffect(() => {
    if (novelId && chapterId) {
      loadReaderData();
      loadUser();
    }
  }, [novelId, chapterId]);

  // 滚动到指定段落
  useEffect(() => {
    if (chapter && paragraphRefs.current.length > 0 && paragraphIndexToScroll > 0) {
      const targetElement = paragraphRefs.current[paragraphIndexToScroll];
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [chapter, paragraphIndexToScroll]);

  useEffect(() => {
    if (user && chapter && novel && progress) {
      if (chapter.chapter_number !== progress.current_chapter) {
        updateProgress(chapter.chapter_number);
      }
    }
  }, [user, chapter, novel, progress]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 滚动时更新当前阅读位置的逻辑
  const handleScroll = useThrottle(() => {
    let topParagraphIndex = 0;
    const viewportTop = window.scrollY;

    for (let i = 0; i < paragraphRefs.current.length; i++) {
      const p = paragraphRefs.current[i];
      if (p && p.offsetTop <= viewportTop) {
        topParagraphIndex = i;
      } else {
        break;
      }
    }
    
    if (topParagraphIndex !== latestParagraphIndex.current) {
        setCurrentParagraphIndex(topParagraphIndex);
        latestParagraphIndex.current = topParagraphIndex;
    }
  }, 200);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // 【核心修改】在组件即将卸载时保存最终的阅读进度
  useEffect(() => {
    return () => {
      if (user && progress && latestParagraphIndex.current >= 0) {
        ReadingProgress.update(progress.id, {
          ...progress,
          last_read_paragraph_index: latestParagraphIndex.current,
          last_read_date: new Date().toISOString()
        }).catch(err => console.error("Failed to save progress on exit:", err));
      }
    };
  }, [user, progress]);

  const loadCommentData = async () => {
    if (!chapterId) return;
    try {
      const comments = await Comment.filter({ target_id: chapterId });
      setChapterCommentCount(comments.length);
      const commentCounts = {};
      comments.forEach(comment => {
        if (comment.target_type === 'paragraph' && comment.paragraph_index !== undefined) {
          commentCounts[comment.paragraph_index] = (commentCounts[comment.paragraph_index] || 0) + 1;
        }
      });
      setParagraphComments(commentCounts);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

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
        }
      }
    } catch (error) {
      console.log("User not authenticated");
      setUser(null);
      setProgress(null);
    }
  };

  const loadReaderData = async () => {
    setIsLoading(true);
    try {
      const allNovels = await Novel.list();
      const novelData = allNovels.find(n => n.id === novelId);
      if (novelData) {
        setNovel(novelData);
        const [novelChapters, chapterData] = await Promise.all([
          Chapter.filter({ novel_id: novelId, published: true }, "chapter_number", 5000),
          Chapter.list().then(chapters => chapters.find(c => c.id === chapterId))
        ]);
        setAllChapters(novelChapters);
        setChapter(chapterData || null);
      }
      await loadCommentData();
    } catch (error) {
      console.error("Error loading novel:", error);
    }
    setIsLoading(false);
  };

  const updateProgress = async (chapterNumber) => {
    if (!user || !novelId || !allChapters.length) return;
    const progressPercentage = Math.round((chapterNumber / allChapters.length) * 100);
    const newParagraphIndex = chapterNumber > (progress?.current_chapter || 0) ? 0 : (latestParagraphIndex.current || 0);

    try {
      if (!progress) {
        const newProgress = await ReadingProgress.create({
          user_id: user.id,
          novel_id: novelId,
          current_chapter: chapterNumber,
          last_read_paragraph_index: newParagraphIndex,
          progress_percentage: progressPercentage,
          last_read_date: new Date().toISOString(),
          reading_status: progressPercentage === 100 ? "completed" : "reading"
        });
        setProgress(newProgress);
      } else {
        await ReadingProgress.update(progress.id, {
          ...progress,
          current_chapter: chapterNumber,
          last_read_paragraph_index: newParagraphIndex,
          progress_percentage: progressPercentage,
          last_read_date: new Date().toISOString(),
          reading_status: progressPercentage === 100 ? "completed" : "reading"
        });
        setProgress(prev => ({
          ...prev,
          current_chapter: chapterNumber,
          last_read_paragraph_index: newParagraphIndex,
          progress_percentage: progressPercentage,
          reading_status: progressPercentage === 100 ? "completed" : "reading"
        }));
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const navigateToChapter = (targetChapterNumber) => {
    const targetChapter = allChapters.find(c => c.chapter_number === targetChapterNumber);
    if (targetChapter && novelId) {
      navigate(createPageUrl(`Reader?novelId=${novelId}&chapterId=${targetChapter.id}`));
    }
  };

  const goToPrevious = () => {
    if (chapter && chapter.chapter_number > 1) {
      navigateToChapter(chapter.chapter_number - 1);
    }
  };

  const goToNext = () => {
    if (chapter && chapter.chapter_number < allChapters.length) {
      navigateToChapter(chapter.chapter_number + 1);
    }
  };

  const handleParagraphComment = (paragraphIndex) => {
    setCommentTarget({ type: 'paragraph', index: paragraphIndex });
    setShowComments(true);
  };

  const handleChapterComment = () => {
    setCommentTarget({ type: 'chapter', index: null });
    setShowComments(true);
  };

  const handleCommentsClose = () => {
    setShowComments(false);
    setCommentTarget(null);
    loadCommentData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-12 h-12 text-amber-600 mx-auto animate-pulse" />
          <p className="text-slate-600">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (!novel || !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Chapter not found</h2>
          <Link to={createPageUrl("Home")}>
            <Button variant="outline">Go back to home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentDisplayedProgress = allChapters.length > 0 
    ? Math.round((chapter.chapter_number / allChapters.length) * 100) 
    : 0;

  return (
    <div className={`min-h-screen bg-gradient-to-b from-amber-50 to-white ${
      CapacitorIntegration.isNative() ? 'native-app' : ''
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-4 py-3 ${
        CapacitorIntegration.isNative() ? 'reader-header' : ''
      }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl(`Novel?id=${novelId}`)}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="hidden md:block">
              <h1 className="font-semibold text-slate-800 truncate max-w-xs">
                {novel.title}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChapterComment}
              className="flex items-center gap-2"
              title="章节评论"
            >
              <MessageCircle className="w-4 h-4" />
              {chapterCommentCount > 0 && (
                <Badge variant="secondary" className="px-1.5 text-amber-800">
                  {chapterCommentCount}
                </Badge>
              )}
            </Button>
            
            <ShareButton
              url={window.location.href}
              title={`${novel.title} - ${chapter.title}`}
              description={`正在阅读第${chapter.chapter_number}章`}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setFontSize(fontSize === 16 ? 18 : fontSize === 18 ? 20 : 16)}>
                  Font Size: {fontSize}px
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans-serif' : 'serif')}>
                  Font: {fontFamily === 'serif' ? 'Serif' : 'Sans-serif'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLineHeight(lineHeight === 1.5 ? 1.7 : lineHeight === 1.7 ? 2 : 1.5)}>
                  Line Height: {lineHeight}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto mt-3">
          <div className="flex items-center gap-3">
            <Progress value={currentDisplayedProgress} className="flex-1 h-2" />
            <span className="text-sm text-slate-500 min-w-fit">{currentDisplayedProgress}%</span>
          </div>
        </div>
      </header>

      {/* Reader Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white shadow-lg border-slate-200/60">
          <CardContent className="p-8 md:p-12">
            {/* Chapter Header */}
            <div className="text-center space-y-4 mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                {chapter.title}
              </h1>
              <div className="flex items-center justify-center gap-4 text-slate-500">
                <span>第 {chapter.chapter_number} 章</span>
                {chapter.word_count && (
                  <>
                    <span>•</span>
                    <span>{chapter.word_count.toLocaleString()} 字</span>
                  </>
                )}
              </div>
            </div>

            {/* Chapter Content with Paragraph Comments */}
            <div 
              className="prose max-w-none text-slate-800 leading-relaxed relative reading-content"
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif',
                lineHeight: lineHeight
              }}
            >
              {chapter.content.split('\n').map((paragraph, index) => {
                const commentCount = paragraphComments[index] || 0;
                
                return (
                  <p 
                    key={index} 
                    ref={el => paragraphRefs.current[index] = el}
                    className="group relative text-justify mb-4"
                    id={`paragraph-${index}`}
                  >
                    {paragraph.trim() ? paragraph : <span>&nbsp;</span>}
                    {paragraph.trim() && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 h-8 px-2 gap-1 transition-all duration-200 rounded-full ${
                          commentCount > 0 
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 opacity-100' 
                            : 'bg-amber-50 text-amber-600 hover:bg-amber-100 opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={() => handleParagraphComment(index)}
                        title={commentCount > 0 ? `${commentCount} 条评论` : "添加段落评论"}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {commentCount > 0 && (
                          <span className="text-xs font-medium min-w-[16px] text-center">
                            {commentCount}
                          </span>
                        )}
                      </Button>
                    )}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={goToPrevious}
            disabled={chapter.chapter_number <= 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            上一章
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-slate-500">
              第 {chapter.chapter_number} 章 / 共 {allChapters.length} 章
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={goToNext}
            disabled={chapter.chapter_number >= allChapters.length}
            className="flex items-center gap-2"
          >
            下一章
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Comment Modal */}
        <CommentModal
          isOpen={showComments}
          onClose={handleCommentsClose}
          targetType={commentTarget?.type === 'paragraph' ? 'paragraph' : 'chapter'}
          targetId={chapterId || ''}
          targetTitle={commentTarget?.type === 'paragraph' ? `第${(commentTarget.index || 0) + 1}段` : chapter?.title || ''}
          paragraphIndex={commentTarget?.type === 'paragraph' ? commentTarget.index : null}
          isMobile={isMobile}
        />
      </main>
      
      {/* 原生应用底部安全区域 */}
      {CapacitorIntegration.isNative() && (
        <div className="pb-safe-bottom"></div>
      )}
    </div>
  );
}