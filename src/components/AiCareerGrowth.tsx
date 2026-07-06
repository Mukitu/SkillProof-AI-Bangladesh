/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  TrendingUp, Award, BookOpen, Calendar, 
  CheckSquare, Code, MessageSquareText, Shield, 
  Sparkles, Target, Zap, ChevronRight, 
  Loader2, Play, BookOpenCheck, ExternalLink, 
  Clock, Flame, HelpCircle, FileText, ArrowRight, CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, BarChart, Bar, AreaChart, Area 
} from 'recharts';
import { Card, Button, Badge } from './UI';
import { growthDb, getLearningResourcesForSkill } from '../lib/growthSupabase';
import { 
  CareerGrowth, LearningPlan, DailyTask, 
  WeeklyGoal, GrowthAchievement, GrowthHistoryLog 
} from '../types/growth';
import { interviewDb } from '../lib/interviewSupabase';
import { calculateLevel } from '../lib/passportSupabase';

// আইকন ডাইনামিক ম্যাপিং (Icon dynamic mapping for achievements/badges)
const ICON_MAP: Record<string, React.FC<any>> = {
  Award: Award,
  Shield: Shield,
  Sparkles: Sparkles,
  MessageSquareText: MessageSquareText,
  Zap: Zap,
  Target: Target,
};

interface AiCareerGrowthProps {
  onNavigateToTab: (tabId: string) => void;
}

