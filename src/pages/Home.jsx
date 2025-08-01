
import React, { useState, useEffect, useRef } from "react";
import { Novel } from "@/api/entities";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Star, Flame, Play, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import NovelCard from "../components/novels/NovelCard";

export default function Home() {
  const [novels, setNovels] = useState([]);
  const [featuredNovels, setFeaturedNovels] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const slideInterval = useRef(null);

  useEffect(() => {
    loadNovels();
  }, []);

  useEffect(() => {
    if (featuredNovels.length > 0) {
      startAutoSlide();
    }
    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [featuredNovels]);

  const loadNovels = async () => {
    setIsLoading(true);
    try {
      // 只加载已上架的小说
      const allNovels = await Novel.filter({ is_published: true }, "-updated_date", 20);
      setNovels(allNovels);
      if (allNovels.length > 0) {
        setFeaturedNovels(allNovels.slice(0, 3));
      }
    } catch (error) {
      console.error("Error loading novels:", error);
    }
    setIsLoading(false);
  };

  const startAutoSlide = () => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
    slideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredNovels.length);
    }, 5000);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    startAutoSlide();
  };

  const goToPrevious = () => {
    setCurrentSlide(prev => prev === 0 ? featuredNovels.length - 1 : prev - 1);
    startAutoSlide();
  };

  const goToNext = () => {
    setCurrentSlide(prev => (prev + 1) % featuredNovels.length);
    startAutoSlide();
  };

  // 修复数据分配逻辑
  const trendingNovels = novels.slice(0, 8);
  const recentNovels = novels.slice(0, 8); // 使用相同的小说列表，因为已经按更新时间排序

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        
        {/* Hero Carousel Banner */}
        <section className="space-y-4">
          {isLoading ? (
            <Skeleton className="w-full h-48 md:h-64 rounded-xl" />
          ) : featuredNovels.length > 0 ? (
            <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden">
              {/* Slides */}
              <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredNovels.map((novel, index) => (
                  <div key={novel.id} className="w-full flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-amber-800">
                      <div className="absolute inset-0 bg-black/30"></div>
                      <div className="relative h-full flex items-center">
                        <div className="flex-1 p-6 md:p-8 text-white space-y-3 z-10">
                          <Badge className="bg-amber-500 text-amber-900">
                            精选推荐
                          </Badge>
                          <h2 className="text-2xl md:text-3xl font-bold line-clamp-2">
                            {novel.title}
                          </h2>
                          <p className="text-white/90 line-clamp-2 text-sm md:text-base">
                            {novel.description}
                          </p>
                          <Link to={createPageUrl(`Novel?id=${novel.id}`)}>
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-amber-900">
                              <Play className="w-4 h-4 mr-1" />
                              立即阅读
                            </Button>
                          </Link>
                        </div>
                        <div className="w-1/3 h-full hidden md:block">
                          {novel.cover_image ? (
                            <img 
                              src={novel.cover_image} 
                              alt={novel.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-amber-200/20 flex items-center justify-center">
                              <Play className="w-8 h-8 text-white/50" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20"
                onClick={goToPrevious}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20"
                onClick={goToNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {featuredNovels.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? 'bg-amber-500 w-6' : 'bg-white/50'
                    }`}
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* Trending Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">热门推荐</h2>
                <p className="text-sm text-slate-600">最受欢迎的小说</p>
              </div>
            </div>
            <Link to={createPageUrl("Browse")}>
              <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                查看全部
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[3/4] rounded-lg" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              ))
            ) : trendingNovels.length > 0 ? (
              trendingNovels.map((novel, index) => (
                <div key={novel.id} className="relative">
                  {index < 3 && (
                    <Badge className="absolute -top-1 -left-1 z-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-none text-xs px-1.5 py-0.5">
                      #{index + 1}
                    </Badge>
                  )}
                  <CompactNovelCard novel={novel} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">暂无小说内容</p>
              </div>
            )}
          </div>
        </section>

        {/* Recently Updated Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">最近更新</h2>
              <p className="text-sm text-slate-600">新章节和新作品</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[3/4] rounded-lg" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              ))
            ) : recentNovels.length > 0 ? (
              recentNovels.map((novel) => (
                <CompactNovelCard key={novel.id} novel={novel} />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">暂无最近更新</p>
              </div>
            )}
          </div>
        </section>

        {/* Browse by Genre */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">分类浏览</h2>
              <p className="text-sm text-slate-600">发现你喜欢的类型</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {['言情', '玄幻', '悬疑', '科幻', '剧情'].map((genre, index) => {
              const genreMap = { '言情': 'romance', '玄幻': 'fantasy', '悬疑': 'mystery', '科幻': 'sci-fi', '剧情': 'drama' };
              return (
                <Link key={genre} to={createPageUrl(`Browse?genre=${genreMap[genre]}`)} className="group">
                  <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-lg p-4 text-center hover:shadow-lg hover:border-amber-200 transition-all duration-300 group-hover:-translate-y-0.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-amber-700 font-bold text-sm">{genre[0]}</span>
                    </div>
                    <h3 className="font-medium text-slate-800 group-hover:text-amber-700 transition-colors duration-300 text-sm">
                      {genre}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// Compact Novel Card Component
function CompactNovelCard({ novel }) {
  const genreColors = {
    romance: "bg-pink-100 text-pink-700",
    fantasy: "bg-purple-100 text-purple-700",
    mystery: "bg-indigo-100 text-indigo-700",
    "sci-fi": "bg-blue-100 text-blue-700",
    drama: "bg-green-100 text-green-700",
    thriller: "bg-red-100 text-red-700",
    adventure: "bg-orange-100 text-orange-700",
    historical: "bg-amber-100 text-amber-700",
    "young-adult": "bg-cyan-100 text-cyan-700",
    other: "bg-gray-100 text-gray-700"
  };

  return (
    <Link to={createPageUrl(`Novel?id=${novel.id}`)} className="block group">
      <div className="bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200/60 hover:border-amber-200">
        <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200">
          {novel.cover_image ? (
            <img 
              src={novel.cover_image} 
              alt={novel.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
              <Play className="w-8 h-8 text-amber-600" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge className={`${genreColors[novel.genre]} text-xs px-1.5 py-0.5`}>
              {novel.genre}
            </Badge>
          </div>
        </div>
        
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 group-hover:text-amber-700 transition-colors duration-300">
            {novel.title}
          </h3>
          <p className="text-slate-600 text-xs">作者：{novel.author}</p>
          
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{novel.rating?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{novel.reads_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
