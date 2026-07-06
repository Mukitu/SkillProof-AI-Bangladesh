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
