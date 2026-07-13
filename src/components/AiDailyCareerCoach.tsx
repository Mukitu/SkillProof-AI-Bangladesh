import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CoachData, CoachTask, CoachNotification, CoachBadge } from '../types/coach';
import { coachDb } from '../lib/coachSupabase';
import { coachGroq } from '../lib/coachGroq';
import { cvDb } from '../lib/cvSupabase';
import { interviewDb } from '../lib/interviewSupabase';
import { assessmentDb } from '../lib/assessmentSupabase';
import { passportDb } from '../lib/passportSupabase';
import { 
  Award, Trophy, Flame, Play, CheckCircle2, SkipForward, ArrowRight, 
  Sparkles, Star, Calendar, Zap, ClipboardList, BookOpen, UserCheck, 
  ChevronRight, Upload, MessageSquare, Bell, RefreshCw, AlertCircle, X, Check, Cpu
} from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner } from './UI';

interface AiDailyCareerCoachProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const AiDailyCareerCoach: React.FC<AiDailyCareerCoachProps> = ({ onNavigateToTab }) => {
  const { isBn } = useLanguage();
  const { user } = useAuth();
  const [coachData, setCoachData] = useState<CoachData & {
    metaCvCount?: number;
    metaInterviewCount?: number;
    metaAssessmentCount?: number;
    metaPassportCount?: number;
  } | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);
  const [rebuildingAlert, setRebuildingAlert] = useState<boolean>(false);
  
  // Completion Modal State
  const [selectedTask, setSelectedTask] = useState<CoachTask | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [evidence, setEvidence] = useState<string>('');
  const [submittingCompletion, setSubmittingCompletion] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackData, setFeedbackData] = useState<{
    feedback: string;
    careerSuggestions: string;
    improvementTips: string;
    nextRecommendedTask: string;
    weakAreaAnalysis: string;
    motivationalInsights: string;
    xpBonus: number;
    pointsBonus: number;
  } | null>(null);

  // Tab State inside Coach
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'history' | 'badges' | 'notifications'>('dashboard');

  useEffect(() => {
    if (user?.id) {
      loadAndCheckCoachData();
    }
  }, [user?.id]);

  const loadAndCheckCoachData = async () => {
    setLoading(true);
    try {
      if (!user?.id) return;

      // 1. Load baseline coach data
      const data = await coachDb.getCoachData(user.id);

      // 2. Load live counts to detect profile changes (Cv, Interview, Assessments, Passport)
      const resumes = await cvDb.getResumes(user.id);
      const interviews = await interviewDb.getSessions(user.id);
      const completedInterviews = interviews.filter(s => s.status === 'completed');
      const assessments = await assessmentDb.getAssessmentsByUserId(user.id);
      const passportSkills = await passportDb.getSkillsByUserId(user.id);

      const liveCvCount = resumes.length;
      const liveInterviewCount = completedInterviews.length;
      const liveAssessmentCount = assessments.length;
      const livePassportCount = passportSkills.length;

      // Cast coach data with dynamic meta parameters
      const currentMeta = data as any;

      // 3. Compare with stored metadata to trigger automatic rebuilt
      const hasCvsChanged = currentMeta.metaCvCount !== undefined && currentMeta.metaCvCount !== liveCvCount;
      const hasInterviewsChanged = currentMeta.metaInterviewCount !== undefined && currentMeta.metaInterviewCount !== liveInterviewCount;
      const hasAssessmentsChanged = currentMeta.metaAssessmentCount !== undefined && currentMeta.metaAssessmentCount !== liveAssessmentCount;
      const hasPassportChanged = currentMeta.metaPassportCount !== undefined && currentMeta.metaPassportCount !== livePassportCount;

      const isFirstRun = !data.lastGenerated || data.tasks.length === 0;
      const isRebuildRequired = isFirstRun || hasCvsChanged || hasInterviewsChanged || hasAssessmentsChanged || hasPassportChanged;

      if (isRebuildRequired) {
        setRebuildingAlert(true);
        // Trigger automatic update
        const updated = await coachDb.triggerCoachUpdate(user.id, user);
        
        // Save live meta details for the next comparisons
        const fullyUpdated = {
          ...updated,
          metaCvCount: liveCvCount,
          metaInterviewCount: liveInterviewCount,
          metaAssessmentCount: liveAssessmentCount,
          metaPassportCount: livePassportCount
        };

        await coachDb.saveCoachData(fullyUpdated as any);
        setCoachData(fullyUpdated);
      } else {
        // Just sync metadata if undefined
        if (
          currentMeta.metaCvCount === undefined ||
          currentMeta.metaInterviewCount === undefined ||
          currentMeta.metaAssessmentCount === undefined ||
          currentMeta.metaPassportCount === undefined
        ) {
          const fullySynced = {
            ...data,
            metaCvCount: liveCvCount,
            metaInterviewCount: liveInterviewCount,
            metaAssessmentCount: liveAssessmentCount,
            metaPassportCount: livePassportCount
          };
          await coachDb.saveCoachData(fullySynced as any);
          setCoachData(fullySynced);
        } else {
          setCoachData(data);
        }
      }
    } catch (error) {
      console.error('Error loading and verifying AI Coach Data:', error);
    } finally {
      setLoading(false);
      setRebuildingAlert(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!user?.id) return;
    setGeneratingPlan(true);
    try {
      // Load live counts to sync
      const resumes = await cvDb.getResumes(user.id);
      const interviews = await interviewDb.getSessions(user.id);
      const completedInterviews = interviews.filter(s => s.status === 'completed');
      const assessments = await assessmentDb.getAssessmentsByUserId(user.id);
      const passportSkills = await passportDb.getSkillsByUserId(user.id);

      const updated = await coachDb.triggerCoachUpdate(user.id, user);
      
      const fullyUpdated = {
        ...updated,
        metaCvCount: resumes.length,
        metaInterviewCount: completedInterviews.length,
        metaAssessmentCount: assessments.length,
        metaPassportCount: passportSkills.length
      };

      await coachDb.saveCoachData(fullyUpdated as any);
      setCoachData(fullyUpdated);
    } catch (error) {
      console.error('Failed to generate daily career plan:', error);
      alert(isBn ? 'এআই ডেইলি প্ল্যান তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' : 'Failed to generate AI Daily Plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    if (!coachData) return;
    const updatedTasks = coachData.tasks.map(t => 
      t.id === taskId ? { ...t, status: 'started' as const } : t
    );
    const updatedData = { ...coachData, tasks: updatedTasks };
    setCoachData(updatedData);
    await coachDb.saveCoachData(updatedData);
  };

  const handleSkipTask = async (taskId: string) => {
    if (!coachData) return;
    const updatedTasks = coachData.tasks.map(t => 
      t.id === taskId ? { ...t, status: 'skipped' as const } : t
    );
    const updatedData = { ...coachData, tasks: updatedTasks };
    setCoachData(updatedData);
    await coachDb.saveCoachData(updatedData);
  };

  const handleContinueTomorrow = async (taskId: string) => {
    if (!coachData) return;
    const updatedTasks = coachData.tasks.map(t => 
      t.id === taskId ? { ...t, status: 'continued_tomorrow' as const } : t
    );
    const updatedData = { ...coachData, tasks: updatedTasks };
    setCoachData(updatedData);
    await coachDb.saveCoachData(updatedData);
  };

  const handleOpenCompletionModal = (task: CoachTask) => {
    setSelectedTask(task);
    setNotes('');
    setEvidence('');
  };

  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !coachData || !user?.id) return;

    setSubmittingCompletion(true);
    try {
      // 1. Get detailed AI feedback on completion
      const aiFeedback = await coachGroq.generateTaskFeedback(selectedTask, notes, evidence);

      // 2. Compute Rewards
      const baseXP = selectedTask.xpAwarded;
      const basePoints = selectedTask.pointsAwarded;
      const totalXP = baseXP + aiFeedback.xpBonus;
      const totalPoints = basePoints + aiFeedback.pointsBonus;

      // Update task record
      const updatedTasks = coachData.tasks.map(t => 
        t.id === selectedTask.id 
          ? { 
              ...t, 
              status: 'completed' as const, 
              notes, 
              evidence, 
              feedback: aiFeedback.feedback,
              completedAt: new Date().toISOString() 
            } 
          : t
      );

      // Manage Streak updates
      let newStreak = coachData.streak;
      const todayDateStr = new Date().toISOString().split('T')[0];
      const lastActiveDateStr = coachData.lastActiveDate;

      if (!lastActiveDateStr) {
        newStreak = 1;
      } else if (lastActiveDateStr !== todayDateStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastActiveDateStr === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1; // reset streak if gap exists
        }
      }

      // Progression level calculation (every 1000 XP levels up)
      const newXP = coachData.xp + totalXP;
      const newLevel = Math.floor(newXP / 1000) + 1;

      // Badges unlocks
      const updatedBadges = coachData.badges.map(badge => {
        if (!badge.unlockedAt) {
          if (badge.code === 'first_step') {
            return { ...badge, unlockedAt: new Date().toISOString() };
          }
          if (badge.code === 'streak_3' && newStreak >= 3) {
            return { ...badge, unlockedAt: new Date().toISOString() };
          }
          if (badge.code === 'xp_1000' && newXP >= 1000) {
            return { ...badge, unlockedAt: new Date().toISOString() };
          }
        }
        return badge;
      });

      // Insert completion notification
      const completeNotif: CoachNotification = {
        id: 'complete_' + Date.now(),
        title: isBn ? 'টাস্ক সফলভাবে সম্পন্ন!' : 'Task Successfully Completed!',
        description: isBn 
          ? `অভিনন্দন! আপনি "${selectedTask.title}" সম্পন্ন করে +${totalXP} XP ও +${totalPoints} পয়েন্ট পেয়েছেন।` 
          : `Congrats! You completed "${selectedTask.title}" and earned +${totalXP} XP & +${totalPoints} Career Points.`,
        type: 'recommendation',
        read: false,
        createdAt: new Date().toISOString()
      };

      const updatedData: CoachData = {
        ...coachData,
        tasks: updatedTasks,
        xp: newXP,
        careerPoints: coachData.careerPoints + totalPoints,
        streak: newStreak,
        level: newLevel,
        badges: updatedBadges,
        lastActiveDate: todayDateStr,
        notifications: [completeNotif, ...(coachData.notifications || [])].slice(0, 30)
      };

      await coachDb.saveCoachData(updatedData);
      setCoachData(updatedData);
      setFeedbackData(aiFeedback);
      setShowFeedbackModal(true);
      setSelectedTask(null);
    } catch (err) {
      console.error('Failed to save completed task feedback:', err);
      alert(isBn ? 'ফিডব্যাক জেনারেট ও টাস্ক সম্পন্ন করতে ব্যর্থ হয়েছে।' : 'Failed to complete task and generate AI feedback.');
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const markNotificationAsRead = async (notifId: string) => {
    if (!coachData) return;
    const updatedNotifs = coachData.notifications.map(n => 
      n.id === notifId ? { ...n, read: true } : n
    );
    const updatedData = { ...coachData, notifications: updatedNotifs };
    setCoachData(updatedData);
    await coachDb.saveCoachData(updatedData);
  };

  if (loading || rebuildingAlert) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-950/5 min-h-[50vh] rounded-2xl border border-slate-200/50">
        <LoadingSpinner />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-800">
            {rebuildingAlert 
              ? (isBn ? 'এআই ক্যারিয়ার কোচ আপনার নতুন প্রোফাইল ডাটা রি-অ্যানালাইসিস করছে...' : 'AI Coach is re-analyzing your updated profile and resume details...')
              : (isBn ? 'এআই ডেইলি ক্যারিয়ার কোচ ডাটা লোড হচ্ছে...' : 'Loading AI Daily Career Coach Data...')}
          </p>
          <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto leading-normal">
            {rebuildingAlert 
              ? (isBn ? 'আমরা আপনার সিভি পরিবর্তন, ভাইভা এবং অ্যাসেসমেন্ট সম্পন্নতা লাইভ সনাক্ত করেছি। প্ল্যান আপডেট হচ্ছে।' : 'We detected live updates to your CV, mock interviews or practical tests. Generating a newly tailored plan.')
              : (isBn ? 'দয়া করে কিছুক্ষণ অপেক্ষা করুন।' : 'Please wait a few seconds...')}
          </p>
        </div>
      </div>
    );
  }

  const tasks = coachData?.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const remainingTasks = tasks.filter(t => t.status !== 'completed');
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const currentLevelProgress = coachData ? (coachData.xp % 1000) / 10 : 0;
  const xpNeededForNextLevel = coachData ? 1000 - (coachData.xp % 1000) : 1000;

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="ai-daily-career-coach">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 p-6">
          <Sparkles className="w-48 h-48 text-emerald-400 animate-pulse" />
        </div>

        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>LIVE AI POWERED</span>
            </span>
            <span className="text-slate-400 text-xs">Groq Llama 3.3 Analytics</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-emerald-400" />
            <span>{isBn ? 'এআই ডেইলি ক্যারিয়ার কোচ' : 'AI Daily Career Coach'}</span>
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            {isBn 
              ? 'আপনার সিভি, অ্যাসেসমেন্ট স্কোর এবং ভাইভার পারফরম্যান্স লাইভ বিশ্লেষণ করে Groq AI দ্বারা প্রতিদিনের কাস্টমাইজড ক্যারিয়ার মিশন ও নির্দেশিকা।' 
              : 'Daily personalized career missions, skill development exercises, and tailored actionable advice dynamically built from your live CV & assessments.'}
          </p>
        </div>

        <div className="flex gap-2 shrink-0 relative z-10">
          <button
            onClick={handleGeneratePlan}
            disabled={generatingPlan}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${generatingPlan ? 'animate-spin' : ''}`} />
            <span>{isBn ? 'নতুন ডেইলি প্ল্যান জেনারেট করুন' : 'Generate New Daily Plan'}</span>
          </button>
        </div>
      </div>

      {/* STATS STRIP */}
      {coachData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4 border-slate-200 bg-white/70 backdrop-blur-xs">
            <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
              <Flame className="w-6 h-6 fill-current animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">{isBn ? 'টানা সক্রিয়তা (Streak)' : 'Daily Streak'}</span>
              <span className="text-lg font-extrabold text-slate-900 font-sans">{coachData.streak} {isBn ? 'দিন' : 'Days'}</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-slate-200 bg-white/70 backdrop-blur-xs">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">{isBn ? 'অভিজ্ঞতা স্কোর (XP)' : 'Total XP'}</span>
              <span className="text-lg font-extrabold text-slate-900 font-sans">{coachData.xp} XP</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-slate-200 bg-white/70 backdrop-blur-xs">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">{isBn ? 'ক্যারিয়ার লেভেল' : 'Career Level'}</span>
              <span className="text-lg font-extrabold text-slate-900 font-sans">{isBn ? 'লেভেল' : 'Level'} {coachData.level}</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-slate-200 bg-white/70 backdrop-blur-xs">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">{isBn ? 'ক্যারিয়ার পয়েন্ট' : 'Career Points'}</span>
              <span className="text-lg font-extrabold text-slate-900 font-sans">{coachData.careerPoints} PTS</span>
            </div>
          </Card>
        </div>
      )}

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${activeSubTab === 'dashboard' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          {isBn ? 'ডেইলি ড্যাশবোর্ড' : 'Daily Dashboard'}
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${activeSubTab === 'history' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          {isBn ? 'টাস্ক হিস্ট্রি ও ফিডব্যাক' : 'Task History & Feedbacks'}
        </button>
        <button
          onClick={() => setActiveSubTab('badges')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${activeSubTab === 'badges' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          {isBn ? 'অর্জন ও ব্যাজ' : 'Achievements & Badges'}
        </button>
        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 relative ${activeSubTab === 'notifications' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          <span>{isBn ? 'কোচিং অ্যালার্ট ও নোটিফিকেশন' : 'Coaching Alerts'}</span>
          {coachData && coachData.notifications.some(n => !n.read) && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </button>
      </div>

      {/* SUB-TABS VIEWS */}
      <div className="space-y-6">
        {/* TAB 1: DAILY DASHBOARD */}
        {activeSubTab === 'dashboard' && coachData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Mission & Tasks */}
            <div className="lg:col-span-2 space-y-6">
              {/* TODAY MISSION HERO */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-5 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-5">
                  <Star className="w-32 h-32 text-emerald-600" />
                </div>
                
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md uppercase tracking-wide inline-block">
                  {isBn ? 'আজকের মিশন' : "TODAY'S MISSION"}
                </span>

                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                  {isBn ? coachData.todayMission : (coachData.todayMissionEn || coachData.todayMission)}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-semibold">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>{progressPercent}% {isBn ? 'সম্পন্ন' : 'Completed'}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* ACTIONABLE TASKS LIST */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-slate-500" />
                    <span>{isBn ? 'আজকের কর্মপরিকল্পনা' : 'Daily Task Board'}</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">
                    {completedTasks.length} / {tasks.length} {isBn ? 'কাজ সম্পন্ন' : 'Tasks Done'}
                  </span>
                </div>

                {tasks.length === 0 ? (
                  <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">
                      {isBn ? 'আজকের কোনো ক্যারিয়ার কর্মপরিকল্পনা তৈরি করা হয়নি।' : 'No tasks generated for today yet.'}
                    </p>
                    <button
                      onClick={handleGeneratePlan}
                      disabled={generatingPlan}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-lg text-[11px] transition"
                    >
                      {isBn ? 'মিশন জেনারেট করুন' : 'Generate Daily Plan'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      const isStarted = task.status === 'started';
                      const isSkipped = task.status === 'skipped';
                      const isContinued = task.status === 'continued_tomorrow';

                      return (
                        <div 
                          key={task.id} 
                          className={`p-4 rounded-xl border transition-all ${
                            isCompleted 
                              ? 'bg-slate-50/80 border-slate-200 opacity-75' 
                              : isStarted 
                              ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-400/20' 
                              : 'bg-white border-slate-200 hover:shadow-md'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              {/* Category Badge & Rewards */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-600 border border-slate-200">
                                  {task.category}
                                </span>
                                <span className="text-[9px] text-amber-600 font-extrabold flex items-center gap-0.5">
                                  <Zap className="w-3 h-3 fill-current" />
                                  <span>+{task.xpAwarded} XP</span>
                                </span>
                                <span className="text-[9px] text-blue-600 font-extrabold flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span>+{task.pointsAwarded} PTS</span>
                                </span>
                              </div>

                              <h4 className={`text-xs font-extrabold text-slate-900 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                                {task.description}
                              </p>
                            </div>

                            {/* Action controllers */}
                            <div className="flex items-center gap-1 shrink-0 self-end md:self-start">
                              {isCompleted ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isBn ? 'সম্পন্ন' : 'Completed'}</span>
                                </span>
                              ) : isSkipped ? (
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg flex items-center gap-1">
                                  <SkipForward className="w-3.5 h-3.5" />
                                  <span>{isBn ? 'বাদ দেওয়া' : 'Skipped'}</span>
                                </span>
                              ) : isContinued ? (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-amber-100">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{isBn ? 'আগামীকাল চলবে' : 'Continued Tomorrow'}</span>
                                </span>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1">
                                  {!isStarted ? (
                                    <button
                                      onClick={() => handleStartTask(task.id)}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px] flex items-center gap-1 transition"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>{isBn ? 'শুরু করুন' : 'Start'}</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenCompletionModal(task)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] flex items-center gap-1 transition"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>{isBn ? 'সম্পন্ন সাবমিট' : 'Complete'}</span>
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleSkipTask(task.id)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded text-[10px] transition"
                                    title={isBn ? 'বাদ দিন' : 'Skip Task'}
                                  >
                                    {isBn ? 'বাদ দিন' : 'Skip'}
                                  </button>
                                  
                                  <button
                                    onClick={() => handleContinueTomorrow(task.id)}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-[10px] transition"
                                    title={isBn ? 'আগামীকাল করুন' : 'Continue Tomorrow'}
                                  >
                                    {isBn ? 'আগামীকাল' : 'Defer'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Goals, Level Progression & Quick Tips */}
            <div className="space-y-6">
              {/* GOALS SUMMARY CARD */}
              <Card className="p-5 border-slate-200 bg-white space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 border-b pb-2 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-emerald-500 fill-current" />
                  <span>{isBn ? 'সক্রিয় লক্ষ্যমাত্রা ও গোল' : 'Active Career Goals'}</span>
                </h3>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-extrabold text-slate-400 block uppercase">{isBn ? 'চলতি সপ্তাহের গোল' : 'WEEKLY GOAL'}</span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {isBn ? coachData.weeklyGoal : (coachData.weeklyGoalEn || coachData.weeklyGoal)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-extrabold text-slate-400 block uppercase">{isBn ? 'চলতি মাসের গোল' : 'MONTHLY GOAL'}</span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {isBn ? coachData.monthlyGoal : (coachData.monthlyGoalEn || coachData.monthlyGoal)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* LEVEL PROGRESS CARD */}
              <Card className="p-5 border-slate-200 bg-white space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
                  <span>{isBn ? 'লেভেল অগ্রগতি' : 'Level Progression'}</span>
                  <span className="text-[10px] font-bold text-emerald-600">LVL {coachData.level}</span>
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{coachData.xp % 1000} / 1000 XP</span>
                    <span>{xpNeededForNextLevel} XP {isBn ? 'বাকি' : 'left'}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border">
                    <div 
                      className="bg-purple-600 h-full transition-all duration-500" 
                      style={{ width: `${currentLevelProgress}%` }}
                    />
                  </div>
                </div>
              </Card>

              {/* AUTOMATED RECOMMENDATIONS PANEL */}
              <Card className="p-5 border-slate-200 bg-emerald-950 text-white space-y-3 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 p-2">
                  <Sparkles className="w-20 h-20 text-emerald-400" />
                </div>
                
                <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                  <BookOpen className="w-4 h-4" />
                  <span>{isBn ? 'এআই ক্যারিয়ার প্রডাক্টিভিটি টিপস' : 'AI Career Blueprint'}</span>
                </h3>

                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {isBn 
                    ? 'আপনার সিভি আরও স্ট্রং করতে এবং নিয়মিত স্কিল ভেরিফাই করতে একটি লাইভ অ্যাসেসমেন্ট সম্পন্ন করুন। এটি আপনার চাকরি পাওয়ার চান্স প্রায় ৮০% বাড়িয়ে দেবে!'
                    : 'Analyze your gaps and study missing topics daily. Keeping a consistent daily streak of completing tasks ensures you stay at the forefront of recruiters.'}
                </p>

                <button
                  onClick={() => onNavigateToTab && onNavigateToTab('assessment')}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-50 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition"
                >
                  <span>{isBn ? 'লাইভ অ্যাসেসমেন্টে যান' : 'Go to Assessments'}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: TASK HISTORY & FEEDBACKS */}
        {activeSubTab === 'history' && coachData && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              <span>{isBn ? 'টাস্ক সম্পন্নতা ও এআই পারফরম্যান্স ফিডব্যাক' : 'Task Completion Logs & Coach Feedbacks'}</span>
            </h3>

            {completedTasks.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-2xl border border-slate-200 text-slate-400 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-10 h-10 text-slate-300" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">{isBn ? 'কোনো সম্পন্ন কাজ পাওয়া যায়নি!' : 'No completed tasks found!'}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isBn ? 'আজকের ডেইলি ড্যাশবোর্ডে গিয়ে কোনো কাজ সম্পন্ন করুন।' : 'Start and complete an action item from your dashboard to view analysis.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <Card key={task.id} className="p-5 border-slate-200 bg-white space-y-3 hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-2 gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100 uppercase tracking-wide">
                          {task.category}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 mt-1.5">{task.title}</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        {task.completedAt ? new Date(task.completedAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {/* User Notes & Evidence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-sans">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="font-extrabold text-slate-500 block uppercase tracking-wide text-[9px]">{isBn ? 'আপনার সাবমিশন নোট' : 'Your Notes'}</span>
                        <p className="text-slate-700 mt-1 leading-relaxed">{task.notes || (isBn ? 'কোনো নোট প্রদান করা হয়নি।' : 'No notes submitted')}</p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="font-extrabold text-slate-500 block uppercase tracking-wide text-[9px]">{isBn ? 'প্রদানকৃত প্রমান বা লিংক (Evidence)' : 'Evidence Link / Ref'}</span>
                        <p className="text-emerald-700 font-bold mt-1 truncate">
                          {task.evidence ? (
                            <a href={task.evidence} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
                              <span>{task.evidence}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-medium">{isBn ? 'কোনো প্রমান যুক্ত করা হয়নি।' : 'No evidence submitted'}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* AI Coach Feedback Box */}
                    {task.feedback && (
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-100 space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-800">
                          <Sparkles className="w-4.5 h-4.5" />
                          <span className="font-extrabold text-xs">{isBn ? 'এআই কোচের মূল্যায়ন' : 'Coach Evaluation'}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed font-sans">{task.feedback}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACHIEVEMENTS & BADGES */}
        {activeSubTab === 'badges' && coachData && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>{isBn ? 'ক্যারিয়ার অ্যাচিভমেন্ট ও ব্যাজ গ্যালারি' : 'Career Achievements & Badges'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isBn ? 'প্রতিদিনের মিশন ও টাস্ক সম্পন্ন করে এক্সক্লুসিভ ব্যাজ এবং রেটিং বৃদ্ধি করুন।' : 'Complete daily career tasks and keep streaks high to unlock special badges.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {coachData.badges.map((badge) => {
                const isUnlocked = !!badge.unlockedAt;
                return (
                  <Card 
                    key={badge.code} 
                    className={`p-5 flex flex-col items-center text-center justify-between border transition-all ${
                      isUnlocked 
                        ? 'bg-gradient-to-b from-amber-50/50 to-white border-amber-200 shadow-md' 
                        : 'bg-white border-slate-100 opacity-50'
                    }`}
                  >
                    <div className="space-y-3 flex flex-col items-center">
                      <div className={`p-4 rounded-full ${isUnlocked ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                        <Trophy className="w-8 h-8" />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-900">
                          {isBn ? badge.titleBn : badge.titleEn}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-normal font-sans">
                          {isBn ? badge.descriptionBn : badge.descriptionEn}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 w-full pt-2 border-t border-slate-100">
                      {isUnlocked ? (
                        <span className="text-[9px] font-bold text-amber-600 block">
                          {isBn ? 'আনলকড: ' : 'Unlocked: '} {new Date(badge.unlockedAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 block">
                          {isBn ? 'লকড' : 'Locked'}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: COACHING ALERTS */}
        {activeSubTab === 'notifications' && coachData && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Bell className="w-5 h-5 text-blue-500" />
              <span>{isBn ? 'কোচিং অ্যালার্ট ও নোটিফিকেশন হিস্ট্রি' : 'Coaching Notifications'}</span>
            </h3>

            {coachData.notifications.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <span className="text-xs font-medium">{isBn ? 'কোনো নোটিফিকেশন নেই।' : 'No notifications found.'}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {coachData.notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition cursor-pointer hover:bg-slate-50 ${
                      notif.read ? 'bg-white border-slate-100 opacity-75' : 'bg-blue-50/50 border-blue-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${notif.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    
                    <div className="space-y-1 overflow-hidden font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-slate-900">{notif.title}</span>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">{notif.description}</p>
                      <span className="text-[9px] text-slate-400 block pt-1">
                        {new Date(notif.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TASK COMPLETION INPUT FORM MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{isBn ? 'টাস্ক সম্পন্ন সাবমিট করুন' : 'Submit Task Completion'}</h3>
                <span className="text-[10px] text-slate-400 mt-1 block">{selectedTask.title}</span>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompletion} className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                <label className="font-bold flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? 'Operational Note - আপনার কাজের বিবরণ বা নোট লিখুন *' : 'Explain what you did / Self-Review Notes *'}</span>
                </label>
                <span className="text-[10px] text-slate-400">{isBn ? 'কাজটি কীভাবে করেছেন বা কী শিখেছেন তা সংক্ষেপে বর্ণনা করুন।' : 'Explain briefly how you performed this action item.'}</span>
                <textarea
                  rows={4}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isBn ? 'যেমন: আমি লিংকডইনে আমার কাজের ৩টি অ্যাকশন ভার্ব যুক্ত করে আপডেট করেছি এবং বায়ো সেকশনে রুল-ভিত্তিক বিবরণ দিয়েছি।' : 'e.g., I reviewed my core experience highlights and updated active bullet points on my LinkedIn profile.'}
                  className="p-3 border border-slate-200 rounded-xl bg-white text-xs text-slate-800 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                <label className="font-bold flex items-center gap-1">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? 'অনলাইন প্রমান বা লিংক (Evidence Link)' : 'Submission URL / Evidence Reference'}</span>
                </label>
                <span className="text-[10px] text-slate-400">{isBn ? 'কোনো স্ক্রিনশট ড্রাইভ লিংক, গিটহাব রেপো বা লিংকডইন পোস্ট লিংক থাকলে দিন।' : 'Submit drive link, github link, live URL, or linkedin post.'}</span>
                <input
                  type="url"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="https://example.com/evidence-link"
                  className="p-3 border border-slate-200 rounded-xl bg-white text-xs text-slate-800 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 text-xs transition"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingCompletion}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 transition flex items-center gap-1"
                >
                  {submittingCompletion ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isBn ? 'এআই বিশ্লেষণ চলছে...' : 'AI Analyzing...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isBn ? 'সম্পন্ন সাবমিট করুন' : 'Submit Completion'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED FEEDBACK DIALOG MODAL */}
      {showFeedbackModal && feedbackData && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xs font-sans animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{isBn ? 'এআই কোচের প্রশংসা ও পুরস্কার!' : 'AI Coach Rewards & Critique!'}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{isBn ? 'কাজের সফল মূল্যায়নের পর অর্জিত স্কিল পয়েন্ট।' : 'Completed task successfully evaluated by Groq.'}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackData(null);
                }} 
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Rewards Summary Bar */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-around text-center">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{isBn ? 'অর্জিত বোনাস এক্সপি' : 'XP BONUS'}</span>
                  <div className="text-xl font-black text-amber-600 flex items-center gap-1 justify-center mt-1">
                    <Zap className="w-5 h-5 fill-current" />
                    <span>+{feedbackData.xpBonus} XP</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{isBn ? 'বোনাস পয়েন্ট' : 'POINTS BONUS'}</span>
                  <div className="text-xl font-black text-blue-600 flex items-center gap-1 justify-center mt-1">
                    <Star className="w-5 h-5 fill-current" />
                    <span>+{feedbackData.pointsBonus} PTS</span>
                  </div>
                </div>
              </div>

              {/* Main Feedback Box */}
              <div className="space-y-1">
                <span className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">{isBn ? 'কোচের মন্তব্য (Feedback)' : 'Feedback'}</span>
                <p className="p-3.5 bg-slate-50 border rounded-xl leading-relaxed font-medium text-slate-800 text-xs">
                  {feedbackData.feedback}
                </p>
              </div>

              {/* Weak areas & suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="font-extrabold text-[9px] text-red-500 uppercase tracking-wider">{isBn ? 'দূর্বলতার বিশ্লেষণ ও গ্যাপস' : 'Gaps & Weak Area Analysis'}</span>
                  <p className="p-3.5 bg-red-50/50 border border-red-100 rounded-xl leading-relaxed text-[11px] text-slate-700">
                    {feedbackData.weakAreaAnalysis}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-extrabold text-[9px] text-emerald-600 uppercase tracking-wider">{isBn ? 'ক্যারিয়ারের প্রভাব ও সাজেশন' : 'Career Suggestions'}</span>
                  <p className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl leading-relaxed text-[11px] text-slate-700">
                    {feedbackData.careerSuggestions}
                  </p>
                </div>
              </div>

              {/* Tips for improvement list */}
              <div className="space-y-1.5">
                <span className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">{isBn ? 'ভবিষ্যতের জন্য ৩টি মূল্যবান পরামর্শ' : 'Improvement Tips'}</span>
                <p className="p-3.5 bg-slate-50 rounded-xl text-[11px] leading-relaxed whitespace-pre-line text-slate-700">
                  {feedbackData.improvementTips}
                </p>
              </div>

              {/* Next recommended step */}
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-[9px] text-blue-800 uppercase tracking-wider">{isBn ? 'পরবর্তী প্রস্তাবিত পদক্ষেপ' : 'Next Recommended Step'}</span>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-sans">{feedbackData.nextRecommendedTask}</p>
                </div>
              </div>

              {/* Motivation Insight banner */}
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl text-center font-sans space-y-1 relative overflow-hidden">
                <p className="text-[11px] font-semibold italic text-slate-300">
                  "{feedbackData.motivationalInsights}"
                </p>
              </div>
            </div>

            {/* Footer button */}
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackData(null);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                {isBn ? 'ধন্যবাদ, ড্যাশবোর্ডে ফিরুন' : 'Thank you, Go back'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
