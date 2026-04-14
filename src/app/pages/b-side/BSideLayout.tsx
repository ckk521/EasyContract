import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function BSideLayout() {
  const location = useLocation();

  const navItems = [
    { name: "工作概览", path: "/b-side", icon: LayoutDashboard },
    { name: "合同管理", path: "/b-side/contracts", icon: FileText },
    { name: "风险规则库", path: "/b-side/rules", icon: ShieldAlert },
    { name: "法务管理", path: "/b-side/staff", icon: Users },
    { name: "系统配置", path: "/b-side/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Legal Admin</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                {item.name}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-300" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <LogOut className="w-4.5 h-4.5 text-slate-500" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header (Secondary Nav) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm text-slate-500">
             <span className="text-slate-400">管理后台</span>
             <ChevronRight className="w-4 h-4" />
             <span className="font-semibold text-slate-900">
               {navItems.find(item => item.path === location.pathname)?.name || "页面"}
             </span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-xs text-slate-500">法务主管 (Admin)</p>
                <p className="text-sm font-medium text-slate-900">王志平</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <Users className="w-5 h-5 text-slate-500" />
             </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
