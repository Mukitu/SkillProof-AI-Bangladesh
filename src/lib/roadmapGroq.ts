// src/lib/roadmapGroq.ts
import { CareerRoadmapData } from '../types/roadmap';

const MODEL_NAME = 'llama-3.3-70b-versatile';

export const roadmapGroq = {
  // ইউজারের ডেটাবেস ও গ্রক এআই ব্যবহার করে নতুন রোডম্যাপ জেনারেট করা
  generateRoadmap: async (
    targetCareer: string,
    profile: any,
    resume: any,
    interviews: any[],
    skills: any[]
  ): Promise<Partial<CareerRoadmapData>> => {
    
    const prompt = `You are an elite Tech Career Coach & Architect.
Analyze the user's data and generate a comprehensive Career Roadmap for the target career: "${targetCareer}".
If the target career is empty, auto-recommend the best fit based on the resume and skills.
User Profile: ${JSON.stringify(profile)}
Resume Analysis: ${JSON.stringify(resume)}
Interview History: ${JSON.stringify(interviews)}
Skill Passport: ${JSON.stringify(skills)}

You MUST respond with a JSON object ONLY, formatted EXACTLY according to the schema below. Do not wrap the JSON in markdown code blocks (\`\`\`json), do not include any introductory or concluding text, and do not include any other markdown formatting.

Schema:
{
  "targetCareer": string (The selected or recommended career path),
  "phases": [
    {
      "id": "phase-7d",
      "phaseName": "7 Days",
      "goal": string,
      "topics": [string],
      "skillsToLearn": [string],
      "technologies": [string],
      "completionPercentage": number (default 0),
      "miniProjects": [
        { "projectName": string, "description": string, "requiredSkills": [string], "estimatedTime": string, "difficulty": "Beginner" | "Intermediate" | "Advanced", "expectedOutcome": string }
      ],
      "portfolioProject": { "projectName": string, "description": string, "requiredSkills": [string], "estimatedTime": string, "difficulty": "Beginner" | "Intermediate" | "Advanced", "expectedOutcome": string },
      "practiceTasks": [string],
      "interviewPreparation": [string],
      "freeLearningResources": [
        { "title": string, "url": string, "type": "Official Documentation" | "freeCodeCamp" | "MDN" | "Google Developers" | "Microsoft Learn" | "Coursera Free" | "edX Free" | "YouTube Tutorials" | "GitHub Repositories" | "Other", "reason": string }
      ],
      "estimatedTime": string,
      "difficultyLevel": "Beginner" | "Intermediate" | "Advanced"
    },
    // MUST INCLUDE identical objects for "30 Days", "60 Days", "90 Days", "180 Days", "1 Year"
    // So 6 phases in total.
    { "id": "phase-30d", "phaseName": "30 Days", ... },
    { "id": "phase-60d", "phaseName": "60 Days", ... },
    { "id": "phase-90d", "phaseName": "90 Days", ... },
    { "id": "phase-180d", "phaseName": "180 Days", ... },
    { "id": "phase-1y", "phaseName": "1 Year", ... }
  ],
  "dailyTasks": {
    "today": [{ "id": "task-t-1", "text": string, "completed": false }],
    "tomorrow": [{ "id": "task-tm-1", "text": string, "completed": false }],
    "weeklyGoal": [{ "id": "task-w-1", "text": string, "completed": false }],
    "monthlyGoal": [{ "id": "task-m-1", "text": string, "completed": false }]
  }
}`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.2,
          max_tokens: 4500
        })
      });
      
      if (!response.ok) throw new Error('AI Proxy request failed');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(cleanJson);
      }
      throw new Error('Invalid JSON format from AI');
    } catch (err: any) {
      console.error('Groq roadmap generation failed:', err);
      throw new Error('Failed to generate roadmap using AI: ' + err.message);
    }
  }
};