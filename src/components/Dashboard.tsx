/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Button, Card, Badge, PageHeader, StatsCard, EmptyState,
  ConfirmationDialog, ThemeSwitch, LanguageSwitch, Breadcrumb
} from './UI';
import { 
  LayoutDashboard, FileText, Video, Award, Map, BarChart3, 
  Download, User, Settings, LogOut, Bell, Search, Edit2, 
  Trash2, Globe, Sparkles, Check, CheckCircle2, AlertCircle,
  TrendingUp, Plus, ArrowUpRight, Code2, Cpu, GraduationCap, Briefcase
} from 'lucide-react';
import { AiSmartCv } from './AiSmartCv';
import { AiInterview } from './AiInterview';
import { AiSkillPassport } from './AiSkillPassport';
import { AiCareerGrowth } from './AiCareerGrowth';
import { AiReports } from './AiReports';

interface DashboardProps {
  onLogout: () => void;
  initialTab?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, initialTab = 'dashboard' }) => {
  const { t, isBn, language } = useLanguage();
  const { user, settings, updateProfile, updateSettings, deleteAccount } = useAuth();

  // রুট ট্র্যাকিং স্টেট (Current active tab routing state)
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // নোটিফিকেশন প্যানেল স্টেট (Notification tray state)
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // প্রোফাইল এডিট স্টেট (Profile editing states)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(user?.fullName || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [educationInput, setEducationInput] = useState(user?.education || '');
  const [experienceInput, setExperienceInput] = useState(user?.experience || '');
  const [skillsInput, setSkillsInput] = useState(user?.skills.join(', ') || '');
  const [githubInput, setGithubInput] = useState(user?.socialLinks?.github || '');
  const [linkedinInput, setLinkedinInput] = useState(user?.socialLinks?.linkedin || '');

  // সেটিংস লোকাল স্টেট (Settings state)
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings?.notificationsEnabled ?? true);
  const [marketingEmails, setMarketingEmails] = useState(settings?.marketingEmails ?? false);

  // মোডাল/ডায়ালগ স্টেট (Delete confirmation state)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // নোটিফিকেশন মক ডাটা (Mock Notification Data)
  const notifications = [
    {
      id: '1',
      titleBn: 'নতুন এআই ভাইভা উপলব্ধ!',
      titleEn: 'New AI Interview available!',
      descBn: 'আপনার প্রোফাইলের ওপর ভিত্তি করে "React Developer" মৌখিক পরীক্ষা তৈরি করা হয়েছে।',
      descEn: 'Based on your profile, a "React Developer" viva has been generated.',
      time: '৫ মিনিট আগে'
    },
    {
      id: '2',
      titleBn: 'স্কিল পাসপোর্ট আপডেট হয়েছে',
      titleEn: 'Skill Passport Updated',
      descBn: 'আপনার টাইপস্ক্রিপ্ট দক্ষতার ভেরিফাইড ব্যাজটি পাসপোর্টে যোগ করা হয়েছে।',
      descEn: 'Your verified TypeScript Intermediate Badge has been added to your passport.',
      time: '২ ঘন্টা আগে'
    }
  ];

  // রিসেন্ট অ্যাক্টিভিটি মক ডাটা (Mock Activity History)
  const activities = [
    {
      id: '1',
      type: 'cv_uploaded',
      titleBn: 'সিভি আপলোড সম্পন্ন হয়েছে',
      titleEn: 'CV Upload completed',
      detailBn: 'Ariful_CV_MERN.pdf ফাইলটি এআই এনালাইসিস করা হয়েছে।',
      detailEn: 'Ariful_CV_MERN.pdf has been analyzed by AI.',
      time: '৩ দিন আগে',
      score: 82
    },
    {
      id: '2',
      type: 'interview_completed',
      titleBn: 'রিয়্যাক্ট ভাইভা সম্পন্ন',
      titleEn: 'React Viva completed',
      detailBn: 'প্রশ্নোত্তরের পারফরম্যান্স স্কোর: ৭৮%',
      detailEn: 'Performance score in Q&A session: 78%',
      time: '৪ দিন আগে',
      score: 78
    },
    {
      id: '3',
      type: 'badge_earned',
      titleBn: 'টাইপস্ক্রিপ্ট ব্যাজ অর্জন',
      titleEn: 'TypeScript Badge earned',
      detailBn: 'ইন্টারমিডিয়েট লেভেল ভেরিফাইড ব্যাজ।',
      detailEn: 'Verified Intermediate level badge.',
      time: '৫ দিন আগে',
      score: 100
    }
  ];

  // মেনু অপশনসমূহ (Sidebar Menu Definitions)
  const sidebarMenu = [
    { id: 'dashboard', labelBn: 'ড্যাশবোর্ড হোম', labelEn: 'Dashboard Home', icon: LayoutDashboard },
    { id: 'cv', labelBn: 'এআই সিভি এডিটর', labelEn: 'AI Smart CV', icon: FileText },
    { id: 'interview', labelBn: 'এআই ভাইভা', labelEn: 'AI Interview', icon: Video },
    { id: 'passport', labelBn: 'স্কিল পাসপোর্ট', labelEn: 'Skill Passport', icon: Award },
    { id: 'growth', labelBn: 'ক্যারিয়ার গ্রোথ হাব', labelEn: 'Career Growth Hub', icon: TrendingUp },
    { id: 'roadmap', labelBn: 'ক্যারিয়ার রোডম্যাপ', labelEn: 'Career Roadmap', icon: Map, comingSoon: true },
    { id: 'progress', labelBn: 'অগ্রগতি ট্র্যাকার', labelEn: 'Progress Tracker', icon: BarChart3, comingSoon: true },
    { id: 'reports', labelBn: 'এআই রিপোর্ট ও এক্সপোর্ট', labelEn: 'AI Reports & Export', icon: Download },
    { id: 'profile', labelBn: 'আমার প্রোফাইল', labelEn: 'My Profile', icon: User },
    { id: 'settings', labelBn: 'সেটিংস ও নিরাপত্তা', labelEn: 'Settings & Security', icon: Settings },
  ];

  // প্রোফাইল এডিট সাবমিট (Profile save)
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    const res = await updateProfile({
      fullName: fullNameInput,
      phone: phoneInput,
      education: educationInput,
      experience: experienceInput,
      skills: skillsArray,
      socialLinks: {
        github: githubInput,
        linkedin: linkedinInput
      }
    });

    if (res.success) {
      setIsEditingProfile(false);
      alert(t('profEditSuccess'));
    } else {
      alert(res.error);
    }
  };

  // সেটিংস পরিবর্তন হ্যান্ডলার (Settings update)
  const handleSettingsSave = async () => {
    const res = await updateSettings({
      notificationsEnabled,
      marketingEmails
    });
    if (res.success) {
      alert(t('setSuccess'));
    } else {
      alert(res.error);
    }
  };

  // অ্যাকাউন্ট মুছে ফেলার কনফার্মেশন (Delete account handler)
  const handleDeleteAccountConfirm = async () => {
    const res = await deleteAccount();
    if (res.success) {
      onLogout();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 transition-colors duration-300">
      
      {/* ১. লেফট সাইডবার (Left Sidebar Component) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-[#090909] px-4 py-6 shrink-0 relative z-20">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
            SP
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">SkillProof AI</h1>
            <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold">Bangladesh</p>
          </div>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {sidebarMenu.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-white/5 text-emerald-400 border border-white/10 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-green' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{isBn ? item.labelBn : item.labelEn}</span>
                </div>
                {item.comingSoon && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-green/15 text-brand-green uppercase tracking-wider">
                    {isBn ? 'শীঘ্রই' : 'Soon'}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Card */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <img 
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
              alt="Avatar" 
              className="w-10 h-10 rounded-xl object-cover border border-brand-green/20 shrink-0" 
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">{user?.fullName}</h4>
              <span className="text-[10px] text-slate-400 truncate block mt-0.5">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-all w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* ২. মেইন কন্টেন্ট এরিয়া (Main Content Area with top navbar) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* টপ নেভিগেশন বার (Top Navbar Component) */}
        <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
          
          {/* Left: Hamburger menu for small screens & Search Box */}
          <div className="flex items-center gap-4 flex-1">
            <div className="lg:hidden h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-sm shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              SP
            </div>

            {/* Search inputs */}
            <div className="relative max-w-xs w-full hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder={isBn ? 'অনুসন্ধান করুন...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 text-slate-200"
              />
            </div>
          </div>

          {/* Right: Controls & Utilities */}
          <div className="flex items-center gap-4 relative">
            <LanguageSwitch />
            <ThemeSwitch />
            
            {/* Notification triggers */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-xl relative transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-brand-green rounded-full ring-2 ring-white dark:ring-slate-950" />
              </button>

              {/* Notification Dropdown Panel */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2.5 w-80 glass-panel border border-white/10 text-white rounded-2xl shadow-2xl p-4 overflow-hidden z-50"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-2">
                      <h5 className="font-bold text-xs">{isBn ? 'নোটিফিকেশনসমূহ' : 'Notifications'}</h5>
                      <span className="text-[10px] text-brand-green font-semibold">২টি নতুন</span>
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-2 hover:bg-white/5 rounded-xl transition-all flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-100">{isBn ? n.titleBn : n.titleEn}</span>
                          <span className="text-[10px] text-slate-400 leading-normal">{isBn ? n.descBn : n.descEn}</span>
                          <span className="text-[8px] text-slate-500 mt-1">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Responsive Menu Icon for Mobile */}
            <div className="lg:hidden relative">
              <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-green"
              >
                {sidebarMenu.map((m) => (
                  <option key={m.id} value={m.id}>
                    {isBn ? m.labelBn : m.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* ৩. একটিভ সাবভিউ রেন্ডারিং (Active Tab Content Rendering) */}
        <main className="flex-grow p-6">
          <Breadcrumb 
            items={[
              { label: isBn ? 'ড্যাশবোর্ড' : 'Dashboard', onClick: () => setActiveTab('dashboard') },
              { label: isBn ? sidebarMenu.find(m => m.id === activeTab)?.labelBn || '' : sidebarMenu.find(m => m.id === activeTab)?.labelEn || '' }
            ]} 
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              
              {/* TAB 1: DASHBOARD HOME (হোম ড্যাশবোর্ড) */}
              {activeTab === 'dashboard' && (
                <div className="flex flex-col gap-8">
                  <PageHeader 
                    title={isBn ? `স্বাগতম, ${user?.fullName}` : `Welcome, ${user?.fullName}`}
                    description={isBn ? 'আপনার অর্জিত দক্ষতা এবং পারফরম্যান্স স্কোরের বিবরণ নিচে দেখুন।' : 'Overview of your verified performance scores and acquired badges.'}
                  >
                    <Button variant="primary" size="sm" onClick={() => setActiveTab('cv')}>
                      <Plus className="w-4 h-4" />
                      <span>{isBn ? 'নতুন সিভি আপলোড' : 'Upload New CV'}</span>
                    </Button>
                  </PageHeader>

                  {/* Quick Stats Cards Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard 
                      title={t('statTitleOverall')}
                      value="78%" 
                      subtext={isBn ? 'বিগত পরীক্ষাগুলোর গড়' : 'Average score'} 
                      trend={{ value: "+2.5%", isPositive: true }} 
                      icon={<Cpu className="w-5 h-5" />}
                    />
                    <StatsCard 
                      title={t('statTitleInterviews')}
                      value="03" 
                      subtext={isBn ? '১টি প্রক্রিয়াদীন' : '1 pending approval'} 
                      icon={<Video className="w-5 h-5" />}
                    />
                    <StatsCard 
                      title={t('statTitleBadges')}
                      value="02" 
                      subtext={isBn ? '১টি সিলভার, ১টি গোল্ড' : '1 silver, 1 gold'} 
                      icon={<Award className="w-5 h-5" />}
                    />
                    <StatsCard 
                      title={t('statTitleProgress')}
                      value="+12%" 
                      subtext={isBn ? 'এই সপ্তাহের বৃদ্ধি' : 'Growth this week'} 
                      trend={{ value: "+4.1%", isPositive: true }} 
                      icon={<BarChart3 className="w-5 h-5" />}
                    />
                  </div>

                  {/* Future Feature Placeholders Grid (as beautifully requested) */}
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">
                      {isBn ? 'এআই ফিচার মডিউলসমূহ' : 'AI Feature Modules'}
                    </h3>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {/* CV Feature card */}
                      <Card hoverEffect={false} className="flex flex-col justify-between border border-white/5 bg-[#0c0c0c] hover:border-emerald-500/30 relative group overflow-hidden rounded-3xl p-6 transition-all duration-300">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-12 h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                              <Code2 className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] uppercase font-bold tracking-widest text-slate-500">
                              {t('comingSoon')}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-white text-base">{t('featCvTitle')}</h4>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t('featCvDesc')}</p>
                        </div>
                      </Card>

                      {/* AI Interview card */}
                      <Card hoverEffect={false} className="flex flex-col justify-between border border-white/5 bg-[#0c0c0c] hover:border-cyan-500/30 relative group overflow-hidden rounded-3xl p-6 transition-all duration-300">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-12 h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                              <Video className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] uppercase font-bold tracking-widest text-slate-500">
                              {t('comingSoon')}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-white text-base">{t('featInterviewTitle')}</h4>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t('featInterviewDesc')}</p>
                        </div>
                      </Card>

                      {/* Adaptive Viva card */}
                      <Card hoverEffect={false} className="flex flex-col justify-between border border-white/5 bg-[#0c0c0c] hover:border-purple-500/30 relative group overflow-hidden rounded-3xl p-6 transition-all duration-300">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-12 h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                              <Cpu className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] uppercase font-bold tracking-widest text-slate-500">
                              {t('comingSoon')}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-white text-base">{t('featAdaptiveTitle')}</h4>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t('featAdaptiveDesc')}</p>
                        </div>
                      </Card>

                      {/* Skill Passport card */}
                      <Card hoverEffect={false} className="flex flex-col justify-between border border-white/5 bg-[#0c0c0c] hover:border-emerald-500/30 relative group overflow-hidden rounded-3xl p-6 transition-all duration-300">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-12 h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                              <Award className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] uppercase font-bold tracking-widest text-slate-500">
                              {t('comingSoon')}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-white text-base">{t('featPassportTitle')}</h4>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t('featPassportDesc')}</p>
                        </div>
                      </Card>

                      {/* Roadmap card */}
                      <Card hoverEffect={false} className="flex flex-col justify-between border border-white/5 bg-[#0c0c0c] hover:border-cyan-500/30 relative group overflow-hidden rounded-3xl p-6 transition-all duration-300">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-12 h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                              <Map className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] uppercase font-bold tracking-widest text-slate-500">
                              {t('comingSoon')}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-white text-base">{t('featRoadmapTitle')}</h4>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t('featRoadmapDesc')}</p>
                        </div>
                      </Card>

                      {/* Progress card */}
                      <Card hoverEffect={false} className="flex flex-col justify-between border border-white/5 bg-[#0c0c0c] hover:border-purple-500/30 relative group overflow-hidden rounded-3xl p-6 transition-all duration-300">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-12 h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                              <BarChart3 className="w-6 h-6" />
                            </div>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] uppercase font-bold tracking-widest text-slate-500">
                              {t('comingSoon')}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-white text-base">{t('featProgressTitle')}</h4>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t('featProgressDesc')}</p>
                        </div>
                      </Card>

                    </div>
                  </div>

                  {/* Recent Activity Section */}
                  <Card className="flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="font-display font-bold text-slate-900 dark:text-white">{t('recentActivity')}</h4>
                      <span className="text-xs font-semibold text-slate-400">{isBn ? '৩টি রেকর্ড' : '3 records found'}</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {activities.map((act) => (
                        <div key={act.id} className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                              {act.type === 'cv_uploaded' && <FileText className="w-4 h-4" />}
                              {act.type === 'interview_completed' && <Video className="w-4 h-4" />}
                              {act.type === 'badge_earned' && <Award className="w-4 h-4" />}
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">{isBn ? act.titleBn : act.titleEn}</h5>
                              <p className="text-xs text-slate-500 mt-1">{isBn ? act.detailBn : act.detailEn}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] text-slate-400 font-medium">{act.time}</span>
                            {act.score && <Badge variant={act.score > 80 ? 'brand' : 'info'}>{act.score}%</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 2: AI SMART CV (এআই সিভি এডিটর) */}
              {activeTab === 'cv' && (
                <AiSmartCv 
                  userId={user?.id || 'demo_user_id'} 
                  isBn={isBn} 
                  onBack={() => setActiveTab('dashboard')} 
                />
              )}

              {/* TAB 3: AI LIVE INTERVIEW (এআই লাইভ ইন্টারভিউ) */}
              {activeTab === 'interview' && (
                <AiInterview 
                  userId={user?.id || 'demo_user_id'} 
                  isBn={isBn} 
                  onBack={() => setActiveTab('dashboard')} 
                />
              )}

              {/* TAB 4: AI SKILL PASSPORT (এআই স্কিল পাসপোর্ট) */}
              {activeTab === 'passport' && (
                <AiSkillPassport 
                  onBack={() => setActiveTab('dashboard')} 
                />
              )}

              {/* TAB 5: AI CAREER GROWTH HUB (ক্যারিয়ার গ্রোথ হাব) */}
              {activeTab === 'growth' && (
                <AiCareerGrowth 
                  onNavigateToTab={(tabId) => setActiveTab(tabId)} 
                />
              )}

              {/* TAB 2-7: FEATURE PLACEHOLDERS REDIRECTED TO THE DASHBOARD PAGE VIEW */}
              {['roadmap', 'progress'].includes(activeTab) && (
                <div className="max-w-4xl mx-auto py-12 flex flex-col gap-6">
                  <PageHeader 
                    title={isBn ? `${sidebarMenu.find(m => m.id === activeTab)?.labelBn} - ফিচার মডিউল` : `${sidebarMenu.find(m => m.id === activeTab)?.labelEn} Feature Module`}
                    description={isBn ? 'এই মডিউলটি পরবর্তী ধাপে এআই ইন্টিগ্রেশন এর মাধ্যমে উন্মুক্ত করা হবে।' : 'This module will be fully integrated with AI models in the subsequent phase.'}
                  />
                  <Card className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-green/15 to-brand-blue/15 text-brand-green flex items-center justify-center mb-6">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
                      {isBn ? 'এআই ফিচার ইন্টিগ্রেশন লোড হচ্ছে...' : 'AI Feature Integration Pending'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
                      {isBn 
                        ? 'এটি চমৎকার একটি ফিচার ভিত্তিপ্রস্তর। পরবর্তী প্রম্পটসমূহে আমরা সম্পূর্ণ এআই সিভি এডিটিং সেশন, ভাইভা এবং ক্যারিয়ার স্কিল রিয়েল-টাইম ইন্টিগ্রেট করবো।' 
                        : 'This page represents a stunning layout foundation. In the upcoming prompts, we will hook up real-time live AI models to evaluate your skills.'}
                    </p>
                    <Badge variant="brand">{t('comingSoon')}</Badge>
                  </Card>
                </div>
              )}

              {/* TAB 8: AI REPORTS & EXPORT (এআই রিপোর্ট ও এক্সপোর্ট) */}
              {activeTab === 'reports' && (
                <AiReports onNavigateToTab={(tabId) => setActiveTab(tabId)} />
              )}

              {/* TAB 9: PROFILE PAGE (আমার প্রোফাইল) */}
              {activeTab === 'profile' && (
                <div className="max-w-4xl mx-auto flex flex-col gap-8">
                  <PageHeader 
                    title={t('menuProfile')}
                    description={isBn ? 'পেশাদার ও কারিগরি তথ্যসমূহ এডিট ও আপডেট করুন।' : 'Update your personal details, academic accomplishments, and skills portfolio.'}
                  >
                    {!isEditingProfile && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                        <Edit2 className="w-4 h-4" />
                        <span>{isBn ? 'এডিট করুন' : 'Edit Profile'}</span>
                      </Button>
                    )}
                  </PageHeader>

                  {isEditingProfile ? (
                    <Card className="bg-white dark:bg-slate-900">
                      <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
                        <div className="grid md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500">{t('authFullName')}</label>
                            <input 
                              type="text" 
                              value={fullNameInput}
                              onChange={(e) => setFullNameInput(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500">{isBn ? 'ফোন নম্বর' : 'Phone Number'}</label>
                            <input 
                              type="text" 
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-500">{t('profEducation')}</label>
                          <input 
                            type="text" 
                            value={educationInput}
                            onChange={(e) => setEducationInput(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-500">{t('profExperience')}</label>
                          <textarea 
                            value={experienceInput}
                            onChange={(e) => setExperienceInput(e.target.value)}
                            rows={3}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-500">{t('profSkills')} (কমা দিয়ে আলাদা করুন)</label>
                          <input 
                            type="text" 
                            value={skillsInput}
                            onChange={(e) => setSkillsInput(e.target.value)}
                            placeholder="React, TypeScript, CSS"
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500">GitHub Link</label>
                            <input 
                              type="text" 
                              value={githubInput}
                              onChange={(e) => setGithubInput(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500">LinkedIn Link</label>
                            <input 
                              type="text" 
                              value={linkedinInput}
                              onChange={(e) => setLinkedinInput(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-4">
                          <Button variant="outline" type="button" onClick={() => setIsEditingProfile(false)}>
                            {t('cancel')}
                          </Button>
                          <Button variant="primary" type="submit">
                            {t('save')}
                          </Button>
                        </div>
                      </form>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                      {/* Avatar & Basics */}
                      <Card className="md:col-span-1 flex flex-col items-center text-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <img 
                          src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                          alt="Avatar" 
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-brand-green/20" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{user?.fullName}</h3>
                          <span className="text-xs text-slate-400 block mt-1">{user?.email}</span>
                          {user?.phone && <span className="text-xs text-slate-400 block mt-0.5">{user.phone}</span>}
                        </div>

                        {/* Social linkages */}
                        <div className="flex gap-3 mt-2">
                          {user?.socialLinks?.github && (
                            <a href={user.socialLinks.github} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-mono">
                              GitHub
                            </a>
                          )}
                          {user?.socialLinks?.linkedin && (
                            <a href={user.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-mono">
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </Card>

                      {/* Professional details */}
                      <div className="md:col-span-2 flex flex-col gap-6">
                        {/* Education */}
                        <Card className="flex flex-col gap-3">
                          <div className="flex items-center gap-2.5 text-brand-green pb-2 border-b border-slate-100 dark:border-slate-800">
                            <GraduationCap className="w-5 h-5" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('profEducation')}</h4>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {user?.education || (isBn ? 'কোনো শিক্ষাগত যোগ্যতা এখনও যোগ করা হয়নি।' : 'No academic highlights updated yet.')}
                          </p>
                        </Card>

                        {/* Experience */}
                        <Card className="flex flex-col gap-3">
                          <div className="flex items-center gap-2.5 text-brand-blue pb-2 border-b border-slate-100 dark:border-slate-800">
                            <Briefcase className="w-5 h-5" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('profExperience')}</h4>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {user?.experience || (isBn ? 'কোনো কাজের অভিজ্ঞতা এখনও যোগ করা হয়নি।' : 'No professional logs updated yet.')}
                          </p>
                        </Card>

                        {/* Skills Passport badges spotlight */}
                        <Card className="flex flex-col gap-3">
                          <div className="flex items-center gap-2.5 text-purple-500 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <Award className="w-5 h-5" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('profSkills')}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {user?.skills.map((skill, index) => (
                              <Badge key={index} variant="brand">{skill}</Badge>
                            ))}
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 10: SETTINGS PAGE (সেটিংস ও নিরাপত্তা) */}
              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto flex flex-col gap-8">
                  <PageHeader 
                    title={t('menuSettings')}
                    description={isBn ? 'আপনার প্রোফাইলের থিম, ভাষা এবং নিরাপত্তা সেটিংস কাস্টমাইজ করুন।' : 'Manage UI layouts, choose preferred language, and secure your account credentials.'}
                  />

                  {/* Themes / Languages / Notifications Card */}
                  <Card className="flex flex-col gap-6 bg-white dark:bg-slate-900">
                    {/* Localization */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('setLang')}</h4>
                        <p className="text-xs text-slate-400 mt-1">{isBn ? 'প্ল্যাটফর্মের ভাষা পরিবর্তন করুন।' : 'Switch core platform localization.'}</p>
                      </div>
                      <LanguageSwitch />
                    </div>

                    {/* Theme */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('setTheme')}</h4>
                        <p className="text-xs text-slate-400 mt-1">{isBn ? 'চোখের সুরক্ষায় ডার্ক বা লাইট থিম পরিবর্তন করুন।' : 'Switch between eye-safe dark slate and high-contrast light formats.'}</p>
                      </div>
                      <ThemeSwitch />
                    </div>

                    {/* Email / Notification settings */}
                    <div className="flex flex-col gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('setNotify')}</h4>
                        <p className="text-xs text-slate-400 mt-1">{isBn ? 'আপনার এআই সেশন এবং ফলাফলের নোটিফিকেশন।' : 'Configure alert metrics for finished AI summaries and badge awards.'}</p>
                      </div>
                      <div className="flex flex-col gap-3 mt-2">
                        <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                          <input 
                            type="checkbox" 
                            checked={notificationsEnabled}
                            onChange={(e) => setNotificationsEnabled(e.target.checked)}
                            className="rounded-lg text-brand-green focus:ring-brand-green h-4 w-4 bg-slate-950 border-slate-800"
                          />
                          <span>{isBn ? 'ইন-অ্যাপ রিয়েল-টাইম নোটিফিকেশন সচল রাখুন' : 'Enable real-time push and in-app alerts'}</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                          <input 
                            type="checkbox" 
                            checked={marketingEmails}
                            onChange={(e) => setMarketingEmails(e.target.checked)}
                            className="rounded-lg text-brand-green focus:ring-brand-green h-4 w-4 bg-slate-950 border-slate-800"
                          />
                          <span>{isBn ? 'ইমেইল এর মাধ্যমে ক্যারিয়ার টিপস এবং সাপ্তাহিক আপডেট পান' : 'Send weekly career roadmaps and tip digests to my inbox'}</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button variant="primary" size="sm" onClick={handleSettingsSave}>
                        {t('save')}
                      </Button>
                    </div>
                  </Card>

                  {/* Danger Zone */}
                  <Card className="border border-red-500/20 bg-red-500/[0.02] flex flex-col gap-4">
                    <div className="flex items-start gap-3 pb-3 border-b border-red-500/10">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-500 text-sm">{t('setDanger')}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('setDeleteWarning')}</p>
                      </div>
                    </div>
                    <div>
                      <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                        {t('setDeleteBtn')}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <footer className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-4 mt-12 border-t border-white/5 gap-4">
            <p className="text-[10px] text-slate-600 font-mono">© {new Date().getFullYear()} SKILLPROOF AI BANGLADESH • SECURE_ENV_PROD_V1</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Supabase Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Server Latency: 42ms</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* কনফার্মেশন ডায়ালগ (Delete Account confirmation popup) */}
      <ConfirmationDialog 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccountConfirm}
        title={isBn ? 'অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলবেন?' : 'Confirm Permanent Account Deletion'}
        message={isBn 
          ? 'আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্টটি মুছে ফেলতে চান? এটি আপনার সমস্ত ভেরিফাইড প্রজেক্ট, সিভি ফাইল এবং অর্জিত স্কিল পাসপোর্ট চিরতরে মুছে ফেলবে।' 
          : 'Are you absolutely sure? This will permanently delete your profiles, skills certificates, and download archives. This operation is irreversible.'}
        confirmText={isBn ? 'মুছে ফেলুন' : 'Delete Now'}
        cancelText={t('cancel')}
        isDanger
      />

    </div>
  );
};
