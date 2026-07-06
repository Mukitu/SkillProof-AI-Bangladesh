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

const MODEL_NAME = 'llama-3.1-70b-versatile';

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
      } catch (err) {
        console.error('Groq roadmap generation failed, utilizing fallback helper:', err);
      }
    }

    // গ্রক কনফিগারড না থাকলে বা ফেইল করলে কাস্টম ডাইনামিক অফলাইন ফলব্যাক (Offline fallback based on Career Path & Skills)
    return getFallbackRoadmap(careerPath, weakSkills);
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
      } catch (err) {
        console.error('Groq daily task generation failed, utilizing fallback:', err);
      }
    }

    return getFallbackDailyTasks(careerPath, weakSkills);
  }
};

/**
 * অফলাইন কাস্টমাইজড রোডম্যাপ জেনারেটর (Offline customized roadmap generator)
 */
function getFallbackRoadmap(careerPath: string, weakSkills: string[]) {
  const isReact = careerPath.toLowerCase().includes('react') || careerPath.toLowerCase().includes('frontend');
  const isBackend = careerPath.toLowerCase().includes('node') || careerPath.toLowerCase().includes('backend') || careerPath.toLowerCase().includes('database');

  const mainWeakness = weakSkills.length > 0 ? weakSkills[0] : 'General Development';

  if (isReact) {
    return {
      roadmap7Days: {
        topics: [`React State Management & Lifecycle`, `Effective use of useEffect and custom Hooks`, `Component optimization and rendering patterns`],
        practiceTasks: [
          `Build a dynamic list renderer using React.memo and useCallback to prevent unnecessary re-renders.`,
          `Refactor a legacy class component using standard modern hooks.`
        ],
        miniProjects: [`Hooks Dashboard: A simple dashboard tracking local states, network requests, and memoized values.`],
        learningObjectives: [`Fully understand Hook dependencies and prevent infinite re-render loops.`],
        expectedResults: [`Clean, warning-free React components showing proper rendering and hook optimizations.`]
      },
      roadmap30Days: {
        topics: [`Global State Managers (Redux Toolkit or Zustand)`, `Performance profiling via React DevTools`, `TypeScript integration with custom components`],
        practiceTasks: [
          `Implement a deep nested global state utilizing Zustand with proper actions.`,
          `Resolve standard type errors in a complex multi-prop custom React component.`
        ],
        miniProjects: [`E-Commerce Cart State Manager: A robust cart client-side application with multi-tier filters and local caching.`],
        learningObjectives: [`Handle clean state architectures in large single-page applications without prop-drilling.`],
        expectedResults: [`Fully-typed responsive web application utilizing scalable state stores.`]
      },
      roadmap90Days: {
        topics: [`Server-Side Rendering (SSR) & Next.js Core`, `Advanced Web Performance (Lighthouse & Core Web Vitals)`, `Test-Driven Development (TDD) using Jest & React Testing Library`],
        practiceTasks: [
          `Configure complete dynamic pre-fetching and static site generation for dynamic products.`,
          `Write unit tests with full coverage for custom asynchronous hooks.`
        ],
        miniProjects: [`Enterprise SaaS Dashboard: An analytics interface featuring multi-role authentication, lazy-loaded chart routes, and complete tests.`],
        learningObjectives: [`Architect scalable, production-grade enterprise frontend systems conforming to the highest performance standards.`],
        expectedResults: [`Ready-to-deploy modular SaaS interface showcasing optimal code splits and 95%+ test coverage.`]
      }
    };
  }

  if (isBackend) {
    return {
      roadmap7Days: {
        topics: [`Node.js Event Loop & Non-Blocking Async I/O`, `Express Routing and RESTful Controller design`, `Robust Error Handling & logging middleware`],
        practiceTasks: [
          `Implement a central Express error handler mapping custom API exceptions cleanly.`,
          `Write async fs streams to read/write heavy files securely.`
        ],
        miniProjects: [`REST Logs Proxy: A light-weight Node service proxying public APIs and logging requests on local files.`],
        learningObjectives: [`Write scalable API controllers while avoiding unhandled promise rejections.`],
        expectedResults: [`A clean, robust Express boilerplate implementing strict schema validators and proper error layers.`]
      },
      roadmap30Days: {
        topics: [`Database Schema Design & Query Tuning`, `ORM integration (Drizzle or Prisma) and migrations`, `Relational Joins, Indexing and transaction models`],
        practiceTasks: [
          `Optimize a slow N+1 query utilizing eager loading or targeted SQL joins.`,
          `Create safe schema migration scripts and seeds for complex user-role profiles.`
        ],
        miniProjects: [`Secure Auth API: A production-ready REST gateway featuring JWT sessions, password hashing, and dynamic SQL profiles.`],
        learningObjectives: [`Design and optimize relational database models capable of handling high-volume reads and writes.`],
        expectedResults: [`Fully migration-guarded database server with responsive REST endpoints.`]
      },
      roadmap90Days: {
        topics: [`Microservices Architecture & Event-Driven Systems`, `Caching strategies utilizing Redis`, `Dockerization and secure container orchestration`],
        practiceTasks: [
          `Configure Redis cache invalidation on database updates to ensure cache-consistency.`,
          `Write a multi-container Docker compose orchestration binding SQL, Redis, and Express servers.`
        ],
        miniProjects: [`Distributed Scalable API Gateway: An API hub with rate-limiting, centralized auth middleware, and background jobs.`],
        learningObjectives: [`Architect cloud-native, high-availability, fully containerized backends suited for enterprise volume.`],
        expectedResults: [`A production-grade microservice backend fully prepared for AWS/GCP container deploy.`]
      }
    };
  }

  // ডিফল্ট জেনেরিক আইটি রোডম্যাপ (Default general roadmap fallback)
  return {
    roadmap7Days: {
      topics: [`Problem Solving Fundamentals & Data Structures`, `Asynchronous operations and Promises`, `Version Control (Advanced Git commands)`],
      practiceTasks: [
        `Solve 5 algorithmic challenges addressing hash maps and array traversals.`,
        `Resolve complex merge conflicts on a mock git repository.`
      ],
      miniProjects: [`Algorithm Playroom: A light script visualizing custom sorting algorithms on the console.`],
      learningObjectives: [`Develop clear execution workflows and structured programmatic thinking.`],
      expectedResults: [`Improved score in core programming evaluations and cleaner Git histories.`]
    },
    roadmap30Days: {
      topics: [`Object-Oriented Design & SOLID principles`, `REST API integrations & async state flows`, `Unit testing basic helper utilities`],
      practiceTasks: [
        `Refactor a highly coupled script into clean, single-responsibility modules.`,
        `Write complete Jest unit tests for utility conversion functions.`
      ],
      miniProjects: [`SaaS Task Tracker: A server-synced local storage planning tool with complete CRUD controls.`],
      learningObjectives: [`Write reusable, maintainable, and loosely-coupled object structures.`],
      expectedResults: [`High-quality portfolio code adhering to standard production styling rules.`]
    },
    roadmap90Days: {
      topics: [`System Design & Architecture Patterns`, `Cloud Infrastructures & CI/CD deployment flows`, `Web Security & Authentication standards`],
      practiceTasks: [
        `Create a complete automated deployment workflow using GitHub Actions.`,
        `Design a scalable real-time notification engine using WebSockets on paper.`
      ],
      miniProjects: [`Enterprise Collaboration Tool: A fully integrated collaborative work hub with structured tables and reports.`],
      learningObjectives: [`Lead development of scalable software systems from initial design to final cloud delivery.`],
      expectedResults: [`Enterprise-ready competency across both design and live operational structures.`]
    }
  };
}

