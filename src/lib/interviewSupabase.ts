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
    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('interview_sessions')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false });

        if (error) throw error;
        if (data) {
          return data.map((item: any) => ({
            ...item,
            skills: typeof item.skills === 'string' ? JSON.parse(item.skills) : item.skills,
            scores: typeof item.scores === 'string' ? JSON.parse(item.scores) : item.scores,
            feedback: typeof item.feedback === 'string' ? JSON.parse(item.feedback) : item.feedback,
            qa: typeof item.qa === 'string' ? JSON.parse(item.qa) : item.qa,
          }));
        }
        return [];
      } catch (err: any) {
        console.error('⚠️ Database connection failed:', err);
        throw new Error('Supabase getSessions failed: ' + err.message);
      }
    }
    throw new Error('Supabase is not configured.');
  },

  // ৩. সিঙ্গেল ইন্টারভিউ সেশন লোড করা (Get single interview by ID)
  getSessionById: async (id: string, userId: string): Promise<InterviewSession | null> => {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('interview_sessions')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (error) throw error;
        if (data) {
          return {
            ...data,
            skills: typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills,
            scores: typeof data.scores === 'string' ? JSON.parse(data.scores) : data.scores,
            feedback: typeof data.feedback === 'string' ? JSON.parse(data.feedback) : data.feedback,
            qa: typeof data.qa === 'string' ? JSON.parse(data.qa) : data.qa,
          };
        }
        return null;
      } catch (err: any) {
        console.error('⚠️ Fetch interview by ID error:', err);
        throw new Error('Supabase getSessionById failed: ' + err.message);
      }
    }
    throw new Error('Supabase is not configured.');
  },

  // ৪. ইন্টারভিউ সেশন সংরক্ষণ (Save or Update Interview Session)
  saveSession: async (session: InterviewSession): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase) {
      try {
        const row = {
          id: session.id,
          userId: session.userId,
          cvId: session.cvId,
          careerPath: session.careerPath,
          skills: JSON.stringify(session.skills),
          status: session.status,
          scores: session.scores ? JSON.stringify(session.scores) : null,
          feedback: session.feedback ? JSON.stringify(session.feedback) : null,
          duration: session.duration,
          createdAt: session.createdAt,
          completedAt: session.completedAt || null,
          qa: JSON.stringify(session.qa)
        };

        const { error } = await supabaseClient
          .from('interview_sessions')
          .upsert(row, { onConflict: 'id' });

        if (error) throw error;
        return { success: true, error: null };
      } catch (err: any) {
        console.error('⚠️ Database interview save failed:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Supabase is not configured.' };
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
        console.error('⚠️ Delete interview operation failed:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Supabase is not configured.' };
  },

  // ৬. এডাপ্টিভ মেমোরি লোড করা (Load adaptive AI interview memory)
  getMemory: async (userId: string): Promise<InterviewMemory | null> => {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('interview_memories')
          .select('*')
          .eq('userId', userId)
          .single();

        if (error) throw error;
        if (data) {
          return {
            ...data,
            weakTopics: typeof data.weakTopics === 'string' ? JSON.parse(data.weakTopics) : data.weakTopics,
            strongTopics: typeof data.strongTopics === 'string' ? JSON.parse(data.strongTopics) : data.strongTopics,
            previousQuestions: typeof data.previousQuestions === 'string' ? JSON.parse(data.previousQuestions) : data.previousQuestions,
            previousMistakes: typeof data.previousMistakes === 'string' ? JSON.parse(data.previousMistakes) : data.previousMistakes,
            improvementHistory: typeof data.improvementHistory === 'string' ? JSON.parse(data.improvementHistory) : data.improvementHistory,
            learningSuggestions: typeof data.learningSuggestions === 'string' ? JSON.parse(data.learningSuggestions) : data.learningSuggestions,
            studyPlan: typeof data.studyPlan === 'string' ? JSON.parse(data.studyPlan) : data.studyPlan,
            metrics: typeof data.metrics === 'string' ? JSON.parse(data.metrics) : data.metrics,
            aiInsights: typeof data.aiInsights === 'string' ? JSON.parse(data.aiInsights) : data.aiInsights,
          };
        }
        return null;
      } catch (err: any) {
        console.error('⚠️ Database connection failed for memory fetch:', err);
        throw new Error('Supabase getMemory failed: ' + err.message);
      }
    }
    throw new Error('Supabase is not configured.');
  },

  // ৭. এডাপ্টিভ মেমোরি সংরক্ষণ করা (Save adaptive AI interview memory)
  saveMemory: async (memory: InterviewMemory): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase) {
      try {
        const row = {
          id: memory.id,
          userId: memory.userId,
          weakTopics: JSON.stringify(memory.weakTopics),
          strongTopics: JSON.stringify(memory.strongTopics),
          previousQuestions: JSON.stringify(memory.previousQuestions),
          previousMistakes: JSON.stringify(memory.previousMistakes),
          improvementHistory: JSON.stringify(memory.improvementHistory),
          learningSuggestions: JSON.stringify(memory.learningSuggestions),
          readinessExplanation: memory.readinessExplanation,
          readinessScore: memory.readinessScore,
          studyPlan: JSON.stringify(memory.studyPlan),
          metrics: JSON.stringify(memory.metrics),
          aiInsights: JSON.stringify(memory.aiInsights),
          lastUpdated: memory.lastUpdated
        };

        const { error } = await supabaseClient
          .from('interview_memories')
          .upsert(row, { onConflict: 'id' });

        if (error) throw error;
        return { success: true, error: null };
      } catch (err: any) {
        console.error('⚠️ Database memory save failed:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Supabase is not configured.' };
  }
};
