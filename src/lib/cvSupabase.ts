/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { CvData, CvImprovementHistory } from '../types';

// সুপাবেজ এনভায়রনমেন্ট ভেরিয়েবল চেক করা (Check Supabase credentials)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ক্লায়েন্ট ইনিশিয়ালাইজেশন (Initialize Supabase Client lazily)
let supabaseClient: any = null;
let isRealSupabase = false;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isRealSupabase = true;
    console.log('✅ Supabase Connection Initialized Successfully.');
  } catch (err) {
    console.error('❌ Supabase initialization failed, falling back to Sandbox:', err);
  }
} else {
  console.warn('⚠️ Supabase credentials missing. Running in secure localStorage Sandbox mode.');
}

// লোকালস্টোরেজ কী-সমূহ (LocalStorage Keys for Sandbox)
const CV_STORAGE_KEY = 'skillproof_cv_data_list';
const HISTORY_STORAGE_KEY = 'skillproof_cv_history_list';
const FILES_STORAGE_KEY = 'skillproof_cv_files_metadata';
const INTERVIEW_STORAGE_KEY = 'skillproof_interview_sessions';

// ====================================================================
// সুপাবেজ ডাটাবেজ এবং স্টোরেজ সার্ভিস (Supabase Database & Storage Service)
// ====================================================================

