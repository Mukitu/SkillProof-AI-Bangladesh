import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Database, 
  Activity, 
  CreditCard, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Volume2, 
  Sliders, 
  ShieldAlert, 
  Globe, 
  Search,
  Filter,
  RefreshCw,
  Crown
} from 'lucide-react';
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
  AreaChart,
  Area
} from 'recharts';
import { AuditLog, Announcement, SystemConfig } from '../../lib/adminSupabase';

// ====================================================================
// SYSTEM SETTINGS VIEW
// ====================================================================
interface SettingsViewProps {
  config: SystemConfig;
  onSaveConfig: (cfg: SystemConfig) => Promise<boolean>;
}

export const AdminSettingsView: React.FC<SettingsViewProps> = ({ config, onSaveConfig }) => {
  const [siteName, setSiteName] = useState(config.siteName);
  const [theme, setTheme] = useState(config.theme);
  const [language, setLanguage] = useState(config.language);
  const [groqModel, setGroqModel] = useState(config.groqSettings.model);
  const [groqTemp, setGroqTemp] = useState(config.groqSettings.temperature);
  const [maintenance, setMaintenance] = useState(config.maintenanceMode);
  const [banner, setBanner] = useState(config.homepageBanner);

  const handleSave = async () => {
    const updated: SystemConfig = {
      ...config,
      siteName,
      theme,
      language,
      homepageBanner: banner,
      maintenanceMode: maintenance,
      groqSettings: {
        model: groqModel,
        temperature: groqTemp
      }
    };
    const success = await onSaveConfig(updated);
    if (success) {
      alert('সিস্টেম সেটিংস সফলভাবে সেভ করা হয়েছে এবং সিঙ্ক করা হয়েছে!');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">সিস্টেম ও এআই ইঞ্জিন সেটিংস</h1>
        <p className="text-slate-500 text-xs">প্ল্যাটফর্মের ব্র্যান্ডিং, থিম, Groq এলএলএম মডেল, রক্ষণাবেক্ষণ মোড এবং সাধারণ বিষয়াদি কনফিগার করুন।</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: General */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            সাধারণ ও ব্র্যান্ডিং সেটিংস
          </h2>

          {/* Site Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">ওয়েবসাইট/পোর্টাল টাইটেল (Site Name)</label>
            <input 
              type="text" 
              value={siteName} 
              onChange={(e) => setSiteName(e.target.value)} 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-sans"
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">ডিফল্ট ইন্টারফেস ভাষা (Platform Language)</label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as any)} 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="bn">বাংলা (Bengali)</option>
              <option value="en">English (ইংরেজি)</option>
            </select>
          </div>

          {/* Theme Selection */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">সিস্টেম ব্রান্ড থিম (Brand Accent Theme)</label>
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value as any)} 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="emerald">Emerald Green (ডিফল্ট বাংলাদেশ থিম)</option>
              <option value="blue">Royal Blue (প্রফেশনাল কর্পোরেট থিম)</option>
              <option value="light">Classic Slate White</option>
            </select>
          </div>

          {/* Homepage Banner */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">হোমপেজ ব্যানার বার্তা (Homepage Announcement Banner)</label>
            <textarea 
              value={banner} 
              onChange={(e) => setBanner(e.target.value)} 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs h-20"
            />
          </div>
        </div>

        {/* Right Card: AI Settings & Maintenance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Sliders className="h-4 w-4 text-purple-500" />
            এআই মডেল (Groq Engine) সেটিংস
          </h2>

          {/* Groq Model selection */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">সক্রিয় গ্রক এলএলএম মডেল (Groq Active Model)</label>
            <select 
              value={groqModel} 
              onChange={(e) => setGroqModel(e.target.value)} 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-mono"
            >
              <option value="llama3-70b-8192">llama3-70b-8192 (হাই পারফরম্যান্স - প্রজেক্ট ইভ্যালুয়েশন)</option>
              <option value="llama3-8b-8192">llama3-8b-8192 (ফাস্ট রিস্পন্স - সিভি অ্যানালাইসিস)</option>
              <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (লং ফাইল রিডার)</option>
            </select>
          </div>

          {/* Model temperature */}
          <div className="space-y-1">
            <div className="flex justify-between font-bold text-slate-600 mb-1">
              <span>মডেল তাপমাত্রা (Model Temperature / Creativity)</span>
              <span className="font-mono">{groqTemp}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={groqTemp} 
              onChange={(e) => setGroqTemp(Number(e.target.value))} 
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              জরুরী সিস্টেম রক্ষণাবেক্ষণ (Maintenance Mode)
            </h3>
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-red-800 block">রক্ষণাবেক্ষণ মোড টগল</span>
                <span className="text-[10px] text-red-600 block mt-0.5">চালু করলে ইউজাররা প্ল্যাটফর্ম সাময়িক ব্যবহার করতে পারবে না।</span>
              </div>
              <button 
                onClick={() => setMaintenance(!maintenance)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                  maintenance ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {maintenance ? 'চালু আছে' : 'বন্ধ আছে'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button 
          onClick={handleSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/10 transition"
        >
          সব সেটিংস সংরক্ষণ করুন
        </button>
      </div>
    </div>
  );
};


// ====================================================================
// ANNOUNCEMENTS VIEW (ANNOUNCEMENT CENTER)
// ====================================================================
interface AnnouncementsViewProps {
  announcements: Announcement[];
  onAddAnnouncement: (ann: any) => Promise<any>;
  onDeleteAnnouncement: (id: string) => Promise<boolean>;
}

export const AdminAnnouncementsView: React.FC<AnnouncementsViewProps> = ({ 
  announcements, 
  onAddAnnouncement, 
  onDeleteAnnouncement 
}) => {
  const [list, setList] = useState<Announcement[]>(announcements);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<'all' | 'premium'>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newAnn = await onAddAnnouncement({
      title,
      content,
      targetGroup: target,
      status: 'published'
    });

    if (newAnn) {
      setList([newAnn, ...list]);
      setTitle('');
      setContent('');
      alert('অ্যানাউন্সমেন্ট সফলভাবে প্ল্যাটফর্মে ব্রডকাস্ট করা হয়েছে!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি এই অ্যানাউন্সমেন্টটি ডিলিট করতে চান?')) return;
    const success = await onDeleteAnnouncement(id);
    if (success) {
      setList(list.filter(item => item.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
      {/* Left Column: Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm lg:col-span-1 space-y-4 h-fit">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Bell className="h-4.5 w-4.5 text-emerald-500" />
          <h2 className="text-sm font-bold text-slate-800">অ্যানাউন্সমেন্ট ব্রডকাস্ট করুন</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">অ্যানাউন্সমেন্ট শিরোনাম (Title)</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="যেমন: এআই অ্যাসেসমেন্ট হাবের শুভ উদ্বোধন!"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-sans"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">বিষয়বস্তু (Content Text)</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="ব্যবহারকারীদের জন্য আপনার নোটিশ বা বার্তা বিস্তারিত লিখুন..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs h-32 leading-relaxed"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-600 block">টার্গেট ইউজার গ্রুপ (Target Group)</label>
            <select 
              value={target} 
              onChange={(e) => setTarget(e.target.value as any)} 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="all">প্ল্যাটফর্মের সকল ব্যবহারকারী (Broadcast to All)</option>
              <option value="premium">শুধুমাত্র প্রিমিয়াম মেম্বাররা (Premium Users Only)</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/10 transition"
          >
            ব্রডকাস্ট চালু করুন
          </button>
        </form>
      </div>

      {/* Right Column: History */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Volume2 className="h-4.5 w-4.5 text-blue-500" />
          সক্রিয় অ্যানাউন্সমেন্ট সমূহ
        </h2>

        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
          {list.map(ann => (
            <div key={ann.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl relative hover:border-slate-200 transition">
              <button 
                onClick={() => handleDelete(ann.id)}
                className="absolute right-3 top-3 p-1.5 bg-white text-red-500 border border-slate-200 hover:bg-red-50 hover:border-red-100 rounded-md transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <div className="space-y-1.5 max-w-[90%]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-xs">{ann.title}</h3>
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold uppercase">{ann.targetGroup}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{ann.content}</p>
                <span className="text-[9px] text-slate-400 block font-mono">প্রকাশিত: {new Date(ann.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <p className="text-center text-slate-400 py-8">কোনো অ্যানাউন্সমেন্ট ব্রডকাস্ট করা হয়নি।</p>
          )}
        </div>
      </div>
    </div>
  );
};


// ====================================================================
// AUDIT LOGS VIEW
// ====================================================================
interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AdminAuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = logs.filter(log => 
    log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">সিস্টেম সিকিউরিটি অডিট লগ্স</h1>
        <p className="text-slate-500 text-xs">প্ল্যাটফর্মে অ্যাডমিন এবং মডারেটরদের দ্বারা নেওয়া প্রতিটি প্রশাসনিক পদক্ষেপের টাইমস্ট্যাম্পযুক্ত ইতিহাস ট্র্যাক করুন।</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="অ্যাডমিন নাম, অ্যাকশন বা টার্গেট এন্টিটি দিয়ে লগ ফিল্টার করুন..."
          className="w-full text-xs font-sans border-none focus:outline-hidden bg-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-bold border-b border-slate-150">
                <th className="p-3.5">অ্যাডমিন</th>
                <th className="p-3.5">অ্যাকশন / অ্যাক্টিভিটি</th>
                <th className="p-3.5">টার্গেট এন্টিটি</th>
                <th className="p-3.5">আইপি অ্যাড্রেস</th>
                <th className="p-3.5">ব্রাউজার / ওএস</th>
                <th className="p-3.5 text-right">তারিখ ও সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-3.5 font-bold text-slate-800">{log.adminName}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 font-mono text-[10px]">{log.target}</td>
                  <td className="p-3.5 text-slate-500 font-mono">{log.ipAddress}</td>
                  <td className="p-3.5 text-slate-500 truncate max-w-[120px]">{log.browser}</td>
                  <td className="p-3.5 text-right text-slate-500 font-mono">{log.date} {log.time}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">কোনো ম্যাচিং অডিট লগ খুঁজে পাওয়া যায়নি।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// ====================================================================
// SYSTEM ANALYTICS VIEW (CHARTS GRID)
// ====================================================================
interface AnalyticsViewProps {
  totalUsers: number;
  premiumUsers: number;
}

export const AdminAnalyticsView: React.FC<AnalyticsViewProps> = ({ totalUsers, premiumUsers }) => {
  const activeData = [
    { date: '07/02', active: Math.round(totalUsers * 0.4) || 12, GroqCalls: 120 },
    { date: '07/03', active: Math.round(totalUsers * 0.45) || 15, GroqCalls: 180 },
    { date: '07/04', active: Math.round(totalUsers * 0.52) || 18, GroqCalls: 220 },
    { date: '07/05', active: Math.round(totalUsers * 0.48) || 16, GroqCalls: 190 },
    { date: '07/06', active: Math.round(totalUsers * 0.58) || 20, GroqCalls: 310 },
    { date: '07/07', active: Math.round(totalUsers * 0.65) || 24, GroqCalls: 450 },
    { date: '07/08', active: Math.round(totalUsers * 0.72) || 28, GroqCalls: 520 }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">সিস্টেম রিয়েল-টাইম অ্যানালিটিক্স</h1>
        <p className="text-slate-500 text-xs">প্ল্যাটফর্ম ব্যবহার, দৈনিক অ্যাক্টিভ ব্যবহারকারী এবং Groq এলএলএম API ব্যবহারের সামগ্রিক গ্রাফিক্যাল পরিসংখ্যান দেখুন।</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Users Area Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-emerald-500" />
            দৈনিক অ্যাক্টিভ ব্যবহারকারী ট্রেন্ড (Daily Active Users)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" name="অ্যাক্টিভ ইউজার" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Groq Call Volume */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <Database className="h-4 w-4 text-blue-500" />
            Groq API কল ভলিউম (Groq Call Volume)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="GroqCalls" fill="#3b82f6" radius={[3, 3, 0, 0]} name="API কল সংখ্যা" maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};


// ====================================================================
// SUBSCRIPTION VIEW (ENTERPRISE LICENSE MANAGEMENT)
// ====================================================================
interface SubscriptionsViewProps {
  users: any[];
  onUpdateUser: (userId: string, updates: any) => Promise<boolean>;
}

export const AdminSubscriptionsView: React.FC<SubscriptionsViewProps> = ({ users, onUpdateUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const premiumUsersList = users.filter(u => u.premium && (u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())));

  const handleDeactivate = async (userId: string) => {
    if (!window.confirm('আপনি কি সত্যিই এই ব্যবহারকারীর প্রিমিয়াম লাইসেন্স বাতিল করতে চান?')) return;
    await onUpdateUser(userId, { premium: false, premiumExpiry: undefined });
  };

  const handleExtend = async (userId: string) => {
    const years = window.prompt('কত বছর প্রিমিয়াম লাইসেন্স মেয়াদ বাড়াতে চান? (1-3 বছর লিখুন)', '1');
    if (!years) return;
    const count = parseInt(years);
    if (isNaN(count) || count < 1 || count > 3) {
      alert('অনুগ্রহ করে সঠিক বছর নির্ধারণ করুন।');
      return;
    }
    const yearLimit = 2026 + count;
    await onUpdateUser(userId, { premium: true, premiumExpiry: `${yearLimit}-12-31` });
    alert(`লাইসেন্স সফলভাবে ${yearLimit} সালের ৩১ ডিসেম্বর পর্যন্ত মেয়াদ বাড়ানো হয়েছে!`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">এন্টারপ্রাইজ সাবস্ক্রিপশন ও লাইসেন্স</h1>
        <p className="text-slate-500 text-xs">প্রিমিয়াম লাইসেন্সধারী ব্যবহারকারীদের বিলিং স্ট্যাটাস দেখুন, মেয়াদ বৃদ্ধি করুন বা লাইসেন্স ম্যানুয়ালি অ্যাক্টিভেট/ডিঅ্যাক্টিভেট করুন।</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="প্রিমিয়াম ব্যবহারকারীদের নাম বা ইমেইল দিয়ে সার্চ করুন..."
          className="w-full text-xs font-sans border-none focus:outline-hidden bg-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-bold border-b border-slate-150">
                <th className="p-4">ব্যবহারকারী</th>
                <th className="p-4">লাইসেন্স টাইপ</th>
                <th className="p-4">মেয়াদ উত্তীর্ণের তারিখ</th>
                <th className="p-4">বিকাশ/bdapps গেটওয়ে</th>
                <th className="p-4 text-right">পদক্ষেপ (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {premiumUsersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{u.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                  </td>
                  <td className="p-4 font-bold text-amber-700 flex items-center gap-1">
                    <Crown className="h-3 w-3 fill-amber-500 stroke-amber-500" />
                    Enterprise Premium
                  </td>
                  <td className="p-4 text-slate-600 font-mono">
                    {u.premiumExpiry || '2026-12-31'}
                  </td>
                  <td className="p-4 text-slate-500 font-mono">
                    bdapps_direct_sync (Active)
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleExtend(u.id)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold rounded-lg transition"
                      >
                        মেয়াদ বাড়ান
                      </button>
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold rounded-lg transition"
                      >
                        লাইসেন্স বাতিল
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {premiumUsersList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">কোনো প্রিমিয়াম লাইসেন্সধারী ব্যবহারকারী পাওয়া যায়নি।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
