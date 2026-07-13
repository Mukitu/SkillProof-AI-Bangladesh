import { supabaseClient } from './supabase';
export const roadmapDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});
