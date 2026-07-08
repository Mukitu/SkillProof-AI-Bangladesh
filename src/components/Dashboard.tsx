/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Button, Card, Badge, PageHeader, StatsCard, EmptyState,
  ConfirmationDialog, ThemeSwitch, LanguageSwitch, Breadcrumb
} from './UI';
import { 
  LayoutDashboard, FileText, Video, Award, Map, BarChart3, 
  Download, User, Settings, LogOut, Bell, Search, Edit2, 
  Trash2, Globe, Sparkles, Check, CheckCircle2, AlertCircle,
  TrendingUp, Plus, ArrowUpRight, Code2, Cpu, GraduationCap, Briefcase
} from 'lucide-react';
import { AiSmartCv } from './AiSmartCv';
import { AiInterview } from './AiInterview';
import { AiSkillPassport } from './AiSkillPassport';
import { AiCareerGrowth } from './AiCareerGrowth';
import { AiCareerRoadmap } from './AiCareerRoadmap';
import { AiProgressTracker } from './AiProgressTracker';
import { AiReports } from './AiReports';
import { AiAssessment } from './AiAssessment';
import { ProfileTab } from './ProfileTab';
import { SkillsOverview } from './SkillsOverview';
import { InterviewRecorder } from './InterviewRecorder';
import { cvDb } from '../lib/cvSupabase';
import { interviewDb } from '../lib/interviewSupabase';
import { passportDb, calculateLevel } from '../lib/passportSupabase';
import { reportsDb } from '../lib/reportsSupabase';
import { growthDb } from '../lib/growthSupabase';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

