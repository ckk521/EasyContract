import React, { useState } from "react";
import { 
  ChevronLeft, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  FileText, 
  Gavel, 
  ArrowRight,
  UserCheck,
  Check,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "motion/react";
import { toast } from "sonner";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  const reportData = {
    title: "物业租赁合同_v1.pdf",
    no: "EV-RPT-20260321-042",
    date: "2026-03-21 15:45",
    riskSummary: { high: 2, medium: 3, low: 5 },
    risks: [
      { id: 1, level: 'high', title: '违约金条款法律风险', category: '违约责任', desc: '合同约定的违约金比例（50%）远超法律规定的合理范围，可能在司法实践中被认定为无效或被调低。', suggestion: '建议将违约金比例调整为合同总金额的20%以内，并明确损失赔偿原则。' },
      { id: 2, level: 'high', title: '管辖法院不明确', category: '争议解决', desc: '合同未明确具体管辖法院，可能导致在争议发生时产生管辖权异议，增加诉讼成本。', suggestion: '建议明确约定为“原告所在地人民法院”或具体的仲裁机构。' },
      { id: 3, level: 'medium', title: '租金支付宽限期缺失', category: '价款支付', desc: '合同未约定支付租金的宽限期，一旦发生支付延迟即构成根本性违约，风险较高。', suggestion: '建议增加3-5个工作日的宽限期，增强合同履行柔性。' },
    ]
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200 p-4 lg:px-12 sticky top-0 z-40 shrink-0 shadow-sm">
         <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => navigate(-1)} 
                 className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all border border-slate-200"
               >
                  <ChevronLeft className="w-5 h-5" />
               </button>
               <div className="space-y-0.5">
                  <h2 className="text-lg font-bold text-slate-900 leading-none">审核报告详情</h2>
                  <p className="text-xs text-slate-400 font-medium">报告编号: {reportData.no}</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
                  <Printer className="w-4 h-4" />
                  打印
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10">
                  <Download className="w-4 h-4" />
                  下载 PDF 报告
               </button>
            </div>
         </div>
      </div>

      <div className="flex-1 p-4 lg:p-12">
         <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Main Report Content */}
            <div className="lg:col-span-2 space-y-8">
               
               {/* Summary Card */}
               <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
                              <ShieldCheck className="w-5 h-5 text-white" />
                           </div>
                           <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">AI + 专家联合审核报告</span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900">{reportData.title}</h1>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                           <Clock className="w-4 h-4" />
                           审核完成时间：{reportData.date}
                        </p>
                     </div>
                     <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                        <div className="text-center px-4">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">高风险</p>
                           <p className="text-xl font-extrabold text-rose-600">{reportData.riskSummary.high}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="text-center px-4">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">中风险</p>
                           <p className="text-xl font-extrabold text-amber-600">{reportData.riskSummary.medium}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="text-center px-4">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">低风险</p>
                           <p className="text-xl font-extrabold text-blue-600">{reportData.riskSummary.low}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 flex gap-4">
                     <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-800 mb-1">法务专家复核建议</p>
                        <p className="text-xs text-emerald-700/80 leading-relaxed">
                          AI 已初步识别出 10 项风险。法务专家已完成手工复核并修正了其中 2 项 AI 误判，增加了针对您个人工作室背景的 3 项特别建议。请务必优先处理高风险项。
                        </p>
                     </div>
                  </div>
               </div>

               {/* Risk Items */}
               <div className="space-y-6">
                  <h3 className="text-xl font-extrabold text-slate-900 px-2 flex items-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-rose-500" />
                     风险项详情
                  </h3>
                  {reportData.risks.map((risk, idx) => (
                    <motion.div 
                      key={risk.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all hover:shadow-xl hover:-translate-y-1"
                    >
                       <div className={cn(
                         "h-1.5 w-full",
                         risk.level === 'high' ? "bg-rose-500" : "bg-amber-500"
                       )} />
                       <div className="p-8">
                          <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-3">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest",
                                  risk.level === 'high' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                                )}>
                                   {risk.level} Priority
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{risk.category}</span>
                             </div>
                             <span className="text-xs font-bold text-slate-300">#0{risk.id}</span>
                          </div>

                          <h4 className="text-lg font-bold text-slate-900 mb-4">{risk.title}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-2">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                   <Info className="w-3 h-3" />
                                   风险分析
                                </p>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                   {risk.desc}
                                </p>
                             </div>
                             <div className="space-y-2">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                   <Gavel className="w-3 h-3" />
                                   修改建议
                                </p>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed font-bold shadow-inner">
                                   {risk.suggestion}
                                </div>
                             </div>
                          </div>
                          
                          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                             <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors group/btn">
                                查看对应合同条款 
                                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                             </button>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="标记已读"><CheckCircle2 className="w-4 h-4" /></button>
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="咨询 AI"><MessageSquare className="w-4 h-4" /></button>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>

            {/* Right: Actions & Status */}
            <div className="space-y-8">
               
               {/* Confirmation Card */}
               <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                     <h3 className="text-xl font-bold mb-2">确认并完成</h3>
                     <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        如果您已仔细阅读以上建议并接受，请点击确认。我们将为您生成一份包含修正建议的预览版。
                     </p>
                     
                     {!confirmed ? (
                       <button 
                         onClick={() => {
                           setConfirmed(true);
                           toast.success("报告已确认，正在为您准备优化后的合同草案...");
                         }}
                         className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3 active:scale-95"
                       >
                          确认接受报告建议
                          <ChevronRight className="w-4 h-4" />
                       </button>
                     ) : (
                       <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 text-emerald-400">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                             <Check className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-sm font-bold">已确认完成</p>
                             <p className="text-[10px] opacity-80">2026-03-21 16:05 已确认</p>
                          </div>
                       </div>
                     )}
                     
                     <Link to="/c-side" className="w-full mt-4 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-3">
                        向 AI 发起追问
                        <MessageSquare className="w-4 h-4" />
                     </Link>
                  </div>
                  <ShieldCheck className="w-40 h-40 text-white/5 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform" />
               </div>

               {/* Quick Info */}
               <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-3">关于此报告</h4>
                  <div className="space-y-4">
                     <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                           <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-900">数据安全保障</p>
                           <p className="text-[11px] text-slate-500 leading-relaxed">您的合同数据采用金融级加密存储，仅限指定专家查看。</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                           <ShieldCheck className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-900">法律效力说明</p>
                           <p className="text-[11px] text-slate-500 leading-relaxed">本报告基于现有法律知识库生成，旨在辅助决策，不具备强制执行效力。</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Expert Profile */}
               <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 border border-slate-200">W</div>
                     <div>
                        <h4 className="text-sm font-bold text-slate-900">王律师 (复核专家)</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">资深民法专家 • 8年从业经验</p>
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                     {["租赁合同", "劳动纠纷", "企业合规"].map(tag => (
                       <span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider border border-slate-100">
                         {tag}
                       </span>
                     ))}
                  </div>
                  <button className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                     <MessageSquare className="w-3.5 h-3.5" />
                     联系复核专家
                  </button>
               </div>

            </div>
         </div>
      </div>
    </div>
  );
}
