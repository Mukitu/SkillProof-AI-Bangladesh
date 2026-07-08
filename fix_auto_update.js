import fs from 'fs';

let content = fs.readFileSync('src/components/AiCareerGrowth.tsx', 'utf-8');

// replace loadData with a version that checks for staleness
const newLoadData = `
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await growthDb.getCareerProgress(user.id);
      
      let needsUpdate = false;
      if (!data) {
         needsUpdate = true;
      } else {
         const resumes = await cvDb.getResumes(user.id);
         const interviews = await interviewDb.getSessions(user.id);
         const skills = await passportDb.getSkills(user.id);
         
         const lastGenTime = new Date(data.lastGenerated).getTime();
         
         const latestResume = Math.max(0, ...resumes.map(r => new Date(r.updatedAt || r.createdAt).getTime()));
         const latestInterview = Math.max(0, ...interviews.map(i => new Date(i.completedAt || i.createdAt).getTime()));
         const latestSkill = Math.max(0, ...skills.map(s => new Date(s.updatedAt || s.createdAt).getTime()));
         
         // Assuming profile changes update user.updatedAt, but we don't have that in AuthContext maybe.
         
         const latestChange = Math.max(latestResume, latestInterview, latestSkill);
         if (latestChange > lastGenTime) {
            needsUpdate = true;
         }
      }

      if (needsUpdate) {
        await generateNewProgress();
      } else {
        setProgress(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace(/const loadData = async \(\) => \{[\s\S]*?\n  \};\n\n  useEffect/m, newLoadData.trim() + '\n\n  useEffect');
fs.writeFileSync('src/components/AiCareerGrowth.tsx', content);
console.log('AiCareerGrowth updated for auto-refresh.');
