
import React, { useState, useEffect, useCallback } from "react";
import { AuthorProfile } from "@/api/entities";
import { Novel } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Star, Eye, Award, Mail, ExternalLink, Verified } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { imageCacheManager } from "../components/utils/ImageCacheManager";

import NovelCard from "../components/novels/NovelCard";

export default function AuthorPage() {
  const [author, setAuthor] = useState(null);
  const [novels, setNovels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authorImages, setAuthorImages] = useState({ avatar: null, cover: null });

  const urlParams = new URLSearchParams(window.location.search);
  const authorAddress = urlParams.get('address');

  const loadAuthorData = useCallback(async () => {
    setIsLoading(true);

    // 优先从缓存加载作者图片
    const cachedImages = imageCacheManager.getAuthorImages(authorAddress.toLowerCase());
    if (cachedImages) {
      setAuthorImages(cachedImages);
    }

    try {
      const [authorProfiles, allNovels] = await Promise.all([
        AuthorProfile.filter({ bc_address: authorAddress.toLowerCase() }),
        Novel.filter({ is_published: true })
      ]);

      if (authorProfiles.length > 0) {
        const authorData = authorProfiles[0];
        setAuthor(authorData);

        // 缓存作者图片
        if (authorData.avatar_url || authorData.cover_url) {
          imageCacheManager.setAuthorImages(
            authorAddress.toLowerCase(),
            authorData.avatar_url,
            authorData.cover_url
          );
          setAuthorImages({
            avatar: authorData.avatar_url,
            cover: authorData.cover_url
          });
        }

        // 找到该作者的所有小说
        const authorNovels = allNovels.filter(novel => 
          novel.bc_author_address && 
          novel.bc_author_address.toLowerCase() === authorAddress.toLowerCase()
        );
        setNovels(authorNovels);
        // 每次 novelId 变化时（即进入新的小说详情页），滚动到顶部
        window.scrollTo(0, 0);
      } else {
        // If author not found, ensure images are cleared or set to null
        setAuthorImages({ avatar: null, cover: null });
      }
    } catch (error) {
      console.error("Error loading author data:", error);
      // On error, ensure images are cleared or set to null
      setAuthorImages({ avatar: null, cover: null });
    }
    setIsLoading(false);
  }, [authorAddress]);

  useEffect(() => {
    if (authorAddress) {
      loadAuthorData();
    }
  }, [authorAddress, loadAuthorData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="aspect-[3/4] bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="md:col-span-2 space-y-4">
              <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-32 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">作者信息未找到</h2>
          <p className="text-slate-600 mb-4">该作者可能尚未注册或信息未同步</p>
          <Link to={createPageUrl("Home")}>
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalReads = novels.reduce((sum, novel) => sum + (novel.reads_count || 0), 0);
  const avgRating = novels.length > 0 
    ? novels.reduce((sum, novel) => sum + (novel.rating || 0), 0) / novels.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Back Button */}
        {/* 
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </div>
        */}

        {/* Mobile Layout */}
        <div className="block md:hidden space-y-6">
          {/* Mobile Banner Background */}
          <div className="h-40 bg-gradient-to-r from-slate-200 to-amber-200 rounded-xl overflow-hidden">
            {authorImages.cover ? (
              <img
                src={authorImages.cover}
                alt="作者背景"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-slate-300 to-amber-300"></div>
            )}
          </div>

          {/* Mobile Author Info Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Mobile Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl overflow-hidden shadow-lg">
                  {authorImages.avatar ? (
                    <img
                      src={authorImages.avatar}
                      alt={author?.pseudonym}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-300">
                      <BookOpen className="w-8 h-8 text-amber-700" />
                    </div>
                  )}
                </div>

                {/* Mobile Author Details */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-slate-800">
                        {author.pseudonym}
                      </h1>
                      {author.is_verified && (
                        <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Verified className="w-3 h-3" />
                          已认证
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {author.is_celebrity && (
                        <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          名人榜
                        </Badge>
                      )}
                      {author.is_kyc && (
                        <Badge className="bg-green-100 text-green-700">
                          KYC验证
                        </Badge>
                      )}
                    </div>

                    {author.email && (
                      <div className="flex items-center justify-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{author.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile Stats */}
                  <div className="flex items-center justify-center gap-4 text-slate-600 flex-wrap text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{novels.length} 部作品</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{totalReads.toLocaleString()} 总阅读</span>
                    </div>
                    {avgRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{avgRating.toFixed(1)} 平均评分</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile External Links */}
                  {/*
                  {author.external_url && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="flex items-center gap-2"
                      >
                        <a href={author.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          个人主页
                        </a>
                      </Button>
                    </div>
                  )}
                  */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Layout (原有设计) */}
        <div className="hidden md:block relative">
          {/* Desktop Cover Background */}
          <div className="h-48 md:h-64 bg-gradient-to-r from-slate-200 to-amber-200 rounded-xl overflow-hidden">
            {authorImages.cover ? (
              <img
                src={authorImages.cover}
                alt="作者背景"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-slate-300 to-amber-300"></div>
            )}
          </div>

          {/* Desktop Author Info Card */}
          <Card className="absolute -bottom-16 left-4 right-4 md:left-8 md:right-8 bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Desktop Avatar */}
                <div className="w-32 h-32 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                  {authorImages.avatar ? (
                    <img
                      src={authorImages.avatar}
                      alt={author?.pseudonym}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-300">
                      <BookOpen className="w-12 h-12 text-amber-700" />
                    </div>
                  )}
                </div>

                {/* Desktop Author Details */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl font-bold text-slate-800">
                        {author.pseudonym}
                      </h1>
                      {author.is_verified && (
                        <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Verified className="w-3 h-3" />
                          已认证
                        </Badge>
                      )}
                      {author.is_celebrity && (
                        <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          名人榜
                        </Badge>
                      )}
                      {author.is_kyc && (
                        <Badge className="bg-green-100 text-green-700">
                          KYC验证
                        </Badge>
                      )}
                    </div>

                    {author.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span>{author.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Desktop Stats */}
                  <div className="flex items-center gap-6 text-slate-600 flex-wrap">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{novels.length} 部作品</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{totalReads.toLocaleString()} 总阅读</span>
                    </div>
                    {avgRating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{avgRating.toFixed(1)} 平均评分</span>
                      </div>
                    )}
                  </div>

                  {/* Desktop External Links */}
                  {/*
                  {author.external_url && (
                    <div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="flex items-center gap-2"
                      >
                        <a href={author.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          个人主页
                        </a>
                      </Button>
                    </div>
                  )}
                  */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bio Section */}
        <div className="mt-4 md:mt-20 space-y-6">
          {author.bio && author.bio !== "加载中..." && (
            <Card className="mt-20 bg-white/80 backdrop-blur-sm border-slate-200/60">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">作者简介</h2>
                <div className="prose max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {author.bio}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Works Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">作品集</h2>
                <Badge variant="outline">{novels.length} 部作品</Badge>
              </div>

              {novels.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">暂无作品</h3>
                  <p className="text-slate-500">该作者还未发布任何小说</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {novels.map((novel) => (
                    <NovelCard key={novel.id} novel={novel} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
