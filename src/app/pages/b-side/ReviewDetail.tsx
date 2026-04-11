import React, { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  MessageSquare, 
  Gavel, 
  FileText, 
  Edit3,
  Search,
  Maximize2,
  MoreVertical,
  Minus,
  Plus,
  RotateCcw,
  Check,
  Filter
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "motion/react";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const riskItems = [
  { id: 'R1', level: 'high', title: '违约金比例过高', category: '违约责任', clause: '第七条：若乙方违约，需向甲方支付合同总金额50%的违约金。', suggestion: '建议调整为不超过合同总金额的20%-30%，防止法院酌减。', status: 'pending' },
  { id: 'R2', level: 'medium', title: '付款期限不明确', category: '价款支付', clause: '第三条：甲方应在收到发票后合理时间内支付剩余款项。', suggestion: '建议将“合理时间内”明确为“10个工作日内”。', status: 'accepted' },
  { id: 'R3', level: 'high', title: '争议管辖权冲突', category: '争议解决', clause: '第十条：任何争议均可向任何一方所在地法院提起诉讼。', suggestion: '建议明确唯一管辖法院，如“原告方所在地人民法院”。', status: 'pending' },
];

export function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedRisk, setSelectedRisk] = useState<string | null>('R1');
  const [zoom, setZoom] = useState(100);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors border border-slate-200 bg-white shadow-sm"
            >
               <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="space-y-0.5">
               <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 leading-none">劳务派遣协议_版本v1.2</h2>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">审核中</span>
               </div>
               <p className="text-xs text-slate-500 font-medium">编号: HT-2026-001 • 提交人: 张晓云 • 2026-03-21 10:30</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
               <Save className="w-4 h-4" />
               保存草稿
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
               <Send className="w-4 h-4" />
               提交审批
            </button>
         </div>
      </div>

      {/* Main Review Workspace */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
         {/* Left: Document Preview */}
         <div className="flex-1 bg-slate-200 rounded-2xl overflow-hidden flex flex-col border border-slate-300 relative shadow-inner">
            <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5 shadow-sm">
                     <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 hover:bg-slate-50 rounded text-slate-500"><Minus className="w-3 h-3" /></button>
                     <span className="text-[10px] font-bold text-slate-600 w-10 text-center">{zoom}%</span>
                     <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1 hover:bg-slate-50 rounded text-slate-500"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button className="p-1.5 hover:bg-white rounded text-slate-500 transition-colors"><RotateCcw className="w-3 h-3" /></button>
               </div>
               <div className="flex items-center gap-2">
                  <div className="relative">
                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                     <input type="text" placeholder="在文档中搜索..." className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-[11px] focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <button className="p-1.5 hover:bg-white rounded text-slate-500 transition-colors"><Maximize2 className="w-3 h-3" /></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-500/10 p-12 flex justify-center scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent">
               <div 
                 className="bg-white shadow-2xl rounded-sm w-full max-w-[800px] min-h-[1100px] p-20 relative transition-transform origin-top"
                 style={{ transform: `scale(${zoom / 100})` }}
               >
                  <div className="space-y-8 font-serif leading-relaxed text-slate-800">
                     <h1 className="text-2xl font-bold text-center mb-12 border-b-2 border-slate-900 pb-4">劳务派遣协议</h1>
                     
                     <div className="space-y-4">
                        <p className="font-bold">第一条 协议主体</p>
                        <p className="text-sm">甲方（派遣单位）：北京人力资源服务有限公司</p>
                        <p className="text-sm">乙方（用工单位）：张晓云个人工作室</p>
                     </div>

                     <div className="space-y-4">
                        <p className="font-bold">第三条 服务费及支付方式</p>
                        <p className={cn("text-sm transition-all duration-300 p-2 rounded", selectedRisk === 'R2' ? "bg-amber-100 ring-2 ring-amber-400" : "bg-transparent")}>
                           3.1 甲方每月向乙方支付劳务服务费。乙方应在收到甲方开具的正规发票后<span className="bg-amber-100 text-amber-800 px-1 font-bold">合理时间内</span>支付剩余款项。
                        </p>
                     </div>

                     <div className="space-y-4">
                        <p className="font-bold">第七条 违约责任</p>
                        <p className={cn("text-sm transition-all duration-300 p-2 rounded relative group", selectedRisk === 'R1' ? "bg-rose-100 ring-2 ring-rose-400" : "bg-transparent")}>
                           7.1 <span className="bg-rose-100 text-rose-800 px-1 font-bold">若乙方违约，需向甲方支付合同总金额50%的违约金。</span> 甲方有权直接从应付款项中扣除。
                           <div className="absolute -left-12 top-0 bg-rose-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transform -translate-x-full group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                              <AlertCircle className="w-4 h-4" />
                           </div>
                        </p>
                     </div>

                     <div className="space-y-4">
                        <p className="font-bold">第十条 争议解决</p>
                        <p className={cn("text-sm transition-all duration-300 p-2 rounded", selectedRisk === 'R3' ? "bg-rose-100 ring-2 ring-rose-400" : "bg-transparent")}>
                           10.1 本协议在履行过程中发生的任何争议，由双方协商解决；协商不成的，<span className="bg-rose-100 text-rose-800 px-1 font-bold">任何一方均可向任何一方所在地法院提起诉讼。</span>
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Right: AI & Human Review Panel */}
         <div className="w-[450px] shrink-0 flex flex-col gap-6">
            {/* Risk Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col shrink-0">
               <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">AI 审核结果汇总</h3>
                  <div className="flex gap-2">
                     <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">高风险 2</span>
                     <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded">中风险 1</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">审核模型</p>
                     <p className="text-xs font-bold text-slate-900">GLM-4-Legal v2</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">解析置信度</p>
                     <p className="text-xs font-bold text-slate-900">98.4%</p>
                  </div>
               </div>
            </div>

            {/* Risk Detailed List */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0">
               <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                     风险项清单
                     <span className="bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">3</span>
                  </span>
                  <div className="flex items-center gap-1">
                     <button className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500"><Filter className="w-3.5 h-3.5" /></button>
                     <button className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500"><MoreVertical className="w-3.5 h-3.5" /></button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
                  {riskItems.map((risk) => (
                    <div 
                      key={risk.id} 
                      onClick={() => setSelectedRisk(risk.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all cursor-pointer group relative",
                        selectedRisk === risk.id 
                          ? risk.level === 'high' ? "border-rose-400 bg-rose-50/30" : "border-amber-400 bg-amber-50/30"
                          : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                         <div className={cn(
                           "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                           risk.level === 'high' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                         )}>
                            {risk.level === 'high' ? <AlertCircle className="w-5 h-5" /> : <Gavel className="w-5 h-5" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                               <span className="text-xs font-bold text-slate-900">{risk.title}</span>
                               <span className="text-[10px] font-medium text-slate-400">{risk.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic border-l-2 border-slate-200 pl-2 mb-3 mt-1">
                               "{risk.clause}"
                            </p>
                         </div>
                      </div>

                      <AnimatePresence>
                        {selectedRisk === risk.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                             <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-4">
                                <div className="space-y-1.5">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                      <Edit3 className="w-3 h-3" />
                                      AI 修改建议
                                   </p>
                                   <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed shadow-sm">
                                      {risk.suggestion}
                                   </div>
                                </div>

                                <div className="flex items-center gap-2">
                                   <button className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5">
                                      <Check className="w-3 h-3" />
                                      采用建议
                                   </button>
                                   <button className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                                      驳回
                                   </button>
                                   <button className="p-2 border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-lg">
                                      <MessageSquare className="w-3.5 h-3.5" />
                                   </button>
                                </div>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-2 group">
                     <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                     <span className="text-xs font-bold">手动添加风险项</span>
                  </button>
               </div>
               
               <div className="p-4 bg-slate-900 border-t border-slate-800">
                  <div className="flex items-center gap-3 text-white mb-4">
                     <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <Edit3 className="w-4 h-4 text-slate-400" />
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">当前处理人</p>
                        <p className="text-xs font-bold">法务专员 - 王律师</p>
                     </div>
                  </div>
                  <button className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/40">
                     提交复核结果
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
