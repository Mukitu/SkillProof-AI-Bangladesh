import { supabaseClient } from './supabase';
export const jobDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});
