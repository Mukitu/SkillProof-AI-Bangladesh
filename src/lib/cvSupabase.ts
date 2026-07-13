import { supabaseClient } from './supabase';
export const cvDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});
