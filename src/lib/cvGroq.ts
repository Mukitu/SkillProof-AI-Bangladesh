/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Groq from 'groq-sdk';
import { CvData, AiScores, AiFeedback, PersonalInfo, EducationItem, ExperienceItem, ProjectItem, CvSkills } from '../types';

// গ্রক এপিআই কী রিড করা (Retrieve Groq API key)
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';

let groqClient: Groq | null = null;
let isRealGroq = false;

if (groqApiKey && groqApiKey !== 'YOUR_GROQ_API_KEY') {
  try {
    // ব্রাউজারে ব্যবহারের জন্য dangerouslyAllowBrowser সচল করা হয়েছে
    groqClient = new Groq({
      apiKey: groqApiKey,
      dangerouslyAllowBrowser: true
    });
    isRealGroq = true;
    console.log('✅ Groq AI Service Initialized Successfully.');
  } catch (err) {
    console.error('❌ Groq initialization failed:', err);
  }
} else {
  console.warn('⚠️ Groq API Key is missing. Running in simulated offline AI mode.');
}

// গ্রক মডেল নির্ধারণ (Groq Llama-3.1 model)
const MODEL_NAME = 'llama-3.1-70b-versatile';

export const cvGroq = {
  isConfigured: () => isRealGroq,

  // ১. ক্যারিয়ার সামারি জেনারেট করা (Generate Professional Career Summary)
  generateCareerSummary: async (profile: {
    name: string;
    skills: string[];
    education?: string;
    experience?: string;
  }): Promise<string> => {
    const prompt = `You are an expert resume writer and ATS optimizer.
Generate a highly professional, compelling, and action-oriented 3-4 sentence Career Summary for a professional with the following details:
- Name: ${profile.name}
- Key Skills: ${profile.skills.join(', ')}
- Academic Background: ${profile.education || 'Not specified'}
- Work/Project Experience: ${profile.experience || 'Not specified'}

The summary must focus on impact, specific achievements, and professional value. Respond ONLY with the raw text of the summary. Do not include any intro, quotes, or markdown wrappers. Write it in English.`;

    if (isRealGroq && groqClient) {
      try {
        const chatCompletion = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.7,
          max_tokens: 250,
        });
        const content = chatCompletion.choices[0]?.message?.content;
        if (content) return content.trim();
      } catch (err) {
        console.error('Groq AI Assist summary failed:', err);
        throw err;
      }
    }
    throw new Error('Groq API Key is not configured. Please add VITE_GROQ_API_KEY in the environment.');
  },

  // ২. ডেসক্রিপশন ইম্প্রুভ করা (Improve Work/Project Description)
  improveDescription: async (text: string, sectionContext: string): Promise<string> => {
    const prompt = `You are a resume enhancement specialist.
Rewrite the following description from a ${sectionContext} section to sound significantly more professional, accomplishment-driven, and optimized for ATS keywords.
Use strong action verbs (e.g., Spearheaded, Engineered, Optimized, Delivered) and focus on business value or impact.
Keep it concise (1-3 lines or bullet points).

Original text:
"${text}"

Respond ONLY with the rewritten text. Do not write intro, explanation, or markdown formatting. Output in English.`;

    if (isRealGroq && groqClient) {
      try {
        const chatCompletion = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.6,
          max_tokens: 300,
        });
        const content = chatCompletion.choices[0]?.message?.content;
        if (content) return content.trim();
      } catch (err) {
        console.error('Groq AI Improve description failed:', err);
        throw err;
      }
    }
    throw new Error('Groq API Key is not configured. Please add VITE_GROQ_API_KEY in the environment.');
  },

  // ৩. আপলোড করা সিভি ফাইল এনালাইসিস করা (Analyze & Extract CV File Content)
  analyzeUploadedCV: async (
    fileName: string,
    fileText: string
  ): Promise<{
    scores: AiScores;
    feedback: AiFeedback;
    extractedData: Partial<CvData>;
  }> => {
    const prompt = `You are an advanced AI Resume Screener and CV Intelligence agent.
Analyze the following text extracted from a resume file named "${fileName}".
You must perform three tasks:
1. Extract the structured resume details (Name, Education, Skills, Work Experience, Projects, etc.).
2. Evaluate and generate precise professional scores (ATS Score, Quality Score, etc. out of 100).
3. Generate detailed, actionable professional feedback (Strengths, Weaknesses, Grammar, formatting, missing skills).

Extracted Text:
"""
${fileText || 'No text extracted, analyze based on filename and typical tech profiles.'}
"""

You MUST respond with a single, valid JSON object containing exactly the following keys (do not wrap in markdown tags like \`\`\`json, just output raw JSON):
{
  "extractedData": {
    "personalInfo": {
      "name": "string (extract or deduce name)",
      "phone": "string (extract phone)",
      "email": "string (extract email)",
      "address": "string",
      "linkedin": "string",
      "github": "string",
      "portfolio": "string"
    },
    "careerSummary": "string (1 paragraph career summary)",
    "education": [
      { "id": "edu1", "degree": "string", "institution": "string", "year": "string", "gpa": "string" }
    ],
    "experience": [
      { "id": "exp1", "company": "string", "role": "string", "duration": "string", "description": "string", "isCurrent": false }
    ],
    "projects": [
      { "id": "proj1", "title": "string", "description": "string", "techStack": "string", "github": "string", "liveLink": "string" }
    ],
    "skills": {
      "softSkills": ["string"],
      "technicalSkills": ["string"],
      "languages": ["string"],
      "certificates": ["string"]
    }
  },
  "scores": {
    "atsScore": number (30-100),
    "resumeQualityScore": number (30-100),
    "skillScore": number (30-100),
    "professionalismScore": number (30-100),
    "communicationScore": number (30-100)
  },
  "feedback": {
    "strengths": ["string (3 specific strengths)"],
    "weaknesses": ["string (3 specific weaknesses)"],
    "missingSkills": ["string (specific skills needed for current market)"],
    "grammarProblems": ["string (grammar warnings or 'None found')"],
    "formattingIssues": ["string (formatting suggestions)"],
    "atsIssues": ["string (ATS parsability warnings)"],
    "careerSuggestions": ["string (career recommendations)"]
  }
}

Ensure all lists are populated with real, helpful data based on the CV.`;

    if (isRealGroq && groqClient) {
      try {
        const chatCompletion = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.3, // low temperature for structured output accuracy
          max_tokens: 1800,
        });
        const content = chatCompletion.choices[0]?.message?.content;
        if (content) {
          // র অবজেক্ট ক্লিন করা (Clean markdown wrappers if present)
          let cleanJson = content.trim();
          if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
          }
          const result = JSON.parse(cleanJson);
          if (result.scores && result.feedback) {
            return result;
          }
        }
        throw new Error('Invalid JSON format from AI');
      } catch (err: any) {
        console.error('Groq CV Analysis failed:', err);
        throw new Error('Failed to analyze CV using AI: ' + err.message);
      }
    }
    throw new Error('Groq API Key is not configured. Please add VITE_GROQ_API_KEY in the environment.');
  }
};
