import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Eye, Share2, Download, Copy, ExternalLink, Calendar, 
  CheckCircle, ShieldCheck, ChevronRight, RefreshCw, Smartphone, 
  Linkedin, Facebook, Mail, Sparkles, User, Briefcase, Award as BadgeIcon, 
  Clock, TrendingUp, HelpCircle, X, Check, Printer, FileDown, Image as ImageIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge } from './UI';
import { passportDb, calculateLevel } from '../lib/passportSupabase';
import { SkillPassport, PassportSkill, PassportHistoryItem } from '../types/passport';
import { SkillsOverview } from './SkillsOverview';

export const AiSkillPassport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { isBn, t } = useLanguage();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // স্টেট ম্যানেজমেন্ট
  const [loading, setLoading] = useState(true);
  const [passport, setPassport] = useState<SkillPassport | null>(null);
  const [skills, setSkills] = useState<PassportSkill[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ডাটাবেজ থেকে ডাটা লোড ও সিঙ্ক করা
  const loadPassportData = async (forceSync = false) => {
    if (!user) return;
    setLoading(true);
    try {
      let p = await passportDb.getPassportByUserId(user.id);
      
      // যদি পাসপোর্ট না থাকে বা ফোর্স সিঙ্ক করতে হয়, অথবা নাম/ছবি আপডেট হয়
      if (!p || forceSync || p.fullName !== user.fullName || p.avatarUrl !== user.avatarUrl) {
        p = await passportDb.syncPassport(user.id, user);
      }
      
      if (p) {
        setPassport(p);
        const s = await passportDb.getSkillsByUserId(user.id);
        setSkills(s);
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

  const publicProfileUrl = passport ? `${window.location.origin}/verify/${passport.id}` : '';

  // লিঙ্ক কপি করা
  const handleCopyLink = () => {
    if (!publicProfileUrl) return;
    navigator.clipboard.writeText(publicProfileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // পিডিএফ ডাউনলোড
  const handleDownloadPDF = async () => {
    if (!cardRef.current || !passport) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Skill-Passport-${passport.id}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // পিএনজি ডাউনলোড
  const handleDownloadPNG = async () => {
    if (!cardRef.current || !passport) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `Skill-Passport-${passport.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-48 bg-slate-900/50 border border-white/5 rounded-3xl" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-900/50 border border-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Card className="flex flex-col items-center text-center p-12 bg-slate-900 border border-white/5 shadow-xl">
          <Award className="w-16 h-16 text-emerald-500 mb-6 animate-bounce" />
          <h3 className="text-2xl font-bold text-white mb-4">
            {isBn ? 'আপনার ডিজিটাল স্কিল পাসপোর্ট প্রস্তুত নয়' : 'Digital Skill Passport Not Ready'}
          </h3>
          <p className="text-slate-400 mb-8 max-w-md">
            {isBn 
              ? 'পাসপোর্ট জেনারেট করার জন্য আপনাকে অবশ্যই একটি রেজুমে অ্যানালাইসিস এবং অন্তত একটি ইন্টারভিউ সেশন সম্পূর্ণ করতে হবে।' 
              : 'To generate your passport, you must complete resume analysis and at least one AI interview session.'}
          </p>
          <Button variant="primary" onClick={onBack}>
            {isBn ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12 print:p-0 print:bg-white">
      
      {/* অ্যাকশন বার */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-white font-display">
            {isBn ? 'ডিজিটাল স্কিল পাসপোর্ট' : 'Digital Skill Passport'}
          </h2>
          <p className="text-sm text-slate-400">
            {isBn ? 'আপনার প্রোফাইল ভেরিফিকেশন এবং দক্ষতার প্রমাণপত্র' : 'Your verified profile and skill credential'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => loadPassportData(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {isBn ? 'আপডেট' : 'Sync'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowShareModal(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            {isBn ? 'শেয়ার' : 'Share'}
          </Button>
        </div>
      </div>

      {/* ১. পাসপোর্ট সার্টিফিকেট ডিজাইন */}
      <div 
        id="cv-print-area"
        ref={cardRef}
        className="bg-white text-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-emerald-50/50 relative print:shadow-none print:border-none"
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Award className="w-40 h-40" />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-emerald-600 font-black text-2xl">SP</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none">SkillProof AI Bangladesh</h1>
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Certified Digital Skill Passport</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
              <span className="text-[10px] uppercase font-bold tracking-widest block opacity-70">Passport ID</span>
              <span className="text-xl font-black font-mono tracking-tighter">{passport.id}</span>
            </div>
          </div>
        </div>

        <div className="p-8 grid lg:grid-cols-12 gap-8 relative z-10">
          <div className="lg:col-span-4 flex flex-col items-center text-center gap-4">
            <div className="relative group">
              <img 
                src={user?.avatarUrl || passport.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} 
                alt="Avatar" 
                className="w-48 h-48 rounded-[2rem] object-cover border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full shadow-lg border border-emerald-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase text-emerald-600">Verified Identity</span>
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-black text-slate-900 leading-tight">{user?.fullName || passport.fullName}</h2>
              <p className="text-emerald-600 font-bold text-sm mt-1">{passport.careerPath}</p>
            </div>
            <div className="w-full h-[1px] bg-slate-100 my-2" />
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Issue Date</span>
                <span className="text-xs font-bold text-slate-700">{new Date(passport.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Status</span>
                <span className="text-xs font-bold text-emerald-600">Active</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl text-center">
                <span className="text-[9px] uppercase font-bold text-emerald-600 block mb-1">Resume</span>
                <span className="text-2xl font-black font-mono text-emerald-700">{passport.resumeScore || 0}%</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl text-center">
                <span className="text-[9px] uppercase font-bold text-blue-600 block mb-1">ATS Score</span>
                <span className="text-2xl font-black font-mono text-blue-700">{passport.atsScore || 0}%</span>
              </div>
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-3xl text-center">
                <span className="text-[9px] uppercase font-bold text-purple-600 block mb-1">Interview</span>
                <span className="text-2xl font-black font-mono text-purple-700">{passport.interviewScore || 0}%</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl text-center">
                <span className="text-[9px] uppercase font-bold text-amber-600 block mb-1">Overall</span>
                <span className="text-2xl font-black font-mono text-amber-700">{passport.readinessScore || 0}%</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-slate-200">
                <Sparkles className="w-8 h-8" />
              </div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BadgeIcon className="w-4 h-4 text-emerald-500" />
                AI Evaluation Summary
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{passport.summary}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Verified Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 6).map((s, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200">
                        {s.skillName}
                      </span>
                    ))}
                  </div>
               </div>
               <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100 p-4 rounded-3xl">
                  <div className="bg-white p-2 rounded-2xl shadow-sm border border-emerald-100">
                    <QRCodeSVG value={publicProfileUrl} size={70} level="H" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 block">Public Verification</span>
                    <p className="text-[9px] text-slate-500 leading-tight mt-1">Scan to view live authenticated profile.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4 opacity-40 grayscale">
            <span className="text-[8px] font-bold uppercase tracking-widest">Powered by Groq AI</span>
          </div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            SkillProof AI Bangladesh © 2026
          </div>
        </div>
      </div>

      {/* এক্সপোর্ট কন্ট্রোলস */}
      <div className="grid sm:grid-cols-3 gap-4 print:hidden">
        <Button variant="outline" className="h-16 rounded-2xl" onClick={handleDownloadPDF} disabled={isExporting}>
          <FileDown className="w-5 h-5 mr-2 text-red-500" />
          <div className="text-left">
            <div className="font-bold text-sm">{isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</div>
            <div className="text-[10px] text-slate-500">Official Document</div>
          </div>
        </Button>
        <Button variant="outline" className="h-16 rounded-2xl" onClick={handleDownloadPNG} disabled={isExporting}>
          <ImageIcon className="w-5 h-5 mr-2 text-blue-500" />
          <div className="text-left">
            <div className="font-bold text-sm">{isBn ? 'ছবি হিসেবে সেভ' : 'Save as Image'}</div>
            <div className="text-[10px] text-slate-500">High Res PNG</div>
          </div>
        </Button>
        <Button variant="outline" className="h-16 rounded-2xl" onClick={handlePrint}>
          <Printer className="w-5 h-5 mr-2 text-emerald-500" />
          <div className="text-left">
            <div className="font-bold text-sm">{isBn ? 'সার্টিফিকেট প্রিন্ট' : 'Print Certificate'}</div>
            <div className="text-[10px] text-slate-500">To Printer</div>
          </div>
        </Button>
      </div>

      {/* শেয়ার মোডাল */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0c] border border-white/10 rounded-3xl max-w-md w-full p-6 text-white relative"
            >
              <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Share2 className="w-5 h-5 text-emerald-400" /> {isBn ? 'শেয়ার করুন' : 'Share Passport'}</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-xl">
                  <input type="text" readOnly value={publicProfileUrl} className="bg-transparent flex-1 text-xs text-slate-300 font-mono focus:outline-none" />
                  <Button variant={copied ? 'primary' : 'outline'} size="sm" onClick={handleCopyLink}>{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <Button variant="outline" className="justify-center" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicProfileUrl)}`, '_blank')}><Linkedin className="w-4 h-4 mr-2" /> LinkedIn</Button>
                   <Button variant="outline" className="justify-center" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicProfileUrl)}`, '_blank')}><Facebook className="w-4 h-4 mr-2" /> Facebook</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
