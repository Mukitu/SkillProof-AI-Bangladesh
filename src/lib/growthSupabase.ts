import { supabaseClient } from './supabase';
export const growthDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});
