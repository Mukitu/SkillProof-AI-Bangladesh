/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Supabase মক ক্লায়েন্ট ইমপ্লিমেন্টেশন (Mock Supabase Client Implementation)
// এটি লাইভ ডেমো এবং প্রিভিউ-তে ডাটাবেজ এবং অথেনটিকেশন সচল রাখার জন্য লোকালস্টোরেজ ব্যবহার করে।
// (Uses localStorage to simulate Supabase operations in the preview sandbox)

import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserSettings } from '../types';

// Supabase রিয়েল ও মক ক্লায়েন্ট ইমপ্লিমেন্টেশন (Supabase Real & Sandbox client implementation)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export let supabaseClient: any = null;
export let isRealSupabase = false;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isRealSupabase = true;
    console.log('✅ Supabase Auth/DB Connection Initialized.');
  } catch (err) {
    console.error('❌ Supabase Auth/DB initialization failed:', err);
  }
}

class SupabaseAuthSimulator {
  private getProfiles(): UserProfile[] {
    const data = localStorage.getItem('skillproof_profiles');
    return data ? JSON.parse(data) : [];
  }

  private saveProfiles(profiles: UserProfile[]): void {
    localStorage.setItem('skillproof_profiles', JSON.stringify(profiles));
  }

  private getSettings(): UserSettings[] {
    const data = localStorage.getItem('skillproof_settings');
    return data ? JSON.parse(data) : [];
  }

  private saveSettings(settings: UserSettings[]): void {
    localStorage.setItem('skillproof_settings', JSON.stringify(settings));
  }

  // বর্তমান সাইন-ইন করা ইউজার (Get current logged in user)
  async getCurrentUser() {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) return null;

        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData) {
          const userProfile: UserProfile = {
            id: profileData.id,
            fullName: profileData.full_name,
            email: profileData.email,
            phone: profileData.phone || undefined,
            avatarUrl: profileData.avatar_url || undefined,
            education: profileData.education || undefined,
            experience: profileData.experience || undefined,
            skills: profileData.skills || [],
            socialLinks: profileData.social_links || undefined,
            createdAt: profileData.created_at || new Date().toISOString()
          };
          return userProfile;
        }
        return {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || 'User',
          skills: [],
          createdAt: session.user.created_at
        } as UserProfile;
      } catch (err: any) {
        console.error('Session fetch error:', err.message);
        return null;
      }
    }
    throw new Error('Supabase is not configured.');
  }

  // সাইন আপ (Sign Up)
  async signUp(email: string, password: string, fullName: string) {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (error) throw error;

        const user = data.user;
        if (user) {
          const userProfile: UserProfile = {
            id: user.id,
            fullName,
            email,
            skills: [],
            createdAt: user.created_at || new Date().toISOString()
          };

          const requiresVerification = data.session === null;
          return { data: { user: userProfile, emailVerificationRequired: requiresVerification }, error: null };
        }
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } };
      }
    }
    return { data: { user: null }, error: { message: 'Supabase is not configured.' } };
  }

  // লগইন (Login)
  async signIn(email: string, password?: string) {
    if (isRealSupabase && supabaseClient) {
      try {
        if (!password) {
           return { data: { user: null }, error: { message: 'Password is required' } };
        }
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
        if (authError) throw authError;

        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData) {
          return { data: { user: null }, error: { message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি (User profile not found)' } };
        }

        const userProfile: UserProfile = {
          id: profileData.id,
          fullName: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone || undefined,
          avatarUrl: profileData.avatar_url || undefined,
          education: profileData.education || undefined,
          experience: profileData.experience || undefined,
          skills: profileData.skills || [],
          socialLinks: profileData.social_links || undefined,
          createdAt: profileData.created_at || new Date().toISOString()
        };

        return { data: { user: userProfile }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } };
      }
    }
    return { data: { user: null }, error: { message: 'Supabase is not configured.' } };
  }

  // লগআউট (Logout)
  async signOut() {
    if (isRealSupabase && supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {}
    }
    localStorage.removeItem('skillproof_current_user_id');
    localStorage.removeItem('skillproof_current_user_object');
    return { error: null };
  }

  // ইমেইল দিয়ে রিসেট লিঙ্ক পাঠানো (Reset Password Email)
  async sendPasswordResetEmail(email: string) {
    if (isRealSupabase && supabaseClient) {
      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return { data: { sent: true }, error: null };
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    }
    return { error: { message: 'Supabase is not configured.' } };
  }

  // ওটিপি বা ইমেইল ভেরিফাই করা (Simulate OTP/Email Verification)
  async verifyOtp(email: string, code: string) {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data: authData, error: authError } = await supabaseClient.auth.verifyOtp({
          email,
          token: code,
          type: 'signup'
        });
        if (authError) throw authError;

        const user = authData.user;
        if (user) {
          const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          const userProfile: UserProfile = {
            id: user.id,
            fullName: profileData?.full_name || user.user_metadata?.full_name || 'User',
            email: user.email || '',
            phone: profileData?.phone || undefined,
            avatarUrl: profileData?.avatar_url || undefined,
            education: profileData?.education || undefined,
            experience: profileData?.experience || undefined,
            skills: profileData?.skills || [],
            socialLinks: profileData?.social_links || undefined,
            createdAt: profileData?.created_at || user.created_at
          };
          return { data: { user: userProfile }, error: null };
        }
        return { data: null, error: { message: 'Verification failed.' } };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    }
    return { data: null, error: { message: 'Supabase is not configured.' } };
  }
}

