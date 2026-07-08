/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, HelpCircle, Calendar, Award, User, ExternalLink, 
  ArrowRight, ShieldAlert, CheckCircle2, Globe, FileCheck, Sparkles 
} from 'lucide-react';
import { passportDb } from '../lib/passportSupabase';
import { VerificationRecord, SkillPassport } from '../types/passport';
import { Card, Button, Badge, LoadingSpinner } from './UI';

export const VerificationPage: React.FC<{ verificationId: string }> = ({ verificationId }) => {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [passport, setPassport] = useState<SkillPassport | null>(null);
  const [isPassportVerify, setIsPassportVerify] = useState(false);

  useEffect(() => {
    const fetchVerificationData = async () => {
      setLoading(true);
      try {
        // ১. চেক করা এটি পাসপোর্ট আইডি নাকি স্কিল ভেরিফিকেশন আইডি
        if (verificationId.startsWith('SP-BD-2026-')) {
          setIsPassportVerify(true);
          const p = await passportDb.getPassportById(verificationId);
          if (p) {
            setPassport(p);
          }
        } else {
          // এটি একটি নির্দিষ্ট স্কিল ভেরিফিকেশন
          const r = await passportDb.getVerificationRecord(verificationId);
          if (r) {
            setRecord(r);
            const p = await passportDb.getPassportById(r.passportId);
            if (p) setPassport(p);
          }
        }
      } catch (err) {
        console.error("Error loading verification record:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationData();
  }, [verificationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <LoadingSpinner />
        <span className="text-sm font-bold text-slate-400 mt-4 animate-pulse uppercase tracking-widest">
          Authenticating Secure Credentials...
        </span>
      </div>
    );
  }

  if (!passport && !record) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-20 w-20 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6 shadow-xl border border-red-100">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 font-display">
          Verification Failed
        </h3>
        <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-8">
          The credential ID "{verificationId}" could not be found in our secure database. It may have been revoked or is invalid.
        </p>
        <Button variant="primary" onClick={() => window.location.href = '/'}>
          Return to SkillProof Home
        </Button>
      </div>
    );
  }

  // পাসপোর্ট ভেরিফিকেশন ভিউ (Full Passport Verification)
  if (isPassportVerify && passport) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 selection:bg-emerald-500 selection:text-white">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          
          {/* হেডার */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-2xl shadow-xl">
              SP
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-2">SkillProof AI Bangladesh</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
              <Globe className="w-3 h-3" />
              Live Verification Portal
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white border-4 border-emerald-500/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <FileCheck className="w-64 h-64" />
              </div>

              <div className="flex flex-col gap-10 relative z-10">
                
                {/* স্ট্যাটাস ব্যাজ */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-none">Passport Verified</h3>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tight">Authentic Professional Credential</p>
                    </div>
                  </div>
                  <div className="bg-emerald-600 text-white px-6 py-2 rounded-2xl font-black text-sm tracking-widest shadow-lg shadow-emerald-600/20">
                    VERIFIED
                  </div>
                </div>

                {/* প্রোফাইল তথ্য */}
                <div className="flex flex-col sm:flex-row items-center gap-8 bg-slate-50 border border-slate-100 p-8 rounded-[2rem]">
                  <img 
                    src={passport.avatarUrl || ''} 
                    alt="Avatar" 
                    className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block mb-1">Credential Holder</span>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{passport.fullName}</h2>
                    <p className="text-slate-500 font-bold text-sm mt-1">{passport.careerPath}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold font-mono mt-4">
                      UID: {passport.id}
                    </div>
                  </div>
                </div>

                {/* স্কোর মেট্রিক্স */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Resume', score: passport.resumeScore, color: 'emerald' },
                    { label: 'ATS', score: passport.atsScore, color: 'blue' },
                    { label: 'Interview', score: passport.interviewScore, color: 'purple' },
                    { label: 'Overall', score: passport.readinessScore, color: 'amber' }
                  ].map((s, i) => (
                    <div key={i} className={`bg-${s.color}-50 border border-${s.color}-100 p-4 rounded-3xl text-center`}>
                      <span className={`text-[9px] uppercase font-bold text-${s.color}-600 block mb-1`}>{s.label}</span>
                      <span className={`text-2xl font-black font-mono text-${s.color}-700`}>{s.score || 0}%</span>
                    </div>
                  ))}
                </div>

                {/* সামারি */}
                <div className="bg-emerald-50/30 border border-emerald-100 p-6 rounded-[2rem] relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-3">AI Evaluation Statement</h4>
                  <p className="text-sm text-slate-600 leading-relaxed italic font-medium">
                    "{passport.summary}"
                  </p>
                </div>

                {/* মেটাডাটা */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-6">
                    <div className="text-center sm:text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Verified Date</span>
                      <span className="text-xs font-black text-slate-700">{new Date(passport.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Last Updated</span>
                      <span className="text-xs font-black text-slate-700">{new Date(passport.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                    <CheckCircle2 className="w-4 h-4" />
                    Encrypted Blockchain Signature: Verified
                  </div>
                </div>

              </div>
            </Card>
          </motion.div>

          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose max-w-lg mx-auto">
              SkillProof AI provides secure, third-party authentication for professional skills based on actual performance audits.
            </p>
            <Button variant="outline" className="mt-8 rounded-2xl" onClick={() => window.location.href = '/'}>
              Home Page
            </Button>
          </div>

        </div>
      </div>
    );
  }

  // ডিফল্ট রেকর্ড ভিউ (পূর্বের স্কিল ভেরিফিকেশন)
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-xl">SP</div>
          <h1 className="text-lg font-bold text-slate-900 mt-1">SkillProof AI Bangladesh</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-4 border-emerald-100 bg-white rounded-[2rem] p-8 shadow-xl">
             <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
                   <div>
                     <span className="text-[9px] uppercase font-black text-emerald-600">Skill Authenticated</span>
                     <h3 className="text-xs text-slate-400 font-mono mt-0.5">ID: {record?.id}</h3>
                   </div>
                </div>
                <Badge variant="success">VERIFIED</Badge>
             </div>

             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center mb-6">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-black">Subject</span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{record?.skillName}</h2>
                </div>
                <div className="text-center bg-white border border-slate-200 px-6 py-2 rounded-xl shadow-sm">
                   <span className="text-2xl font-black text-emerald-600 block">{record?.score}%</span>
                   <span className="text-[8px] font-black text-slate-400 uppercase">Proficiency</span>
                </div>
             </div>

             <div className="flex flex-col gap-2 mb-8">
               <span className="text-slate-400 text-[10px] uppercase font-black">Evaluation</span>
               <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed italic">"{record?.summary}"</p>
             </div>

             <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{record?.ownerName}</h4>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Passport Owner</span>
                    </div>
                  </div>
                  {passport && (
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `/verify/${passport.id}`}>
                      View Full Passport
                    </Button>
                  )}
                </div>
             </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
