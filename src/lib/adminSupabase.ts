import { createClient } from '@supabase/supabase-js';
import { supabaseClient as mainSupabase, isRealSupabase as mainIsReal } from './supabase';
import { UserProfile } from '../types';
import { AssessmentRecord } from '../types/assessment';
import { SkillPassport } from '../types/passport';
import { AiReport } from '../types/reports';

let supabaseClient: any = mainSupabase;
let isRealSupabase = mainIsReal;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseClient && supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isRealSupabase = true;
  } catch (err) {
    console.error('Supabase initialization failed in adminDb:', err);
  }
}

// Audit Log Interface
export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  ipAddress: string;
  browser: string;
  date: string;
  time: string;
}

// Announcement Interface
export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetGroup: 'all' | 'premium' | 'specific';
  specificEmails?: string[];
  status: 'published' | 'scheduled';
  scheduledDate?: string;
  createdAt: string;
}

// System Settings Interface
export interface SystemConfig {
  siteName: string;
  logoUrl: string;
  theme: 'light' | 'dark' | 'emerald' | 'blue';
  emailSettings: {
    senderEmail: string;
    senderName: string;
  };
  groqSettings: {
    model: string;
    temperature: number;
  };
  supabaseSettings: {
    realtimeEnabled: boolean;
  };
  featureFlags: {
    cvBuilder: boolean;
    interviewEngine: boolean;
    assessmentHub: boolean;
    skillPassport: boolean;
    growthHub: boolean;
  };
  maintenanceMode: boolean;
  language: 'bn' | 'en';
  homepageBanner: string;
}

// Helper to determine levels
function calculateLevel(score: number): 'Beginner' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Expert' {
  if (score < 40) return 'Beginner';
  if (score < 55) return 'Bronze';
  if (score < 70) return 'Silver';
  if (score < 85) return 'Gold';
  if (score < 95) return 'Platinum';
  return 'Expert';
}

