/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { AiReport, DownloadHistory } from '../types/reports';
import { cvDb } from './cvSupabase';
import { interviewDb } from './interviewSupabase';
import { passportDb } from './passportSupabase';
import { growthDb } from './growthSupabase';

// সুপাবেজ এনভায়রনমেন্ট ভেরিয়েবল চেক করা (Check Supabase credentials)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ক্লায়েন্ট ইনিশিয়ালাইজেশন (Initialize Supabase Client lazily)
let supabaseClient: any = null;
let isRealSupabase = false;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isRealSupabase = true;
    console.log('✅ Supabase Reports Connection Initialized.');
  } catch (err) {
    console.error('❌ Supabase reports initialization failed:', err);
  }
}

// লোকালস্টোরেজ কী-সমূহ (LocalStorage Keys for Sandbox)
const REPORTS_STORAGE_KEY = 'skillproof_reports_list';
const DOWNLOAD_HISTORY_STORAGE_KEY = 'skillproof_download_history_list';

export const reportsDb = {
  // ১. রিয়েল নাকি মক সুপাবেজ তা চেক করা (Check if real or sandbox)
  isConfigured: () => isRealSupabase,

  // ২. সব রিপোর্ট লোড করা (Get all reports for a user)
  getReports: async (userId: string): Promise<AiReport[]> => {
    // লোড করার আগে রিয়েল ডাটা থেকে রিপোর্ট জেনারেট করে নিই (Generate reports from actual CV/Interview data)
    await reportsDb.syncReportsFromActualData(userId);

    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('reports')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data
          }));
        }
        console.warn('⚠️ Supabase reports fetch warning, using local state:', error);
      } catch (err) {
        console.warn('⚠️ Database connection failed, using local state:', err);
      }
    }

    // স্যান্ডবক্স ফলব্যাক (Sandbox fallback using localStorage)
    const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
    const list: AiReport[] = stored ? JSON.parse(stored) : [];
    return list.filter(r => r.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ৩. রিয়েল ডাটা থেকে রিপোর্ট স্বয়ংক্রিয়ভাবে জেনারেট ও সিঙ্ক করা (Generate/Sync reports using actual CV/Interview records)
  syncReportsFromActualData: async (userId: string): Promise<void> => {
    try {
      // রিয়েল ডাটা সোর্সসমূহ রিড করা (Fetch real data sources)
      const resumes = await cvDb.getResumes(userId);
      const interviews = await interviewDb.getSessions(userId);
      
      let userFullName = 'User';
      const storedProfiles = localStorage.getItem('skillproof_profiles');
      if (storedProfiles) {
        try {
          const profiles = JSON.parse(storedProfiles);
          const userProf = profiles.find((p: any) => p.id === userId);
          if (userProf) {
            userFullName = userProf.fullName;
          }
        } catch (e) {
          console.error('Error parsing profiles for report sync:', e);
        }
      }

      const passport = await passportDb.getPassportByUserId(userId, userFullName);
      const skills = await passportDb.getSkillsByUserId(userId);
      const passportHistory = await passportDb.getHistoryByUserId(userId);
      const careerGrowth = await growthDb.getCareerGrowth(userId);
      const weeklyGoal = await growthDb.getWeeklyGoal(userId);
      const achievements = await growthDb.getAchievements(userId);
      const learningPlan = await growthDb.getLearningPlan(userId);

      const generatedReports: AiReport[] = [];

      // ক. সিভি রিপোর্ট জেনারেট করা (Resume Reports)
      if (resumes.length > 0) {
        const latestResume = resumes[0]; // সর্বশেষ সিভি
        if (latestResume.scores) {
          const reportId = `rep_cv_${latestResume.id}`;
          const report: AiReport = {
            id: reportId,
            userId,
            type: 'resume',
            titleBn: `সিভি বিশ্লেষণ রিপোর্ট - ${latestResume.personalInfo.name}`,
            titleEn: `CV Analysis Report - ${latestResume.personalInfo.name}`,
            createdAt: latestResume.updatedAt || latestResume.createdAt,
            data: {
              resumeId: latestResume.id,
              fileName: latestResume.personalInfo.name + '_CV.pdf',
              resumeScore: latestResume.scores.resumeQualityScore || 80,
              atsScore: latestResume.scores.atsScore || 75,
              strengths: latestResume.feedback?.strengths || ['স্ট্রাকচার্ড লেআউট', 'যোগাযোগ দক্ষতা'],
              weaknesses: latestResume.feedback?.weaknesses || ['প্রজেক্ট ডেসক্রিপশনের অভাব'],
              missingSkills: latestResume.feedback?.missingSkills || ['TypeScript', 'Docker'],
              suggestions: latestResume.feedback?.careerSuggestions || ['প্রজেক্টের বিবরণগুলোতে সংখ্যাসূচক ফলাফল যোগ করুন।'],
              profileCompletion: 85,
              generatedDate: latestResume.updatedAt || latestResume.createdAt
            }
          };
          generatedReports.push(report);
        }
      }

      // খ. ইন্টারভিউ পারফরম্যান্স রিপোর্ট জেনারেট করা (Interview Performance Reports)
      if (interviews.length > 0) {
        interviews.forEach((session, idx) => {
          if (session.status === 'completed' && session.scores) {
            const reportId = `rep_int_${session.id}`;
            const report: AiReport = {
              id: reportId,
              userId,
              type: 'interview',
              titleBn: `${session.careerPath} ভাইভা মূল্যায়ন রিপোর্ট`,
              titleEn: `${session.careerPath} Viva Evaluation Report`,
              createdAt: session.completedAt || session.createdAt,
              data: {
                sessionId: session.id,
                jobTitle: session.careerPath,
                overallScore: session.scores.overall || 70,
                technical: session.scores.technical || 70,
                communication: session.scores.communication || 70,
                confidence: session.scores.confidence || 70,
                problemSolving: session.scores.problemSolving || 70,
                english: session.scores.english || 70,
                questionsCount: session.qa.length,
                answerSummary: session.feedback?.mistakes.join('. ') || 'সবগুলো প্রশ্নের উত্তর সন্তোষজনক ছিল।',
                strengths: session.feedback?.strengths || ['আত্মবিশ্বাসী উত্তর'],
                weaknesses: session.feedback?.weaknesses || ['টেকনিক্যাল গভীরতার অভাব'],
                suggestions: session.feedback?.suggestions || ['বেসিক রিয়্যাক্ট কনসেপ্ট রিভিশন দিন।'],
                generatedDate: session.completedAt || session.createdAt
              }
            };
            generatedReports.push(report);
          }
        });
      }

      // গ. স্কিল পাসপোর্ট রিপোর্ট জেনারেট করা (Skill Passport Report)
      if (passport && skills.length > 0) {
        const reportId = `rep_pass_${passport.id}`;
        const report: AiReport = {
          id: reportId,
          userId,
          type: 'passport',
          titleBn: 'ডিজিটাল স্কিল পাসপোর্ট রিপোর্ট',
          titleEn: 'Digital Skill Passport Report',
          createdAt: passport.updatedAt || new Date().toISOString(),
          data: {
            passportId: passport.id,
            skills: skills.map(s => ({ name: s.skillName, level: s.level, score: s.score })),
            historyCount: passportHistory.length,
            readinessScore: passport.readinessScore,
            verificationUrl: `${window.location.origin}/passport/${passport.id}`,
            generatedDate: passport.updatedAt || new Date().toISOString()
          }
        };
        generatedReports.push(report);
      }

      // ঘ. ক্যারিয়ার গ্রোথ রিপোর্ট জেনারেট করা (Career Growth Report)
      if (careerGrowth) {
        const reportId = `rep_growth_${careerGrowth.id}`;
        const report: AiReport = {
          id: reportId,
          userId,
          type: 'growth',
          titleBn: 'ক্যারিয়ার গ্রোথ ও লক্ষ্য রিপোর্ট',
          titleEn: 'Career Growth & Target Report',
          createdAt: careerGrowth.updatedAt || new Date().toISOString(),
          data: {
            goalTitle: careerGrowth.careerPath,
            weeklyGoal: weeklyGoal?.goalTitle || 'রিয়্যাক্ট প্র্যাকটিস সম্পূর্ণ করা',
            growthTimeline: passportHistory.map(h => ({
              date: h.date,
              event: h.interviewTitle,
              score: h.score
            })),
            improvedSkills: [careerGrowth.mostImprovedSkill].filter(Boolean),
            weakSkills: [careerGrowth.weakestSkill].filter(Boolean),
            achievements: achievements.filter(a => a.unlocked).map(a => ({ title: a.titleBn, date: a.unlockedAt || '' })),
            roadmapSummary: learningPlan ? '৭ দিন, ৩০ দিন ও ৯০ দিনের ক্যারিয়ার লার্নিং রোডম্যাপ সক্রিয়।' : 'ক্যারিয়ার রোডম্যাপের অগ্রগতি চলমান।',
            generatedDate: careerGrowth.updatedAt || new Date().toISOString()
          }
        };
        generatedReports.push(report);
      }

      // ঙ. ইন্টারভিউ ইমপ্রুভমেন্ট রিপোর্ট জেনারেট করা (Interview Improvement Report)
      // দুই বা ততোধিক সম্পন্ন ইন্টারভিউ থাকলে এটি তৈরি হবে (Only if there are 2 or more completed interviews)
      const completedSessions = interviews.filter(s => s.status === 'completed' && s.scores);
      if (completedSessions.length >= 2) {
        const current = completedSessions[0]; // সর্বশেষ ইন্টারভিউ
        const previous = completedSessions[1]; // পূর্ববর্তী ইন্টারভিউ
        
        if (current.scores && previous.scores) {
          const reportId = `rep_imp_${current.id}_${previous.id}`;
          const diff = current.scores.overall - previous.scores.overall;
          
          const report: AiReport = {
            id: reportId,
            userId,
            type: 'improvement',
            titleBn: 'এআই ইন্টারভিউ উন্নতি ট্র্যাকিং রিপোর্ট',
            titleEn: 'AI Interview Improvement Report',
            createdAt: current.completedAt || current.createdAt,
            data: {
              previousSessionId: previous.id,
              currentSessionId: current.id,
              previousDate: previous.completedAt || previous.createdAt,
              currentDate: current.completedAt || current.createdAt,
              previousScore: previous.scores.overall,
              currentScore: current.scores.overall,
              improvementPercentage: parseFloat(diff.toFixed(1)),
              skillComparison: [
                { name: 'Technical', prev: previous.scores.technical, current: current.scores.technical },
                { name: 'Communication', prev: previous.scores.communication, current: current.scores.communication },
                { name: 'Confidence', prev: previous.scores.confidence, current: current.scores.confidence },
                { name: 'Problem Solving', prev: previous.scores.problemSolving, current: current.scores.problemSolving }
              ],
              confidenceComparison: { prev: previous.scores.confidence, current: current.scores.confidence },
              communicationComparison: { prev: previous.scores.communication, current: current.scores.communication },
              aiSuggestions: current.feedback?.suggestions || ['পরবর্তী সেশনের জন্য টেকনিক্যাল ডেপথ বাড়াতে হবে।'],
              generatedDate: current.completedAt || current.createdAt
            }
          };
          generatedReports.push(report);
        }
      }

      // ডাটাবেজ বা লোকালস্টোরেজে সিঙ্ক করা (Sync to database or localStorage)
      if (isRealSupabase) {
        for (const report of generatedReports) {
          const row = {
            id: report.id,
            userId: report.userId,
            type: report.type,
            titleBn: report.titleBn,
            titleEn: report.titleEn,
            createdAt: report.createdAt,
            data: JSON.stringify(report.data)
          };
          await supabaseClient
            .from('reports')
            .upsert(row, { onConflict: 'id' });
        }
      } else {
        // স্যান্ডবক্স লোকালস্টোরেজে সেভ (Save to localStorage)
        const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
        let currentList: AiReport[] = stored ? JSON.parse(stored) : [];
        
        // ডুপ্লিকেট রিমুভ করে নতুনগুলো পুশ করা (Overwrite matching IDs, append new ones)
        generatedReports.forEach(newRep => {
          const idx = currentList.findIndex(r => r.id === newRep.id);
          if (idx !== -1) {
            currentList[idx] = newRep;
          } else {
            currentList.push(newRep);
          }
        });

        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(currentList));
      }
    } catch (err) {
      console.error('Error syncing reports from real data:', err);
    }
  },

  // ৪. ডাউনলোড ইতিহাস লোড করা (Get all download history for a user)
  getDownloadHistory: async (userId: string): Promise<DownloadHistory[]> => {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('download_history')
          .select('*')
          .eq('userId', userId)
          .order('downloadDate', { ascending: false });

        if (!error && data) {
          return data;
        }
        console.warn('⚠️ Supabase fetch download history warning, using local state:', error);
      } catch (err) {
        console.warn('⚠️ Database connection failed, using local state:', err);
      }
    }

    const stored = localStorage.getItem(DOWNLOAD_HISTORY_STORAGE_KEY);
    const list: DownloadHistory[] = stored ? JSON.parse(stored) : [];
    return list.filter(h => h.userId === userId).sort((a, b) => new Date(b.downloadDate).getTime() - new Date(a.downloadDate).getTime());
  },

  // ৫. ডাউনলোড ইতিহাস যোগ করা (Add a download history entry)
  addDownloadHistory: async (userId: string, fileName: string, type: string, status: 'Completed' | 'Pending' | 'Failed'): Promise<DownloadHistory> => {
    const record: DownloadHistory = {
      id: `dl_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      fileName,
      type,
      downloadDate: new Date().toISOString(),
      status
    };

    if (isRealSupabase) {
      try {
        const { error } = await supabaseClient
          .from('download_history')
          .insert([record]);
          
        if (!error) return record;
        console.warn('⚠️ Supabase download history insert failed, using local state:', error);
      } catch (err) {
        console.warn('⚠️ Database connection failed, using local state:', err);
      }
    }

    const stored = localStorage.getItem(DOWNLOAD_HISTORY_STORAGE_KEY);
    const list: DownloadHistory[] = stored ? JSON.parse(stored) : [];
    list.push(record);
    localStorage.setItem(DOWNLOAD_HISTORY_STORAGE_KEY, JSON.stringify(list));
    return record;
  }
};
