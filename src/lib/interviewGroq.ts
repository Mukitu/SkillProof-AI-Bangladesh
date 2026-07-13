/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CvData, InterviewSession, InterviewQA, InterviewMemory } from '../types';

// গ্রক এপিআই কী রিড করা (Retrieve Groq API key)

// Backend proxy is used for AI.
const isRealGroq = true;

const MODEL_NAME = 'llama-3.3-70b-versatile';

export const interviewGroq = {
  isConfigured: () => isRealGroq,

  // ১. সিভি এনালাইসিস করে ক্যারিয়ার ও স্কিল ডিটেক্ট করা (Detect Career Path & Skills from CV)
  analyzeCvForInterview: async (cv: CvData): Promise<{
    careerPath: string;
    skills: string[];
    readinessScore: number;
    duration: string;
    resumeScore: number;
  }> => {
    // সিভি ডাটা সামারি তৈরি
    const skillsList = [
      ...(cv.skills?.technicalSkills || []),
      ...(cv.skills?.softSkills || [])
    ];
    
    const expRoles = cv.experience?.map(e => e.role).join(', ') || '';
    const projTech = cv.projects?.map(p => p.techStack).join(', ') || '';
    
    const context = `
    Skills: ${skillsList.join(', ')}
    Experience Roles: ${expRoles}
    Projects Tech: ${projTech}
    Career Summary: ${cv.careerSummary || ''}
    `;

    const prompt = `You are an expert AI recruiter.
Analyze the following resume attributes and extract the single most accurate candidate professional Career Path (e.g., Frontend Developer, Full Stack Engineer, Digital Marketing Specialist, Human Resources Executive, Backend Developer, Data Scientist, etc.) and a clean list of top 8-10 key technical and soft skills.
Also estimate an Interview Readiness Score (30-100) based on their profile strength and average interview duration.

Resume Context:
${context}

You MUST return ONLY a raw JSON object with the following schema (no markdown wrappers like \`\`\`json, no other text):
{
  "careerPath": "string (the detected career path, capitalize properly)",
  "skills": ["string (up to 10 key technical or soft skills)"],
  "readinessScore": number (30-100),
  "duration": "string (e.g., '25 Minutes')",
  "resumeScore": number (30-100, estimate based on completeness)
}`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.2,
          max_tokens: 500
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
        const res = JSON.parse(cleanJson);
        if (res.careerPath && res.skills) {
          return {
            careerPath: res.careerPath,
            skills: res.skills,
            readinessScore: res.readinessScore || 75,
            duration: res.duration || '20 Minutes',
            resumeScore: res.resumeScore || 80
          };
        }
      }
      throw new Error('Invalid JSON format from AI');
    } catch (err: any) {
      console.error('Groq career detection failed:', err);
      throw new Error('Failed to analyze CV for interview using AI: ' + err.message);
    }
  },

  // ২. প্রথম প্রশ্ন জেনারেট করা (Generate first ice-breaker question)
  generateFirstQuestion: async (
    careerPath: string,
    skills: string[],
    adaptiveMemory?: InterviewMemory | null,
    language: 'en' | 'bn' = 'en'
  ): Promise<string> => {
    let memoryContext = '';
    if (adaptiveMemory) {
      memoryContext = `
[PERSONALIZED ADAPTIVE INTERVIEW MEMORY]:
- Candidate's Weak Topics from previous sessions: ${adaptiveMemory.weakTopics.join(', ')}
- Candidate's Strong Topics: ${adaptiveMemory.strongTopics.join(', ')}
- Critical Previous Mistakes they made: ${adaptiveMemory.previousMistakes.join(', ')}
- Previous Questions Asked (STRICTLY DO NOT REPEAT ANY OF THESE):
${adaptiveMemory.previousQuestions.slice(-10).join('\n')}

INSTRUCTIONS FOR PERSONALIZATION:
- If the candidate had weak topics previously, gently steer the ice-breaker towards those, or ask a question that allows them to address how they improved on those skills.
- If they performed exceptionally well, increase the complexity/difficulty of the technical aspects mentioned.
- NEVER repeat any question listed in the previous questions history.
`;
    }

    const prompt = `You are a warm, highly professional corporate interviewer.
Generate the first question of a live interactive interview for a candidate seeking a role in: ${careerPath}.
Their primary skills are: ${skills.join(', ')}.
${memoryContext}

The first question should be an engaging, professional ice-breaker that welcomes them, mentions their career path, and asks them to introduce themselves while summarizing their most prominent project or experience.

**CRITICAL INSTRUCTION FOR CONCISENESS**:
- Keep the question VERY SHORT, brief, and concise (maximum 1 or 2 simple, clear sentences. Do NOT write long paragraphs, complex subclauses, or verbose descriptions).
- Respond ONLY with the question itself.
- Output language MUST be: ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'}. Let it flow naturally in that language.`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.7,
          max_tokens: 150
        })
      });
      
      if (!response.ok) throw new Error('AI Proxy request failed');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (content) return content.trim();
      throw new Error('No content returned from AI');
    } catch (err: any) {
      console.error('Groq first question failed:', err);
      throw new Error('Failed to generate interview question using AI: ' + err.message);
    }
  },

  // ৩. উত্তর বিশ্লেষণ করা এবং পরবর্তী বুদ্ধিদীপ্ত প্রশ্ন জেনারেট করা (Process answer and generate dynamic follow-up)
  processAnswerAndGenerateNext: async (
    careerPath: string,
    skills: string[],
    qaHistory: InterviewQA[],
    lastAnswer: string,
    questionCount: number, // ১ থেকে শুরু করে কততম প্রশ্ন
    adaptiveMemory?: InterviewMemory | null,
    language: 'en' | 'bn' = 'en'
  ): Promise<{
    nextQuestion: string;
    nextCategory: string;
    answerScores: {
      technical: number;
      confidence: number;
      communication: number;
      problemSolving: number;
      professionalism: number;
      english: number;
    };
    answerFeedback: string;
  }> => {
    // আগের Q&A গুলো ফরম্যাট করা
    const historyText = qaHistory.map((q, i) => `
    [Question ${i+1}]: ${q.question}
    [Candidate Answer]: ${q.answer || '(No answer provided)'}
    `).join('\n');

    const nextTypeDescription = [
      'Technical (Checking hard skills accuracy)',
      'Behavioral (STAR method situational triggers)',
      'HR / Professionalism (Culture fit and work ethics)',
      'Problem Solving (Scenario-based logical challenges)',
      'Communication / English Speaking (Clarity and articulation)'
    ][questionCount % 5];

    let memoryContext = '';
    if (adaptiveMemory) {
      memoryContext = `
[PERSONALIZED ADAPTIVE INTERVIEW MEMORY]:
- Candidate's Weak Topics from previous sessions: ${adaptiveMemory.weakTopics.join(', ')}
- Candidate's Strong Topics: ${adaptiveMemory.strongTopics.join(', ')}
- Critical Previous Mistakes they made: ${adaptiveMemory.previousMistakes.join(', ')}
- Previous Questions Asked (STRICTLY DO NOT REPEAT ANY OF THESE):
${adaptiveMemory.previousQuestions.slice(-10).join('\n')}

INSTRUCTIONS FOR PERSONALIZATION:
- Incorporate more questions (increase probability of technical depth) for their Weak Topics to help them practice and verify their improvement.
- Push them on harder level questions for concepts they were already strong at.
- Bring up practical/scenario questions for previously failed concepts or mistakes.
- NEVER repeat any question listed in the previous questions history.
`;
    }

    const prompt = `You are an elite corporate interviewer conducting a live interview with a candidate for a "${careerPath}" role.
Top skills: ${skills.join(', ')}.
${memoryContext}

Interview History So Far:
${historyText}

Candidate's Latest Answer to the last question:
"${lastAnswer}"

Task:
1. Evaluate the candidate's latest answer across 6 core metrics out of 100: Technical, Confidence, Communication, Problem Solving, Professionalism, English. Provide honest, realistic ratings based on the quality of their response.
2. Provide a 2-sentence professional verbal feedback/encouragement addressing their last answer (Write the feedback in ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'}).
3. Generate the NEXT interview question.
   - **Crucial**: The next question MUST be an intelligent, natural follow-up directly responding to what the candidate just said or deep diving into their technical skills.
   - Do NOT ask generic or disconnected questions. It must flow like a real human dialogue.
   - Automatically blend in a "${nextTypeDescription}" flavor to this next question.
   - Ensure the question is highly job-specific and matches their career path.
   - **CRITICAL INSTRUCTION FOR CONCISENESS**: The next question MUST be VERY SHORT, brief, and concise (maximum 1 or 2 simple, clear sentences. Do NOT write long paragraphs or verbose questions).
   - Generate the question in: ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'}.

You MUST return ONLY a raw JSON object matching the following schema (no markdown wrappers like \`\`\`json, no outer text):
{
  "nextQuestion": "string (the short, dynamic next follow-up question in ${language === 'bn' ? 'Bangla' : 'English'})",
  "nextCategory": "Technical" | "HR" | "Behavioral" | "Problem Solving" | "Communication" | "English Speaking",
  "answerFeedback": "string (2-sentence feedback on the previous answer in ${language === 'bn' ? 'Bangla' : 'English'})",
  "answerScores": {
    "technical": number (30-100),
    "confidence": number (30-100),
    "communication": number (30-100),
    "problemSolving": number (30-100),
    "professionalism": number (30-100),
    "english": number (30-100)
  }
}`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.5,
          max_tokens: 800
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
        const res = JSON.parse(cleanJson);
        if (res.nextQuestion && res.answerScores) {
          return {
            nextQuestion: res.nextQuestion,
            nextCategory: res.nextCategory || 'Technical',
            answerScores: res.answerScores,
            answerFeedback: res.answerFeedback || 'Excellent points raised. Let us expand on that further.'
          };
        }
      }
      throw new Error('Invalid JSON format from AI');
    } catch (err: any) {
      console.error('Groq next question generation failed:', err);
      throw new Error('Failed to process answer and generate next question using AI: ' + err.message);
    }
  },

  // ৪. শেষ রিভিউ ও ওভারঅল স্কোর জেনারেট করা (Generate overall interview summary at the end)
  generateInterviewSummary: async (
    careerPath: string,
    skills: string[],
    qaHistory: InterviewSession['qa']
  ): Promise<{
    scores: {
      overall: number;
      technical: number;
      confidence: number;
      communication: number;
      problemSolving: number;
      professionalism: number;
      english: number;
    };
    feedback: {
      strengths: string[];
      weaknesses: string[];
      mistakes: string[];
      suggestions: string[];
    };
  }> => {
    const historyText = qaHistory.map((q, i) => `
    [Question ${i+1}]: ${q.question}
    [Candidate Answer]: ${q.answer || '(No answer provided)'}
    [Evaluated Scores]: Technical: ${q.scores?.technical}, Confidence: ${q.scores?.confidence}, Comm: ${q.scores?.communication}, Problem Solving: ${q.scores?.problemSolving}, Professionalism: ${q.scores?.professionalism}, English: ${q.scores?.english}
    `).join('\n');

    const prompt = `You are the lead AI Talent Assessor.
Conduct a final evaluation of the following completed live interview for a candidate targeting the role of: "${careerPath}".

Interview Q&A Transcript and Metrics:
${historyText}

Task:
Calculate the final overall composite score and aggregate individual sub-scores (0-100) based on all answers.
Also extract exactly 3 candidate Strengths, 3 Weaknesses, 3 Top Mistakes made during this interview, and 4 high-level concrete actionable Improvement Suggestions.

You MUST return ONLY a raw JSON object matching the following schema (no markdown formatting, no comments, no outer text):
{
  "scores": {
    "overall": number (30-100, calculate appropriate weighted average),
    "technical": number (30-100),
    "confidence": number (30-100),
    "communication": number (30-100),
    "problemSolving": number (30-100),
    "professionalism": number (30-100),
    "english": number (30-100)
  },
  "feedback": {
    "strengths": ["string (3 specific strengths based on answers)"],
    "weaknesses": ["string (3 specific weaknesses based on answers)"],
    "mistakes": ["string (3 specific interview slip-ups or mistakes in communication/tech)"],
    "suggestions": ["string (4 highly tactical improvement steps)"]
  }
}`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.3,
          max_tokens: 1200
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
        const res = JSON.parse(cleanJson);
        if (res.scores && res.feedback) {
          return res;
        }
      }
      throw new Error('Invalid JSON format from AI');
    } catch (err: any) {
      console.error('Groq final evaluation failed:', err);
      throw new Error('Failed to generate interview summary using AI: ' + err.message);
    }
  },

  // ৫. সম্পূর্ণ হিস্ট্রি বিশ্লেষণ করে এডাপ্টিভ মেমোরি জেনারেট করা (Compile consolidated adaptive memory from history)
  compileAdaptiveMemory: async (
    userId: string,
    historySessions: InterviewSession[],
    latestSession: InterviewSession
  ): Promise<InterviewMemory> => {
    // Format sessions for LLM summary
    const sessionsText = [latestSession, ...historySessions].slice(0, 5).map((s, idx) => `
    [Interview ${idx + 1}]:
    Date: ${s.createdAt}
    Career Path: ${s.careerPath}
    Scores: Overall: ${s.scores?.overall}, Tech: ${s.scores?.technical}, Comm: ${s.scores?.communication}, Confidence: ${s.scores?.confidence}, ProbSolving: ${s.scores?.problemSolving}, English: ${s.scores?.english}
    Weaknesses: ${s.feedback?.weaknesses.join('; ')}
    Strengths: ${s.feedback?.strengths.join('; ')}
    Mistakes: ${s.feedback?.mistakes.join('; ')}
    Questions Asked:
    ${s.qa.map(q => q.question).join('\n')}
    `).join('\n');

    const prompt = `You are an elite AI Career Advisor and Talent Engine.
Analyze the following candidate's interview history (latest session and previous sessions) and compile a consolidated, personalized **Interview Memory** object.

Interview History:
${sessionsText}

Task:
1. Identify current Weak Topics and Strong Topics based on scores and feedback.
2. Accumulate all Questions Asked so we can avoid repeating them.
3. Consolidate a list of recurring Previous Mistakes.
4. Calculate a timeline of overall/technical/communication scores for the "improvementHistory" (map each session).
5. Generate a "studyPlan" with specific: todayGoal, weekGoal, nextInterviewGoal, practiceTasks, miniProjects, and practiceQuestions, tailored EXACTLY to improve their weak skills.
6. Extract metrics: mostImprovedSkill, mostDifficultSkill, mostRepeatedMistake, fastestGrowingSkill.
7. Formulate a 3-sentence dynamic Readiness Explanation detailing WHY their "readinessScore" is set to the calculated number (30-100, represent aggregate readiness).
8. Write 5 specific high-level AI Insights (e.g., "You improved your API knowledge. Communication improved. React knowledge still weak.").

You MUST return ONLY a raw JSON object matching the following schema (no markdown wrappers like \`\`\`json, no other text):
{
  "weakTopics": ["string"],
  "strongTopics": ["string"],
  "previousQuestions": ["string"],
  "previousMistakes": ["string"],
  "learningSuggestions": ["string"],
  "readinessExplanation": "string",
  "readinessScore": number,
  "studyPlan": {
    "todayGoal": "string",
    "weekGoal": "string",
    "nextInterviewGoal": "string",
    "practiceTasks": ["string"],
    "miniProjects": ["string"],
    "practiceQuestions": ["string"]
  },
  "metrics": {
    "mostImprovedSkill": "string",
    "mostDifficultSkill": "string",
    "mostRepeatedMistake": "string",
    "fastestGrowingSkill": "string",
    "currentWeakAreas": ["string"],
    "currentStrongAreas": ["string"]
  },
  "aiInsights": ["string"]
}`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.3,
          max_tokens: 1500
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
        const res = JSON.parse(cleanJson);
        return {
          id: latestSession.id + '_memory',
          userId,
          weakTopics: res.weakTopics || [],
          strongTopics: res.strongTopics || [],
          previousQuestions: res.previousQuestions || [],
          previousMistakes: res.previousMistakes || [],
          improvementHistory: [latestSession, ...historySessions].map(s => ({
            sessionId: s.id,
            date: new Date(s.createdAt).toLocaleDateString(),
            overallScore: s.scores?.overall || 70,
            technicalScore: s.scores?.technical || 70,
            communicationScore: s.scores?.communication || 70
          })).reverse(),
          learningSuggestions: res.learningSuggestions || [],
          readinessExplanation: res.readinessExplanation || '',
          readinessScore: res.readinessScore || 70,
          studyPlan: res.studyPlan || {
            todayGoal: '',
            weekGoal: '',
            nextInterviewGoal: '',
            practiceTasks: [],
            miniProjects: [],
            practiceQuestions: []
          },
          metrics: res.metrics || {
            mostImprovedSkill: '',
            mostDifficultSkill: '',
            mostRepeatedMistake: '',
            fastestGrowingSkill: '',
            currentWeakAreas: [],
            currentStrongAreas: []
          },
          aiInsights: res.aiInsights || [],
          lastUpdated: new Date().toISOString()
        };
      }
      throw new Error('Invalid JSON format from AI');
    } catch (err: any) {
      console.error('Groq compile memory failed:', err);
      throw new Error('Failed to compile memory using AI: ' + err.message);
    }
  }
};
