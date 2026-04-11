import { Users, ShieldCheck, TrendingUp, Search } from "lucide-react";

export function StaffManagement() {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h2 className="text-2xl font-bold tracking-tight text-slate-900">法务人员管理</h2>
             <p className="text-sm text-slate-500">管理团队内所有法务专员的画像标签与工作量</p>
          </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "王志平", role: "Manager", tasks: 8, completed: 142, rating: 4.9, tags: ["采购合同", "投融资", "纠纷处理"] },
            { name: "李晓月", role: "Specialist", tasks: 5, completed: 86, rating: 4.8, tags: ["劳动合同", "保密协议", "电商合规"] },
            { name: "陈建国", role: "Specialist", tasks: 3, completed: 54, rating: 4.7, tags: ["知识产权", "技术开发", "制造业"] },
          ].map((staff, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">{staff.name[0]}</div>
                  <div>
                     <h3 className="font-bold text-slate-900">{staff.name}</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{staff.role}</p>
                  </div>
                  <div className="ml-auto text-right">
                     <p className="text-xs font-bold text-emerald-600">{staff.rating}</p>
                     <p className="text-[10px] text-slate-400">Rating</p>
                  </div>
               </div>
               <div className="flex flex-wrap gap-2 mb-6">
                  {staff.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded border border-slate-100">{tag}</span>
                  ))}
               </div>
               <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">当前任务</p>
                     <p className="text-sm font-bold text-slate-900">{staff.tasks}</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">累计完成</p>
                     <p className="text-sm font-bold text-slate-900">{staff.completed}</p>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}

export function SystemSettings() {
  return (
    <div className="max-w-3xl space-y-8">
       <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">系统配置</h2>
          <p className="text-sm text-slate-500">管理平台模型参数、配额策略与集成设置</p>
       </div>
       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
          <div className="space-y-4">
             <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">AI 模型配置</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">审核模型 API</label>
                   <input type="text" className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm" defaultValue="https://api.openai-mock.com/v1" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">模型名称</label>
                   <input type="text" className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm" defaultValue="gpt-4-legal-v2" />
                </div>
             </div>
          </div>
          <div className="space-y-4">
             <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">默认配额设置</h3>
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">初始配额 (次/用户)</label>
                <input type="number" className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm" defaultValue="10" />
             </div>
          </div>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
             保存全局配置
          </button>
       </div>
    </div>
  );
}
