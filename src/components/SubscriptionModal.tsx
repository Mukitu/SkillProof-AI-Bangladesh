/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Smartphone, ShieldCheck, Sparkles, CheckCircle2, 
  HelpCircle, AlertCircle, RefreshCw, KeyRound, ArrowRight, LogOut 
} from 'lucide-react';

interface SubscriptionModalProps {
  onSubscriptionSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onSubscriptionSuccess }) => {
  const { t, isBn } = useLanguage();
  const { user, logout, updateProfile } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  
  const [referenceNo, setReferenceNo] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);

  // Check initial subscription status from backend on mount if user has a phone stored
  useEffect(() => {
    const checkSubStatus = async () => {
      if (!user?.email) return;
      try {
        const res = await fetch('/api/bdapps/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, phone: user.phone })
        });
        const data = await res.json();
        if (data.success && data.subscribed) {
          // Update profile locally & proceed
          await updateProfile({ premium: true });
          onSubscriptionSuccess();
        }
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      }
    };
    checkSubStatus();
  }, [user, onSubscriptionSuccess, updateProfile]);

  // Handle timer countdown for OTP resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 11) {
      setError(isBn ? 'অনুগ্রহ করে ১১ ডিজিটের সঠিক মোবাইল নম্বর দিন' : 'Please enter a valid 11-digit mobile number');
      return;
    }
    
    // Ensure it starts with Robi/Airtel prefix (018 or 016)
    const isValidPrefix = phoneNumber.startsWith('018') || phoneNumber.startsWith('016') || phoneNumber.startsWith('88018') || phoneNumber.startsWith('88016');
    if (!isValidPrefix) {
      setError(isBn ? 'শুধুমাত্র রবি (018) এবং এয়ারটেল (016) নম্বর সমর্থন করে' : 'Only Robi (018) and Airtel (016) numbers are supported');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/bdapps/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReferenceNo(data.referenceNo);
        if (data.mode === 'simulation' && data.message) {
          setSimulationMessage(data.message);
        } else {
          setSimulationMessage(null);
        }
        setStep('otp');
        setTimer(60);
      } else {
        setError(data.error || (isBn ? 'ওটিপি পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to send OTP. Please try again.'));
      }
    } catch (err) {
      setError(isBn ? 'সার্ভার সংযোগে সমস্যা হচ্ছে।' : 'Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError(isBn ? 'অনুগ্রহ করে সঠিক ওটিপি দিন' : 'Please enter a valid OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/bdapps/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceNo,
          otp,
          email: user?.email
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Save subscriber info in user profile
        await updateProfile({ 
          premium: true,
          phone: phoneNumber
        });
        setStep('success');
      } else {
        setError(data.error || (isBn ? 'ওটিপি ভেরিফিকেশন ব্যর্থ হয়েছে।' : 'OTP verification failed.'));
      }
    } catch (err) {
      setError(isBn ? 'সার্ভার সংযোগে সমস্যা হচ্ছে।' : 'Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-50/90 dark:bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
      {/* Decorative Glow Spheres - styled exactly like the Landing Page */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-brand-green/10 dark:bg-brand-green/15 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-brand-blue/10 dark:bg-brand-blue/15 rounded-full blur-[80px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/80 overflow-hidden text-slate-800 dark:text-slate-100 relative z-10"
      >
        {/* Visual Brand Header - styled like Landing Page brand header */}
        <div className="relative p-6 text-center bg-gradient-to-br from-brand-green/10 via-brand-blue/5 to-transparent border-b border-slate-100 dark:border-slate-800/80">
          <div className="absolute top-5 right-5">
            <span className="px-2.5 py-1 text-[9px] font-bold tracking-widest font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase rounded-full">
              BDApps Telecommunication
            </span>
          </div>
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center font-display font-black text-slate-950 text-base shadow-lg shadow-brand-green/25 animate-pulse">
              SP
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
            {isBn ? 'SkillProof এআই সাবস্ক্রিপশন পোর্টাল' : 'SkillProof AI Subscription Portal'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-sans font-medium">
            {isBn ? 'রবি অথবা এয়ারটেল ক্যারিয়ার বিলিং এর মাধ্যমে কানেক্ট করুন' : 'Connect via Robi or Airtel Mobile Carrier Billing'}
          </p>
        </div>

        {/* Content Container */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Input Phone and Select Carrier */}
            {step === 'input' && (
              <motion.div
                key="input-step"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 space-y-2.5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans">
                        {isBn ? 'প্রিমিয়াম ফিচারে অ্যাক্সেস পান' : 'Unlock Premium AI Career Dashboard'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {isBn 
                          ? 'এআই ইন্টারভিউ প্রিপারেশন, স্মার্ট সিভি বিল্ডার, এবং স্কিল ট্র্যাকিং রিপোর্ট সহ সকল ফিচার অ্যাক্টিভেট করতে সাবস্ক্রাইব করুন।' 
                          : 'Unlock AI interview simulators, dynamic CV scoring, full skill passports, and roadmap dashboards.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Carrier Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isBn ? 'আপনার টেলিকম ক্যারিয়ার' : 'Select Your Carrier'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                        phoneNumber.startsWith('018') || phoneNumber.startsWith('88018')
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-600 dark:text-red-400 shadow-md shadow-red-500/5 scale-[1.02] font-semibold'
                          : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-black tracking-tight">Robi</span>
                      <span className="text-[10px] mt-1 font-medium opacity-90">৳ ২.০০ / প্রতিদিন</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                        phoneNumber.startsWith('016') || phoneNumber.startsWith('88016')
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-600 text-red-600 dark:text-red-400 shadow-md shadow-red-600/5 scale-[1.02] font-semibold'
                          : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-black tracking-tight">Airtel</span>
                      <span className="text-[10px] mt-1 font-medium opacity-90">৳ ২.০০ / প্রতিদিন</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Number Input */}
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      {isBn ? 'মোবাইল নম্বর' : 'Mobile Number'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 dark:text-slate-500">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        maxLength={11}
                        placeholder="018XXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPhoneNumber(val);
                        }}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all font-mono tracking-wider text-base"
                      />
                    </div>
                  </div>

                  <div className="text-center bg-emerald-500/5 dark:bg-emerald-500/10 py-3 px-4 rounded-2xl border border-emerald-500/20 shadow-sm">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {isBn ? 'সার্ভিসটি চালু করলে দিনে ২.৪৪ টাকা (+ভ্যাট/এসডি) চার্জ প্রযোজ্য হবে।' : 'Subscribing to this service will charge 2.44 TK daily (+VAT/SD).'}
                    </span>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3.5 text-xs bg-red-500/5 border border-red-500/20 text-red-500 dark:text-red-400 rounded-2xl shadow-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-brand-green to-brand-blue hover:opacity-95 text-slate-950 font-black tracking-tight rounded-2xl shadow-lg shadow-brand-green/25 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                      ) : (
                        <>
                          <span>{isBn ? 'পরবর্তী ধাপে যান' : 'Request Verification Code'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-start gap-3">
                    <KeyRound className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans">
                        {isBn ? 'ওটিপি (OTP) ভেরিফিকেশন' : 'Enter Verification Code'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {isBn 
                          ? `আমরা ${phoneNumber} নম্বরে একটি ওটিপি পাঠিয়েছি। সাবস্ক্রিপশন সম্পন্ন করতে কোডটি এখানে লিখুন।`
                          : `We have sent a verification code to ${phoneNumber}. Enter the code to activate.`}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      {isBn ? 'ওটিপি কোড' : 'OTP Code'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="XXXXXX"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full text-center py-3.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all font-mono tracking-[0.5em] text-xl"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3.5 text-xs bg-red-500/5 border border-red-500/20 text-red-500 dark:text-red-400 rounded-2xl shadow-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>
                      {timer > 0 
                        ? (isBn ? `${timer} সেকেন্ড পরে পুনরায় চেষ্টা করুন` : `Resend in ${timer}s`)
                        : (
                          <button 
                            type="button" 
                            onClick={handleRequestOtp}
                            className="text-brand-green dark:text-emerald-400 hover:underline font-bold"
                          >
                            {isBn ? 'পুনরায় ওটিপি পাঠান' : 'Resend Code'}
                          </button>
                        )
                      }
                    </span>
                    <button
                      type="button"
                      onClick={() => { setStep('input'); setError(null); }}
                      className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all underline font-medium"
                    >
                      {isBn ? 'নম্বর পরিবর্তন করুন' : 'Change Number'}
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-brand-green to-brand-blue hover:opacity-95 text-slate-950 font-black rounded-2xl shadow-lg shadow-brand-green/25 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                      ) : (
                        <span>{isBn ? 'ভেরিফাই ও সাবস্ক্রাইব করুন' : 'Verify & Subscribe'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Success Screen */}
            {step === 'success' && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="flex justify-center animate-bounce">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 shadow-md">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-sans">
                    {isBn ? 'সাবস্ক্রিপশন সফল হয়েছে!' : 'Subscription Successful!'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-6 leading-relaxed font-medium">
                    {isBn 
                      ? 'অভিনন্দন! SkillProof এআই ক্যারিয়ার গাইডের সকল প্রিমিয়াম ফিচার এখন আপনার অ্যাকাউন্টে সচল।'
                      : 'Congratulations! All premium AI career modules are now unlocked.'}
                  </p>
                </div>

                <div className="pt-4 px-6">
                  <button
                    type="button"
                    onClick={onSubscriptionSuccess}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-green to-brand-blue hover:opacity-95 text-slate-950 font-black rounded-2xl shadow-lg shadow-brand-green/20 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    {isBn ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Enter Dashboard'}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer info - aligned with high contrast modern design */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure Carrier Billing (No credit card required)</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-all font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isBn ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
