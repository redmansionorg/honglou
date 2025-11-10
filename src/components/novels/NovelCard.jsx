
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, BookOpen, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { imageCacheManager } from "../utils/ImageCacheManager";

const genreColors = {
  "玄幻·奇幻": "bg-pink-100 text-pink-700 border-pink-200",
  "都市·现实": "bg-purple-100 text-purple-700 border-purple-200",
  "仙侠·武侠": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "历史·军事": "bg-blue-100 text-blue-700 border-blue-200",
  "科幻·游戏": "bg-green-100 text-green-700 border-green-200",
  "悬疑·惊悚": "bg-red-100 text-red-700 border-red-200",
  "古代言情": "bg-orange-100 text-orange-700 border-orange-200",
  "现代言情": "bg-amber-100 text-amber-700 border-amber-200",
  "二次元·衍生": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "其他分类": "bg-gray-100 text-gray-700 border-gray-200"
};

export default function NovelCard({ novel, className = "" }) {
  const [coverImage, setCoverImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    // Reset loading state for new novel prop, then attempt to load
    setImageLoading(true);

    // 优先从缓存加载
    const cachedUrl = imageCacheManager.getNovelCover(novel.id);
    if (cachedUrl) {
      setCoverImage(cachedUrl);
      setImageLoading(false); // If cached, it's considered loaded immediately for display
    } else if (novel.cover_image) {
      // 缓存中没有，使用原始 URL 并缓存
      setCoverImage(novel.cover_image);
      imageCacheManager.setNovelCover(novel.id, novel.cover_image);
      // For new images, imageLoading should remain true until onLoad fires.
      // However, the outline explicitly sets it to false here.
      // This means for non-cached images, the initial opacity-0 state might be very brief or skipped.
      setImageLoading(false);
    } else {
      // No cover image available, show placeholder
      setCoverImage(null);
      setImageLoading(false); // No image to load, so not loading
    }
  }, [novel.id, novel.cover_image]); // Dependencies: novel.id and novel.cover_image to re-run effect when novel changes

  return (
    <Link to={createPageUrl(`Novel?id=${novel.id}`)} className="block group">
      <Card className={`overflow-hidden hover:shadow-xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-amber-200 hover:-translate-y-1 ${className}`}>
        <div className="relative">
          <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
            {coverImage ? (
              <img 
                src={coverImage} 
                alt={novel.title}
                // Apply opacity based on imageLoading. For cached images, it's false, so opacity-100 immediately.
                // For new images, the outline sets imageLoading to false immediately in useEffect,
                // so it will also render opacity-100 immediately. The onLoad will still fire.
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)} // Image successfully loaded
                onError={() => {
                  setImageLoading(false); // Stop loading regardless
                  setCoverImage(null); // Fallback to placeholder if image fails to load
                  // The original outline does not include removing from cache on error.
                  // imageCacheManager.removeNovelCover(novel.id); // Consider adding for robustness
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                <BookOpen className="w-12 h-12 text-amber-600" />
              </div>
            )}
          </div>
          
          <div className="absolute top-3 right-3">
            <Badge className={`${genreColors[novel.genre]} border backdrop-blur-sm`}>
              {novel.genre}
            </Badge>
          </div>
          {novel.status === 'completed' && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-green-100 text-green-700 border-green-200 backdrop-blur-sm">
                Complete
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-slate-800 text-lg line-clamp-2 group-hover:text-amber-700 transition-colors duration-300">
              {novel.title}
            </h3>
            
            {/* 让作者名称可点击，跳转到作者页面 */}
            <p className="text-slate-600 text-sm font-medium">
              作者：
              {novel.bc_author_address ? (
                <Link 
                  to={createPageUrl(`AuthorPage?address=${novel.bc_author_address}`)}
                  className="text-amber-600 hover:text-amber-700 hover:underline ml-1 transition-colors duration-200"
                  onClick={(e) => e.stopPropagation()} // 阻止事件冒泡到父级Link
                >
                  {novel.author}
                </Link>
              ) : (
                <span className="ml-1">{novel.author}</span>
              )}
            </p>
          </div>
          
          <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
            {novel.description}
          </p>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{novel.reads_count || 0}</span>
              </div>
              {novel.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{novel.rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{novel.total_chapters || 0}</span>
              </div>
            </div>
            <Heart className="w-4 h-4 text-slate-400 hover:text-pink-500 hover:fill-pink-500 transition-colors duration-200 cursor-pointer" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
