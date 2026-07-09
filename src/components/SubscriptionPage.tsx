/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from './UI';
import { 
  ShieldCheck, Smartphone, KeyRound, CheckCircle2, 
  Sparkles, Star, Zap, Crown, ArrowRight, ArrowLeft,
  AlertCircle, HelpCircle, Loader2
} from 'lucide-react';

interface SubscriptionPageProps {
  onSubscriptionSuccess: () => void;
  onLogout: () => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  onSubscriptionSuccess,
  onLogout
}) => {
  const { isBn } = useLanguage();
  const { user } = useAuth();

  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP Countdown timer
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Validates Bangladeshi mobile formats: 01xxxxxxxxx or 8801xxxxxxxxx
  const validateMobile = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    const regex = /^(88)?01[3-9]\d{8}$/;
    return regex.test(cleaned);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!mobileNumber) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে আপনার মোবাইল নম্বরটি লিখুন' : 'Please enter your mobile number');
      return;
    }

    if (!validateMobile(mobileNumber)) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন (উদাঃ 017xxxxxxxx)' : 'Please enter a valid Bangladeshi mobile number (e.g., 017xxxxxxxx)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/subscription/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber })
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setReferenceNo(data.referenceNo);
        setStep('otp');
        setTimer(60);
        setCanResend(false);
        setSuccessMsg(isBn ? 'আপনার মোবাইলে একটি ভেরিফিকেশন কোড পাঠানো হয়েছে!' : 'A verification code has been sent to your mobile!');
      } else {
        setErrorMsg(data.error || (isBn ? 'ওটিপি পাঠাতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to send OTP. Please try again.'));
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(isBn ? 'সার্ভার সংযোগে ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।' : 'Server connection error. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otp || otp.length < 4) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে সঠিক ওটিপি কোডটি লিখুন' : 'Please enter a valid OTP code');
      return;
    }

    if (!user) {
      setErrorMsg(isBn ? 'সেশন খুঁজে পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।' : 'Session not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/subscription/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp,
          referenceNo,
          mobileNumber,
          userId: user.id
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setStep('success');
        setSuccessMsg(isBn ? 'সাবস্ক্রিপশন সফলভাবে সম্পন্ন হয়েছে!' : 'Subscription activated successfully!');
        
        // Short delay for success animation before invoking success callback
        setTimeout(() => {
          onSubscriptionSuccess();
        }, 2200);
      } else {
        setErrorMsg(data.error || (isBn ? 'ভুল ওটিপি কোড। পুনরায় চেষ্টা করুন।' : 'Invalid OTP code. Please try again.'));
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(isBn ? 'সার্ভার সংযোগে ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।' : 'Server connection error. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/subscription/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber })
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setReferenceNo(data.referenceNo);
        setTimer(60);
        setCanResend(false);
        setSuccessMsg(isBn ? 'কোডটি পুনরায় পাঠানো হয়েছে!' : 'OTP code resent successfully!');
      } else {
        setErrorMsg(data.error || (isBn ? 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।' : 'Failed to send OTP.'));
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(isBn ? 'সার্ভার সংযোগে ত্রুটি ঘটেছে।' : 'Server connection error.');
    }
  };

  const benefits = [
    {
      titleEn: "All-In-One AI Career Access",
      titleBn: "সব এআই ক্যারিয়ার টুলস আনলিমিটেড",
      descEn: "Unlock AI Resume Builder, AI Resume Analysis, Career Roadmap, and AI Mock Interview.",
      descBn: "এআই সিভি বিল্ডার, সিভি অ্যানালাইসিস, ক্যারিয়ার রোডম্যাপ ও এআই মক ইন্টারভিউ আনলক করুন।"
    },
    {
      titleEn: "Skill Passports with Live QR",
      titleBn: "লাইভ কিউআর সমৃদ্ধ স্কিল পাসপোর্ট",
      descEn: "Verify, generate, and share secure credential Skill Passports directly with recruiters.",
      descBn: "নিরাপদ ডিজিটাল স্কিল পাসপোর্ট তৈরি এবং সরাসরি চাকরিদাতাদের সাথে শেয়ার করুন।"
    },
    {
      titleEn: "Personalized Study & Action Plans",
      titleBn: "ব্যক্তিগত স্টাডি ও অ্যাকশন প্ল্যান",
      descEn: "Get specialized suggestions, weak topic detection, and daily roadmap micro-tasks.",
      descBn: "দুর্বল বিষয়ের নিখুঁত বিশ্লেষণ, ক্যারিয়ার সাজেশন এবং প্রতিদিনের মাইক্রো-টাস্ক রোডম্যাপ।"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-teal-500 selection:text-black">
      {/* Top Brand bar */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-slate-900/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-teal-500/20">
            SP
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-white block">SkillProof AI</span>
            <span className="text-[9px] text-teal-400 font-bold uppercase tracking-widest block -mt-1">Bangladesh</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user?.email === 'nishat.af27@gmail.com' && (
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem("test_unsubscribed_mode");
                window.location.reload();
              }}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs py-2 px-3 border border-red-500/20 rounded-lg transition-all duration-200"
            >
              {isBn ? 'টেস্ট মোড বন্ধ করুন' : 'Exit Test Mode'}
            </Button>
          )}

          <Button 
            variant="secondary" 
            onClick={onLogout}
            className="bg-slate-900 hover:bg-slate-800 text-xs py-2 px-3 border border-slate-800 rounded-lg transition-all duration-200"
          >
            {isBn ? 'লগআউট করুন' : 'Sign Out'}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-12 px-4 max-w-4xl mx-auto flex flex-col justify-center w-full">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          
          {/* Left Column - Benefits Details */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full text-xs font-semibold border border-teal-500/20 w-fit">
              <Crown className="w-3.5 h-3.5 animate-pulse" />
              {isBn ? 'পেশাদারদের জন্য প্রিমিয়াম প্ল্যান' : 'Premium Membership for Professionals'}
            </div>
            
            <div>
              <h1 className="text-3.5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-teal-400 bg-clip-text text-transparent">
                {isBn ? 'সব ক্যারিয়ার টুলস আনলক করুন' : 'Supercharge Your Career with SkillProof AI'}
              </h1>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                {isBn 
                  ? 'নিরাপদ স্কিল পাসপোর্ট, এআই সিভি বিল্ডার ও লাইভ মক ইন্টারভিউয়ের মাধ্যমে নিজের ক্যারিয়ারের শতভাগ প্রস্তুতি নিন এখনই।' 
                  : 'Get unlimited server-side access to all premium job tools, customized micro-assessments, and smart shareable certifications.'}
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {benefits.map((b, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-900/80 hover:border-slate-800/80 transition-colors duration-200">
                  <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 border border-teal-500/20">
                    {idx === 0 ? <Zap className="w-4 h-4" /> : idx === 1 ? <ShieldCheck className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{isBn ? b.titleBn : b.titleEn}</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{isBn ? b.descBn : b.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Subscription Widget */}
          <div className="md:col-span-5 w-full">
            <AnimatePresence mode="wait">
              {/* INPUT STEP */}
              {step === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-slate-900 border-slate-800/80 shadow-2xl p-6 flex flex-col gap-5 relative overflow-hidden">
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 h-28 w-28 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-teal-400" />
                        {isBn ? 'বিডিঅ্যাপস সাবস্ক্রিপশন' : 'bdapps Subscription'}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">
                        {isBn 
                          ? 'সহজে আপনার রবি/এয়ারটেল নম্বর দিয়ে সাবস্ক্রাইব করুন।' 
                          : 'Subscribe securely using your Robi or Airtel mobile number.'}
                      </p>
                    </div>

                    {/* Price disclosure card */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex justify-between items-center">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                          {isBn ? 'মূল্য পরিশোধের বিবরণ' : 'Billing Details'}
                        </span>
                        <span className="text-lg font-black text-white mt-1 block">
                          3 TK <span className="text-xs font-normal text-slate-400">/ {isBn ? 'দিন' : 'day'}</span>
                        </span>
                      </div>
                      <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold py-1 px-2.5 rounded-full uppercase">
                        {isBn ? 'ভ্যাট প্রযোজ্য' : '+ VAT & SD'}
                      </Badge>
                    </div>

                    <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          {isBn ? 'মোবাইল নম্বর' : 'Mobile Number'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                            BD
                          </span>
                          <input 
                            type="tel"
                            placeholder="018XXXXXXXX"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-sm font-semibold tracking-wider rounded-xl pl-12 pr-4 py-3 text-white outline-none transition-all duration-200"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 leading-normal block px-1">
                          {isBn 
                            ? '* শুধুমাত্র রবি এবং এয়ারটেল গ্রাহকদের জন্য প্রযোজ্য।' 
                            : '* Robi and Airtel subscribers only.'}
                        </span>
                      </div>

                      {errorMsg && (
                        <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl items-start">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{errorMsg}</span>
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all duration-200 flex justify-center items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            {isBn ? 'ওটিপি পাঠানো হচ্ছে...' : 'Requesting OTP...'}
                          </>
                        ) : (
                          <>
                            {isBn ? 'সাবস্ক্রাইব করতে এগিয়ে যান' : 'Continue to Subscribe'}
                            <ArrowRight className="w-4 h-4 text-slate-950" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Card>
                </motion.div>
              )}

              {/* OTP STEP */}
              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-slate-900 border-slate-800/80 shadow-2xl p-6 flex flex-col gap-5 relative overflow-hidden">
                    <button 
                      onClick={() => setStep('input')}
                      className="absolute top-4 left-4 h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-200"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="pt-6 text-center">
                      <div className="mx-auto h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                        <KeyRound className="w-5 h-5 animate-pulse" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-white">
                        {isBn ? 'ওটিপি ভেরিফিকেশন' : 'OTP Verification'}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1 leading-normal max-w-xs mx-auto">
                        {isBn 
                          ? `${mobileNumber} নম্বরে পাঠানো ওটিপি কোডটি লিখুন।` 
                          : `Enter the code sent to your mobile number ${mobileNumber}.`}
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-300 text-center">
                          {isBn ? 'ওটিপি কোড' : 'OTP Code'}
                        </label>
                        <input 
                          type="text"
                          maxLength={6}
                          placeholder="XXXXXX"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          disabled={isLoading}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-lg font-black tracking-[0.5em] text-center rounded-xl py-3 text-white outline-none transition-all duration-200"
                        />
                      </div>

                      {successMsg && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl text-center leading-relaxed">
                          {successMsg}
                        </div>
                      )}

                      {errorMsg && (
                        <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl items-start">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{errorMsg}</span>
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all duration-200 flex justify-center items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            {isBn ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}
                          </>
                        ) : (
                          <>
                            {isBn ? 'ভেরিফাই ও সাবস্ক্রাইব করুন' : 'Verify & Subscribe'}
                            <ShieldCheck className="w-4 h-4 text-slate-950" />
                          </>
                        )}
                      </Button>

                      {/* Resend Actions */}
                      <div className="text-center pt-2">
                        {canResend ? (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isLoading}
                            className="text-xs text-teal-400 font-bold hover:text-teal-300 underline"
                          >
                            {isBn ? 'ওটিপি পুনরায় পাঠান' : 'Resend OTP Code'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {isBn 
                              ? `কোড পুনরায় পাঠাতে অপেক্ষা করুন: ${timer} সেকেন্ড` 
                              : `Resend code in: ${timer}s`}
                          </span>
                        )}
                      </div>
                    </form>
                  </Card>
                </motion.div>
              )}

              {/* SUCCESS STEP */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <Card className="bg-slate-900 border-slate-800/80 shadow-2xl p-8 text-center flex flex-col gap-4 items-center relative overflow-hidden">
                    {/* Confetti simulation rays */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 to-emerald-500/5 animate-pulse" />
                    
                    <div className="relative z-10">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 mb-4 shadow-xl shadow-teal-500/20">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>
                    </div>

                    <h2 className="text-2xl font-black text-white relative z-10">
                      {isBn ? 'সাবস্ক্রিপশন সম্পন্ন!' : 'Subscription Activated!'}
                    </h2>
                    
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed relative z-10">
                      {isBn 
                        ? 'অভিনন্দন! আপনার অ্যাকাউন্ট প্রিমিয়াম-এ উন্নীত করা হয়েছে। ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...' 
                        : 'Congratulations! Your profile is upgraded to Premium. Redirecting to your career hub...'}
                    </p>

                    {/* Progress loader */}
                    <div className="w-24 h-1 bg-slate-950 rounded-full mt-4 overflow-hidden relative z-10">
                      <motion.div 
                        initial={{ left: '-100%' }}
                        animate={{ left: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="absolute h-full w-12 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                      />
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="px-6 py-6 border-t border-slate-900/50 bg-slate-950/80 backdrop-blur-md text-center">
        <p className="text-[10px] text-slate-500 max-w-lg mx-auto leading-relaxed">
          {isBn 
            ? 'SkillProof AI-এর এই সাবস্ক্রিপশনটি বিডিঅ্যাপস (bdapps) দ্বারা পরিচালিত। এটি একটি দৈনিক চার্জযোগ্য সার্ভিস (3 TK/দিন + ভ্যাট, এসডি এবং সারচার্জ প্রযোজ্য)। আপনি যেকোনো সময় unsub লিখে 21213 নম্বরে এসএমএস পাঠিয়ে অথবা সাপোর্ট পোর্টালে গিয়ে প্যাকটি বাতিল করতে পারেন।' 
            : 'This premium service is managed through bdapps OTP charging gateway. Charging operates on a daily subscription rate of 3 BDT/day plus standard government levies. You can cancel your subscription at any time by sending "unsub" to 21213.'}
        </p>
      </footer>
    </div>
  );
};
