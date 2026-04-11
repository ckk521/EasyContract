import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { MessageSquare, FileText, User, LayoutDashboard, ChevronLeft, Bell, Settings } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function CSideLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isChat = location.pathname === "/c-side";

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* C-side Header / Mini Sidebar */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 shrink-0 z-40 shadow-sm">
        <Link to="/c-side" className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-8 shadow-md hover:scale-105 transition-transform group relative">
          <MessageSquare className="w-5 h-5 text-white" />
          <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">智能法律咨询</span>
        </Link>
        
        <nav className="flex-1 flex flex-col items-center gap-6">
          <Link
            to="/c-side"
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative",
              location.pathname === "/c-side" ? "bg-blue-50 text-blue-600 border border-blue-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">对话中心</span>
          </Link>

          <Link
            to="/c-side/history"
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative",
              location.pathname === "/c-side/history" ? "bg-blue-50 text-blue-600 border border-blue-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <FileText className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">我的合同</span>
          </Link>
          
          <div className="h-px w-6 bg-slate-200 my-2" />

          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all group relative">
            <Bell className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">通知消息</span>
          </button>
        </nav>

        <div className="mt-auto space-y-6 flex flex-col items-center">
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all group relative">
            <Settings className="w-5 h-5" />
            <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">个人中心</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
             { !isChat && (
               <button 
                onClick={() => navigate(-1)} 
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
             )}
             <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {location.pathname === "/c-side" ? "法律助手 AI" : location.pathname === "/c-side/history" ? "合同中心" : "详情"}
                </h1>
                {location.pathname === "/c-side" && (
                   <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                     在线服务中
                   </p>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-2">
                <span className="text-xs font-medium text-blue-700">剩余配额: 25 次</span>
                <Link to="/c-side/history" className="text-[10px] text-blue-500 hover:underline">查看详情</Link>
             </div>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-hidden relative">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
