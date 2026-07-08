const MODEL_NAME = 'llama-3.3-70b-versatile';

export const progressGroq = {
  generateInsights: async (
    profile: any,
    cvs: any[],
    interviews: any[],
    passports: any[],
    roadmaps: any[]
  ): Promise<any> => {
    const prompt = `You are an elite AI Career Coach. 
Analyze the user's data and generate a Career Progress analysis.
User Data:
Profile: ${JSON.stringify(profile)}
CVs: ${JSON.stringify(cvs)}
Interviews: ${JSON.stringify(interviews)}
Passports: ${JSON.stringify(passports)}
Roadmaps: ${JSON.stringify(roadmaps)}

You MUST respond with a JSON object ONLY, formatted EXACTLY according to the schema below. Do not wrap the JSON in markdown code blocks (\`\`\`json), do not include any introductory or concluding text, and do not include any other markdown formatting.

Schema:
{
  "careerScore": number (0-100),
  "aiInsights": {
    "strengths": [string],
    "weaknesses": [string],
    "prioritySkills": [string],
    "careerAdvice": string,
    "nextBestAction": string
  },
  "scoreDetails": {
    "communication": number (0-100),
    "technicalSkills": number (0-100),
    "problemSolving": number (0-100),
    "portfolio": number (0-100),
    "interview": number (0-100),
    "confidence": number (0-100),
    "resume": number (0-100)
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
          max_tokens: 2000
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
      console.error('Groq insights generation failed:', err);
      throw new Error('Failed to generate insights: ' + err.message);
    }
  }
};
