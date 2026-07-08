import { createClient } from '@supabase/supabase-js';
import { CareerProgressData } from '../types/growth';

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

const LOCAL_STORAGE_KEY = 'skillproof_career_progress';

export const growthDb = {
  isConfigured: () => isRealSupabase,

  getCareerProgress: async (userId: string): Promise<CareerProgressData | null> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('career_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') console.warn('Warning: career_progress fetch failed', error.message);
        } else if (data) {
          return {
            id: data.id,
            userId: data.user_id,
            overallScore: data.overall_score,
            resumeScore: data.resume_score,
            atsScore: data.ats_score,
            interviewScore: data.interview_score,
            skillScore: data.skill_score,
            profileCompletion: data.profile_completion,
            strengths: typeof data.strengths === 'string' ? JSON.parse(data.strengths) : data.strengths,
            weaknesses: typeof data.weaknesses === 'string' ? JSON.parse(data.weaknesses) : data.weaknesses,
            jobReadiness: data.job_readiness,
            readinessReason: data.readiness_reason,
            aiSuggestions: typeof data.ai_suggestions === 'string' ? JSON.parse(data.ai_suggestions) : data.ai_suggestions,
            learningResources: typeof data.learning_resources === 'string' ? JSON.parse(data.learning_resources) : data.learning_resources,
            projectRecommendations: typeof data.project_recommendations === 'string' ? JSON.parse(data.project_recommendations) : data.project_recommendations,
            careerPaths: typeof data.career_paths === 'string' ? JSON.parse(data.career_paths) : data.career_paths,
            actionPlan: typeof data.action_plan === 'string' ? JSON.parse(data.action_plan) : data.action_plan,
            lastGenerated: data.last_generated,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch(e) {
        console.warn(e);
      }
    }
    const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : null;
  },

  saveCareerProgress: async (progress: CareerProgressData): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const row = {
          id: progress.id,
          user_id: progress.userId,
          overall_score: progress.overallScore,
          resume_score: progress.resumeScore,
          ats_score: progress.atsScore,
          interview_score: progress.interviewScore,
          skill_score: progress.skillScore,
          profile_completion: progress.profileCompletion,
          strengths: progress.strengths,
          weaknesses: progress.weaknesses,
          job_readiness: progress.jobReadiness,
          readiness_reason: progress.readinessReason,
          ai_suggestions: progress.aiSuggestions,
          learning_resources: progress.learningResources,
          project_recommendations: progress.projectRecommendations,
          career_paths: progress.careerPaths,
          action_plan: progress.actionPlan,
          last_generated: progress.lastGenerated,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabaseClient
          .from('career_progress')
          .upsert(row, { onConflict: 'user_id' });

        if (!error) return { success: true, error: null };
        console.warn('Saving to Supabase failed, falling back to local storage', error);
      } catch(e) {
        console.warn(e);
      }
    }
    
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${progress.userId}`, JSON.stringify(progress));
    return { success: true, error: null };
  },

  updateActionPlan: async (userId: string, actionPlan: any): Promise<{ success: boolean; error: string | null }> => {
    const progress = await growthDb.getCareerProgress(userId);
    if (!progress) return { success: false, error: 'No progress found' };
    progress.actionPlan = actionPlan;
    return await growthDb.saveCareerProgress(progress);
  }
};
