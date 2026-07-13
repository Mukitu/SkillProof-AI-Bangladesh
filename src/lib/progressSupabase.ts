import { supabaseClient } from './supabase';
import { CareerProgress } from '../types/progress';

const PROGRESS_STORAGE_KEY = 'skillproof_progress';
;
;

export const progressDb = {
  getProgress: async (userId: string): Promise<CareerProgress | null> => { return null as any; },
  saveProgress: async (progress: CareerProgress): Promise<void> => { return null as any; },
};
