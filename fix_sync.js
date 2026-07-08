import fs from 'fs';
let content = fs.readFileSync('src/components/AiCareerRoadmap.tsx', 'utf-8');

content = content.replace("import { roadmapDb } from '../lib/roadmapSupabase';", "import { roadmapDb } from '../lib/roadmapSupabase';\nimport { growthDb } from '../lib/growthSupabase';");

const newToggle = `
  const handleTaskToggle = async (section: keyof CareerRoadmapData['dailyTasks'], taskId: string) => {
    if (!roadmap || !user) return;
    
    let isCompleted = false;
    const newTasks = { ...roadmap.dailyTasks };
    newTasks[section] = newTasks[section].map((t: RoadmapTask) => {
      if (t.id === taskId) {
         isCompleted = !t.completed;
         return { ...t, completed: !t.completed };
      }
      return t;
    });
    const newRoadmap = { ...roadmap, dailyTasks: newTasks };
    setRoadmap(newRoadmap);
    await roadmapDb.saveRoadmap(newRoadmap);
    // sync history array
    setHistory(prev => prev.map(r => r.id === newRoadmap.id ? newRoadmap : r));
    
    // Sync with Career Progress Tracker
    try {
       const progress = await growthDb.getCareerProgress(user.id);
       if (progress) {
          const scoreDelta = isCompleted ? 1 : -1;
          const newScore = Math.max(0, Math.min(100, progress.overallScore + scoreDelta));
          if (newScore !== progress.overallScore) {
             progress.overallScore = newScore;
             await growthDb.saveCareerProgress(progress);
          }
       }
    } catch (e) {
       console.warn('Sync failed:', e);
    }
  };
`;

content = content.replace(/const handleTaskToggle = async[\s\S]*?setHistory.*?;\s*};\s*/, newToggle);

fs.writeFileSync('src/components/AiCareerRoadmap.tsx', content);
