import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical, 
  ChevronRight,
  ShieldAlert,
  Users
} from "lucide-react";
import { Link } from 'react-router';
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

const data = [
  { name: 'Mon', count: 12, high: 2 },
  { name: 'Tue', count: 18, high: 5 },
  { name: 'Wed', count: 15, high: 3 },
  { name: 'Thu', count: 22, high: 7 },
  { name: 'Fri', count: 20, high: 4 },
  { name: 'Sat', count: 8, high: 1 },
  { name: 'Sun', count: 6, high: 0 },
];

const stats = [
  { label: '审核总数', value: '438', change: '+12.5%', type: 'up', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: '高风险命中', value: '54', change: '-2.4%', type: 'down', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: '待处理任务', value: '18', change: '+4', type: 'up', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: '已完成确认', value: '366', change: '+18.2%', type: 'up', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const recentTasks = [
  { id: '1', title: '劳务派遣协议_版本v1.2', user: '张晓云', type: '劳动合同', status: '审核中', time: '10分钟前', priority: 'High' },
  { id: '2', title: '服务器采购租赁合同', user: '北京蓝天科技', type: '采购合同', status: '待审批', time: '2小时前', priority: 'Medium' },
  { id: '3', title: '写字楼租赁补充协议', user: '李宏图', type: '租赁合同', status: '待分配', time: '3小时前', priority: 'Low' },
  { id: '4', title: '股权转让框架协议', user: '顺义投资集团', type: '投融资', status: '审核中', time: '5小时前', priority: 'High' },
];

export function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">工作台概览</h2>
            <p className="text-sm text-slate-500">欢迎回来，王主管。您今天有 18 个待处理任务。</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">L{i}</div>
               ))}
               <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+12</div>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
              创建新任务
            </button>
         </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className={cn("p-2 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full",
                stat.type === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {stat.type === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <div className="space-y-1">
                <h3 className="font-bold text-slate-900">审核趋势统计</h3>
                <p className="text-xs text-slate-500">最近 7 天的合同处理活跃度</p>
             </div>
             <select className="bg-slate-50 border-none text-xs font-semibold rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500">
                <option>最近7天</option>
                <option>最近30天</option>
             </select>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" id="dashboard-chart-container">
              <BarChart data={data} id="dashboard-bar-chart">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} id="bar-count" />
                <Bar dataKey="high" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} id="bar-high" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
             <h3 className="font-bold text-slate-900">最新待办任务</h3>
             <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">查看全部</button>
          </div>
          <div className="flex-1 overflow-y-auto">
             {recentTasks.map((task, idx) => (
               <div key={task.id} className={cn("p-5 flex flex-col gap-3 group hover:bg-slate-50 transition-colors", idx !== recentTasks.length - 1 && "border-b border-slate-50")}>
                  <div className="flex items-center justify-between">
                     <span className={cn(
                       "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                       task.priority === 'High' ? "bg-rose-50 text-rose-600" : task.priority === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"
                     )}>
                       {task.priority} Priority
                     </span>
                     <span className="text-xs text-slate-400">{task.time}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{task.title}</h4>
                  <div className="flex items-center justify-between mt-1">
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">{task.user[0]}</div>
                        <span className="text-xs text-slate-600">{task.user}</span>
                     </div>
                     <Link to={`/b-side/review/${task.id}`} className="text-xs font-medium flex items-center gap-1 text-slate-400 group-hover:text-indigo-600">
                        去处理 <ChevronRight className="w-3 h-3" />
                     </Link>
                  </div>
               </div>
             ))}
          </div>
          <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100">
             <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                同步最新数据
             </button>
          </div>
        </div>
      </div>
      
      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
               <h3 className="font-bold mb-1">风险规则更新</h3>
               <p className="text-slate-400 text-xs mb-4">今日有 3 条新的司法解释发布</p>
               <Link to="/b-side/rules" className="text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all flex items-center gap-2 w-fit">
                  立即同步 <ArrowUpRight className="w-3 h-3" />
               </Link>
            </div>
            <ShieldAlert className="w-20 h-20 text-white/5 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
         </div>
         <div className="bg-indigo-600 text-white p-6 rounded-2xl flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
               <h3 className="font-bold mb-1">配额使用预警</h3>
               <p className="text-white/70 text-xs mb-4">企业：字节互联 剩余不足 5%</p>
               <button className="text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all flex items-center gap-2 w-fit">
                  发送续费通知 <ArrowUpRight className="w-3 h-3" />
               </button>
            </div>
            <FileText className="w-20 h-20 text-white/5 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
         </div>
         <div className="bg-emerald-600 text-white p-6 rounded-2xl flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
               <h3 className="font-bold mb-1">法务绩效报表</h3>
               <p className="text-white/70 text-xs mb-4">本周平均处理时长缩短 15%</p>
               <button className="text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all flex items-center gap-2 w-fit">
                  查看周报 <ArrowUpRight className="w-3 h-3" />
               </button>
            </div>
            <Users className="w-20 h-20 text-white/5 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
         </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
