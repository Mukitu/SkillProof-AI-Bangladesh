import { CoachData, CoachTask } from '../types/coach';

const MODEL_NAME = 'llama-3.3-70b-versatile';

export const coachGroq = {
  generateDailyPlan: async (
    profile: any,
    resumes: any[],
    interviews: any[],
    assessments: any[],
    savedJobs: string[],
    previousTasks: CoachTask[] = []
  ): Promise<{
    todayMission: string;
    todayMissionEn: string;
    tasks: Omit<CoachTask, 'status' | 'createdAt'>[];
    weeklyGoal: string;
    weeklyGoalEn: string;
    monthlyGoal: string;
    monthlyGoalEn: string;
  }> => {
    const resumeText = resumes && resumes.length > 0 ? JSON.stringify(resumes[0].personalInfo) + " " + JSON.stringify(resumes[0].skills) : "No resume uploaded yet";
    const lastInterview = interviews && interviews.length > 0 ? JSON.stringify(interviews[0]) : "No interviews taken yet";
    const assessmentResults = assessments && assessments.length > 0 ? JSON.stringify(assessments.slice(0, 3)) : "No assessments completed yet";

    const prompt = `You are the ultimate elite AI Daily Career Coach for Bangladeshi professionals and students.
Analyze the user's profile and real-world career data to construct a highly personalized daily mission, daily action tasks, a weekly goal, and a monthly goal.
EVERYTHING MUST BE DYNAMICALLY GENERATED. DO NOT USE GENERIC OR PLACEHOLDER CONTENT.

User Profile: ${JSON.stringify(profile)}
Resume Details: ${resumeText}
Recent AI Interview: ${lastInterview}
Practical Assessments: ${assessmentResults}
Saved Jobs: ${JSON.stringify(savedJobs)}
Previous Completed Tasks: ${JSON.stringify(previousTasks.filter(t => t.status === 'completed'))}

Your goal is to detect the user's specific profession (e.g. Software Engineer, Teacher, Doctor, Nurse, HR, Marketing, Accounts, Digital Marketer, Government Job Aspirant, Student, etc.) and current career level, and output a detailed plan tailored strictly to their industry.
You must construct 3 to 5 realistic daily tasks spanning different categories. 
Supported Categories: 'Skill Improvement', 'Interview Practice', 'Resume Improvement', 'Learning Resources', 'Practical Exercises', 'Communication Practice', 'Portfolio Improvement', 'Real-world Career Activities', 'Job Preparation', 'Productivity', 'Career Development'.

You MUST respond with a JSON object ONLY, formatted EXACTLY according to the schema below. Do not wrap the JSON in markdown code blocks, do not include any introductory or concluding text, and do not include any other markdown formatting.

Schema:
{
  "todayMission": "A precise, inspiring daily mission in beautiful, motivating Bangla text",
  "todayMissionEn": "The same daily mission in English",
  "weeklyGoal": "A comprehensive weekly goal in Bangla",
  "weeklyGoalEn": "The weekly goal in English",
  "monthlyGoal": "A long-term monthly goal in Bangla",
  "monthlyGoalEn": "The monthly goal in English",
  "tasks": [
    {
      "id": "unique-task-id-1",
      "title": "A direct, action-oriented task title in Bangla",
      "description": "Step-by-step description in Bangla of what the user needs to do, how to do it, and how to verify/provide evidence.",
      "category": "One of the supported categories listed above",
      "xpAwarded": number (50-150),
      "pointsAwarded": number (10-30)
    }
  ]
}`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.7,
          max_tokens: 2500
        })
      });

      if (!response.ok) throw new Error('AI Coach proxy request failed');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (content) {
        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(cleanJson);
      }
      throw new Error('Invalid response content from AI');
    } catch (err: any) {
      console.error('Groq Daily Plan Generation failed, falling back to emergency template:', err);
      // Fallback emergency dynamic generator matching user's declared profession
      const profession = profile?.experience || profile?.education || 'Software Engineering';
      return {
        todayMission: `${profession} ক্ষেত্রে আপনার দক্ষতা বাড়াতে আজকের বিশেষ মিশন!`,
        todayMissionEn: `Today's special mission to level up your expertise in ${profession}!`,
        weeklyGoal: `এই সপ্তাহে আপনার ${profession} রিলেটেড প্রজেক্ট বা পোর্টফোলিও আপডেট সম্পন্ন করা।`,
        weeklyGoalEn: `Complete portfolio and resume update related to ${profession} this week.`,
        monthlyGoal: `এই মাসে ন্যূনতম ৩টি এআই ইন্টারভিউ সম্পন্ন করে স্কিল পাসপোর্ট লেভেল বৃদ্ধি করুন।`,
        monthlyGoalEn: `Perform at least 3 AI Interviews this month and increase your Skill Passport level.`,
        tasks: [
          {
            id: 'emergency-task-1',
            title: 'স্কিল গ্যাপ বিশ্লেষণ ও স্টাডি',
            description: 'আপনার পছন্দসই টেকনিক্যাল টপিকটি নির্বাচন করে ৩০ মিনিট রিডিং ও নোটিং করুন।',
            category: 'Skill Improvement',
            xpAwarded: 80,
            pointsAwarded: 15
          },
          {
            id: 'emergency-task-2',
            title: 'রিজিউম ও লিংকডইন প্রোফাইল রিভিশন',
            description: 'আপনার বায়ো এবং কাজের ডেসক্রিপশনে অ্যাকশন ভার্ব যুক্ত করুন।',
            category: 'Resume Improvement',
            xpAwarded: 100,
            pointsAwarded: 20
          },
          {
            id: 'emergency-task-3',
            title: '১টি মক ইন্টারভিউ প্রশ্ন প্র্যাকটিস',
            description: 'ক্যামেরার সামনে ২ মিনিট কথা বলে উত্তর দেওয়ার জড়তা কাটান।',
            category: 'Interview Practice',
            xpAwarded: 120,
            pointsAwarded: 25
          }
        ]
      };
    }
  },

  generateTaskFeedback: async (
    task: CoachTask,
    notes: string,
    evidence: string
  ): Promise<{
    feedback: string;
    careerSuggestions: string;
    improvementTips: string;
    nextRecommendedTask: string;
    weakAreaAnalysis: string;
    motivationalInsights: string;
    xpBonus: number;
    pointsBonus: number;
  }> => {
    const prompt = `You are the ultimate elite AI Daily Career Coach.
The user has completed a career-building task and submitted evidence/notes.
Provide a detailed performance review, critique, and future coaching guide.

Task Details:
Title: ${task.title}
Description: ${task.description}
Category: ${task.category}

User Submitted Notes: ${notes || "No notes provided"}
User Submitted Evidence: ${evidence || "No file/link provided"}

Your feedback must be tailored, constructuve, high-quality, and completely written in Bengali.
Award a small XP and Point bonus based on the quality of their submission.

You MUST respond with a JSON object ONLY, formatted EXACTLY according to the schema below. Do not wrap the JSON in markdown code blocks, do not include any introductory or concluding text, and do not include any other markdown formatting.

Schema:
{
  "feedback": "Comprehensive and constructive feedback in Bengali on their performance and submission.",
  "careerSuggestions": "Key career suggestions in Bengali indicating how this task helps them in their industry.",
  "improvementTips": "3 concrete tips for further improvement in Bengali.",
  "nextRecommendedTask": "What specific topic or action they should focus on next in Bengali.",
  "weakAreaAnalysis": "An analysis in Bengali of any potential weak areas based on their completion.",
  "motivationalInsights": "An inspiring, highly encouraging motivational message in Bengali to push them forward.",
  "xpBonus": number (10-50),
  "pointsBonus": number (5-20)
}`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.6,
          max_tokens: 1500
        })
      });

      if (!response.ok) throw new Error('AI Feedback proxy request failed');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (content) {
        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(cleanJson);
      }
      throw new Error('Invalid response content from AI for feedback');
    } catch (err: any) {
      console.error('Groq Feedback Generation failed, falling back to backup response:', err);
      return {
        feedback: 'আপনার সাবমিশনটি আমরা পেয়েছি এবং এটি চমৎকারভাবে সম্পন্ন হয়েছে! আপনার প্রচেষ্টা সত্যিই প্রশংসনীয়।',
        careerSuggestions: 'এই ধরনের সক্রিয় কাজ আপনার ক্যারিয়ার গ্রোথ এবং জব মার্কেটে অন্যদের চেয়ে এগিয়ে থাকতে সাহায্য করবে।',
        improvementTips: '১. কাজে ধারাবাহিকতা বজায় রাখুন।\n২. রিজিউম বা পোর্টফোলিওতে এই কাজ যোগ করুন।\n৩. প্রতিদিন নতুন বিষয়ে জানার চেষ্টা করুন।',
        nextRecommendedTask: 'আপনার স্কিল পাসপোর্ট মডিউলে গিয়ে আরেকটি লাইভ অ্যাসেসমেন্ট সম্পন্ন করুন।',
        weakAreaAnalysis: 'কমিউনিকেশন ও প্রোজেক্ট ডকুমেন্টেশন এর দিকে একটু বেশি নজর দিলে আপনার কাজের গুণমান আরও বৃদ্ধি পাবে।',
        motivationalInsights: 'প্রতিদিনের ছোট ছোট পদক্ষেপই একদিন বড় সাফল্যে রূপ নেয়। আপনি সঠিক পথে এগিয়ে যাচ্ছেন, এগিয়ে চলুন!',
        xpBonus: 20,
        pointsBonus: 10
      };
    }
  }
};
