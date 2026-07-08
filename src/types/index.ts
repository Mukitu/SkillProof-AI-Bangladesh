/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ভাষা ও থিম সমর্থনকারী টাইপসমূহ (Language and Theme supporting types)
export type Language = 'bn' | 'en';
export type Theme = 'light' | 'dark';

// ইউজার প্রোফাইল ইন্টারফেস (User Profile Interface)
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  education?: string;
  experience?: string;
  skills: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    address?: string;
    university?: string;
    department?: string;
    semester?: string;
    bio?: string;
    username?: string;
    dob?: string;
    gender?: string;
    country?: string;
    city?: string;
  };
  address?: string;
  university?: string;
  department?: string;
  semester?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  bio?: string;
  username?: string;
  dob?: string;
  gender?: string;
  country?: string;
  city?: string;
  createdAt: string;
}

// ইউজার সেটিংস ইন্টারফেস (User Settings Interface)
export interface UserSettings {
  userId: string;
  language: Language;
  theme: Theme;
  notificationsEnabled: boolean;
  marketingEmails: boolean;
}

// সিভি ফাইল ট্র্যাকিং ইন্টারফেস (CV Files tracking interface)
export interface CVFile {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: 'processing' | 'verified' | 'failed';
  score?: number;
}

// ইন্টারভিউ মডেল (Interview Model)
export interface Interview {
  id: string;
  userId: string;
  title: string;
  category: string;
  status: 'pending' | 'completed' | 'in_progress';
  score?: number;
  createdAt: string;
  completedAt?: string;
}

// স্কিল ব্যাজ বা পাসপোর্ট মডেল (Skill Badge or Passport Model)
export interface SkillBadge {
  id: string;
  userId: string;
  skillName: string;
  level: 'beginner' | 'intermediate' | 'expert';
  verifiedAt: string;
  credentialUrl: string;
}

// রোডম্যাপ মডেল (Roadmap Model)
export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  targetRole: string;
  steps: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }[];
  createdAt: string;
}

// নোটিফিকেশন ইন্টারফেস (Notification Interface)
export interface Notification {
  id: string;
  titleBn: string;
  titleEn: string;
  messageBn: string;
  messageEn: string;
  read: boolean;
  createdAt: string;
  type: 'info' | 'success' | 'warning' | 'badge';
}

// ==========================================
// FEATURE 1: AI SMART CV BUILDER TYPES
// ==========================================

export interface PersonalInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  linkedin: string;
  github: string;
  portfolio: string;
  photoUrl?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
  isCurrent: boolean;
  improvedDescription?: string; // AI improve comparison before/after
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  techStack: string;
  github?: string;
  liveLink?: string;
  improvedDescription?: string; // AI improve comparison
}

export interface CvSkills {
  softSkills: string[];
  technicalSkills: string[];
  languages: string[];
  certificates: string[];
}

export type ResumeTemplateId = 'modern' | 'minimal' | 'corporate' | 'creative' | 'ats_friendly' | 'harshibar' | 'puneet_gautam' | 'curve';

export interface AiScores {
  atsScore: number;
  resumeQualityScore: number;
  skillScore: number;
  professionalismScore: number;
  communicationScore: number;
}

export interface AiFeedback {
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  grammarProblems: string[];
  formattingIssues: string[];
  atsIssues: string[];
  careerSuggestions: string[];
}

export interface CvData {
  id: string;
  userId: string;
  personalInfo: PersonalInfo;
  careerSummary: string;
  improvedCareerSummary?: string; // AI improve comparison
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: CvSkills;
  templateId: ResumeTemplateId;
  createdAt: string;
  updatedAt: string;
  
  // AI analysis result (if uploaded or analyzed)
  scores?: AiScores;
  feedback?: AiFeedback;
  
  // Extracted data metadata (for tracking)
  isAnalyzed?: boolean;
}

export interface CvImprovementHistory {
  id: string;
  cvId: string;
  section: 'summary' | 'experience' | 'project' | 'skills';
  sectionItemId?: string; // for lists like specific experience item
  beforeText: string;
  afterText: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// ==========================================
// FEATURE 2: AI LIVE INTERVIEW ENGINE TYPES
// ==========================================

export interface InterviewQA {
  id: string;
  question: string;
  answer?: string;
  transcript?: string;
  scores?: {
    technical: number;
    confidence: number;
    communication: number;
    problemSolving: number;
    professionalism: number;
    english: number;
  };
  feedback?: string;
  timestamp: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  cvId: string;
  careerPath: string;
  skills: string[];
  status: 'in_progress' | 'completed';
  scores?: {
    overall: number;
    technical: number;
    confidence: number;
    communication: number;
    problemSolving: number;
    professionalism: number;
    english: number;
  };
  feedback?: {
    strengths: string[];
    weaknesses: string[];
    mistakes: string[];
    suggestions: string[];
  };
  duration: number; // seconds
  createdAt: string;
  completedAt?: string;
  qa: InterviewQA[];
}

export interface InterviewMemory {
  id: string;
  userId: string;
  weakTopics: string[];
  strongTopics: string[];
  previousQuestions: string[];
  previousMistakes: string[];
  improvementHistory: {
    sessionId: string;
    date: string;
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
  }[];
  learningSuggestions: string[];
  readinessExplanation: string;
  readinessScore: number;
  studyPlan: {
    todayGoal: string;
    weekGoal: string;
    nextInterviewGoal: string;
    practiceTasks: string[];
    miniProjects: string[];
    practiceQuestions: string[];
  };
  metrics: {
    mostImprovedSkill: string;
    mostDifficultSkill: string;
    mostRepeatedMistake: string;
    fastestGrowingSkill: string;
    currentWeakAreas: string[];
    currentStrongAreas: string[];
  };
  aiInsights: string[];
  lastUpdated: string;
}