export const adminDb = {
  // ১. ইউজারদের তালিকা লোড করা (Fetch all users)
  getAllUsers: async (): Promise<(UserProfile & { role: string; status: string; premium: boolean; premiumExpiry?: string })[]> => {
    let rawProfiles: any[] = [];
    
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          rawProfiles = data;
        }
      } catch (err) {
        console.error('Error fetching profiles from real Supabase:', err);
      }
    }

    if (rawProfiles.length === 0) {
      const stored = localStorage.getItem('skillproof_profiles');
      rawProfiles = stored ? JSON.parse(stored) : [];
    }

    // Default system user profile if empty
    if (rawProfiles.length === 0) {
      rawProfiles = [
        {
          id: 'admin-super-id-2026',
          fullName: 'Nishat Afroz (Super Admin)',
          full_name: 'Nishat Afroz (Super Admin)',
          email: 'nishat.af27@gmail.com',
          role: 'super_admin',
          status: 'active',
          premium: true,
          created_at: new Date().toISOString(),
          skills: ['React', 'TypeScript', 'Node.js', 'AI Engineering']
        }
      ];
      localStorage.setItem('skillproof_profiles', JSON.stringify(rawProfiles));
    }

    return rawProfiles.map(p => {
      // Setup role-based fallback. Ensure nishat.af27@gmail.com is ALWAYS a super_admin
      let determinedRole = p.role || 'user';
      if (p.email === 'nishat.af27@gmail.com') {
        determinedRole = 'super_admin';
      }

      return {
        id: p.id,
        fullName: p.fullName || p.full_name || 'Anonymous User',
        email: p.email || '',
        phone: p.phone,
        avatarUrl: p.avatar_url || p.avatarUrl,
        education: p.education,
        experience: p.experience,
        skills: p.skills || [],
        address: p.address,
        university: p.university,
        department: p.department,
        semester: p.semester,
        linkedin: p.linkedin,
        github: p.github,
        portfolio: p.portfolio,
        bio: p.bio,
        createdAt: p.created_at || p.createdAt || new Date().toISOString(),
        role: determinedRole,
        status: p.status || 'active',
        premium: p.premium || (p.email === 'nishat.af27@gmail.com' ? true : false),
        premiumExpiry: p.premiumExpiry || (p.email === 'nishat.af27@gmail.com' ? '2030-12-31' : undefined)
      };
    });
  },

  // ২. ব্যবহারকারীর তথ্য আপডেট করা (Update profile & settings)
  updateUser: async (userId: string, updates: Partial<UserProfile & { role: string; status: string; premium: boolean; premiumExpiry?: string }>): Promise<boolean> => {
    // Local update
    const stored = localStorage.getItem('skillproof_profiles');
    let list: any[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(p => p.id === userId);
    
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem('skillproof_profiles', JSON.stringify(list));
    } else {
      // Just in case it's the active current user
      list.push({ id: userId, ...updates });
      localStorage.setItem('skillproof_profiles', JSON.stringify(list));
    }

    if (isRealSupabase && supabaseClient) {
      try {
        const dbPayload: any = {};
        if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
        if (updates.phone !== undefined) dbPayload.phone = updates.phone;
        if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl;
        if (updates.skills !== undefined) dbPayload.skills = updates.skills;
        if (updates.role !== undefined) dbPayload.role = updates.role;
        if (updates.status !== undefined) dbPayload.status = updates.status;
        if (updates.premium !== undefined) dbPayload.premium = updates.premium;
        if (updates.premiumExpiry !== undefined) dbPayload.premium_expiry = updates.premiumExpiry;

        await supabaseClient
          .from('profiles')
          .update(dbPayload)
          .eq('id', userId);
      } catch (err) {
        console.error('Error updating profile in Supabase:', err);
      }
    }

    return true;
  },

  // ৩. ব্যবহারকারী মুছে ফেলা (Delete User and Associated Data)
  deleteUser: async (userId: string): Promise<boolean> => {
    // Local profiles
    const stored = localStorage.getItem('skillproof_profiles');
    if (stored) {
      let list = JSON.parse(stored);
      list = list.filter((p: any) => p.id !== userId);
      localStorage.setItem('skillproof_profiles', JSON.stringify(list));
    }

    // Local assessments
    const storedAss = localStorage.getItem('skillproof_assessments');
    if (storedAss) {
      let list = JSON.parse(storedAss);
      list = list.filter((a: any) => a.userId !== userId);
      localStorage.setItem('skillproof_assessments', JSON.stringify(list));
    }

    // Local CVs
    const storedCv = localStorage.getItem('skillproof_cv_data_list');
    if (storedCv) {
      let list = JSON.parse(storedCv);
      list = list.filter((c: any) => c.userId !== userId);
      localStorage.setItem('skillproof_cv_data_list', JSON.stringify(list));
    }

    // Local Interviews
    const storedInterviews = localStorage.getItem('skillproof_interview_sessions');
    if (storedInterviews) {
      let list = JSON.parse(storedInterviews);
      list = list.filter((i: any) => i.userId !== userId);
      localStorage.setItem('skillproof_interview_sessions', JSON.stringify(list));
    }

    // Local Passports
    const storedPassports = localStorage.getItem('skillproof_skill_passports');
    if (storedPassports) {
      let list = JSON.parse(storedPassports);
      list = list.filter((p: any) => p.userId !== userId);
      localStorage.setItem('skillproof_skill_passports', JSON.stringify(list));
    }

    // Local Reports
    const storedReports = localStorage.getItem('skillproof_reports_list');
    if (storedReports) {
      let list = JSON.parse(storedReports);
      list = list.filter((r: any) => r.userId !== userId);
      localStorage.setItem('skillproof_reports_list', JSON.stringify(list));
    }

    if (isRealSupabase && supabaseClient) {
      try {
        await supabaseClient.from('profiles').delete().eq('id', userId);
        await supabaseClient.from('cv_resumes').delete().eq('userId', userId);
        await supabaseClient.from('interview_sessions').delete().eq('userId', userId);
        await supabaseClient.from('reports').delete().eq('userId', userId);
        await supabaseClient.from('assessments').delete().eq('user_id', userId);
        await supabaseClient.from('skill_passports').delete().eq('user_id', userId);
      } catch (err) {
        console.error('Error deleting user data in real Supabase:', err);
      }
    }

    return true;
  },

  // ৪. সব অ্যাসেসমেন্ট লোড করা (Fetch all assessments across all users)
  getAllAssessments: async (): Promise<AssessmentRecord[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('assessments')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            type: item.type,
            skill: item.skill,
            difficulty: item.difficulty,
            title: item.title,
            status: item.status,
            duration: item.duration,
            createdAt: item.created_at,
            completedAt: item.completed_at,
            trustScore: item.trust_score || 0,
            questionData: item.question_data,
            projectData: item.project_data,
            userSolutionCode: item.user_solution_code,
            submittedZipName: item.submitted_zip_name,
            submittedGithubUrl: item.submitted_github_url,
            submittedDemoUrl: item.submitted_demo_url,
            submittedDocumentation: item.submitted_documentation,
            scores: item.scores,
            feedback: item.feedback
          }));
        }
      } catch (err) {
        console.error('Error loading assessments:', err);
      }
    }

    const stored = localStorage.getItem('skillproof_assessments');
    return stored ? JSON.parse(stored) : [];
  },

  // ৫. অ্যাসেসমেন্ট মডিফাই করা (Approve, override score, reject or reset)
  updateAssessment: async (id: string, updates: Partial<AssessmentRecord>): Promise<boolean> => {
    const stored = localStorage.getItem('skillproof_assessments');
    let list: any[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(a => a.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem('skillproof_assessments', JSON.stringify(list));
    }

    if (isRealSupabase && supabaseClient) {
      try {
        const payload: any = {};
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.scores !== undefined) payload.scores = updates.scores;
        if (updates.feedback !== undefined) payload.feedback = updates.feedback;

        await supabaseClient
          .from('assessments')
          .update(payload)
          .eq('id', id);
      } catch (err) {
        console.error('Error updating assessment in real Supabase:', err);
      }
    }
    return true;
  },

  // ৬. সব সিভি লোড করা (Fetch all resumes across all users)
  getAllResumes: async (): Promise<any[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('cv_resumes')
          .select('*')
          .order('updatedAt', { ascending: false });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.error('Error loading cv_resumes:', err);
      }
    }

    const stored = localStorage.getItem('skillproof_cv_data_list');
    return stored ? JSON.parse(stored) : [];
  },

  // ৭. সব ইন্টারভিউ লোড করা (Fetch all interview sessions across all users)
  getAllInterviews: async (): Promise<any[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('interview_sessions')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.error('Error loading interview_sessions:', err);
      }
    }

    const stored = localStorage.getItem('skillproof_interview_sessions');
    return stored ? JSON.parse(stored) : [];
  },

  // ৮. সব স্কিল পাসপোর্ট লোড করা (Fetch all passports across all users)
  getAllPassports: async (): Promise<SkillPassport[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('skill_passports')
          .select('*')
          .order('updated_at', { ascending: false });
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.passport_id,
            userId: d.user_id,
            fullName: d.full_name,
            avatarUrl: d.avatar_url,
            careerPath: d.career_path,
            readinessScore: d.readiness_score,
            level: calculateLevel(d.readiness_score),
            verificationStatus: d.verification_status || 'Verified',
            resumeScore: d.resume_score,
            atsScore: d.ats_score,
            interviewScore: d.interview_score,
            summary: d.summary,
            qrCodeUrl: d.qr_code_url,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
        }
      } catch (err) {
        console.error('Error loading passports:', err);
      }
    }

    const stored = localStorage.getItem('skillproof_skill_passports');
    return stored ? JSON.parse(stored) : [];
  },

  // ৯. পাসপোর্ট স্ট্যাটাস পরিবর্তন করা (Approve, reject, revoke passport)
  updatePassportStatus: async (passportId: string, status: 'Verified' | 'Pending' | 'Rejected' | 'Revoked'): Promise<boolean> => {
    const stored = localStorage.getItem('skillproof_skill_passports');
    let list: any[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(p => p.id === passportId || p.passport_id === passportId);
    if (idx >= 0) {
      list[idx].verificationStatus = status;
      localStorage.setItem('skillproof_skill_passports', JSON.stringify(list));
    }

    if (isRealSupabase && supabaseClient) {
      try {
        await supabaseClient
          .from('skill_passports')
          .update({ verification_status: status, updated_at: new Date().toISOString() })
          .eq('passport_id', passportId);
      } catch (err) {
        console.error('Error updating passport status in real Supabase:', err);
      }
    }
    return true;
  },

  // ১০. সব রিপোর্টস লোড করা (Fetch all reports)
  getAllReports: async (): Promise<AiReport[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('reports')
          .select('*')
          .order('generatedAt', { ascending: false });
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
      } catch (err) {
        console.error('Error loading reports:', err);
      }
    }

    const stored = localStorage.getItem('skillproof_reports_list');
    return stored ? JSON.parse(stored) : [];
  },

  // ১১. সব রোডম্যাপস লোড করা (Fetch all roadmaps)
  getAllRoadmaps: async (): Promise<any[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('roadmaps')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.error('Error loading roadmaps:', err);
      }
    }

    const stored = localStorage.getItem('skillproof_roadmaps');
    return stored ? JSON.parse(stored) : [];
  },

  // ১২. অডিট লগস লোড ও সেভ (Audit logs logic)
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const stored = localStorage.getItem('skillproof_audit_logs');
    return stored ? JSON.parse(stored) : [
      {
        id: 'log-1',
        adminName: 'Nishat Afroz',
        action: 'System Initialized',
        target: 'Enterprise Management Core',
        ipAddress: '192.168.1.100',
        browser: 'Chrome 120 / Linux',
        date: '2026-07-08',
        time: '10:00:00'
      }
    ];
  },

  addAuditLog: async (adminName: string, action: string, target: string, ipAddress?: string, browser?: string): Promise<void> => {
    const stored = localStorage.getItem('skillproof_audit_logs');
    const list: AuditLog[] = stored ? JSON.parse(stored) : [];
    
    const now = new Date();
    const newLog: AuditLog = {
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
      adminName,
      action,
      target,
      ipAddress: ipAddress || '127.0.0.1',
      browser: browser || 'Chrome / Edge',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0]
    };

    list.unshift(newLog);
    localStorage.setItem('skillproof_audit_logs', JSON.stringify(list.slice(0, 1000))); // Limit to latest 1000 logs
  },

  // ১৩. অ্যানাউন্সমেন্ট সেন্টার (Announcements logic)
  getAnnouncements: async (): Promise<Announcement[]> => {
    const stored = localStorage.getItem('skillproof_announcements');
    return stored ? JSON.parse(stored) : [
      {
        id: 'ann-1',
        title: 'এআই স্কিল অ্যাসেসমেন্ট হাবের শুভ উদ্বোধন!',
        content: 'আমরা গর্বের সাথে জানাচ্ছি যে, SkillProof AI বাংলাদেশ প্ল্যাটফর্মে এখন থেকে আপনি আপনার প্র্যাকটিক্যাল কোডিং ও রিয়েল-লাইফ প্রজেক্ট স্কিলসGroq ও Supabase-এর সহায়তায় সরাসরি যাচাই করে প্রফেশনাল স্কিল পাসপোর্ট এবং ব্যাজ আর্ন করতে পারবেন!',
        targetGroup: 'all',
        status: 'published',
        createdAt: '2026-07-08T09:00:00Z'
      }
    ];
  },

  addAnnouncement: async (ann: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    const stored = localStorage.getItem('skillproof_announcements');
    const list: Announcement[] = stored ? JSON.parse(stored) : [];

    const newAnn: Announcement = {
      ...ann,
      id: `ann-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    list.unshift(newAnn);
    localStorage.setItem('skillproof_announcements', JSON.stringify(list));
    return newAnn;
  },

  deleteAnnouncement: async (id: string): Promise<boolean> => {
    const stored = localStorage.getItem('skillproof_announcements');
    if (stored) {
      let list = JSON.parse(stored);
      list = list.filter((a: any) => a.id !== id);
      localStorage.setItem('skillproof_announcements', JSON.stringify(list));
      return true;
    }
    return false;
  },

  // ১৪. সিস্টেম সেটিংস (System settings logic)
  getSystemSettings: async (): Promise<SystemConfig> => {
    const stored = localStorage.getItem('skillproof_system_config');
    if (stored) return JSON.parse(stored);

    const defaultConfig: SystemConfig = {
      siteName: 'SkillProof AI Bangladesh',
      logoUrl: '',
      theme: 'emerald',
      emailSettings: {
        senderEmail: 'noreply@skillproof.ai.bd',
        senderName: 'SkillProof AI BD Team'
      },
      groqSettings: {
        model: 'llama3-70b-8192',
        temperature: 0.5
      },
      supabaseSettings: {
        realtimeEnabled: true
      },
      featureFlags: {
        cvBuilder: true,
        interviewEngine: true,
        assessmentHub: true,
        skillPassport: true,
        growthHub: true
      },
      maintenanceMode: false,
      language: 'bn',
      homepageBanner: 'আপনার প্রফেশনাল ক্যারিয়ারকে এআই এবং ক্লাউড ভেরিফিকেশনের মাধ্যমে নতুন উচ্চতায় নিয়ে যান।'
    };

    localStorage.setItem('skillproof_system_config', JSON.stringify(defaultConfig));
    return defaultConfig;
  },

  saveSystemSettings: async (settings: SystemConfig): Promise<boolean> => {
    localStorage.setItem('skillproof_system_config', JSON.stringify(settings));
    return true;
  }
};
