
import React, { useState, useEffect, useCallback } from "react";
import { Novel } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, TrendingUp } from "lucide-react";

import NovelCard from "@/components/novels/NovelCard";

const genres = [
  '玄幻·奇幻', '都市·现实', '仙侠·武侠', '历史·军事', '科幻·游戏', 
  '悬疑·惊悚', '古代言情', '现代言情', '二次元·衍生', '其他分类'
];

const statuses = ['ongoing', 'completed', 'hiatus'];

export default function Browse() {
  const [novels, setNovels] = useState([]);
  const [filteredNovels, setFilteredNovels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('reads_count');

  const urlParams = new URLSearchParams(window.location.search);
  const initialGenre = urlParams.get('genre') || 'all';

  const loadNovels = useCallback(async () => {
    setIsLoading(true);
    try {
      // 只加载已上架的小说
      const allNovels = await Novel.filter({ is_published: true });
      setNovels(allNovels);
    } catch (error) {
      console.error("Error loading novels:", error);
    }
    setIsLoading(false);
  }, []); // Empty dependency array as it doesn't depend on any props or state that would change its behavior

  const filterAndSortNovels = useCallback(() => {
    let filtered = [...novels];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(novel => 
        novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Genre filter
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(novel => novel.genre === selectedGenre);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(novel => novel.status === selectedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'reads_count':
          return (b.reads_count || 0) - (a.reads_count || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'created_date':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredNovels(filtered);
  }, [novels, searchQuery, selectedGenre, selectedStatus, sortBy]); // Dependencies for filterAndSortNovels

  useEffect(() => {
    loadNovels();
    if (initialGenre !== 'all') {
      setSelectedGenre(initialGenre);
    }
  }, [loadNovels, initialGenre]); // Depend on memoized loadNovels and initialGenre

  useEffect(() => {
    filterAndSortNovels();
  }, [filterAndSortNovels]); // Depend on memoized filterAndSortNovels

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedStatus('all');
    setSortBy('reads_count');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
            浏览小说
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            从我们的收藏中发现您下一个最喜欢的故事
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">筛选</h2>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              清除全部
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索小说..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Genre Filter */}
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="ongoing">连载中</SelectItem>
                <SelectItem value="completed">已完结</SelectItem>
                <SelectItem value="hiatus">暂停</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reads_count">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    最受欢迎
                  </div>
                </SelectItem>
                <SelectItem value="rating">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    评分最高
                  </div>
                </SelectItem>
                <SelectItem value="created_date">最新添加</SelectItem>
                <SelectItem value="title">标题 (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                搜索: "{searchQuery}"
              </Badge>
            )}
            {selectedGenre !== 'all' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                分类: {selectedGenre}
              </Badge>
            )}
            {selectedStatus !== 'all' && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                状态: {selectedStatus === 'ongoing' ? '连载中' : selectedStatus === 'completed' ? '已完结' : '暂停'}
              </Badge>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">
              {isLoading ? '加载中...' : `找到 ${filteredNovels.length} 部小说`}
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] bg-slate-200 rounded-xl animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-slate-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredNovels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">未找到小说</h3>
              <p className="text-slate-600 mb-6">
                尝试调整您的筛选条件或搜索关键词
              </p>
              <Button onClick={clearFilters} variant="outline">
                清除筛选
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
