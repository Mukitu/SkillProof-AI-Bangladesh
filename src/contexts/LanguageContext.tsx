/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
  isBn: boolean;
}

// অনুবাদ ডিকশনারি (Bilingual Translations Dictionary)
export const translations = {
  // Common / সাধারণ
  appName: 'SkillProof AI Bangladesh',
  tagline: 'Skills Speak Louder Than Experience.',
  taglineBn: 'অভিজ্ঞতার চেয়ে দক্ষতার প্রমাণ বেশি শক্তিশালী।',
  login: 'লগইন করুন',
  signup: 'নিবন্ধন করুন',
  logout: 'লগআউট',
  dashboard: 'ড্যাশবোর্ড',
  profile: 'প্রোফাইল',
  settings: 'সেটিংস',
  comingSoon: 'শীঘ্রই আসছে',
  submit: 'দাখিল করুন',
  cancel: 'বাতিল',
  save: 'সংরক্ষণ করুন',
  loading: 'অপেক্ষা করুন...',
  or: 'অথবা',
  bengali: 'বাংলা',
  english: 'English',

  // Landing Page / ল্যান্ডিং পেজ
  heroTitle: 'অভিজ্ঞতা নয়, দক্ষতার প্রামাণিকতায় গড়ুন আপনার ক্যারিয়ার',
  heroSubtitle: 'SkillProof AI বাংলাদেশ-এর সাথে আপনার বাস্তব দক্ষতা যাচাই করুন, সার্টিফিকেট বা ডিগ্রির চেয়ে প্রজেক্ট ও পারফরম্যান্স দিয়ে জয় করুন বিশ্ববাজার।',
  heroCtaPrimary: 'ফ্রি যাচাই করুন',
  heroCtaSecondary: 'কিভাবে কাজ করে',
  howItWorksTitle: 'কিভাবে কাজ করে এটি?',
  howItWorksSubtitle: '৩টি সহজ ধাপে আপনার দক্ষতা যাচাই করুন এবং চাকরিদাতাদের সামনে নিজেকে তুলে ধরুন।',
  step1Title: '১. সিভি আপলোড করুন',
  step1Desc: 'আপনার বর্তমান সিভি বা প্রোফাইল আপলোড করুন। আমাদের এআই এটি বিশ্লেষণ করে আপনার দক্ষতা চিহ্নিত করবে।',
  step2Title: '২. এআই ইন্টারভিউ দিন',
  step2Desc: 'বাস্তবসম্মত টেকনিক্যাল ও ভাইভা সেশনে অংশগ্রহণ করুন। আপনার উত্তরের ওপর ভিত্তি করে রিয়েল-টাইম মূল্যায়ন করা হবে।',
  step3Title: '৩. স্কিল পাসপোর্ট অর্জন',
  step3Desc: 'আপনার স্কোর অনুযায়ী দক্ষতা ব্যাজ ও শেয়ার করার যোগ্য ডিজিটাল স্কিল পাসপোর্ট লাভ করুন।',
  
  // Pricing Section
  pricingTitle: 'সবার জন্য সহজ সাবস্ক্রিপশন',
  pricingSubtitle: 'কোনো লুকানো চার্জ নেই, আপনার প্রয়োজন অনুযায়ী যেকোনো প্ল্যান বেছে নিন।',
  planFreeName: 'ফ্রি প্ল্যান',
  planFreePrice: '৳০',
  planFreePeriod: 'সর্বদা ফ্রি',
  planProName: 'প্রো প্ল্যান',
  planProPrice: '৳৯৯৯',
  planProPeriod: 'প্রতি মাস',
  planEnterpriseName: 'এন্টারপ্রাইজ',
  planEnterprisePrice: 'আলোচনা সাপেক্ষে',
  planEnterprisePeriod: 'প্রতিষ্ঠান ভিত্তিক',

  // FAQ
  faqTitle: 'সাধারণ জিজ্ঞাসা (FAQ)',
  faqSubtitle: 'আপনার মনে কোনো প্রশ্ন আছে? এখানে উত্তরগুলো দেখে নিতে পারেন।',
  faqQ1: 'SkillProof AI কি কোনো সার্টিফিকেট প্রদান করে?',
  faqA1: 'আমরা কোনো প্রথাগত সার্টিফিকেট দেই না, তবে আমরা ভেরিফাইড স্কিল পাসপোর্ট দেই যা যেকোনো চাকরির আবেদনে প্রজেক্ট এবং দক্ষতার লাইভ প্রমাণ হিসেবে ব্যবহার করা যায়।',
  faqQ2: 'ইন্টারভিউ কীভাবে নেওয়া হয়?',
  faqA2: 'আমাদের এআই আপনার বিষয়ের ওপর ভিত্তি করে রিয়েল-টাইম প্রশ্ন করে। আপনি ভয়েস বা টেক্সটের মাধ্যমে উত্তর দিতে পারেন এবং সাথে সাথে বিশদ ফিডব্যাক পাবেন।',
  faqQ3: 'আমি কি আমার সিভি পুনরায় যাচাই করতে পারবো?',
  faqA3: 'হ্যাঁ, প্রো প্ল্যানে আপনি একাধিকবার আপনার সিভি আপলোড এবং ইন্টারভিউ রিটেইক করে আপনার স্কোর বাড়াতে পারবেন।',

  // Sidebar Menu / সাইডবার মেনু
  menuDashboard: 'ড্যাশবোর্ড হোম',
  menuAICV: 'এআই সিভি এডিটর',
  menuInterview: 'এআই ভাইভা/ইন্টারভিউ',
  menuSkillPassport: 'স্কিল পাসপোর্ট',
  menuRoadmap: 'ক্যারিয়ার রোডম্যাপ',
  menuProgress: 'অগ্রগতি ট্র্যাকার',
  menuDownloads: 'ডাউনলোডসমূহ',
  menuProfile: 'আমার প্রোফাইল',
  menuSettings: 'সেটিংস ও নিরাপত্তা',

  // Features
  featCvTitle: 'এআই স্মার্ট সিভি (AI Smart CV)',
  featCvDesc: 'আপনার দক্ষতাগুলোর চুলচেরা বিশ্লেষণ করে আন্তর্জাতিক মানের এআই সিভি ড্যাশবোর্ড তৈরি করুন।',
  featInterviewTitle: 'এআই ইন্টারভিউ সিমুলেটর (AI Interview)',
  featInterviewDesc: 'দেশী-বিদেশী ইন্টারভিউ বোর্ডের আদলে বাস্তবসম্মত প্রশ্নোত্তরের মাধ্যমে প্রস্তুতি নিশ্চিত করুন।',
  featAdaptiveTitle: 'অ্যাডাপ্টিভ ভাইভা সেশন (Adaptive Interview)',
  featAdaptiveDesc: 'আপনার পূর্ববর্তী উত্তরের ওপর ভিত্তি করে কঠিন বা সহজ প্রশ্নের ধারা স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।',
  featPassportTitle: 'ডিজিটাল স্কিল পাসপোর্ট (Skill Passport)',
  featPassportDesc: 'কোড এবং প্রজেক্ট ভেরিফিকেশনের মাধ্যমে একটি শেয়ারযোগ্য ইন্টারঅ্যাক্টিভ পোর্টফোলিও লিঙ্ক অর্জন করুন।',
  featRoadmapTitle: 'পারসোনালাইজড রোডম্যাপ (Roadmap)',
  featRoadmapDesc: 'আপনার কাঙ্ক্ষিত ক্যারিয়ার অর্জনে ঘাটতি থাকা দক্ষতাগুলো শিখতে এআই গাইডড লার্নিং পথ।',
  featProgressTitle: 'রিয়েল-টাইম প্রোগ্রেস (Progress)',
  featProgressDesc: 'দক্ষতার সাপ্তাহিক এবং মাসিক অগ্রগতির চার্ট এবং অ্যাক্টিভিটি হিস্ট্রি ভিজ্যুয়ালাইজেশন।',

  // Authentication Pages / অথেনটিকেশন পেজসমূহ
  authLoginTitle: 'স্বাগতম ফিরে আসার জন্য',
  authLoginSubtitle: 'আপনার ইমেল ও পাসওয়ার্ড দিয়ে ড্যাশবোর্ডে লগইন করুন',
  authSignupTitle: 'নতুন অ্যাকাউন্ট তৈরি করুন',
  authSignupSubtitle: 'দক্ষতার ভিত্তিতে ক্যারিয়ার গড়তে আজই শুরু করুন',
  authEmail: 'ইমেইল এড্রেস',
  authPassword: 'পাসওয়ার্ড',
  authFullName: 'পূর্ণ নাম',
  authForgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
  authResetPassword: 'পাসওয়ার্ড রিসেট করুন',
  authDonthaveAccount: 'অ্যাকাউন্ট নেই? নতুন অ্যাকাউন্ট খুলুন',
  authAlreadyhaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন',
  authVerifyTitle: 'ইমেইল ভেরিফিকেশন',
  authVerifySubtitle: 'আপনার ইমেইলে প্রেরিত ওটিপি (OTP) কোডটি লিখুন',
  authOtpPlaceholder: '৬ ডিজিটের কোড (123456)',
  authOtpLabel: 'নিশ্চিতকরণ কোড',
  authVerifyBtn: 'ভেরিফাই ও লগইন করুন',

  // Stats / পরিসংখ্যান
  statTitleOverall: 'সামগ্রিক স্কোর',
  statTitleInterviews: 'সম্পন্ন ইন্টারভিউ',
  statTitleBadges: 'অর্জিত ব্যাজ',
  statTitleProgress: 'অগ্রগতি সূচক',
  recentActivity: 'সাম্প্রতিক কর্মকাণ্ড',
  emptyActivity: 'এখনো কোনো কর্মকাণ্ড নেই! আপনার প্রথম সিভি আপলোড বা ইন্টারভিউ শুরু করুন।',

  // Profile Page
  profInfo: 'ব্যক্তিগত তথ্য',
  profEducation: 'শিক্ষাগত যোগ্যতা',
  profExperience: 'কাজের অভিজ্ঞতা',
  profSkills: 'দক্ষতা ও কারিগরি জ্ঞান',
  profSocials: 'সোশ্যাল লিঙ্কসমূহ',
  profEditSuccess: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!',

  // Settings Page
  setTheme: 'থিম সিলেকশন',
  setLang: 'ভাষা পরিবর্তন',
  setNotify: 'নোটিফিকেশন সেটিংস',
  setDanger: 'বিপজ্জনক অঞ্চল',
  setDeleteBtn: 'অ্যাকাউন্ট সম্পূর্ণ মুছে ফেলুন',
  setDeleteWarning: 'সতর্কতা: অ্যাকাউন্ট মুছে ফেললে আপনার সমস্ত ডাটা এবং ব্যাজ চিরতরে হারিয়ে যাবে।',
  setSuccess: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!'
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('bn');

  useEffect(() => {
    const savedLang = localStorage.getItem('skillproof_language') as Language;
    if (savedLang === 'bn' || savedLang === 'en') {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('skillproof_language', lang);
  };

  const t = (key: keyof typeof translations): string => {
    const translation = translations[key];
    if (!translation) return String(key);
    
    // Default to Bangla-First or fallback to translation
    return translation;
  };

  const isBn = language === 'bn';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isBn }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
