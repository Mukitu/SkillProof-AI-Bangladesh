import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Video, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  FolderGit2, 
  Search, 
  Settings, 
  Bell, 
  FileSpreadsheet, 
  Map, 
  ShieldCheck, 
  CreditCard, 
  Activity, 
  LogOut,
  Sliders,
  Database,
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  adminRole: string;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate, adminRole }) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin (পূর্ণ সুবিধা)';
      case 'admin': return 'System Admin';
      case 'moderator': return 'Content Moderator';
      case 'support': return 'Support Staff';
      case 'viewer': return 'Viewer Only';
      default: return 'Administrator';
    }
  };

  const navGroups = [
    {
      title: 'সিস্টেম অ্যাডমিন (System)',
      items: [
        { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
        { id: 'analytics', label: 'সিস্টেম অ্যানালিটিক্স', icon: Activity },
        { id: 'logs', label: 'অডিট লগ্স (Audit Logs)', icon: Database, roles: ['super_admin'] },
        { id: 'settings', label: 'সিস্টেম সেটিংস', icon: Settings, roles: ['super_admin', 'admin'] }
      ]
    },
    {
      title: 'ইউজার ও ভেরিফিকেশন (Users)',
      items: [
        { id: 'users', label: 'ব্যবহারকারী ব্যবস্থাপনা', icon: Users },
        { id: 'passports', label: 'স্কিল পাসপোর্ট', icon: Award },
        { id: 'jobs', label: 'জব সার্কুলার পোর্টাল', icon: Briefcase }
      ]
    },
    {
      title: 'মূল্যায়ন ও কার্যক্রম (Evaluation)',
      items: [
        { id: 'resumes', label: 'স্মার্ট সিভি এডিটর', icon: FileText },
        { id: 'interviews', label: 'এআই ভাইভা (Interviews)', icon: Video },
        { id: 'assessments', label: 'কোডিং অ্যাসেসমেন্ট', icon: GraduationCap },
        { id: 'projects', label: 'প্রজেক্ট সাবমিশন', icon: FolderGit2 },
        { id: 'project-submissions', label: 'Custom Submissions', icon: FolderGit2 },
        { id: 'reports', label: 'এআই ক্যারিয়ার রিপোর্টস', icon: FileSpreadsheet },
        { id: 'roadmaps', label: 'ক্যারিয়ার রোডম্যাপ', icon: Map }
      ]
    },
    {
      title: 'পাবলিক পোর্টাল ও এঙ্গেজমেন্ট',
      items: [
        { id: 'verification', label: 'পাবলিক ভেরিফিকেশন', icon: ShieldCheck },
        { id: 'announcements', label: 'অ্যানাউন্সমেন্ট সেন্টার', icon: Bell, roles: ['super_admin', 'admin', 'moderator'] },
        { id: 'reviews_stats', label: 'রিভিউ ও পরিসংখ্যান', icon: Sliders, roles: ['super_admin', 'admin'] }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-full shrink-0">
      {/* Platform Brand */}
      <div className="p-6 border-b border-slate-800 flex flex-col">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
            SP
          </div>
          <div>
            <span className="font-bold text-white block text-sm tracking-wide">SKILLPROOF AI</span>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Enterprise Admin</span>
          </div>
        </div>
        
        {/* Role Badge */}
        <div className="mt-4 p-2 bg-slate-800/60 rounded-md border border-slate-700/50">
          <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Active Credentials</span>
          <span className="text-xs font-semibold text-emerald-300 truncate block">
            {getRoleLabel(adminRole)}
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {navGroups.map((group, gIdx) => {
          // Filter items based on roles
          const visibleItems = group.items.filter(item => {
            if (!item.roles) return true;
            return item.roles.includes(adminRole);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 px-3">
                {group.title}
              </span>
              <ul className="space-y-1 mt-1">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                          isActive 
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 font-semibold' 
                            : 'hover:bg-slate-800 hover:text-white text-slate-400'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => window.location.pathname = '/'}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 rounded-md text-xs font-medium transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>ড্যাশবোর্ড ফিরে যান</span>
        </button>
      </div>
    </aside>
  );
};
