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

// ====================================================================
// সুপাবেজ ডাটাবেজ এবং স্টোরেজ সার্ভিস (Supabase Database & Storage Service)
// ====================================================================

export const cvDb = {
  // ১. রিয়েল নাকি মক সুপাবেজ তা চেক করা (Check if real or sandbox)
  isConfigured: () => isRealSupabase,

  // ২. সব সিভি ডাটা লোড করা (Get all CV entries for a user)
  getResumes: async (userId: string): Promise<CvData[]> => {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('cv_resumes')
          .select('*')
          .eq('userId', userId)
          .order('updatedAt', { ascending: false });

        if (!error && data) {
          // সুপাবেজে প্রতি সারিতে JSON আকারে সম্পূর্ণ অবজেক্টও থাকতে পারে
          return data.map((item: any) => ({
            ...item,
            personalInfo: typeof item.personalInfo === 'string' ? JSON.parse(item.personalInfo) : item.personalInfo,
            education: typeof item.education === 'string' ? JSON.parse(item.education) : item.education,
            experience: typeof item.experience === 'string' ? JSON.parse(item.experience) : item.experience,
            projects: typeof item.projects === 'string' ? JSON.parse(item.projects) : item.projects,
            skills: typeof item.skills === 'string' ? JSON.parse(item.skills) : item.skills,
            scores: typeof item.scores === 'string' ? JSON.parse(item.scores) : item.scores,
            feedback: typeof item.feedback === 'string' ? JSON.parse(item.feedback) : item.feedback,
          }));
        }
        console.warn('⚠️ Supabase fetch warning, using local state:', error);
      } catch (err) {
        console.warn('⚠️ Database connection failed, using local state:', err);
      }
    }

    // স্যান্ডবক্স ফলব্যাক (Sandbox fallback using localStorage)
    const stored = localStorage.getItem(CV_STORAGE_KEY);
    const list: CvData[] = stored ? JSON.parse(stored) : [];
    return list.filter(cv => cv.userId === userId);
  },

  // ৩. সিঙ্গেল সিভি লোড করা (Get single CV by ID)
  getResumeById: async (id: string, userId: string): Promise<CvData | null> => {
    if (isRealSupabase) {
      try {
        const { data, error } = await supabaseClient
          .from('cv_resumes')
          .select('*')
          .eq('id', id)
          .eq('userId', userId)
          .single();

        if (!error && data) {
          return {
            ...data,
            personalInfo: typeof data.personalInfo === 'string' ? JSON.parse(data.personalInfo) : data.personalInfo,
            education: typeof data.education === 'string' ? JSON.parse(data.education) : data.education,
            experience: typeof data.experience === 'string' ? JSON.parse(data.experience) : data.experience,
            projects: typeof data.projects === 'string' ? JSON.parse(data.projects) : data.projects,
            skills: typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills,
            scores: typeof data.scores === 'string' ? JSON.parse(data.scores) : data.scores,
            feedback: typeof data.feedback === 'string' ? JSON.parse(data.feedback) : data.feedback,
          };
        }
        console.warn('⚠️ Supabase fetch by ID warning, using local state:', error);
      } catch (err) {
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

    if (isRealSupabase) {
      try {
        // সুপাবেজের জন্য ডাটাবেজ অবজেক্ট ফরম্যাট (Prepare database row)
        const row = {
          id: updatedCv.id,
          userId: updatedCv.userId,
          personalInfo: JSON.stringify(updatedCv.personalInfo),
          careerSummary: updatedCv.careerSummary,
          improvedCareerSummary: updatedCv.improvedCareerSummary || null,
          education: JSON.stringify(updatedCv.education),
          experience: JSON.stringify(updatedCv.experience),
          projects: JSON.stringify(updatedCv.projects),
          skills: JSON.stringify(updatedCv.skills),
          templateId: updatedCv.templateId,
          createdAt: updatedCv.createdAt,
          updatedAt: updatedCv.updatedAt,
          scores: updatedCv.scores ? JSON.stringify(updatedCv.scores) : null,
          feedback: updatedCv.feedback ? JSON.stringify(updatedCv.feedback) : null,
          isAnalyzed: updatedCv.isAnalyzed || false
        };

        const { error } = await supabaseClient
          .from('cv_resumes')
          .upsert(row, { onConflict: 'id' });

        if (!error) {
          // লোকাল কপিও রিফ্রেশ রাখি যেন দ্রুত রেসপন্স পাওয়া যায় (Also update local cache for instant updates)
          saveToLocalStorage(updatedCv);
          return { success: true, error: null };
        }
        console.warn('⚠️ Supabase upsert error, falling back to local state:', error);
      } catch (err: any) {
        console.warn('⚠️ Database save operation failed, falling back to local state:', err);
      }
    }

    // স্যান্ডবক্স সংরক্ষণ (Sandbox storage - fallback works seamlessly)
    saveToLocalStorage(updatedCv);
    return { success: true, error: null };
  },

  // ৫. সিভি মুছে ফেলা (Delete CV from database)
  deleteResume: async (id: string, userId: string): Promise<{ success: boolean; error: string | null }> => {
    if (isRealSupabase) {
      try {
        const { error } = await supabaseClient
          .from('cv_resumes')
          .delete()
          .eq('id', id)
          .eq('userId', userId);

        if (!error) {
          deleteFromLocalStorage(id);
          return { success: true, error: null };
        }
        console.warn('⚠️ Supabase delete error, using local state:', error);
      } catch (err: any) {
        console.warn('⚠️ Delete operation failed, using local state:', err);
      }
    }

    deleteFromLocalStorage(id);
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

        // বাকেট না থাকলে তৈরি করার চেষ্টা করা
        if (uploadError && (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket') || uploadError.message?.includes('does not exist'))) {
          console.warn('⚠️ cv_storage bucket not found, attempting to create it programmatically...');
          try {
            const { error: createError } = await supabaseClient.storage.createBucket('cv_storage', {
              public: true
            });
            if (!createError) {
              console.log('✅ cv_storage bucket created successfully. Retrying upload...');
              const { error: retryError } = await supabaseClient.storage
                .from('cv_storage')
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: true
                });
              uploadError = retryError;
            }
          } catch (createErr) {
            console.error('Failed to create bucket:', createErr);
          }
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
        console.warn('⚠️ Real Supabase upload failed, falling back to local sandbox storage:', err);
      }
    }

    // স্যান্ডবক্স মোডে লোকাল ইউআরএল দিয়ে ফাইল সিমুলেট করা (Simulate files in local sandbox)
    const simulatedUrl = `blob:skillproof_sandbox_bucket/${filePath}`;
    const newMeta = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileUrl: simulatedUrl,
      uploadedAt: new Date().toISOString()
    };

    const storedMetas = localStorage.getItem(FILES_STORAGE_KEY);
    const metasList = storedMetas ? JSON.parse(storedMetas) : [];
    metasList.push(newMeta);
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(metasList));

    // ফাইল রিড করা এবং স্টোর করা (আমরা ফাইলটিকে বেস-৬৪ এ কনভার্ট করে লোকালস্টোরেজে রাখতে পারি সিমুলেশনের জন্য)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          localStorage.setItem(`skillproof_cv_file_${newMeta.id}`, reader.result as string);
        } catch (e) {
          console.warn('File too large for localStorage, skipping content save. Metadata preserved.');
        }
        resolve({
          success: true,
          url: simulatedUrl,
          fileName: file.name,
          fileSize: file.size,
          error: null
        });
      };
      reader.readAsDataURL(file);
    });
  },

  // ৭. সিভি ইমপ্রুভমেন্ট হিস্ট্রি ট্র্যাক করা (Save CV Improvement History)
  saveImprovementHistory: async (history: CvImprovementHistory): Promise<void> => {
    if (isRealSupabase) {
      try {
        await supabaseClient.from('cv_improvement_history').upsert(history);
      } catch (err) {
        console.error('History save failed on Supabase:', err);
      }
    }

    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    const list: CvImprovementHistory[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(h => h.id === history.id);
    if (index > -1) {
      list[index] = history;
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
        if (!error && data) return data;
      } catch (err) {
        console.error('Get history from Supabase failed:', err);
      }
    }

    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    const list: CvImprovementHistory[] = stored ? JSON.parse(stored) : [];
    return list.filter(h => h.cvId === cvId);
  }
};

// ==========================================
// হেল্পার ফাংশনসমূহ (Helper Utilities)
// ==========================================

function saveToLocalStorage(cv: CvData) {
  const stored = localStorage.getItem(CV_STORAGE_KEY);
  const list: CvData[] = stored ? JSON.parse(stored) : [];
  const index = list.findIndex(item => item.id === cv.id);
  
  if (index > -1) {
    list[index] = cv;
  } else {
    list.push(cv);
  }
  localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(list));
}

function deleteFromLocalStorage(id: string) {
  const stored = localStorage.getItem(CV_STORAGE_KEY);
  if (stored) {
    let list: CvData[] = JSON.parse(stored);
    list = list.filter(item => item.id !== id);
    localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(list));
  }
}
