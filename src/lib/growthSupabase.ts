/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { 
  CareerGrowth, 
  LearningPlan, 
  DailyTask, 
  WeeklyGoal, 
  GrowthAchievement, 
  GrowthHistoryLog,
  LearningResource 
} from '../types/growth';
import { interviewDb } from './interviewSupabase';
import { passportDb, calculateLevel } from './passportSupabase';
import { growthGroq } from './growthGroq';

// সুপাবেজ কানেকশন চেক করা (Check Supabase Config)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;
let isRealSupabase = false;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isRealSupabase = true;
  } catch (err) {
    console.error('❌ Supabase Growth initialization failed:', err);
  }
}

// লোকালস্টোরেজ কী-সমূহ (LocalStorage Keys for Career Growth sandbox tables)
const CAREER_GROWTH_KEY = 'skillproof_career_growth';
const LEARNING_PLANS_KEY = 'skillproof_learning_plans';
const DAILY_TASKS_KEY = 'skillproof_daily_tasks';
const WEEKLY_GOALS_KEY = 'skillproof_weekly_goals';
const ACHIEVEMENTS_KEY = 'skillproof_achievements';
const GROWTH_HISTORY_KEY = 'skillproof_growth_history';

export const growthDb = {
  isConfigured: () => isRealSupabase,

  // ১. ক্যারিয়ার ওভারভিউ রিড করা (Load overall Career Growth Overview)
  getCareerGrowth: async (userId: string): Promise<CareerGrowth | null> => {
    const stored = localStorage.getItem(CAREER_GROWTH_KEY);
    const list: CareerGrowth[] = stored ? JSON.parse(stored) : [];
    return list.find(g => g.userId === userId) || null;
  },

  // ২. লার্নিং প্ল্যান রিড করা (Load AI Generated Roadmap/Learning Plan)
  getLearningPlan: async (userId: string): Promise<LearningPlan | null> => {
    const stored = localStorage.getItem(LEARNING_PLANS_KEY);
    const list: LearningPlan[] = stored ? JSON.parse(stored) : [];
    return list.find(p => p.userId === userId) || null;
  },

  // ৩. ডেইলি টাস্ক রিড করা (Load or check today's tasks)
  getDailyTask: async (userId: string, dateStr: string): Promise<DailyTask | null> => {
    const stored = localStorage.getItem(DAILY_TASKS_KEY);
    const list: DailyTask[] = stored ? JSON.parse(stored) : [];
    return list.find(t => t.userId === userId && t.date === dateStr) || null;
  },

  // ৪. উইকলি গোল রিড করা (Load weekly goals)
  getWeeklyGoal: async (userId: string): Promise<WeeklyGoal | null> => {
    const stored = localStorage.getItem(WEEKLY_GOALS_KEY);
    const list: WeeklyGoal[] = stored ? JSON.parse(stored) : [];
    return list.find(g => g.userId === userId) || null;
  },

  // ৫. অ্যাচিভমেন্টস/ব্যাজ রিড করা (Load user's unlocked achievements)
  getAchievements: async (userId: string): Promise<GrowthAchievement[]> => {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    const list: GrowthAchievement[] = stored ? JSON.parse(stored) : [];
    const userAchievements = list.filter(a => a.userId === userId);
    if (userAchievements.length === 0) {
      // অ্যাচিভমেন্টস প্রথমবার ইনিশিয়ালাইজ করা (Initialize achievements first-time)
      const initial = getInitialAchievements(userId);
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...list, ...initial]));
      return initial;
    }
    return userAchievements;
  },

  // ৬. গ্রোথ হিস্টোরি রিড করা (Load Growth History Logs)
  getHistoryLogs: async (userId: string): Promise<GrowthHistoryLog[]> => {
    const stored = localStorage.getItem(GROWTH_HISTORY_KEY);
    const list: GrowthHistoryLog[] = stored ? JSON.parse(stored) : [];
    return list.filter(h => h.userId === userId).sort((a,b) => b.date.localeCompare(a.date));
  },

  // ৭. ডেইলি টাস্ক আপডেট করা (Update Daily Task checkbox statuses)
  saveDailyTask: async (task: DailyTask): Promise<void> => {
    const stored = localStorage.getItem(DAILY_TASKS_KEY);
    let list: DailyTask[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(t => t.id === task.id);
    if (idx > -1) {
      list[idx] = task;
    } else {
      list.push(task);
    }
    localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(list));
  },

  // ৮. উইকলি গোল আপডেট করা (Save or complete weekly goals)
  saveWeeklyGoal: async (goal: WeeklyGoal): Promise<void> => {
    const stored = localStorage.getItem(WEEKLY_GOALS_KEY);
    let list: WeeklyGoal[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(g => g.id === goal.id);
    if (idx > -1) {
      list[idx] = goal;
    } else {
      list.push(goal);
    }
    localStorage.setItem(WEEKLY_GOALS_KEY, JSON.stringify(list));
  },

  // ৯. অ্যাচিভমেন্ট আনলক করা (Unlock an achievement)
  unlockAchievement: async (userId: string, code: string): Promise<void> => {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    let list: GrowthAchievement[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(a => a.userId === userId && a.code === code);
    if (idx > -1 && !list[idx].unlocked) {
      list[idx].unlocked = true;
      list[idx].unlockedAt = new Date().toISOString().split('T')[0];
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(list));
      
      // গ্রোথ হিস্টোরিতে রেকর্ড অ্যাড করা (Log in growth history)
      await growthDb.addHistoryLog({
        id: `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        userId,
        date: new Date().toISOString().split('T')[0],
        eventName: 'Achievement Unlocked',
        changeDescription: `ব্যাজ অর্জিত হয়েছে: ${list[idx].titleBn}`,
        metricType: 'achievement',
        oldValue: 'Locked',
        newValue: 'Unlocked'
      });
    }
  },

  // ১০. গ্রোথ হিস্টোরি লগ যুক্ত করা (Add generic growth history logs)
  addHistoryLog: async (log: GrowthHistoryLog): Promise<void> => {
    const stored = localStorage.getItem(GROWTH_HISTORY_KEY);
    const list: GrowthHistoryLog[] = stored ? JSON.parse(stored) : [];
    list.push(log);
    localStorage.setItem(GROWTH_HISTORY_KEY, JSON.stringify(list));
  },

  // ১১. ডাটা সিঙ্ক্রোনাইজেশন কোড (Main dynamic synchronization engine)
  syncGrowthHub: async (userId: string, fullName: string): Promise<{ success: boolean; hasData: boolean }> => {
    // ইউজারের ইন্টারভিউ হিস্টোরি রিড করা (Retrieve candidate's real interview history)
    const sessions = await interviewDb.getSessions(userId);
    if (sessions.length === 0) {
      return { success: true, hasData: false };
    }

    // কমপ্লিটেড ইন্টারভিউগুলো ফিল্টার করা (Filter completed interviews)
    const completedSessions = sessions.filter(s => s.status === 'completed');
    if (completedSessions.length === 0) {
      return { success: true, hasData: false };
    }

    const latestSession = completedSessions[0];
    const careerPath = latestSession.careerPath;
    const currentScore = latestSession.scores?.overall || 50;
    const currentLevel = calculateLevel(currentScore);

    // পাসপোর্ট থেকে তথ্য খোঁজা (Find strengths/weaknesses from passport/profile skills)
    const passportSkills = await passportDb.getSkillsByUserId(userId);
    
    let weakSkills: string[] = [];
    let strongSkills: string[] = [];

    if (passportSkills && passportSkills.length > 0) {
      // স্কোর অনুযায়ী সর্ট করে উইক এবং স্ট্রং স্কিল বের করা (Sort skills to find weakest & strongest)
      const sortedSkills = [...passportSkills].sort((a,b) => a.score - b.score);
      weakSkills = sortedSkills.slice(0, 2).map(s => s.skillName);
      strongSkills = sortedSkills.slice(-2).map(s => s.skillName).reverse();
    } else {
      // ভাইভা সেশনের ফিডব্যাক থেকে বের করা (Fallback to interview strengths and weaknesses)
      weakSkills = latestSession.feedback?.weaknesses?.slice(0, 2) || ['Technical Communication'];
      strongSkills = latestSession.feedback?.strengths?.slice(0, 2) || ['Problem Solving'];
    }

    // অগ্রগতি ক্যালকুলেশন (Progress comparison: latest vs oldest interview score)
    const firstSession = completedSessions[completedSessions.length - 1];
    const overallProgress = currentScore - (firstSession.scores?.overall || 50);

    // মোস্ট ইম্প্রুভড স্কিল ডিটারমিনেশন (Determine most improved skill)
    let mostImprovedSkill = 'Problem Solving';
    if (passportSkills && passportSkills.length > 0) {
      const sortedByProgress = [...passportSkills].sort((a,b) => b.progress - a.progress);
      if (sortedByProgress[0] && sortedByProgress[0].progress > 0) {
        mostImprovedSkill = sortedByProgress[0].skillName;
      }
    }

    const weakestSkill = weakSkills[0] || 'Technical Stack';

    // ১. ক্যারিয়ার গ্রোথ ডাটাবেজ রেকর্ড (Update overall CareerGrowth table row)
    const storedGrowth = localStorage.getItem(CAREER_GROWTH_KEY);
    let growthList: CareerGrowth[] = storedGrowth ? JSON.parse(storedGrowth) : [];
    
    let userGrowth = growthList.find(g => g.userId === userId);
    const growthRow: CareerGrowth = {
      id: userGrowth?.id || `GROWTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId,
      careerPath,
      readinessScore: currentScore,
      level: currentLevel,
      mostImprovedSkill,
      weakestSkill,
      overallProgress,
      createdAt: userGrowth?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const growthIdx = growthList.findIndex(g => g.userId === userId);
    if (growthIdx > -1) {
      growthList[growthIdx] = growthRow;
    } else {
      growthList.push(growthRow);
    }
    localStorage.setItem(CAREER_GROWTH_KEY, JSON.stringify(growthList));

    // ২. লার্নিং রোডম্যাপ সিঙ্ক করা (Sync AI Learning Roadmap)
    const storedPlans = localStorage.getItem(LEARNING_PLANS_KEY);
    let plansList: LearningPlan[] = storedPlans ? JSON.parse(storedPlans) : [];
    let userPlan = plansList.find(p => p.userId === userId);

    if (!userPlan || JSON.stringify(userPlan.weakSkills) !== JSON.stringify(weakSkills)) {
      // নতুন অথবা স্কিল পরিবর্তন হলে এআই কল করে জেনারেট করা (Generate dynamic plan if skills changed)
      try {
        const roadmapData = await growthGroq.generateRoadmap(careerPath, weakSkills);
        const planRow: LearningPlan = {
          id: userPlan?.id || `PLAN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          userId,
          careerPath,
          weakSkills,
          roadmap7Days: roadmapData.roadmap7Days,
          roadmap30Days: roadmapData.roadmap30Days,
          roadmap90Days: roadmapData.roadmap90Days,
          createdAt: userPlan?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const planIdx = plansList.findIndex(p => p.userId === userId);
        if (planIdx > -1) {
          plansList[planIdx] = planRow;
        } else {
          plansList.push(planRow);
        }
        localStorage.setItem(LEARNING_PLANS_KEY, JSON.stringify(plansList));
      } catch (err) {
        console.error('Roadmap generation or sync failed:', err);
      }
    }

    // ৩. ডেইলি প্র্যাকটিস টাস্ক সিঙ্ক করা (Sync Daily Tasks for Today)
    const todayStr = new Date().toISOString().split('T')[0];
    const storedTasks = localStorage.getItem(DAILY_TASKS_KEY);
    let tasksList: DailyTask[] = storedTasks ? JSON.parse(storedTasks) : [];
    let todayTask = tasksList.find(t => t.userId === userId && t.date === todayStr);

    if (!todayTask) {
      try {
        const dailyData = await growthGroq.generateDailyTasks(careerPath, weakSkills);
        const taskRow: DailyTask = {
          id: `TASK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          userId,
          date: todayStr,
          codingTask: { ...dailyData.codingTask, completed: false },
          communicationPractice: { ...dailyData.communicationPractice, completed: false },
          interviewQuestion: { ...dailyData.interviewQuestion, completed: false },
          miniAssignment: { ...dailyData.miniAssignment, completed: false },
          createdAt: new Date().toISOString()
        };
        tasksList.push(taskRow);
        localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(tasksList));
      } catch (err) {
        console.error('Daily practice sync failed:', err);
      }
    }

    // ৪. উইকলি গোল প্রথমবার ট্র্যাকার (Sync Weekly Goals if missing)
    const storedGoals = localStorage.getItem(WEEKLY_GOALS_KEY);
    let goalsList: WeeklyGoal[] = storedGoals ? JSON.parse(storedGoals) : [];
    let userGoal = goalsList.find(g => g.userId === userId);

    if (!userGoal) {
      const goalRow: WeeklyGoal = {
        id: `GOAL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        userId,
        goalTitle: `মাস্টার ${weakestSkill} এবং ইন্টারভিউ প্রস্তুতি`,
        completedPercentage: 0,
        remainingTasks: [
          `আজকের কোডিং চ্যালেঞ্জ সমাধান করা`,
          `কম্যুনিকেশন কোশ্চেন প্র্যাকটিস করা`,
          `অফিসিয়াল ডকুমেন্টেশন রিড করা`
        ],
        completedTasks: [],
        estimatedCompletion: '৪ দিন বাকি (4 Days Left)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      goalsList.push(goalRow);
      localStorage.setItem(WEEKLY_GOALS_KEY, JSON.stringify(goalsList));
    }

    // ৫. অ্যাচিভমেন্টস আনলক চেক (Trigger dynamic achievements unlock checks)
    // First Interview badge
    if (completedSessions.length >= 1) {
      await growthDb.unlockAchievement(userId, 'first_interview');
    }
    // 5 Interviews badge
    if (completedSessions.length >= 5) {
      await growthDb.unlockAchievement(userId, 'five_interviews');
    }
    // High Score badge (>=90%)
    if (completedSessions.some(s => (s.scores?.overall || 0) >= 90)) {
      await growthDb.unlockAchievement(userId, 'score_90');
    }
    // Communication improved badge
    if (completedSessions.length > 1) {
      const oldestComm = firstSession.scores?.communication || 50;
      const latestComm = latestSession.scores?.communication || 50;
      if (latestComm - oldestComm >= 5) {
        await growthDb.unlockAchievement(userId, 'comm_improved');
      }
    }
    // Gold Skill Level badge
    if (passportSkills && passportSkills.some(s => s.level === 'Gold' || s.level === 'Platinum' || s.level === 'Expert')) {
      await growthDb.unlockAchievement(userId, 'gold_level');
    }

    return { success: true, hasData: true };
  }
};

/**
 * প্রাথমিক ডিফাইন অ্যাচিভমেন্ট লিস্ট (Get Initial Locked Achievements definitions)
 */
function getInitialAchievements(userId: string): GrowthAchievement[] {
  return [
    {
      id: `ACH-FIRST-${userId}`,
      userId,
      code: 'first_interview',
      titleBn: 'প্রথম ভাইভা সম্পূর্ণকারী',
      titleEn: 'First Steps',
      descriptionBn: 'সফলভাবে প্রথম কৃত্রিম বুদ্ধিমত্তা ভাইভা সম্পন্ন করেছেন।',
      descriptionEn: 'Successfully completed the first AI live interview.',
      unlocked: false,
      badgeIcon: 'Award'
    },
    {
      id: `ACH-FIVE-${userId}`,
      userId,
      code: 'five_interviews',
      titleBn: 'ধারাবাহিক যোদ্ধা',
      titleEn: 'Consistent Interviewer',
      descriptionBn: '৫টি সফল এআই ইন্টারভিউ সম্পন্ন করেছেন।',
      descriptionEn: 'Completed 5 separate AI live interviews.',
      unlocked: false,
      badgeIcon: 'Shield'
    },
    {
      id: `ACH-SCORE-${userId}`,
      userId,
      code: 'score_90',
      titleBn: 'স্কিল মাস্টারমাইন্ড',
      titleEn: 'High Achiever (90%+)',
      descriptionBn: 'যেকোনো ভাইভায় ৯০% বা তার বেশি স্কোর অর্জন করেছেন।',
      descriptionEn: 'Achieved an overall score of 90% or above in any session.',
      unlocked: false,
      badgeIcon: 'Sparkles'
    },
    {
      id: `ACH-COMM-${userId}`,
      userId,
      code: 'comm_improved',
      titleBn: 'অনলঙ্কৃত বক্তা',
      titleEn: 'Eloquent Speaker',
      descriptionBn: 'কম্যুনিকেশন স্কোরে ৫ পয়েন্ট বা তার বেশি উন্নতি করেছেন।',
      descriptionEn: 'Improved communication metrics by 5+ points over sessions.',
      unlocked: false,
      badgeIcon: 'MessageSquareText'
    },
    {
      id: `ACH-GOLD-${userId}`,
      userId,
      code: 'gold_level',
      titleBn: 'গোল্ড স্কিল এলিমেন্ট',
      titleEn: 'Golden Standard',
      descriptionBn: 'যেকোনো একটি স্কিলে গোল্ড লেভেল বা তার ওপরে উঠেছেন।',
      descriptionEn: 'Reached Gold level or above on any individual skill.',
      unlocked: false,
      badgeIcon: 'Zap'
    },
    {
      id: `ACH-GOAL-${userId}`,
      userId,
      code: 'weekly_goal_completed',
      titleBn: 'লক্ষ্যভেদকারী',
      titleEn: 'Goal Crusher',
      descriptionBn: 'সফলভাবে উইকলি গোল ১০০% সম্পূর্ণ করেছেন।',
      descriptionEn: 'Successfully completed 100% of any active weekly goals.',
      unlocked: false,
      badgeIcon: 'Target'
    }
  ];
}

/**
 * রিসোর্স লিংক জেনারেটর (Get Resource Links dynamically based on Skill Name)
 */
export function getLearningResourcesForSkill(skillName: string): LearningResource {
  const query = encodeURIComponent(skillName);
  return {
    id: `RES-${skillName.toUpperCase().replace(/[^A-Z]/g, '')}`,
    skillName,
    youtubeUrl: `https://www.youtube.com/results?search_query=${query}+tutorial+crash+course`,
    officialDocUrl: getDocLink(skillName),
    githubRepoUrl: `https://github.com/trending?q=${query}`,
    freeCourseUrl: `https://www.freecodecamp.org/news/search/?query=${query}`,
    blogUrl: `https://dev.to/t/${skillName.toLowerCase()}`,
    practiceWebsiteUrl: getPracticeLink(skillName)
  };
}

function getDocLink(skillName: string): string {
  const sk = skillName.toLowerCase();
  if (sk.includes('react')) return 'https://react.dev/reference/react';
  if (sk.includes('node')) return 'https://nodejs.org/docs/latest/api/';
  if (sk.includes('javascript') || sk.includes('js')) return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript';
  if (sk.includes('typescript') || sk.includes('ts')) return 'https://www.typescriptlang.org/docs/';
  if (sk.includes('database') || sk.includes('sql') || sk.includes('postgres')) return 'https://www.postgresql.org/docs/';
  if (sk.includes('tailwind')) return 'https://tailwindcss.com/docs';
  return 'https://developer.mozilla.org/en-US/';
}

function getPracticeLink(skillName: string): string {
  const sk = skillName.toLowerCase();
  if (sk.includes('react') || sk.includes('javascript') || sk.includes('js')) return 'https://codesandbox.io/';
  if (sk.includes('sql') || sk.includes('database')) return 'https://sqlbolt.com/';
  return 'https://leetcode.com/';
}
