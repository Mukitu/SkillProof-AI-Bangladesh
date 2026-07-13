/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Button, Card, Badge, ThemeSwitch, LanguageSwitch 
} from './UI';
import { 
  CheckCircle, ArrowRight, Star, HelpCircle, Code, ShieldCheck, 
  Terminal, Sparkles, BookOpen, Award, Users, Layers, ChevronRight,
  MapPin, Phone, Mail, Globe, Brain, Zap, Briefcase, TrendingUp, BarChart3,
  Flame, CheckCircle2, DollarSign, Quote, Map, GraduationCap, Check
} from 'lucide-react';
import { adminDb } from '../lib/adminSupabase';

interface LandingPageProps {
  onNavigateToAuth: (screen: 'login' | 'signup') => void;
  onEnterDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToAuth,
  onEnterDemo
}) => {
  const { t, isBn } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any[]>([]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const tests = await adminDb.getTestimonials();
        const stats = await adminDb.getStatistics();
        setTestimonials(tests);
        setStatistics(stats);
      } catch (err) {
        console.error('Error fetching landing page assets:', err);
      }
    };
    fetchLandingData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  // FAQs
  const faqs = [
    { q: t('faqQ1'), a: t('faqA1') },
    { q: t('faqQ2'), a: t('faqA2') },
    { q: t('faqQ3'), a: t('faqA3') },
    {
      q: isBn ? 'লঞ্চপ্যাড ও জব প্লেসমেন্ট কীভাবে হয়?' : 'How does job placement and launchpad work?',
      a: isBn 
        ? 'আপনার অর্জিত স্কিল পাসপোর্ট সরাসরি আমাদের ৪৫+ পার্টনার রিক্রুটারদের ড্যাশবোর্ডে তালিকাভুক্ত হয়। যোগ্য প্রার্থীরা সরাসরি ইন্টারভিউ কল পেয়ে থাকেন।' 
        : 'Your verified Skill Passport is listed directly on our partner recruiters dashboard. Eligible candidates receive interview calls directly.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-brand-green/20 selection:text-brand-green">
      
      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center font-display font-black text-slate-950 text-lg shadow-sm shadow-brand-green/25">
              SP
            </div>
            <span className="font-display font-bold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white">
              SkillProof <span className="text-brand-green">AI</span> Bangladesh
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitch />
            <ThemeSwitch />
            <button 
              onClick={() => onNavigateToAuth('login')}
              className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t('login')}
            </button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => onNavigateToAuth('signup')}
            >
              {t('signup')}
            </Button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 md:py-32 px-6">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-green/5 dark:bg-brand-green/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-brand-blue/5 dark:bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 mb-6 font-mono"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-green animate-pulse" />
            <span>{isBn ? '🇧🇩 প্রথম স্কিল-ভেরিফিকেশন প্ল্যাটফর্ম' : '🇧🇩 No. 1 Skill Verification platform'}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-6"
          >
            {t('heroTitle')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10"
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={() => onNavigateToAuth('signup')}>
              {t('heroCtaPrimary')}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={onEnterDemo}>
              {t('heroCtaSecondary')}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 3. STATISTICS SECTION */}
      <section className="py-12 bg-white dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-900 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {statistics.length > 0 ? (
              statistics.map((stat, idx) => (
                <motion.div 
                  key={stat.id || idx} 
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1, type: "spring", stiffness: 100 }}
                  className={`flex flex-col items-center justify-center p-4 ${
                    idx > 0 ? 'border-l border-slate-100 dark:border-slate-800 font-semibold' : ''
                  }`}
                >
                  <span className={`text-3xl md:text-4xl font-black font-display ${stat.color || 'text-brand-green'}`}>
                    {stat.value}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {isBn ? stat.label : stat.labelEn}
                  </span>
                </motion.div>
              ))
            ) : (
              <>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0, type: "spring", stiffness: 100 }}
                  className="flex flex-col items-center justify-center p-4"
                >
                  <span className="text-3xl md:text-4xl font-black text-brand-green font-display">১৫,০০০+</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {isBn ? 'সম্পন্ন মূল্যায়ন' : 'Assessments Completed'}
                  </span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 }}
                  className="flex flex-col items-center justify-center p-4 border-l border-slate-100 dark:border-slate-800"
                >
                  <span className="text-3xl md:text-4xl font-black text-brand-blue font-display">৯৪.২%</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {isBn ? 'এআই নির্ভুলতার হার' : 'AI Accuracy Rate'}
                  </span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
                  className="flex flex-col items-center justify-center p-4 border-l border-slate-100 dark:border-slate-800"
                >
                  <span className="text-3xl md:text-4xl font-black text-purple-500 font-display">২,৫০০+</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {isBn ? 'ভেরিফাইড ট্যালেন্ট' : 'Verified Talents'}
                  </span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
                  className="flex flex-col items-center justify-center p-4 border-l border-slate-100 dark:border-slate-800"
                >
                  <span className="text-3xl md:text-4xl font-black text-emerald-500 font-display">৪৫+</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    {isBn ? 'অংশীদার নিয়োগকর্তা' : 'Partner Recruiters'}
                  </span>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-20 px-6 bg-slate-100/50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              {t('howItWorksTitle')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {t('howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0, type: "spring", stiffness: 100 }}
            >
              <Card hoverEffect className="relative flex flex-col h-full gap-4 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900">
                <div className="h-10 w-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">{t('step1Title')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('step1Desc')}</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 }}
            >
              <Card hoverEffect className="relative flex flex-col h-full gap-4 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900">
                <div className="h-10 w-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">{t('step2Title')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('step2Desc')}</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
            >
              <Card hoverEffect className="relative flex flex-col h-full gap-4 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">{t('step3Title')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('step3Desc')}</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. KEY FEATURE SPOTLIGHTS */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              {isBn ? 'চাকরি খোঁজার আধুনিক এআই সল্যুশন' : 'Modern AI Recruitment Solutions'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isBn ? 'সিভির গালভরা বয়ানের পরিবর্তে কাজের বাস্তব প্রমাণের ওপর জোর দিন।' : 'Focus on actual work performance rather than embellished resume statements.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              <Card className="flex flex-col h-full gap-3 bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-green" />
                </div>
                <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">{t('featCvTitle')}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('featCvDesc')}</p>
                <div className="mt-auto pt-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                    <Check className="w-3 h-3" /> {isBn ? 'সক্রিয় আছে' : 'Active & Live'}
                  </span>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="flex flex-col h-full gap-3 bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-brand-blue" />
                </div>
                <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">{t('featInterviewTitle')}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('featInterviewDesc')}</p>
                <div className="mt-auto pt-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                    <Check className="w-3 h-3" /> {isBn ? 'সক্রিয় আছে' : 'Active & Live'}
                  </span>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="flex flex-col h-full gap-3 bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-purple-500" />
                </div>
                <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">{t('featAdaptiveTitle')}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('featAdaptiveDesc')}</p>
                <div className="mt-auto pt-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                    <Check className="w-3 h-3" /> {isBn ? 'সক্রিয় আছে' : 'Active & Live'}
                  </span>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE SKILLPROOF SECTION (Bento Grid) */}
      <section className="py-24 px-6 bg-slate-100/30 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
              {isBn ? 'কেন SkillProof বেছে নেবেন?' : 'Why Choose SkillProof?'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isBn ? 'প্রথাগত নিয়োগ প্রক্রিয়ার সীমাবদ্ধতা কাটিয়ে রিক্রুটমেন্টে আনুন শতভাগ স্বচ্ছতা।' : 'Break free from credentials limitations and establish transparency in hiring.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0, type: "spring", stiffness: 100 }}
            >
              <Card hoverEffect className="p-6 flex flex-col h-full gap-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {isBn ? 'অসাধু উপায় মুক্ত ইন্টারভিউ' : '100% Secure & Cheat-Free'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isBn 
                    ? 'আমাদের অ্যাডাপ্টিভ ক্যামেরা এবং ভয়েস প্রক্টরিং নিশ্চিত করে পরীক্ষার্থী সৎভাবে রিয়েল-টাইম ইন্টারভিউ সম্পন্ন করছেন।'
                    : 'Our intelligent audio-visual proctoring secures the mock-room integrity and flags external help in real-time.'}
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100 }}
            >
              <Card hoverEffect className="p-6 flex flex-col h-full gap-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {isBn ? 'তাৎক্ষণিক এআই ফিডব্যাক' : 'Instant In-Depth Analytics'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isBn 
                    ? 'কোনো অপেক্ষা ছাড়াই প্রতিটি উত্তর দেওয়ার সাথে সাথে আপনার ব্যাকরণ, সাবলীলতা ও টেকনিক্যাল সঠিকতার স্কোর পেয়ে যান।'
                    : 'Receive comprehensive evaluation and detailed advice covering grammar, fluency, and code logic accuracy.'}
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
            >
              <Card hoverEffect className="p-6 flex flex-col h-full gap-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {isBn ? 'সরাসরি চাকরিদাতার কাছে পৌঁছান' : 'Direct Employer Access'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isBn 
                    ? 'ইমেইলে ডেমো সিভির বদলে আপনার ভেরিফাইড স্কিল পাসপোর্ট পাঠিয়ে দিন যা নিয়োগদাতাদের প্রথম দর্শনেই আকৃষ্ট করবে।'
                    : 'Skip traditional job board queues by sharing a cryptographically verified and fully interactive Skill Passport.'}
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. SKILL PASSPORT DETAILED SECTION */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-purple-500/10 text-purple-500 mb-4 font-bold">
              {isBn ? 'ডিজিটাল স্কিল পাসপোর্ট' : 'DIGITAL SKILL PASSPORT'}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
              {isBn ? 'আপনার অর্জিত দক্ষতার এক অনন্য প্রমাণপত্র' : 'Verify Your Capabilities and Share Internationally'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              {isBn 
                ? 'স্কিল পাসপোর্ট হল আপনার অর্জিত স্কোর, এআই ইন্টারভিউ অডিও ক্লিপিং এবং কোডিং প্রজেক্টের ভেরিফাইড ট্রেইল। এটি লিঙ্কডইন, রিজিউম বা ডিরেক্ট ক্লায়েন্টের সাথে শেয়ার করে নিজের যোগ্যতার শতভাগ গ্যারান্টি দিন।'
                : 'The Skill Passport lists all your verified technology stacks, live performance scores, and real-time AI interview evaluations in one secure, sharing-ready link.'}
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
                <span>{isBn ? 'এআই দ্বারা ভেরিফাইড গ্লোবাল কোডিং ব্যাজ' : 'AI-verified global badges across 15+ tech tracks'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
                <span>{isBn ? 'নিয়োগদাতাদের জন্য সরাসরি অডিও রেকর্ড শোনার সুযোগ' : 'Allow employers to listen to verified voice/answers'}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
                <span>{isBn ? 'অ্যাডভান্সড কিউআর কোড ভেরিফিকেশন সিস্টেম' : 'Advanced QR Code integration for print resumes'}</span>
              </li>
            </ul>
          </div>
          
          <div className="relative">
            {/* Hologram card effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-green/20 via-brand-blue/10 to-purple-500/20 blur-2xl rounded-3xl -z-10" />
            <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-8 shadow-xl max-w-md mx-auto">
              <div className="flex justify-between items-start border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center font-display font-black text-black text-xs">SP</span>
                    <span className="text-xs tracking-wider text-slate-500 font-bold uppercase font-mono">SkillProof Passport</span>
                  </div>
                  <h4 className="text-lg font-bold font-display mt-2">Mukitu Islam Nishat</h4>
                  <p className="text-xs text-brand-green font-mono">ID: SP-78891-BD</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-white p-1">
                  {/* Mock QR Code */}
                  <div className="grid grid-cols-4 gap-0.5 h-full w-full">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`h-full w-full ${i % 3 === 0 || i % 5 === 1 ? 'bg-black' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Primary Stack</span>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <Badge variant="green" size="sm">React</Badge>
                    <Badge variant="blue" size="sm">Node.js</Badge>
                    <Badge variant="purple" size="sm">PostgreSQL</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-slate-800 py-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">AI Interview Score</span>
                    <p className="text-xl font-bold font-display text-emerald-400 mt-1">94%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Status</span>
                    <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> VERIFIED
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Location: Rajshahi, BD</span>
                  <span>Issued: July 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section className="py-24 px-6 bg-slate-100/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-widest">
              {isBn ? 'পরিকল্পনা ও মূল্যতালিকা' : 'PLANS & PRICING'}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mt-2 mb-4">
              {isBn ? 'সবার জন্য সহজ সাবস্ক্রিপশন' : 'Simple, Transparent Subscription'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isBn ? 'কোনো লুকানো চার্জ নেই, আপনার প্রয়োজন অনুযায়ী সার্ভিসগুলো ব্যবহার করুন' : 'No hidden fees or contracts. Cancel your active subscription at any time.'}
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 35 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
            >
              <Card className="flex flex-col p-8 border-brand-green bg-white dark:bg-slate-900 shadow-xl relative ring-2 ring-brand-green/20">
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-brand-green text-slate-950 text-[10px] font-black uppercase tracking-widest">
                  {isBn ? 'অল-ইন-ওয়ান প্ল্যান' : 'ALL-IN-ONE PRO'}
                </div>
                <div className="mb-6 text-center">
                  <h4 className="text-xl font-bold font-display text-slate-800 dark:text-slate-200">{isBn ? 'প্রো সাবস্ক্রিপশন' : 'Pro Subscription'}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {isBn ? 'আমাদের এআই সার্ভিসগুলোর সম্পূর্ণ আনলিমিটেড অ্যাক্সেস' : 'Complete premium access to all AI evaluators and trackers'}
                  </p>
                  <div className="flex items-baseline justify-center mt-6 gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">৳২</span>
                    <span className="text-base text-slate-500 dark:text-slate-400">/ {isBn ? 'প্রতিদিন' : 'per day'}</span>
                  </div>
                  <p className="text-xs text-brand-green font-bold mt-2.5 bg-brand-green/10 py-1 px-3 rounded-full inline-block">
                    {isBn ? 'দিনে মাত্র ২ টাকা কাটবে (par day)' : 'Only 2 TK deducted per day'}
                  </p>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 mb-8 border-t border-slate-100 dark:border-slate-800/80 pt-6">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-brand-green shrink-0" />
                    <span>{isBn ? 'আনলিমিটেড এআই সিভি বিশ্লেষণ ও স্মার্ট রেটিং' : 'Unlimited AI CV feedback and formatting profiles'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-brand-green shrink-0" />
                    <span>{isBn ? 'আনলিমিটেড এআই ভাইভা ও স্পিচ টেস্ট সিমুলেশন' : 'Unlimited AI Mock Interviews and Retakes'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-brand-green shrink-0" />
                    <span>{isBn ? 'শেয়ারযোগ্য ভেরিফাইড ডিজিটাল স্কিল পাসপোর্ট' : 'Public sharing-ready verified Skill Passport'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-brand-green shrink-0" />
                    <span>{isBn ? 'কাস্টম এআই ক্যারিয়ার রোডম্যাপ জেনারেটর' : 'Interactive custom AI Career Roadmap Builder'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-brand-green shrink-0" />
                    <span>{isBn ? 'পার্টনার কোম্পানিগুলোর ডিরেক্ট রিক্রুটমেন্টে তালিকাভুক্তি' : 'Direct profiling on tech recruiters dashboard'}</span>
                  </li>
                </ul>
                <Button variant="primary" className="w-full mt-auto py-3 text-xs font-bold" onClick={() => onNavigateToAuth('signup')}>
                  {isBn ? 'প্রো-তে আপগ্রেড করুন' : 'Upgrade To Pro'}
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS SECTION */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-widest">
              {isBn ? 'ব্যবহারকারীদের মতামত' : 'USER REVIEWS'}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mt-2 mb-4">
              {isBn ? 'সফল পেশাজীবীদের মুখে আমাদের কথা' : 'Success Stories from Verified Talents'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isBn ? 'হাজারো বাংলাদেশি প্রোগ্রামার ও রিক্রুটারের বিশ্বস্ত সহকারী' : 'Trusted by thousands of software developers and tech recruiters in Bangladesh'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials && testimonials.length > 0 ? (
              testimonials.map((test, idx) => {
                const safeRating = Math.max(1, Math.min(5, Number(test.rating) || 5));
                return (
                  <motion.div
                    key={test.id || idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="h-full"
                  >
                    <Card hoverEffect className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex gap-1 mb-4 text-amber-500">
                          {[...Array(safeRating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed mb-6">
                          "{test.comment}"
                        </p>
                      </div>
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-200/40 dark:border-slate-800">
                        <img 
                          src={test.image_url} 
                          alt={test.name} 
                          className="w-10 h-10 rounded-full object-cover border border-brand-green" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
                          }}
                        />
                        <div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white font-display">{test.name}</h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{test.role}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl">
                <p className="text-xs text-slate-500">মন্তব্য লোড হচ্ছে বা কোনো মন্তব্য পাওয়া যায়নি।</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section className="py-20 px-6 bg-slate-100/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
              {t('faqTitle')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {t('faqSubtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card 
                key={idx} 
                hoverEffect={false}
                className="cursor-pointer border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-brand-green shrink-0" />
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{faq.q}</h4>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-90' : ''}`} />
                </div>
                {activeFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 leading-relaxed"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 11. CONTACT SECTION */}
      <section className="py-24 px-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-widest">
              {isBn ? 'যোগাযোগ করুন' : 'CONTACT US'}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mt-2 mb-4">
              {isBn ? 'আমরা সবসময় আপনার সেবায় আছি' : 'Get In Touch With Us'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isBn ? 'যেকোনো জিজ্ঞাসা বা সাহায্যের জন্য আমাদের সাথে যোগাযোগ করতে দ্বিধা করবেন না।' : 'Have a question or custom request? Feel free to contact us.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card hoverEffect className="p-6 text-center border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg font-display mb-2">{isBn ? 'ঠিকানা' : 'Address'}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">📍 রাজশাহী, বাংলাদেশ</p>
              <p className="text-xs text-slate-400 mt-1">{isBn ? 'সরাসরি এসে কথা বলুন' : 'Visit our physical hub'}</p>
            </Card>

            <Card hoverEffect className="p-6 text-center border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 text-brand-blue flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg font-display mb-2">{isBn ? 'হটলাইন' : 'Hotline'}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-bold font-mono">☎ +8801877913760</p>
              <p className="text-xs text-slate-400 mt-1">{isBn ? 'সকাল ৯টা - রাত ৮টা' : 'Sat - Thu, 9 AM - 8 PM'}</p>
            </Card>

            <Card hoverEffect className="p-6 text-center border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg font-display mb-2">{isBn ? 'সাপোর্ট ইমেল' : 'Support Email'}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold font-mono">support@skillproof.top</p>
              <p className="text-xs text-slate-400 mt-1">{isBn ? '২৪ ঘণ্টার মধ্যে উত্তর' : 'Response within 24 hours'}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-brand-green flex items-center justify-center font-display font-black text-slate-950 text-base">
                SP
              </div>
              <span className="font-display font-bold text-white tracking-tight">
                SkillProof <span className="text-brand-green">AI</span> Bangladesh
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              {t('taglineBn')}<br />
              {t('tagline')}
            </p>
          </div>

          <div>
            <h5 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">{isBn ? 'লিঙ্কসমূহ' : 'Links'}</h5>
            <ul className="space-y-2.5 text-sm">
              <li><button onClick={onEnterDemo} className="hover:text-white transition-colors">{t('heroCtaSecondary')}</button></li>
              <li><button onClick={() => onNavigateToAuth('signup')} className="hover:text-white transition-colors">{isBn ? 'নিবন্ধন' : 'Signup'}</button></li>
              <li><a href="#faq" className="hover:text-white transition-colors">{t('faqTitle')}</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">{isBn ? 'যোগাযোগ' : 'Contact'}</h5>
            <p className="text-sm text-slate-400">
              📍 রাজশাহী, বাংলাদেশ (Rajshahi, Bangladesh)<br />
              Hotline: +8801877913760<br />
              support@skillproof.top
            </p>
          </div>
        </div>

        {/* BDAPPS SUPPORT SECTION */}
        <div className="max-w-7xl mx-auto border-t border-slate-900 mt-12 pt-10 text-center flex flex-col items-center justify-center gap-4">
          <span className="text-xs uppercase tracking-widest text-slate-500 font-mono font-bold">
            {isBn ? 'আমাদের পার্টনার ও সহযোগী' : 'Supported By'}
          </span>
          <div className="bg-slate-900/50 px-6 py-4 rounded-2xl border border-slate-800 inline-flex flex-col items-center justify-center gap-2">
            {/* Beautiful, responsive custom SVG vector representation of the bdapps logo */}
            <svg viewBox="0 0 420 120" className="h-10 md:h-12 w-auto max-w-[240px]" xmlns="http://www.w3.org/2000/svg">
              {/* letter b (Yellow/Orange) */}
              <path d="M 35 25 L 35 85" stroke="#F3A922" strokeWidth="11" strokeLinecap="round" />
              <circle cx="60" cy="60" r="25" stroke="#F3A922" strokeWidth="11" fill="none" />
              
              {/* letter d (Pink) */}
              <circle cx="125" cy="60" r="25" stroke="#E63B7A" strokeWidth="11" fill="none" />
              <path d="M 150 25 L 150 85" stroke="#E63B7A" strokeWidth="11" strokeLinecap="round" />
              
              {/* letter a (Purple/Plum) */}
              <circle cx="205" cy="60" r="25" stroke="#7B2665" strokeWidth="11" fill="none" />
              <path d="M 230 45 L 230 85 C 230 90 234 90 234 85" stroke="#7B2665" strokeWidth="11" strokeLinecap="round" fill="none" />
              
              {/* letter p (Purple/Plum) */}
              <circle cx="285" cy="60" r="25" stroke="#7B2665" strokeWidth="11" fill="none" />
              <path d="M 260 45 L 260 105" stroke="#7B2665" strokeWidth="11" strokeLinecap="round" />
              
              {/* letter p (Orange) */}
              <circle cx="345" cy="60" r="25" stroke="#F26722" strokeWidth="11" fill="none" />
              <path d="M 320 45 L 320 105" stroke="#F26722" strokeWidth="11" strokeLinecap="round" />
              
              {/* letter s (Maroon/Red) */}
              <path d="M 395 42 C 385 42 380 48 382 55 C 384 62 396 61 396 68 C 396 74 388 77 381 77" stroke="#B31B5B" strokeWidth="11" strokeLinecap="round" fill="none" />
            </svg>
            <span className="text-[11px] font-semibold text-slate-500 font-sans tracking-wide">
              Supported by bdapps
            </span>
          </div>
        </div>

        {/* COPYRIGHT & CREDITS */}
        <div className="max-w-7xl mx-auto border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span>&copy; {new Date().getFullYear()} SkillProof AI Bangladesh. All rights reserved.</span>
          <span className="font-sans text-center sm:text-right">
            Designed & Developed by <strong className="text-white">Mukitu Islam Nishat</strong>, Founder of <span className="text-brand-green font-semibold">SkillProof AI Bangladesh</span>. Made with ❤️ for Bangladesh.
          </span>
        </div>
      </footer>
    </div>
  );
};
