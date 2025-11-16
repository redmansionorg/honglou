
import React, { useState, useEffect, useRef } from "react";
import { Novel } from "@/api/entities";
import { Chapter } from "@/api/entities";
import { ReadingProgress, User } from "@/api/entities";
import { Comment } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Settings, MessageCircle, List } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CommentModal from "@/components/comments/CommentModal";
import ShareButton from "@/components/share/ShareButton";
import { Badge } from "@/components/ui/badge";
import { CapacitorIntegration } from "@/components/capacitor/CapacitorIntegration";
import { initializeNativeApp } from "@/components/capacitor/NativeStyles";
import { getNovelChaptersForList } from "@/api/functions";
import { chapterListCacheManager } from "@/components/utils/ChapterListCacheManager";
import ChapterListSidebar from "@/components/novel/ChapterListSidebar";

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
  const [showChapterSidebar, setShowChapterSidebar] = useState(false);

  const paragraphRefs = useRef([]);
  const latestParagraphIndex = useRef(0);
  const hasUpdatedProgress = useRef(false);
  const userRef = useRef(null); 
  const progressRef = useRef(null); 
  const lastLoadedChapterId = useRef(null); // 【新增】跟踪最后加载的章节ID
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const novelId = urlParams.get('novelId');
  const chapterId = urlParams.get('chapterId');
  const paragraphIndexToScroll = parseInt(urlParams.get('paragraphIndex') || '0', 10);

  // 同步 user 和 progress 到 ref
  useEffect(() => {
    userRef.current = user;
    progressRef.current = progress;
  }, [user, progress]);

  // 初始化 Capacitor
  useEffect(() => {
    initializeNativeApp();
    CapacitorIntegration.initialize();

    const handleAppPause = () => {
      if (userRef.current && progressRef.current && latestParagraphIndex.current >= 0) {
        ReadingProgress.update(progressRef.current.id, {
          ...progressRef.current,
          last_read_paragraph_index: latestParagraphIndex.current,
          last_read_date: new Date().toISOString()
        }).catch(err => console.error("Failed to save progress on pause:", err));
      }
    };

    window.addEventListener('appPause', handleAppPause);
    return () => window.removeEventListener('appPause', handleAppPause);
  }, []); // 依赖数组变为空，因为内部使用了 ref

  // 章节切换时滚动到顶部并重置进度更新标记
  useEffect(() => {
    window.scrollTo(0, 0);
    hasUpdatedProgress.current = false; // 重置标记
  }, [chapterId]);

  // 【核心修复】统一的数据加载 - 只在 novelId 或 chapterId 变化时执行一次
  useEffect(() => {
    if (!novelId || !chapterId) return;

    // 【关键修复】如果是同一章节，不重复加载
    if (lastLoadedChapterId.current === chapterId) {
      console.log('⏭️ 跳过重复加载，章节ID相同:', chapterId);
      return;
    }

    let isMounted = true;

    const loadAllData = async () => {
      console.log('🔄 开始加载数据...', { novelId, chapterId });
      setIsLoading(true);
      
      // 标记正在加载这个章节
      lastLoadedChapterId.current = chapterId;
      
      try {
        // 1. 并行加载小说、当前章节内容和用户信息
        const [novelResults, chapterResults, currentUser] = await Promise.all([
          Novel.filter({ id: novelId }),
          Chapter.filter({ id: chapterId }),
          User.me().catch(() => null)
        ]);

        if (!isMounted) return;

        const novelData = novelResults.length > 0 ? novelResults[0] : null;
        const chapterData = chapterResults.length > 0 ? chapterResults[0] : null;

        setNovel(novelData);
        setChapter(chapterData);
        setUser(currentUser);

        // 2. 如果有用户，加载阅读进度
        let currentProgress = null;
        if (currentUser && novelId) {
          const userProgressResults = await ReadingProgress.filter({
            user_id: currentUser.id,
            novel_id: novelId
          });
          if (isMounted && userProgressResults.length > 0) {
            currentProgress = userProgressResults[0];
            setProgress(currentProgress);
          }
        }

        // 3. 获取章节列表（使用缓存）
        let novelChapters = [];
        const { chapters: cachedChapters, expired } = chapterListCacheManager.getChapters(novelId);
        
        if (cachedChapters && !expired) {
          novelChapters = cachedChapters;
          console.log('✅ 使用缓存的章节列表');
        } else {
          const chapterListResponse = await getNovelChaptersForList({ novel_id: novelId });
          if (chapterListResponse.data.success) {
            novelChapters = chapterListResponse.data.chapters;
            chapterListCacheManager.setChapters(novelId, novelChapters);
            console.log('✅ 从后端加载章节列表');
          } else {
            console.error("Failed to fetch chapter list from backend:", chapterListResponse.data.error);
          }
        }
        if (isMounted) setAllChapters(novelChapters);

        // 4. 加载评论数据
        if (chapterId) {
          const comments = await Comment.filter({ target_id: chapterId });
          if (isMounted) {
            setChapterCommentCount(comments.length);
            const commentCounts = {};
            comments.forEach(comment => {
              if (comment.target_type === 'paragraph' && comment.paragraph_index !== undefined) {
                commentCounts[comment.paragraph_index] = (commentCounts[comment.paragraph_index] || 0) + 1;
              }
            });
            setParagraphComments(commentCounts);
          }
        }

        // 5. 【关键修复】只在首次加载且章节号不同时更新进度
        if (isMounted && currentUser && chapterData && novelChapters.length > 0 && currentProgress && !hasUpdatedProgress.current) {
          if (chapterData.chapter_number !== currentProgress.current_chapter) {
            const progressPercentage = Math.round((chapterData.chapter_number / novelChapters.length) * 100);
            
            console.log('📝 更新阅读进度', {
              from: currentProgress.current_chapter,
              to: chapterData.chapter_number
            });

            try {
              await ReadingProgress.update(currentProgress.id, {
                ...currentProgress,
                current_chapter: chapterData.chapter_number,
                last_read_paragraph_index: 0,
                progress_percentage: progressPercentage,
                last_read_date: new Date().toISOString(),
                reading_status: progressPercentage === 100 ? "completed" : "reading"
              });
              
              hasUpdatedProgress.current = true; // 标记已更新
              
              if (isMounted) {
                setProgress({
                  ...currentProgress,
                  current_chapter: chapterData.chapter_number,
                  last_read_paragraph_index: 0,
                  progress_percentage: progressPercentage,
                  reading_status: progressPercentage === 100 ? "completed" : "reading"
                });
              }
            } catch (error) {
              console.error("Error updating progress:", error);
            }
          }
        }

        console.log('✅ 数据加载完成');

      } catch (error) {
        console.error("❌ Error loading reader data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAllData();

    return () => {
      isMounted = false;
    };
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

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 滚动监听（记录当前段落）
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

  // 【修复】页面卸载时保存阅读进度 - 使用 ref 避免依赖警告
  useEffect(() => {
    return () => {
      // 只在组件真正卸载时保存，而不是每次重新渲染
      if (userRef.current && progressRef.current && latestParagraphIndex.current >= 0) {
        console.log('💾 页面卸载，保存进度');
        ReadingProgress.update(progressRef.current.id, {
          ...progressRef.current,
          last_read_paragraph_index: latestParagraphIndex.current,
          last_read_date: new Date().toISOString()
        }).catch(err => console.error("Failed to save progress on exit:", err));
      }
    };
  }, []); // 空依赖数组，因为内部使用了 ref

  // 上一章
  const goToPrevious = () => {
    if (!chapter || !allChapters.length || chapter.chapter_number <= 1) return;
    
    const prevChapter = allChapters.find(c => c.chapter_number === chapter.chapter_number - 1);
    if (prevChapter) {
      // 清除缓存标记，允许加载新章节
      lastLoadedChapterId.current = null;
      navigate(createPageUrl(`Reader?novelId=${novelId}&chapterId=${prevChapter.id}`));
    }
  };

  // 下一章
  const goToNext = () => {
    if (!chapter || !allChapters.length || chapter.chapter_number >= allChapters.length) return;
    
    const nextChapter = allChapters.find(c => c.chapter_number === chapter.chapter_number + 1);
    if (nextChapter) {
      // 清除缓存标记，允许加载新章节
      lastLoadedChapterId.current = null;
      navigate(createPageUrl(`Reader?novelId=${novelId}&chapterId=${nextChapter.id}`));
    }
  };

  // 段落评论
  const handleParagraphComment = (paragraphIndex) => {
    setCommentTarget({ type: 'paragraph', index: paragraphIndex });
    setShowComments(true);
  };

  // 章节评论
  const handleChapterComment = () => {
    setCommentTarget({ type: 'chapter', index: null });
    setShowComments(true);
  };

  // 关闭评论弹窗并重新加载评论
  const handleCommentsClose = async () => {
    setShowComments(false);
    setCommentTarget(null);
    
    if (chapterId) {
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
        console.error("Error reloading comments:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-12 h-12 text-amber-600 mx-auto animate-pulse" />
          <p className="text-slate-600">加载章节中...</p>
        </div>
      </div>
    );
  }

  if (!novel || !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">章节未找到</h2>
          <Link to={createPageUrl("Home")}>
            <Button variant="outline">返回首页</Button>
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
              {novel.author && (
                <p className="text-sm text-slate-600 truncate max-w-xs">
                  作者: {novel.author}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChapterSidebar(true)}
              className="flex items-center gap-2"
              title="章节目录"
              disabled={allChapters.length === 0}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">目录</span>
            </Button>

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
                  字体大小: {fontSize}px
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans-serif' : 'serif')}>
                  字体: {fontFamily === 'serif' ? '衬线字体' : '无衬线字体'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLineHeight(lineHeight === 1.5 ? 1.7 : lineHeight === 1.7 ? 2 : 1.5)}>
                  行高: {lineHeight}
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white shadow-lg border-slate-200/60">
          <CardContent className="p-8 md:p-12">
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

        <div className="flex items-center justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={goToPrevious}
            disabled={!chapter || chapter.chapter_number <= 1}
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
            disabled={!chapter || chapter.chapter_number >= allChapters.length}
            className="flex items-center gap-2"
          >
            下一章
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

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
      
      {novel && chapter && allChapters.length > 0 && (
        <ChapterListSidebar
          isOpen={showChapterSidebar}
          onClose={() => setShowChapterSidebar(false)}
          novelTitle={novel.title}
          allChapters={allChapters}
          currentChapterNumber={chapter.chapter_number}
          currentChapterId={chapter.id}
          novelId={novelId}
        />
      )}

      {CapacitorIntegration.isNative() && (
        <div className="pb-safe-bottom"></div>
      )}
    </div>
  );
}
