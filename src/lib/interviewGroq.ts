/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Groq from 'groq-sdk';
import { CvData, InterviewSession, InterviewQA, InterviewMemory } from '../types';

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
    console.log('✅ Groq AI Interview Service Initialized.');
  } catch (err) {
    console.error('❌ Groq interview initialization failed:', err);
  }
}

const MODEL_NAME = 'llama-3.1-70b-versatile';

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

    if (isRealGroq && groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.2,
          max_tokens: 500,
        });
        const content = response.choices[0]?.message?.content;
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
      } catch (err) {
        console.error('Groq career detection failed, falling back:', err);
      }
    }

    // অফলাইন মোড সিমুলেশন (Robust Offline career detection fallback based on CV content keywords)
    await new Promise(resolve => setTimeout(resolve, 1200));

    // ডিফল্ট ডিটেকশন লজিক
    let careerPath = 'Software Engineer';
    const skills: string[] = [];

    // স্কিল সংগ্রহ
    if (cv.skills?.technicalSkills?.length) {
      skills.push(...cv.skills.technicalSkills.slice(0, 6));
    }
    if (cv.skills?.softSkills?.length) {
      skills.push(...cv.skills.softSkills.slice(0, 3));
    }

    // কি-ওয়ার্ড ম্যাপিং
    const techStr = JSON.stringify(cv).toLowerCase();
    if (techStr.includes('react') || techStr.includes('next.js') || techStr.includes('frontend')) {
      careerPath = 'Frontend Engineer';
    } else if (techStr.includes('node') && techStr.includes('react')) {
      careerPath = 'Full Stack Developer';
    } else if (techStr.includes('node') || techStr.includes('express') || techStr.includes('django') || techStr.includes('backend')) {
      careerPath = 'Backend Engineer';
    } else if (techStr.includes('marketing') || techStr.includes('sales') || techStr.includes('seo')) {
      careerPath = 'Digital Marketing Specialist';
    } else if (techStr.includes('hr') || techStr.includes('human resources') || techStr.includes('recruiting')) {
      careerPath = 'HR Manager';
    } else if (techStr.includes('data science') || techStr.includes('python') || techStr.includes('machine learning')) {
      careerPath = 'Data Scientist';
    }

    if (skills.length === 0) {
      skills.push('Problem Solving', 'Teamwork', 'Communication', 'Adaptability');
    }

    const resumeScore = cv.scores?.atsScore || 78;

    return {
      careerPath,
      skills,
      readinessScore: Math.round(resumeScore * 1.05) > 100 ? 98 : Math.round(resumeScore * 1.05),
      duration: '25 Minutes',
      resumeScore
    };
  },

  // ২. প্রথম প্রশ্ন জেনারেট করা (Generate first ice-breaker question)
  generateFirstQuestion: async (
    careerPath: string,
    skills: string[],
    adaptiveMemory?: InterviewMemory | null
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

Keep the tone extremely polite, corporate yet encouraging. Respond ONLY with the question itself. Output in English.`;

    if (isRealGroq && groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.7,
          max_tokens: 150,
        });
        const content = response.choices[0]?.message?.content;
        if (content) return content.trim();
      } catch (err) {
        console.error('Groq first question failed:', err);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    return `Hello and welcome to your AI live interview! It is a pleasure to have you here today. Looking at your background, you have a solid foundation as a ${careerPath}. To kick off our session, could you please introduce yourself and share how your core skills in ${skills.slice(0, 3).join(', ')} helped you deliver your most successful project?`;
  },

  // ৩. উত্তর বিশ্লেষণ করা এবং পরবর্তী বুদ্ধিদীপ্ত প্রশ্ন জেনারেট করা (Process answer and generate dynamic follow-up)
  processAnswerAndGenerateNext: async (
    careerPath: string,
    skills: string[],
    qaHistory: InterviewQA[],
    lastAnswer: string,
    questionCount: number, // ১ থেকে শুরু করে কততম প্রশ্ন
    adaptiveMemory?: InterviewMemory | null
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
2. Provide a 2-sentence professional verbal feedback/encouragement addressing their last answer.
3. Generate the NEXT interview question.
   - **Crucial**: The next question MUST be an intelligent, natural follow-up directly responding to what the candidate just said or deep diving into their technical skills.
   - Do NOT ask generic or disconnected questions. It must flow like a real human dialogue.
   - Automatically blend in a "${nextTypeDescription}" flavor to this next question.
   - Ensure the question is challenging, highly job-specific, and matches their career path.

You MUST return ONLY a raw JSON object matching the following schema (no markdown wrappers like \`\`\`json, no outer text):
{
  "nextQuestion": "string (the dynamic next follow-up question)",
  "nextCategory": "Technical" | "HR" | "Behavioral" | "Problem Solving" | "Communication" | "English Speaking",
  "answerFeedback": "string (2-sentence feedback on the previous answer)",
  "answerScores": {
    "technical": number (30-100),
    "confidence": number (30-100),
    "communication": number (30-100),
    "problemSolving": number (30-100),
    "professionalism": number (30-100),
    "english": number (30-100)
  }
}`;

    if (isRealGroq && groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.5,
          max_tokens: 800,
        });
        const content = response.choices[0]?.message?.content;
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
      } catch (err) {
        console.error('Groq next question generation failed, using fallback:', err);
      }
    }

    // অফলাইন জেনারেটর (Offline fallback simulator)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // ক্যান্ডিডেটের উত্তরের দৈর্ঘ্য ও কিওয়ার্ড অনুসারে একটি মক স্কোর নির্ধারণ করি
    const len = lastAnswer.trim().length;
    let scoreSeed = 75;
    if (len < 15) scoreSeed = 45;
    else if (len < 40) scoreSeed = 65;
    else if (len > 120) scoreSeed = 88;

    const answerScores = {
      technical: Math.min(100, Math.round(scoreSeed + Math.random() * 8)),
      confidence: Math.min(100, Math.round(scoreSeed + Math.random() * 10 - 2)),
      communication: Math.min(100, Math.round(scoreSeed + Math.random() * 6)),
      problemSolving: Math.min(100, Math.round(scoreSeed + Math.random() * 10)),
      professionalism: Math.min(100, Math.round(scoreSeed + Math.random() * 4)),
      english: Math.min(100, Math.round(scoreSeed + Math.random() * 5))
    };

    // মক ফলো-আপ প্রশ্নাবলি (Dynamic Offline Fallback Questions mapped by Question Count)
    const fallbackQuestions = [
      `That is a wonderful introduction. Could you tell me more about how you handle state management or scalability when designing complex systems?`,
      `Thank you for that detailed explanation. Now, could you walk me through a challenging technical problem you faced in your project and the step-by-step logic you used to debug and solve it?`,
      `Excellent points! In professional teams, conflict or tight deadlines can sometimes create pressure. Can you recall a time you disagreed with a colleague or manager, and how you communicated to find a constructive resolution?`,
      `Great. Let us look at a situational scenario: If a critical production feature goes offline right before a product launch, but your manager is unreachable, what is your immediate process for triaging and resolving the crisis?`,
      `That was a highly professional answer. To wrap up our interview, how do you keep up with the latest industry frameworks and how do you ensure that your English and client communication remain sharp during international collaborations?`
    ];

    const fallbackFeedback = "Your description shows real practical experience and solid structural thinking. That is a highly valuable trait in team settings.";
    const categories = ['Technical', 'Problem Solving', 'Behavioral', 'HR', 'Communication'];

    return {
      nextQuestion: fallbackQuestions[(questionCount - 1) % fallbackQuestions.length],
      nextCategory: categories[(questionCount - 1) % categories.length],
      answerScores,
      answerFeedback: fallbackFeedback
    };
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

    if (isRealGroq && groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.3,
          max_tokens: 1200,
        });
        const content = response.choices[0]?.message?.content;
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
      } catch (err) {
        console.error('Groq final evaluation failed:', err);
      }
    }

    // অফলাইন জেনারেটর (Offline Simulator)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // এভারেজ ক্যালকুলেশন ফ্রম হিস্ট্রি
    let techAvg = 0, confAvg = 0, commAvg = 0, probAvg = 0, profAvg = 0, engAvg = 0;
    let count = 0;

    qaHistory.forEach(q => {
      if (q.scores) {
        techAvg += q.scores.technical;
        confAvg += q.scores.confidence;
        commAvg += q.scores.communication;
        probAvg += q.scores.problemSolving;
        profAvg += q.scores.professionalism;
        engAvg += q.scores.english;
        count++;
      }
    });

    if (count > 0) {
      techAvg = Math.round(techAvg / count);
      confAvg = Math.round(confAvg / count);
      commAvg = Math.round(commAvg / count);
      probAvg = Math.round(probAvg / count);
      profAvg = Math.round(profAvg / count);
      engAvg = Math.round(engAvg / count);
    } else {
      techAvg = 75; confAvg = 72; commAvg = 78; probAvg = 70; profAvg = 80; engAvg = 74;
    }

    const overall = Math.round((techAvg + confAvg + commAvg + probAvg + profAvg + engAvg) / 6);

    return {
      scores: {
        overall,
        technical: techAvg,
        confidence: confAvg,
        communication: commAvg,
        problemSolving: probAvg,
        professionalism: profAvg,
        english: engAvg
      },
      feedback: {
        strengths: [
          'Excellent structural breakdown when answering scenario-based problem-solving questions.',
          'Demonstrated deep, hands-on understanding of team development protocols and version management.',
          'Very respectful, structured, and confident communication posture throughout the session.'
        ],
        weaknesses: [
          'Some answers lacked deep metrics or quantitative evidence to back up claims.',
          'Technical terms were sometimes spoken loosely, showing slight hesitation under pressure.',
          'Grammar tenses and sentence structure fluctuated slightly in fast dialogue.'
        ],
        mistakes: [
          'Fumbled briefly during the crisis-management scenario, choosing a reactive route before outlining systematic triaging.',
          'Kept some explanations excessively brief, missing opportunities to highlight architectural patterns.',
          'Omitted mentioning testing or validation frameworks altogether.'
        ],
        suggestions: [
          'Use the STAR method (Situation, Task, Action, Result) rigorously to structure all behavioral and situational answers.',
          'Include quantitative metrics (e.g., performance improvements, speed increases, revenue impacts) in every project success story.',
          'Practice speaking with a slow, continuous rhythm to reduce filler pauses during critical technical questions.',
          'Engage in specific mock sessions focused strictly on system architectures and unit testing paradigms.'
        ]
      }
    };
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

    if (isRealGroq && groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: MODEL_NAME,
          temperature: 0.3,
          max_tokens: 1500,
        });
        const content = response.choices[0]?.message?.content;
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
      } catch (err) {
        console.error('Groq compile memory failed, compiling locally:', err);
      }
    }

    // Offline fallback compile memory
    const allSessions = [latestSession, ...historySessions];
    const latestScores = latestSession.scores || { overall: 70, technical: 70, communication: 70, confidence: 70, problemSolving: 70, english: 70 };
    const latestFeedback = latestSession.feedback || { strengths: [], weaknesses: [], mistakes: [], suggestions: [] };

    const weakTopics = latestFeedback.weaknesses.slice(0, 3);
    const strongTopics = latestFeedback.strengths.slice(0, 3);
    const previousQuestions = allSessions.flatMap(s => s.qa.map(q => q.question));
    const previousMistakes = latestFeedback.mistakes;
    const learningSuggestions = latestFeedback.suggestions;

    const readinessScore = latestScores.overall;
    const readinessExplanation = `আপনার শেষ ইন্টারভিউয়ের সামগ্রিক পারফর্ম্যান্সের ওপর ভিত্তি করে প্রস্তুতি স্কোর নির্ধারণ করা হয়েছে। টেকনিক্যাল একুরেসি ${latestScores.technical}% এবং কমিউনিকেশন স্কোর ${latestScores.communication}%। দুর্বল ক্ষেত্রগুলো নিয়ে আরও কাজ করলে প্রস্তুতি স্কোর দ্রুত ৯০% স্পর্শ করবে।`;

    return {
      id: latestSession.id + '_memory',
      userId,
      weakTopics,
      strongTopics,
      previousQuestions,
      previousMistakes,
      improvementHistory: allSessions.map(s => ({
        sessionId: s.id,
        date: new Date(s.createdAt).toLocaleDateString(),
        overallScore: s.scores?.overall || 70,
        technicalScore: s.scores?.technical || 70,
        communicationScore: s.scores?.communication || 70
      })).reverse(),
      learningSuggestions,
      readinessExplanation,
      readinessScore,
      studyPlan: {
        todayGoal: `রিভিউ করুন: ${previousMistakes[0] || 'পূর্ববর্তী ইন্টারভিউয়ের ভুলত্রুটিসমূহ'}`,
        weekGoal: `দুর্বল দিক (${weakTopics.join(', ') || 'টেকনিক্যাল কনসেপ্টস'}) এর ওপর ২ ঘণ্টার থিওরি ও কোডিং প্র্যাকটিস।`,
        nextInterviewGoal: 'পরবর্তী ইন্টারভিউতে স্কোর ৮০+ এ উন্নীত করা।',
        practiceTasks: [
          `STAR মেথড ব্যবহার করে পূর্বের ${weakTopics[0] || 'যেকোনো'} কাজের অভিজ্ঞতা গুছিয়ে লিখুন।`,
          `ইউনিক চ্যালেঞ্জিং বাগ বা আর্কিটেকচার সリューション নিয়ে ১০ মিনিট কথা বলার রিহার্সাল দিন।`
        ],
        miniProjects: [
          `একটি ছোট স্ক্র্যাচ প্রজেক্ট তৈরি করুন যা ${weakTopics[0] || 'আপনার দুর্বল পার্ট'} এর বাস্তব প্রয়োগ দেখায়।`
        ],
        practiceQuestions: [
          `Can you explain the main architectural patterns used in modern ${latestSession.careerPath} apps?`,
          `Walk me through your process of debugging a complex memory leak in a large-scale codebase.`
        ]
      },
      metrics: {
        mostImprovedSkill: latestScores.communication > 75 ? 'Communication Skill' : 'Technical Accuracy',
        mostDifficultSkill: latestScores.technical < 70 ? 'Technical Concept Deep-dive' : 'Problem Solving Scenarios',
        mostRepeatedMistake: previousMistakes[0] || 'Explanations fumbling key mechanics',
        fastestGrowingSkill: 'Interview Fluency & Professional Persona',
        currentWeakAreas: weakTopics,
        currentStrongAreas: strongTopics
      },
      aiInsights: [
        `আপনার কমিউনিকেশন দক্ষতা বেশ ভালো (${latestScores.communication}%), যা ইন্টারভিউতে অত্যন্ত ইতিবাচক প্রভাব ফেলছে।`,
        `${weakTopics[0] || 'টেকনিক্যাল একুরেসি'} বৃদ্ধি করার জন্য নির্দিষ্ট কনসেপ্টে আরও স্টাডি করুন।`,
        `STAR ফ্রেমওয়ার্ক দিয়ে উত্তর সাজালে বিহেভিওরাল প্রশ্নগুলোর উত্তর অনেক বেশি প্রফেশনাল ও গোছানো শোনায়।`
      ],
      lastUpdated: new Date().toISOString()
    };
  }
};
