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

        let { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData) {
          console.warn('⚠️ User profile is missing, creating a new one on-the-fly...');
          const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
          
          const newProfile = {
            id: session.user.id,
            full_name: fallbackName,
            email: session.user.email || '',
            skills: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: insertError } = await supabaseClient
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' });

          if (insertError) {
            console.error('❌ Failed to auto-create profile row:', insertError.message);
          }

          // Fetch again to verify
          const { data: verifiedData } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          profileData = verifiedData || newProfile;
        }

        if (profileData) {
          const userProfile: UserProfile = {
            id: profileData.id,
            fullName: profileData.full_name || profileData.fullName || '',
            email: profileData.email || '',
            phone: profileData.phone || undefined,
            avatarUrl: profileData.avatar_url || profileData.avatarUrl || undefined,
            education: profileData.education || undefined,
            experience: profileData.experience || undefined,
            skills: profileData.skills || [],
            socialLinks: profileData.social_links || undefined,
            address: profileData.address || profileData.social_links?.address || profileData.social_links?.location || undefined,
            university: profileData.university || profileData.social_links?.university || undefined,
            department: profileData.department || profileData.social_links?.department || undefined,
            semester: profileData.semester || profileData.social_links?.semester || undefined,
            linkedin: profileData.linkedin || profileData.social_links?.linkedin || undefined,
            github: profileData.github || profileData.social_links?.github || undefined,
            portfolio: profileData.portfolio || profileData.social_links?.portfolio || undefined,
            bio: profileData.bio || profileData.social_links?.bio || undefined,
            // New fields unpacked from social_links fallback
            username: profileData.username || profileData.social_links?.username || undefined,
            dob: profileData.dob || profileData.date_of_birth || profileData.social_links?.dob || profileData.social_links?.date_of_birth || undefined,
            gender: profileData.gender || profileData.social_links?.gender || undefined,
            country: profileData.country || profileData.social_links?.country || undefined,
            city: profileData.city || profileData.social_links?.city || undefined,
            createdAt: profileData.created_at || new Date().toISOString()
          };
          
          // Debug check for avatar persistence
          if (userProfile.avatarUrl) {
            console.log('✅ Loaded avatar URL from profile:', userProfile.avatarUrl.substring(0, 30) + '...');
          }
          
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

        let { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData) {
          console.warn('⚠️ Profile missing during sign in, auto-creating now...');
          const fallbackName = authData.user.user_metadata?.full_name || email.split('@')[0] || 'User';
          
          const newProfile = {
            id: authData.user.id,
            full_name: fallbackName,
            email: email,
            skills: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: insertError } = await supabaseClient
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' });

          if (insertError) {
            console.error('❌ Failed to auto-create profile row on sign in:', insertError.message);
          }

          // Fetch again to verify
          const { data: verifiedData } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          profileData = verifiedData || newProfile;
        }

        const userProfile: UserProfile = {
          id: profileData.id,
          fullName: profileData.full_name || profileData.fullName || '',
          email: profileData.email || '',
          phone: profileData.phone || undefined,
          avatarUrl: profileData.avatar_url || undefined,
          education: profileData.education || undefined,
          experience: profileData.experience || undefined,
          skills: profileData.skills || [],
          socialLinks: profileData.social_links || undefined,
          address: profileData.address || profileData.social_links?.address || undefined,
          university: profileData.university || profileData.social_links?.university || undefined,
          department: profileData.department || profileData.social_links?.department || undefined,
          semester: profileData.semester || profileData.social_links?.semester || undefined,
          linkedin: profileData.linkedin || profileData.social_links?.linkedin || undefined,
          github: profileData.github || profileData.social_links?.github || undefined,
          portfolio: profileData.portfolio || profileData.social_links?.portfolio || undefined,
          bio: profileData.bio || profileData.social_links?.bio || undefined,
          username: profileData.username || profileData.social_links?.username || undefined,
          dob: profileData.dob || profileData.date_of_birth || profileData.social_links?.dob || profileData.social_links?.date_of_birth || undefined,
          gender: profileData.gender || profileData.social_links?.gender || undefined,
          country: profileData.country || profileData.social_links?.country || undefined,
          city: profileData.city || profileData.social_links?.city || undefined,
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
            address: profileData?.address || profileData?.social_links?.address || undefined,
            university: profileData?.university || profileData?.social_links?.university || undefined,
            department: profileData?.department || profileData?.social_links?.department || undefined,
            semester: profileData?.semester || profileData?.social_links?.semester || undefined,
            linkedin: profileData?.linkedin || profileData?.social_links?.linkedin || undefined,
            github: profileData?.github || profileData?.social_links?.github || undefined,
            portfolio: profileData?.portfolio || profileData?.social_links?.portfolio || undefined,
            bio: profileData?.bio || profileData?.social_links?.bio || undefined,
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
        const dbUpdates: any = {
          updated_at: new Date().toISOString()
        };
        
        // Map camelCase to snake_case for Supabase columns that actually exist
        if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.education !== undefined) dbUpdates.education = updates.education;
        if (updates.experience !== undefined) dbUpdates.experience = updates.experience;
        if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
        if (updates.university !== undefined) dbUpdates.university = updates.university;
        if (updates.department !== undefined) dbUpdates.department = updates.department;
        if (updates.semester !== undefined) dbUpdates.semester = updates.semester;
        if (updates.linkedin !== undefined) dbUpdates.linkedin = updates.linkedin;
        if (updates.github !== undefined) dbUpdates.github = updates.github;
        if (updates.portfolio !== undefined) dbUpdates.portfolio = updates.portfolio;
        if (updates.bio !== undefined) dbUpdates.bio = updates.bio;

        // Fetch current profile to get current social_links and avoid overwriting existing properties
        const { data: currentProfile } = await supabaseClient
          .from('profiles')
          .select('email, full_name, social_links')
          .eq('id', userId)
          .maybeSingle();

        const currentSocial = currentProfile?.social_links || {};
        
        // If profile doesn't exist, we must provide email for the upsert
        if (!currentProfile) {
          const { data: authData } = await supabaseClient.auth.getUser();
          dbUpdates.email = authData.user?.email || updates.email || '';
        } else if (currentProfile.email) {
          dbUpdates.email = currentProfile.email;
        } else if (updates.email) {
          dbUpdates.email = updates.email;
        }
        
        // Ensure full_name is present to satisfy NOT NULL constraints
        if (dbUpdates.full_name === undefined) {
          if (currentProfile && currentProfile.full_name) {
            dbUpdates.full_name = currentProfile.full_name;
          } else {
            dbUpdates.full_name = updates.fullName || 'User';
          }
        }

        // Merge existing social links with updates, supporting all 17 fields
        dbUpdates.social_links = {
          ...currentSocial,
          github: updates.github !== undefined ? updates.github : currentSocial.github || '',
          linkedin: updates.linkedin !== undefined ? updates.linkedin : currentSocial.linkedin || '',
          portfolio: updates.portfolio !== undefined ? updates.portfolio : currentSocial.portfolio || '',
          address: updates.address !== undefined ? updates.address : currentSocial.address || '',
          university: updates.university !== undefined ? updates.university : currentSocial.university || '',
          department: updates.department !== undefined ? updates.department : currentSocial.department || '',
          semester: updates.semester !== undefined ? updates.semester : currentSocial.semester || '',
          bio: updates.bio !== undefined ? updates.bio : currentSocial.bio || '',
          username: updates.username !== undefined ? updates.username : currentSocial.username || '',
          dob: updates.dob !== undefined ? updates.dob : currentSocial.dob || '',
          gender: updates.gender !== undefined ? updates.gender : currentSocial.gender || '',
          country: updates.country !== undefined ? updates.country : currentSocial.country || '',
          city: updates.city !== undefined ? updates.city : currentSocial.city || ''
        };

        const { data, error } = await supabaseClient
          .from('profiles')
          .upsert({
            id: userId,
            ...dbUpdates
          })
          .select()
          .single();

        if (error) throw error;

        const updatedProfile: UserProfile = {
          id: data.id,
          fullName: data.full_name || data.fullName,
          email: data.email,
          phone: data.phone || undefined,
          avatarUrl: data.avatar_url || data.avatarUrl || undefined,
          education: data.education || undefined,
          experience: data.experience || undefined,
          skills: data.skills || [],
          socialLinks: data.social_links || undefined,
          address: data.social_links?.address || undefined,
          university: data.university || data.social_links?.university || undefined,
          department: data.department || data.social_links?.department || undefined,
          semester: data.semester || data.social_links?.semester || undefined,
          linkedin: data.linkedin || data.social_links?.linkedin || undefined,
          github: data.github || data.social_links?.github || undefined,
          portfolio: data.portfolio || data.social_links?.portfolio || undefined,
          bio: data.bio || data.social_links?.bio || undefined,
          // Unpack new fields from social_links fallback
          username: data.social_links?.username || undefined,
          dob: data.social_links?.dob || undefined,
          gender: data.social_links?.gender || undefined,
          country: data.social_links?.country || undefined,
          city: data.social_links?.city || undefined,
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
        // ১. বাকেটটি আছে কিনা চেক করি বা সরাসরি আপলোড করি
        let { error: uploadError } = await supabaseClient.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        // যদি বাকেট না পাওয়া যায় বা পারমিশন না থাকে
        if (uploadError && (
          uploadError.message?.includes('not found') || 
          uploadError.message?.includes('Bucket') || 
          uploadError.message?.includes('does not exist') ||
          uploadError.message?.includes('violates row-level security policy') ||
          (uploadError as any).status === 404
        )) {
          console.warn('⚠️ avatars bucket issue, falling back to Base64 storage...');
          
          // Fallback: Convert to Base64 and store directly in the profile
          const base64: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          // প্রোফাইলে আপডেট করি (Save Base64 to profile as fallback)
          const { error: updateErr } = await this.updateProfile(userId, { avatarUrl: base64 });
          if (updateErr) throw new Error(updateErr.message);
          
          return { success: true, url: base64, error: null };
        }

        if (uploadError) throw uploadError;

        const { data } = supabaseClient.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const publicUrl = data?.publicUrl || '';

        // প্রোফাইলে আপডেট করি
        const { error: updateErr2 } = await this.updateProfile(userId, { avatarUrl: publicUrl });
        if (updateErr2) throw new Error(updateErr2.message);

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
