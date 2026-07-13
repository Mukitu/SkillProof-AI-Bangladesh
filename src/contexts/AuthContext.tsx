/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserSettings } from '../types';
import { supabaseClient } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  settings: UserSettings | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error: string | null }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; verificationRequired: boolean; error: string | null }>;
  logout: () => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<{ success: boolean; error: string | null }>;
  sendResetEmail: (email: string) => Promise<{ success: boolean; error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<{ success: boolean; error: string | null }>;
  deleteAccount: () => Promise<{ success: boolean; error: string | null }>;
  uploadProfilePicture: (file: File) => Promise<{ success: boolean; url: string | null; error: string | null }>;
  deleteProfilePicture: () => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch full user profile from DB
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
         if (error.code === 'PGRST116') {
             // Create one if it does not exist
             const newProfile = {
                 id: userId,
                 created_at: new Date().toISOString(),
                 updated_at: new Date().toISOString()
             };
             await supabaseClient.from('profiles').insert([newProfile]);
             return { id: userId, email: '', fullName: '', skills: [], createdAt: new Date().toISOString() } as UserProfile;
         }
         console.error('Error fetching profile:', error);
         return null;
      }

      if (data) {
        return {
          id: data.id,
          fullName: data.full_name || data.fullName || '',
          email: data.email || '',
          phone: data.phone || undefined,
          avatarUrl: data.avatar_url || data.avatarUrl || undefined,
          education: data.education || undefined,
          experience: data.experience || undefined,
          skills: data.skills || [],
          socialLinks: data.social_links || undefined,
          address: data.address || undefined,
          university: data.university || undefined,
          department: data.department || undefined,
          semester: data.semester || undefined,
          linkedin: data.linkedin || undefined,
          github: data.github || undefined,
          portfolio: data.portfolio || undefined,
          bio: data.bio || undefined,
          username: data.username || undefined,
          dob: data.dob || data.date_of_birth || undefined,
          gender: data.gender || undefined,
          country: data.country || undefined,
          city: data.city || undefined,
          createdAt: data.created_at || new Date().toISOString(),
          premium: data.premium || false,
          premiumExpiry: data.premium_expiry || undefined,
          role: data.role || 'user',
        } as UserProfile;
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
    }
    return null;
  };

  const fetchUserSettings = async (userId: string) => {
     try {
         const { data, error } = await supabaseClient.from('user_settings').select('*').eq('user_id', userId).single();
         if (error) {
             if (error.code === 'PGRST116') {
                 // Create default settings
                 const defaultSettings = { user_id: userId, language: 'bn', theme: 'dark', notifications_enabled: true, marketing_emails: false };
                 await supabaseClient.from('user_settings').insert([defaultSettings]);
                 return { userId, language: 'bn', theme: 'dark', notificationsEnabled: true, marketingEmails: false } as UserSettings;
             }
             return null;
         }
         if (data) {
             return {
                 userId: data.user_id,
                 language: data.language,
                 theme: data.theme,
                 notificationsEnabled: data.notifications_enabled,
                 marketingEmails: data.marketing_emails
             } as UserSettings;
         }
     } catch(err) {
         console.error("fetchUserSettings error:", err);
     }
     return null;
  }

  // অটো লগইন লোড করা (Auto load session on mount)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
           const profile = await fetchUserProfile(session.user.id);
           if (profile) {
              if(!profile.email && session.user.email) {
                 profile.email = session.user.email;
              }
              setUser(profile);
              const userSettings = await fetchUserSettings(session.user.id);
              if (userSettings) setSettings(userSettings);
           }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
           const profile = await fetchUserProfile(session.user.id);
           if (profile) {
              if(!profile.email && session.user.email) {
                 profile.email = session.user.email;
              }
              setUser(profile);
              const userSettings = await fetchUserSettings(session.user.id);
              if (userSettings) setSettings(userSettings);
           }
        } else {
           setUser(null);
           setSettings(null);
        }
    });

    return () => {
        subscription.unsubscribe();
    }
  }, []);

  // লগইন হ্যান্ডলার (Login handler)
  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      if(!password) {
          // If no password, we could implement magic link or throw error
          setLoading(false);
          return { success: false, error: 'Password is required' };
      }
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      
      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }
      
      setLoading(false);
      return { success: true, error: null };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }
  };

  // সাইনআপ হ্যান্ডলার (Signup handler)
  const signup = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
        const { data, error } = await supabaseClient.auth.signUp({ 
            email, 
            password,
            options: {
                data: { full_name: fullName }
            }
        });
        
        if (error) {
          setLoading(false);
          return { success: false, verificationRequired: false, error: error.message };
        }

        if (data?.user) {
            // Automatically create user profile row
            const profileRow = {
              id: data.user.id,
              full_name: fullName,
              email: email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            await supabaseClient.from('profiles').upsert(profileRow, { onConflict: 'id' });
            
            // Create default settings row
            const settingsRow = {
              user_id: data.user.id,
              language: 'bn',
              theme: 'dark',
              notifications_enabled: true,
              marketing_emails: false,
              updated_at: new Date().toISOString()
            };
            
            await supabaseClient.from('user_settings').upsert(settingsRow, { onConflict: 'user_id' });
        }

        setLoading(false);
        return { 
          success: true, 
          verificationRequired: !!data?.user?.identities && data.user.identities.length === 0, 
          error: null 
        };
    } catch(err: any) {
        setLoading(false);
        return { success: false, verificationRequired: false, error: err.message };
    }
  };

  // লগআউট হ্যান্ডলার (Logout handler)
  const logout = async () => {
    setLoading(true);
    await supabaseClient.auth.signOut();
    setUser(null);
    setSettings(null);
    setLoading(false);
  };

  // OTP ভেরিফিকেশন (Verify OTP)
  const verifyOtp = async (email: string, code: string) => {
    try {
        const { error } = await supabaseClient.auth.verifyOtp({ email, token: code, type: 'signup' });
        if(error) return { success: false, error: error.message };
        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
  };

  // পাসওয়ার্ড রিসেট ইমেইল (Password reset)
  const sendResetEmail = async (email: string) => {
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        if(error) return { success: false, error: error.message };
        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
  };

  // প্রোফাইল আপডেট (Update profile)
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { success: false, error: 'No active session' };
    try {
        const dbUpdates: any = { updated_at: new Date().toISOString() };
        if(updates.fullName) dbUpdates.full_name = updates.fullName;
        if(updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if(updates.bio !== undefined) dbUpdates.bio = updates.bio;
        if(updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
        
        // Handling JSON fields for legacy compat if needed
        if(updates.socialLinks) dbUpdates.social_links = updates.socialLinks;
        
        const { error } = await supabaseClient.from('profiles').update(dbUpdates).eq('id', user.id);
        
        if (error) return { success: false, error: error.message };
        
        setUser({ ...user, ...updates });
        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
  };

  // সেটিংস আপডেট (Update settings)
  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return { success: false, error: 'No active session' };
    try {
        const dbUpdates: any = { updated_at: new Date().toISOString() };
        if(updates.language !== undefined) dbUpdates.language = updates.language;
        if(updates.theme !== undefined) dbUpdates.theme = updates.theme;
        if(updates.notificationsEnabled !== undefined) dbUpdates.notifications_enabled = updates.notificationsEnabled;
        if(updates.marketingEmails !== undefined) dbUpdates.marketing_emails = updates.marketingEmails;
        
        const { error } = await supabaseClient.from('user_settings').update(dbUpdates).eq('user_id', user.id);
        if (error) return { success: false, error: error.message };
        
        setSettings({ ...settings, ...updates });
        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
  };

  // অ্যাকাউন্ট মুছে ফেলা (Delete account)
  const deleteAccount = async () => {
    if (!user) return { success: false, error: 'No active session' };
    try {
        const { error } = await supabaseClient.rpc('delete_user');
        if (error) {
            // fallback to function or just delete from profile if API allows
            await supabaseClient.from('profiles').delete().eq('id', user.id);
            await supabaseClient.auth.admin.deleteUser(user.id);
        }
        await logout();
        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
  };

  // প্রোফাইল পিকচার আপলোড (Upload profile picture)
  const uploadProfilePicture = async (file: File) => {
    if (!user) return { success: false, url: null, error: 'No active session' };
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, file);
        if (uploadError) return { success: false, url: null, error: uploadError.message };
        
        const { data } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
        if(data && data.publicUrl) {
            await updateProfile({ avatarUrl: data.publicUrl });
            return { success: true, url: data.publicUrl, error: null };
        }
        return { success: false, url: null, error: 'Failed to get public URL' };
    } catch (err: any) {
        return { success: false, url: null, error: err.message };
    }
  };

  // প্রোফাইল পিকচার মুছে ফেলা (Delete profile picture)
  const deleteProfilePicture = async () => {
    if (!user) return { success: false, error: 'No active session' };
    try {
        if(user.avatarUrl) {
           const pathMatch = user.avatarUrl.match(/avatars\/(.+)$/);
           if(pathMatch) {
               await supabaseClient.storage.from('avatars').remove([pathMatch[1]]);
           }
        }
        await updateProfile({ avatarUrl: '' });
        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        loading,
        login,
        signup,
        logout,
        verifyOtp,
        sendResetEmail,
        updateProfile,
        updateSettings,
        deleteAccount,
        uploadProfilePicture,
        deleteProfilePicture,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

