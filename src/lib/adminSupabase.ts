import { supabaseClient } from './supabase';
export const adminDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});

export interface AuditLog { id: string; adminName: string; action: string; target: string; ipAddress: string; browser: string; timestamp: string; }
export interface Announcement { id: string; title: string; content?: string; type: string; active?: boolean; createdAt?: string; }
export interface SystemConfig { groqSettings?: any; appName: string; maintenanceMode: boolean; allowRegistration: boolean; defaultRole: string; requireEmailVerification: boolean; maxUploadSizeMB: number; aiModel: string; theme: string; primaryColor: string; }
export interface Testimonial { name?: string; role?: string; image_url?: string; comment?: string; id: string; userName?: string; userRole?: string; content?: string; rating: number; active?: boolean; createdAt?: string; avatarUrl?: string; }
export interface Statistic { labelEn?: string; color?: string; id: string; label: string; value: string; icon?: string; order?: number; active?: boolean; }
