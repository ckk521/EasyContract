import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Paperclip, 
  Bot, 
  User, 
  Plus, 
  FileUp, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  Gavel,
  History,
  MessageSquare
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Link } from "react-router";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: "bot" | "user";
  content: string;
  type?: "text" | "contract_upload" | "report_summary" | "form";
  metadata?: any;
  timestamp: Date;
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "您好！我是您的法律 AI 助手。我可以帮您审核合同、起草协议，或者回答法律相关问题。请问今天有什么可以帮您？",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    simulateBotResponse(inputValue);
  };

  const simulateBotResponse = (userInput: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let response: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "",
        timestamp: new Date(),
      };

      if (userInput.includes("审核") || userInput.includes("上传")) {
        response.content = "没问题，请点击下方的『上传合同』按钮或直接将文件拖拽到此处。支持 PDF、Word 及图片格式。";
        response.type = "contract_upload";
      } else if (userInput.includes("租赁")) {
        response.content = "我可以为您生成一份标准的房屋租赁合同。为了确保合同严谨，我需要您提供一些基本信息：\n1. 房屋所在地？\n2. 租期多久？\n3. 每月租金多少？";
        response.type = "form";
      } else {
        response.content = "明白您的需求。正在基于最新的法律知识库为您分析，请稍等片刻...";
      }

      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const handleUpload = () => {
    toast.success("正在上传并进行 AI 初步解析...");
    setIsTyping(true);
    setTimeout(() => {
      const reportMsg: Message = {
        id: Date.now().toString(),
        role: "bot",
        content: "文件上传成功！AI 已完成初审。我们在您的《物业租赁合同》中发现了 3 处高风险项和 5 处建议修改项。",
        type: "report_summary",
        metadata: {
           fileName: "物业租赁合同_v1.pdf",
           risks: [
             { level: "high", title: "违约金比例过高", desc: "约定 50% 的违约金可能在司法实践中被酌减。" },
             { level: "high", title: "争议管辖不明", desc: "未明确具体的仲裁机构或法院。" }
           ]
        },
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, reportMsg]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
      {/* Sidebar - Recent Conversations */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col hidden lg:flex">
         <div className="p-4 border-b border-slate-100">
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm">
               <Plus className="w-4 h-4" />
               开启新对话
            </button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">最近对话</h3>
            {[
              { title: "租赁合同审核咨询", time: "10:30", active: true },
              { title: "劳动合同解除补偿金", time: "昨天" },
              { title: "股权代持协议风险", time: "3月18日" },
              { title: "公司章程修改建议", time: "3月15日" },
            ].map((item, i) => (
              <div key={i} className={cn(
                "p-3 rounded-xl flex items-center gap-3 cursor-pointer group transition-all",
                item.active ? "bg-blue-50 text-blue-700 border border-blue-100" : "hover:bg-slate-50 text-slate-600"
              )}>
                <MessageSquare className={cn("w-4 h-4 shrink-0", item.active ? "text-blue-600" : "text-slate-400")} />
                <div className="flex-1 overflow-hidden">
                   <p className="text-sm font-semibold truncate">{item.title}</p>
                   <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
         </div>
         <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">专业法律保障</span>
               </div>
               <p className="text-[10px] text-slate-500 leading-relaxed">
                 所有 AI 生成内容均基于中国法律知识库，重大决定建议咨询专业律师。
               </p>
            </div>
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white lg:bg-slate-50/30">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
           <AnimatePresence>
             {messages.map((msg) => (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 key={msg.id}
                 className={cn(
                   "flex gap-4 max-w-4xl",
                   msg.role === "user" ? "flex-row-reverse ml-auto" : "mr-auto"
                 )}
               >
                 <div className={cn(
                   "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                   msg.role === "user" ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
                 )}>
                   {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                 </div>

                 <div className={cn("flex flex-col gap-2", msg.role === "user" ? "items-end" : "items-start")}>
                   <div className={cn(
                     "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                     msg.role === "user" ? "bg-slate-900 text-white" : "bg-white border border-slate-100 text-slate-800"
                   )}>
                     {msg.content}
                   </div>

                   {/* Custom Component based on message type */}
                   {msg.type === "contract_upload" && (
                      <button 
                        onClick={handleUpload}
                        className="flex items-center gap-3 p-4 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/50 hover:bg-blue-50 transition-all group w-full max-w-md mt-2"
                      >
                         <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileUp className="w-5 h-5 text-blue-600" />
                         </div>
                         <div className="text-left">
                            <p className="text-sm font-bold text-blue-700">上传合同文件</p>
                            <p className="text-xs text-blue-500/80">PDF, Word, JPG (Max 20MB)</p>
                         </div>
                      </button>
                   )}

                   {msg.type === "report_summary" && (
                      <div className="w-full max-w-md p-5 bg-white border border-slate-200 rounded-2xl shadow-md mt-2 space-y-4">
                         <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                               <FileText className="w-4 h-4 text-blue-600" />
                               <span className="text-sm font-bold text-slate-900">{msg.metadata.fileName}</span>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase">AI 初审已完成</span>
                         </div>
                         
                         <div className="space-y-3">
                            {msg.metadata.risks.map((risk: any, idx: number) => (
                               <div key={idx} className="flex gap-3">
                                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                     <p className="text-xs font-bold text-slate-800">{risk.title}</p>
                                     <p className="text-[10px] text-slate-500 leading-relaxed">{risk.desc}</p>
                                  </div>
                               </div>
                            ))}
                         </div>

                         <div className="flex items-center gap-3 pt-2">
                            <Link to="/c-side/report/1" className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors text-center">
                               查看详细报告
                            </Link>
                            <button className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">
                               下载
                            </button>
                         </div>
                      </div>
                   )}
                   
                   <span className="text-[10px] text-slate-400 font-medium px-2">
                     {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                 </div>
               </motion.div>
             ))}
             {isTyping && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                   <Bot className="w-5 h-5" />
                 </div>
                 <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-8 bg-white lg:bg-transparent shrink-0">
           <div className="max-w-4xl mx-auto relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative bg-white border border-slate-200 rounded-[28px] shadow-2xl overflow-hidden focus-within:border-blue-400 transition-all flex flex-col">
                 <div className="flex items-center gap-2 p-2 border-b border-slate-50 bg-slate-50/30">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-full transition-all" title="上传附件">
                       <Paperclip className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleUpload}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-full transition-all flex items-center gap-1.5" 
                      title="合同审核"
                    >
                       <Gavel className="w-4 h-4" />
                       <span className="text-xs font-bold hidden sm:inline">审核合同</span>
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-full transition-all flex items-center gap-1.5">
                       <History className="w-4 h-4" />
                       <span className="text-xs font-bold hidden sm:inline">我的历史</span>
                    </button>
                 </div>
                 <div className="flex items-center p-3 gap-3">
                    <textarea 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="咨询法律问题或输入您的要求..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 text-sm resize-none py-2 px-2 max-h-32 min-h-[44px]"
                      rows={1}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg shrink-0",
                        inputValue.trim() ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105" : "bg-slate-100 text-slate-400"
                      )}
                    >
                       <Send className="w-5 h-5" />
                    </button>
                 </div>
                 <div className="px-5 py-2 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-1">
                       <Sparkles className="w-3 h-3 text-amber-500" />
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Advanced Legal Model v4.1</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Shift + Enter 换行</span>
                 </div>
              </div>
           </div>
           <p className="text-center text-[10px] text-slate-400 mt-4 font-medium">
              © 2026 EasyVerify. 合同审核结果仅供参考，不构成正式法律建议。
           </p>
        </div>
      </div>
    </div>
  );
}
