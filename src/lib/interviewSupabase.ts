import { supabaseClient } from './supabase';
export const interviewDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});
