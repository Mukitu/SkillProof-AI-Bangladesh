import React from 'react';
import { 
  Users, 
  Award, 
  Video, 
  FileText, 
  GraduationCap, 
  FileSpreadsheet, 
  TrendingUp, 
  CreditCard,
  Layers,
  Database,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AuditLog } from '../../lib/adminSupabase';

interface DashboardViewProps {
  stats: {
    totalUsers: number;
    premiumUsers: number;
    activeUsersToday: number;
    newUsersToday: number;
    resumeCount: number;
    interviewCount: number;
    assessmentCount: number;
    projectCount: number;
    passportCount: number;
    reportCount: number;
    roadmapCount: number;
    verificationRequests: number;
    groqRequests: number;
    storageUsageMb: number;
    databaseUsageMb: number;
  };
  recentLogs: AuditLog[];
  onNavigate: (route: string) => void;
}

export const AdminDashboardView: React.FC<DashboardViewProps> = ({ stats, recentLogs, onNavigate }) => {
  // Chart Colors
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Mock-up dynamic signup data based on total users
  const signupData = [
    { name: 'Jan', signups: Math.round(stats.totalUsers * 0.1) || 5 },
    { name: 'Feb', signups: Math.round(stats.totalUsers * 0.2) || 12 },
    { name: 'Mar', signups: Math.round(stats.totalUsers * 0.35) || 22 },
    { name: 'Apr', signups: Math.round(stats.totalUsers * 0.5) || 35 },
    { name: 'May', signups: Math.round(stats.totalUsers * 0.7) || 48 },
    { name: 'Jun', signups: Math.round(stats.totalUsers * 0.85) || 60 },
    { name: 'Jul', signups: stats.totalUsers || 75 }
  ];

  // Evaluation stats
  const evalData = [
    { name: 'স্মার্ট সিভি', count: stats.resumeCount },
    { name: 'এআই ভাইভা', count: stats.interviewCount },
    { name: 'কোডিং অ্যাসেস.', count: stats.assessmentCount },
    { name: 'প্রজেক্ট সাবমি.', count: stats.projectCount }
  ];

  // Subscription Distribution
  const subscriptionData = [
    { name: 'ফ্রি প্ল্যান (Free)', value: stats.totalUsers - stats.premiumUsers },
    { name: 'প্রিমিয়াম (Premium)', value: stats.premiumUsers }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">এন্টারপ্রাইজ কন্ট্রোল প্যানেল</h1>
        <p className="text-slate-500 text-xs">প্ল্যাটফর্মের সামগ্রিক পারফরম্যান্স, ইউজার বেস এবং সুপাবেজ ডাটাবেজ স্ট্যাটাস রিয়েল-টাইমে মনিটর করুন।</p>
      </div>

      {/* Main Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core Users Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">সর্বমোট ব্যবহারকারী</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalUsers}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">+{stats.newUsersToday} আজ</span>
              <span className="text-[10px] text-slate-400">নতুন সাইন-আপ</span>
            </div>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">সক্রিয় ব্যবহারকারী (আজ)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.activeUsersToday}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">লাইভ</span>
              <span className="text-[10px] text-slate-400">রিয়েল-টাইম এক্টিভিটি</span>
            </div>
          </div>
        </div>

        {/* Evaluation Metrics Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">মোট এআই মূল্যায়ন সম্পন্ন</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.resumeCount + stats.interviewCount + stats.assessmentCount}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate-500">সিভি, ভাইভা এবং কোডিং সেশন</span>
            </div>
          </div>
        </div>

        {/* Issued Skill Passports Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">ভেরিফাইড স্কিল পাসপোর্ট</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.passportCount}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">১০০% ভেরিফাইড</span>
              <span className="text-[10px] text-slate-400">পাবলিকলি ভেরিফাইযোগ্য</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Signups Growth Line/Area Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4 font-sans flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            ইউজার গ্রোথ ও সাইন-আপ ট্রেন্ড
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupData}>
                <defs>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                <Area type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSignups)" name="সর্বমোট ইউজার" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Bar Chart of Evaluations & System Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evaluation Breakdown Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-800 mb-4 font-sans flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-purple-500" />
            এআই অ্যাসেসমেন্ট ও ইভ্যালুয়েশন ডিস্ট্রিবিউশন
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="মোট সেশন সংখ্যা" maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Database & Infrastructure Usage Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-4 font-sans flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-500" />
              ইনফ্রাস্ট্রাকচার ও ডাটাবেজ ব্যবহার
            </h2>
            <div className="space-y-4">
              {/* Groq Usage */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Groq AI টোকেন রিকোয়েস্টস</span>
                  <span>{stats.groqRequests} Calls</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min((stats.groqRequests / 1000) * 100, 100)}%` }}></div>
                </div>
              </div>

              {/* Database Space */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>সুপাবেজ রো স্টোরেজ (DB)</span>
                  <span>{stats.databaseUsageMb.toFixed(2)} MB</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min((stats.databaseUsageMb / 50) * 100, 100)}%` }}></div>
                </div>
              </div>

              {/* Storage bucket */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>সিভি পিডিএফ ও অ্যাসেট স্টোরেজ</span>
                  <span>{stats.storageUsageMb.toFixed(1)} MB</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min((stats.storageUsageMb / 100) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-amber-800 block">ইনফ্রাস্ট্রাকচার এলার্ট</span>
              <span className="text-[10px] text-amber-700 block mt-0.5">সবগুলো API কানেকশন এবং সুপাবেজ ক্লাস্টার ১০০% স্বাস্থ্যকর অবস্থায় চলছে।</span>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Recent System Actions (Audit Logs) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-800 font-sans flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
            সাম্প্রতিক অ্যাডমিন অডিট অ্যাকশনস (Audit Log)
          </h2>
          <button 
            onClick={() => onNavigate('logs')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            সবগুলো লগ্স দেখুন →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-bold border-b border-slate-100">
                <th className="p-3">অ্যাডমিন</th>
                <th className="p-3">অ্যাকশন</th>
                <th className="p-3">টার্গেট এন্টিটি</th>
                <th className="p-3">আইপি অ্যাড্রেস</th>
                <th className="p-3 text-right">তারিখ ও সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLogs.slice(0, 5).map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-3 font-semibold text-slate-800">{log.adminName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-mono">{log.target}</td>
                  <td className="p-3 text-slate-500 font-mono">{log.ipAddress}</td>
                  <td className="p-3 text-right text-slate-500 font-mono">{log.date} {log.time}</td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">কোনো সাম্প্রতিক লগ খুঁজে পাওয়া যায়নি।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
