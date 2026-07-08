import { createClient } from '@supabase/supabase-js';
import { CareerRoadmapData } from '../types/roadmap';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;
let isRealSupabase = false;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isRealSupabase = true;
  } catch (err) {
    console.error('❌ Supabase Roadmap initialization failed:', err);
  }
}

const LOCAL_STORAGE_KEY = 'skillproof_career_roadmaps';

export const roadmapDb = {
  isConfigured: () => isRealSupabase,

  getRoadmaps: async (userId: string): Promise<CareerRoadmapData[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('career_roadmaps')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
           console.warn('Warning: career_roadmaps fetch failed', error.message);
        } else if (data) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            targetCareer: d.target_career,
            phases: typeof d.phases === 'string' ? JSON.parse(d.phases) : d.phases,
            dailyTasks: typeof d.daily_tasks === 'string' ? JSON.parse(d.daily_tasks) : d.daily_tasks,
            lastGenerated: d.last_generated,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
        }
      } catch(e) {
        console.warn(e);
      }
    }
    const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  },
  
  getLatestRoadmap: async (userId: string): Promise<CareerRoadmapData | null> => {
     const all = await roadmapDb.getRoadmaps(userId);
     return all.length > 0 ? all[0] : null;
  },

  saveRoadmap: async (roadmap: CareerRoadmapData): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const row = {
          id: roadmap.id,
          user_id: roadmap.userId,
          target_career: roadmap.targetCareer,
          phases: roadmap.phases,
          daily_tasks: roadmap.dailyTasks,
          last_generated: roadmap.lastGenerated,
          created_at: roadmap.createdAt,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabaseClient
          .from('career_roadmaps')
          .upsert(row, { onConflict: 'id' });

        if (!error) return { success: true, error: null };
        console.warn('Saving to Supabase failed, falling back to local storage', error);
      } catch(e) {
        console.warn(e);
      }
    }
    
    // Local storage fallback
    const all = await roadmapDb.getRoadmaps(roadmap.userId);
    const existingIdx = all.findIndex(r => r.id === roadmap.id);
    if (existingIdx >= 0) {
        all[existingIdx] = roadmap;
    } else {
        all.unshift(roadmap);
    }
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${roadmap.userId}`, JSON.stringify(all));
    return { success: true, error: null };
  },

  deleteRoadmap: async (userId: string, id: string): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase && supabaseClient) {
        try {
            const { error } = await supabaseClient.from('career_roadmaps').delete().eq('id', id);
            if (!error) return { success: true, error: null };
        } catch(e) {
            console.warn(e);
        }
    }
    
    // Local storage fallback
    let all = await roadmapDb.getRoadmaps(userId);
    all = all.filter(r => r.id !== id);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(all));
    return { success: true, error: null };
  }
};
