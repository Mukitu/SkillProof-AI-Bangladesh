import { supabaseClient } from './supabase';
export const passportDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});
export const calculateLevel = (score: number) => "Beginner";
