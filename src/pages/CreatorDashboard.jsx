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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Chapter Editor Component inside the page for simplicity
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

export default function CreatorDashboard() {
  const [user, setUser] = useState(null);
  const [novels, setNovels] = useState([]);
  const [chapters, setChapters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNovelId, setSelectedNovelId] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null); // Can be chapter object for edit, or true for new

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
      setSelectedNovelId(null); // Toggle off
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
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent className="space-y-4">
            <Book className="w-16 h-16 text-amber-600 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">访问创作者中心</h2>
            <p className="text-slate-600">请先登录以管理您的小说。</p>
            <Button onClick={() => User.loginWithRedirect(window.location.href)} className="bg-amber-500 hover:bg-amber-600 text-amber-900">
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">创作者中心</h1>
          <Button> <PlusCircle className="mr-2 h-4 w-4" /> 创建新小说 </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>我的小说</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {novels.length > 0 ? novels.map(novel => (
              <div key={novel.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">{novel.title}</h3>
                    <p className="text-sm text-slate-500">作者: {novel.author}</p>
                  </div>
                  <Button variant="outline" onClick={() => loadChapters(novel.id)}>
                    {selectedNovelId === novel.id ? "收起章节" : "管理章节"}
                  </Button>
                </div>
                {selectedNovelId === novel.id && (
                  <div className="mt-4 space-y-3 pl-4 border-l-2">
                    {chapters[novel.id]?.map(chap => (
                      <div key={chap.id} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          {chap.published ? <Eye className="w-4 h-4 text-green-500"/> : <EyeOff className="w-4 h-4 text-slate-400"/>}
                          <span>第 {chap.chapter_number} 章: {chap.title}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingChapter(chap)}><Edit className="w-4 h-4"/> </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteChapter(chap.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4"/> </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="secondary" className="w-full" onClick={() => setEditingChapter({ novel_id: novel.id })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> 添加新章节
                    </Button>
                  </div>
                )}
              </div>
            )) : <p>您还没有创建任何小说。</p>}
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
    </div>
  );
}