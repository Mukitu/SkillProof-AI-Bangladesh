export interface CareerProgress {
  id: string;
  userId: string;
  careerScore: number;
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  achievements: Achievement[];
  aiInsights: {
    strengths: string[];
    weaknesses: string[];
    prioritySkills: string[];
    careerAdvice: string;
    nextBestAction: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'cv' | 'interview' | 'passport' | 'roadmap' | 'report' | 'achievement';
  title: string;
  description: string;
  date: string;
}
