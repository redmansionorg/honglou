
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Comment, Like, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Heart, MessageCircle, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function CommentModal({ 
  isOpen, 
  onClose, 
  targetType, 
  targetId, 
  targetTitle,
  paragraphIndex = null,
  isMobile = false 
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLikes, setUserLikes] = useState(new Set());
  const modalRef = useRef(null);

  const storageKey = `comment-draft-${targetId}-${paragraphIndex ?? 'root'}`;

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser) {
        const likes = await Like.filter({ user_id: currentUser.id });
        setUserLikes(new Set(likes.map(like => like.comment_id)));
      }
    } catch (error) {
      console.log("User not authenticated");
    }
  }, []); // Dependencies for loadUser: setUser and setUserLikes are state setters, User.me and Like.filter are imported functions/objects assumed stable.

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = {
        target_type: targetType,
        target_id: targetId
      };
      if (paragraphIndex !== null) {
        filter.paragraph_index = paragraphIndex;
      }
      
      const allComments = await Comment.filter(filter, "-created_date");
      setComments(allComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
    setIsLoading(false);
  }, [targetId, targetType, paragraphIndex]); // Dependencies for loadComments: targetId, targetType, paragraphIndex are props, setIsLoading and setComments are state setters.

  useEffect(() => {
    if (isOpen) {
      loadUser();
      loadComments();
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        setNewComment(savedDraft);
      }
    } else {
      setNewComment(""); // Clear input when closed
    }
  }, [isOpen, storageKey, loadUser, loadComments]); // Updated dependencies to include the stable memoized functions

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen && !isMobile) { // Only enable click outside close for desktop
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isMobile]);


  const handleSubmitComment = async () => {
    if (!user) {
      await User.loginWithRedirect(window.location.href);
      return;
    }

    if (!newComment.trim()) return;

    try {
      const commentData = {
        target_type: targetType,
        target_id: targetId,
        user_id: user.id,
        user_name: user.full_name || user.email,
        content: newComment,
        parent_comment_id: replyingTo?.id || null
      };

      if (paragraphIndex !== null) {
        commentData.paragraph_index = paragraphIndex;
      }

      await Comment.create(commentData);
      
      if (replyingTo) {
        await Comment.update(replyingTo.id, {
          ...replyingTo,
          replies_count: (replyingTo.replies_count || 0) + 1
        });
      }

      setNewComment("");
      setReplyingTo(null);
      localStorage.removeItem(storageKey); // Clear draft on submit
      loadComments();
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleLike = async (comment) => {
    if (!user) {
      await User.loginWithRedirect(window.location.href);
      return;
    }

    try {
      const isLiked = userLikes.has(comment.id);
      
      if (isLiked) {
        const like = await Like.filter({ user_id: user.id, comment_id: comment.id });
        if (like.length > 0) {
          await Like.delete(like[0].id);
        }
        await Comment.update(comment.id, {
          ...comment,
          likes_count: Math.max(0, (comment.likes_count || 0) - 1)
        });
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(comment.id);
          return newSet;
        });
      } else {
        await Like.create({ user_id: user.id, comment_id: comment.id });
        await Comment.update(comment.id, {
          ...comment,
          likes_count: (comment.likes_count || 0) + 1
        });
        setUserLikes(prev => new Set([...prev, comment.id]));
      }
      
      loadComments();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const rootComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => 
    comments.filter(c => c.parent_comment_id === commentId);

  if (!isOpen) return null;

  const handleTextChange = (e) => {
    setNewComment(e.target.value);
    localStorage.setItem(storageKey, e.target.value);
  }

  // 【修复】处理键盘事件，只在 Ctrl/Cmd + Enter 时提交
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault(); // 防止默认行为（如换行）
      handleSubmitComment();
    }
  };

  const modalClasses = isMobile 
    ? "fixed inset-0 z-50 bg-white"
    : "fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 border-l";

  return (
    <div className={modalClasses} ref={modalRef}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h3 className="font-semibold text-slate-800">评论</h3>
              <p className="text-sm text-slate-500 truncate max-w-48">
                {targetTitle}
              </p>
            </div>
          </div>
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4" />
                </div>
              ))}
            </div>
          ) : rootComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">还没有评论，来发表第一条吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rootComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={getReplies(comment.id)}
                  onLike={handleLike}
                  onReply={setReplyingTo}
                  isLiked={userLikes.has(comment.id)}
                  currentUser={user}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Comment Input */}
        <div className="p-4 border-t space-y-3">
          {replyingTo && (
            <div className="bg-slate-50 p-2 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  回复 @{replyingTo.user_name}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Textarea
              placeholder={replyingTo ? "写下你的回复... (Cmd/Ctrl+Enter 快捷发送)" : "写下你的想法... (Cmd/Ctrl+Enter 快捷发送)"}
              value={newComment}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[60px] resize-none"
            />
            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, replies, onLike, onReply, isLiked, currentUser }) {
  return (
    <Card className="bg-slate-50">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {comment.user_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-slate-800 text-sm">
                {comment.user_name}
              </p>
              <p className="text-xs text-slate-500">
                {format(new Date(comment.created_date), "MM/dd HH:mm")}
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-slate-700 text-sm leading-relaxed pl-10">
          {comment.content}
        </p>
        
        <div className="flex items-center gap-4 pl-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(comment)}
            className={`gap-1 h-7 ${isLiked ? 'text-pink-500' : 'text-slate-500'}`}
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-pink-500' : ''}`} />
            <span className="text-xs">{comment.likes_count || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment)}
            className="gap-1 h-7 text-slate-500"
          >
            <MessageCircle className="w-3 h-3" />
            <span className="text-xs">回复</span>
          </Button>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="pl-6 mt-3 space-y-2 border-l-2 border-slate-200">
            {replies.map((reply) => (
              <div key={reply.id} className="bg-white p-2 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {reply.user_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="font-medium text-slate-700 text-sm">
                    {reply.user_name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {format(new Date(reply.created_date), "MM/dd HH:mm")}
                  </span>
                </div>
                <p className="text-slate-600 text-sm pl-8">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
