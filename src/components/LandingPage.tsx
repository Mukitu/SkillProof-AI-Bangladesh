/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Button, Card, Badge, ThemeSwitch, LanguageSwitch 
} from './UI';
import { 
  CheckCircle, ArrowRight, Star, HelpCircle, Code, ShieldCheck, 
  Terminal, Sparkles, BookOpen, Award, Users, Layers, ChevronRight
} from 'lucide-react';

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
    { q: t('faqQ3'), a: t('faqA3') }
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

      {/* 3. HOW IT WORKS */}
      <section className="py-20 px-6 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-900">
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
            <Card hoverEffect className="relative flex flex-col gap-4">
              <div className="h-10 w-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">{t('step1Title')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('step1Desc')}</p>
            </Card>

            <Card hoverEffect className="relative flex flex-col gap-4">
              <div className="h-10 w-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">{t('step2Title')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('step2Desc')}</p>
            </Card>

            <Card hoverEffect className="relative flex flex-col gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">{t('step3Title')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('step3Desc')}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. KEY FEATURE SPOTLIGHTS */}
      <section className="py-24 px-6">
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
            <Card className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-green" />
              </div>
              <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">{t('featCvTitle')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('featCvDesc')}</p>
              <div className="mt-4"><Badge>{t('comingSoon')}</Badge></div>
            </Card>

            <Card className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-blue" />
              </div>
              <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">{t('featInterviewTitle')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('featInterviewDesc')}</p>
              <div className="mt-4"><Badge>{t('comingSoon')}</Badge></div>
            </Card>

            <Card className="flex flex-col gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-purple-500" />
              </div>
              <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">{t('featAdaptiveTitle')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('featAdaptiveDesc')}</p>
              <div className="mt-4"><Badge>{t('comingSoon')}</Badge></div>
            </Card>
          </div>
        </div>
      </section>



      {/* 7. FAQ SECTION */}
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

      {/* 8. FOOTER */}
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
              <li><a href="#" className="hover:text-white transition-colors">{t('heroCtaSecondary')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('faqTitle')}</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">{isBn ? 'যোগাযোগ' : 'Contact'}</h5>
            <p className="text-sm text-slate-400">
              ঢাকা, বাংলাদেশ (Dhaka, Bangladesh)<br />
              support@skillproof.ai
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span>&copy; {new Date().getFullYear()} SkillProof AI Bangladesh. All rights reserved.</span>
          <span className="font-mono">Created with &hearts; in Bangladesh</span>
        </div>
      </footer>
    </div>
  );
};
