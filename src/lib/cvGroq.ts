/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CvData, AiScores, AiFeedback, PersonalInfo, EducationItem, ExperienceItem, ProjectItem, CvSkills } from '../types';

// গ্রক এপিআই কী রিড করা (Retrieve Groq API key)
// Backend proxy is used for AI.
const isRealGroq = true;

// গ্রক মডেল নির্ধারণ (Groq Llama-3.1 model)
const MODEL_NAME = 'llama-3.3-70b-versatile';

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

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.7
        })
      });
      
      if (!response.ok) throw new Error('AI Proxy request failed');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (content) return content.trim();
      throw new Error('No content returned from AI');
    } catch (err) {
      console.error('Groq AI Assist summary failed:', err);
      throw err;
    }
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

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.6
        })
      });
      
      if (!response.ok) throw new Error('AI Proxy request failed');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (content) return content.trim();
      throw new Error('No content returned from AI');
    } catch (err) {
      console.error('Groq AI Improve description failed:', err);
      throw err;
    }
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
    const prompt = `You are a high-performance ATS Parser and Career Strategist.
Analyze the following raw text from a resume file named "${fileName}".
Extract ALL relevant professional data and evaluate the profile.

CRITICAL INSTRUCTIONS:
1. Extract data accurately. Do NOT miss contact info (email, phone, address).
2. If specific contact info is missing, search the entire text thoroughly for patterns (e.g., xxx@email.com, +880...).
3. Categorize skills into "technicalSkills" (languages, frameworks, tools) and "softSkills" (communication, leadership, etc.).
4. For Education, Experience, and Projects, ensure every item has a unique "id" (e.g., edu_1, exp_1).
5. Provide specific, non-generic feedback.

Extracted Text:
"""
${fileText}
"""

RESPONSE FORMAT (Strict JSON):
{
  "extractedData": {
    "personalInfo": {
      "name": "Full Name",
      "phone": "Phone Number",
      "email": "Email Address",
      "address": "Location/City",
      "linkedin": "LinkedIn URL",
      "github": "GitHub URL",
      "portfolio": "Portfolio/Website"
    },
    "careerSummary": "Professional summary",
    "education": [
      { "id": "edu_1", "degree": "Degree", "institution": "University", "year": "Year", "gpa": "GPA" }
    ],
    "experience": [
      { "id": "exp_1", "company": "Company", "role": "Title", "duration": "Duration", "description": "Details", "isCurrent": false }
    ],
    "projects": [
      { "id": "proj_1", "title": "Project Name", "description": "Details", "techStack": "Tech Used", "github": "Repo URL" }
    ],
    "skills": {
      "softSkills": ["Skill"],
      "technicalSkills": ["Skill"],
      "languages": ["English"],
      "certificates": ["Cert Name"]
    }
  },
  "scores": {
    "atsScore": 0-100,
    "resumeQualityScore": 0-100,
    "skillScore": 0-100,
    "professionalismScore": 0-100,
    "communicationScore": 0-100
  },
  "feedback": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "missingSkills": ["string"],
    "grammarProblems": ["string"],
    "formattingIssues": ["string"],
    "atsIssues": ["string"],
    "careerSuggestions": ["string"]
  }
}

Respond ONLY with the raw JSON object.`;

    try {
      
        const groqResponse = await fetch('/api/ai/groq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: MODEL_NAME,
            temperature: 0.0,
            max_tokens: 1800,
            seed: 42,
            response_format: { type: "json_object" }
          })
        });
        if (!groqResponse.ok) throw new Error('Groq request failed');
        const data = await groqResponse.json();
        content = data.choices[0]?.message?.content || '';
      
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
      console.error('CV Analysis failed:', err);
      throw new Error('Failed to analyze CV using AI: ' + err.message);
    }
  }
};
