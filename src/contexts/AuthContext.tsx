/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserSettings } from '../types';
import { mockAuth, mockDb } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  settings: UserSettings | null;
  loading: boolean;
  login: (email: string) => Promise<{ success: boolean; error: string | null }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; verificationRequired: boolean; error: string | null }>;
  logout: () => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<{ success: boolean; error: string | null }>;
  sendResetEmail: (email: string) => Promise<{ success: boolean; error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<{ success: boolean; error: string | null }>;
  deleteAccount: () => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // অটো লগইন লোড করা (Auto load session on mount)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = mockAuth.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const userSettings = await mockDb.getSettingsByUserId(currentUser.id);
          setSettings(userSettings);
        }
      } catch (err) {
        console.error('অথেনটিকেশন ইনিশিয়ালাইজেশন ত্রুটি:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // লগইন হ্যান্ডলার (Login handler)
  const login = async (email: string) => {
    setLoading(true);
    const { data, error } = await mockAuth.signIn(email);
    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
    if (data.user) {
      setUser(data.user);
      const userSettings = await mockDb.getSettingsByUserId(data.user.id);
      setSettings(userSettings);
    }
    setLoading(false);
    return { success: true, error: null };
  };

  // সাইনআপ হ্যান্ডলার (Signup handler)
  const signup = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    const { data, error } = await mockAuth.signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      return { success: false, verificationRequired: false, error: error.message };
    }
    return { 
      success: true, 
      verificationRequired: !!data?.emailVerificationRequired, 
      error: null 
    };
  };

  // লগআউট হ্যান্ডলার (Logout handler)
  const logout = async () => {
    setLoading(true);
    await mockAuth.signOut();
    setUser(null);
    setSettings(null);
    setLoading(false);
  };

  // ওটিপি ভেরিফাই (Verify OTP)
  const verifyOtp = async (email: string, code: string) => {
    setLoading(true);
    const { data, error } = await mockAuth.verifyOtp(email, code);
    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
    if (data?.user) {
      setUser(data.user);
      const userSettings = await mockDb.getSettingsByUserId(data.user.id);
      setSettings(userSettings);
    }
    setLoading(false);
    return { success: true, error: null };
  };

  // পাসওয়ার্ড রিসেট ইমেইল (Password reset)
  const sendResetEmail = async (email: string) => {
    const { error } = await mockAuth.sendPasswordResetEmail(email);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  };

  // প্রোফাইল তথ্য আপডেট (Update Profile)
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { success: false, error: 'ইউজার লগইন করা নেই' };
    
    const { data, error } = await mockDb.updateProfile(user.id, updates);
    if (error) {
      return { success: false, error: error.message };
    }
    if (data) {
      setUser(data);
    }
    return { success: true, error: null };
  };

  // সেটিংস আপডেট (Update Settings)
  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return { success: false, error: 'ইউজার লগইন করা নেই' };

    const { data, error } = await mockDb.updateSettings(user.id, updates);
    if (error) {
      return { success: false, error: error.message };
    }
    if (data) {
      setSettings(data);
    }
    return { success: true, error: null };
  };

  // অ্যাকাউন্ট মুছে ফেলা (Delete Account)
  const deleteAccount = async () => {
    if (!user) return { success: false, error: 'ইউজার লগইন করা নেই' };
    
    const { error } = await mockDb.deleteAccount(user.id);
    if (error) {
      return { success: false, error: error.message };
    }
    setUser(null);
    setSettings(null);
    return { success: true, error: null };
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
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
