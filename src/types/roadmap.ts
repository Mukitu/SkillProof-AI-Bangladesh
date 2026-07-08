// src/types/roadmap.ts
export interface CareerRoadmapData {
    id: string;
    userId: string;
    targetCareer: string;
    phases: RoadmapPhase[];
    dailyTasks: RoadmapDailyTasks;
    lastGenerated: string;
    createdAt: string;
    updatedAt: string;
}

export interface RoadmapPhase {
    id: string;
    phaseName: '7 Days' | '30 Days' | '60 Days' | '90 Days' | '180 Days' | '1 Year';
    goal: string;
    topics: string[];
    skillsToLearn: string[];
    technologies: string[];
    completionPercentage: number;
    miniProjects: RoadmapProject[];
    portfolioProject: RoadmapProject;
    practiceTasks: string[];
    interviewPreparation: string[];
    freeLearningResources: RoadmapResource[];
    estimatedTime: string;
    difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface RoadmapProject {
    projectName: string;
    description: string;
    requiredSkills: string[];
    estimatedTime: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    expectedOutcome: string;
}

export interface RoadmapResource {
    title: string;
    url?: string;
    type: 'Official Documentation' | 'freeCodeCamp' | 'MDN' | 'Google Developers' | 'Microsoft Learn' | 'Coursera Free' | 'edX Free' | 'YouTube Tutorials' | 'GitHub Repositories' | 'Other';
    reason: string;
}

export interface RoadmapDailyTasks {
    today: RoadmapTask[];
    tomorrow: RoadmapTask[];
    weeklyGoal: RoadmapTask[];
    monthlyGoal: RoadmapTask[];
}

export interface RoadmapTask {
    id: string;
    text: string;
    completed: boolean;
}