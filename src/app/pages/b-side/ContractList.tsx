import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Plus
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const statusMap: any = {
  pending: { label: '待初审', color: 'bg-slate-100 text-slate-600' },
  ai_reviewing: { label: 'AI审核中', color: 'bg-blue-50 text-blue-600 animate-pulse' },
  pending_assign: { label: '待分配', color: 'bg-indigo-50 text-indigo-600' },
  reviewing: { label: '审核中', color: 'bg-amber-50 text-amber-600' },
  pending_approve: { label: '待审批', color: 'bg-purple-50 text-purple-600' },
  approved: { label: '已通过', color: 'bg-emerald-50 text-emerald-600' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已驳回', color: 'bg-rose-50 text-rose-600' },
};

export function ContractList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">合同管理</h2>
            <p className="text-sm text-slate-500">管理平台所有已上传及生成的法律合同文件</p>
         </div>
         <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
               <Download className="w-4 h-4" />
               导出列表
            </button>
            <button
              onClick={() => navigate("/b-side/contracts")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
               <Plus className="w-4 h-4" />
               上传新合同
            </button>
         </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
         <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索合同标题、编号或提交人..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-2">
            <select className="bg-slate-50 border-none text-sm font-medium rounded-lg px-4 py-2 focus:ring-1 focus:ring-indigo-500">
               <option>合同类型</option>
               <option>劳动合同</option>
               <option>采购合同</option>
               <option>租赁合同</option>
            </select>
            <select className="bg-slate-50 border-none text-sm font-medium rounded-lg px-4 py-2 focus:ring-1 focus:ring-indigo-500">
               <option>审核状态</option>
               {Object.keys(statusMap).map(k => (
                 <option key={k} value={k}>{statusMap[k].label}</option>
               ))}
            </select>
            <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
               <Filter className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-slate-700">
                           合同信息 <ArrowUpDown className="w-3 h-3" />
                        </div>
                     </th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">提交人</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">类型</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">当前状态</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">最后更新</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">操作</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {[].map((contract) => (
                     <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                                 <FileText className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                 <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{contract.title}</p>
                                 <p className="text-[10px] text-slate-400 font-medium">{contract.no} • {contract.size}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{contract.user[0]}</div>
                              <span className="text-sm text-slate-600 font-medium">{contract.user}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{contract.type}</span>
                        </td>
                        <td className="px-6 py-4">
                           <div className={cn(
                             "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                             statusMap[contract.status].color
                           )}>
                              {contract.status === 'reviewing' && <Clock className="w-3 h-3" />}
                              {contract.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                              {contract.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                              {statusMap[contract.status].label}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-xs text-slate-500 font-medium">{contract.time}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-1">
                              <Link 
                                to={`/b-side/review/${contract.id}`} 
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="查看详情"
                              >
                                 <Eye className="w-4 h-4" />
                              </Link>
                              <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="删除">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                                 <MoreVertical className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Pagination */}
         <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs text-slate-500 font-medium">显示 1 到 7 条，共 42 条合同</p>
            <div className="flex items-center gap-1">
               <button className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30" disabled>
                  <ChevronLeft className="w-4 h-4" />
               </button>
               {[1, 2, 3, '...', 6].map((p, i) => (
                  <button 
                    key={i} 
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                      p === 1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                     {p}
                  </button>
               ))}
               <button className="p-2 text-slate-400 hover:text-slate-900">
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
