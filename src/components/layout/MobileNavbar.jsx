
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User as UserEntity } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, Home, Library, Search, User, LogOut, Shield } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';

const navigationItems = [
  { title: "首页", url: createPageUrl("Home"), icon: Home },
  { title: "书架", url: createPageUrl("Library"), icon: Library },
  { title: "查找", url: createPageUrl("Browse"), icon: Search },
  { title: "我的", url: createPageUrl("Profile"), icon: User },
];

export default function MobileNavbar({ user, onLogout, isLoadingUser }) {
  const location = useLocation();
  
  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5f6dbd498_redmansion_sm.png" alt="红楼小说 Logo" className="h-8 w-8" />
            <span>红楼小说</span>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col space-y-4 mt-8">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = new URL(item.url, window.location.origin).pathname === location.pathname;
                  return (
                    <SheetClose asChild key={item.title}>
                      <Link
                        to={item.url}
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                          isActive
                            ? 'bg-amber-100 text-amber-700'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
                {/* xeyesu 11-10 */}
              </nav>
              <div className="absolute bottom-6 left-6 right-6">
                {isLoadingUser ? (
                  <Skeleton className="h-12 w-full rounded-lg" /> 
                ) : user ? (
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="text-slate-700">
                      <p className="font-semibold">{user.full_name || user.email}</p>
                      <p className="text-sm">已登录</p>
                    </div>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" onClick={onLogout}>
                        <LogOut className="w-5 h-5 text-slate-500" />
                      </Button>
                    </SheetClose>
                  </div>
                ) : (
                  <Button onClick={() => UserEntity.loginWithRedirect(window.location.href)} className="w-full bg-amber-500 hover:bg-amber-600 text-amber-900">
                    登录
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
