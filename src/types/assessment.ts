export type AssessmentType = 'practical' | 'project';
export type AssessmentStatus = 'ongoing' | 'completed' | 'failed';
export type AssessmentDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface PracticalQuestion {
  question: string;
  problemStatement: string;
  requirements: string[];
  expectedOutput: string;
  constraints: string[];
  hints?: string[];
  difficulty: AssessmentDifficulty;
  estimatedTime: string;
  initialCode?: string;
  language: string;
}

export interface ProjectChallenge {
  title: string;
  description: string;
  requirements: string[];
  features: string[];
  difficulty: AssessmentDifficulty;
  expectedSkills: string[];
  estimatedDuration: string;
  deadline?: string;
  evaluationCriteria: string[];
}

export interface AssessmentFeedback {
  strongPoints: string[];
  weakPoints: string[];
  codeReview: string;
  performanceSuggestions: string[];
  securitySuggestions: string[];
  bestPractices: string[];
  industryStandardTips: string[];
  alternativeSolution: string;
  learningResources: string[];
  nextRecommendation: string;
  improvementPlan: string;
}

export interface AssessmentScore {
  projectScore?: number;
  architectureScore?: number;
  logicScore?: number;
  uiScore?: number;
  backendScore?: number;
  databaseScore?: number;
  codeQualityScore?: number;
  securityScore?: number;
  performanceScore?: number;
  overallScore: number;
}

export interface AssessmentRecord {
  id: string;
  userId: string;
  type: AssessmentType;
  skill: string;
  difficulty: AssessmentDifficulty;
  title: string;
  status: AssessmentStatus;
  duration: string; // Timer selection (e.g. "2 Hours", "6 Hours") or actual completion duration
  createdAt: string;
  completedAt?: string;
  trustScore: number; // Plagiarism/compliance score out of 100
  
  // Data for the challenge/question
  questionData: PracticalQuestion | null;
  projectData: ProjectChallenge | null;
  
  // Submission data
  userSolutionCode?: string; // Mode 1
  submittedZipName?: string; // Mode 2
  submittedGithubUrl?: string; // Mode 2
  submittedDemoUrl?: string; // Mode 2
  submittedDocumentation?: string; // Mode 2
  
  // Score & Feedback
  scores: AssessmentScore | null;
  feedback: AssessmentFeedback | null;
}
