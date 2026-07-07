/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Eye, Share2, Download, Copy, ExternalLink, Calendar, 
  CheckCircle, ShieldCheck, ChevronRight, RefreshCw, Smartphone, 
  Linkedin, Facebook, Mail, Sparkles, User, Briefcase, Award as BadgeIcon, 
  Clock, TrendingUp, HelpCircle, X, Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge } from './UI';
import { passportDb, calculateLevel } from '../lib/passportSupabase';
import { SkillPassport, PassportSkill, PassportHistoryItem } from '../types/passport';
import { SkillsOverview } from './SkillsOverview';

export const AiSkillPassport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { isBn, t } = useLanguage();
  const { user } = useAuth();
  
  // স্টেট ম্যানেজমেন্ট (State Management)
  const [loading, setLoading] = useState(true);
  const [passport, setPassport] = useState<SkillPassport | null>(null);
  const [skills, setSkills] = useState<PassportSkill[]>([]);
  const [history, setHistory] = useState<PassportHistoryItem[]>([]);
  const [activeHistoryDetail, setActiveHistoryDetail] = useState<PassportHistoryItem | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPassportCardModal, setShowPassportCardModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // ডাটাবেজ থেকে ডাটা লোড ও সিঙ্ক করা (Load and sync data from passport DB)
  const loadPassportData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // স্বয়ংক্রিয়ভাবে সিঙ্কসহ লোড করবে
      const p = await passportDb.getPassportByUserId(user.id, user.fullName, user.avatarUrl);
      if (p) {
        setPassport(p);
        const s = await passportDb.getSkillsByUserId(user.id);
        setSkills(s);
        const h = await passportDb.getHistoryByUserId(user.id);
        setHistory(h);
      }
    } catch (err) {
      console.error("Error loading Skill Passport:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassportData();
  }, [user]);

  // লিঙ্ক কপি করা (Copy shareable profile link)
  const handleCopyLink = () => {
    if (!passport) return;
    const publicUrl = `${window.location.origin}/passport/${passport.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // কিউআর কোড ডাউনলোড করা (Download QR Code image)
  const handleDownloadQR = () => {
    if (!passport) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      `${window.location.origin}/passport/${passport.id}`
    )}`;
    
    // Fetch and download the QR code image
    fetch(qrUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SPAI-Passport-QR-${passport.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => console.error("Error downloading QR:", err));
  };

  // এআই স্কিল পাসপোর্ট কার্ড প্রিন্ট/ডাউনলোড করা (Trigger Print layout for Premium Passport Card)
  const handlePrintCard = () => {
    window.print();
  };

  const handleDownloadFullPassport = () => {
    window.print();
  };

  // লোডিং অ্যানিমেশন কঙ্কাল (Loading Skeleton UI)
  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-40 bg-slate-900 border border-white/5 rounded-3xl" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-slate-900 border border-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-900 border border-white/5 rounded-3xl" />
      </div>
    );
  }

  // যদি কোনো ইন্টারভিউ ডাটা না থাকে (Empty State if no interviews completed yet)
  if (!passport || history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex flex-col gap-6">
        <Card className="flex flex-col items-center justify-center text-center p-12 bg-slate-900 border border-white/5 shadow-xl">
          <div className="h-16 w-16 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-6">
            <Award className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold font-display text-white mb-2">
            {isBn ? 'আপনার ডিজিটাল স্কিল পাসপোর্ট এখনও প্রস্তুত নয়!' : 'Your Digital Skill Passport is not ready yet!'}
          </h3>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
            {isBn 
              ? 'আমাদের এআই স্কিল পাসপোর্ট সিস্টেমটি সম্পূর্ণ স্বয়ংক্রিয়। প্রথম মৌখিক পরীক্ষা (AI Interview) সম্পন্ন করার সাথে সাথেই আপনার কাজের অভিজ্ঞতা এবং অর্জিত দক্ষতার ওপর ভিত্তি করে রিয়েল-টাইম পাসপোর্ট কার্ড এবং ইউনিক ভেরিফিকেশন আইডি জেনারেট হবে।' 
              : 'Our AI Skill Passport system is fully automated. As soon as you complete your first AI Q&A Interview, your verified skills and level will grow automatically based on your actual performance.'}
          </p>
          <Button variant="primary" onClick={onBack}>
            {isBn ? 'ইন্টারভিউ শুরু করুন' : 'Start Your First Interview'}
          </Button>
        </Card>
      </div>
    );
  }

  const publicProfileUrl = `${window.location.origin}/passport/${passport.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicProfileUrl)}`;

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* ১. পাসপোর্ট হেডার (PASSPORT HEADER PANEL) */}
      <Card className="relative overflow-hidden border border-white/5 bg-[#0a0a0a] rounded-3xl p-6 lg:p-8 group shadow-2xl">
        {/* Glow backdrop decorative */}
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-500" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* বামদিক: প্রোফাইল তথ্য এবং মেটাডাটা */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-6">
            <div className="relative">
              <img 
                src={passport.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                alt="Profile avatar" 
                className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1 rounded-lg border border-slate-950 shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h2 className="text-2xl font-bold font-display text-white">{passport.fullName}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                  {isBn ? 'ভেরিফাইড লাইভ' : 'Verified Live'}
                </span>
              </div>
              
              <p className="text-sm text-slate-400 font-medium mt-1.5 flex items-center justify-center sm:justify-start gap-2">
                <Briefcase className="w-4 h-4 text-emerald-500" />
                <span>{passport.careerPath}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-500 font-mono">
                <div>
                  <span className="text-slate-400 font-bold">{isBn ? 'পাসপোর্ট আইডি:' : 'Passport ID:'}</span> {passport.id}
                </div>
                <div className="hidden sm:block h-3 w-[1px] bg-white/10" />
                <div>
                  <span className="text-slate-400 font-bold">{isBn ? 'স্ট্যাটাস:' : 'Status:'}</span> {passport.verificationStatus}
                </div>
              </div>
            </div>
          </div>

          {/* ডানদিক: ওভারঅল স্কোর, লেভেল উইজেট ও অ্যাকশন বাটন */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6 border-t lg:border-t-0 border-white/5 pt-6 lg:pt-0 shrink-0">
            {/* স্কোর উইজেট */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
              <div className="text-center">
                <div className="text-3xl font-black font-mono text-emerald-400">{passport.readinessScore}%</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                  {isBn ? 'প্রস্তুতি স্কোর' : 'Readiness Score'}
                </div>
              </div>
              <div className="h-8 w-[1px] bg-white/10" />
              <div className="text-center">
                <div className="text-lg font-black font-display text-cyan-400 uppercase tracking-tight">{passport.level}</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                  {isBn ? 'দক্ষতা লেভেল' : 'Skill Level'}
                </div>
              </div>
            </div>

            {/* অ্যাকশন বাটনসমূহ */}
            <div className="flex flex-row sm:flex-col lg:flex-row gap-2.5 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadFullPassport}
                className="flex-1 sm:flex-none justify-center print:hidden"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>{isBn ? 'ডাউনলোড' : 'Download'}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowShareModal(true)}
                className="flex-1 sm:flex-none justify-center print:hidden"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>{isBn ? 'শেয়ার' : 'Share'}</span>
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setShowPassportCardModal(true)}
                className="flex-1 sm:flex-none justify-center print:hidden"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isBn ? 'ডিজিটাল কার্ড' : 'Digital Card'}</span>
              </Button>
            </div>
          </div>

        </div>
      </Card>

      {/* ২. দক্ষতা ওভারভিউ চার্ট (SKILLS VISUAL OVERVIEW) */}
      <SkillsOverview skills={skills} />

      {/* ৩. স্কিল গ্রিড এরিয়া (SKILL PASSPORT BENTO GRID) */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-display font-bold text-xl text-white">
              {isBn ? 'ভেরিফাইড দক্ষতা পাসপোর্ট কার্ড' : 'Verified Skill Passport Cards'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isBn ? 'আপনার ইন্টারভিউ পারফরম্যান্স থেকে স্বয়ংক্রিয়ভাবে মূল্যায়িত দক্ষতাসমূহ।' : 'Skills evaluated automatically from actual interview transcripts.'}
            </p>
          </div>
          <button 
            onClick={loadPassportData} 
            className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-slate-400 hover:text-white"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {skills.map((skill, index) => {
            const levelColor = {
              Beginner: 'text-slate-400 border-slate-500/20 bg-slate-500/5',
              Bronze: 'text-amber-600 border-amber-600/20 bg-amber-600/5',
              Silver: 'text-slate-300 border-slate-300/20 bg-slate-300/5',
              Gold: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
              Platinum: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5',
              Expert: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
            }[skill.level];

            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative overflow-hidden bg-[#0c0c0c] border border-white/5 hover:border-emerald-500/20 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Visual design flair */}
                <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-emerald-500/5 transition-all" />

                <div className="flex flex-col gap-4">
                  {/* নাম এবং ভেরিফিকেশন ব্যাজ */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base text-slate-100 group-hover:text-white transition-colors">
                        {skill.skillName}
                      </h4>
                      <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                        {skill.id}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border ${levelColor}`}>
                      {skill.level}
                    </span>
                  </div>

                  {/* প্রোগ্রেস ও স্কোর ইন্ডিকেটর */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-mono">
                        {isBn ? 'দক্ষতা স্কোর' : 'Skill Score'}
                      </span>
                      <span className="text-2xl font-black font-mono text-white mt-1 block">
                        {skill.score}%
                      </span>
                    </div>

                    {skill.progress > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/25">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+{skill.progress}%</span>
                      </div>
                    )}
                  </div>

                  {/* প্রোগ্রেস বার */}
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>

                  {/* ফুটার মেটাডাটা */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(skill.lastAssessmentDate).toLocaleDateString()}</span>
                    </span>
                    <a 
                      href={`/verify/${skill.id}`}
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 group/link"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(`/verify/${skill.id}`, '_blank');
                      }}
                    >
                      <span>{isBn ? 'যাচাই' : 'Verify'}</span>
                      <ExternalLink className="w-2.5 h-2.5 transition-transform group-hover/link:translate-x-0.5" />
                    </a>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ৩. অ্যাসেসমেন্ট হিস্ট্রি টাইমলাইন (ASSESSMENT HISTORY TIMELINE) */}
      <Card className="flex flex-col gap-6 border border-white/5 bg-[#0a0a0a] rounded-3xl p-6 lg:p-8">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              {isBn ? 'অ্যাসেসমেন্ট হিস্ট্রি টাইমলাইন' : 'Assessment History Timeline'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isBn ? 'আপনার সম্পন্ন করা ইন্টারভিউগুলোর ক্রমানুসারী ধারা এবং অগ্রগতি।' : 'Chrono-timeline tracking your growth and evaluation progression.'}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {history.length} {isBn ? 'রেকর্ড' : 'Records'}
          </span>
        </div>

        <div className="relative pl-6 sm:pl-8 border-l border-white/10 flex flex-col gap-8 py-2">
          {history.map((item, index) => (
            <div key={item.id} className="relative group">
              
              {/* টাইমলাইন নড আইকন */}
              <div className="absolute -left-[35px] sm:-left-[43px] top-1 h-6 h-6 w-6 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center text-[10px] font-bold text-emerald-400 shadow-md group-hover:scale-110 transition-transform">
                {history.length - index}
              </div>

              {/* কন্টেন্ট বক্স */}
              <div 
                onClick={() => setActiveHistoryDetail(item)}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/20 rounded-2xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-white">
                      {item.interviewTitle}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">({item.id})</span>
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {item.improvement}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <div className="text-right">
                    <div className="text-xl font-black font-mono text-white">{item.score}%</div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                      {isBn ? 'মোট স্কোর' : 'Session Score'}
                    </span>
                  </div>
                  
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform hidden sm:block" />
                </div>
              </div>

            </div>
          ))}
        </div>
      </Card>

      {/* ৪. হিস্ট্রি ডিটেল মোডাল (History Detail Dialog Modal) */}
      <AnimatePresence>
        {activeHistoryDetail && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0c] border border-white/10 rounded-3xl max-w-lg w-full p-6 text-white relative shadow-2xl"
            >
              <button 
                onClick={() => setActiveHistoryDetail(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 text-emerald-400 mb-4">
                <Award className="w-6 h-6" />
                <h3 className="text-lg font-bold font-display">
                  {isBn ? 'ইন্টারভিউ সেশন রিপোর্ট' : 'Interview Assessment Report'}
                </h3>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{activeHistoryDetail.interviewTitle}</h4>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">ID: {activeHistoryDetail.id}</span>
                  </div>
                  <div className="text-center bg-emerald-500/10 border border-emerald-500/25 px-4 py-2 rounded-xl">
                    <span className="text-2xl font-black font-mono text-emerald-400 block">{activeHistoryDetail.score}%</span>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400">Score</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs font-semibold">{isBn ? 'অ্যাসেসমেন্ট তারিখ:' : 'Assessment Date:'}</span>
                  <p className="text-sm text-slate-200 font-mono">{new Date(activeHistoryDetail.date).toLocaleString()}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs font-semibold">{isBn ? 'অগ্রগতি ও মানোন্নয়ন:' : 'Progression:'}</span>
                  <p className="text-sm text-emerald-400 font-semibold">{activeHistoryDetail.improvement}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs font-semibold">{isBn ? 'দক্ষতা লেভেল:' : 'Skill Level at Session:'}</span>
                  <p className="text-sm text-cyan-400 font-bold">{activeHistoryDetail.level}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs font-semibold">{isBn ? 'বিশ্লেষণ সামারি:' : 'Assessment Summary:'}</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 whitespace-pre-line">
                    {activeHistoryDetail.summary}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setActiveHistoryDetail(null)}>
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ৫. শেয়ার অপশন মোডাল (SHARE DIALOG MODAL) */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0c] border border-white/10 rounded-3xl max-w-md w-full p-6 text-white relative shadow-2xl"
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2 mb-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <span>{isBn ? 'পাসপোর্ট পাবলিকলি শেয়ার করুন' : 'Share Skill Passport'}</span>
              </h3>
              <p className="text-xs text-slate-400 leading-normal mb-5">
                {isBn 
                  ? 'এই পাবলিক লিঙ্ক এবং কিউআর কোডটি আপনার রেজুমে, লিঙ্কডইন প্রোফাইল বা ইমেইল সিগনেচারে ব্যবহার করুন।' 
                  : 'Share your official public Skill Passport. Recruiter, clients, and partners can instantly verify your competence without logins.'}
              </p>

              <div className="flex flex-col gap-4">
                {/* লিঙ্ক কপি উইজেট */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-xl">
                  <input 
                    type="text" 
                    readOnly 
                    value={publicProfileUrl}
                    className="bg-transparent flex-1 text-xs text-slate-300 font-mono px-2 focus:outline-none overflow-x-auto"
                  />
                  <Button 
                    variant={copied ? 'primary' : 'outline'} 
                    size="sm" 
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isBn ? 'কপিড' : 'Copied') : (isBn ? 'কপি' : 'Copy')}</span>
                  </Button>
                </div>

                {/* কিউআর কোড ডিসপ্লে */}
                <div className="flex flex-col items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <img 
                    src={qrCodeUrl} 
                    alt="Passport QR Code" 
                    className="w-40 h-40 bg-white p-2 rounded-xl border border-white/10"
                  />
                  <span className="text-[10px] text-slate-400 text-center leading-normal">
                    {isBn ? 'স্ক্যান করলে সরাসরি পাবলিক ভেরিফাইড প্রোফাইল ওপেন হবে' : 'Scanning loads live verified skill profile page'}
                  </span>
                  
                  <div className="flex gap-2 w-full">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadQR}
                      className="flex-1 justify-center"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isBn ? 'কিউআর ডাউনলোড' : 'Download QR'}</span>
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => window.open(publicProfileUrl, '_blank')}
                      className="flex-1 justify-center text-xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{isBn ? 'প্রোফাইল দেখুন' : 'View Profile'}</span>
                    </Button>
                  </div>
                </div>

                {/* সোশাল মিডিয়া শেয়ার */}
                <div className="flex justify-center gap-4 pt-2">
                  <a 
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicProfileUrl)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="h-10 w-10 bg-[#0077b5]/15 border border-[#0077b5]/30 hover:bg-[#0077b5]/25 rounded-xl flex items-center justify-center text-[#0077b5] transition-all"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicProfileUrl)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="h-10 w-10 bg-[#1877f2]/15 border border-[#1877f2]/30 hover:bg-[#1877f2]/25 rounded-xl flex items-center justify-center text-[#1877f2] transition-all"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a 
                    href={`mailto:?subject=${encodeURIComponent('Verified AI Skill Passport')}&body=${encodeURIComponent(`Check out my verified skill assessment report: ${publicProfileUrl}`)}`}
                    className="h-10 w-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-200 transition-all"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setShowShareModal(false)}>
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ৬. এআই স্কিল কার্ড মোডাল (PREMIUM DOWNLOADABLE CARD VIEW) */}
      <AnimatePresence>
        {showPassportCardModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#090909] border border-white/10 rounded-3xl max-w-2xl w-full p-6 lg:p-8 text-white relative shadow-2xl"
            >
              {/* প্রিন্ট লেআউটের জন্য স্ক্রিন-অলি ক্লোজ বাটন */}
              <button 
                onClick={() => setShowPassportCardModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all print:hidden"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6 print:hidden">
                <h3 className="text-xl font-bold font-display text-white">
                  {isBn ? 'আপনার প্রিমিয়াম ডিজিটাল স্কিল কার্ড' : 'Your Premium Digital Skill Card'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isBn ? 'নিচে আপনার কার্ডের লাইভ প্রিভিউ রয়েছে। আপনি এটি ডাউনলোড বা ডাইরেক্ট প্রিন্ট করতে পারেন।' : 'Stunning glass-cyberpunk layout ready to embed or print.'}
                </p>
              </div>

              {/* ৩.২. কার্ডের মূল বডি (THE PREMIUM DIGITAL BADGE/CARD MARKUP) */}
              <div 
                id="printable-skill-card"
                className="mx-auto w-full max-w-md bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col gap-5 print:border-emerald-500"
              >
                {/* Cyberpunk grid overlay lines inside premium layout */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

                {/* কার্ড হেডার */}
                <div className="flex justify-between items-center pb-3 border-b border-white/10 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-sm">
                      SP
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight tracking-tight text-white">SkillProof AI</h4>
                      <span className="text-[7px] uppercase tracking-widest text-emerald-500 font-bold font-mono">Bangladesh</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded text-[7px] font-bold tracking-widest uppercase">
                      VERIFIED ASSESSMENT
                    </span>
                  </div>
                </div>

                {/* ইউজার ডেমোগ্রাফিক ও ইনফো */}
                <div className="flex items-center gap-4 relative z-10">
                  <img 
                    src={passport.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-lg shrink-0"
                  />
                  <div className="overflow-hidden">
                    <h3 className="text-base font-bold text-slate-100 truncate">{passport.fullName}</h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{passport.careerPath}</p>
                    <div className="text-[8px] font-mono text-slate-500 mt-1 block">ID: {passport.id}</div>
                  </div>
                </div>

                {/* স্কিল হাইলাইট সেকশন */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 relative z-10">
                  <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold font-mono block mb-2">
                    {isBn ? 'টপ ভেরিফাইড স্কিলসমূহ' : 'Top Verified Skills'}
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {skills.slice(0, 4).map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-slate-950/40 border border-white/5 px-2.5 py-1 rounded-lg">
                        <span className="text-xs text-slate-300 font-medium truncate pr-1">{s.skillName}</span>
                        <span className="text-[10px] font-bold font-mono text-emerald-400 shrink-0">{s.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* সামগ্রিক স্কোর ও কিউআর */}
                <div className="flex items-center justify-between gap-4 mt-1 relative z-10">
                  
                  {/* বামদিক: মেকানিক্স স্কোর */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                        <span className="text-slate-500 text-[7px] font-bold block tracking-wider uppercase">Readiness</span>
                        <span className="text-base font-black font-mono text-emerald-400 block mt-0.5">{passport.readinessScore}%</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                        <span className="text-slate-500 text-[7px] font-bold block tracking-wider uppercase">Level</span>
                        <span className="text-xs font-black font-display text-cyan-400 block mt-1 uppercase leading-none">{passport.level}</span>
                      </div>
                    </div>
                    
                    <div className="text-[7px] text-slate-500 font-mono leading-relaxed">
                      <div>Issued: {new Date(passport.createdAt).toLocaleDateString()}</div>
                      <div>Updated: {new Date(passport.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* ডানদিক: ভেরিফিকেশন কিউআর কোড */}
                  <div className="flex flex-col items-center gap-1">
                    <img 
                      src={qrCodeUrl} 
                      alt="Verification QR" 
                      className="w-16 h-16 bg-white p-1 rounded-lg"
                    />
                    <span className="text-[6px] text-slate-500 uppercase tracking-wider font-bold">
                      SCAN TO VERIFY
                    </span>
                  </div>

                </div>
              </div>

              {/* ডাউনলোডিং/প্রিন্টিং কন্ট্রোল */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center print:hidden">
                <Button variant="outline" onClick={() => setShowPassportCardModal(false)}>
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </Button>
                <Button variant="primary" onClick={handlePrintCard}>
                  <Download className="w-4 h-4" />
                  <span>{isBn ? 'কার্ড ডাউনলোড / প্রিন্ট' : 'Download / Print Card'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
