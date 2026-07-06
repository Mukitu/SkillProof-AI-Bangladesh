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

        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            skills: typeof item.skills === 'string' ? JSON.parse(item.skills) : item.skills,
            scores: typeof item.scores === 'string' ? JSON.parse(item.scores) : item.scores,
            feedback: typeof item.feedback === 'string' ? JSON.parse(item.feedback) : item.feedback,
            qa: typeof item.qa === 'string' ? JSON.parse(item.qa) : item.qa,
          }));
        }
        console.warn('⚠️ Supabase interview fetch warning, using local state:', error);
      } catch (err) {
        console.warn('⚠️ Database connection failed, using local state:', err);
      }
    }

    // স্যান্ডবক্স ফলব্যাক (Sandbox fallback using localStorage)
    const stored = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    const list: InterviewSession[] = stored ? JSON.parse(stored) : [];
    return list.filter(session => session.userId === userId);
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

        if (!error && data) {
          return {
            ...data,
            skills: typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills,
            scores: typeof data.scores === 'string' ? JSON.parse(data.scores) : data.scores,
            feedback: typeof data.feedback === 'string' ? JSON.parse(data.feedback) : data.feedback,
            qa: typeof data.qa === 'string' ? JSON.parse(data.qa) : data.qa,
          };
        }
        console.warn('⚠️ Supabase fetch interview by ID warning, using local state:', error);
      } catch (err) {
        console.warn('⚠️ Fetch interview by ID error, using local state:', err);
      }
    }

    const stored = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    const list: InterviewSession[] = stored ? JSON.parse(stored) : [];
    return list.find(s => s.id === id && s.userId === userId) || null;
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

        if (!error) {
          saveToLocalStorage(session);
          return { success: true, error: null };
        }
        console.warn('⚠️ Supabase interview upsert warning, falling back to local state:', error);
      } catch (err: any) {
        console.warn('⚠️ Database interview save failed, falling back to local state:', err);
      }
    }

    // স্যান্ডবক্স সংরক্ষণ (Sandbox storage - fallback works seamlessly)
    saveToLocalStorage(session);
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

        if (!error) {
          deleteFromLocalStorage(id);
          return { success: true, error: null };
        }
        console.warn('⚠️ Supabase delete interview warning, using local state:', error);
      } catch (err: any) {
        console.warn('⚠️ Delete interview operation failed, using local state:', err);
      }
    }

    deleteFromLocalStorage(id);
    return { success: true, error: null };
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

        if (!error && data) {
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
        console.warn('⚠️ Supabase fetch memory warning, using local state:', error);
      } catch (err) {
        console.warn('⚠️ Database connection failed for memory fetch, using local state:', err);
      }
    }

    // fallback
    const stored = localStorage.getItem(`${ADAPTIVE_MEMORY_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : null;
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

        if (!error) {
          localStorage.setItem(`${ADAPTIVE_MEMORY_KEY}_${memory.userId}`, JSON.stringify(memory));
          return { success: true, error: null };
        }
        console.warn('⚠️ Supabase memory upsert warning, using local state:', error);
      } catch (err: any) {
        console.warn('⚠️ Database memory save failed, using local state:', err);
      }
    }

    localStorage.setItem(`${ADAPTIVE_MEMORY_KEY}_${memory.userId}`, JSON.stringify(memory));
    return { success: true, error: null };
  }
};

// ==========================================
// হেল্পার ফাংশনসমূহ (Helper Utilities)
// ==========================================

function saveToLocalStorage(session: InterviewSession) {
  const stored = localStorage.getItem(INTERVIEW_STORAGE_KEY);
  const list: InterviewSession[] = stored ? JSON.parse(stored) : [];
  const index = list.findIndex(item => item.id === session.id);
  
  if (index > -1) {
    list[index] = session;
  } else {
    list.push(session);
  }
  localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(list));
}

function deleteFromLocalStorage(id: string) {
  const stored = localStorage.getItem(INTERVIEW_STORAGE_KEY);
  if (stored) {
    let list: InterviewSession[] = JSON.parse(stored);
    list = list.filter(item => item.id !== id);
    localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(list));
  }
}
