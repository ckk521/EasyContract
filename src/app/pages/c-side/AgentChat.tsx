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
  MessageSquare,
  Loader2,
  X,
  Save,
  CheckCircle,
  Download,
  Printer
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { agentApi, ChatMessage } from "../../api/agent";
import { templateApi, draftApi } from "../../api";
import { Button } from "../../components/ui/button";

// Template data from agent tool results
interface AgentTemplate {
  id: number;
  name: string;
  description: string;
  template_type: string;
}

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [currentIntent, setCurrentIntent] = useState<string>("");
  const [foundTemplates, setFoundTemplates] = useState<AgentTemplate[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeSSERef = useRef<(() => void) | null>(null);

  // Contract form state
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [contractHtml, setContractHtml] = useState<string>("");
  const [placeholders, setPlaceholders] = useState<Array<{index: number; name: string; display_name: string}>>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loadingContract, setLoadingContract] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [fieldDefinitions, setFieldDefinitions] = useState<Array<{id: number; field_name: string; display_name: string}>>([]);

  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        const welcome = await agentApi.getWelcome();
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: welcome.message,
          timestamp: new Date(),
        }]);
      } catch (error) {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: "您好！我是法律助手法小才，我可以帮您起草合同、回答法律问题。请问有什么可以帮助您的？",
          timestamp: new Date(),
        }]);
      }
    };
    init();

    return () => {
      closeSSERef.current?.();
    };
  }, []);

  // 自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, selectedTemplate]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);
    setFoundTemplates([]);

    let convId = conversationId;
    if (!convId) {
      try {
        const result = await agentApi.createConversation();
        convId = result.conversation_id;
        setConversationId(convId);
      } catch (error) {
        toast.error("创建会话失败，请刷新重试");
        setIsTyping(false);
        return;
      }
    }

    let fullContent = "";
    let botMessageId = (Date.now() + 1).toString();

    closeSSERef.current?.();

    closeSSERef.current = agentApi.sendMessageStream(
      { conversation_id: convId, message: userMessage },
      {
        onIntent: (data) => {
          setCurrentIntent(data.intent);
        },
        onToolCalls: (data) => {
          if (data.tools) {
            for (const tool of data.tools) {
              if (tool.tool === "template_search" && tool.result?.templates) {
                setFoundTemplates(tool.result.templates);
              }
            }
          }
        },
        onContent: (data) => {
          fullContent += data.content;
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === "assistant" && lastMsg.id === botMessageId) {
              return [...prev.slice(0, -1), { ...lastMsg, content: fullContent }];
            }
            return [...prev, {
              id: botMessageId,
              role: "assistant",
              content: fullContent,
              intent: currentIntent,
              timestamp: new Date(),
            }];
          });
        },
        onDone: () => {
          setIsTyping(false);
          closeSSERef.current = null;
        },
        onError: (error) => {
          toast.error(error);
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: "抱歉，服务暂时不可用，请稍后重试。",
            timestamp: new Date(),
          }]);
          closeSSERef.current = null;
        },
      }
    );
  };

  const handleNewConversation = async () => {
    closeSSERef.current?.();
    setConversationId(null);
    setCurrentIntent("");
    setMessages([]);
    setFoundTemplates([]);
    setSelectedTemplate(null);
    setContractHtml("");
    setPlaceholders([]);
    setFormValues({});
    setGeneratedContent("");
    setDraftId(null);
    setFieldDefinitions([]);

    try {
      const welcome = await agentApi.getWelcome();
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: welcome.message,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "您好！我是法律助手法小才，请问有什么可以帮助您的？",
        timestamp: new Date(),
      }]);
    }
  };

  const handleUpload = () => {
    toast.info("合同上传功能开发中...");
  };

  // Handle template selection - load contract document
  const handleSelectTemplate = async (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setLoadingContract(true);
    setFormValues({});
    setGeneratedContent("");
    setDraftId(null);

    try {
      const templateData = await templateApi.getById(template.id);
      setContractHtml(templateData.html_content || "");

      // Parse placeholders from HTML
      const placeholderList: Array<{index: number; name: string; display_name: string}> = [];
      if (templateData.placeholders) {
        templateData.placeholders.forEach((p: any, idx: number) => {
          placeholderList.push({
            index: p.index ?? idx,
            name: p.name || `field_${idx}`,
            display_name: p.display_name || p.name || `字段${idx + 1}`,
          });
        });
      }
      setPlaceholders(placeholderList);

      // Fetch field definitions for this template
      const fieldsData = await draftApi.getFields(0); // We'll create a temp draft or use template fields
      // Actually, we need to get fields from template - let's use a different approach
      // Store the placeholder_field_map from template
      if (templateData.placeholder_field_map) {
        const fieldMap = templateData.placeholder_field_map;
        // Get field definitions by fetching from a created draft
        const userId = 1;
        const tempDraft = await draftApi.create({
          name: `temp_${Date.now()}`,
          template_id: template.id,
          user_id: userId,
        });
        const draftFields = await draftApi.getFields(tempDraft.id);
        setFieldDefinitions(draftFields.fields || []);
        setDraftId(tempDraft.id);
        // Delete the temp draft values but keep the draft
      }
    } catch (error) {
      toast.error("加载合同模板失败");
      setSelectedTemplate(null);
    } finally {
      setLoadingContract(false);
    }
  };

  // Handle field change
  const handleFieldChange = (index: number, value: string) => {
    setFormValues(prev => ({ ...prev, [index]: value }));
  };

  // Save draft - convert placeholder index to field name
  const handleSaveDraft = async () => {
    if (!selectedTemplate || !draftId) return;

    setSavingDraft(true);
    try {
      // Convert placeholder index values to field name values
      const fieldValuesByName: Record<string, string> = {};

      // Map placeholder index to field name using fieldDefinitions
      Object.entries(formValues).forEach(([indexStr, value]) => {
        const index = parseInt(indexStr);
        const placeholder = placeholders.find(p => p.index === index);
        if (placeholder && placeholder.name) {
          // Try to find matching field definition
          const fieldDef = fieldDefinitions.find(f =>
            f.display_name === placeholder.display_name ||
            f.field_name === placeholder.name
          );
          if (fieldDef) {
            fieldValuesByName[fieldDef.field_name] = value;
          } else {
            // Fallback to placeholder name
            fieldValuesByName[placeholder.name] = value;
          }
        }
      });

      await draftApi.saveFieldValues(draftId, fieldValuesByName);
      toast.success("草稿保存成功");

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ 您的合同信息已保存为草稿。草稿ID: ${draftId}\n\n您可以随时在"我的合同"中继续编辑，或点击"生成合同"完成合同。`,
        timestamp: new Date(),
      }]);
    } catch (error: any) {
      toast.error(error.message || "保存失败");
    } finally {
      setSavingDraft(false);
    }
  };

  // Generate contract
  const handleGenerateContract = async () => {
    if (!selectedTemplate || !draftId) return;

    setGeneratingContract(true);
    try {
      // Convert placeholder index values to field name values
      const fieldValuesByName: Record<string, string> = {};

      Object.entries(formValues).forEach(([indexStr, value]) => {
        const index = parseInt(indexStr);
        const placeholder = placeholders.find(p => p.index === index);
        if (placeholder && placeholder.name) {
          const fieldDef = fieldDefinitions.find(f =>
            f.display_name === placeholder.display_name ||
            f.field_name === placeholder.name
          );
          if (fieldDef) {
            fieldValuesByName[fieldDef.field_name] = value;
          } else {
            fieldValuesByName[placeholder.name] = value;
          }
        }
      });

      // Save field values first
      await draftApi.saveFieldValues(draftId, fieldValuesByName);

      // Generate contract
      const result = await draftApi.generate(draftId);
      setGeneratedContent(result.content);
      toast.success("合同生成成功");

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ 合同已生成！\n\n您可以查看下方生成的合同内容，或下载保存。`,
        timestamp: new Date(),
      }]);
    } catch (error: any) {
      toast.error(error.message || "生成失败");
    } finally {
      setGeneratingContract(false);
    }
  };

  // Close contract form
  const handleCloseContract = () => {
    setSelectedTemplate(null);
    setContractHtml("");
    setPlaceholders([]);
    setFormValues({});
    setGeneratedContent("");
    setDraftId(null);
    setFieldDefinitions([]);
  };

  // Render contract with editable fields
  const renderContractWithFields = () => {
    if (!contractHtml) return null;

    // Replace placeholder spans with input fields
    let processedHtml = contractHtml;

    // Create a map of index to field info
    const placeholderMap: Record<number, {name: string; display_name: string}> = {};
    placeholders.forEach(p => {
      placeholderMap[p.index] = { name: p.name, display_name: p.display_name };
    });

    // Replace each placeholder span with an input
    const placeholderRegex = /<span class="ec-placeholder" data-index="(\d+)">[^<]*<\/span>/g;
    let match;
    let lastIndex = 0;
    const parts: React.ReactNode[] = [];
    let key = 0;

    // Split HTML by placeholders and render
    while ((match = placeholderRegex.exec(processedHtml)) !== null) {
      const beforeContent = processedHtml.slice(lastIndex, match.index);
      if (beforeContent) {
        parts.push(
          <span key={key++} dangerouslySetInnerHTML={{ __html: beforeContent }} />
        );
      }

      const fieldIndex = parseInt(match[1]);
      const fieldInfo = placeholderMap[fieldIndex];
      const value = formValues[fieldIndex] || "";

      parts.push(
        <input
          key={`input-${fieldIndex}`}
          type="text"
          value={value}
          onChange={(e) => handleFieldChange(fieldIndex, e.target.value)}
          placeholder={fieldInfo?.display_name || `字段${fieldIndex + 1}`}
          className="inline-block bg-yellow-50 px-1 py-0.5 text-inherit outline-none focus:bg-yellow-100 focus:ring-1 focus:ring-blue-400 rounded"
          style={{
            width: `${Math.max(40, (value.length || (fieldInfo?.display_name?.length || 4)) * 14 + 8)}px`,
            minWidth: '40px',
            border: 'none',
            borderBottom: '1px solid #94a3b8',
          }}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining content
    if (lastIndex < processedHtml.length) {
      parts.push(
        <span key={key++} dangerouslySetInnerHTML={{ __html: processedHtml.slice(lastIndex) }} />
      );
    }

    return parts;
  };

  // Calculate progress
  const filledCount = Object.values(formValues).filter(v => v && v.trim()).length;
  const totalCount = placeholders.length;
  const progress = totalCount > 0 ? (filledCount / totalCount) * 100 : 0;

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col hidden lg:flex">
         <div className="p-4 border-b border-slate-100">
            <button
              onClick={handleNewConversation}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
            >
               <Plus className="w-4 h-4" />
               开启新对话
            </button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">最近对话</h3>
            {[
              { title: "租赁合同审核咨询", time: "10:30", active: true },
              { title: "劳动合同解除补偿金", time: "昨天" },
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
                     "p-4 rounded-2xl shadow-sm text-sm leading-relaxed max-w-xl",
                     msg.role === "user" ? "bg-slate-900 text-white" : "bg-white border border-slate-100 text-slate-800"
                   )}>
                     {msg.content.split('\n').map((line, i) => (
                       <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                     ))}
                   </div>

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

           {/* Template Cards */}
           {foundTemplates.length > 0 && !selectedTemplate && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-4xl mx-auto mt-4"
             >
               <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                 <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                   <FileText className="w-4 h-4 text-blue-600" />
                   找到以下模板，点击开始填写
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {foundTemplates.map((template) => (
                     <div
                       key={template.id}
                       onClick={() => handleSelectTemplate(template)}
                       className="p-4 border border-slate-100 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all group"
                     >
                       <div className="flex items-start gap-3">
                         <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                           <FileText className="w-5 h-5 text-blue-600" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="font-semibold text-slate-800 truncate">{template.name}</h4>
                           <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                             {template.description || "暂无描述"}
                           </p>
                           <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                               {template.template_type}
                             </span>
                             <ChevronRight className="w-4 h-4 text-blue-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </motion.div>
           )}

           {/* Contract Document Form */}
           {selectedTemplate && contractHtml && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-4xl mx-auto mt-4"
             >
               {/* Contract Document Container */}
               <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                 {/* Document Header */}
                 <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 text-white">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                         <FileText className="w-5 h-5" />
                       </div>
                       <div>
                         <h3 className="font-bold text-lg">{selectedTemplate.name}</h3>
                         <p className="text-xs text-slate-300">请在下方横线处填写相关信息</p>
                       </div>
                     </div>
                     <button
                       onClick={handleCloseContract}
                       className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                   {/* Progress */}
                   <div className="mt-4">
                     <div className="flex items-center justify-between text-xs mb-1">
                       <span>填写进度</span>
                       <span>{filledCount} / {totalCount} 项</span>
                     </div>
                     <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                       <div
                         className="h-full bg-green-400 transition-all duration-300"
                         style={{ width: `${progress}%` }}
                       />
                     </div>
                   </div>
                 </div>

                 {/* Contract Content - Paper Style */}
                 <div className="p-8 bg-gradient-to-b from-slate-50 to-white">
                   <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-md rounded-lg p-8 md:p-12 print:shadow-none print:border-none">
                     {/* Contract Title */}
                     <div className="text-center mb-8">
                       <h1 className="text-2xl font-bold text-slate-900 tracking-wide">保 密 协 议</h1>
                       <div className="w-32 h-0.5 bg-slate-300 mx-auto mt-3"></div>
                     </div>

                     {/* Contract Body */}
                     <div
                       className="contract-body text-sm leading-7 text-slate-800 space-y-4"
                       style={{ fontFamily: "'SimSun', '宋体', serif" }}
                     >
                       {loadingContract ? (
                         <div className="flex items-center justify-center py-12">
                           <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                           <span className="ml-2 text-slate-600">加载合同文档...</span>
                         </div>
                       ) : (
                         renderContractWithFields()
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Document Footer */}
                 <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
                   <p className="text-xs text-slate-500">
                     <AlertCircle className="w-3 h-3 inline mr-1" />
                     请在横线处填写信息，完成后保存或生成合同
                   </p>
                   <div className="flex items-center gap-2">
                     <Button
                       variant="outline"
                       onClick={handleCloseContract}
                       className="text-slate-600"
                     >
                       取消
                     </Button>
                     <Button
                       variant="outline"
                       onClick={handleSaveDraft}
                       disabled={savingDraft || generatingContract}
                       className="text-blue-600 border-blue-200 hover:bg-blue-50"
                     >
                       {savingDraft ? (
                         <>
                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                           保存中...
                         </>
                       ) : (
                         <>
                           <Save className="w-4 h-4 mr-2" />
                           保存草稿
                         </>
                       )}
                     </Button>
                     <Button
                       onClick={handleGenerateContract}
                       disabled={generatingContract || savingDraft}
                       className="bg-green-600 hover:bg-green-700"
                     >
                       {generatingContract ? (
                         <>
                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                           生成中...
                         </>
                       ) : (
                         <>
                           <CheckCircle className="w-4 h-4 mr-2" />
                           生成合同
                         </>
                       )}
                     </Button>
                   </div>
                 </div>
               </div>
             </motion.div>
           )}

           {/* Generated Contract Display */}
           {generatedContent && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-4xl mx-auto mt-4"
             >
               <div className="bg-white border border-green-200 rounded-2xl shadow-lg overflow-hidden">
                 <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                         <CheckCircle className="w-5 h-5" />
                       </div>
                       <div>
                         <h3 className="font-bold text-lg">合同已生成</h3>
                         <p className="text-xs text-green-100">以下是根据您填写信息生成的正式合同</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <button
                         onClick={() => {
                           const blob = new Blob([generatedContent], { type: 'text/html;charset=utf-8' });
                           const url = URL.createObjectURL(blob);
                           const a = document.createElement('a');
                           a.href = url;
                           a.download = `${selectedTemplate?.name || '合同'}.html`;
                           a.click();
                           URL.revokeObjectURL(url);
                         }}
                         className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 flex items-center gap-1.5 text-sm transition-colors"
                       >
                         <Download className="w-4 h-4" />
                         下载
                       </button>
                       <button
                         onClick={() => {
                           const printWindow = window.open('', '_blank');
                           if (printWindow) {
                             printWindow.document.write(generatedContent);
                             printWindow.document.close();
                             printWindow.print();
                           }
                         }}
                         className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 flex items-center gap-1.5 text-sm transition-colors"
                       >
                         <Printer className="w-4 h-4" />
                         打印
                       </button>
                     </div>
                   </div>
                 </div>
                 <div className="p-8 bg-gradient-to-b from-slate-50 to-white">
                   <div
                     className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-md rounded-lg p-8 md:p-12"
                     style={{ fontFamily: "'SimSun', '宋体', serif" }}
                     dangerouslySetInnerHTML={{ __html: generatedContent }}
                   />
                 </div>
               </div>
             </motion.div>
           )}
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