class SupabaseDatabaseSimulator {
  private getProfiles(): UserProfile[] {
    const data = localStorage.getItem('skillproof_profiles');
    return data ? JSON.parse(data) : [];
  }

  private saveProfiles(profiles: UserProfile[]): void {
    localStorage.setItem('skillproof_profiles', JSON.stringify(profiles));
  }

  private getSettings(): UserSettings[] {
    const data = localStorage.getItem('skillproof_settings');
    return data ? JSON.parse(data) : [];
  }

  private saveSettings(settings: UserSettings[]): void {
    localStorage.setItem('skillproof_settings', JSON.stringify(settings));
  }

  // প্রোফাইল এডিট করা (Update Profile)
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    if (isRealSupabase && supabaseClient) {
      try {
        const dbUpdates: any = {};
        if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.education !== undefined) dbUpdates.education = updates.education;
        if (updates.experience !== undefined) dbUpdates.experience = updates.experience;
        if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
        if (updates.socialLinks !== undefined) dbUpdates.social_links = updates.socialLinks;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

        const { data, error } = await supabaseClient
          .from('profiles')
          .update(dbUpdates)
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;

        const updatedProfile: UserProfile = {
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone || undefined,
          avatarUrl: data.avatar_url || undefined,
          education: data.education || undefined,
          experience: data.experience || undefined,
          skills: data.skills || [],
          socialLinks: data.social_links || undefined,
          createdAt: data.created_at || new Date().toISOString()
        };

        // Cache profile locally
        localStorage.setItem('skillproof_current_user_object', JSON.stringify(updatedProfile));

        return { data: updatedProfile, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    }
    return { data: null, error: { message: 'Supabase is not configured.' } };
  }

