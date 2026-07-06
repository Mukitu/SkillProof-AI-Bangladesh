/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, UserSettings } from '../types';

// Supabase মক ক্লায়েন্ট ইমপ্লিমেন্টেশন (Mock Supabase Client Implementation)
// এটি লাইভ ডেমো এবং প্রিভিউ-তে ডাটাবেজ এবং অথেনটিকেশন সচল রাখার জন্য লোকালস্টোরেজ ব্যবহার করে।
// (Uses localStorage to simulate Supabase operations in the preview sandbox)

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
    
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === userId) || null;
  }

  // সাইন আপ (Sign Up)
  async signUp(email: string, password: string, fullName: string) {
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
      skills: ['React', 'JavaScript', 'Tailwind CSS'],
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

    return { data: { user: newProfile, emailVerificationRequired: true }, error: null };
  }

  // লগইন (Login)
  async signIn(email: string) {
    await new Promise(resolve => setTimeout(resolve, 600));
    const profiles = this.getProfiles();
    const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { data: { user: null }, error: { message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি (User not found)' } };
    }

    localStorage.setItem('skillproof_current_user_id', user.id);
    return { data: { user }, error: null };
  }

  // লগআউট (Logout)
  async signOut() {
    localStorage.removeItem('skillproof_current_user_id');
    return { error: null };
  }

  // ইমেইল দিয়ে রিসেট লিঙ্ক পাঠানো (Reset Password Email)
  async sendPasswordResetEmail(email: string) {
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
    await new Promise(resolve => setTimeout(resolve, 400));
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === userId);

    if (index === -1) {
      return { error: { message: 'প্রোফাইল পাওয়া যায়নি' } };
    }

    profiles[index] = { ...profiles[index], ...updates };
    this.saveProfiles(profiles);
    return { data: profiles[index], error: null };
  }

  // ইউজার সেটিংস এডিট করা (Update Settings)
  async getSettingsByUserId(userId: string): Promise<UserSettings> {
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

  // ডাটা মুছে ফেলা (Delete Account Simulation)
  async deleteAccount(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let profiles = this.getProfiles();
    profiles = profiles.filter(p => p.id !== userId);
    this.saveProfiles(profiles);

    let settings = this.getSettings();
    settings = settings.filter(s => s.userId !== userId);
    this.saveSettings(settings);

    localStorage.removeItem('skillproof_current_user_id');
    return { success: true, error: null };
  }
}

// সিঙ্গলটন ইনস্ট্যান্স তৈরি (Export simulated singletons)
export const mockAuth = new SupabaseAuthSimulator();
export const mockDb = new SupabaseDatabaseSimulator();

// মক ডাটা সিড করা (Seed Mock Data if empty)
const initializeMockData = () => {
  if (!localStorage.getItem('skillproof_profiles')) {
    const defaultProfile: UserProfile = {
      id: 'demo_user_id',
      fullName: 'আরিফুল ইসলাম (Ariful Islam)',
      email: 'nishat.af27@gmail.com',
      phone: '+8801712345678',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      education: 'B.Sc. in Computer Science & Engineering (DU)',
      experience: '২ বছরের ফুলস্ট্যাক ডেভেলপমেন্ট অভিজ্ঞতা (MERN Stack)',
      skills: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'TypeScript', 'Git'],
      socialLinks: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        portfolio: 'https://portfolio.me'
      },
      createdAt: new Date().toISOString()
    };

    const defaultSettings: UserSettings = {
      userId: 'demo_user_id',
      language: 'bn',
      theme: 'dark',
      notificationsEnabled: true,
      marketingEmails: false
    };

    localStorage.setItem('skillproof_profiles', JSON.stringify([defaultProfile]));
    localStorage.setItem('skillproof_settings', JSON.stringify([defaultSettings]));
  }
};

initializeMockData();
