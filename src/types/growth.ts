/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CareerGrowth {
  id: string;
  userId: string;
  careerPath: string;
  readinessScore: number;
  level: string;
  mostImprovedSkill: string;
  weakestSkill: string;
  overallProgress: number; // percentage (e.g. 15 for +15% progress)
  createdAt: string;
  updatedAt: string;
}

export interface LearningRoadmapItem {
  dayRange?: '7_days' | '30_days' | '90_days';
  topics: string[];
  practiceTasks: string[];
  miniProjects: string[];
  learningObjectives: string[];
  expectedResults: string[];
}

export interface LearningPlan {
  id: string;
  userId: string;
  careerPath: string;
  weakSkills: string[];
  roadmap7Days: LearningRoadmapItem;
  roadmap30Days: LearningRoadmapItem;
  roadmap90Days: LearningRoadmapItem;
  createdAt: string;
  updatedAt: string;
}

export interface DailyTask {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  codingTask: {
    title: string;
    description: string;
    codeTemplate?: string;
    completed: boolean;
  };
  communicationPractice: {
    prompt: string;
    description: string;
    completed: boolean;
  };
  interviewQuestion: {
    question: string;
    idealAnswerOutline: string;
    completed: boolean;
  };
  miniAssignment: {
    title: string;
    description: string;
    completed: boolean;
  };
  createdAt: string;
}

export interface WeeklyGoal {
  id: string;
  userId: string;
  goalTitle: string;
  completedPercentage: number;
  remainingTasks: string[];
  completedTasks: string[];
  estimatedCompletion: string; // e.g. "2 days remaining" or "Completed"
  createdAt: string;
  updatedAt: string;
}

export interface GrowthAchievement {
  id: string;
  userId: string;
  code: 'first_interview' | 'five_interviews' | 'score_90' | 'comm_improved' | 'gold_level' | 'weekly_goal_completed';
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  unlocked: boolean;
  unlockedAt?: string;
  badgeIcon: string; // Lucide icon string representation
}

export interface GrowthHistoryLog {
  id: string;
  userId: string;
  date: string;
  eventName: string;
  changeDescription: string;
  metricType: 'score' | 'skill' | 'level' | 'goal' | 'achievement';
  oldValue: string;
  newValue: string;
}

export interface LearningResource {
  id: string;
  skillName: string;
  youtubeUrl: string;
  officialDocUrl: string;
  githubRepoUrl: string;
  freeCourseUrl: string;
  blogUrl: string;
  practiceWebsiteUrl: string;
}

export interface CareerProgressData {
    id: string;
    userId: string;
    overallScore: number;
    resumeScore: number;
    atsScore: number;
    interviewScore: number;
    skillScore: number;
    profileCompletion: number;
    strengths: StrengthItem[];
    weaknesses: WeaknessItem[];
    jobReadiness: 'Not Ready' | 'Beginner' | 'Intermediate' | 'Job Ready' | 'Highly Competitive';
    readinessReason: string;
    aiSuggestions: AISuggestions;
    learningResources: AILearningResource[];
    projectRecommendations: ProjectRecommendation[];
    careerPaths: CareerPathSuggestion[];
    actionPlan: ActionPlan;
    lastGenerated: string;
    createdAt: string;
    updatedAt: string;
}

export interface StrengthItem {
    name: string;
    category: 'Technical' | 'Soft Skill' | 'Communication' | 'Leadership' | 'Problem Solving';
    confidence: number;
}

export interface WeaknessItem {
    name: string;
    category: 'Missing Skill' | 'Technical' | 'Soft Skill' | 'Resume' | 'Interview';
    priority: 'High' | 'Medium' | 'Low';
}

export interface AISuggestions {
    shortTerm: string[];
    longTerm: string[];
    resume: string[];
    interview: string[];
    portfolio: string[];
    linkedin: string[];
    github: string[];
}

export interface AILearningResource {
    title: string;
    url?: string;
    type: string;
    reason: string;
}

export interface ProjectRecommendation {
    title: string;
    description: string;
    requiredSkills: string[];
    estimatedTime: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface CareerPathSuggestion {
    title: string;
    matchReason: string;
    missingSkills: string[];
    expectedLearningTime: string;
}

export interface ActionPlan {
    today: TaskItem[];
    thisWeek: TaskItem[];
    thisMonth: TaskItem[];
    priorityChecklist: TaskItem[];
}

export interface TaskItem {
    id: string;
    text: string;
    completed: boolean;
}
