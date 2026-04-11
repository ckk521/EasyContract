import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreVertical, 
  ShieldAlert, 
  AlertCircle, 
  ShieldCheck, 
  Info,
  Edit2,
  Trash2,
  Database,
  ArrowUpDown,
  BookOpen
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const rules = [
  { id: 'R001', name: '违约金比例过高', category: '违约责任', level: 'high', description: '违约金超过合同总金额30%可能被法院调低', basis: '民法典第585条', status: 1 },
  { id: 'R002', name: '合同主体资格不明', category: '合同主体', level: 'high', description: '未明确签署人是否有合法授权', basis: '公司法第32条', status: 1 },
  { id: 'R003', name: '逾期支付违约金缺失', category: '价款支付', level: 'medium', description: '建议增加每日万分之五的逾期违约金', basis: '商业惯例', status: 1 },
  { id: 'R004', name: '不可抗力条款不全', category: '其他条款', level: 'low', description: '未包含流行病、网络中断等现代不可抗力', basis: '合同法实践', status: 1 },
  { id: 'R005', name: '管辖法院选择不当', category: '争议解决', level: 'medium', description: '建议约定在原告所在地或合同履行地法院', basis: '民事诉讼法', status: 1 },
  { id: 'R006', name: '知识产权归属不明', category: '知识产权', level: 'high', description: '未明确约定职务作品的权利归属', basis: '著作权法', status: 0 },
];

export function RuleLibrary() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">风险规则库管理</h2>
            <p className="text-sm text-slate-500">维护 AI 审核的核心风险识别规则与法律依据</p>
         </div>
         <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
               <Database className="w-4 h-4" />
               知识库同步
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
               <Plus className="w-4 h-4" />
               新增规则
            </button>
         </div>
      </div>

      {/* Categories Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: '总规则数', value: '312', icon: BookOpen, color: 'text-blue-600' },
           { label: '高风险规则', value: '84', icon: AlertCircle, color: 'text-rose-600' },
           { label: '已启用', value: '298', icon: ShieldCheck, color: 'text-emerald-600' },
           { label: '待更新', value: '14', icon: Info, color: 'text-amber-600' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                 <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
              </div>
              <div className={cn("w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center", stat.color)}>
                 <stat.icon className="w-5 h-5" />
              </div>
           </div>
         ))}
      </div>

      {/* Rules Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
            <div className="relative flex-1 min-w-[300px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="按名称、描述或法律依据搜索规则..."
                 className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-2">
               <select className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500">
                  <option>所有分类</option>
                  <option>违约责任</option>
                  <option>合同主体</option>
                  <option>价款支付</option>
               </select>
               <select className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500">
                  <option>风险等级</option>
                  <option>高风险</option>
                  <option>中风险</option>
                  <option>低风险</option>
               </select>
               <button className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                  <Filter className="w-4 h-4" />
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-slate-600">
                           规则名称 <ArrowUpDown className="w-3 h-3" />
                        </div>
                     </th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">分类</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">风险等级</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">法律依据</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">状态</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {rules.map((rule) => (
                     <tr key={rule.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
                                rule.level === 'high' ? "bg-rose-50 text-rose-600" : rule.level === 'medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                              )}>
                                 <ShieldAlert className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-sm font-bold text-slate-900 mb-0.5 group-hover:text-indigo-600 transition-colors">{rule.name}</p>
                                 <p className="text-[11px] text-slate-500 line-clamp-1 italic">{rule.description}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded uppercase tracking-wider">{rule.category}</span>
                        </td>
                        <td className="px-6 py-4">
                           <div className={cn(
                             "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest",
                             rule.level === 'high' ? "text-rose-600 bg-rose-50" : rule.level === 'medium' ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"
                           )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", rule.level === 'high' ? "bg-rose-600" : rule.level === 'medium' ? "bg-amber-600" : "bg-blue-600")} />
                              {rule.level}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-[11px] text-slate-600 font-medium bg-slate-50 border border-slate-100 px-2 py-1 rounded inline-block">{rule.basis}</p>
                        </td>
                        <td className="px-6 py-4">
                           <button className={cn(
                             "w-10 h-5 rounded-full relative transition-all shadow-inner",
                             rule.status ? "bg-indigo-600" : "bg-slate-200"
                           )}>
                              <div className={cn(
                                "w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all shadow-sm",
                                rule.status ? "left-5.5" : "left-0.75"
                              )} />
                           </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-1">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="编辑">
                                 <Edit2 className="w-4 h-4" />
                              </button>
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
         
         <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">最近更新: 2026-03-21 14:30</p>
            <div className="flex items-center gap-1.5">
               <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-900 disabled:opacity-30" disabled>上一页</button>
               <button className="w-7 h-7 bg-indigo-600 text-white text-xs font-bold rounded shadow-lg shadow-indigo-100">1</button>
               <button className="w-7 h-7 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded transition-colors">2</button>
               <button className="w-7 h-7 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded transition-colors">3</button>
               <button className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">下一页</button>
            </div>
         </div>
      </div>

      {/* RAG Knowledge Base Section */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden group">
         <div className="max-w-2xl relative z-10">
            <div className="flex items-center gap-2 mb-4">
               <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
               </div>
               <h3 className="text-xl font-bold">RAG 检索增强知识库</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
               知识库是 AI 审核准确性的核心保障。系统通过向量化存储法律法规、行业案例及判例解释，为审核提供实时检索增强。
               您可以上传最新的 PDF 或 Word 文档，系统将自动进行分片、向量化并更新审核模型。
            </p>
            <div className="flex flex-wrap gap-4">
               <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  上传新文档
               </button>
               <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  查看现有知识
               </button>
            </div>
         </div>
         <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
         <ShieldCheck className="w-48 h-48 text-white/5 absolute -right-8 -bottom-8 group-hover:scale-110 transition-transform" />
      </div>
    </div>
  );
}
