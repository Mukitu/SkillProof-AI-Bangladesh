/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, UserSettings } from '../types';

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
  getCurrentUser() {
    const userId = localStorage.getItem('skillproof_current_user_id');
    if (!userId) return null;

    const cachedUser = localStorage.getItem('skillproof_current_user_object');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (e) {}
    }
    
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === userId) || null;
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
          // ১. প্রোফাইল টেবিলে তথ্য সংরক্ষণ করা (Automatically create user profile row)
          const profileRow = {
            id: user.id,
            full_name: fullName,
            email: email,
            skills: [],
            created_at: new Date().toISOString()
          };

          const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert(profileRow);

          if (profileError) {
            console.error('Error inserting profiles table in signup:', profileError);
          }

          // ২. সেটিংস টেবিলে ডিফল্ট তথ্য সংরক্ষণ করা (Create default settings row)
          const settingsRow = {
            user_id: user.id,
            language: 'bn',
            theme: 'dark',
            notifications_enabled: true,
            marketing_emails: false,
            updated_at: new Date().toISOString()
          };

          const { error: settingsError } = await supabaseClient
            .from('user_settings')
            .upsert(settingsRow);

          if (settingsError) {
            console.error('Error inserting settings table in signup:', settingsError);
          }

          const userProfile: UserProfile = {
            id: user.id,
            fullName,
            email,
            skills: [],
            createdAt: user.created_at || new Date().toISOString()
          };

          // Cache profile locally
          localStorage.setItem('skillproof_current_user_id', user.id);
          localStorage.setItem('skillproof_current_user_object', JSON.stringify(userProfile));

          const requiresVerification = data.session === null;
          return { data: { user: userProfile, emailVerificationRequired: requiresVerification }, error: null };
        }
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } };
      }
    }

    // --- Sandbox Mode fallback ---
    await new Promise(resolve => setTimeout(resolve, 800)); // সিমুলেটেড ডিলে (Network Delay)
    
    const profiles = this.getProfiles();
    if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
      return { data: { user: null }, error: { message: 'এই ইমেলটি ইতিমধ্যে নিবন্ধিত হয়েছে (Email already registered)' } };
    }

    const newId = 'user_' + Math.random().toString(36).substr(2, 9);
    const newProfile: UserProfile = {
      id: newId,
      fullName,
      email,
      skills: [],
      createdAt: new Date().toISOString()
    };

    profiles.push(newProfile);
    this.saveProfiles(profiles);

    // ডিফল্ট সেটিংস (Default settings)
    const settings = this.getSettings();
    const defaultSettings: UserSettings = {
      userId: newId,
      language: 'bn',
      theme: 'dark',
      notificationsEnabled: true,
      marketingEmails: false
    };
    settings.push(defaultSettings);
    this.saveSettings(settings);

    // সরাসরি ইমেইল ভেরিফিকেশনের জন্য ওটিপি স্টোরেজে রাখি (Simulate OTP)
    localStorage.setItem(`skillproof_otp_${email}`, '123456');

    // Cache user object locally
    localStorage.setItem('skillproof_current_user_id', newId);
    localStorage.setItem('skillproof_current_user_object', JSON.stringify(newProfile));

    return { data: { user: newProfile, emailVerificationRequired: true }, error: null };
  }

  // লগইন (Login)
  async signIn(email: string) {
    if (isRealSupabase && supabaseClient) {
      try {
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData) {
          return { data: { user: null }, error: { message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি (User not found)' } };
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

        // Cache user object locally
        localStorage.setItem('skillproof_current_user_id', userProfile.id);
        localStorage.setItem('skillproof_current_user_object', JSON.stringify(userProfile));

        return { data: { user: userProfile }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } };
      }
    }

    // --- Sandbox Mode fallback ---
    await new Promise(resolve => setTimeout(resolve, 600));
    const profiles = this.getProfiles();
    const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { data: { user: null }, error: { message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি (User not found)' } };
    }

    localStorage.setItem('skillproof_current_user_id', user.id);
    localStorage.setItem('skillproof_current_user_object', JSON.stringify(user));
    return { data: { user }, error: null };
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

    await new Promise(resolve => setTimeout(resolve, 500));
    const profiles = this.getProfiles();
    const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { error: { message: 'এই ইমেলটি সিস্টেমে নিবন্ধিত নেই (Email is not registered)' } };
    }
    return { data: { sent: true }, error: null };
  }

  // ওটিপি বা ইমেইল ভেরিফাই করা (Simulate OTP/Email Verification)
  async verifyOtp(email: string, code: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const expected = localStorage.getItem(`skillproof_otp_${email}`) || '123456';
    
    if (code === expected) {
      const profiles = this.getProfiles();
      const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (user) {
        localStorage.setItem('skillproof_current_user_id', user.id);
        localStorage.setItem('skillproof_current_user_object', JSON.stringify(user));
        return { data: { user }, error: null };
      }
    }
    return { data: null, error: { message: 'ভুল ওটিপি কোড! অনুগ্রহ করে আবার চেষ্টা করুন (Invalid OTP code!)' } };
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

    // --- Sandbox Mode fallback ---
    await new Promise(resolve => setTimeout(resolve, 400));
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === userId);

    if (index === -1) {
      return { error: { message: 'প্রোফাইল পাওয়া যায়নি' } };
    }

    profiles[index] = { ...profiles[index], ...updates };
    this.saveProfiles(profiles);
    localStorage.setItem('skillproof_current_user_object', JSON.stringify(profiles[index]));
    return { data: profiles[index], error: null };
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
      }
    }

    // --- Sandbox Mode fallback ---
    const settings = this.getSettings();
    const userSetting = settings.find(s => s.userId === userId);
    
    if (userSetting) return userSetting;

    // ডিফল্ট সেটিংস যদি না থাকে (Default settings if missing)
    const newSettings: UserSettings = {
      userId,
      language: 'bn',
      theme: 'dark',
      notificationsEnabled: true,
      marketingEmails: false
    };
    settings.push(newSettings);
    this.saveSettings(settings);
    return newSettings;
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

    // --- Sandbox Mode fallback ---
    await new Promise(resolve => setTimeout(resolve, 300));
    const settings = this.getSettings();
    const index = settings.findIndex(s => s.userId === userId);

    if (index === -1) {
      const newSettings = {
        userId,
        language: 'bn' as const,
        theme: 'dark' as const,
        notificationsEnabled: true,
        marketingEmails: false,
        ...updates
      };
      settings.push(newSettings);
      this.saveSettings(settings);
      return { data: newSettings, error: null };
    }

    settings[index] = { ...settings[index], ...updates };
    this.saveSettings(settings);
    return { data: settings[index], error: null };
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
        console.warn('⚠️ Real Supabase avatar upload failed:', err);
        return { success: false, url: null, error: err.message };
      }
    }

    // Sandbox mode: base64 simulated upload
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result as string;
        await this.updateProfile(userId, { avatarUrl: base64Url });
        resolve({ success: true, url: base64Url, error: null });
      };
      reader.readAsDataURL(file);
    });
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

    await this.updateProfile(userId, { avatarUrl: '' });
    return { success: true, error: null };
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

    // --- Sandbox Mode fallback ---
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let profiles = this.getProfiles();
    profiles = profiles.filter(p => p.id !== userId);
    this.saveProfiles(profiles);

    let settings = this.getSettings();
    settings = settings.filter(s => s.userId !== userId);
    this.saveSettings(settings);

    localStorage.removeItem('skillproof_current_user_id');
    localStorage.removeItem('skillproof_current_user_object');
    return { success: true, error: null };
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
