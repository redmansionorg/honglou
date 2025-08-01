import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, BookOpen, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FeaturedNovel({ novel }) {
  if (!novel) return null;

  return (
    <Card className="overflow-hidden bg-gradient-to-r from-slate-900 to-amber-900 text-white border-none shadow-2xl">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="aspect-[4/3] md:aspect-[3/4] bg-gradient-to-br from-slate-800 to-amber-800 overflow-hidden">
            {novel.cover_image ? (
              <img 
                src={novel.cover_image} 
                alt={novel.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-20 h-20 text-white/50" />
              </div>
            )}
          </div>
          
          <div className="p-8 flex flex-col justify-center space-y-6">
            <div>
              <Badge className="bg-amber-500 text-amber-900 mb-4">
                Featured
              </Badge>
              <h2 className="text-3xl font-bold mb-2 leading-tight">
                {novel.title}
              </h2>
              <p className="text-white/80 text-lg">by {novel.author}</p>
            </div>
            
            <p className="text-white/90 leading-relaxed line-clamp-4">
              {novel.description}
            </p>
            
            <div className="flex items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{novel.reads_count || 0} reads</span>
              </div>
              {novel.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{novel.rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{novel.total_chapters || 0} chapters</span>
              </div>
            </div>
            
            <Link to={createPageUrl(`Novel?id=${novel.id}`)}>
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-amber-900 font-semibold">
                Start Reading
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}