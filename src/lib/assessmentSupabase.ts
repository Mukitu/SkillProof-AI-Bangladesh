import { createClient } from '@supabase/supabase-js';
import { AssessmentRecord, AssessmentDifficulty } from '../types/assessment';
import { supabaseClient as mainSupabase, isRealSupabase as mainIsReal } from './supabase';
import { passportDb } from './passportSupabase';

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
    console.error('Supabase initialization failed in assessment:', err);
  }
}

export const assessmentDb = {
  // ১. ইউজারের সকল অ্যাসেসমেন্ট হিস্ট্রি রিটার্ন করা (Get all assessments for user)
  getAssessmentsByUserId: async (userId: string): Promise<AssessmentRecord[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('assessments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(item => ({
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
        console.error('Error fetching assessments from Supabase:', err);
      }
    }

    // Fallback to local
    const stored = localStorage.getItem('skillproof_assessments');
    const list: any[] = stored ? JSON.parse(stored) : [];
    return list
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ২. নতুন অ্যাসেসমেন্ট সেভ বা ইনসার্ট করা (Save a new assessment record)
  saveAssessment: async (assessment: AssessmentRecord): Promise<AssessmentRecord> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const payload = {
          id: assessment.id,
          user_id: assessment.userId,
          type: assessment.type,
          skill: assessment.skill,
          difficulty: assessment.difficulty,
          title: assessment.title,
          status: assessment.status,
          duration: assessment.duration,
          created_at: assessment.createdAt,
          completed_at: assessment.completedAt,
          trust_score: assessment.trustScore,
          question_data: assessment.questionData,
          project_data: assessment.projectData,
          user_solution_code: assessment.userSolutionCode,
          submitted_zip_name: assessment.submittedZipName,
          submitted_github_url: assessment.submittedGithubUrl,
          submitted_demo_url: assessment.submittedDemoUrl,
          submitted_documentation: assessment.submittedDocumentation,
          scores: assessment.scores,
          feedback: assessment.feedback
        };

        const { error } = await supabaseClient
          .from('assessments')
          .insert([payload]);

        if (!error) {
          return assessment;
        }
        console.error('Supabase error inserting assessment:', error.message);
      } catch (err) {
        console.error('Error saving assessment to Supabase:', err);
      }
    }

    // LocalStorage fallback
    const stored = localStorage.getItem('skillproof_assessments');
    const list: any[] = stored ? JSON.parse(stored) : [];
    list.push(assessment);
    localStorage.setItem('skillproof_assessments', JSON.stringify(list));
    return assessment;
  },

  // ৩. অ্যাসেসমেন্ট আপডেট করা (Update an existing assessment record)
  updateAssessment: async (id: string, updates: Partial<AssessmentRecord>): Promise<boolean> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const payload: any = {};
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;
        if (updates.duration !== undefined) payload.duration = updates.duration;
        if (updates.trustScore !== undefined) payload.trust_score = updates.trustScore;
        if (updates.userSolutionCode !== undefined) payload.user_solution_code = updates.userSolutionCode;
        if (updates.submittedZipName !== undefined) payload.submitted_zip_name = updates.submittedZipName;
        if (updates.submittedGithubUrl !== undefined) payload.submitted_github_url = updates.submittedGithubUrl;
        if (updates.submittedDemoUrl !== undefined) payload.submitted_demo_url = updates.submittedDemoUrl;
        if (updates.submittedDocumentation !== undefined) payload.submitted_documentation = updates.submittedDocumentation;
        if (updates.scores !== undefined) payload.scores = updates.scores;
        if (updates.feedback !== undefined) payload.feedback = updates.feedback;

        const { error } = await supabaseClient
          .from('assessments')
          .update(payload)
          .eq('id', id);

        if (!error) {
          return true;
        }
        console.error('Supabase error updating assessment:', error.message);
      } catch (err) {
        console.error('Error updating assessment in Supabase:', err);
      }
    }

    // LocalStorage fallback
    const stored = localStorage.getItem('skillproof_assessments');
    let list: any[] = stored ? JSON.parse(stored) : [];
    let updated = false;
    list = list.map(item => {
      if (item.id === id) {
        updated = true;
        return { ...item, ...updates };
      }
      return item;
    });
    localStorage.setItem('skillproof_assessments', JSON.stringify(list));
    return updated;
  },

  // ৪. অ্যাসেসমেন্ট ডিলিট করা (Delete history record)
  deleteAssessment: async (id: string): Promise<boolean> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('assessments')
          .delete()
          .eq('id', id);

        if (!error) {
          return true;
        }
      } catch (err) {
        console.error('Error deleting assessment from Supabase:', err);
      }
    }

    // LocalStorage fallback
    const stored = localStorage.getItem('skillproof_assessments');
    const list: any[] = stored ? JSON.parse(stored) : [];
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem('skillproof_assessments', JSON.stringify(filtered));
    return true;
  },

  // ৫. প্রিভিয়াস হিস্ট্রি থেকে ডিফিকাল্টি ক্যালকুলেশন করা (Calculate Adaptive Difficulty based on past score)
  calculateDifficulty: async (userId: string, skill: string): Promise<AssessmentDifficulty> => {
    try {
      const history = await assessmentDb.getAssessmentsByUserId(userId);
      const skillHistory = history.filter(item => item.skill.toLowerCase() === skill.toLowerCase() && item.status === 'completed');
      
      if (skillHistory.length === 0) return 'Beginner';
      
      // সর্বশেষ সম্পন্ন করা টেস্ট এর স্কোর
      const lastAttempt = skillHistory[0];
      const lastScore = lastAttempt.scores?.overallScore || 0;
      
      if (lastScore >= 85) {
        // যদি শেষবার খুব ভালো স্কোর পেয়ে থাকে, তাহলে নেক্সট লেভেলে নিব
        if (lastAttempt.difficulty === 'Beginner') return 'Intermediate';
        if (lastAttempt.difficulty === 'Intermediate') return 'Advanced';
        return 'Advanced';
      } else if (lastScore < 50) {
        // যদি স্কোর অনেক কম থাকে, তাহলে লেভেল ডাউন করব
        if (lastAttempt.difficulty === 'Advanced') return 'Intermediate';
        if (lastAttempt.difficulty === 'Intermediate') return 'Beginner';
        return 'Beginner';
      }
      
      return lastAttempt.difficulty;
    } catch (err) {
      console.error('Error calculating adaptive difficulty:', err);
      return 'Beginner';
    }
  },

  // ৬. স্কিল পাসপোর্ট ও ব্যাজ আপডেট করা (If passed, update Skill Passport & issue badge)
  syncPassportAndBadges: async (userId: string, skillName: string, score: number, userProfile: any): Promise<void> => {
    try {
      // অ্যাসেসমেন্ট সম্পন্ন করার পর পাসপোর্ট লেভেল ও ক্যারিয়ার রেডিনেস সিনক্রোনাইজ করা
      await passportDb.syncPassport(userId, userProfile);
    } catch (err) {
      console.error('Error syncing passport with assessment results:', err);
    }
  }
};
