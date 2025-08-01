import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter, MessageCircle, Copy, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ShareButton({ url, title, description, className = "" }) {
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: title,
    text: description,
    url: url
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    wechat: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`,
    qq: `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className}`}>
          <Share2 className="w-4 h-4" />
          分享
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="w-4 h-4 mr-2" />
            系统分享
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => window.open(shareUrls.facebook, '_blank')}>
          <Facebook className="w-4 h-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => window.open(shareUrls.twitter, '_blank')}>
          <Twitter className="w-4 h-4 mr-2 text-blue-400" />
          Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => window.open(shareUrls.wechat, '_blank')}>
          <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
          微信 (二维码)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => window.open(shareUrls.qq, '_blank')}>
          <div className="w-4 h-4 mr-2 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">Q</span>
          </div>
          QQ空间
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copied ? '已复制' : '复制链接'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}