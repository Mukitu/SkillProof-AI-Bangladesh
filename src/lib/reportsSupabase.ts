import { supabaseClient } from './supabase';
export const reportsDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});
