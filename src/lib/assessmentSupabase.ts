import { supabaseClient } from './supabase';
export const assessmentDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});