  // ইউজার সেটিংস এডিট করা (Update Settings)
  async getSettingsByUserId(userId: string): Promise<UserSettings> {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (data && !error) {
          return {
            userId: data.user_id,
            language: data.language,
            theme: data.theme,
            notificationsEnabled: data.notifications_enabled,
            marketingEmails: data.marketing_emails
          };
        }

        // Default insert if missing
        const defaultSettings: UserSettings = {
          userId,
          language: 'bn',
          theme: 'dark',
          notificationsEnabled: true,
          marketingEmails: false
        };

        await supabaseClient
          .from('user_settings')
          .upsert({
            user_id: userId,
            language: 'bn',
            theme: 'dark',
            notifications_enabled: true,
            marketing_emails: false
          });

        return defaultSettings;
      } catch (err) {
        console.error('Error fetching real settings:', err);
        throw err;
      }
    }
    throw new Error('Supabase is not configured.');
  }

  async updateSettings(userId: string, updates: Partial<UserSettings>) {
    if (isRealSupabase && supabaseClient) {
      try {
        const dbUpdates: any = {};
        if (updates.language !== undefined) dbUpdates.language = updates.language;
        if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
        if (updates.notificationsEnabled !== undefined) dbUpdates.notifications_enabled = updates.notificationsEnabled;
        if (updates.marketingEmails !== undefined) dbUpdates.marketing_emails = updates.marketingEmails;

        const { data, error } = await supabaseClient
          .from('user_settings')
          .update(dbUpdates)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;

        return {
          data: {
            userId: data.user_id,
            language: data.language,
            theme: data.theme,
            notificationsEnabled: data.notifications_enabled,
            marketingEmails: data.marketing_emails
          },
          error: null
        };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    }
    return { data: null, error: { message: 'Supabase is not configured.' } };
  }

  // প্রোফাইল পিকচার আপলোড ও ব্যবস্থাপনা (Profile Picture upload, replace and delete in Supabase Storage)
  async uploadProfilePicture(userId: string, file: File): Promise<{ success: boolean; url: string | null; error: string | null }> {
    const fileExt = file.name.split('.').pop();
    const cleanName = `${userId}_avatar_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${cleanName}`;

    if (isRealSupabase && supabaseClient) {
      try {
        let { error: uploadError } = await supabaseClient.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError && (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket') || uploadError.message?.includes('does not exist'))) {
          console.warn('⚠️ avatars bucket not found, attempting to create programmatically...');
          try {
            await supabaseClient.storage.createBucket('avatars', { public: true });
            const { error: retryError } = await supabaseClient.storage
              .from('avatars')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
              });
            uploadError = retryError;
          } catch (e) {}
        }

        if (uploadError) throw uploadError;

        const { data } = supabaseClient.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const publicUrl = data?.publicUrl || '';

        // প্রোফাইলে আপডেট করি
        await this.updateProfile(userId, { avatarUrl: publicUrl });

        return { success: true, url: publicUrl, error: null };
      } catch (err: any) {
        console.error('⚠️ Real Supabase avatar upload failed:', err);
        return { success: false, url: null, error: err.message };
      }
    }
    return { success: false, url: null, error: 'Supabase is not configured.' };
  }

  async deleteProfilePicture(userId: string): Promise<{ success: boolean; error: string | null }> {
    if (isRealSupabase && supabaseClient) {
      try {
        await this.updateProfile(userId, { avatarUrl: '' });
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Supabase is not configured.' };
  }

  // ডাটা মুছে ফেলা (Delete Account Simulation)
  async deleteAccount(userId: string) {
    if (isRealSupabase && supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        localStorage.removeItem('skillproof_current_user_id');
        localStorage.removeItem('skillproof_current_user_object');
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: { message: err.message } };
      }
    }
    return { success: false, error: { message: 'Supabase is not configured.' } };
  }
}

// সিঙ্গলটন ইনস্ট্যান্স তৈরি (Export simulated singletons)
export const mockAuth = new SupabaseAuthSimulator();
export const mockDb = new SupabaseDatabaseSimulator();

// লোকাল স্টোরেজ ডাটাবেজ ইনিশিয়ালাইজেশন (Initialize storage lists with empty arrays if not present)
const initializeMockData = () => {
  if (!localStorage.getItem('skillproof_profiles')) {
    localStorage.setItem('skillproof_profiles', JSON.stringify([]));
  }
  if (!localStorage.getItem('skillproof_settings')) {
    localStorage.setItem('skillproof_settings', JSON.stringify([]));
  }
};

initializeMockData();