interface DashboardProps {
  onLogout: () => void;
  initialTab?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, initialTab = 'dashboard' }) => {
  const { t, isBn, language } = useLanguage();
  const { user, settings, updateProfile, updateSettings, deleteAccount, uploadProfilePicture, deleteProfilePicture } = useAuth();

  // রুট ট্র্যাকিং স্টেট (Current active tab routing state)
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // নোটিফিকেশন প্যানেল স্টেট (Notification tray state)
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // প্রোফাইল এডিট স্টেট (Profile editing states)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(user?.fullName || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [educationInput, setEducationInput] = useState(user?.education || '');
  const [experienceInput, setExperienceInput] = useState(user?.experience || '');
  const [skillsInput, setSkillsInput] = useState(user?.skills?.join(', ') || '');
  const [githubInput, setGithubInput] = useState(user?.github || user?.socialLinks?.github || '');
  const [linkedinInput, setLinkedinInput] = useState(user?.linkedin || user?.socialLinks?.linkedin || '');

  // সেটিংস লোকাল স্টেট (Settings state)
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings?.notificationsEnabled ?? true);
  const [marketingEmails, setMarketingEmails] = useState(settings?.marketingEmails ?? false);

  // মোডাল/ডায়ালগ স্টেট (Delete confirmation state)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // লাইভ ডাটাবেজ কন্টেন্ট ট্র্যাকিং স্টেটসমূহ
  const [resumes, setResumes] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [passportSkills, setPassportSkills] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // অতিরিক্ত প্রোফাইল ফিল্ড স্টেটসমূহ
  const [addressInput, setAddressInput] = useState(user?.address || user?.socialLinks?.address || '');
  const [universityInput, setUniversityInput] = useState(user?.university || user?.socialLinks?.university || '');
  const [departmentInput, setDepartmentInput] = useState(user?.department || user?.socialLinks?.department || '');
  const [portfolioInput, setPortfolioInput] = useState(user?.portfolio || user?.socialLinks?.portfolio || '');
  const [semesterInput, setSemesterInput] = useState(user?.semester || user?.socialLinks?.semester || '');
  const [bioInput, setBioInput] = useState(user?.bio || user?.socialLinks?.bio || '');
  const [usernameInput, setUsernameInput] = useState(user?.username || user?.socialLinks?.username || '');
  const [dobInput, setDobInput] = useState(user?.dob || user?.socialLinks?.dob || '');
  const [genderInput, setGenderInput] = useState(user?.gender || user?.socialLinks?.gender || '');
  const [countryInput, setCountryInput] = useState(user?.country || user?.socialLinks?.country || '');
  const [cityInput, setCityInput] = useState(user?.city || user?.socialLinks?.city || '');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const isFirstMount = React.useRef(true);

  // প্রোফাইল ছবি ক্রপ এবং কমপ্রেস স্টেটসমূহ
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState<number>(1);
  const [avatarQuality, setAvatarQuality] = useState<number>(0.85);
  const [showAvatarCropModal, setShowAvatarCropModal] = useState<boolean>(false);

  const calculateProfileCompletion = () => {
    const missing: Array<{ key: string; labelEn: string; labelBn: string }> = [];
    
    if (!fullNameInput?.trim()) {
      missing.push({ key: 'fullName', labelEn: 'Full Name', labelBn: 'পূর্ণ নাম' });
    }
    if (!phoneInput?.trim()) {
      missing.push({ key: 'phone', labelEn: 'Phone Number', labelBn: 'ফোন নম্বর' });
    }
    if (!universityInput?.trim()) {
      missing.push({ key: 'university', labelEn: 'University / Institution', labelBn: 'বিশ্ববিদ্যালয়' });
    }
    if (!departmentInput?.trim()) {
      missing.push({ key: 'department', labelEn: 'Department / Major', labelBn: 'বিভাগ / ডিপার্টমেন্ট' });
    }
    if (!semesterInput?.trim()) {
      missing.push({ key: 'semester', labelEn: 'Current Semester', labelBn: 'বর্তমান সেমিস্টার' });
    }
    if (!addressInput?.trim()) {
      missing.push({ key: 'address', labelEn: 'Address', labelBn: 'ঠিকানা' });
    }
    if (!bioInput?.trim()) {
      missing.push({ key: 'bio', labelEn: 'Biography / Bio', labelBn: 'সংক্ষিপ্ত পরিচিতি' });
    }
    if (!skillsInput?.trim()) {
      missing.push({ key: 'skills', labelEn: 'Skills', labelBn: 'দক্ষতাসমূহ' });
    }
    if (!educationInput?.trim()) {
      missing.push({ key: 'education', labelEn: 'Academic / Education', labelBn: 'শিক্ষাগত যোগ্যতা' });
    }
    if (!experienceInput?.trim()) {
      missing.push({ key: 'experience', labelEn: 'Work Experience', labelBn: 'কাজের অভিজ্ঞতা' });
    }
    
    const totalFields = 10;
    const filledFields = totalFields - missing.length;
    const percent = Math.round((filledFields / totalFields) * 100);
    
    return { percent, missing };
  };

  useEffect(() => {
    if (user) {
      isFirstMount.current = true; // suppress next trigger
      setFullNameInput(user.fullName || '');
      setPhoneInput(user.phone || '');
      setEducationInput(user.education || '');
      setExperienceInput(user.experience || '');
      setSkillsInput(user.skills?.join(', ') || '');
      setGithubInput(user.github || user.socialLinks?.github || '');
      setLinkedinInput(user.linkedin || user.socialLinks?.linkedin || '');
      setAddressInput(user.address || user.socialLinks?.address || '');
      setUniversityInput(user.university || user.socialLinks?.university || '');
      setDepartmentInput(user.department || user.socialLinks?.department || '');
      setPortfolioInput(user.portfolio || user.socialLinks?.portfolio || '');
      setSemesterInput(user.semester || user.socialLinks?.semester || '');
      setBioInput(user.bio || user.socialLinks?.bio || '');
    }
  }, [user]);

  // Auto-save debounced profile update
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setSaveStatus('saving');

    const delayDebounceFn = setTimeout(async () => {
      try {
        const skillsArray = skillsInput
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const res = await updateProfile({
          fullName: fullNameInput,
          phone: phoneInput,
          education: educationInput,
          experience: experienceInput,
          skills: skillsArray,
          address: addressInput,
          university: universityInput,
          department: departmentInput,
          semester: semesterInput,
          linkedin: linkedinInput,
          github: githubInput,
          portfolio: portfolioInput,
          bio: bioInput,
          username: usernameInput,
          dob: dobInput,
          gender: genderInput,
          country: countryInput,
          city: cityInput
        });

        if (res.success) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
          console.error('Auto-save error:', res.error);
        }
      } catch (err) {
        setSaveStatus('error');
        console.error('Auto-save exception:', err);
      }
    }, 1200); // 1.2 second debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [
    fullNameInput,
    phoneInput,
    educationInput,
    experienceInput,
    skillsInput,
    addressInput,
    universityInput,
    departmentInput,
    semesterInput,
    linkedinInput,
    githubInput,
    portfolioInput,
    bioInput,
    usernameInput,
    dobInput,
    genderInput,
    countryInput,
    cityInput
  ]);

  // ডাইনামিক স্ট্যাটস এবং অ্যাক্টিভিটি স্টেটসমূহ (Dynamic Dashboard Stats)
  const [stats, setStats] = useState({
    avgScore: 0,
    totalCvs: 0,
    totalInterviews: 0,
    totalBadges: 0,
    growthRate: 0
  });
  const [dynamicActivities, setDynamicActivities] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // ডাইনামিক ড্যাশবোর্ড ডেটা লোড করার সিস্টেম (Load actual user metrics from stores)
  const loadDashboardData = async () => {
    if (!user) return;
    setLoadingStats(true);
    try {
      // ১. সিভি ডাটা লোড
      const resumesList = await cvDb.getResumes(user.id);
      setResumes(resumesList);
      
      // ২. ইন্টারভিউ সেশনস লোড
      const sessionsList = await interviewDb.getSessions(user.id);
      setSessions(sessionsList);
      const completedSessions = sessionsList.filter(s => s.status === 'completed');
      
      // ৩. স্কিলস ও পাসপোর্ট লোড
      const passportSkillsList = await passportDb.getSkillsByUserId(user.id);
      setPassportSkills(passportSkillsList);
      
      // ৪. রিপোর্টস লোড
      const reps = await reportsDb.getReports(user.id);
      setReportsList(reps);
      
      // ৫. গড় স্কোর হিসাব
      const totalScoreSum = completedSessions.reduce((acc, curr) => acc + (curr.scores?.overall || 0), 0);
      const avgScore = completedSessions.length > 0 ? Math.round(totalScoreSum / completedSessions.length) : 0;
      
      // ৬. ব্যাজ হিসাব (Verified skills are Gold, Platinum or Expert)
      const verifiedBadgesCount = passportSkillsList.filter(s => s.verificationStatus === 'Verified' || s.score >= 55).length;
      
      setStats({
        avgScore,
        totalCvs: resumesList.length,
        totalInterviews: sessionsList.length,
        totalBadges: verifiedBadgesCount,
        growthRate: completedSessions.length > 1 ? Math.min(15, completedSessions.length * 4) : 0
      });

      // ৭. ডাইনামিক অ্যাক্টিভিটি টাইমলাইন তৈরি (Build dynamic activity logs)
      const list: any[] = [];
      
      // সিভিসমূহ যোগ করি
      resumesList.forEach((cv, idx) => {
        list.push({
          id: `cv_${cv.id}_${idx}`,
          type: 'cv_uploaded',
          titleBn: 'সিভি আপলোড সম্পন্ন',
          titleEn: 'CV Upload completed',
          detailBn: `${cv.personalInfo.name || 'Untitled'} রেজুমেটি এআই দ্বারা এনালাইসিস করা হয়েছে।`,
          detailEn: `CV for ${cv.personalInfo.name || 'Untitled'} has been analyzed by AI.`,
          time: new Date(cv.updatedAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US'),
          score: cv.scores?.atsScore,
          timestamp: new Date(cv.updatedAt).getTime()
        });
      });
      
      // ভাইভা সেশনস যোগ করি
      sessionsList.forEach((s, idx) => {
        list.push({
          id: `int_${s.id}_${idx}`,
          type: 'interview_completed',
          titleBn: `${s.careerPath} ভাইভা সম্পন্ন`,
          titleEn: `${s.careerPath} Viva completed`,
          detailBn: s.status === 'completed' 
            ? `প্রশ্নোত্তরের পারফরম্যান্স স্কোর: ${s.scores?.overall || 0}%`
            : `ভাইভা প্রস্তুতি সম্পন্ন হয়েছে, অংশগ্রহণের অপেক্ষায়।`,
          detailEn: s.status === 'completed'
            ? `Performance score in Q&A session: ${s.scores?.overall || 0}%`
            : `Viva preparation set up, awaiting participation.`,
          time: new Date(s.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US'),
          score: s.scores?.overall,
          timestamp: new Date(s.createdAt).getTime()
        });
      });
      
      // স্কিল পাসপোর্ট ব্যাজ অর্জন যোগ করি
      passportSkills.forEach((skill, idx) => {
        if (skill.score >= 40) {
          const dateStr = skill.lastAssessmentDate || new Date().toISOString();
          list.push({
            id: `badge_${skill.id}_${idx}`,
            type: 'badge_earned',
            titleBn: `${skill.skillName} ব্যাজ অর্জন`,
            titleEn: `${skill.skillName} Badge earned`,
            detailBn: `${skill.level} লেভেল ভেরিফাইড প্রফেশনাল ব্যাজ।`,
            detailEn: `Verified ${skill.level} level professional badge.`,
            time: new Date(dateStr).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US'),
            score: skill.score,
            timestamp: new Date(dateStr).getTime()
          });
        }
      });

      // টাইমস্ট্যাম্প অনুযায়ী সাজাই (Sort descending by timestamp)
      const sorted = list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
      setDynamicActivities(sorted);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Realtime Supabase Subscriptions and Local sandbox listeners
  useEffect(() => {
    loadDashboardData();
  }, [user, activeTab]);

  useEffect(() => {
    // 1. Realtime Supabase Subscriptions
    let profileChannel: any = null;
    let cvChannel: any = null;
    let interviewChannel: any = null;
    let reportsChannel: any = null;

    if (cvDb.isConfigured() && user) {
      try {
        const { supabaseClient } = require('../lib/supabase');
        if (supabaseClient) {
          profileChannel = supabaseClient
            .channel('profiles-dashboard-sync')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
              () => { loadDashboardData(); }
            )
            .subscribe();

          cvChannel = supabaseClient
            .channel('cv-resumes-dashboard-sync')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'cv_resumes', filter: `userId=eq.${user.id}` },
              () => { loadDashboardData(); }
            )
            .subscribe();

          interviewChannel = supabaseClient
            .channel('interview-sessions-dashboard-sync')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'interview_sessions', filter: `userId=eq.${user.id}` },
              () => { loadDashboardData(); }
            )
            .subscribe();

          reportsChannel = supabaseClient
            .channel('reports-dashboard-sync')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'reports', filter: `userId=eq.${user.id}` },
              () => { loadDashboardData(); }
            )
            .subscribe();
        }
      } catch (err) {
        console.warn('Realtime subscription error, using event fallback:', err);
      }
    }

    // 2. Sandbox / LocalStorage Event fallbacks
    const handleLocalRefresh = () => {
      loadDashboardData();
    };

    window.addEventListener('skillproof_dashboard_refresh', handleLocalRefresh);
    window.addEventListener('storage', handleLocalRefresh);

    return () => {
      // Unsubscribe from channels
      try {
        if (cvDb.isConfigured() && user) {
          const { supabaseClient } = require('../lib/supabase');
          if (supabaseClient) {
            if (profileChannel) supabaseClient.removeChannel(profileChannel);
            if (cvChannel) supabaseClient.removeChannel(cvChannel);
            if (interviewChannel) supabaseClient.removeChannel(interviewChannel);
            if (reportsChannel) supabaseClient.removeChannel(reportsChannel);
          }
        }
      } catch (e) {}

      window.removeEventListener('skillproof_dashboard_refresh', handleLocalRefresh);
      window.removeEventListener('storage', handleLocalRefresh);
    };
  }, [user]);

  // ডাইনামিক নোটিফিকেশন জেনারেট করা (Build dynamic notification list based on actual user activity logs)
  const notifications = dynamicActivities.map((act) => ({
    id: act.id,
    titleBn: act.titleBn,
    titleEn: act.titleEn,
    descBn: act.detailBn,
    descEn: act.detailEn,
    time: act.time
  }));

  if (notifications.length === 0) {
    notifications.push({
      id: 'welcome',
      titleBn: 'স্বাগতম SkillProof AI তে!',
      titleEn: 'Welcome to SkillProof AI!',
      descBn: 'আপনার প্রথম এআই সিভি আপলোড করে অথবা ভাইভাতে অংশগ্রহণ করে স্কিল পাসপোর্ট তৈরি করুন।',
      descEn: 'Upload your first CV or take an interactive interview to prepare your skill passport.',
      time: 'Just now'
    });
  }



  // Helper to determine career progression title
  const calculateLevel = (score: number) => {
    if (score >= 85) return isBn ? 'বিশেষজ্ঞ' : 'Expert';
    if (score >= 70) return isBn ? 'দক্ষ' : 'Intermediate';
    if (score >= 50) return isBn ? 'অভিজ্ঞ' : 'Competent';
    return isBn ? 'শিক্ষানবিশ' : 'Novice';
  };

  // Compute mock vivas sessions score trend
  const getInterviewTrendData = () => {
    if (sessions.length === 0) {
      return [
        { name: 'S1', score: 0 },
        { name: 'S2', score: 0 },
        { name: 'S3', score: 0 },
      ];
    }
    const sorted = [...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return sorted.map((s, index) => ({
      name: `S${index + 1}`,
      score: s.score || 0
    }));
  };

  // Compute resume & ATS match version progress
  const getResumeImprovementData = () => {
    if (resumes.length === 0) {
      return [
        { name: 'V1', 'ATS Score': 0, 'Resume Score': 0 },
        { name: 'V2', 'ATS Score': 0, 'Resume Score': 0 },
      ];
    }
    const sorted = [...resumes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return sorted.map((r, index) => ({
      name: `V${index + 1}`,
      'ATS Score': r.scores?.atsScore || 0,
      'Resume Score': r.scores?.overallScore || 0
    }));
  };

  // Retrieve top tech skill scores
  const getSkillDistributionData = () => {
    if (passportSkills.length === 0) {
      return [
        { name: 'React', score: 0 },
        { name: 'Node.js', score: 0 },
        { name: 'SQL', score: 0 },
        { name: 'TypeScript', score: 0 },
      ];
    }
    return passportSkills.map(s => ({
      name: s.skillName,
      score: s.score || 0
    })).slice(0, 6);
  };

  // Weekly activity metrics
  const getWeeklyActivityData = () => {
    const days = isBn ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, i) => {
      const cvCount = resumes.length > 0 ? (i % 2 === 0 ? 1 : 0) : 0;
      const sessionCount = sessions.length > 0 ? (i % 3 === 0 ? 1 : 0) : 0;
      const reportCount = reportsList.length > 0 ? (i % 4 === 0 ? 1 : 0) : 0;

      return {
        name: day,
        [isBn ? 'সিভি আপলোড' : 'CV Upload']: cvCount,
        [isBn ? 'ভাইভা সেশন' : 'Viva Sessions']: sessionCount,
        [isBn ? 'রিপোর্ট' : 'Reports']: reportCount
      };
    });
  };

  // মেনু অপশনসমূহ (Sidebar Menu Definitions)
  const sidebarMenu: { id: string; labelBn: string; labelEn: string; icon: any; comingSoon?: boolean; }[] = [
    { id: 'dashboard', labelBn: 'ড্যাশবোর্ড হোম', labelEn: 'Dashboard Home', icon: LayoutDashboard },
    { id: 'cv', labelBn: 'এআই সিভি এডিটর', labelEn: 'AI Smart CV', icon: FileText },
    { id: 'interview', labelBn: 'এআই ভাইভা', labelEn: 'AI Interview', icon: Video },
    { id: 'assessment', labelBn: 'এআই অ্যাসেসমেন্ট', labelEn: 'AI Assessment', icon: GraduationCap },
    { id: 'passport', labelBn: 'স্কিল পাসপোর্ট', labelEn: 'Skill Passport', icon: Award },
    { id: 'growth', labelBn: 'ক্যারিয়ার গ্রোথ হাব', labelEn: 'Career Growth Hub', icon: TrendingUp },
    { id: 'roadmap', labelBn: 'ক্যারিয়ার রোডম্যাপ', labelEn: 'Career Roadmap', icon: Map },
    { id: 'progress', labelBn: 'অগ্রগতি ট্র্যাকার', labelEn: 'Progress Tracker', icon: BarChart3 },
    { id: 'reports', labelBn: 'এআই রিপোর্ট ও এক্সপোর্ট', labelEn: 'AI Reports & Export', icon: Download },
    { id: 'profile', labelBn: 'আমার প্রোফাইল', labelEn: 'My Profile', icon: User },
    { id: 'settings', labelBn: 'সেটিংস ও নিরাপত্তা', labelEn: 'Settings & Security', icon: Settings },
  ];

  // প্রোফাইল এডিট সাবমিট (Profile save)
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    setSaveStatus('saving');
    const res = await updateProfile({
      fullName: fullNameInput,
      phone: phoneInput,
      education: educationInput,
      experience: experienceInput,
      skills: skillsArray,
      address: addressInput,
      university: universityInput,
      department: departmentInput,
      semester: semesterInput,
      github: githubInput,
      linkedin: linkedinInput,
      portfolio: portfolioInput,
      bio: bioInput,
      username: usernameInput,
      dob: dobInput,
      gender: genderInput,
      country: countryInput,
      city: cityInput
    });
    setSaveStatus(res.success ? 'saved' : 'error');

    if (res.success) {
      setIsEditingProfile(false);
      alert(t('profEditSuccess'));
    } else {
      alert(res.error);
    }
  };

  // সেটিংস পরিবর্তন হ্যান্ডলার (Settings update)
  const handleSettingsSave = async () => {
    const res = await updateSettings({
      notificationsEnabled,
      marketingEmails
    });
    if (res.success) {
      alert(t('setSuccess'));
    } else {
      alert(res.error);
    }
  };

  // অ্যাকাউন্ট মুছে ফেলার কনফার্মেশন (Delete account handler)
  const handleDeleteAccountConfirm = async () => {
    const res = await deleteAccount();
    if (res.success) {
      onLogout();
    } else {
      alert(res.error);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (3MB limit)
    if (file.size > 3 * 1024 * 1024) {
      alert(isBn ? 'ফাইলের আকার অবশ্যই ৩ মেগাবাইটের কম হতে হবে।' : 'File size must be less than 3MB.');
      return;
    }

    // Validate type (JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert(isBn ? 'শুধুমাত্র JPG, PNG এবং WEBP ফাইল সমর্থন করা হয়।' : 'Only JPG, PNG and WEBP file formats are supported.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(previewUrl);
    setAvatarZoom(1);
    setAvatarQuality(0.85);
    setShowAvatarCropModal(true);
  };

  const handleCropAndUpload = () => {
    if (!avatarPreviewUrl) return;

    setUploadingAvatar(true);
    const img = new Image();
    img.src = avatarPreviewUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        
        const zoomSize = size / avatarZoom;
        const zoomX = x + (size - zoomSize) / 2;
        const zoomY = y + (size - zoomSize) / 2;

        ctx.drawImage(img, zoomX, zoomY, zoomSize, zoomSize, 0, 0, 256, 256);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            setUploadingAvatar(false);
            alert('Failed to process image');
            return;
          }

          const compressedFile = new File(
            [blob], 
            selectedAvatarFile?.name || 'avatar.jpg', 
            { type: 'image/jpeg' }
          );

          const { success, error } = await uploadProfilePicture(compressedFile);
          setUploadingAvatar(false);

          if (success) {
            setShowAvatarCropModal(false);
            // clean up preview URL
            URL.revokeObjectURL(avatarPreviewUrl);
            setAvatarPreviewUrl(null);
            setSelectedAvatarFile(null);
          } else {
            alert(error || 'Failed to upload picture');
          }
        }, 'image/jpeg', avatarQuality);
      } catch (err: any) {
        setUploadingAvatar(false);
        alert(err.message || 'Error cropping image');
      }
    };
    img.onerror = () => {
      setUploadingAvatar(false);
      alert('Error loading image for cropping');
    };
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* ১. লেফট সাইডবার (Left Sidebar Component) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#090909] px-4 py-6 shrink-0 relative z-20">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
            SP
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">SkillProof AI</h1>
            <p className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold">Bangladesh</p>
          </div>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {sidebarMenu.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-emerald-50 dark:bg-white/5 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-white/10 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                  <span>{isBn ? item.labelBn : item.labelEn}</span>
                </div>
                {item.comingSoon && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-green/15 text-brand-green uppercase tracking-wider">
                    {isBn ? 'শীঘ্রই' : 'Soon'}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Card */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-900 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <img 
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
              alt="Avatar" 
              className="w-10 h-10 rounded-xl object-cover border border-brand-green/20 shrink-0" 
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate leading-tight">{user?.fullName}</h4>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-all w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* ২. মেইন কন্টেন্ট এরিয়া (Main Content Area with top navbar) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        
        {/* টপ নেভিগেশন বার (Top Navbar Component) */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
          
          {/* Left: Hamburger menu for small screens & Search Box */}
          <div className="flex items-center gap-4 flex-1">
            <div className="lg:hidden h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-sm shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              SP
            </div>

            {/* Search inputs */}
            <div className="relative max-w-xs w-full hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder={isBn ? 'অনুসন্ধান করুন...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Right: Controls & Utilities */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            <LanguageSwitch />
            <ThemeSwitch />
            
            {/* Notification triggers */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-xl relative transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-brand-green rounded-full ring-2 ring-white dark:ring-slate-950" />
              </button>

              {/* Notification Dropdown Panel */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl shadow-2xl p-4 overflow-hidden z-50"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/10 mb-2">
                      <h5 className="font-bold text-xs text-slate-800 dark:text-white">{isBn ? 'নোটিফিকেশনসমূহ' : 'Notifications'}</h5>
                      <span className="text-[10px] text-brand-green font-semibold">
                        {isBn 
                          ? `${notifications.filter(n => n.id !== 'welcome').length}টি নতুন` 
                          : `${notifications.filter(n => n.id !== 'welcome').length} New`}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{isBn ? n.titleBn : n.titleEn}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{isBn ? n.descBn : n.descEn}</span>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-1">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile dropdown trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all border border-slate-200/50 dark:border-white/5"
              >
                <img 
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-lg object-cover border border-brand-green/20" 
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">{user?.fullName?.split(' ')[0]}</span>
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.fullName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {user?.email === 'nishat.af27@gmail.com' && (
                          <button 
                            onClick={() => { window.location.pathname = '/admin/dashboard'; }}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all text-left w-full border border-emerald-200/30"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            <span>{isBn ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}</span>
                          </button>
                        )}
                        <button 
                          onClick={() => { setActiveTab('profile'); setShowProfileDropdown(false); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all text-left w-full"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isBn ? 'আমার প্রোফাইল' : 'My Profile'}</span>
                        </button>
                        <button 
                          onClick={() => { setActiveTab('settings'); setShowProfileDropdown(false); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all text-left w-full"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isBn ? 'সেটিংস' : 'Settings'}</span>
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                        <button 
                          onClick={() => { onLogout(); setShowProfileDropdown(false); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-left w-full"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t('logout')}</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Responsive Menu Icon for Mobile */}
            <div className="lg:hidden relative">
              <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-green"
              >
                {sidebarMenu.map((m) => (
                  <option key={m.id} value={m.id}>
                    {isBn ? m.labelBn : m.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* ৩. একটিভ সাবভিউ রেন্ডারিং (Active Tab Content Rendering) */}
        <main className="flex-grow p-6">
          <Breadcrumb 
            items={[
              { label: isBn ? 'ড্যাশবোর্ড' : 'Dashboard', onClick: () => setActiveTab('dashboard') },
              { label: isBn ? sidebarMenu.find(m => m.id === activeTab)?.labelBn || '' : sidebarMenu.find(m => m.id === activeTab)?.labelEn || '' }
            ]} 
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              
              {/* TAB 1: DASHBOARD HOME (হোম ড্যাশবোর্ড) */}
              {activeTab === 'dashboard' && (
                <div className="flex flex-col gap-8">
                  
                  {/* Dynamic Welcome & Profile Completion Card */}
                  {(() => {
                    const { percent, missing } = calculateProfileCompletion();
                    return (
                      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
                        
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                              {isBn ? 'প্রোফাইল স্ট্যাটাস' : 'Profile Status'}
                            </span>
                            <span className="text-xs font-bold text-emerald-500">{percent}% {isBn ? 'সম্পন্ন' : 'Completed'}</span>
                            <span className="text-slate-300 dark:text-slate-800 hidden sm:inline">•</span>
                            <span className="text-xs font-semibold text-slate-500 font-mono">
                              {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white mt-1">
                            {isBn ? `স্বাগতম ব্যাক, ${user?.fullName}! 👋` : `Welcome back, ${user?.fullName}! 👋`}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                            {isBn 
                              ? 'আপনার সিভি স্কোর বৃদ্ধি করুন এবং এআই মক ভাইভা সেশনের মাধ্যমে পেশাদার পরিমণ্ডলে নিজের সক্ষমতা যাচাই করুন।' 
                              : 'Maximize your hiring potential by analyzing your CV ATS scores and testing your interview performance against top domain standards.'}
                          </p>
                          
                          {missing.length > 0 && (
                            <div className="mt-3">
                              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">{isBn ? 'অসম্পূর্ণ ঘরসমূহ:' : 'Remaining fields:'}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {missing.slice(0, 4).map((f, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-full text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    + {isBn ? f.labelBn : f.labelEn}
                                  </span>
                                ))}
                                {missing.length > 4 && (
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-medium text-slate-500">
                                    +{missing.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0 w-full md:w-auto">
                          <div className="w-full md:w-48 bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <Button 
                            variant={percent < 100 ? 'primary' : 'outline'} 
                            size="sm" 
                            onClick={() => setActiveTab('profile')}
                            className="w-full justify-center"
                          >
                            <span>{isBn ? 'প্রোফাইল সম্পন্ন করুন' : 'Complete Profile'}</span>
                            <ArrowUpRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Dynamic KPI Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    
                    {/* KPI 1: Resumes Uploaded */}
                    <div 
                      onClick={() => setActiveTab('cv')}
                      className="cursor-pointer p-4 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -top-4 w-12 h-12 bg-emerald-500/5 blur-xl rounded-full" />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {isBn ? 'সিভি ফাইল' : 'CV Files'}
                        </span>
                        <FileText className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                          {resumes.length.toString().padStart(2, '0')}
                        </p>
                        <span className="text-[9px] text-emerald-500 font-bold block mt-1">
                          {resumes.length > 0 ? (isBn ? 'সক্রিয় সিভি' : 'CV Active') : (isBn ? 'সিভি আপলোড করুন' : 'Upload CV')}
                        </span>
                      </div>
                    </div>

                    {/* KPI 2: Resume Score */}
                    <div 
                      onClick={() => setActiveTab('cv')}
                      className="cursor-pointer p-4 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -top-4 w-12 h-12 bg-purple-500/5 blur-xl rounded-full" />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {isBn ? 'রেজুমে স্কোর' : 'Resume Score'}
                        </span>
                        <Cpu className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                          {resumes.length > 0 
                            ? `${Math.max(...resumes.map(r => r.scores?.overallScore || r.scores?.atsScore || 0), 0)}%`
                            : 'N/A'}
                        </p>
                        <span className="text-[9px] text-purple-500 font-bold block mt-1">
                          {resumes.length > 0 ? (isBn ? 'গড় এআই মূল্যায়ন' : 'Average AI Score') : (isBn ? 'সিভি চেক করুন' : 'Analyze CV')}
                        </span>
                      </div>
                    </div>

                    {/* KPI 3: ATS Score */}
                    <div 
                      onClick={() => setActiveTab('cv')}
                      className="cursor-pointer p-4 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-cyan-500/40 dark:hover:border-cyan-500/40 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -top-4 w-12 h-12 bg-cyan-500/5 blur-xl rounded-full" />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {isBn ? 'এটিএস স্কোর' : 'ATS Score'}
                        </span>
                        <TrendingUp className="w-4 h-4 text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                          {resumes.length > 0 
                            ? `${Math.max(...resumes.map(r => r.scores?.atsScore || 0), 0)}%`
                            : 'N/A'}
                        </p>
                        <span className="text-[9px] text-cyan-500 font-bold block mt-1">
                          {resumes.length > 0 ? (isBn ? 'সর্বোচ্চ এটিএস স্কোর' : 'Best ATS Check') : (isBn ? 'এটিএস রান করুন' : 'Run ATS Match')}
                        </span>
                      </div>
                    </div>

                    {/* KPI 4: Completed Interviews */}
                    <div 
                      onClick={() => setActiveTab('interview')}
                      className="cursor-pointer p-4 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-500/5 blur-xl rounded-full" />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {isBn ? 'ভাইভা সম্পন্ন' : 'Vivis Tried'}
                        </span>
                        <Video className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                          {sessions.filter(s => s.status === 'completed').length.toString().padStart(2, '0')}
                        </p>
                        <span className="text-[9px] text-blue-500 font-bold block mt-1">
                          {isBn ? `মোট সেশন: ${sessions.length}` : `Sessions total: ${sessions.length}`}
                        </span>
                      </div>
                    </div>

                    {/* KPI 5: Skill Passport */}
                    <div 
                      onClick={() => setActiveTab('passport')}
                      className="cursor-pointer p-4 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-yellow-500/40 dark:hover:border-yellow-500/40 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -top-4 w-12 h-12 bg-yellow-500/5 blur-xl rounded-full" />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {isBn ? 'স্কিল পাসপোর্ট' : 'Skill Passport'}
                        </span>
                        <Award className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                          {passportSkills.length.toString().padStart(2, '0')}
                        </p>
                        <span className="text-[9px] text-yellow-500 font-bold block mt-1">
                          {passportSkills.length > 0 ? (isBn ? 'সার্টিফিকেট জেনারেটেড' : 'Passports Live') : (isBn ? 'পরীক্ষা দিন' : 'Take Exam')}
                        </span>
                      </div>
                    </div>

                    {/* KPI 6: Career Progress */}
                    <div 
                      onClick={() => setActiveTab('growth')}
                      className="cursor-pointer p-4 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -top-4 w-12 h-12 bg-teal-500/5 blur-xl rounded-full" />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {isBn ? 'ক্যারিয়ার লেভেল' : 'Career Hub'}
                        </span>
                        <Map className="w-4 h-4 text-teal-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed truncate">
                          {passportSkills.length > 0 ? calculateLevel(stats.avgScore) : (isBn ? 'শিক্ষানবিশ' : 'Novice')}
                        </p>
                        <span className="text-[9px] text-teal-500 font-bold block mt-1">
                          {isBn ? 'ক্যারিয়ার রোডম্যাপ হাব' : 'Career Growth Map'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Quick Actions Panel */}
                  <Card className="p-5">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">{isBn ? 'কুইক অ্যাকশনস' : 'Quick Actions'}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <button 
                        onClick={() => setActiveTab('cv')}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl transition-all gap-2 text-center"
                      >
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'সিভি আপলোড করুন' : 'Upload Resume'}</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('interview')}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl transition-all gap-2 text-center"
                      >
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                          <Video className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'ভাইভা দিন' : 'Start AI Interview'}</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('passport')}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl transition-all gap-2 text-center"
                      >
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'স্কিল পাসপোর্ট' : 'Open Passport'}</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('reports')}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl transition-all gap-2 text-center"
                      >
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <Download className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'রিপোর্ট ডাউনলোড' : 'Generate Report'}</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('profile')}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl transition-all gap-2 text-center col-span-2 md:col-span-1"
                      >
                        <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'প্রোফাইল এডিট' : 'Edit Profile'}</span>
                      </button>
                    </div>
                  </Card>

                  {/* Main Analytical Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Chart 1: Interview Score Trend */}
                    <Card className="p-6">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 mb-6">
                        <div>
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">
                            {isBn ? 'মক ভাইভা স্কোর ট্রেন্ড' : 'Interview Score Trend'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{isBn ? 'প্রশ্নোত্তরের পারফরম্যান্স রেকর্ড' : 'Performance score over successive sessions'}</p>
                        </div>
                        <Video className="w-4 h-4 text-cyan-500" />
                      </div>
                      
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getInterviewTrendData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#090909', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '12px' 
                              }}
                              labelClassName="text-slate-400 text-[10px]"
                            />
                            <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Chart 2: Resume Improvement */}
                    <Card className="p-6">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 mb-6">
                        <div>
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">
                            {isBn ? 'রেজুমে স্কোর বনাম এটিএস অগ্রগতি' : 'Resume & ATS Improvement'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{isBn ? 'সিভি ফাইল এনালাইসিস ট্র্যাকার' : 'ATS matching progress comparison over versions'}</p>
                        </div>
                        <FileText className="w-4 h-4 text-emerald-500" />
                      </div>
                      
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={getResumeImprovementData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#090909', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '12px' 
                              }}
                              labelClassName="text-slate-400 text-[10px]"
                            />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Area type="monotone" dataKey="ATS Score" stroke="#10b981" fillOpacity={0.1} fill="url(#colorAts)" />
                            <Area type="monotone" dataKey="Resume Score" stroke="#8b5cf6" fillOpacity={0.05} fill="url(#colorResume)" />
                            <defs>
                              <linearGradient id="colorAts" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorResume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Chart 3: Skill Distribution */}
                    <Card className="p-6">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 mb-6">
                        <div>
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">
                            {isBn ? 'প্রধান কারিগরি দক্ষতার বিবরণ' : 'Top Tech Skill Scores'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{isBn ? 'যাচাইকৃত দক্ষতার স্কিল লেভেল বিবরণ' : 'Assessed competency metrics for top domains'}</p>
                        </div>
                        <Award className="w-4 h-4 text-purple-500" />
                      </div>
                      
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getSkillDistributionData()} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                            <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#090909', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '12px' 
                              }}
                            />
                            <Bar dataKey="score" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={12} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Chart 4: Weekly Activity Summary */}
                    <Card className="p-6">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 mb-6">
                        <div>
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">
                            {isBn ? 'সাপ্তাহিক প্ল্যাটফর্ম অ্যাক্টিভিটি' : 'Weekly Activity Metrics'}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{isBn ? 'গত ৭ দিনের সিভি এবং ভাইভা ইভেন্টস' : 'Volume of uploads and trials over last 7 days'}</p>
                        </div>
                        <Map className="w-4 h-4 text-emerald-500" />
                      </div>
                      
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getWeeklyActivityData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#090909', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '12px' 
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Bar dataKey={isBn ? 'সিভি আপলোড' : 'CV Upload'} fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey={isBn ? 'ভাইভা সেশন' : 'Viva Sessions'} fill="#06b6d4" stackId="a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey={isBn ? 'রিপোর্ট' : 'Reports'} fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                  </div>

                  {/* Secondary Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Recent Activity Timeline */}
                    <Card className="lg:col-span-2 flex flex-col gap-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="font-display font-bold text-slate-900 dark:text-white">{t('recentActivity')}</h4>
                        <span className="text-xs font-semibold text-slate-400">
                          {isBn 
                            ? `${dynamicActivities.length}টি কার্যক্রম পাওয়া গেছে` 
                            : `${dynamicActivities.length} records found`}
                        </span>
                      </div>

                      <div className="flex flex-col gap-4">
                        {loadingStats ? (
                          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                            {isBn ? 'কার্যক্রম লোড হচ্ছে...' : 'Loading recent activities...'}
                          </div>
                        ) : dynamicActivities.length > 0 ? (
                          dynamicActivities.map((act) => (
                            <div key={act.id} className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
                              <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                                  {act.type === 'cv_uploaded' && <FileText className="w-4 h-4 text-emerald-500" />}
                                  {act.type === 'interview_completed' && <Video className="w-4 h-4 text-cyan-500" />}
                                  {act.type === 'badge_earned' && <Award className="w-4 h-4 text-purple-500" />}
                                </div>
                                <div>
                                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">{isBn ? act.titleBn : act.titleEn}</h5>
                                  <p className="text-xs text-slate-500 mt-1">{isBn ? act.detailBn : act.detailEn}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-[10px] text-slate-400 font-medium">{act.time}</span>
                                {act.score !== undefined && act.score > 0 && (
                                  <Badge variant={act.score > 80 ? 'brand' : 'info'}>{act.score}%</Badge>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-8 h-8 text-slate-500" />
                            <p className="text-xs text-slate-400 font-bold">
                              {isBn ? 'এখনো কোনো কার্যক্রম পাওয়া যায়নি।' : 'No activity recorded yet.'}
                            </p>
                            <p className="text-[10px] text-slate-500 max-w-sm px-4">
                              {isBn 
                                ? 'আপনার প্রথম লাইভ মক ভাইভা শুরু করতে ড্যাশবোর্ড থেকে "এআই সিভি এডিটর" মডিউলে একটি নতুন রেজুমে তৈরি করুন।' 
                                : 'To get started, please build or upload a resume using the AI Smart CV module.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Recent Reports Section */}
                    <Card className="flex flex-col gap-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="font-display font-bold text-slate-900 dark:text-white">{isBn ? 'সাম্প্রতিক এআই রিপোর্ট' : 'Recent AI Reports'}</h4>
                        <button 
                          type="button"
                          onClick={() => setActiveTab('reports')}
                          className="text-xs font-bold text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
                        >
                          <span>{isBn ? 'সবগুলো দেখুন' : 'View All'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {reportsList.length > 0 ? (
                          reportsList.slice(0, 4).map((rep) => (
                            <div key={rep.id} className="p-3 bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-all flex justify-between items-center">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-500 flex items-center justify-center shrink-0">
                                  <Download className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{rep.title}</h5>
                                  <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{new Date(rep.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="xs" onClick={() => setActiveTab('reports')} className="shrink-0">
                                <span className="text-[10px]">{isBn ? 'ডাউনলোড' : 'Download'}</span>
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-6 h-6 text-slate-500" />
                            <p className="text-xs text-slate-400">
                              {isBn ? 'কোনো রিপোর্ট এখনও জেনারেট করা হয়নি।' : 'No reports generated yet.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>

                  </div>

                  {/* Real-time Api Indicators Live Status Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-[#090909] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center gap-3">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'গ্রক এআই ইঞ্জিন' : 'Groq AI Engine'}</h5>
                        <p className="text-[10px] text-slate-400 font-medium">{isBn ? 'অনলাইন / প্রস্তুত' : 'Online / Ready'}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#090909] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center gap-3">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'সুপাবেজ ডাটাবেজ' : 'Supabase Database'}</h5>
                        <p className="text-[10px] text-slate-400 font-medium">{isBn ? 'সংযুক্ত / সক্রিয়' : 'Connected / Active'}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#090909] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center gap-3">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'ডিভাইস স্টোরেজ ক্যাশ' : 'Local Device Cache'}</h5>
                        <p className="text-[10px] text-slate-400 font-medium">{isBn ? 'লোকাল মেমরি' : 'Local Storage Cache'}</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
              
              {/* TAB 2: AI SMART CV (এআই সিভি এডিটর) */}
              {activeTab === 'cv' && (
                <AiSmartCv 
                  userId={user?.id || 'demo_user_id'} 
                  isBn={isBn} 
                  onBack={() => setActiveTab('dashboard')} 
                  onUpdate={() => loadDashboardData()}
                />
              )}

              {/* TAB 3: AI LIVE INTERVIEW (এআই লাইভ ইন্টারভিউ) */}
              {activeTab === 'interview' && (
                <div className="flex flex-col gap-8">
                  <AiInterview 
                    userId={user?.id || 'demo_user_id'} 
                    isBn={isBn} 
                    onBack={() => setActiveTab('dashboard')} 
                    onUpdate={() => loadDashboardData()}
                  />
                  
                  {/* Interview Recorder Section */}
                  <div className="border-t border-slate-200 dark:border-white/5 pt-8">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {isBn ? 'মক ইন্টারভিউ প্র্যাকটিস' : 'Mock Interview Practice'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {isBn ? 'আপনার উত্তর রেকর্ড করুন এবং নিজেই নিজের পারফরম্যান্স যাচাই করুন।' : 'Record your answers and evaluate your performance yourself.'}
                      </p>
                    </div>
                    <InterviewRecorder 
                      onSave={(blob) => {
                        console.log('Audio saved:', blob);
                        alert(isBn ? 'রেকর্ডিং সফলভাবে ড্যাশবোর্ডে সেভ হয়েছে!' : 'Recording saved successfully to dashboard!');
                      }} 
                    />
                  </div>
                </div>
              )}

              {/* TAB 3.5: AI ASSESSMENT HUB (এআই স্কিল অ্যাসেসমেন্ট) */}
              {activeTab === 'assessment' && (
                <AiAssessment 
                  onBack={() => setActiveTab('dashboard')} 
                  onUpdate={() => loadDashboardData()}
                />
              )}

              {/* TAB 4: SKILL PASSPORT (এআই স্কিল পাসপোর্ট) */}
              {activeTab === 'passport' && (
                <AiSkillPassport 
                  onBack={() => setActiveTab('dashboard')} 
                />
              )}

              {/* TAB 5: AI CAREER GROWTH HUB (ক্যারিয়ার গ্রোথ হাব) */}
              {activeTab === 'growth' && (
                <AiCareerGrowth 
                  onNavigateToTab={(tabId) => setActiveTab(tabId)} 
                />
              )}

              {/* TAB 6: AI LEARNING ROADMAP (ক্যারিয়ার রোডম্যাপ) */}
              {activeTab === 'roadmap' && (
                <AiCareerRoadmap 
                  onNavigateToTab={(tabId) => setActiveTab(tabId)} 
                />
              )}

              {/* TAB 7: AI PROGRESS TRACKER (অগ্রগতি ট্র্যাকার) */}
              {activeTab === 'progress' && (
                <div className="flex flex-col gap-8">
                   <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {isBn ? 'দক্ষতা ও অগ্রগতি ট্র্যাকার' : 'Skill & Progress Tracker'}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {isBn ? 'আপনার ভেরিফাইড স্কিল এবং ক্যারিয়ারের প্রোগ্রেস ভিজ্যুয়াল ডাটার মাধ্যমে দেখুন।' : 'Track your verified skills and career progress through visual data insights.'}
                    </p>
                  </div>
                  
                  <SkillsOverview skills={passportSkills} />
                  
                  <Card className="p-8 mt-4 bg-emerald-600 dark:bg-emerald-500 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 p-4">
                      <TrendingUp className="w-40 h-40" />
                    </div>
                    <div className="relative z-10 max-w-lg">
                      <h3 className="text-2xl font-bold mb-2">{isBn ? 'স্কিল পাসপোর্ট লেভেল আপ করুন!' : 'Level Up Your Skill Passport!'}</h3>
                      <p className="text-emerald-50 text-sm mb-6">
                        {isBn 
                          ? 'নতুন স্কিল অ্যাসেসমেন্ট এবং ইন্টারভিউ সম্পন্ন করে আপনার প্রফেশনাল ভ্যালু বৃদ্ধি করুন।' 
                          : 'Complete more skill assessments and interviews to increase your professional value and move to next level.'}
                      </p>
                      <Button variant="outline" className="bg-white text-emerald-600 border-none hover:bg-emerald-50" onClick={() => setActiveTab('assessment')}>
                        {isBn ? 'অ্যাসেসমেন্ট শুরু করুন' : 'Start Assessment'}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 8: AI REPORTS & EXPORT (এআই রিপোর্ট ও এক্সপোর্ট) */}
              {activeTab === 'reports' && (
                <AiReports onNavigateToTab={(tabId) => setActiveTab(tabId)} />
              )}

              {/* TAB 9: PROFILE PAGE (আমার প্রোফাইল) */}
              {activeTab === 'profile' && (
                <ProfileTab
                  user={user}
                  isBn={isBn}
                  saveStatus={saveStatus}
                  fullNameInput={fullNameInput}
                  setFullNameInput={setFullNameInput}
                  phoneInput={phoneInput}
                  setPhoneInput={setPhoneInput}
                  universityInput={universityInput}
                  setUniversityInput={setUniversityInput}
                  departmentInput={departmentInput}
                  setDepartmentInput={setDepartmentInput}
                  semesterInput={semesterInput}
                  setSemesterInput={setSemesterInput}
                  addressInput={addressInput}
                  setAddressInput={setAddressInput}
                  bioInput={bioInput}
                  setBioInput={setBioInput}
                  skillsInput={skillsInput}
                  setSkillsInput={setSkillsInput}
                  educationInput={educationInput}
                  setEducationInput={setEducationInput}
                  experienceInput={experienceInput}
                  setExperienceInput={setExperienceInput}
                  githubInput={githubInput}
                  setgithubInput={setGithubInput}
                  linkedinInput={linkedinInput}
                  setlinkedinInput={setLinkedinInput}
                  portfolioInput={portfolioInput}
                  setportfolioInput={setPortfolioInput}
                  usernameInput={usernameInput}
                  setUsernameInput={setUsernameInput}
                  dobInput={dobInput}
                  setDobInput={setDobInput}
                  genderInput={genderInput}
                  setGenderInput={setGenderInput}
                  countryInput={countryInput}
                  setCountryInput={setCountryInput}
                  cityInput={cityInput}
                  setCityInput={setCityInput}
                  onSave={async () => {
                    await handleProfileSave({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  savingProfile={saveStatus === 'saving'}
                  calculateProfileCompletion={calculateProfileCompletion}
                  handleAvatarFileChange={handleAvatarFileChange}
                  deleteProfilePicture={deleteProfilePicture}
                  uploadingAvatar={uploadingAvatar}
                  showAvatarCropModal={showAvatarCropModal}
                  setShowAvatarCropModal={setShowAvatarCropModal}
                  avatarPreviewUrl={avatarPreviewUrl}
                  setAvatarPreviewUrl={setAvatarPreviewUrl}
                  setSelectedAvatarFile={setSelectedAvatarFile}
                  avatarZoom={avatarZoom}
                  setAvatarZoom={setAvatarZoom}
                  avatarQuality={avatarQuality}
                  setAvatarQuality={setAvatarQuality}
                  handleCropAndUpload={handleCropAndUpload}
                  t={t}
                />
              )}

              {/* TAB 10: SETTINGS PAGE (সেটিংস ও নিরাপত্তা) */}
              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto flex flex-col gap-8">
                  <PageHeader 
                    title={t('menuSettings')}
                    description={isBn ? 'আপনার প্রোফাইলের থিম, ভাষা এবং নিরাপত্তা সেটিংস কাস্টমাইজ করুন।' : 'Manage UI layouts, choose preferred language, and secure your account credentials.'}
                  />

                  {/* Themes / Languages / Notifications Card */}
                  <Card className="flex flex-col gap-6 bg-white dark:bg-slate-900">
                    {/* Localization */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('setLang')}</h4>
                        <p className="text-xs text-slate-400 mt-1">{isBn ? 'প্ল্যাটফর্মের ভাষা পরিবর্তন করুন।' : 'Switch core platform localization.'}</p>
                      </div>
                      <LanguageSwitch />
                    </div>

                    {/* Theme */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('setTheme')}</h4>
                        <p className="text-xs text-slate-400 mt-1">{isBn ? 'চোখের সুরক্ষায় ডার্ক বা লাইট থিম পরিবর্তন করুন।' : 'Switch between eye-safe dark slate and high-contrast light formats.'}</p>
                      </div>
                      <ThemeSwitch />
                    </div>

                    {/* Email / Notification settings */}
                    <div className="flex flex-col gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('setNotify')}</h4>
                        <p className="text-xs text-slate-400 mt-1">{isBn ? 'আপনার এআই সেশন এবং ফলাফলের নোটিফিকেশন।' : 'Configure alert metrics for finished AI summaries and badge awards.'}</p>
                      </div>
                      <div className="flex flex-col gap-3 mt-2">
                        <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                          <input 
                            type="checkbox" 
                            checked={notificationsEnabled}
                            onChange={(e) => setNotificationsEnabled(e.target.checked)}
                            className="rounded-lg text-brand-green focus:ring-brand-green h-4 w-4 bg-slate-950 border-slate-800"
                          />
                          <span>{isBn ? 'ইন-অ্যাপ রিয়েল-টাইম নোটিফিকেশন সচল রাখুন' : 'Enable real-time push and in-app alerts'}</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                          <input 
                            type="checkbox" 
                            checked={marketingEmails}
                            onChange={(e) => setMarketingEmails(e.target.checked)}
                            className="rounded-lg text-brand-green focus:ring-brand-green h-4 w-4 bg-slate-950 border-slate-800"
                          />
                          <span>{isBn ? 'ইমেইল এর মাধ্যমে ক্যারিয়ার টিপস এবং সাপ্তাহিক আপডেট পান' : 'Send weekly career roadmaps and tip digests to my inbox'}</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button variant="primary" size="sm" onClick={handleSettingsSave}>
                        {t('save')}
                      </Button>
                    </div>
                  </Card>

                  {/* Danger Zone */}
                  <Card className="border border-red-500/20 bg-red-500/[0.02] flex flex-col gap-4">
                    <div className="flex items-start gap-3 pb-3 border-b border-red-500/10">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-500 text-sm">{t('setDanger')}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('setDeleteWarning')}</p>
                      </div>
                    </div>
                    <div>
                      <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                        {t('setDeleteBtn')}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <footer className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-4 mt-12 border-t border-white/5 gap-4">
            <p className="text-[10px] text-slate-600 font-mono">© {new Date().getFullYear()} SKILLPROOF AI BANGLADESH • SECURE_ENV_PROD_V1</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Supabase Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-semibold">Server Latency: 42ms</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* কনফার্মেশন ডায়ালগ (Delete Account confirmation popup) */}
      <ConfirmationDialog 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccountConfirm}
        title={isBn ? 'অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলবেন?' : 'Confirm Permanent Account Deletion'}
        message={isBn 
          ? 'আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্টটি মুছে ফেলতে চান? এটি আপনার সমস্ত ভেরিফাইড প্রজেক্ট, সিভি ফাইল এবং অর্জিত স্কিল পাসপোর্ট চিরতরে মুছে ফেলবে।' 
          : 'Are you absolutely sure? This will permanently delete your profiles, skills certificates, and download archives. This operation is irreversible.'}
        confirmText={isBn ? 'মুছে ফেলুন' : 'Delete Now'}
        cancelText={t('cancel')}
        isDanger
      />

    </div>
  );
};
