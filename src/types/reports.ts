/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// রিপোর্ট টাইপসমূহ (Report Types)
export type ReportType = 'resume' | 'interview' | 'passport' | 'growth' | 'improvement' | 'roadmap' | 'overall_career';

// এক্সপোর্ট ফরম্যাট (Export Formats)
export type ExportFormat = 'pdf' | 'print' | 'png_card' | 'qr_card' | 'share_link' | 'json' | 'csv';

// এআই রিপোর্ট ডেটা ইন্টারফেস (AI Report Data Interfaces)
export interface ResumeReportData {
  resumeId: string;
  fileName: string;
  resumeScore: number;
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
  profileCompletion: number;
  generatedDate: string;
}

export interface InterviewReportData {
  sessionId: string;
  jobTitle: string;
  overallScore: number;
  technical: number;
  communication: number;
  confidence: number;
  problemSolving: number;
  english: number;
  questionsCount: number;
  answerSummary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  generatedDate: string;
}

export interface SkillPassportReportData {
  passportId: string;
  skills: { name: string; level: string; score: number }[];
  historyCount: number;
  readinessScore: number;
  verificationUrl: string;
  generatedDate: string;
}

export interface CareerGrowthReportData {
  goalTitle: string;
  weeklyGoal: string;
  growthTimeline: { date: string; event: string; score: number }[];
  improvedSkills: string[];
  weakSkills: string[];
  achievements: { title: string; date: string }[];
  roadmapSummary: string;
  generatedDate: string;
}

export interface InterviewImprovementReportData {
  previousSessionId: string;
  currentSessionId: string;
  previousDate: string;
  currentDate: string;
  previousScore: number;
  currentScore: number;
  improvementPercentage: number;
  skillComparison: { name: string; prev: number; current: number }[];
  confidenceComparison: { prev: number; current: number };
  communicationComparison: { prev: number; current: number };
  aiSuggestions: string[];
  generatedDate: string;
}

export interface RoadmapReportData {
  roadmapId: string;
  targetCareer: string;
  phases: {
    name: string;
    description: string;
    status: 'completed' | 'in_progress' | 'pending';
    skills: string[];
    resources?: string[];
  }[];
  completedPhases: number;
  pendingPhases: number;
  completionPercentage: number;
  nextPhase: string;
  estimatedCompletion: string;
  generatedDate: string;
}

export interface OverallCareerReportData {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  readinessScore: number;
  missingSkills: string[];
  priorityLearningAreas: string[];
  suggestedNextSteps: string[];
  recommendedCertifications: string[];
  recommendedPortfolioProjects: string[];
  recommendedInterviewPrep: string[];
  generatedDate: string;
}

// মূল রিপোর্ট মডেল (Main Report Model)
export interface AiReport {
  id: string;
  userId: string;
  type: ReportType;
  titleBn: string;
  titleEn: string;
  createdAt: string;
  data: ResumeReportData | InterviewReportData | SkillPassportReportData | CareerGrowthReportData | InterviewImprovementReportData | RoadmapReportData | OverallCareerReportData;
}

// ডাউনলোড ইতিহাস মডেল (Download History Model)
export interface DownloadHistory {
  id: string;
  userId: string;
  fileName: string;
  type: string; // 'PDF' | 'Print' | 'PNG' | 'QR' | 'Link'
  downloadDate: string;
  status: 'Completed' | 'Pending' | 'Failed';
}
