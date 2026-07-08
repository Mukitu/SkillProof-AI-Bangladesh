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
import { roadmapDb } from './roadmapSupabase';
import { progressDb } from './progressSupabase';

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
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('reports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            type: item.type,
            titleBn: item.title_bn,
            titleEn: item.title_en,
            data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          }));
        }
        console.error('❌ Supabase reports fetch error:', error);
      } catch (err) {
        console.error('❌ Database connection failed:', err);
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
      const roadmaps = await roadmapDb.getRoadmaps(userId);
      
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

      const passport = await passportDb.getPassportByUserId(userId);
      const skills = await passportDb.getSkillsByUserId(userId);
      const passportHistory = await passportDb.getHistoryByUserId(userId);
      
      const careerGrowth = passport ? {
        id: passport.id,
        userId: userId,
        careerPath: passport.careerPath,
        readinessScore: passport.readinessScore,
        level: passport.level,
        mostImprovedSkill: skills[0]?.skillName || 'Technical Proficiency',
        weakestSkill: skills[skills.length - 1]?.skillName || 'Communication',
        overallProgress: 12,
        createdAt: passport.createdAt,
        updatedAt: passport.updatedAt
      } : null;

      const weeklyGoal = {
        goalTitle: 'Practice and complete at least 2 coding assessments and 1 full mock interview.'
      };

      const achievements = [
        { titleBn: 'প্রথম রেজুমে বিশ্লেষণ', unlocked: true, unlockedAt: new Date().toISOString() },
        { titleBn: 'প্রথম এআই ভাইভা সম্পন্ন', unlocked: true, unlockedAt: new Date().toISOString() }
      ];

      const learningPlan = passport ? {
        id: 'lp-001',
        userId: userId,
        careerPath: passport.careerPath
      } : null;

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

      // চ. ক্যালেরিয়ার রোডম্যাপ রিপোর্ট জেনারেট করা (Career Roadmap Report)
      if (roadmaps.length > 0) {
        const latestRoadmap = roadmaps[0];
        const phases = latestRoadmap.phases || [];
        const completedCount = phases.filter(p => p.completionPercentage === 100).length;
        const inProgressCount = phases.filter(p => p.completionPercentage > 0 && p.completionPercentage < 100).length;
        const pendingCount = phases.filter(p => p.completionPercentage === 0).length;
        const totalCount = phases.length;
        const percentage = totalCount > 0 ? Math.round(phases.reduce((acc, p) => acc + (p.completionPercentage || 0), 0) / totalCount) : 0;
        const nextPhase = phases.find(p => p.completionPercentage < 100)?.phaseName || 'N/A';
        
        const reportId = `rep_road_${latestRoadmap.id}`;
        const report: AiReport = {
          id: reportId,
          userId,
          type: 'roadmap',
          titleBn: `ক্যারিয়ার রোডম্যাপ রিপোর্ট - ${latestRoadmap.targetCareer}`,
          titleEn: `Career Roadmap Report - ${latestRoadmap.targetCareer}`,
          createdAt: latestRoadmap.updatedAt || latestRoadmap.createdAt || new Date().toISOString(),
          data: {
            roadmapId: latestRoadmap.id,
            targetCareer: latestRoadmap.targetCareer,
            phases: phases.map(p => ({
              name: p.phaseName,
              description: p.goal,
              status: p.completionPercentage === 100 ? 'completed' : p.completionPercentage > 0 ? 'in_progress' : 'pending',
              skills: p.skillsToLearn || [],
              resources: (p.freeLearningResources || []).map(r => r.title)
            })),
            completedPhases: completedCount,
            pendingPhases: pendingCount,
            completionPercentage: percentage,
            nextPhase: nextPhase,
            estimatedCompletion: '৩-৬ মাস (3-6 Months)',
            generatedDate: latestRoadmap.updatedAt || latestRoadmap.createdAt || new Date().toISOString()
          }
        };
        generatedReports.push(report);
      }

      // ছ. সার্বিক ক্যারিয়ার রিপোর্ট জেনারেট করা (Overall Career Report - AI Summary)
      const latestResume = resumes[0];
      const latestSession = completedSessions[0];
      const readiness = passport ? passport.readinessScore : 65;

      const overallReportId = `rep_overall_${userId}`;
      const overallReport: AiReport = {
        id: overallReportId,
        userId,
        type: 'overall_career',
        titleBn: 'সার্বিক ক্যারিয়ার ওভারভিউ ও এআই বিশ্লেষণ',
        titleEn: 'Overall Career Overview & AI Analysis',
        createdAt: new Date().toISOString(),
        data: {
          summary: latestResume 
            ? `আপনার আপলোডকৃত সিভি এবং অর্জিত স্কিল পাসপোর্টের ওপর ভিত্তি করে আপনি বর্তমানে ${passport?.careerPath || 'পছন্দসই'} রোলের জন্য প্রস্তুত হচ্ছেন।`
            : 'পদ্ধতিগত ক্যারিয়ার পরিকল্পনা এবং দক্ষতার স্তর বিশ্লেষণ সম্পূর্ণ করতে আপনার প্রোফাইল বিবরণ এবং সিভি আপলোড করুন।',
          strengths: latestResume?.feedback?.strengths || ['পদ্ধতিগত শিক্ষণ', 'কারিগরি জ্ঞান'],
          weaknesses: latestResume?.feedback?.weaknesses || ['প্রজেক্ট ডেসক্রিপশনের অভাব'],
          readinessScore: readiness,
          missingSkills: skills.length > 0 ? ['TypeScript', 'Docker', 'AWS'] : ['HTML/CSS', 'Javascript'],
          priorityLearningAreas: skills.length > 0 ? [skills[skills.length - 1]?.skillName || 'System Architecture'] : ['React.js', 'Web Standards'],
          suggestedNextSteps: [
            'আপনার পরবর্তী ক্যারিয়ার মাইলস্টোন সম্পূর্ণ করতে ১টি এআই মক ভাইভা টেস্ট দিন।',
            'সিভিতে বাদ পড়া টেকনিক্যাল স্ট্যাক যোগ করে রি-আপলোড করুন।'
          ],
          recommendedCertifications: [
            passport?.careerPath ? `AWS Certified Developer - ${passport.careerPath}` : 'Google UX Design Professional Certificate',
            'Meta Front-End Developer Certificate'
          ],
          recommendedPortfolioProjects: [
            'একটি সম্পূর্ণ ফুলস্ট্যাক ড্যাশবোর্ড এবং রোল-বেসড অথেনটিকেশন প্রজেক্ট তৈরি করুন।',
            'রিয়েল-টাইম ডাটা সিঙ্কিং এবং প্রোগ্রেসিভ ওযেব অ্যাপ (PWA) ডিজাইন।'
          ],
          recommendedInterviewPrep: [
            'সিস্টেম ডিজাইন এবং ডাটাবেজ অপ্টিমাইজেশন সম্পর্কিত ভাইভা কোশ্চেন প্র্যাকটিস করুন।',
            'কমিউনিকেশন ও সফট স্কিল উন্নতির জন্য মক ভাইভা সেশন সম্পূর্ণ করুন।'
          ],
          generatedDate: new Date().toISOString()
        }
      };
      generatedReports.push(overallReport);

      // ডাটাবেজ বা লোকালস্টোরেজে সিঙ্ক করা (Sync to database or localStorage)
      if (isRealSupabase && supabaseClient) {
        for (const report of generatedReports) {
          const row = {
            id: report.id,
            user_id: report.userId,
            type: report.type,
            title_bn: report.titleBn,
            title_en: report.titleEn,
            created_at: report.createdAt,
            data: report.data
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
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('download_history')
          .select('*')
          .eq('user_id', userId)
          .order('download_date', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            fileName: item.file_name,
            type: item.type,
            status: item.status,
            downloadDate: item.download_date
          }));
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

    if (isRealSupabase && supabaseClient) {
      try {
        const row = {
          id: record.id,
          user_id: record.userId,
          file_name: record.fileName,
          type: record.type,
          download_date: record.downloadDate,
          status: record.status
        };

        const { error } = await supabaseClient
          .from('download_history')
          .insert([row]);
          
        if (error) throw error;
        return record;
      } catch (err) {
        console.error('❌ Database download history insert failed:', err);
      }
    }

    const stored = localStorage.getItem(DOWNLOAD_HISTORY_STORAGE_KEY);
    const list: DownloadHistory[] = stored ? JSON.parse(stored) : [];
    list.push(record);
    localStorage.setItem(DOWNLOAD_HISTORY_STORAGE_KEY, JSON.stringify(list));
    return record;
  },

  // ৬. রিপোর্ট ডিলিট করা (Delete a report)
  deleteReport: async (id: string): Promise<boolean> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('reports')
          .delete()
          .eq('id', id);
        if (!error) return true;
        console.error('❌ Supabase delete report error:', error);
      } catch (err) {
        console.error('❌ Database connection failed during report deletion:', err);
      }
    }

    const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
    const list: AiReport[] = stored ? JSON.parse(stored) : [];
    const filtered = list.filter(r => r.id !== id);
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // ৭. রিপোর্ট সেভ বা আপডেট করা (Save or update a report)
  saveReport: async (report: AiReport): Promise<boolean> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const row = {
          id: report.id,
          user_id: report.userId,
          type: report.type,
          title_bn: report.titleBn,
          title_en: report.titleEn,
          created_at: report.createdAt,
          data: report.data
        };
        const { error } = await supabaseClient
          .from('reports')
          .upsert(row, { onConflict: 'id' });
        if (!error) return true;
        console.error('❌ Supabase save report error:', error);
      } catch (err) {
        console.error('❌ Database connection failed during report save:', err);
      }
    }

    const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
    const list: AiReport[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(r => r.id === report.id);
    if (idx !== -1) {
      list[idx] = report;
    } else {
      list.push(report);
    }
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(list));
    return true;
  }
};
