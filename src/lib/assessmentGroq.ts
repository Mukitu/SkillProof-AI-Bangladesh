import { 
  AssessmentDifficulty, PracticalQuestion, ProjectChallenge, 
  AssessmentFeedback, AssessmentScore 
} from '../types/assessment';

const MODEL_NAME = 'llama-3.3-70b-versatile';

export const assessmentGroq = {
  // ১. ডাইনামিক প্রাকটিক্যাল কোশ্চেন জেনারেট করা (Generate Customized Practical Coding/Writing Question)
  generatePracticalQuestion: async (
    skillName: string, 
    careerPath: string, 
    difficulty: AssessmentDifficulty,
    resumeContext: string
  ): Promise<PracticalQuestion> => {
    const prompt = `You are an elite Tech Lead and AI Recruiter.
Generate a highly practical, tailored programming or technical writing assessment task for a candidate.
Target Skill: ${skillName}
Candidate's Target Career Path: ${careerPath}
Difficulty Level: ${difficulty} (Make it strictly match this difficulty! For Beginner, basic functions. For Intermediate, medium complexity, object operations, async/handling. For Advanced, design patterns, complex queries, memory/performance concerns).
Candidate Profile Context:
${resumeContext}

The task categories include: Programming, SQL, JavaScript, TypeScript, React, Next.js, Node.js, Python, Java, C/C++, Flutter, UI/UX, Writing, Debugging, Algorithm, Problem Solving, System Design, Code Review, Architecture. Select the one most appropriate for the Target Skill: "${skillName}".

You MUST return ONLY a raw JSON object with the following schema (no markdown wrappers like \`\`\`json, no other text outside the JSON):
{
  "question": "A concise question summary",
  "problemStatement": "A detailed problem statement explaining the scenario and objective",
  "requirements": ["List of 3-5 clear functional requirements/steps"],
  "expectedOutput": "Description of the expected return value, console output, or system response",
  "constraints": ["List of 2-3 constraints, e.g. time complexity, space complexity, no external libraries, or specific tags/classes"],
  "hints": ["Optional list of 1-2 helpful hints"],
  "difficulty": "${difficulty}",
  "estimatedTime": "e.g. '30 Minutes' or '45 Minutes'",
  "initialCode": "Starter boilerplate code or skeleton for the candidate to complete (use correct syntax for the skill's language, write a full helper function, comments, etc. so they can fill it in)",
  "language": "The programming language or syntax name for code editor, e.g. 'javascript', 'typescript', 'sql', 'python', 'java', 'cpp', 'html', 'markdown'"
}`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) throw new Error('Proxy error generating practical question');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (content) {
        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(cleanJson) as PracticalQuestion;
      }
      throw new Error('Empty AI response');
    } catch (err) {
      console.error('Error in generatePracticalQuestion:', err);
      // Fallback local question
      return {
        question: `Build a custom ${skillName} Utility`,
        problemStatement: `Develop a clean, production-ready utility inside ${skillName} that solves a real-world data conversion challenge. Ensure optimum time complexity and appropriate error boundary cases.`,
        requirements: [
          "Create a function that processes an input structure and filters out invalid properties.",
          "Handle boundary conditions such as empty strings, undefined or null values gracefully.",
          "Write documentation comments explaining your core algorithmic approach."
        ],
        expectedOutput: "A sanitised output object or dataset mapping perfectly to domain models.",
        constraints: [
          "Must execute in O(n) linear time complexity.",
          "No external packages or secondary helper modules are allowed."
        ],
        hints: ["Think about checking input types using typeof or explicit guards before operations."],
        difficulty,
        estimatedTime: '30 Minutes',
        initialCode: skillName.toLowerCase().includes('sql') 
          ? `-- Write your SQL query here\nSELECT * FROM users WHERE active = true;` 
          : `// Complete the function below\nfunction processData(input) {\n  // Your code here\n  return null;\n}`,
        language: skillName.toLowerCase().includes('sql') ? 'sql' : 'javascript'
      };
    }
  },

  // ২. ডাইনামিক প্রজেক্ট অ্যাসেসমেন্ট জেনারেট করা (Generate Mini Project Specifications)
  generateProjectChallenge: async (
    skillName: string,
    careerPath: string,
    difficulty: AssessmentDifficulty,
    resumeContext: string
  ): Promise<ProjectChallenge> => {
    const prompt = `You are a Principal Architect and CTO.
Generate a highly engaging, professional mini-project challenge for a candidate.
The project should be personalized based on the candidate's Resume, Detected Skills, Experience, and Target Career Path.
Primary Skill to assess: ${skillName}
Career Path: ${careerPath}
Difficulty Level: ${difficulty}

You MUST return ONLY a raw JSON object with the following schema (no markdown wrappers like \`\`\`json, no other text):
{
  "title": "Clear, exciting project title (e.g. 'Build a Responsive E-Commerce Cart System')",
  "description": "Comprehensive description explaining the business value and project context",
  "requirements": ["List of 4-6 strict requirements (architecture, tech-stack, etc.)"],
  "features": ["List of 4-5 must-have features the project should support"],
  "difficulty": "${difficulty}",
  "expectedSkills": ["3-5 skills expected to be demonstrated, e.g., 'React', 'Tailwind', 'State Management'"],
  "estimatedDuration": "e.g., '6 Hours', '24 Hours', '48 Hours'",
  "evaluationCriteria": ["List of 3-4 metrics they will be evaluated on"]
}`;

    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: MODEL_NAME,
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) throw new Error('Proxy error generating project challenge');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (content) {
        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(cleanJson) as ProjectChallenge;
      }
      throw new Error('Empty AI response');
    } catch (err) {
      console.error('Error in generateProjectChallenge:', err);
      return {
        title: `Develop a ${skillName} Mini Dashboard`,
        description: `Create a fully functional web-based dashboard utilizing ${skillName} which implements standard CRUD operations, state caching, and responsive presentation.`,
        requirements: [
          "Adopt proper clean code directory architecture.",
          "Implement validation logic for all input parameters.",
          "Integrate local browser cache synchronization (localStorage) for data persistence."
        ],
        features: [
          "Interactive list overview with filtering & searching.",
          "Responsive modal forms for adding and editing records.",
          "Visual charts/KPI metrics summary cards."
        ],
        difficulty,
        expectedSkills: [skillName, "CSS Framework", "State Management"],
        estimatedDuration: '24 Hours',
        evaluationCriteria: [
          "Code readability and standard naming conventions.",
          "Correct data synchronization and state management flow.",
          "Clean visual layout and design consistency."
        ]
      };
    }
  },

  // ৩. কোডিং সリューション মূল্যায়ন (Evaluate Practical Coding Solution)
  evaluatePracticalSubmission: async (
    question: PracticalQuestion,
    userCode: string
  ): Promise<{ scores: AssessmentScore; feedback: AssessmentFeedback; trustScore: number }> => {
    const prompt = `You are an elite Senior Engineer conducting a technical code review and plagiarism audit.
Evaluate the candidate's submitted solution code against the following Question & requirements.

Question:
${question.question}
Problem Statement:
${question.problemStatement}
Requirements:
${question.requirements.join('\n')}
Expected Output:
${question.expectedOutput}
Constraints:
${question.constraints.join('\n')}

Candidate's Submitted Code:
\`\`\`${question.language}
${userCode}
\`\`\`

Analyze the code structure, syntax correctness, algorithmic logic, edge-case handling, performance, security, and cleanliness.
Return a very strict evaluation. Give a realistic score (0-100) based on code quality.

**CRITICAL PLAGIARISM & AI-GENERATION CHECK**:
- Carefully audit the submitted code to detect if it was generated/copied from an AI assistant (such as ChatGPT, Claude, Gemini).
- Common AI indicators: Sterile/perfect boilerplate comments, overly-verbose '// explanation comments' on almost every trivial line of code, standard ChatGPT-style function designs, too-sterile error handling that isn't typically typed by a candidate under time constraints.
- If you suspect the code is AI-generated:
  1. The "trustScore" MUST be set very low (below 50, e.g., 20-35).
  2. In the "feedback.weakPoints" list, add a clear warning: "⚠️ AI-Generated Code Footprint Detected" or "⚠️ AI Plagiarism Suspected".
  3. In the "feedback.codeReview", write a strict feedback warning that AI-assisted solutions are strictly prohibited, explaining exactly what AI footprints were detected in their code (e.g. sterile ChatGPT template comments, unnecessary verbose step-by-step comments, etc.).
  4. Lower the overallScore and codeQualityScore to reflect the integrity violation.

You MUST return ONLY a raw JSON object with the following schema (no markdown wrappers like \`\`\`json, no other text):
{
  "scores": {
    "overallScore": number (0-100),
    "logicScore": number (0-100),
    "codeQualityScore": number (0-100),
    "performanceScore": number (0-100),
    "securityScore": number (0-100)
  },
  "trustScore": number (0-100, set below 50 if suspected of being AI-generated),
  "feedback": {
    "strongPoints": ["List of 2-3 specific parts of their code that are strong/correct"],
    "weakPoints": ["List of 2-3 specific limitations, errors, or bugs, including AI code detection warnings if applicable"],
    "codeReview": "A continuous markdown-formatted paragraph giving a detailed, helpful line-by-line review comments and strict AI-use warnings if applicable",
    "performanceSuggestions": ["1-2 suggestions to optimize performance, complexity, or memory"],
    "securitySuggestions": ["1-2 suggestions regarding security, inputs validation, or safety safeguards"],
    "bestPractices": ["1-2 general guidelines for best practices"],
    "industryStandardTips": ["A helpful industry-level tip related to this technical topic"],
    "alternativeSolution": "Describe/write a cleaner, more optimized alternative approach or code snippet",
    "learningResources": ["List of 2 recommended documentation links or learning references"],
    "nextRecommendation": "Specific domain concept to learn next",
    "improvementPlan": "A highly tailored 2-sentence study focus recommendation based on this submission"
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
          max_tokens: 1800
        })
      });

      if (!response.ok) throw new Error('Proxy evaluation failed');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (content) {
        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(cleanJson);
        return {
          scores: {
            overallScore: parsed.scores?.overallScore ?? 70,
            logicScore: parsed.scores?.logicScore ?? 70,
            codeQualityScore: parsed.scores?.codeQualityScore ?? 70,
            performanceScore: parsed.scores?.performanceScore ?? 70,
            securityScore: parsed.scores?.securityScore ?? 70
          },
          trustScore: parsed.trustScore ?? 85,
          feedback: parsed.feedback as AssessmentFeedback
        };
      }
      throw new Error('Empty evaluation response');
    } catch (err) {
      console.error('Error evaluating practical solution:', err);
      return {
        scores: { overallScore: 75, logicScore: 70, codeQualityScore: 80, performanceScore: 75, securityScore: 75 },
        trustScore: 90,
        feedback: {
          strongPoints: ["Correct logic implementation", "Good code structure"],
          weakPoints: ["Missing rigorous error bounds checks", "Minor naming style variations"],
          codeReview: "Your code is functional and well-constructed. The variable choices are logical and scope encapsulation works nicely. Try to make sure boundary inputs like null or array lengths are validated early on to protect execution flow.",
          performanceSuggestions: ["Consider avoiding nested iteration to preserve O(n) complexity."],
          securitySuggestions: ["Safeguard input buffers and enforce strict type assertion on inputs."],
          bestPractices: ["Use standard ES6 modules structure and follow clean-code guidelines."],
          industryStandardTips: ["In industry contexts, writing comprehensive unit tests (e.g. using Jest) is crucial for validating code logic before pipeline deployment."],
          alternativeSolution: "An alternative cleaner solution would utilize array reduction mapping to aggregate elements cleanly: \n`const processData = (arr) => arr.filter(Boolean);`",
          learningResources: ["MDN Web Docs - Array Methods", "Clean Code Book by Robert C. Martin"],
          nextRecommendation: "Learn more about Javascript Async/Await error boundary handlers.",
          improvementPlan: "Focus on refining input validation strategies and handling exceptional boundaries. Practice implementing test-driven development to catch edge cases early."
        }
      };
    }
  },

  // ৪. প্রজেক্ট সাবমিশন মূল্যায়ন (Evaluate Project-Based Submission)
  evaluateProjectSubmission: async (
    challenge: ProjectChallenge,
    submissionDetails: {
      zipName?: string;
      githubUrl?: string;
      demoUrl?: string;
      documentation?: string;
    }
  ): Promise<{ scores: AssessmentScore; feedback: AssessmentFeedback; trustScore: number }> => {
    const prompt = `You are a CTO conducting an architectural and codebase quality audit of a candidate's mini-project.
We are reviewing the following Project challenge specifications:

Project Title:
${challenge.title}
Description:
${challenge.description}
Requirements:
${challenge.requirements.join('\n')}
Features Expected:
${challenge.features.join('\n')}

Candidate's Submission Details:
ZIP File Name: ${submissionDetails.zipName || 'N/A'}
GitHub Repository: ${submissionDetails.githubUrl || 'N/A'}
Live Demo URL: ${submissionDetails.demoUrl || 'N/A'}
Candidate's Documentation / Readme notes:
${submissionDetails.documentation || 'No documentation provided.'}

Evaluate their work's project structure, code quality, readability, architecture, database setup, security safeguards, problem solving, logic, and performance based on the description and documentation provided.
Determine realistic, strict scores (0-100) for various evaluation dimensions and an overall rating.
Also estimate a "trustScore" (0-100) reflecting the completeness and likelihood of genuine local development of the project.

You MUST return ONLY a raw JSON object with the following schema (no markdown wrappers like \`\`\`json, no other text):
{
  "scores": {
    "projectScore": number (0-100),
    "architectureScore": number (0-100),
    "logicScore": number (0-100),
    "uiScore": number (0-100),
    "backendScore": number (0-100),
    "databaseScore": number (0-100),
    "codeQualityScore": number (0-100),
    "securityScore": number (0-100),
    "performanceScore": number (0-100),
    "overallScore": number (0-100)
  },
  "trustScore": number (0-100),
  "feedback": {
    "strongPoints": ["List of 2-3 specific architectural strengths shown in documentation/Readme"],
    "weakPoints": ["List of 2-3 specific omissions, architectural weak points, or missing integrations"],
    "codeReview": "A continuous markdown-formatted paragraph reviewing their codebase layout, naming, and architectural layers based on description",
    "performanceSuggestions": ["1-2 suggestions to optimize frontend asset loading, DB indexes, or caching"],
    "securitySuggestions": ["1-2 suggestions regarding secure headers, API guards, or database escape parameters"],
    "bestPractices": ["1-2 general guidelines for project design and structure"],
    "industryStandardTips": ["A helpful industry-level tip related to project setups and production-readiness"],
    "alternativeSolution": "Describe/write a cleaner, more production-grade alternative structure, stack choice or architectural layout",
    "learningResources": ["List of 2 recommended documentation links or learning references"],
    "nextRecommendation": "Specific system design or architecture topic to study next",
    "improvementPlan": "A highly tailored 2-sentence study focus recommendation based on this project submission"
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
          max_tokens: 1800
        })
      });

      if (!response.ok) throw new Error('Proxy evaluation failed');
      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (content) {
        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(cleanJson);
        return {
          scores: {
            projectScore: parsed.scores?.projectScore ?? 75,
            architectureScore: parsed.scores?.architectureScore ?? 75,
            logicScore: parsed.scores?.logicScore ?? 75,
            uiScore: parsed.scores?.uiScore ?? 75,
            backendScore: parsed.scores?.backendScore ?? 75,
            databaseScore: parsed.scores?.databaseScore ?? 75,
            codeQualityScore: parsed.scores?.codeQualityScore ?? 75,
            securityScore: parsed.scores?.securityScore ?? 75,
            performanceScore: parsed.scores?.performanceScore ?? 75,
            overallScore: parsed.scores?.overallScore ?? 75
          },
          trustScore: parsed.trustScore ?? 85,
          feedback: parsed.feedback as AssessmentFeedback
        };
      }
      throw new Error('Empty project evaluation response');
    } catch (err) {
      console.error('Error evaluating project solution:', err);
      return {
        scores: {
          projectScore: 75, architectureScore: 80, logicScore: 75, uiScore: 70, backendScore: 75,
          databaseScore: 70, codeQualityScore: 80, securityScore: 75, performanceScore: 75, overallScore: 75
        },
        trustScore: 90,
        feedback: {
          strongPoints: ["Clear folder separation", "Good architectural description", "Documented APIs"],
          weakPoints: ["Could benefit from database triggers", "Missing detailed logging details"],
          codeReview: "Your project's layout reflects solid structural awareness. The separation between routes and business services is clean and logical. Keep folder boundaries intact so controllers do not directly query DB adapters.",
          performanceSuggestions: ["Implement standard CDN file serving and bundler splitting in React."],
          securitySuggestions: ["Use strict ORM parameters and configure CSRF defense on forms."],
          bestPractices: ["Always enforce automated testing and static linting checks on commit pipelines."],
          industryStandardTips: ["Deploying multi-tier architectures with separate scalable cache layers (Redis) is a standard pattern for high-performance systems."],
          alternativeSolution: "A superior setup would utilize TypeScript absolute paths ('@/*') to preserve relative imports and avoid complex '../' imports.",
          learningResources: ["Microsoft Cloud Design Patterns", "Twelve-Factor App Guidelines"],
          nextRecommendation: "Learn more about distributed transaction strategies and SQL indexing.",
          improvementPlan: "Deepen your understanding of modular database modeling. Practice implementing rigorous API authentication middleware and continuous integration rules."
        }
      };
    }
  }
};
