
import React, { useState, useEffect } from "react";
import { Novel } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, TrendingUp } from "lucide-react";

import NovelCard from "../components/novels/NovelCard";

const genres = [
  'romance', 'fantasy', 'mystery', 'sci-fi', 'drama', 
  'thriller', 'adventure', 'historical', 'young-adult', 'other'
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

  useEffect(() => {
    loadNovels();
    if (initialGenre !== 'all') {
      setSelectedGenre(initialGenre);
    }
  }, []);

  useEffect(() => {
    filterAndSortNovels();
  }, [novels, searchQuery, selectedGenre, selectedStatus, sortBy]);

  const loadNovels = async () => {
    setIsLoading(true);
    try {
      // 只加载已上架的小说
      const allNovels = await Novel.filter({ is_published: true });
      setNovels(allNovels);
    } catch (error) {
      console.error("Error loading novels:", error);
    }
    setIsLoading(false);
  };

  const filterAndSortNovels = () => {
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
  };

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
            Browse Novels
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Discover your next favorite story from our collection
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search novels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Genre Filter */}
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reads_count">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Most Popular
                  </div>
                </SelectItem>
                <SelectItem value="rating">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Highest Rated
                  </div>
                </SelectItem>
                <SelectItem value="created_date">Recently Added</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                Search: "{searchQuery}"
              </Badge>
            )}
            {selectedGenre !== 'all' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Genre: {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}
              </Badge>
            )}
            {selectedStatus !== 'all' && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">
              {isLoading ? 'Loading...' : `${filteredNovels.length} novels found`}
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
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No novels found</h3>
              <p className="text-slate-600 mb-6">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