export const AiCareerGrowth: React.FC<AiCareerGrowthProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);

  // ডোমেইন ডাটা স্টেটস (Domain data states)
  const [growthData, setGrowthData] = useState<CareerGrowth | null>(null);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [dailyTask, setDailyTask] = useState<DailyTask | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null);
  const [achievements, setAchievements] = useState<GrowthAchievement[]>([]);
  const [historyLogs, setHistoryLogs] = useState<GrowthHistoryLog[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // ইউজার ইন্টারেকশন স্টেটস (User interaction states)
  const [roadmapTab, setRoadmapTab] = useState<'7_days' | '30_days' | '90_days'>('7_days');
  const [analyticsTab, setAnalyticsTab] = useState<'scores' | 'skills'>('scores');

  // ডাটা লোড ও সিঙ্ক মডিউল (Data Loading & Syncing Module)
  const loadAndSyncData = async (forceSync = false) => {
    if (!user) return;
    setLoading(true);
    try {
      // প্রথমে চেক করা ইউজার ইন্টারভিউ হিস্টোরি আছে কিনা (Check if the user has interview history first)
      const sessions = await interviewDb.getSessions(user.id);
      const completed = sessions.filter(s => s.status === 'completed');

      if (completed.length === 0) {
        setHasData(false);
        setLoading(false);
        return;
      }

      setHasData(true);

      if (forceSync) {
        setSyncing(true);
      }

      // এআই ক্যারিয়ার গ্রোথ হাবের সিঙ্ক ইঞ্জিন রান করা (Run AI Growth Hub Sync Engine)
      await growthDb.syncGrowthHub(user.id, user.fullName || 'User');

      // সিঙ্ক সম্পন্ন হবার পর লোকাল ডাটাবেজ থেকে ডাটা লোড করা (Fetch loaded data from tables)
      const growth = await growthDb.getCareerGrowth(user.id);
      const plan = await growthDb.getLearningPlan(user.id);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const task = await growthDb.getDailyTask(user.id, todayStr);
      const goal = await growthDb.getWeeklyGoal(user.id);
      const achs = await growthDb.getAchievements(user.id);
      const logs = await growthDb.getHistoryLogs(user.id);

      setGrowthData(growth);
      setLearningPlan(plan);
      setDailyTask(task);
      setWeeklyGoal(goal);
      setAchievements(achs);
      setHistoryLogs(logs);

      // চার্টের জন্য ইন্টারভিউ ডাটা ফরম্যাট করা (Format Interview History for Recharts rendering)
      const sortedHistory = [...completed].reverse(); // Oldest to newest
      const formattedHistory = sortedHistory.map((s, idx) => ({
        index: idx + 1,
        title: isEn ? `Viva ${idx + 1}` : `ভাইভা ${idx + 1}`,
        date: new Date(s.completedAt || s.createdAt).toLocaleDateString(isEn ? 'en-US' : 'bn-BD', { month: 'short', day: 'numeric' }),
        overall: s.scores?.overall || 0,
        technical: s.scores?.technical || 0,
        communication: s.scores?.communication || 0,
        confidence: s.scores?.confidence || 0,
        problemSolving: s.scores?.problemSolving || 0,
      }));
      setChartData(formattedHistory);

    } catch (err) {
      console.error('Error loading career growth data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadAndSyncData();
  }, [user]);

  // ডেইলি টাস্ক প্রগ্রেস টগল হ্যান্ডলার (Toggle checklist progress for daily tasks)
  const handleToggleDailyTask = async (type: 'codingTask' | 'communicationPractice' | 'interviewQuestion' | 'miniAssignment') => {
    if (!dailyTask || !user) return;
    
    const updatedTask = {
      ...dailyTask,
      [type]: {
        ...dailyTask[type],
        completed: !dailyTask[type].completed
      }
    };

    setDailyTask(updatedTask);
    await growthDb.saveDailyTask(updatedTask);

    // হিস্টোরি লগে রেকর্ড অ্যাড করা (Add log to progress history)
    const taskName = type === 'codingTask' ? 'কোডিং চ্যালেঞ্জ' :
                     type === 'communicationPractice' ? 'যোগাযোগ দক্ষতা' :
                     type === 'interviewQuestion' ? 'ভাইভা প্রশ্নোত্তর' : 'মিনি অ্যাসাইনমেন্ট';
    
    await growthDb.addHistoryLog({
      id: `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      eventName: 'Daily Practice Update',
      changeDescription: `${taskName} সম্পূর্ণতা আপডেট করা হয়েছে।`,
      metricType: 'goal',
      oldValue: (!updatedTask[type].completed).toString(),
      newValue: (updatedTask[type].completed).toString()
    });
  };

  // উইকলি গোল চেক হ্যান্ডলার (Toggle Weekly goal tasks checklists and progress)
  const handleToggleWeeklyGoalTask = async (taskText: string, isCompleted: boolean) => {
    if (!weeklyGoal || !user) return;

    let updatedRemaining = [...weeklyGoal.remainingTasks];
    let updatedCompleted = [...weeklyGoal.completedTasks];

    if (isCompleted) {
      // রিমেইনিং থেকে কমপ্লিটেড-এ সরানো (Move from remaining to completed)
      updatedRemaining = updatedRemaining.filter(t => t !== taskText);
      if (!updatedCompleted.includes(taskText)) {
        updatedCompleted.push(taskText);
      }
    } else {
      // কমপ্লিটেড থেকে রিমেইনিং-এ সরানো (Move from completed to remaining)
      updatedCompleted = updatedCompleted.filter(t => t !== taskText);
      if (!updatedRemaining.includes(taskText)) {
        updatedRemaining.push(taskText);
      }
    }

    const total = updatedRemaining.length + updatedCompleted.length;
    const pct = total > 0 ? Math.round((updatedCompleted.length / total) * 100) : 0;

    const updatedGoal: WeeklyGoal = {
      ...weeklyGoal,
      remainingTasks: updatedRemaining,
      completedTasks: updatedCompleted,
      completedPercentage: pct,
      estimatedCompletion: pct === 100 ? (isEn ? 'Completed' : 'সম্পূর্ণ হয়েছে') : weeklyGoal.estimatedCompletion,
      updatedAt: new Date().toISOString()
    };

    setWeeklyGoal(updatedGoal);
    await growthDb.saveWeeklyGoal(updatedGoal);

    // যদি ১০০% সম্পূর্ণ হয়, লক্ষ্যভেদকারী অ্যাচিভমেন্ট চেক এবং আনলক করা (Unlock Goal Crusher badge if 100% completed)
    if (pct === 100) {
      await growthDb.unlockAchievement(user.id, 'weekly_goal_completed');
      // অ্যাচিভমেন্ট স্টেট রি-লোড করা (Refresh achievements state)
      const updatedAchs = await growthDb.getAchievements(user.id);
      setAchievements(updatedAchs);
    }
  };

  // এআই গ্রোথ ডাটা রিফ্রেশ হ্যান্ডলার (Regenerate and sync with latest AI logic)
  const handleRegenerateHub = () => {
    loadAndSyncData(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-mono text-sm">
          {isEn ? 'Syncing candidate interview history with AI Career Growth engine...' : 'ভাইভা হিস্টোরির সাথে ক্যারিয়ার গ্রোথ হাব রি-সিঙ্ক করা হচ্ছে...'}
        </p>
      </div>
    );
  }

  // ১. ইউজার ইন্টারভিউ না দিলে ফলব্যাক এম্পটি স্টেট (Show Empty State if candidate hasn't completed any interviews)
  if (!hasData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto text-center py-12 px-6"
      >
        <Card hoverEffect={false} className="border border-white/10 bg-slate-950/60 p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Zap className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2 font-display">
              {isEn ? 'Activate AI Career Growth Hub' : 'এআই ক্যারিয়ার গ্রোথ হাব সক্রিয় করুন'}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              {isEn 
                ? 'Your learning plans, daily tasks, resources, and custom analytics are generated based on actual assessments. Complete at least one AI Live Interview to generate your career roadmap.' 
                : 'আপনার লার্নিং রোডম্যাপ, দৈনিক চ্যালেঞ্জ এবং স্কিল অ্যানালিটিক্স সম্পূর্ণ রিয়েল ইন্টারভিউ হিস্টোরির ওপর ভিত্তি করে কাজ করে। গ্রোথ হাব চালু করতে আপনার প্রথম এআই ভাইভা সম্পন্ন করুন।'}
            </p>
            <Badge variant="warning">
              {isEn ? 'Requires 1 Completed Interview' : 'অন্তত ১টি সম্পন্ন ভাইভা আবশ্যক'}
            </Badge>
          </div>
          <Button 
            variant="primary" 
            className="w-full justify-center"
            onClick={() => onNavigateToTab('interview')}
          >
            {isEn ? 'Start AI Interview Now' : 'ভাইভা শুরু করুন'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </motion.div>
    );
  }

  // স্কিল ও রিসোর্স অবজেক্ট ডাইনামিক ফিল্টার (Fetch real resources based on weakest skills)
  const resourcesList = growthData 
    ? getLearningResourcesForSkill(growthData.weakestSkill)
    : getLearningResourcesForSkill('React Hooks');

  return (
    <div id="career-growth-hub-root" className="space-y-8 pb-16">
      
      {/* হেডার সেকশন ও রিয়েল-টাইম সিঙ্ক বাটন (Header Section with Sync Action) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="text-emerald-400 w-8 h-8" />
            {isEn ? 'AI Career Growth Hub' : 'এআই ক্যারিয়ার গ্রোথ হাব'}
          </h1>
          <p className="text-slate-400 text-sm">
            {isEn 
              ? 'Continuously improve and bridge skill gaps based on your live assessments' 
              : 'বাস্তব ইন্টারভিউ ইতিহাস এবং এআই অ্যাসেসমেন্টের ওপর ভিত্তি করে ক্রমাগত নিজেকে দক্ষ করে তুলুন'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRegenerateHub}
            isLoading={syncing}
            className="border-white/10 hover:border-emerald-500/20"
          >
            <Zap className="w-4 h-4 text-emerald-400 mr-2" />
            {isEn ? 'Regenerate AI Hub' : 'এআই গ্রোথ আপডেট করুন'}
          </Button>
        </div>
      </div>

      {/* SECTION 1: CAREER OVERVIEW (ক্যারিয়ার গ্রোথ ওভারভিউ) */}
      <div id="section-career-overview" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ক্যারিয়ার পাথ ও লেভেল কার্ড */}
        <Card hoverEffect={true} className="border border-white/5 bg-slate-950/40 flex flex-col justify-between">
          <div>
            <span className="text-slate-500 text-xs font-mono block uppercase">
              {isEn ? 'CURRENT CAREER PATH' : 'বর্তমান ক্যারিয়ার পথ'}
            </span>
            <h3 className="text-lg font-bold text-white mt-1 font-display line-clamp-2">
              {growthData?.careerPath || 'Software Engineer'}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">{isEn ? 'Current Level:' : 'বর্তমান লেভেল:'}</span>
            <Badge variant="brand">{growthData?.level || 'Bronze'}</Badge>
          </div>
        </Card>

        {/* ইন্টারভিউ রেডিনেস স্কোর */}
        <Card hoverEffect={true} className="border border-white/5 bg-slate-950/40 flex flex-col justify-between">
          <div>
            <span className="text-slate-500 text-xs font-mono block uppercase">
              {isEn ? 'READINESS SCORE' : 'ভাইভা প্রস্তুতি সূচক'}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-cyan-400 font-sans">
                {growthData?.readinessScore}%
              </span>
              <span className={`text-xs flex items-center font-semibold ${
                (growthData?.overallProgress || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(growthData?.overallProgress || 0) >= 0 ? '+' : ''}
                {growthData?.overallProgress}% {isEn ? 'overall' : 'অগ্রগতি'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-400 h-full transition-all duration-500"
                style={{ width: `${growthData?.readinessScore || 50}%` }}
              />
            </div>
          </div>
        </Card>

        {/* মোস্ট ইম্প্রুভড স্কিল */}
        <Card hoverEffect={true} className="border border-white/5 bg-slate-950/40 flex flex-col justify-between">
          <div>
            <span className="text-slate-500 text-xs font-mono block uppercase">
              {isEn ? 'MOST IMPROVED SKILL' : 'সবচেয়ে উন্নত স্কিল'}
            </span>
            <h3 className="text-xl font-bold text-emerald-400 mt-2 font-display">
              {growthData?.mostImprovedSkill || 'Problem Solving'}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>{isEn ? 'Showing positive momentum' : 'ধারাবাহিক মূল্যায়ন থেকে নির্ধারিত'}</span>
          </div>
        </Card>

        {/* দুর্বলতম স্কিল */}
        <Card hoverEffect={true} className="border border-white/5 bg-slate-950/40 flex flex-col justify-between">
          <div>
            <span className="text-slate-500 text-xs font-mono block uppercase text-rose-400">
              {isEn ? 'WEAKEST AREA' : 'দুর্বলতম স্কিল (ফোকাস)'}
            </span>
            <h3 className="text-xl font-bold text-rose-400 mt-2 font-display">
              {growthData?.weakestSkill || 'React Hooks'}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
            <span>{isEn ? 'Targeted in roadmap & daily tasks' : 'রোডম্যাপ এবং প্র্যাকটিসে প্রধান ফোকাস'}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* বাম কলাম: ডেইলি প্র্যাকটিস ও উইকলি গোল (Left Column: Daily Practice + Weekly Goals) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 4: DAILY PRACTICE (ডেইলি মাইক্রো প্র্যাকটিস) */}
          <Card hoverEffect={false} id="section-daily-practice" className="border border-white/5 bg-slate-950/40">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white font-display">
                  {isEn ? "Today's Practice" : "আজকের এআই মাইক্রো-প্র্যাকটিস"}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-white/5 px-2.5 py-1 rounded-md">
                {new Date().toLocaleDateString(isEn ? 'en-US' : 'bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {dailyTask ? (
              <div className="space-y-4">
                
                {/* কোডিং টাস্ক */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-start gap-4">
                  <button 
                    onClick={() => handleToggleDailyTask('codingTask')}
                    className="mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 border-emerald-500/40 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    {dailyTask.codingTask.completed && <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-slate-950" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">Coding Challenge</span>
                      <h4 className={`text-sm font-bold text-white ${dailyTask.codingTask.completed ? 'line-through text-slate-500' : ''}`}>
                        {dailyTask.codingTask.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {dailyTask.codingTask.description}
                    </p>
                    {dailyTask.codingTask.codeTemplate && (
                      <pre className="text-[11px] font-mono p-3 rounded-lg bg-slate-950 border border-white/5 overflow-x-auto text-slate-300">
                        <code>{dailyTask.codingTask.codeTemplate}</code>
                      </pre>
                    )}
                  </div>
                </div>

                {/* কম্যুনিকেশন প্র্যাকটিস */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-start gap-4">
                  <button 
                    onClick={() => handleToggleDailyTask('communicationPractice')}
                    className="mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 border-emerald-500/40 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    {dailyTask.communicationPractice.completed && <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-slate-950" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">Communication</span>
                      <h4 className={`text-sm font-bold text-white ${dailyTask.communicationPractice.completed ? 'line-through text-slate-500' : ''}`}>
                        {isEn ? 'Interactive Pitch Prompt' : 'বাস্তব কথোপকথন প্রস্তুতি'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">
                      "{dailyTask.communicationPractice.prompt}"
                    </p>
                    <p className="text-xs text-slate-400">
                      {dailyTask.communicationPractice.description}
                    </p>
                  </div>
                </div>

                {/* ভাইভা কোশ্চেন */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-start gap-4">
                  <button 
                    onClick={() => handleToggleDailyTask('interviewQuestion')}
                    className="mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 border-emerald-500/40 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    {dailyTask.interviewQuestion.completed && <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-slate-950" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Viva Q&A</span>
                      <h4 className={`text-sm font-bold text-white ${dailyTask.interviewQuestion.completed ? 'line-through text-slate-500' : ''}`}>
                        {dailyTask.interviewQuestion.question}
                      </h4>
                    </div>
                    <div className="text-xs text-slate-400 pt-1.5 border-t border-white/5 space-y-1 bg-[#090909] p-3 rounded-lg">
                      <span className="font-semibold text-slate-300 block font-mono">{isEn ? 'Ideal Answer Outline:' : 'আদর্শ উত্তরের মূল দিকসমূহ:'}</span>
                      <p className="leading-relaxed whitespace-pre-line">{dailyTask.interviewQuestion.idealAnswerOutline}</p>
                    </div>
                  </div>
                </div>

                {/* মিনি অ্যাসাইনমেন্ট */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-start gap-4">
                  <button 
                    onClick={() => handleToggleDailyTask('miniAssignment')}
                    className="mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 border-emerald-500/40 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    {dailyTask.miniAssignment.completed && <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-slate-950" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Mini Assignment</span>
                      <h4 className={`text-sm font-bold text-white ${dailyTask.miniAssignment.completed ? 'line-through text-slate-500' : ''}`}>
                        {dailyTask.miniAssignment.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {dailyTask.miniAssignment.description}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center p-6 text-slate-500 text-xs">
                {isEn ? 'Generating dynamic task checklist...' : 'আজকের মাইক্রো প্র্যাকটিস চ্যালেঞ্জ লোড হচ্ছে...'}
              </div>
            )}
          </Card>

          {/* SECTION 5: WEEKLY GOALS (উইকলি গোল ট্র্যাকার) */}
          <Card hoverEffect={false} id="section-weekly-goals" className="border border-white/5 bg-slate-950/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white font-display">
                  {isEn ? 'Weekly Progress Goals' : 'সাপ্তাহিক লক্ষ্য ও অগ্রগতি'}
                </h2>
              </div>
              <Badge variant="info">{weeklyGoal?.estimatedCompletion || '4 Days remaining'}</Badge>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2">{weeklyGoal?.goalTitle}</h3>
                
                {/* প্রগ্রেস বার */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>{isEn ? 'Completed tasks' : 'সম্পন্ন কাজসমূহ'}</span>
                  <span className="font-mono font-bold text-emerald-400">{weeklyGoal?.completedPercentage}%</span>
                </div>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    style={{ width: `${weeklyGoal?.completedPercentage || 0}%` }}
                  />
                </div>
              </div>

              {/* টাস্ক চেকলিস্ট গ্রিড */}
              <div className="space-y-2">
                {/* রিমেইনিং কাজসমূহ */}
                {weeklyGoal?.remainingTasks.map((t, idx) => (
                  <label 
                    key={`rem-${idx}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0e0e] border border-white/5 hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => handleToggleWeeklyGoalTask(t, true)}
                      className="w-4 h-4 rounded border-white/15 text-emerald-500 bg-transparent focus:ring-0"
                    />
                    <span className="text-xs text-slate-300 font-medium">{t}</span>
                  </label>
                ))}

                {/* সম্পন্ন কাজসমূহ */}
                {weeklyGoal?.completedTasks.map((t, idx) => (
                  <label 
                    key={`comp-${idx}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0c0c0c] border border-white/5 border-emerald-500/10 opacity-70 cursor-pointer"
                  >
                    <input 
                      type="checkbox" 
                      checked={true}
                      onChange={() => handleToggleWeeklyGoalTask(t, false)}
                      className="w-4 h-4 rounded border-emerald-500/30 text-emerald-500 bg-transparent focus:ring-0"
                    />
                    <span className="text-xs text-emerald-400 font-medium line-through">{t}</span>
                  </label>
                ))}

                {weeklyGoal?.remainingTasks.length === 0 && weeklyGoal?.completedTasks.length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    {isEn ? 'No weekly tasks loaded.' : 'কোনো সাপ্তাহিক লক্ষ্য রেকর্ড করা নেই।'}
                  </div>
                )}
              </div>
            </div>
          </Card>

        </div>

        {/* ডান কলাম: রোডম্যাপ ও রিসোর্স লিংক (Right Column: Learning Roadmap + Resources) */}
        <div className="space-y-6">
          
          {/* SECTION 2: AI LEARNING ROADMAP (এআই লার্নিং রোডম্যাপ) */}
          <Card hoverEffect={false} id="section-learning-roadmap" className="border border-white/5 bg-slate-950/40">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white font-display">
                {isEn ? 'AI Learning Roadmap' : 'এআই লার্নিং রোডম্যাপ'}
              </h2>
            </div>

            {/* ৭ দিন, ৩০ দিন, ৯০ দিনের ট্যাবস */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button 
                onClick={() => setRoadmapTab('7_days')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${
                  roadmapTab === '7_days' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isEn ? '7 Days' : '৭ দিন'}
              </button>
              <button 
                onClick={() => setRoadmapTab('30_days')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${
                  roadmapTab === '30_days' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isEn ? '30 Days' : '৩০ দিন'}
              </button>
              <button 
                onClick={() => setRoadmapTab('90_days')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${
                  roadmapTab === '90_days' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isEn ? '90 Days' : '৯০ দিন'}
              </button>
            </div>

            {learningPlan ? (
              <div className="space-y-4 text-xs">
                {/* সিলেক্টেড প্ল্যান টপিক কনটেন্ট */}
                {(() => {
                  const item = roadmapTab === '7_days' ? learningPlan.roadmap7Days :
                               roadmapTab === '30_days' ? learningPlan.roadmap30Days :
                               learningPlan.roadmap90Days;
                  return (
                    <div className="space-y-4">
                      
                      {/* টপিকস */}
                      <div>
                        <span className="font-bold text-emerald-400 uppercase block mb-1.5 tracking-wider text-[10px] font-mono">
                          {isEn ? 'STUDY TOPICS' : 'পড়াশোনার বিষয়সমূহ'}
                        </span>
                        <ul className="space-y-1 list-disc pl-4 text-slate-300 font-medium">
                          {item.topics.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>

                      {/* প্র্যাকটিস টাস্ক */}
                      <div>
                        <span className="font-bold text-cyan-400 uppercase block mb-1.5 tracking-wider text-[10px] font-mono">
                          {isEn ? 'PRACTICE CHALLENGES' : 'ব্যবহারিক প্র্যাকটিস চ্যালেঞ্জ'}
                        </span>
                        <ul className="space-y-1 list-disc pl-4 text-slate-300">
                          {item.practiceTasks.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>

                      {/* মিনি প্রজেক্ট */}
                      {item.miniProjects && item.miniProjects.length > 0 && (
                        <div>
                          <span className="font-bold text-purple-400 uppercase block mb-1.5 tracking-wider text-[10px] font-mono">
                            {isEn ? 'PORTFOLIO PROJECTS' : 'পোর্টফোলিও মিনি প্রজেক্ট'}
                          </span>
                          <ul className="space-y-1 list-disc pl-4 text-slate-300">
                            {item.miniProjects.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* অবজেক্টিভস */}
                      <div>
                        <span className="font-bold text-amber-500 uppercase block mb-1.5 tracking-wider text-[10px] font-mono">
                          {isEn ? 'EXPECTED LEARNING OBJECTIVES' : 'অর্জনযোগ্য উদ্দেশ্যসমূহ'}
                        </span>
                        <ul className="space-y-1 list-disc pl-4 text-slate-400">
                          {item.learningObjectives.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                      </div>

                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                {isEn ? 'Analyzing assessment gaps...' : 'রোডম্যাপ তৈরি করা হচ্ছে...'}
              </div>
            )}
          </Card>

          {/* SECTION 3: LEARNING RESOURCES (প্রয়োজনীয় রিসোর্স লিংক) */}
          <Card hoverEffect={false} id="section-learning-resources" className="border border-white/5 bg-slate-950/40">
            <div className="flex items-center gap-2 mb-4">
              <BookOpenCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white font-display">
                {isEn ? 'Validated Resources' : 'যাচাইকৃত লার্নিং রিসোর্স'}
              </h2>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              {isEn 
                ? `Official learning pipelines mapped specifically for targeting your weakest skill: "${growthData?.weakestSkill || 'React'}"`
                : `আপনার দুর্বলতা "${growthData?.weakestSkill || 'React'}" দূর করতে কাস্টম অফিসিয়াল ও ভেরিফাইড রিসোর্স লিংকসমূহ:`}
            </p>

            <div className="grid grid-cols-1 gap-2 text-xs">
              
              {/* ইউটিউব টিউটোরিয়াল */}
              <a 
                href={resourcesList.youtubeUrl} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-rose-500/5 hover:border-rose-500/20 border border-white/5 transition-all text-slate-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  YouTube Video Tutorials
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              {/* অফিসিয়াল ডকুমেন্টেশন */}
              <a 
                href={resourcesList.officialDocUrl} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/5 hover:border-cyan-500/20 border border-white/5 transition-all text-slate-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Official Documentation
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              {/* গিটহাব রিপোজিটরি */}
              <a 
                href={resourcesList.githubRepoUrl} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-slate-400/5 hover:border-slate-400/20 border border-white/5 transition-all text-slate-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  GitHub Code Repositories
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              {/* ফ্রি কোর্সসমূহ */}
              <a 
                href={resourcesList.freeCourseUrl} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-emerald-500/5 hover:border-emerald-500/20 border border-white/5 transition-all text-slate-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Free Courses (freeCodeCamp)
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              {/* ডেভেলপমেন্ট ব্লগ */}
              <a 
                href={resourcesList.blogUrl} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-amber-500/5 hover:border-amber-500/20 border border-white/5 transition-all text-slate-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Dev.to Technical Blogs
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              {/* প্র্যাকটিস ওয়েবসাইট */}
              <a 
                href={resourcesList.practiceWebsiteUrl} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-purple-500/5 hover:border-purple-500/20 border border-white/5 transition-all text-slate-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Interactive Coding Playgrounds
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

            </div>
          </Card>

          {/* SECTION 6: NEXT INTERVIEW PREPARATION (পরবর্তী ভাইভার প্রস্তুতি) */}
          <Card hoverEffect={false} id="section-next-interview" className="border border-white/5 bg-slate-950/40 text-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <Clock className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {isEn ? 'AI Interview Predictive Analysis' : 'পরবর্তী ভাইভা অনুমান ও প্রস্তুতি'}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-slate-400 font-medium block mb-1">{isEn ? 'Highly Likely Topics to Be Asked:' : 'প্রশ্ন করার উচ্চ সম্ভাবনা সম্পন্ন বিষয়সমূহ:'}</span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="brand">{growthData?.weakestSkill || 'React Hooks'}</Badge>
                  <Badge variant="info">Async Operations</Badge>
                  <Badge variant="warning">System optimization</Badge>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-1">{isEn ? 'Topics Needing More Practice:' : 'উন্নত অনুশীলনের পরামর্শকৃত বিষয়সমূহ:'}</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li>{growthData?.weakestSkill || 'React Hooks'} state constraints</li>
                  <li>Efficient database indices and joins</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">{isEn ? 'CONFIDENCE RATING' : 'আত্মবিশ্বাস মাত্রা'}</span>
                  <span className="text-base font-bold text-cyan-400">75%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">{isEn ? 'ESTIMATED READINESS' : 'প্রস্তুতি অনুমান'}</span>
                  <span className="text-base font-bold text-emerald-400">{isEn ? 'Good (উত্তম)' : 'উত্তম'}</span>
                </div>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* SECTION 7: SKILL ANALYTICS (রিয়েল চার্ট এনালাইসিস) */}
      <Card hoverEffect={false} id="section-skill-analytics" className="border border-white/5 bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white font-display">
              {isEn ? 'Skill & Assessment Analytics' : 'স্কিল এবং ইন্টারভিউ মূল্যায়ন চার্ট'}
            </h2>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl text-xs font-semibold">
            <button 
              onClick={() => setAnalyticsTab('scores')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                analyticsTab === 'scores' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isEn ? 'Overall Score Progress' : 'স্কোর অগ্রগতি'}
            </button>
            <button 
              onClick={() => setAnalyticsTab('skills')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                analyticsTab === 'skills' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isEn ? 'Metric Breakdown' : 'ডোমেইন অ্যানালিটিক্স'}
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-[280px] w-full font-mono text-[11px]">
            <ResponsiveContainer width="100%" height="100%">
              {analyticsTab === 'scores' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis domain={[0, 100]} stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090909', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                  <Legend />
                  <Area 
                    name={isEn ? "Overall Interview Score" : "ভাইভা স্কোর"} 
                    type="monotone" 
                    dataKey="overall" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorOverall)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis domain={[0, 100]} stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090909', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                  <Legend />
                  <Line 
                    name={isEn ? "Technical Stack" : "কারিগরি দক্ষতা"} 
                    type="monotone" 
                    dataKey="technical" 
                    stroke="#06b6d4" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    name={isEn ? "Communication" : "যোগাযোগ ও বাচনভঙ্গি"} 
                    type="monotone" 
                    dataKey="communication" 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    name={isEn ? "Confidence" : "আত্মবিশ্বাস মাত্রা"} 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#eab308" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            {isEn ? 'No analytics metrics found.' : 'অ্যানালিটিক্স চার্ট রেন্ডার করার জন্য পর্যাপ্ত হিস্টোরি ডেটা নেই।'}
          </div>
        )}
      </Card>

      {/* দুই কলাম: অ্যাচিভমেন্ট ও হিস্টোরি লগ / এআই রিকমেন্ডেশন (Two Columns: Achievements + AI Recommendations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 8: ACHIEVEMENTS (ডিজিটাল ব্যাজ ও অ্যাচিভমেন্টস) */}
        <Card hoverEffect={false} id="section-achievements" className="border border-white/5 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <Award className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white font-display">
              {isEn ? 'Unlocked Achievements' : 'অর্জিত এআই ব্যাজসমূহ'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {achievements.map((a) => {
              const IconComponent = ICON_MAP[a.badgeIcon] || Award;
              return (
                <div 
                  key={a.id}
                  className={`p-4 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-2 relative ${
                    a.unlocked 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                      : 'bg-white/2 border-white/5 opacity-50 text-slate-500'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    a.unlocked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-600'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-display line-clamp-1">{isEn ? a.titleEn : a.titleBn}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight mt-1">{isEn ? a.descriptionEn : a.descriptionBn}</p>
                  </div>
                  {a.unlocked && (
                    <span className="absolute top-2 right-2 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {isEn ? 'Unlocked' : 'অর্জিত'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* SECTION 9: AI RECOMMENDATIONS & HISTORY LOGS (এআই রিকমেন্ডেশন ও হিস্টোরি লগ) */}
        <div className="space-y-6">
          
          {/* এআই রিকমেন্ডেশন */}
          <Card hoverEffect={false} id="section-ai-recommendations" className="border border-white/5 bg-slate-950/40">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white font-display">
                {isEn ? 'Assessed Recommendations' : 'এআই ব্যক্তিগত পরামর্শসমূহ'}
              </h2>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              {isEn 
                ? 'Actionable developmental directives processed dynamically from your real viva failures and notes'
                : 'আপনার বাস্তব ভাইভাতে করা ভুলত্রুটি এবং মূল্যায়নের ওপর ভিত্তি করে সরাসরি এআই পরামর্শসমূহ:'}
            </p>

            <div className="space-y-2 text-xs">
              
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-slate-300">
                <span className="font-bold text-emerald-400 block mb-1">
                  💡 {isEn ? 'Enhance core skillsets' : 'প্রধান দক্ষতা বৃদ্ধি'}
                </span>
                {isEn 
                  ? `Focus heavily on master topics regarding "${growthData?.weakestSkill || 'React Hooks'}". Learn standard error-handling structures.`
                  : `আপনার "${growthData?.weakestSkill || 'React Hooks'}" বিষয়ের ওপর গভীর পড়াশোনা ও ডেকোরেটরস/হুকস এর ব্যবহার জানুন।`}
              </div>

              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-slate-300">
                <span className="font-bold text-cyan-400 block mb-1">
                  🗣️ {isEn ? 'Communication Practice' : 'বাচনভঙ্গি ও প্রেজেন্টেশন'}
                </span>
                {isEn 
                  ? 'Speak clearly during initial overview summaries. Avoid filler words and pause deliberately.'
                  : 'প্রজেক্ট বর্ণনা করার সময় অপ্রাসঙ্গিক শব্দ পরিহার করুন এবং শান্তভাবে মূল পয়েন্টগুলো ব্যাখ্যা করুন।'}
              </div>

              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 text-slate-300">
                <span className="font-bold text-purple-400 block mb-1">
                  🛠️ {isEn ? 'Hands-on Coding tasks' : 'হাতে-কলমে কোডিং অনুশীলন'}
                </span>
                {isEn 
                  ? 'Solve today\'s Coding Challenge. Write tests for modular helper functions.'
                  : 'আজকের কোডিং চ্যালেঞ্জটি সমাধান করুন। ছোট মডিউলার ফাংশনগুলোর জন্য টেস্ট কেস লিখুন।'}
              </div>

            </div>
          </Card>

          {/* হিস্টোরি লগস */}
          <Card hoverEffect={false} id="section-growth-history-logs" className="border border-white/5 bg-slate-950/40 text-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {isEn ? 'Growth Activity Logs' : 'অগ্রগতি লগ ও টাইমলাইন'}
              </h2>
            </div>

            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {historyLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-start gap-4 pb-2 border-b border-white/2">
                  <div>
                    <span className="font-semibold text-slate-300 block leading-tight">{log.changeDescription}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{log.eventName} • {log.date}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-slate-400">
                    {log.newValue}
                  </span>
                </div>
              ))}

              {historyLogs.length === 0 && (
                <div className="text-center py-4 text-slate-500">
                  {isEn ? 'No logs recorded.' : 'কোনো টাইমলাইন রেকর্ড পাওয়া যায়নি।'}
                </div>
              )}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
};
