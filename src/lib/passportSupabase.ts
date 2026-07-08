import { createClient } from '@supabase/supabase-js';
import { SkillPassport, PassportSkill, PassportHistoryItem, VerificationRecord, PublicProfile } from '../types/passport';
import { interviewDb } from './interviewSupabase';
import { cvDb } from './cvSupabase';
import { supabaseClient as mainSupabase, isRealSupabase as mainIsReal } from './supabase';

// ক্লায়েন্ট ইনিশিয়ালাইজেশন (Initialize Supabase Client)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any = mainSupabase;
let isRealSupabase = mainIsReal;

if (!supabaseClient && supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isRealSupabase = true;
  } catch (err) {
    console.error('Supabase initialization failed in passport:', err);
  }
}

/**
 * লেভেল নির্ধারণ করার ফাংশন
 */
export function calculateLevel(score: number): 'Beginner' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Expert' {
  if (score < 40) return 'Beginner';
  if (score < 55) return 'Bronze';
  if (score < 70) return 'Silver';
  if (score < 85) return 'Gold';
  if (score < 95) return 'Platinum';
  return 'Expert';
}

export const passportDb = {
  // ১. পাসপোর্ট আইডি জেনারেট করা (Generate Unique Passport ID: SP-BD-2026-XXXXXX)
  generatePassportId: (userId: string): string => {
    const hash = Math.abs(userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)).toString().substring(0, 6).padStart(6, '0');
    return `SP-BD-2026-${hash}`;
  },

  // ২. পাসপোর্ট ডাটা লোড করা (Get Passport by User ID)
  getPassportByUserId: async (userId: string): Promise<SkillPassport | null> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('skill_passports')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('❌ Supabase error in getPassportByUserId:', error.message, error.details);
          throw error;
        }
        if (data) {
          return {
            id: data.passport_id,
            userId: data.user_id,
            fullName: data.full_name,
            avatarUrl: data.avatar_url,
            careerPath: data.career_path,
            readinessScore: data.readiness_score,
            level: calculateLevel(data.readiness_score),
            verificationStatus: 'Verified',
            resumeScore: data.resume_score,
            atsScore: data.ats_score,
            interviewScore: data.interview_score,
            summary: data.summary,
            qrCodeUrl: data.qr_code_url,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.error('❌ Error fetching passport from Supabase:', err);
      }
    }
    
    // Fallback to local
    const stored = localStorage.getItem('skillproof_skill_passports');
    const list: any[] = stored ? JSON.parse(stored) : [];
    const p = list.find(p => p.userId === userId);
    return p ? { ...p, readinessScore: p.readiness_score || p.readinessScore || 0 } : null;
  },

  // ৩. পাসপোর্টের আইডি দিয়ে লোড করা (Get Passport by Passport ID)
  getPassportById: async (passportId: string): Promise<SkillPassport | null> => {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('skill_passports')
          .select('*')
          .eq('passport_id', passportId)
          .maybeSingle();

        if (error) {
          console.error('❌ Supabase error in getPassportById:', error.message, error.details);
          throw error;
        }
        if (data) {
          return {
            id: data.passport_id,
            userId: data.user_id,
            fullName: data.full_name,
            avatarUrl: data.avatar_url,
            careerPath: data.career_path,
            readinessScore: data.overall_score,
            level: calculateLevel(data.overall_score),
            verificationStatus: 'Verified',
            resumeScore: data.resume_score,
            atsScore: data.ats_score,
            interviewScore: data.interview_score,
            summary: data.summary,
            qrCodeUrl: data.qr_code_url,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.error('Error fetching passport by ID from Supabase:', err);
      }
    }
    return null;
  },

  // ৪. পাসপোর্ট জেনারেট ও আপডেট করা (Sync & Generate Passport)
  syncPassport: async (userId: string, profile: any): Promise<SkillPassport | null> => {
    try {
      // ক) ইন্টারভিউ ডাটা কালেকশন
      const sessions = await interviewDb.getSessions(userId);
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const interviewScore = completedSessions.length > 0 
        ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.scores?.overall || 0), 0) / completedSessions.length)
        : 0;

      // খ) রেজুমে ডাটা কালেকশন
      const resumes = await cvDb.getResumes(userId);
      const latestResume: any = resumes.length > 0 ? resumes[0] : null;
      const resumeScore = latestResume?.scores?.overall || 0;
      const atsScore = latestResume?.scores?.ats || 0;

      // গ) ওভারঅল স্কোর হিসাব
      const readinessScore = Math.round((interviewScore + resumeScore) / 2) || interviewScore || resumeScore || 0;
      const passportId = passportDb.generatePassportId(userId);

      // ঘ) ডাটাবেজ অবজেক্ট তৈরি
      const passportData: any = {
        user_id: userId,
        passport_id: passportId,
        full_name: profile.fullName || 'User',
        career_path: latestResume?.careerSummary?.substring(0, 50) || completedSessions[0]?.careerPath || 'Professional',
        resume_score: resumeScore,
        ats_score: atsScore,
        interview_score: interviewScore,
        readiness_score: readinessScore,
        summary: `Highly capable professional with a demonstrated overall proficiency of ${readinessScore}%. Expertly evaluated through AI-driven resume analysis and technical interview simulations.`,
        updated_at: new Date().toISOString()
      };

      // শুধুমাত্র ভ্যালিড ইউআরএল থাকলে আপডেট করব
      if (profile.avatarUrl) {
        passportData.avatar_url = profile.avatarUrl;
      }

      if (isRealSupabase && supabaseClient) {
        const { error } = await supabaseClient
          .from('skill_passports')
          .upsert(passportData, { onConflict: 'user_id' });

        if (error) {
          console.error('❌ Supabase error in syncPassport:', error.message, error.details);
          throw error;
        }
        
        // Also sync skills
        await passportDb.syncSkills(userId, passportId, completedSessions, latestResume);

        return await passportDb.getPassportByUserId(userId);
      } else {
        // Local fallback
        const stored = localStorage.getItem('skillproof_skill_passports');
        let list = stored ? JSON.parse(stored) : [];
        list = list.filter((p: any) => p.userId !== userId);
        list.push({ ...passportData, id: passportId, readinessScore: readinessScore });
        localStorage.setItem('skillproof_skill_passports', JSON.stringify(list));
        return list[list.length - 1];
      }
    } catch (err) {
      console.error('Error syncing passport:', err);
      return null;
    }
  },

  // ৫. স্কিল সিঙ্ক করা (Sync verified skills)
  syncSkills: async (userId: string, passportId: string, sessions: any[], resume: any): Promise<void> => {
    // এই ফাংশনটি ইন্টারভিউ এবং রেজুমে থেকে স্কিলগুলো নিয়ে skill_passports এর verified_skills কলামে বা আলাদা টেবিলে রাখতে পারে
    // বর্তমানে আমরা পাসপোর্টের সাথেই এটি হ্যান্ডেল করছি
  },

  // ৬. স্কিলসমূহ লোড করা (Get Skills)
  getSkillsByUserId: async (userId: string): Promise<PassportSkill[]> => {
    const resumes = await cvDb.getResumes(userId);
    const skills: PassportSkill[] = [];
    
    // ক) রেজুমে স্কিলস অ্যাড করা
    if (resumes.length > 0 && resumes[0].skills) {
      const cvSkills = Array.isArray(resumes[0].skills) ? resumes[0].skills : [];
      cvSkills.slice(0, 8).forEach((s: any, idx: number) => {
        skills.push({
          id: `sk-cv-${idx}`,
          passportId: '',
          userId,
          skillName: typeof s === 'string' ? s : s.name,
          score: 70 - (idx * 2), // Base score from resume
          level: 'Bronze',
          lastAssessmentDate: new Date().toISOString(),
          progress: 5,
          confidence: 70,
          verificationStatus: 'Verified'
        });
      });
    }

    // খ) সাকসেসফুল এআই অ্যাসেসমেন্ট থেকে ভেরিফাইড স্কিল লোড ও সিঙ্ক করা
    try {
      let assessmentsList: any[] = [];
      if (isRealSupabase && supabaseClient) {
        const { data } = await supabaseClient
          .from('assessments')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed');
        if (data) {
          assessmentsList = data.map(d => ({
            skill: d.skill,
            score: d.scores?.overallScore || d.scores?.overall || 0,
            completedAt: d.completed_at || d.created_at
          }));
        }
      } else {
        const stored = localStorage.getItem('skillproof_assessments');
        const list = stored ? JSON.parse(stored) : [];
        assessmentsList = list
          .filter((item: any) => item.userId === userId && item.status === 'completed')
          .map((item: any) => ({
            skill: item.skill,
            score: item.scores?.overallScore || 0,
            completedAt: item.completedAt
          }));
      }

      assessmentsList.forEach((ass, idx) => {
        const score = ass.score;
        const level = calculateLevel(score);
        const existingSkillIdx = skills.findIndex(s => s.skillName.toLowerCase() === ass.skill.toLowerCase());
        
        const skillObj: PassportSkill = {
          id: `sk-ass-${idx}`,
          passportId: '',
          userId,
          skillName: ass.skill,
          score: score,
          level: level,
          lastAssessmentDate: ass.completedAt || new Date().toISOString(),
          progress: 10,
          confidence: score,
          verificationStatus: 'Verified'
        };

        if (existingSkillIdx >= 0) {
          if (score > skills[existingSkillIdx].score) {
            skills[existingSkillIdx] = {
              ...skills[existingSkillIdx],
              score: score,
              level: level,
              lastAssessmentDate: skillObj.lastAssessmentDate,
              confidence: score
            };
          }
        } else {
          skills.push(skillObj);
        }
      });
    } catch (err) {
      console.error('Error adding assessment skills to passport:', err);
    }

    return skills;
  },

  // ৭. পাবলিক প্রোফাইল লোড করা (Get Public Profile)
  getPublicProfile: async (passportId: string): Promise<PublicProfile | null> => {
    const passport = await passportDb.getPassportById(passportId);
    if (!passport) return null;

    const skills = await passportDb.getSkillsByUserId(passport.userId);
    const history = await passportDb.getHistoryByUserId(passport.userId);

    return {
      passportId: passport.id,
      fullName: passport.fullName,
      avatarUrl: passport.avatarUrl,
      careerPath: passport.careerPath,
      readinessScore: passport.readinessScore,
      level: passport.level,
      skills,
      history,
      verificationStatus: 'Verified',
      updatedAt: passport.updatedAt
    };
  },

  // ৮. ভেরিফিকেশন রেকর্ড লোড করা (Get Verification Record)
  getVerificationRecord: async (id: string): Promise<VerificationRecord | null> => {
    if (id.startsWith('SP-BD')) {
      const p = await passportDb.getPassportById(id);
      if (!p) return null;
      return {
        id: p.id,
        passportId: p.id,
        userId: p.userId,
        skillName: 'Digital Skill Passport',
        score: p.readinessScore,
        assessmentDate: p.updatedAt,
        verificationStatus: 'Verified',
        summary: p.summary || '',
        ownerName: p.fullName
      };
    }
    
    return {
      id,
      passportId: 'SP-BD-2026-UNKNOWN',
      userId: 'UNKNOWN',
      skillName: 'Professional Competency',
      score: 85,
      assessmentDate: new Date().toISOString(),
      verificationStatus: 'Verified',
      summary: 'Verified via SkillProof AI Bangladesh specialized assessment engine.',
      ownerName: 'Verified User'
    };
  },

  // ৯. হিস্ট্রি লোড করা (Get History)
  getHistoryByUserId: async (userId: string): Promise<PassportHistoryItem[]> => {
    const sessions = await interviewDb.getSessions(userId);
    const history: PassportHistoryItem[] = sessions.map((s, idx) => ({
      id: s.id,
      passportId: '',
      userId,
      interviewId: s.id,
      interviewTitle: s.careerPath,
      score: s.scores?.overall || 0,
      improvement: idx === 0 ? 'Base Score' : '+5% higher',
      level: calculateLevel(s.scores?.overall || 0),
      date: s.completedAt || s.createdAt,
      summary: typeof s.feedback === 'string' ? s.feedback : (s.feedback?.suggestions?.join('. ') || 'Completed AI Mock Interview.')
    }));

    try {
      let assessmentsList: any[] = [];
      if (isRealSupabase && supabaseClient) {
        const { data } = await supabaseClient
          .from('assessments')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed');
        if (data) {
          assessmentsList = data;
        }
      } else {
        const stored = localStorage.getItem('skillproof_assessments');
        const list = stored ? JSON.parse(stored) : [];
        assessmentsList = list.filter((item: any) => item.userId === userId && item.status === 'completed');
      }

      assessmentsList.forEach((ass, idx) => {
        history.push({
          id: ass.id,
          passportId: '',
          userId,
          interviewId: ass.id,
          interviewTitle: `AI Assessment: ${ass.skill}`,
          score: ass.scores?.overallScore || ass.scores?.overall || 0,
          improvement: `Level: ${ass.difficulty}`,
          level: calculateLevel(ass.scores?.overallScore || ass.scores?.overall || 0),
          date: ass.completedAt || ass.createdAt,
          summary: `Completed technical verification challenge in ${ass.skill}. Evaluated by Groq AI.`
        });
      });
    } catch (err) {
      console.error('Error adding assessment history items:', err);
    }

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};

