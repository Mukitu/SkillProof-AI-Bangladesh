/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, ShieldCheck, Calendar, Clock, ExternalLink, Share2, 
  Linkedin, Facebook, Mail, Copy, Check, Download, ArrowLeft, 
  Sparkles, Code, CheckCircle, HelpCircle, Briefcase, ChevronRight
} from 'lucide-react';
import { passportDb } from '../lib/passportSupabase';
import { PublicProfile, PassportSkill, PassportHistoryItem } from '../types/passport';
import { Button, Card, Badge, LoadingSpinner } from './UI';

export const PublicPassportPage: React.FC<{ passportId: string }> = ({ passportId }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeHistoryDetail, setActiveHistoryDetail] = useState<PassportHistoryItem | null>(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      setLoading(true);
      try {
        const data = await passportDb.getPublicProfile(passportId);
        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error loading public passport profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [passportId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!profile) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}`;
    
    fetch(qrUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SPAI-Verification-QR-${profile.passportId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => console.error("Error downloading QR:", err));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <LoadingSpinner />
        <span className="text-sm font-semibold text-slate-500 mt-4 font-mono animate-pulse">
          Retrieving Verified Skill Passport Credentials...
        </span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold font-display text-white mb-2">
          Skill Passport Not Found!
        </h3>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
          The passport credentials or verification ID you specified do not exist in our database or might have been revoked.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go to Homepage
        </Button>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-slate-950">
      
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        
        {/* ১. ব্রান্ড লোগো হেডার (BRAND BAR) */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
              SP
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">SkillProof AI</h1>
              <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold">Bangladesh</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase">
              SECURE DECENTRALIZED VERIFICATION SYSTEM
            </span>
          </div>
        </div>

        {/* ২. পাবলিক প্রোফাইল ব্যানার (PUBLIC BANNER) */}
        <Card id="cv-print-area" className="relative overflow-hidden border border-white/5 bg-[#0a0a0a] rounded-3xl p-6 lg:p-8 shadow-2xl">
          <div className="absolute -right-24 -top-24 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
              <div className="relative shrink-0">
                <img 
                  src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                  alt={profile.fullName} 
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-xl"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-lg border border-slate-950 shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h2 className="text-2xl font-bold font-display text-white">{profile.fullName}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
                    {profile.verificationStatus}
                  </span>
                </div>
                
                <p className="text-sm text-slate-400 font-medium mt-1.5 flex items-center justify-center sm:justify-start gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>{profile.careerPath}</span>
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-500 font-mono">
                  <div>
                    <span className="text-slate-400 font-bold">Passport ID:</span> {profile.passportId}
                  </div>
                  <div className="hidden sm:block h-3 w-[1px] bg-white/10" />
                  <div>
                    <span className="text-slate-400 font-bold">Latest Sync:</span> {new Date(profile.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* ওভারঅল উইজেট */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl shrink-0">
              <div className="text-center">
                <div className="text-3xl font-black font-mono text-emerald-400">{profile.readinessScore}%</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                  Readiness Score
                </div>
              </div>
              <div className="h-8 w-[1px] bg-white/10" />
              <div className="text-center">
                <div className="text-lg font-black font-display text-cyan-400 uppercase tracking-tight">{profile.level}</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                  Verified Level
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ৩. বেন্টো গ্রিড লেআউট (GRID FOR SKILLS & TIMELINE / QR) */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* বাঁদিক ২/৩: ভেরিফাইড স্কিলসমূহ ও অ্যাসেসমেন্ট হিস্ট্রি */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* স্কিল কার্ডস */}
            <div>
              <h3 className="font-display font-bold text-lg text-white mb-4">
                Verified Skill Cards
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {profile.skills.map((skill) => {
                  const levelColor = {
                    Beginner: 'text-slate-400 border-slate-500/20 bg-slate-500/5',
                    Bronze: 'text-amber-600 border-amber-600/20 bg-amber-600/5',
                    Silver: 'text-slate-300 border-slate-300/20 bg-slate-300/5',
                    Gold: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
                    Platinum: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5',
                    Expert: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
                  }[skill.level];

                  return (
                    <div
                      key={skill.id}
                      className="group relative overflow-hidden bg-[#0c0c0c] border border-white/5 hover:border-emerald-500/20 rounded-2xl p-5 transition-all duration-300"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-slate-100">
                              {skill.skillName}
                            </h4>
                            <span className="text-[8px] font-mono text-slate-500 block mt-0.5">
                              {skill.id}
                            </span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider border ${levelColor}`}>
                            {skill.level}
                          </span>
                        </div>

                        <div className="flex items-end justify-between mt-1">
                          <div>
                            <span className="text-slate-500 text-[8px] block font-mono">
                              Verified Score
                            </span>
                            <span className="text-xl font-black font-mono text-white block">
                              {skill.score}%
                            </span>
                          </div>
                          {skill.progress > 0 && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                              +{skill.progress}% improvement
                            </span>
                          )}
                        </div>

                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full" 
                            style={{ width: `${skill.score}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[8px] text-slate-500 pt-1 border-t border-white/5">
                          <span>As of {new Date(skill.lastAssessmentDate).toLocaleDateString()}</span>
                          <a 
                            href={`/verify/${skill.id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
                          >
                            <span>Verify ID</span>
                            <ExternalLink className="w-2 h-2" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* টাইমলাইন */}
            <Card className="flex flex-col gap-6">
              <h3 className="font-display font-bold text-sm text-white pb-3 border-b border-white/5">
                Assessment History & Timeline
              </h3>

              <div className="relative pl-6 border-l border-white/10 flex flex-col gap-6">
                {profile.history.map((item, index) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-slate-950 border border-emerald-500 flex items-center justify-center text-[8px] font-bold text-emerald-400">
                      {profile.history.length - index}
                    </div>

                    <div 
                      onClick={() => setActiveHistoryDetail(item)}
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/15 rounded-xl transition-all cursor-pointer flex justify-between items-center gap-3"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-100">
                          {item.interviewTitle}
                        </h4>
                        <span className="text-[9px] text-slate-500 font-mono">({item.id}) - {new Date(item.date).toLocaleDateString()}</span>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                          {item.summary}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black font-mono text-white block">{item.score}%</span>
                        <span className="text-[8px] uppercase font-bold text-slate-500">{item.level}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ডানদিক ১/৩: কিউআর কোড এবং ভেরিফিকেশন ও শেয়ার উইজেট */}
          <div className="flex flex-col gap-6">
            
            {/* কিউআর কোড উইজেট */}
            <Card className="flex flex-col items-center text-center gap-4 border border-white/5 bg-[#0c0c0c] p-6 rounded-2xl">
              <h3 className="font-display font-bold text-sm text-white">
                Official QR Verification
              </h3>
              
              <div className="bg-white p-2.5 rounded-xl border border-white/10 inline-block">
                <img 
                  src={qrCodeUrl} 
                  alt="Public Profile Verification QR" 
                  className="w-40 h-40"
                />
              </div>
              
              <p className="text-[11px] text-slate-400 leading-normal max-w-xs">
                Scan this QR code with any mobile device to immediately view and verify this certified Skill Passport report on our secure server.
              </p>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadQR}
                className="w-full justify-center"
              >
                <Download className="w-4 h-4" />
                <span>Download Verification QR</span>
              </Button>
            </Card>

            {/* শেয়ার উইজেট */}
            <Card className="flex flex-col gap-4 border border-white/5 bg-[#0c0c0c] p-5 rounded-2xl">
              <h3 className="font-display font-bold text-sm text-white">
                Share Passport
              </h3>
              
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-xl">
                <input 
                  type="text" 
                  readOnly 
                  value={window.location.href}
                  className="bg-transparent flex-1 text-[10px] text-slate-400 font-mono px-2 focus:outline-none overflow-x-auto"
                />
                <button 
                  onClick={handleCopyLink}
                  className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="py-2.5 bg-[#0077b5]/15 border border-[#0077b5]/30 hover:bg-[#0077b5]/25 rounded-xl flex items-center justify-center text-[#0077b5] text-xs font-semibold gap-1.5 transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="py-2.5 bg-[#1877f2]/15 border border-[#1877f2]/30 hover:bg-[#1877f2]/25 rounded-xl flex items-center justify-center text-[#1877f2] text-xs font-semibold gap-1.5 transition-all"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
                <a 
                  href={`mailto:?subject=AI Verified Skill Passport: ${profile.fullName}&body=View the certified credentials and assessment timeline here: ${window.location.href}`}
                  className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-200 text-xs font-semibold gap-1.5 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </a>
              </div>
            </Card>

          </div>

        </div>

        {/* ফুটার */}
        <div className="text-center text-[10px] text-slate-600 font-mono pt-8 border-t border-white/5 mt-4">
          SkillProof AI Bangladesh is a secure certification-free assessment ledger. All reports and skill profiles are evaluated dynamically using speech-to-text, CV parsers, and live technical interactive agents.
        </div>

      </div>

      {/* হিস্ট্রি ডিটেল মোডাল */}
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
                <h3 className="text-lg font-bold font-display">Assessment Q&A Session Report</h3>
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
                  <span className="text-slate-500 text-xs font-semibold">Assessment Date:</span>
                  <p className="text-sm text-slate-200 font-mono">{new Date(activeHistoryDetail.date).toLocaleString()}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs font-semibold">Progression & Growth:</span>
                  <p className="text-sm text-emerald-400 font-semibold">{activeHistoryDetail.improvement}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs font-semibold">Skill Level at Session:</span>
                  <p className="text-sm text-cyan-400 font-bold">{activeHistoryDetail.level}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs font-semibold">Assessment Summary:</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                    {activeHistoryDetail.summary}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setActiveHistoryDetail(null)}>
                  Close Report
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Simple Close/X icon fallback for inline safety
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
