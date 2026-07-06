/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, HelpCircle, Calendar, Award, User, ExternalLink, ArrowRight, ShieldAlert } from 'lucide-react';
import { passportDb } from '../lib/passportSupabase';
import { VerificationRecord, SkillPassport } from '../types/passport';
import { Card, Button, Badge, LoadingSpinner } from './UI';

export const VerificationPage: React.FC<{ verificationId: string }> = ({ verificationId }) => {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [passport, setPassport] = useState<SkillPassport | null>(null);

  useEffect(() => {
    const fetchVerificationData = async () => {
      setLoading(true);
      try {
        const r = await passportDb.getVerificationRecord(verificationId);
        if (r) {
          setRecord(r);
          const p = await passportDb.getPassportById(r.passportId);
          if (p) {
            setPassport(p);
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <LoadingSpinner />
        <span className="text-sm font-semibold text-slate-500 mt-4 font-mono animate-pulse">
          Decrypting Secure Skill Verification Records...
        </span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>
        <h3 className="text-2xl font-bold font-display text-white mb-2">
          Verification Record Not Found
        </h3>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
          The requested Verification ID "{verificationId}" is invalid or does not correspond to any active evaluated skills in our database.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-slate-950">
      
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        
        {/* লোগো বার */}
        <div className="flex flex-col items-center text-center gap-2 pb-6 border-b border-white/5">
          <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            SP
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white mt-1">SkillProof AI Bangladesh</h1>
          <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold font-mono">
            SECURE DECENTRALIZED AUTHENTICATION PORTAL
          </p>
        </div>

        {/* ভেরিফিকেশন কার্ড */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="relative overflow-hidden border-2 border-emerald-500/30 bg-[#090909] rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Ambient background glow */}
            <div className="absolute -right-32 -top-32 w-72 h-72 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col gap-6 relative z-10">
              
              {/* ভেরিফিকেশন ব্যাজ ও হেডার */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-500 font-mono">
                      AUTHENTICATED SKILL ASSESSMENT
                    </span>
                    <h3 className="text-xs text-slate-400 font-mono mt-0.5">
                      ID: {record.id}
                    </h3>
                  </div>
                </div>

                <Badge variant={record.verificationStatus === 'Verified' ? 'success' : 'brand'}>
                  {record.verificationStatus === 'Verified' ? 'VERIFIED' : 'ASSESSED'}
                </Badge>
              </div>

              {/* স্কিল ডিটেলস ও বড় গোল্ডেন স্কোর */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/5 border border-white/5 p-5 rounded-2xl">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-mono">Tested Subject</span>
                  <h2 className="text-2xl font-black font-display text-white mt-1">
                    {record.skillName}
                  </h2>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>Assessment Date: {new Date(record.assessmentDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-center bg-emerald-500/10 border border-emerald-500/25 px-6 py-3 rounded-2xl shrink-0">
                  <span className="text-3xl font-black font-mono text-emerald-400 block">{record.score}%</span>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mt-0.5 block">
                    PROFICIENCY SCORE
                  </span>
                </div>
              </div>

              {/* বিশ্লেষণ সামারি */}
              <div className="flex flex-col gap-2">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider font-mono">Evaluation Statement</span>
                <p className="text-xs text-slate-300 bg-white/5 border border-white/5 p-4 rounded-xl leading-relaxed">
                  {record.summary}
                </p>
              </div>

              {/* মালিকের তথ্য */}
              <div className="flex flex-col gap-2 border-t border-white/10 pt-4 mt-2">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider font-mono">Passport Owner</span>
                
                <div className="flex items-center justify-between gap-4 mt-1 bg-white/5 border border-white/5 p-3.5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{record.ownerName}</h4>
                      <span className="text-[9px] text-slate-500 font-mono">Passport: {record.passportId}</span>
                    </div>
                  </div>

                  {passport && (
                    <a 
                      href={`/passport/${passport.id}`} 
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 group"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/passport/${passport.id}`;
                      }}
                    >
                      <span>View Passport</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  )}
                </div>
              </div>

            </div>
          </Card>
        </motion.div>

        {/* ফুটার ডিসক্লেইমার */}
        <div className="text-center text-[10px] text-slate-600 font-mono leading-relaxed">
          This record verifies that the individual named has successfully demonstrated practical and communicative capability in the declared framework or language during an interactive simulation audit powered by SkillProof AI Bangladesh.
        </div>

      </div>

    </div>
  );
};
