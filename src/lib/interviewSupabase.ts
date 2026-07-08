/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { InterviewSession, InterviewMemory } from '../types';

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
    console.log('✅ Supabase Interview Connection Initialized.');
  } catch (err) {
    console.error('❌ Supabase interview initialization failed:', err);
  }
}

// লোকালস্টোরেজ কী-সমূহ (LocalStorage Keys for Sandbox)
const INTERVIEW_STORAGE_KEY = 'skillproof_interview_sessions';
const ADAPTIVE_MEMORY_KEY = 'skillproof_interview_memory';

export const interviewDb = {
  // ১. রিয়েল নাকি মক সুপাবেজ তা চেক করা (Check if real or sandbox)
  isConfigured: () => isRealSupabase,

  // ২. সব ইন্টারভিউ সেশন লোড করা (Get all interview sessions for a user)
  getSessions: async (userId: string): Promise<InterviewSession[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('interview_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          return data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            cvId: item.cv_id,
            careerPath: item.career_path,
            skills: item.skills,
            status: item.status,
            scores: item.scores,
            feedback: item.feedback,
            duration: item.duration,
            qa: item.qa,
            createdAt: item.created_at,
            completedAt: item.completed_at
          }));
        }
        return [];
      } catch (err: any) {
        console.error('❌ Interview Database Fetch Error:', err.message || err);
      }
    }

    const stored = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    const list: InterviewSession[] = stored ? JSON.parse(stored) : [];
    return list.filter(s => s.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ৩. সিঙ্গেল ইন্টারভিউ সেশন লোড করা (Get single interview by ID)
  getSessionById: async (id: string, userId: string): Promise<InterviewSession | null> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        if (data) {
          return {
            id: data.id,
            userId: data.user_id,
            cvId: data.cv_id,
            careerPath: data.career_path,
            skills: data.skills,
            status: data.status,
            scores: data.scores,
            feedback: data.feedback,
            duration: data.duration,
            qa: data.qa,
            createdAt: data.created_at,
            completedAt: data.completed_at
          };
        }
        return null;
      } catch (err: any) {
        console.warn('⚠️ Fetch interview by ID error, using local state:', err);
      }
    }

    const stored = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    const list: InterviewSession[] = stored ? JSON.parse(stored) : [];
    return list.find(s => s.id === id && s.userId === userId) || null;
  },

  // ৪. ইন্টারভিউ সেশন সংরক্ষণ (Save or Update Interview Session)
  saveSession: async (session: InterviewSession): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const row = {
          id: session.id,
          user_id: session.userId,
          cv_id: session.cvId,
          career_path: session.careerPath,
          skills: session.skills,
          status: session.status,
          scores: session.scores || null,
          feedback: session.feedback || null,
          duration: session.duration,
          created_at: session.createdAt,
          completed_at: session.completedAt || null,
          qa: session.qa
        };

        const { error } = await supabaseClient
          .from('interview_sessions')
          .upsert(row, { onConflict: 'id' });

        if (error) throw error;
        return { success: true, error: null };
      } catch (err: any) {
        console.error('❌ Interview Database Save Error:', err);
        return { success: false, error: err.message };
      }
    }

    const stored = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    let list: InterviewSession[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(item => item.id === session.id);
    if (idx > -1) {
      list[idx] = session;
    } else {
      list.push(session);
    }
    localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(list));
    return { success: true, error: null };
  },

  // ৫. ইন্টারভিউ সেশন মুছে ফেলা (Delete interview from database)
  deleteSession: async (id: string, userId: string): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase) {
      try {
        const { error } = await supabaseClient
          .from('interview_sessions')
          .delete()
          .eq('id', id)
          .eq('userId', userId);

        if (error) throw error;
        return { success: true, error: null };
      } catch (err: any) {
        console.warn('⚠️ Delete interview operation failed, using local state:', err);
      }
    }

    const stored = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    if (stored) {
      let list: InterviewSession[] = JSON.parse(stored);
      list = list.filter(s => s.id !== id);
      localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(list));
    }
    return { success: true, error: null };
  },

  // ৬. এডাপ্টিভ মেমোরি লোড করা (Load adaptive AI interview memory)
  getMemory: async (userId: string): Promise<InterviewMemory | null> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('interview_memories')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        if (data) {
          return {
            id: data.id,
            userId: data.user_id,
            weakTopics: typeof data.weak_topics === 'string' ? JSON.parse(data.weak_topics) : data.weak_topics,
            strongTopics: typeof data.strong_topics === 'string' ? JSON.parse(data.strong_topics) : data.strong_topics,
            previousQuestions: typeof data.previous_questions === 'string' ? JSON.parse(data.previous_questions) : data.previous_questions,
            previousMistakes: typeof data.previous_mistakes === 'string' ? JSON.parse(data.previous_mistakes) : data.previous_mistakes,
            improvementHistory: typeof data.improvement_history === 'string' ? JSON.parse(data.improvement_history) : data.improvement_history,
            learningSuggestions: typeof data.learning_suggestions === 'string' ? JSON.parse(data.learning_suggestions) : data.learning_suggestions,
            readinessExplanation: data.readiness_explanation,
            readinessScore: data.readiness_score,
            studyPlan: typeof data.study_plan === 'string' ? JSON.parse(data.study_plan) : data.study_plan,
            metrics: typeof data.metrics === 'string' ? JSON.parse(data.metrics) : data.metrics,
            aiInsights: typeof data.ai_insights === 'string' ? JSON.parse(data.ai_insights) : data.ai_insights,
            lastUpdated: data.last_updated
          };
        }
        return null;
      } catch (err: any) {
        console.warn('⚠️ Database connection failed for memory fetch, using local state:', err);
      }
    }

    const stored = localStorage.getItem(ADAPTIVE_MEMORY_KEY);
    const list: InterviewMemory[] = stored ? JSON.parse(stored) : [];
    return list.find(m => m.userId === userId) || null;
  },

  // ৭. এডাপ্টিভ মেমোরি সংরক্ষণ করা (Save adaptive AI interview memory)
  saveMemory: async (memory: InterviewMemory): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const row = {
          id: memory.id,
          user_id: memory.userId,
          weak_topics: JSON.stringify(memory.weakTopics),
          strong_topics: JSON.stringify(memory.strongTopics),
          previous_questions: JSON.stringify(memory.previousQuestions),
          previous_mistakes: JSON.stringify(memory.previousMistakes),
          improvement_history: JSON.stringify(memory.improvementHistory),
          learning_suggestions: JSON.stringify(memory.learningSuggestions),
          readiness_explanation: memory.readinessExplanation,
          readiness_score: memory.readinessScore,
          study_plan: JSON.stringify(memory.studyPlan),
          metrics: JSON.stringify(memory.metrics),
          ai_insights: JSON.stringify(memory.aiInsights),
          last_updated: memory.lastUpdated
        };

        const { error } = await supabaseClient
          .from('interview_memories')
          .upsert(row, { onConflict: 'id' });

        if (error) throw error;
        return { success: true, error: null };
      } catch (err: any) {
        console.warn('⚠️ Database memory save failed, using local state:', err);
      }
    }

    const stored = localStorage.getItem(ADAPTIVE_MEMORY_KEY);
    let list: InterviewMemory[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(item => item.id === memory.id);
    if (idx > -1) {
      list[idx] = memory;
    } else {
      list.push(memory);
    }
    localStorage.setItem(ADAPTIVE_MEMORY_KEY, JSON.stringify(list));
    return { success: true, error: null };
  }
};
