
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Database, 
  Link as LinkIcon, 
  Settings, 
  Code, 
  Wrench,
  User as UserIcon,
  LogOut,
  AlertTriangle,
  Users // 新增导入 Users icon
} from "lucide-react";

// 导入所有管理组件
import CreatorDashboardComponent from "../components/admin/CreatorDashboardComponent";
import DataCleanupComponent from "../components/admin/DataCleanupComponent";
import BlockchainSyncComponent from "../components/admin/BlockchainSyncComponent";
import AuthorSyncComponent from "../components/admin/AuthorSyncComponent"; // 新增导入 AuthorSyncComponent
import SchemaUpdateComponent from "../components/admin/SchemaUpdateComponent";
import DebugComponent from "../components/admin/DebugComponent";

const ADMIN_EMAIL = "xeyesu@gmail.com";

const adminTabs = [
  {
    id: "creator",
    label: "创作者中心",
    icon: UserIcon,
    description: "管理小说和章节内容",
    component: CreatorDashboardComponent
  },
  {
    id: "blockchain",
    label: "小说同步", // 修改标签为“小说同步”
    icon: LinkIcon,
    description: "同步区块链上的小说和章节数据", // 修改描述
    component: BlockchainSyncComponent
  },
  {
    id: "author-sync", // 新增作者同步标签页
    label: "作者同步",
    icon: Users,
    description: "同步区块链上的作者简介信息",
    component: AuthorSyncComponent
  },
  {
    id: "schema",
    label: "数据库更新",
    icon: Settings,
    description: "更新数据库结构和字段",
    component: SchemaUpdateComponent
  },
  {
    id: "debug",
    label: "调试工具",
    icon: Code,
    description: "开发和测试工具",
    component: DebugComponent
  },
  {
    id: "cleanup",
    label: "数据清理",
    icon: Database,
    description: "危险操作：清理数据库",
    component: DataCleanupComponent,
    dangerous: true
  }
];

export default function Administrator() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("creator");

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const authorized = currentUser && currentUser.email === ADMIN_EMAIL;
      setIsAuthorized(authorized);
    } catch (error) {
      console.log("User not authenticated");
      setUser(null);
      setIsAuthorized(false);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await User.logout();
    setUser(null);
    setIsAuthorized(false);
    window.location.reload();
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">验证管理员权限...</p>
        </div>
      </div>
    );
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="w-96 bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">管理员登录</h2>
            <p className="text-white/80 mb-6">请登录以访问后台管理系统</p>
            <Button 
              onClick={() => User.loginWithRedirect(window.location.href)} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 无权限状态
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="w-96 bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">访问被拒绝</h2>
            <p className="text-white/80 mb-2">您没有权限访问此页面</p>
            <p className="text-sm text-white/60 mb-6">当前用户: {user.email}</p>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full border-white/30 text-white hover:bg-white/10"
            >
              退出登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 管理员界面
  // const ActiveComponent = adminTabs.find(tab => tab.id === activeTab)?.component; // This line is not needed here anymore

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 顶部导航栏 */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">后台管理系统</h1>
                <p className="text-sm text-white/60">红楼小说管理中心</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.full_name || user.email}</p>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  管理员
                </Badge>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* 标签页导航 */}
          {/* 更新 grid-cols-5 为 grid-cols-6 以适应新增标签页 */}
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-black/20 backdrop-blur-md border-white/10">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white/70"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* 标签页内容 */}
          {adminTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              {/* 功能描述卡片 */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <tab.icon className="w-6 h-6" />
                    {tab.label}
                    {tab.dangerous && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        危险操作
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-white/70">{tab.description}</p>
                </CardHeader>
              </Card>

              {/* 功能组件 */}
              <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-6">
                {/* 仅当当前tab活跃时渲染其组件 */}
                {activeTab === tab.id && tab.component && <tab.component />}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
