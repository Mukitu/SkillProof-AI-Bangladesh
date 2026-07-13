export interface Job {
  id: string;
  companyName: string;
  companyLogo?: string;
  bannerImage?: string;
  jobTitle: string;
  jobCategory: string; // e.g. Software Engineering, IT, Design, Marketing, etc.
  jobType: string; // Full-time, Part-time, Contract, Internship, Remote
  location: string; // e.g. Dhaka, Bangladesh or Remote
  salary: string; // e.g. 50,000 - 80,000 BDT or Negotiable
  experience: string; // e.g. 1-3 years or Mid-Level
  education: string; // e.g. Bachelor's in CSE
  vacancy?: number;
  employmentStatus?: 'active' | 'closed' | 'expired';
  responsibilities: string; // Markdown or text
  requirements: string; // Markdown or text
  preferredSkills: string; // Comma-separated or bullet list
  benefits: string; // Markdown or text
  deadline: string; // YYYY-MM-DD
  officialApplyUrl: string; // The URL to click
  tags?: string[]; // Tag array
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
  publishStatus: 'Published' | 'Draft' | 'Archived';
  featuredJob: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  createdAt: string;
}

export interface AiMatchReport {
  matchPercentage: number;
  matchingSkills: string[];
  missingSkills: string[];
  resumeReadiness: string; // text feedback
  aiRecommendation: string; // text feedback
  careerRoadmapSuggestion: string; // text feedback
}
