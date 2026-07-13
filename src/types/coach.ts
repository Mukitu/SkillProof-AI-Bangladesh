export interface CoachTask {
  id: string;
  title: string;
  description: string;
  category: 
    | 'Skill Improvement'
    | 'Interview Practice'
    | 'Resume Improvement'
    | 'Learning Resources'
    | 'Practical Exercises'
    | 'Communication Practice'
    | 'Portfolio Improvement'
    | 'Real-world Career Activities'
    | 'Job Preparation'
    | 'Productivity'
    | 'Career Development';
  status: 'pending' | 'started' | 'completed' | 'skipped' | 'continued_tomorrow';
  notes?: string;
  evidence?: string;
  xpAwarded: number;
  pointsAwarded: number;
  feedback?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CoachNotification {
  id: string;
  title: string;
  description: string;
  type: 'mission' | 'weekly' | 'monthly' | 'streak' | 'recommendation' | 'reminder';
  read: boolean;
  createdAt: string;
}

export interface CoachBadge {
  code: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  icon: string;
  unlockedAt: string;
}

export interface CoachData {
  userId: string;
  todayMission: string;
  todayMissionEn?: string;
  tasks: CoachTask[];
  weeklyGoal: string;
  weeklyGoalEn?: string;
  monthlyGoal: string;
  monthlyGoalEn?: string;
  xp: number;
  careerPoints: number;
  streak: number;
  weeklyStreak: number;
  monthlyStreak: number;
  level: number;
  badges: CoachBadge[];
  lastActiveDate?: string;
  lastGenerated?: string;
  notifications: CoachNotification[];
}
