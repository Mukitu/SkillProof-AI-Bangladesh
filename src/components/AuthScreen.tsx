/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, ThemeSwitch, LanguageSwitch } from './UI';
import { 
  Mail, Lock, User, Key, Check, AlertCircle, 
  ArrowLeft, Eye, EyeOff, Sparkles 
} from 'lucide-react';

interface AuthScreenProps {
  initialScreen?: 'login' | 'signup';
  onNavigateHome: () => void;
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialScreen = 'login',
  onNavigateHome,
  onAuthSuccess
}) => {
  const { t, isBn } = useLanguage();
  const { login, signup, verifyOtp, sendResetEmail } = useAuth();

  const [screen, setScreen] = useState<'login' | 'signup' | 'forgot' | 'verify' | 'reset'>(initialScreen);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // ফর্ম ভ্যালিডেশন ও লগইন সাবমিট (Login submit)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে আপনার ইমেল লিখুন' : 'Please enter your email');
      return;
    }

    setIsLoading(true);
    const res = await login(email);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(isBn ? 'লগইন সফল হয়েছে!' : 'Login successful!');
      setTimeout(() => {
        onAuthSuccess();
      }, 800);
    } else {
      setErrorMsg(res.error);
    }
  };

  // সাইনআপ সাবমিট (Signup submit)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!fullName || !email || !password) {
      setErrorMsg(isBn ? 'সবগুলো ঘর পূরণ করা আবশ্যক' : 'All fields are required');
      return;
    }

    if (password.length < 6) {
      setErrorMsg(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const res = await signup(email, password, fullName);
    setIsLoading(false);

    if (res.success) {
      if (res.verificationRequired) {
        setSuccessMsg(isBn ? 'নিবন্ধন সফল! আপনার ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হয়েছে।' : 'Signup successful! Verification code sent to email.');
        setTimeout(() => {
          setScreen('verify');
          resetFormState();
        }, 1500);
      } else {
        setSuccessMsg(isBn ? 'নিবন্ধন সফল! লগইন করা হচ্ছে...' : 'Signup successful! Logging in...');
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
      }
    } else {
      setErrorMsg(res.error);
    }
  };

  // ওটিপি ভেরিফিকেশন সাবমিট (Verify OTP submit)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে সঠিক ৬ ডিজিটের কোডটি লিখুন' : 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    const res = await verifyOtp(email, otpCode);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(isBn ? 'ইমেইল ভেরিফিকেশন সফল! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...' : 'Email verified! Redirecting to dashboard...');
      setTimeout(() => {
        onAuthSuccess();
      }, 1000);
    } else {
      setErrorMsg(res.error);
    }
  };

  // পাসওয়ার্ড ভুলে গেলে রিসেট রিকোয়েস্ট (Forgot Password submit)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে আপনার ইমেল লিখুন' : 'Please enter your email');
      return;
    }

    setIsLoading(true);
    const res = await sendResetEmail(email);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(isBn ? 'পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে!' : 'Password reset link sent to your email!');
      setTimeout(() => {
        setScreen('reset');
        resetFormState();
      }, 1500);
    } else {
      setErrorMsg(res.error);
    }
  };

  // পাসওয়ার্ড রিসেট কমপ্লিট করা (Reset Password complete simulation)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!password || password.length < 6) {
      setErrorMsg(isBn ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    setSuccessMsg(isBn ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! লগইন করুন।' : 'Password updated successfully! Please login.');
    setTimeout(() => {
      setScreen('login');
      resetFormState();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-6 px-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Orbs */}
      <div className="absolute top-[-100px] right-[-100px] w-[350px] h-[350px] bg-brand-green/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-150px] w-[400px] h-[400px] bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header controls */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between relative z-10">
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'মূল পাতা' : 'Back to Home'}</span>
        </button>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </header>

      {/* Main Form Center Card */}
      <main className="flex-1 flex items-center justify-center py-10 relative z-10">
        <div className="w-full max-w-md">
          {/* Brand Mark */}
          <div className="flex flex-col items-center gap-2 text-center mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center font-display font-black text-slate-950 text-xl shadow-md shadow-brand-green/20">
              SP
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              SkillProof AI Bangladesh
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-8">
              {/* Messages */}
              {errorMsg && (
                <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2.5 animate-pulse">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-brand-green text-xs flex items-center gap-2.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* SCREEN 1: LOGIN (লগইন) */}
              {screen === 'login' && (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{t('authLoginTitle')}</h3>
                    <p className="text-xs text-slate-400 mt-1">{t('authLoginSubtitle')}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('authEmail')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('authPassword')}</label>
                      <button 
                        type="button"
                        onClick={() => setScreen('forgot')}
                        className="text-[11px] font-semibold text-brand-green hover:underline"
                      >
                        {t('authForgotPassword')}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 py-3">
                    {t('login')}
                  </Button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('or')}</span>
                    <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="py-3" 
                    onClick={() => {
                      // ডেমো অ্যাকাউন্টে সরাসরি লগইন
                      setEmail('nishat.af27@gmail.com');
                      setPassword('123456');
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-brand-green" />
                    <span>{isBn ? 'মক/ডেমো ক্রেডেনশিয়াল ফিল করুন' : 'Auto Fill Demo User'}</span>
                  </Button>

                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                    {isBn ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"}{' '}
                    <button 
                      type="button"
                      onClick={() => {
                        setScreen('signup');
                        resetFormState();
                      }}
                      className="font-semibold text-brand-green hover:underline"
                    >
                      {t('signup')}
                    </button>
                  </p>
                </form>
              )}

              {/* SCREEN 2: SIGNUP (নিবন্ধন) */}
              {screen === 'signup' && (
                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{t('authSignupTitle')}</h3>
                    <p className="text-xs text-slate-400 mt-1">{t('authSignupSubtitle')}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('authFullName')}</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="আরিফুল ইসলাম"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('authEmail')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('authPassword')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 py-3">
                    {t('signup')}
                  </Button>

                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                    {isBn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
                    <button 
                      type="button"
                      onClick={() => {
                        setScreen('login');
                        resetFormState();
                      }}
                      className="font-semibold text-brand-green hover:underline"
                    >
                      {t('login')}
                    </button>
                  </p>
                </form>
              )}

              {/* SCREEN 3: FORGOT PASSWORD (ভুলে যাওয়া পাসওয়ার্ড) */}
              {screen === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{t('authForgotPassword')}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isBn 
                        ? 'আপনার অ্যাকাউন্টের ইমেইল দিন। আমরা পাসওয়ার্ড রিসেট করার জন্য একটি মক ওটিপি কোড তৈরি করে দেব।' 
                        : 'Enter your account email. We will generate a mock OTP code for resetting.'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('authEmail')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 py-3">
                    {isBn ? 'রিসেট লিঙ্ক পাঠান' : 'Send Reset Link'}
                  </Button>

                  <button 
                    type="button"
                    onClick={() => {
                      setScreen('login');
                      resetFormState();
                    }}
                    className="text-xs text-center text-brand-green hover:underline font-semibold"
                  >
                    {isBn ? 'লগইন-এ ফিরে যান' : 'Back to Login'}
                  </button>
                </form>
              )}

              {/* SCREEN 4: EMAIL VERIFICATION / OTP (ওটিপি ভেরিফিকেশন) */}
              {screen === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{t('authVerifyTitle')}</h3>
                    <p className="text-xs text-slate-400 mt-1">{t('authVerifySubtitle')}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('authOtpLabel')}</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green tracking-widest font-bold font-mono text-center transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 text-center mt-1">
                      {isBn ? 'সিমুলেটেড টেস্ট কোড: 123456' : 'Simulated Test Code: 123456'}
                    </span>
                  </div>

                  <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 py-3">
                    {t('authVerifyBtn')}
                  </Button>
                </form>
              )}

              {/* SCREEN 5: RESET PASSWORD (নতুন পাসওয়ার্ড আপডেট) */}
              {screen === 'reset' && (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{isBn ? 'নতুন পাসওয়ার্ড দিন' : 'Enter New Password'}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isBn ? 'আপনার নতুন সুরক্ষিত পাসওয়ার্ডটি পুনরায় লিখুন।' : 'Please enter your new secure password.'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-all"
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="primary" isLoading={isLoading} className="mt-2 py-3">
                    {isBn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                  </Button>
                </form>
              )}
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-slate-400 relative z-10 mt-6">
        &copy; {new Date().getFullYear()} SkillProof AI Bangladesh. Crafted for high-performance talent verification.
      </footer>
    </div>
  );
};
