/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SkillPassport {
  id: string; // Passport ID (e.g. SPAI-2026-001548)
  userId: string;
  fullName: string;
  avatarUrl?: string;
  careerPath: string;
  readinessScore: number;
  level: 'Beginner' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Expert';
  verificationStatus: 'Verified' | 'Pending' | 'Unverified';
  resumeScore?: number;
  atsScore?: number;
  interviewScore?: number;
  summary?: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PassportSkill {
  id: string; // Verification ID (e.g. VERIFY-RCT-009842)
  passportId: string;
  userId: string;
  skillName: string;
  score: number;
  level: 'Beginner' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Expert';
  lastAssessmentDate: string;
  progress: number; // percentage change (e.g. +8)
  confidence: number; // confidence rating (0-100)
  verificationStatus: 'Verified' | 'Assessed';
}

export interface PassportHistoryItem {
  id: string;
  passportId: string;
  userId: string;
  interviewId: string;
  interviewTitle: string;
  score: number;
  improvement: string; // e.g. "+5% higher" or "Base Score"
  level: 'Beginner' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Expert';
  date: string;
  summary: string; // dynamic explanation
}

export interface VerificationRecord {
  id: string; // Verification ID (e.g. VERIFY-RCT-009842)
  passportId: string;
  userId: string;
  skillName: string;
  score: number;
  assessmentDate: string;
  verificationStatus: 'Verified' | 'Assessed';
  summary: string;
  ownerName: string;
}

export interface PublicProfile {
  passportId: string;
  fullName: string;
  avatarUrl?: string;
  careerPath: string;
  readinessScore: number;
  level: 'Beginner' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Expert';
  skills: PassportSkill[];
  history: PassportHistoryItem[];
  verificationStatus: 'Verified' | 'Pending';
  updatedAt: string;
}
