

import React, { useState, useEffect, useRef } from "react";
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

// 用户缓存的 sessionStorage key
const USER_CACHE_KEY = 'redmansion_user_cache';

/**
 * Retrieves user data from sessionStorage.
 * @returns {object|null} The cached user object or null if not found/parse error.
 */
const getInitialUser = () => {
  try {
    const cached = sessionStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    // sessionStorage might be full or disabled, or data malformed
    console.warn("Failed to retrieve or parse user from sessionStorage:", error);
    return null;
  }
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  // 从 sessionStorage 读取缓存作为初始值
  const [user, setUser] = useState(getInitialUser());
  // 如果有初始用户数据，就不显示 loading
  const [isLoadingUser, setIsLoadingUser] = useState(!getInitialUser());
  const isNative = CapacitorIntegration.isNative();

  // 使用 useRef 缓存用户数据，用于在 effect 中访问最新 user 值而不作为依赖
  const userRef = useRef(user); // Initialize with the initial user state
  const userCache = useRef(getInitialUser()); // Holds the value from sessionStorage or API
  const isValidatingUser = useRef(false); // Flag to prevent concurrent validation
  const hasMountedRef = useRef(false); // To track if component has mounted for the first time

  // Effect to keep userRef.current updated with the latest user state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    initializeNativeApp();
    CapacitorIntegration.initialize();

    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    
    // 优化的用户加载逻辑
    const loadUser = async () => {
      // If there's cached user data (either from initial load or previous fetch)
      if (userCache.current) {
        // Immediately use cache data, ensure UI reflects it without showing loading
        // Only update if current user state is different from cache to prevent unnecessary re-renders
        // Using userRef.current to get the latest user state without making 'user' a dependency
        if (!userRef.current || userRef.current.id !== userCache.current.id) {
          setUser(userCache.current);
        }
        setIsLoadingUser(false);
        
        // In the background, silently revalidate the session
        if (!isValidatingUser.current) {
          isValidatingUser.current = true;
          try {
            const currentUser = await UserEntity.me();
            // Validation successful, update cache and state if user data changed
            if (!userCache.current || currentUser.id !== userCache.current.id) {
              userCache.current = currentUser;
              setUser(currentUser);
              // Synchronize to sessionStorage
              try {
                sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(currentUser));
              } catch (e) {
                console.warn("Failed to save user to sessionStorage:", e);
              }
            }
          } catch (error) {
            // Session expired or validation failed, clear cache and user state
            userCache.current = null;
            setUser(null);
            setIsLoadingUser(false); // Ensure loading is off after failed validation
            // Clear sessionStorage
            try {
              sessionStorage.removeItem(USER_CACHE_KEY);
            } catch (e) {
              console.warn("Failed to remove user from sessionStorage:", e);
            }
          } finally {
            isValidatingUser.current = false;
          }
        }
      } else {
        // No cached user, show loading state and fetch user information
        // Only set loading to true if it's the very first mount, to avoid flicker on subsequent page changes
        if (!hasMountedRef.current) {
          setIsLoadingUser(true);
        }
        
        try {
          const currentUser = await UserEntity.me();
          userCache.current = currentUser;
          setUser(currentUser);
          
          // Synchronize to sessionStorage
          try {
            sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(currentUser));
          } catch (e) {
            console.warn("Failed to save user to sessionStorage:", e);
          }
        } catch (error) {
          userCache.current = null;
          setUser(null);
          
          // Clear sessionStorage in case of error (e.g., server returned 401)
          try {
            sessionStorage.removeItem(USER_CACHE_KEY);
          } catch (e) {
            console.warn("Failed to remove user from sessionStorage:", e);
          }
        } finally {
          setIsLoadingUser(false);
          hasMountedRef.current = true; // Mark as mounted after initial load attempt
        }
      }
    };
    
    loadUser();

    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname]); // Re-run effect when path changes to re-check user session

  const handleLogout = async () => {
    await UserEntity.logout();
    userCache.current = null; // Clear useRef cache
    userRef.current = null; // Clear user state mirror ref
    setUser(null);
    setIsLoadingUser(false); // Ensure loading is off
    
    // Clear sessionStorage
    try {
      sessionStorage.removeItem(USER_CACHE_KEY);
    } catch (e) {
      console.warn("Failed to remove user from sessionStorage on logout:", e);
    }
    
    // Force refresh to ensure state is completely reset and navigate to login/home
    window.location.reload();
  };

  const shouldHideNav = hideNavPages.includes(currentPageName);

  // Get active bottom navigation item
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
      
      {/* ================= Conditional Navigation Bar Rendering ================= */}
      {!shouldHideNav && (
        isNative ? (
          // --- Native App: Bottom Navigation ---
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
          // --- Desktop Web: Top Navigation ---
          <DesktopNavbar user={user} onLogout={handleLogout} isLoadingUser={isLoadingUser} />
        ) : (
          // --- Mobile Web: Top Hamburger Menu Navigation ---
          <MobileNavbar user={user} onLogout={handleLogout} isLoadingUser={isLoadingUser} />
        )
      )}

      {/* ================= Main Content Area ================= */}
      <main className={!shouldHideNav && isNative ? 'pb-20' : ''}>
        {/* Reserve space for top navigation bar if not hidden and not native */}
        {!shouldHideNav && !isNative && <div className="h-16" />}
        {children}
      </main>
    </div>
  );
}