export const cvDb = {
  // ১. রিয়েল নাকি মক সুপাবেজ তা চেক করা (Check if real or sandbox)
  isConfigured: () => isRealSupabase,

  // ২. সব সিভি ডাটা লোড করা (Get all CV entries for a user)
  getResumes: async (userId: string): Promise<CvData[]> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('cv_resumes')
          .select('*')
          .eq('user_id', userId)
          .order('updatedAt', { ascending: false });

        if (error) throw error;
        if (data) {
          return data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            personalInfo: item.personalInfo,
            careerSummary: item.careerSummary,
            improvedCareerSummary: item.improvedCareerSummary,
            education: item.education,
            experience: item.experience,
            projects: item.projects,
            skills: item.skills,
            templateId: item.templateId,
            isAnalyzed: item.isAnalyzed,
            scores: item.scores,
            feedback: item.feedback,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));
        }
        return [];
      } catch (err: any) {
        console.error('❌ CV Database Fetch Error:', err.message || err);
      }
    }

    // স্যান্ডবক্স ফলব্যাক (Sandbox fallback using localStorage)
    const stored = localStorage.getItem(CV_STORAGE_KEY);
    const list: CvData[] = stored ? JSON.parse(stored) : [];
    return list.filter(cv => cv.userId === userId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // ৩. সিঙ্গেল সিভি লোড করা (Get single CV by ID)
  getResumeById: async (id: string, userId: string): Promise<CvData | null> => {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('cv_resumes')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        if (data) {
          return {
            id: data.id,
            userId: data.user_id,
            personalInfo: data.personalInfo,
            careerSummary: data.careerSummary,
            improvedCareerSummary: data.improvedCareerSummary,
            education: data.education,
            experience: data.experience,
            projects: data.projects,
            skills: data.skills,
            templateId: data.templateId,
            isAnalyzed: data.isAnalyzed,
            scores: data.scores,
            feedback: data.feedback,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        }
        return null;
      } catch (err: any) {
        console.warn('⚠️ Fetch resume by ID error, using local state:', err);
      }
    }

    const stored = localStorage.getItem(CV_STORAGE_KEY);
    const list: CvData[] = stored ? JSON.parse(stored) : [];
    return list.find(cv => cv.id === id && cv.userId === userId) || null;
  },

  // ৪. সিভি সংরক্ষণ বা অটোসেভ (Save or Auto-Save CV to database)
  saveResume: async (cv: CvData): Promise<{ success: boolean; error: string | null }> => {
    const updatedCv = {
      ...cv,
      updatedAt: new Date().toISOString()
    };

    if (isRealSupabase && supabaseClient) {
      try {
        const row = {
          id: updatedCv.id,
          user_id: updatedCv.userId,
          personalInfo: updatedCv.personalInfo,
          careerSummary: updatedCv.careerSummary,
          improvedCareerSummary: updatedCv.improvedCareerSummary || null,
          education: updatedCv.education,
          experience: updatedCv.experience,
          projects: updatedCv.projects,
          skills: updatedCv.skills,
          templateId: updatedCv.templateId,
          createdAt: updatedCv.createdAt,
          updatedAt: updatedCv.updatedAt,
          scores: updatedCv.scores || null,
          feedback: updatedCv.feedback || null,
          isAnalyzed: updatedCv.isAnalyzed || false
        };

        const { error } = await supabaseClient
          .from('cv_resumes')
          .upsert(row, { onConflict: 'id' });

        if (error) throw error;
        return { success: true, error: null };
      } catch (err: any) {
        console.error('❌ CV Database Save Error:', err);
        return { success: false, error: err.message };
      }
    }

    const stored = localStorage.getItem(CV_STORAGE_KEY);
    let list: CvData[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(item => item.id === cv.id);
    if (idx > -1) {
      list[idx] = updatedCv;
    } else {
      list.push(updatedCv);
    }
    localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(list));
    return { success: true, error: null };
  },

  // ৫. সিভি মুছে ফেলা (Delete CV from database)
  deleteResume: async (id: string, userId: string): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase) {
      // ১. Storage থেকে ফাইল মুছে ফেলা (Delete PDF from Supabase Storage)
      try {
        const { data: files } = await supabaseClient
          .from('cv_files_metadata')
          .select('*')
          .eq('userId', userId);
        
        if (files && files.length > 0) {
          const filePaths = files.map((f: any) => {
            const urlParts = f.fileUrl.split('/');
            const cleanName = urlParts[urlParts.length - 1];
            return `${userId}/${cleanName}`;
          });

          if (filePaths.length > 0) {
            await supabaseClient.storage.from('cv_storage').remove(filePaths);
          }
        }
      } catch (err) {
        console.warn('⚠️ Supabase Storage PDF deletion warning:', err);
      }

      // ২. মেটাডাটা টেবিল থেকে ডিলিট করা
      try {
        await supabaseClient
          .from('cv_files_metadata')
          .delete()
          .eq('userId', userId);
      } catch (err) {
        console.warn('⚠️ cv_files_metadata deletion warning:', err);
      }

      // ৩. অ্যাসোসিয়েটেড ইন্টারভিউ সেশন মুছে ফেলা (Delete interview sessions for this CV)
      try {
        await supabaseClient
          .from('interview_sessions')
          .delete()
          .eq('cvId', id)
          .eq('userId', userId);
      } catch (err) {
        console.warn('⚠️ interview_sessions deletion warning:', err);
      }

      // ৪. ইম্প্রুভমেন্ট হিস্ট্রি মুছে ফেলা (Delete improvement history)
      try {
        await supabaseClient
          .from('cv_improvement_history')
          .delete()
          .eq('cvId', id);
      } catch (err) {
        console.warn('⚠️ cv_improvement_history deletion warning:', err);
      }

      // ৫. সিভি রেকর্ড ডাটাবেজ থেকে মুছে ফেলা (Delete resume from cv_resumes)
      try {
        const { error } = await supabaseClient
          .from('cv_resumes')
          .delete()
          .eq('id', id)
          .eq('userId', userId);

        if (error) {
          console.error('❌ Core cv_resumes deletion error:', error);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.error('❌ Core cv_resumes deletion exception:', err);
        return { success: false, error: err.message || 'Unknown database error' };
      }
    }

    // লোকালস্টোরেজ / ক্যাশ ডাটা ক্লিন করা (Clear cached / localStorage data)
    const stored = localStorage.getItem(CV_STORAGE_KEY);
    if (stored) {
      let list: CvData[] = JSON.parse(stored);
      list = list.filter(cv => cv.id !== id);
      localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(list));
    }

    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedHistory) {
      let list = JSON.parse(storedHistory);
      list = list.filter((h: any) => h.cvId !== id);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
    }

    const storedMeta = localStorage.getItem(FILES_STORAGE_KEY);
    if (storedMeta) {
      let list = JSON.parse(storedMeta);
      list = list.filter((m: any) => m.userId !== userId);
      localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(list));
    }

    const storedSessions = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    if (storedSessions) {
      let list = JSON.parse(storedSessions);
      list = list.filter((s: any) => s.cvId !== id);
      localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(list));
    }

    return { success: true, error: null };
  },

  // ৬. ফাইলের মেটাডাটা সংরক্ষণ এবং আপলোড (File Storage & Metadata save)
  uploadCVFile: async (
    userId: string,
    file: File
  ): Promise<{ success: boolean; url: string | null; fileName: string; fileSize: number; error: string | null }> => {
    const fileExt = file.name.split('.').pop();
    const cleanName = `${Math.random().toString(36).substring(2, 11)}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${cleanName}`;

    let publicUrl = '';

    if (isRealSupabase) {
      try {
        // ১. ফাইলটি স্টোরেজ বাকেটে আপলোড করা (Upload to Supabase Storage Bucket)
        // বাকেট নাম অবশ্যই 'cv_storage' হবে।
        let { error: uploadError } = await supabaseClient.storage
          .from('cv_storage')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        // বাকেট না থাকলে বা পারমিশন না থাকলে এরর হ্যান্ডলিং
        if (uploadError && (
          uploadError.message?.includes('not found') || 
          uploadError.message?.includes('Bucket') || 
          uploadError.message?.includes('does not exist') ||
          uploadError.message?.includes('violates row-level security policy') ||
          (uploadError as any).status === 404
        )) {
          console.error('❌ Supabase Storage Error:', uploadError.message);
          throw new Error('সুপাবেজ স্টোরেজে "cv_storage" বাকেটটি তৈরি করা নেই অথবা পারমিশন নেই। দয়া করে সুপাবেজ ড্যাশবোর্ড থেকে "cv_storage" নামে একটি Public Bucket তৈরি করুন এবং RLS পলিসি চেক করুন। (Storage bucket "cv_storage" not found or RLS policy violation. Please create a public bucket named "cv_storage" in your Supabase dashboard.)');
        }

        if (uploadError) {
          throw new Error(`Storage upload error: ${uploadError.message}`);
        }

        // ২. পাবলিক ইউআরএল জেনারেট করা (Retrieve public URL)
        const { data } = supabaseClient.storage
          .from('cv_storage')
          .getPublicUrl(filePath);

        publicUrl = data?.publicUrl || '';

        // ৩. মেটাডাটা টেবিলে সংরক্ষণ করা (Save upload metadata)
        const metadataRow = {
          userId,
          fileName: file.name,
          fileSize: file.size,
          fileUrl: publicUrl,
          uploadedAt: new Date().toISOString()
        };

        const { error: metaError } = await supabaseClient
          .from('cv_files_metadata')
          .insert(metadataRow);

        if (metaError) {
          console.warn('⚠️ Metadata DB insert warning:', metaError);
        }

        return {
          success: true,
          url: publicUrl,
          fileName: file.name,
          fileSize: file.size,
          error: null
        };
      } catch (err: any) {
        console.warn('⚠️ Supabase upload failed, using local state:', err);
      }
    }

    // লোকাল ফলব্যাক (Local fallback)
    const mockUrl = URL.createObjectURL(file);
    const metadataRow = {
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileUrl: mockUrl,
      uploadedAt: new Date().toISOString()
    };
    const storedMeta = localStorage.getItem(FILES_STORAGE_KEY);
    const metaList = storedMeta ? JSON.parse(storedMeta) : [];
    metaList.push(metadataRow);
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(metaList));

    return {
      success: true,
      url: mockUrl,
      fileName: file.name,
      fileSize: file.size,
      error: null
    };
  },

  // ৭. সিভি ইমপ্রুভমেন্ট হিস্ট্রি ট্র্যাক করা (Save CV Improvement History)
  saveImprovementHistory: async (history: CvImprovementHistory): Promise<void> => {
    if (isRealSupabase) {
      try {
        const { error } = await supabaseClient.from('cv_improvement_history').upsert(history);
        if (error) throw error;
      } catch (err: any) {
        console.warn('History save failed on Supabase, using local state:', err);
      }
    }

    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    const list: CvImprovementHistory[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(h => h.id === history.id);
    if (idx > -1) {
      list[idx] = history;
    } else {
      list.push(history);
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
  },

  getImprovementHistory: async (cvId: string): Promise<CvImprovementHistory[]> => {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('cv_improvement_history')
          .select('*')
          .eq('cvId', cvId);
        if (error) throw error;
        if (data) return data;
      } catch (err: any) {
        console.warn('Get history from Supabase failed, using local state:', err);
      }
    }

    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    const list: CvImprovementHistory[] = stored ? JSON.parse(stored) : [];
    return list.filter(h => h.cvId === cvId);
  }
};