/**
 * অফলাইন ডেইলি প্র্যাকটিস টাস্ক জেনারেটর (Offline customized daily tasks generator)
 */
function getFallbackDailyTasks(careerPath: string, weakSkills: string[]) {
  const isReact = careerPath.toLowerCase().includes('react') || careerPath.toLowerCase().includes('frontend');
  const isBackend = careerPath.toLowerCase().includes('node') || careerPath.toLowerCase().includes('backend') || careerPath.toLowerCase().includes('database');

  const mainWeakness = weakSkills.length > 0 ? weakSkills[0] : 'Technical Optimization';

  if (isReact) {
    return {
      codingTask: {
        title: `Dynamic React Pagination Hook`,
        description: `Create a custom React hook 'usePagination' that takes totalItems, itemsPerPage, and initialPage. It should return currentItems, totalPages, currentPage, goToPage, next, and prev. Protect it from bounds overflow!`,
        codeTemplate: `import { useState, useMemo } from 'react';\n\nexport function usePagination({ totalItems, itemsPerPage, initialPage = 1 }) {\n  const [currentPage, setCurrentPage] = useState(initialPage);\n  \n  // TODO: Implement pagination logic here\n  \n  return {\n    currentPage,\n    totalPages: 0,\n    currentItems: [],\n    goToPage: (page) => {},\n    next: () => {},\n    prev: () => {}\n  };\n}`
      },
      communicationPractice: {
        prompt: `Explain 'useEffect dependency arrays' to a junior developer.`,
        description: `Spend 3 minutes explaining how omissions or incorrect inclusions in useEffect dependency arrays cause infinite API fetch loops or stale closures. Focus on practical visual analogies.`
      },
      interviewQuestion: {
        question: `What is the difference between React.memo, useMemo, and useCallback? When would you NOT use them?`,
        idealAnswerOutline: `• React.memo is for visual component re-rendering guards.\n• useMemo memoizes heavy calculation output values.\n• useCallback memoizes reference functions.\n• Avoid using them everywhere: they introduce memory overhead and comparison calculations which can hurt simple components.`
      },
      miniAssignment: {
        title: `Profile a local application`,
        description: `Open Chrome DevTools, click the 'Profiler' tab in React Developer Tools, record a profile of a dynamic modal opening, and verify if any child components are rendering redundantly.`
      }
    };
  }

  if (isBackend) {
    return {
      codingTask: {
        title: `Robust SQLite Database Connection Guard`,
        description: `Write a TypeScript class 'DatabaseGuard' that initializes a database connection. Implement safe retries with exponential backoff if the connection is temporarily locked or busy, throwing a clear custom error after 3 attempts.`,
        codeTemplate: `export class DatabaseGuard {\n  private retries = 3;\n  \n  async connectWithRetry(dbUrl: string): Promise<boolean> {\n    // TODO: Implement database connection check with exponential backoff\n    return true;\n  }\n}`
      },
      communicationPractice: {
        prompt: `Explain why a database query was slow to a non-technical project manager.`,
        description: `Voice-record a 2-minute explanation of why a database search on user profiles was slow, why adding an index solves it, and how you would prevent similar issues. Avoid technical jargon like "B-Tree traversal".`
      },
      interviewQuestion: {
        question: `What are SQL Joins? Explain the visual difference between INNER, LEFT, RIGHT and FULL OUTER joins.`,
        idealAnswerOutline: `• INNER Join: Only returns intersecting records matching in both tables.\n• LEFT Join: All rows from the left table, plus matched from right table.\n• RIGHT Join: Opposite of LEFT.\n• FULL OUTER: All rows from both tables, populating NULLs for missing values.\n• Indices are highly critical on join keys to avoid slow table scans.`
      },
      miniAssignment: {
        title: `Optimize database indexes`,
        description: `Open your SQL GUI or console. Run 'EXPLAIN ANALYZE' on a complex query involving filters or joins, check the scan execution plan, and identify columns requiring a new index.`
      }
    };
  }

  return {
    codingTask: {
      title: `Valid Parentheses Verifier`,
      description: `Write a function 'isValidParentheses(s: string): boolean' that checks if parentheses, brackets, and braces are closed in correct ordering. Use a standard stack structure for optimal O(N) execution!`,
      codeTemplate: `export function isValidParentheses(s: string): boolean {\n  const stack: string[] = [];\n  // TODO: Implement stack validator\n  return true;\n}`
    },
    communicationPractice: {
      prompt: `Introduce yourself in 90 seconds to a lead software recruiter.`,
      description: `Stand in front of a mirror or open your camera. Give a concise elevator pitch of your career path, your main strengths, and why you are excited about modern software solutions.`
    },
    interviewQuestion: {
      question: `What are the SOLID design principles? Give a short 1-sentence description of each.`,
      idealAnswerOutline: `• Single Responsibility: A module has only one reason to change.\n• Open/Closed: Open for extension, closed for modification.\n• Liskov Substitution: Child classes must replace parents seamlessly.\n• Interface Segregation: Keep client interfaces compact and specific.\n• Dependency Inversion: Depend on abstractions, not concrete components.`
    },
    miniAssignment: {
      title: `Create a clean Git branch`,
      description: `Open terminal. Checkout a clean development branch 'git checkout -b feature/micro-task'. Make a minor code formatting edit, commit with semantic syntax, and draft a pull request layout on paper.`
    }
  };
}
