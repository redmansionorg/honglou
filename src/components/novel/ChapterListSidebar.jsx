import React, { useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function ChapterListSidebar({
  isOpen,
  onClose,
  novelTitle,
  allChapters,
  currentChapterNumber,
  currentChapterId,
  novelId
}) {
  const currentChapterRef = useRef(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentChapterRef.current) {
      // 【修复】延迟滚动，确保 DOM 完全渲染
      const timer = setTimeout(() => {
        if (currentChapterRef.current) {
          currentChapterRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 300); // 延迟 300ms，等待动画完成

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:max-w-xs flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl font-bold truncate">
            {novelTitle}
          </SheetTitle>
          <p className="text-sm text-slate-500">共 {allChapters.length} 章</p>
        </SheetHeader>
        
        <ScrollArea className="flex-1 py-4" ref={scrollAreaRef}>
          <div className="space-y-2">
            {allChapters.map((chapter) => (
              <SheetClose asChild key={chapter.id}>
                <Link
                  to={createPageUrl(`Reader?novelId=${novelId}&chapterId=${chapter.id}`)}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 
                    ${currentChapterId === chapter.id
                      ? "bg-amber-100 text-amber-700 font-semibold"
                      : "hover:bg-slate-100 text-slate-700"
                    }`}
                  ref={currentChapterId === chapter.id ? currentChapterRef : null}
                >
                  <span className="truncate">
                    第 {chapter.chapter_number} 章 {chapter.title}
                  </span>
                  {currentChapterId === chapter.id && (
                    <ChevronRight className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  )}
                </Link>
              </SheetClose>
            ))}
          </div>
        </ScrollArea>
        
        <div className="pt-4 border-t">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">关闭目录</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}