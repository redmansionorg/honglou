import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, BookOpen, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const genreColors = {
  romance: "bg-pink-100 text-pink-700 border-pink-200",
  fantasy: "bg-purple-100 text-purple-700 border-purple-200",
  mystery: "bg-indigo-100 text-indigo-700 border-indigo-200",
  "sci-fi": "bg-blue-100 text-blue-700 border-blue-200",
  drama: "bg-green-100 text-green-700 border-green-200",
  thriller: "bg-red-100 text-red-700 border-red-200",
  adventure: "bg-orange-100 text-orange-700 border-orange-200",
  historical: "bg-amber-100 text-amber-700 border-amber-200",
  "young-adult": "bg-cyan-100 text-cyan-700 border-cyan-200",
  other: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function NovelCard({ novel, className = "" }) {
  return (
    <Link to={createPageUrl(`Novel?id=${novel.id}`)} className="block group">
      <Card className={`overflow-hidden hover:shadow-xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:border-amber-200 hover:-translate-y-1 ${className}`}>
        <div className="relative">
          <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
            {novel.cover_image ? (
              <img 
                src={novel.cover_image} 
                alt={novel.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
            <p className="text-slate-600 text-sm font-medium">by {novel.author}</p>
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