import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User as UserEntity } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';

const navigationItems = [
  { title: "首页", url: createPageUrl("Home") },
  { title: "书架", url: createPageUrl("Library") },
  { title: "查找", url: createPageUrl("Browse") },
];

export default function DesktopNavbar({ user, onLogout, isLoadingUser }) {
  const location = useLocation();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5f6dbd498_redmansion_sm.png" alt="红楼小说 Logo" className="h-8 w-8" />
              <span>红楼小说</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => {
                const isActive = new URL(item.url, window.location.origin).pathname === location.pathname;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center">
              {isLoadingUser ? (
                <Skeleton className="h-10 w-10 rounded-full" /> 
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-9 w-9">
                         <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                           {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                         </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Profile")}>
                        <User className="mr-2 h-4 w-4" />
                        <span>我的</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => UserEntity.loginWithRedirect(window.location.href)} className="bg-amber-500 hover:bg-amber-600 text-amber-900">
                  登录
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}