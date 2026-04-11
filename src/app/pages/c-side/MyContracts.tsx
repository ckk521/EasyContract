import React, { useState } from "react";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  FileSearch,
  History
} from "lucide-react";
import { Link } from "react-router";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const userContracts = [
  { id: '1', title: '物业租赁合同_v1.pdf', status: 'reviewing', time: '10分钟前', size: '1.2MB', riskCount: 3 },
  { id: '2', title: '劳务外包协议.docx', status: 'completed', time: '昨天 15:30', size: '2.5MB', riskCount: 5 },
  { id: '3', title: '技术合作意向书.pdf', status: 'completed', time: '3月18日', size: '0.8MB', riskCount: 1 },
  { id: '4', title: '房屋租赁合同(新).pdf', status: 'rejected', time: '3月15日', size: '4.1MB', riskCount: 8 },
];

const statusStyles: any = {
  reviewing: { label: '审核中', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  completed: { label: '已完成', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  rejected: { label: '已驳回', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
};

export function MyContracts() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="h-full flex flex-col p-4 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-10 pb-20">
         
         {/* Welcome & Stats */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
               <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">我的合同中心</h2>
               <p className="text-slate-500 font-medium">您在此可以查看所有上传的合同状态及审核报告</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                     <FileSearch className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">总上传量</p>
                     <p className="text-xl font-extrabold text-slate-900 leading-none">12</p>
                  </div>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                     <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">已处理</p>
                     <p className="text-xl font-extrabold text-slate-900 leading-none">8</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Filter Bar */}
         <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="搜索合同标题或内容..."
                 className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm outline-none"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0">
               <Filter className="w-4 h-4" />
               更多筛选
            </button>
         </div>

         {/* Contract Grid/List */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userContracts.map((contract) => {
              const style = statusStyles[contract.status];
              return (
                <div 
                  key={contract.id} 
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                   <div className="flex items-start justify-between mb-6">
                      <div className={cn("px-3 py-1.5 rounded-full flex items-center gap-2 border", style.bg, style.color, style.border)}>
                         <style.icon className="w-3.5 h-3.5" />
                         <span className="text-[10px] font-extrabold uppercase tracking-widest">{style.label}</span>
                      </div>
                      <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
                         <MoreVertical className="w-4 h-4" />
                      </button>
                   </div>

                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 group-hover:bg-blue-50 transition-all">
                         <FileText className="w-7 h-7 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className="text-lg font-bold text-slate-900 truncate mb-1 group-hover:text-blue-600 transition-colors">{contract.title}</h3>
                         <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><History className="w-3 h-3" /> {contract.time}</span>
                            <span>•</span>
                            <span>{contract.size}</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between mb-6 border border-slate-100/50">
                      <div className="flex items-center gap-2">
                         <AlertCircle className="w-4 h-4 text-rose-500" />
                         <span className="text-xs font-bold text-slate-700">命中风险项: <span className="text-rose-600">{contract.riskCount}</span></span>
                      </div>
                      <Link 
                        to={`/c-side/report/${contract.id}`} 
                        className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                      >
                         查看报告 <ChevronRight className="w-3 h-3" />
                      </Link>
                   </div>

                   <div className="flex gap-3">
                      <button className="flex-1 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2">
                         <Download className="w-3.5 h-3.5" />
                         下载报告
                      </button>
                      <button className="px-5 py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">
                         再审一次
                      </button>
                   </div>
                </div>
              );
            })}

            {/* Empty State / Add New Placeholder */}
            <Link 
              to="/c-side" 
              className="border-4 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
               <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                  <FileText className="w-8 h-8" />
               </div>
               <p className="font-bold text-lg mb-1">开始新的审核</p>
               <p className="text-sm font-medium opacity-60">点击上传合同或开始法律咨询</p>
            </Link>
         </div>
      </div>
    </div>
  );
}
