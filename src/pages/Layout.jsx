
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User as UserEntity } from "@/api/entities";
import { Home, Library, Search, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { CapacitorIntegration } from "./components/capacitor/CapacitorIntegration";
import { initializeNativeApp } from "./components/capacitor/NativeStyles";
import DesktopNavbar from "./components/layout/DesktopNavbar";
import MobileNavbar from "./components/layout/MobileNavbar";

const hideNavPages = ['Reader', 'CreatorDashboard', 'DataCleanup', 'BlockchainSync', 'Debug'];

const bottomNavItems = [
  { title: "首页", url: createPageUrl("Home"), icon: Home },
  { title: "书架", url: createPageUrl("Library"), icon: Library },
  { title: "查找", url: createPageUrl("Browse"), icon: Search },
  { title: "我的", url: createPageUrl("Profile"), icon: User },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true); // 新增状态：用户是否正在加载
  const isNative = CapacitorIntegration.isNative();

  useEffect(() => {
    initializeNativeApp();
    CapacitorIntegration.initialize();

    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    
    // 加载用户信息
    const loadUser = async () => {
      setIsLoadingUser(true); // 开始加载，设置为 true
      try {
        const currentUser = await UserEntity.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoadingUser(false); // 加载完成，设置为 false
      }
    };
    loadUser();

    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname]); // 依赖 location.pathname 确保每次页面切换都重新验证用户信息

  const handleLogout = async () => {
    await UserEntity.logout();
    setUser(null);
    setIsLoadingUser(false);
    // 强制刷新以确保状态完全重置
    window.location.reload();
  };

  const shouldHideNav = hideNavPages.includes(currentPageName);

  // 获取底部导航激活项
  const getActiveBottomNavItem = () => {
    const currentPath = location.pathname;
    return bottomNavItems.find(item => {
      const itemPath = new URL(item.url, window.location.origin).pathname;
      return currentPath === itemPath;
    });
  };
  const activeBottomNavItem = getActiveBottomNavItem();

  return (
    <div className={`min-h-screen bg-gradient-to-b from-amber-50 to-white ${
      isNative ? 'native-app' : ''
    }`}>
      
      {/* ================= 条件导航栏渲染 ================= */}
      {!shouldHideNav && (
        isNative ? (
          // --- 原生 App: 底部导航 ---
          <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 ${
            CapacitorIntegration.isNative() ? 'bottom-nav' : ''
          }`}>
            <div className="flex items-center justify-around max-w-md mx-auto">
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeBottomNavItem?.url === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isActive 
                        ? 'text-amber-600 bg-amber-50' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : ''}`} />
                    <span className={`text-xs font-medium ${isActive ? 'text-amber-600' : ''}`}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : isDesktop ? (
          // --- 桌面网页: 顶部导航 ---
          <DesktopNavbar user={user} onLogout={handleLogout} isLoadingUser={isLoadingUser} />
        ) : (
          // --- 移动网页: 顶部汉堡菜单导航 ---
          <MobileNavbar user={user} onLogout={handleLogout} isLoadingUser={isLoadingUser} />
        )
      )}

      {/* ================= 主要内容区域 ================= */}
      <main className={!shouldHideNav && isNative ? 'pb-20' : ''}>
        {/* 为顶部导航栏预留空间 */}
        {!shouldHideNav && !isNative && <div className="h-16" />}
        {children}
      </main>
    </div>
  );
}
