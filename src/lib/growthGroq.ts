/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Groq from 'groq-sdk';
import { LearningPlan, DailyTask, LearningRoadmapItem } from '../types/growth';

// গ্রক এপিআই কী রিড করা (Retrieve Groq API key)
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';

let groqClient: Groq | null = null;
let isRealGroq = false;

if (groqApiKey && groqApiKey !== 'YOUR_GROQ_API_KEY') {
  try {
    groqClient = new Groq({
      apiKey: groqApiKey,
      dangerouslyAllowBrowser: true
    });
    isRealGroq = true;
    console.log('✅ Groq AI Career Growth Service Initialized.');
  } catch (err) {
    console.error('❌ Groq growth initialization failed:', err);
  }
}

const MODEL_NAME = 'llama-3.3-70b-versatile';

/**
 * কাস্টম টেকনিক্যাল টপিক ও দুর্বলতার ওপর ভিত্তি করে জেনারেটর হেল্পার (Generator helper based on Career Path & Weak Skills)
 */
export const growthGroq = {
  isConfigured: () => isRealGroq,

  // ১. পার্সোনালাইজড ক্যারিয়ার রোডম্যাপ তৈরি (Generate personalized learning roadmap using Groq)
  generateRoadmap: async (careerPath: string, weakSkills: string[]): Promise<{
    roadmap7Days: LearningRoadmapItem;
    roadmap30Days: LearningRoadmapItem;
    roadmap90Days: LearningRoadmapItem;
  }> => {
    const weakSkillsStr = weakSkills.length > 0 ? weakSkills.join(', ') : 'Software Engineering fundamentals';
    
    const prompt = `You are an elite Tech Career Coach & Architect.
Analyze the candidate's career path: "${careerPath}" and their assessed weak skills: [${weakSkillsStr}].
Generate a highly personalized 3-stage Career Growth Roadmap (7 Days crash program, 30 Days focused program, 90 Days comprehensive mastery).
Each of the 3 stages MUST focus directly on overcoming their weak skills and aligning with the career path.

You MUST respond with a JSON object ONLY, formatted EXACTLY according to the schema below. Do not wrap the JSON in markdown code blocks (\`\`\`json), do not include any introductory or concluding text, and do not include any other markdown formatting.

Schema:
{
  "roadmap7Days": {
    "topics": ["At least 3 specific weak-skill topics to cover in week 1"],
    "practiceTasks": ["At least 2 concrete coding or theory exercises for week 1"],
    "miniProjects": ["1 very quick mini project (e.g. Simple Hooks Counter, SQLite wrapper)"],
    "learningObjectives": ["What they should understand by day 7"],
    "expectedResults": ["Tangible result of completing week 1"]
  },
  "roadmap30Days": {
    "topics": ["At least 4 advanced concepts related to these weak skills"],
    "practiceTasks": ["At least 3 practical application tasks"],
    "miniProjects": ["1 medium size project (e.g. Dashboard with state management, CRUD Server)"],
    "learningObjectives": ["What they should master by day 30"],
    "expectedResults": ["Tangible portfolio additions by day 30"]
  },
  "roadmap90Days": {
    "topics": ["At least 5 deep-dive architectural or system design topics involving these skills"],
    "practiceTasks": ["At least 3 challenging challenges or optimizations"],
    "miniProjects": ["1 large scale enterprise-grade project description"],
    "learningObjectives": ["Long-term professional milestones"],
    "expectedResults": ["Ultimate industry-readiness standard achieved"]
  }
}`;

    if (isRealGroq && groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.3,
          max_tokens: 1800,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          let cleanJson = content.trim();
          if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
          }
          const res = JSON.parse(cleanJson);
          if (res.roadmap7Days && res.roadmap30Days && res.roadmap90Days) {
            return res;
          }
        }
        throw new Error('Invalid JSON format from AI');
      } catch (err: any) {
        console.error('Groq roadmap generation failed:', err);
        throw new Error('Failed to generate learning roadmap using AI: ' + err.message);
      }
    }
    throw new Error('Groq API Key is not configured. Please add VITE_GROQ_API_KEY in the environment.');
  },

  // ২. ডেইলি প্র্যাকটিস সেশন জেনারেট করা (Generate Daily practice tasks based on weaknesses)
  generateDailyTasks: async (careerPath: string, weakSkills: string[]): Promise<{
    codingTask: { title: string; description: string; codeTemplate?: string };
    communicationPractice: { prompt: string; description: string };
    interviewQuestion: { question: string; idealAnswerOutline: string };
    miniAssignment: { title: string; description: string };
  }> => {
    const weakSkillsStr = weakSkills.length > 0 ? weakSkills.join(', ') : 'Technical Problem Solving';

    const prompt = `You are an elite AI technical instructor.
Given the candidate's career path: "${careerPath}" and their weak skills: [${weakSkillsStr}].
Generate a single day's focused micro-learning task set.

You MUST return ONLY a JSON object with this exact schema (no markdown formatting, no comments, no other text):
{
  "codingTask": {
    "title": "Short title of coding challenge",
    "description": "Clear step-by-step programming exercise that addresses a weak skill.",
    "codeTemplate": "Optional starter code block or function signature as string"
  },
  "communicationPractice": {
    "prompt": "Interactive prompt (e.g. 'Explain how you would handle an API state error to a client')",
    "description": "Guidelines on how to voice-practice or write down the response."
  },
  "interviewQuestion": {
    "question": "A tough conceptual technical question related to their weak skills.",
    "idealAnswerOutline": "Brief bulleted outline of what a perfect answer must cover."
  },
  "miniAssignment": {
    "title": "A small hands-on task",
    "description": "A 15-minute quick assignment like setting up a repository, reviewing an official doc page, or running a command."
  }
}`;

    if (isRealGroq && groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.4,
          max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          let cleanJson = content.trim();
          if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
          }
          const res = JSON.parse(cleanJson);
          if (res.codingTask && res.communicationPractice && res.interviewQuestion && res.miniAssignment) {
            return res;
          }
        }
        throw new Error('Invalid JSON format from AI');
      } catch (err: any) {
        console.error('Groq daily task generation failed:', err);
        throw new Error('Failed to generate daily tasks using AI: ' + err.message);
      }
    }
    throw new Error('Groq API Key is not configured. Please add VITE_GROQ_API_KEY in the environment.');
  }
};


