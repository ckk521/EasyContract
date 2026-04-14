import { Outlet, Link, useLocation } from "react-router";
import { Gavel, LayoutDashboard, MessageSquare, ShieldCheck, User } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Root() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Universal Top Nav for Demo switching */}
      <nav className="bg-slate-900 text-white h-12 flex items-center justify-between px-6 border-b border-slate-700 shrink-0 z-50">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-blue-400" />
          <span className="font-semibold tracking-tight">EasyVerify Legal MVP</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link 
            to="/" 
            className={cn("hover:text-blue-400 transition-colors", isHome && "text-blue-400")}
          >
            首页
          </Link>
          <Link 
            to="/c-side" 
            className={cn("hover:text-blue-400 transition-colors", location.pathname.startsWith("/c-side") && "text-blue-400")}
          >
            C端智能体
          </Link>
          <Link 
            to="/b-side" 
            className={cn("hover:text-blue-400 transition-colors", location.pathname.startsWith("/b-side") && "text-blue-400")}
          >
            B端管理后台
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/c-login"
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            C端登录
          </Link>
          <Link
            to="/b-login"
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            B端登录
          </Link>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
            <User className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </nav>

      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}

// Simple Home page to introduce the two sides
export function Home() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">合同智能审核平台</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            AI + 人工协同，打造法律行业的专业级合同审核闭环
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          <Link 
            to="/c-side" 
            className="group flex flex-col p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500 transition-all text-left"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">C端智能体</h2>
            <p className="text-slate-500 mb-6 flex-1">
              法律咨询、智能问答、上传合同审核、引导式合同生成及进度查询。
            </p>
            <div className="text-blue-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
              进入用户端 <span>→</span>
            </div>
          </Link>

          <Link 
            to="/b-side" 
            className="group flex flex-col p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500 transition-all text-left"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">B端管理后台</h2>
            <p className="text-slate-500 mb-6 flex-1">
              合同列表管理、审核任务分配、风险规则库维护、法务画像与配额管理。
            </p>
            <div className="text-indigo-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
              进入管理端 <span>→</span>
            </div>
          </Link>
        </div>

        <div className="pt-12 flex items-center justify-center gap-8 border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            专业法律模型
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            全流程合规
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            多租户配额控制
          </div>
        </div>
      </div>
    </div>
  );
}
