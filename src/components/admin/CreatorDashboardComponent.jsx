import React, { useState, useEffect } from "react";
import { User, Novel, Chapter } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Book, Edit, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Chapter Editor Component
function ChapterEditor({ novelId, chapter, onSave, onClose }) {
  const [title, setTitle] = useState(chapter?.title || "");
  const [chapterNumber, setChapterNumber] = useState(chapter?.chapter_number || 1);
  const [content, setContent] = useState(chapter?.content || "");
  const [isPublished, setIsPublished] = useState(chapter?.published || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const chapterData = {
      novel_id: novelId,
      title,
      chapter_number: parseInt(chapterNumber, 10),
      content,
      published: isPublished,
      word_count: content.split(/\s+/).filter(Boolean).length,
    };

    try {
      if (chapter?.id) {
        await Chapter.update(chapter.id, chapterData);
      } else {
        await Chapter.create(chapterData);
      }
      onSave();
    } catch (error) {
      console.error("Failed to save chapter", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{chapter?.id ? "编辑章节" : "创建新章节"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">标题</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chapterNumber" className="text-right">章节序号</Label>
            <Input id="chapterNumber" type="number" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3 min-h-[400px] h-full"
              placeholder="在此输入您的章节内容..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3 flex items-center space-x-2">
              <Checkbox id="published" checked={isPublished} onCheckedChange={setIsPublished} />
              <label htmlFor="published" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                发布此章节
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">取消</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CreatorDashboardComponent() {
  const [user, setUser] = useState(null);
  const [novels, setNovels] = useState([]);
  const [chapters, setChapters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNovelId, setSelectedNovelId] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);

  useEffect(() => {
    loadUserAndNovels();
  }, []);

  const loadUserAndNovels = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser) {
        const userNovels = await Novel.filter({ created_by: currentUser.email }, "-created_date");
        setNovels(userNovels);
      }
    } catch (error) {
      console.error("User not authenticated or failed to load novels", error);
    }
    setIsLoading(false);
  };

  const loadChapters = async (novelId) => {
    if (selectedNovelId === novelId) {
      setSelectedNovelId(null);
      return;
    }
    setSelectedNovelId(novelId);
    if (!chapters[novelId]) {
      const novelChapters = await Chapter.filter({ novel_id: novelId }, "chapter_number");
      setChapters(prev => ({ ...prev, [novelId]: novelChapters }));
    }
  };
  
  const handleChapterSave = async () => {
    setEditingChapter(null);
    const novelChapters = await Chapter.filter({ novel_id: selectedNovelId }, "chapter_number");
    setChapters(prev => ({ ...prev, [selectedNovelId]: novelChapters }));
  };

  const deleteChapter = async (chapterId) => {
    if (window.confirm("确定要删除这个章节吗？此操作无法撤销。")) {
      try {
        await Chapter.delete(chapterId);
        handleChapterSave();
      } catch(error) {
        console.error("Failed to delete chapter", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">创作者中心</h2>
        <Button className="bg-blue-600 hover:bg-blue-700"> 
          <PlusCircle className="mr-2 h-4 w-4" /> 
          创建新小说 
        </Button>
      </div>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">我的小说</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {novels.length > 0 ? novels.map(novel => (
            <div key={novel.id} className="border border-white/20 rounded-lg p-4 bg-white/5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-white">{novel.title}</h3>
                  <p className="text-sm text-white/60">作者: {novel.author}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => loadChapters(novel.id)}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  {selectedNovelId === novel.id ? "收起章节" : "管理章节"}
                </Button>
              </div>
              {selectedNovelId === novel.id && (
                <div className="mt-4 space-y-3 pl-4 border-l-2 border-white/20">
                  {chapters[novel.id]?.map(chap => (
                    <div key={chap.id} className="flex justify-between items-center p-2 rounded-md hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        {chap.published ? 
                          <Eye className="w-4 h-4 text-green-400"/> : 
                          <EyeOff className="w-4 h-4 text-white/40"/>
                        }
                        <span className="text-white">第 {chap.chapter_number} 章: {chap.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingChapter(chap)}
                          className="text-white/80 hover:text-white hover:bg-white/10"
                        >
                          <Edit className="w-4 h-4"/> 
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteChapter(chap.id)} 
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4"/> 
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white/10 text-white hover:bg-white/20" 
                    onClick={() => setEditingChapter({ novel_id: novel.id })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> 添加新章节
                  </Button>
                </div>
              )}
            </div>
          )) : (
            <p className="text-white/60">您还没有创建任何小说。</p>
          )}
        </CardContent>
      </Card>

      {editingChapter && (
        <ChapterEditor
          novelId={editingChapter.novel_id}
          chapter={editingChapter.id ? editingChapter : null}
          onSave={handleChapterSave}
          onClose={() => setEditingChapter(null)}
        />
      )}
    </div>
  );
}