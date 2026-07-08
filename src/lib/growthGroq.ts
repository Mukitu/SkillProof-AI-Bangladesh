import { CareerProgressData } from '../types/growth';

const MODEL_NAME = 'llama-3.3-70b-versatile';

export const growthGroq = {
  generateCareerProgress: async (
    profile: any,
    resume: any,
    interviews: any[],
    skills: any[]
  ): Promise<Partial<CareerProgressData>> => {
    
    const prompt = `You are an elite Tech Career Coach & Architect.
Analyze the user's data to generate a comprehensive career progression report.
User Profile: ${JSON.stringify(profile)}
Resume Analysis: ${JSON.stringify(resume)}
Interview History: ${JSON.stringify(interviews)}
Skill Passport: ${JSON.stringify(skills)}

You MUST respond with a JSON object ONLY, formatted EXACTLY according to the schema below. Do not wrap the JSON in markdown code blocks (\`\`\`json), do not include any introductory or concluding text, and do not include any other markdown formatting.

Schema:
{
  "overallScore": number (0-100),
  "resumeScore": number (0-100),
  "atsScore": number (0-100),
  "interviewScore": number (0-100),
  "skillScore": number (0-100),
  "profileCompletion": number (0-100),
  "strengths": [
    { "name": string, "category": "Technical" | "Soft Skill" | "Communication" | "Leadership" | "Problem Solving", "confidence": number (0-100) }
  ],
  "weaknesses": [
    { "name": string, "category": "Missing Skill" | "Technical" | "Soft Skill" | "Resume" | "Interview", "priority": "High" | "Medium" | "Low" }
  ],
  "jobReadiness": "Not Ready" | "Beginner" | "Intermediate" | "Job Ready" | "Highly Competitive",
  "readinessReason": string,
  "aiSuggestions": {
    "shortTerm": [string],
    "longTerm": [string],
    "resume": [string],
    "interview": [string],
    "portfolio": [string],
    "linkedin": [string],
    "github": [string]
  },
  "learningResources": [
    { "title": string, "url": string, "type": "Official Documentation" | "freeCodeCamp" | "MDN" | "Microsoft Learn" | "Google Developers" | "Coursera" | "edX" | "YouTube" | "GitHub" | "Other", "reason": string }
  ],
  "projectRecommendations": [
    { "title": string, "description": string, "requiredSkills": [string], "estimatedTime": string, "difficulty": "Beginner" | "Intermediate" | "Advanced" }
  ],
  "careerPaths": [
    { "title": string, "matchReason": string, "missingSkills": [string], "expectedLearningTime": string }
  ],
  "actionPlan": {
    "today": [{ "id": string, "text": string, "completed": false }],
    "thisWeek": [{ "id": string, "text": string, "completed": false }],
    "thisMonth": [{ "id": string, "text": string, "completed": false }],
    "priorityChecklist": [{ "id": string, "text": string, "completed": false }]
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
          max_tokens: 3000
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
      console.error('Groq career progress generation failed:', err);
      throw new Error('Failed to generate career progress using AI: ' + err.message);
    }
  },

  chat: async (
    profile: any,
    progress: any,
    message: string
  ): Promise<string> => {
    const prompt = `You are an elite Tech Career Coach. The user is asking you a question about their career.
User Profile: ${JSON.stringify(profile)}
User Career Progress Analysis: ${JSON.stringify(progress)}

User Question: ${message}

Provide a helpful, direct, and actionable answer based on their specific data.`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.5,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) throw new Error('AI Proxy request failed');
      const data = await response.json();
      return data.choices[0]?.message?.content || "I couldn't generate a response.";
    } catch (err: any) {
      console.error('Groq chat failed:', err);
      throw new Error('Failed to chat using AI: ' + err.message);
    }
  }
};
