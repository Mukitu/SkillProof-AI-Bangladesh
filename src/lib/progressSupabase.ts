import { supabaseClient, isRealSupabase } from './supabase';
import { CareerProgress } from '../types/progress';

const PROGRESS_STORAGE_KEY = 'skillproof_progress';

export const progressDb = {
  getProgress: async (userId: string): Promise<CareerProgress | null> => {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('career_progress')
          .select('*')
          .eq('userId', userId)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) return data;
      } catch (err: any) {
        console.warn('Supabase progress get failed, using local state:', err);
      }
    }

    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const list: CareerProgress[] = stored ? JSON.parse(stored) : [];
    return list.find(p => p.userId === userId) || null;
  },

  saveProgress: async (progress: CareerProgress): Promise<void> => {
    if (isRealSupabase) {
      try {
        const { error } = await supabaseClient
          .from('career_progress')
          .upsert(progress);
        if (error) throw error;
      } catch (err: any) {
        console.warn('Supabase progress save failed, using local state:', err);
      }
    }

    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const list: CareerProgress[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(p => p.userId === progress.userId);
    if (idx > -1) {
      list[idx] = progress;
    } else {
      list.push(progress);
    }
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(list));
  }
};
