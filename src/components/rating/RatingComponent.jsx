import React, { useState, useEffect } from "react";
import { Rating } from "@/api/entities";
import { Novel } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RatingComponent({ novelId, currentRating, onRatingUpdate }) {
  const [user, setUser] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(false);

  useEffect(() => {
    loadUser();
  }, [novelId]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser) {
        // 检查用户是否已经评分过
        const existingRating = await Rating.filter({
          user_id: currentUser.id,
          novel_id: novelId
        });
        if (existingRating.length > 0) {
          setUserRating(existingRating[0]);
          setSelectedRating(existingRating[0].rating);
          setReview(existingRating[0].review || "");
        }
      }
    } catch (error) {
      console.log("User not authenticated");
    }
  };

  const handleStarClick = (rating) => {
    setSelectedRating(rating);
    if (!showReviewInput) {
      setShowReviewInput(true);
    }
  };

  const handleSubmitRating = async () => {
    if (!user) {
      await User.loginWithRedirect(window.location.href);
      return;
    }

    if (selectedRating === 0) return;

    setIsSubmitting(true);
    try {
      const ratingData = {
        user_id: user.id,
        novel_id: novelId,
        rating: selectedRating,
        review: review.trim()
      };

      if (userRating) {
        // 更新现有评分
        await Rating.update(userRating.id, ratingData);
        setUserRating({ ...userRating, ...ratingData });
      } else {
        // 创建新评分
        const newRating = await Rating.create(ratingData);
        setUserRating(newRating);
      }

      // 重新计算小说的平均评分
      await updateNovelAverageRating();
      
      setShowReviewInput(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
    setIsSubmitting(false);
  };

  const updateNovelAverageRating = async () => {
    try {
      // 获取该小说的所有评分
      const allRatings = await Rating.filter({ novel_id: novelId });
      
      if (allRatings.length > 0) {
        const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / allRatings.length;
        
        // 更新小说的平均评分
        await Novel.update(novelId, { rating: Math.round(averageRating * 10) / 10 });
        
        // 回调通知父组件更新
        if (onRatingUpdate) {
          onRatingUpdate(averageRating, allRatings.length);
        }
      }
    } catch (error) {
      console.error("Error updating novel rating:", error);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = interactive 
        ? (hoveredRating || selectedRating) >= starValue
        : rating >= starValue;
      
      return (
        <Star
          key={index}
          className={`w-6 h-6 cursor-pointer transition-colors duration-200 ${
            isFilled 
              ? 'fill-amber-400 text-amber-400' 
              : 'text-slate-300 hover:text-amber-300'
          }`}
          onClick={interactive ? () => handleStarClick(starValue) : undefined}
          onMouseEnter={interactive ? () => setHoveredRating(starValue) : undefined}
          onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
        />
      );
    });
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-800">小说评分</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800">
              {currentRating > 0 ? currentRating.toFixed(1) : ''}
            </span>
            <div className="flex">
              {renderStars(currentRating)}
            </div>
          </div>
        </div>

        {user ? (
          <div className="space-y-4">
            {userRating ? (
              <Badge className="bg-green-100 text-green-700">
                您已评分：{userRating.rating} 星
              </Badge>
            ) : (
              <p className="text-slate-600 text-sm">点击星星为这本小说评分</p>
            )}

            {/* 交互式星级评分 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">您的评分：</span>
              <div className="flex">
                {renderStars(selectedRating, true)}
              </div>
              {selectedRating > 0 && (
                <span className="text-sm font-medium text-slate-700">
                  {selectedRating} 星
                </span>
              )}
            </div>

            {/* 评价文字输入 */}
            {showReviewInput && (
              <div className="space-y-3">
                <Textarea
                  placeholder="写下您对这本小说的评价（可选）..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitRating}
                    disabled={selectedRating === 0 || isSubmitting}
                    className="bg-amber-500 hover:bg-amber-600 text-amber-900"
                  >
                    {isSubmitting ? '提交中...' : (userRating ? '更新评分' : '提交评分')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowReviewInput(false);
                      setSelectedRating(userRating?.rating || 0);
                      setReview(userRating?.review || "");
                    }}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            {/* 显示用户的现有评价 */}
            {userRating && userRating.review && !showReviewInput && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">您的评价：</p>
                <p className="text-slate-800">{userRating.review}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setShowReviewInput(true);
                    setSelectedRating(userRating.rating);
                  }}
                >
                  编辑评价
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-600 mb-3">登录后即可为小说评分</p>
            <Button 
              onClick={() => User.loginWithRedirect(window.location.href)}
              className="bg-amber-500 hover:bg-amber-600 text-amber-900"
            >
              登录评分
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}