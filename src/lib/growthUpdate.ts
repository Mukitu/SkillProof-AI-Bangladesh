import { cvDb } from './cvSupabase';
import { interviewDb } from './interviewSupabase';
import { passportDb } from './passportSupabase';
import { growthDb } from './growthSupabase';
import { growthGroq } from './growthGroq';
import { CareerProgressData } from '../types/growth';

export async function triggerCareerGrowthUpdate(user: any) {
  if (!user) return;
  try {
    const resumes = await cvDb.getResumes(user.id);
    const interviews = await interviewDb.getSessions(user.id);
    const skills = await passportDb.getSkillsByUserId(user.id);

    const aiData = await growthGroq.generateCareerProgress(user, resumes, interviews, skills);
    
    const newProgress: CareerProgressData = {
      id: crypto.randomUUID(),
      userId: user.id,
      ...aiData as any,
      lastGenerated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await growthDb.saveCareerProgress(newProgress);
  } catch (err) {
    console.error('Auto-update career growth failed:', err);
  }
}
