/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillPassport, PassportSkill, PassportHistoryItem, VerificationRecord, PublicProfile } from '../types/passport';
import { interviewDb } from './interviewSupabase';

// লোকালস্টোরেজ কী-সমূহ (LocalStorage Keys for Sandbox/Simulated DB tables)
const PASSPORT_KEY = 'skillproof_skill_passports';
const SKILLS_KEY = 'skillproof_passport_skills';
const HISTORY_KEY = 'skillproof_passport_history';
const VERIFICATION_KEY = 'skillproof_verification_records';
const PUBLIC_PROFILE_KEY = 'skillproof_public_profiles';

/**
 * লেভেল নির্ধারণ করার ফাংশন (Get passport/skill level based on actual score)
 * ০-৩৯: Beginner, ৪০-৫৪: Bronze, ৫৫-৬৯: Silver, ৭০-৮৪: Gold, ৮৫-৯৪: Platinum, ৯৫-১০০: Expert
 */
export function calculateLevel(score: number): 'Beginner' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Expert' {
  if (score < 40) return 'Beginner';
  if (score < 55) return 'Bronze';
  if (score < 70) return 'Silver';
  if (score < 85) return 'Gold';
  if (score < 95) return 'Platinum';
  return 'Expert';
}

/**
 * কাস্টম ক্যাটেগরিকে টেকনিক্যাল স্কিল-এ রূপান্তর করার ম্যাপিং
 */
function mapCategoryToSkills(category: string): string[] {
  const catLower = category.toLowerCase();
  if (catLower.includes('react')) {
    return ['React', 'JavaScript', 'Git', 'Tailwind CSS'];
  } else if (catLower.includes('node') || catLower.includes('backend')) {
    return ['Node.js', 'Database', 'JavaScript', 'Git'];
  } else if (catLower.includes('typescript')) {
    return ['TypeScript', 'JavaScript', 'Git'];
  } else if (catLower.includes('database') || catLower.includes('sql')) {
    return ['Database', 'SQL', 'PostgreSQL'];
  } else if (catLower.includes('frontend')) {
    return ['React', 'JavaScript', 'Tailwind CSS', 'TypeScript'];
  }
  return ['Software Engineering', 'Problem Solving', 'Git'];
}

export const passportDb = {
  // ১. পাসপোর্ট ডাটা লোড ও স্বয়ংক্রিয় সিঙ্ক (Get or Auto-Sync passport for a user)
  getPassportByUserId: async (userId: string, fullName: string, avatarUrl?: string): Promise<SkillPassport | null> => {
    // লোড করার সময় আমরা সরাসরি সিঙ্ক করে নিই যাতে ডাটা সবসময় আপ-টু-ডেট থাকে
    await passportDb.syncPassport(userId, fullName, avatarUrl);
    
    const stored = localStorage.getItem(PASSPORT_KEY);
    const list: SkillPassport[] = stored ? JSON.parse(stored) : [];
    return list.find(p => p.userId === userId) || null;
  },

  // ২. পাসপোর্টের আইডি দিয়ে লোড করা (Get passport by Passport ID)
  getPassportById: async (passportId: string): Promise<SkillPassport | null> => {
    const stored = localStorage.getItem(PASSPORT_KEY);
    const list: SkillPassport[] = stored ? JSON.parse(stored) : [];
    return list.find(p => p.id === passportId) || null;
  },

  // ৩. পাসপোর্টের আন্ডারে থাকা স্কিলসমূহ লোড করা (Get skills by passport ID or user ID)
  getSkillsByUserId: async (userId: string): Promise<PassportSkill[]> => {
    const stored = localStorage.getItem(SKILLS_KEY);
    const list: PassportSkill[] = stored ? JSON.parse(stored) : [];
    return list.filter(s => s.userId === userId);
  },

  // ৪. পাসপোর্টের টাইমলাইন হিস্ট্রি লোড করা (Get timeline history)
  getHistoryByUserId: async (userId: string): Promise<PassportHistoryItem[]> => {
    const stored = localStorage.getItem(HISTORY_KEY);
    const list: PassportHistoryItem[] = stored ? JSON.parse(stored) : [];
    return list.filter(h => h.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // ৫. ভেরিফিকেশন রেকর্ড সিঙ্গেল লোড করা (Get verification record by Verification ID)
  getVerificationRecord: async (verificationId: string): Promise<VerificationRecord | null> => {
    const stored = localStorage.getItem(VERIFICATION_KEY);
    const list: VerificationRecord[] = stored ? JSON.parse(stored) : [];
    return list.find(r => r.id === verificationId) || null;
  },

  // ৬. পাবলিক প্রোফাইল লোড করা (Get Public Profile by Passport ID)
  getPublicProfile: async (passportId: string): Promise<PublicProfile | null> => {
    const passport = await passportDb.getPassportById(passportId);
    if (!passport) return null;

    const skills = await passportDb.getSkillsByUserId(passport.userId);
    const history = await passportDb.getHistoryByUserId(passport.userId);

    return {
      passportId: passport.id,
      fullName: passport.fullName,
      avatarUrl: passport.avatarUrl,
      careerPath: passport.careerPath,
      readinessScore: passport.readinessScore,
      level: passport.level,
      skills,
      history,
      verificationStatus: passport.verificationStatus === 'Verified' ? 'Verified' : 'Pending',
      updatedAt: passport.updatedAt
    };
  },

  // ৭. ইন্টারভিউ হিস্ট্রি দিয়ে পাসপোর্ট জেনারেট ও সিঙ্ক করা (Core Engine: Auto-Sync Passport)
  syncPassport: async (userId: string, fullName: string, avatarUrl?: string): Promise<void> => {
    // সুপাবেজ/লোকাল স্টোরেজ থেকে ইউজারের ইন্টারভিউ হিস্ট্রি নিয়ে আসি
    const sessions = await interviewDb.getSessions(userId);
    const completedSessions = sessions.filter(s => s.status === 'completed');

    // যদি কোনো ইন্টারভিউ সম্পূর্ণ না হয়ে থাকে, তাহলে ডিফল্ট বা পেন্ডিং পাসপোর্ট দেখাবে
    const passportId = `SPAI-2026-${userId.replace('user_', '').substring(0, 6).toUpperCase()}`;
    const defaultCareerPath = completedSessions.length > 0 ? completedSessions[0].careerPath : 'Software Engineer';
    const totalScoreSum = completedSessions.reduce((acc, curr) => acc + (curr.scores?.overall || 0), 0);
    const avgScore = completedSessions.length > 0 ? Math.round(totalScoreSum / completedSessions.length) : 0;
    const overallLevel = calculateLevel(avgScore);

    // ১. মূল পাসপোর্ট অবজেক্ট তৈরি/আপডেট
    const newPassport: SkillPassport = {
      id: passportId,
      userId,
      fullName,
      avatarUrl,
      careerPath: defaultCareerPath,
      readinessScore: avgScore,
      level: overallLevel,
      verificationStatus: completedSessions.length > 0 ? 'Verified' : 'Unverified',
      createdAt: completedSessions.length > 0 ? completedSessions[completedSessions.length - 1].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // লোকালস্টোরেজে পাসপোর্ট সংরক্ষণ
    const passportsStored = localStorage.getItem(PASSPORT_KEY);
    let passportsList: SkillPassport[] = passportsStored ? JSON.parse(passportsStored) : [];
    passportsList = passportsList.filter(p => p.userId !== userId);
    passportsList.push(newPassport);
    localStorage.setItem(PASSPORT_KEY, JSON.stringify(passportsList));

    if (completedSessions.length === 0) {
      // যদি কোনো ইন্টারভিউ না থাকে, স্কিল বা হিস্ট্রি থাকবে না
      return;
    }

    // ২. প্রতিটি স্কিলের স্কোর এবং লেটেস্ট ডেটা প্রসেস করা
    const skillsMap: { [key: string]: { scores: number[]; dates: string[]; confidences: number[] } } = {};

    // প্রতিটি কমপ্লিটেড সেশন থেকে স্কিল ম্যাপিং ও স্কিল স্কোর এগ্রিগেশন করি
    completedSessions.forEach(session => {
      const skillsInSession = mapCategoryToSkills(session.careerPath);
      const sessionScore = session.scores?.overall || 0;
      const techScore = session.scores?.technical || sessionScore;
      const confidenceScore = session.scores?.confidence || 70;
      const commScore = session.scores?.communication || 70;
      const probScore = session.scores?.problemSolving || 70;
      const engScore = session.scores?.english || 70;

      // ক) টেকনিক্যাল স্কিলসমূহ এগ্রিগেট
      skillsInSession.forEach(skill => {
        if (!skillsMap[skill]) {
          skillsMap[skill] = { scores: [], dates: [], confidences: [] };
        }
        skillsMap[skill].scores.push(techScore);
        skillsMap[skill].dates.push(session.createdAt);
        skillsMap[skill].confidences.push(confidenceScore);
      });

      // খ) সফট স্কিলসমূহ এগ্রিগেট (Communication, Problem Solving, English)
      const softs = [
        { name: 'Communication', score: commScore },
        { name: 'Problem Solving', score: probScore },
        { name: 'English', score: engScore }
      ];

      softs.forEach(soft => {
        if (!skillsMap[soft.name]) {
          skillsMap[soft.name] = { scores: [], dates: [], confidences: [] };
        }
        skillsMap[soft.name].scores.push(soft.score);
        skillsMap[soft.name].dates.push(session.createdAt);
        skillsMap[soft.name].confidences.push(confidenceScore);
      });
    });

    // স্কিল তালিকা তৈরি এবং প্রোগ্রেস হিসাব করা
    const generatedSkills: PassportSkill[] = [];
    const generatedVerifications: VerificationRecord[] = [];

    Object.keys(skillsMap).forEach(skillName => {
      const data = skillsMap[skillName];
      const sortedDates = [...data.dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      // লেটেস্ট স্কোর, প্রথম স্কোর এবং এভারেজ স্কোর বের করা
      const avgSkillScore = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
      const confAvg = Math.round(data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length);
      const lastAssessmentDate = sortedDates[sortedDates.length - 1];
      
      // প্রোগ্রেস হিসাব (Latest score minus initial score)
      const firstScore = data.scores[0];
      const latestScore = data.scores[data.scores.length - 1];
      const progress = latestScore - firstScore; // Positive represents improvement

      const verificationId = `VERIFY-${skillName.substring(0, 3).toUpperCase()}-${userId.replace('user_', '').substring(0, 6).toUpperCase()}`;
      const skillLevel = calculateLevel(avgSkillScore);

      const skillRecord: PassportSkill = {
        id: verificationId,
        passportId,
        userId,
        skillName,
        score: avgSkillScore,
        level: skillLevel,
        lastAssessmentDate,
        progress: progress >= 0 ? progress : 0, // baseline limit to positive representation
        confidence: confAvg,
        verificationStatus: avgSkillScore >= 50 ? 'Verified' : 'Assessed'
      };

      generatedSkills.push(skillRecord);

      // ভেরিফিকেশন রেকর্ড তৈরি
      const verificationRecord: VerificationRecord = {
        id: verificationId,
        passportId,
        userId,
        skillName,
        score: avgSkillScore,
        assessmentDate: lastAssessmentDate,
        verificationStatus: avgSkillScore >= 50 ? 'Verified' : 'Assessed',
        summary: `The SkillProof AI engine has verified the owner's competence in "${skillName}" at a score of ${avgSkillScore}% during conversational and technical evaluations, qualifying for the level of "${skillLevel}".`,
        ownerName: fullName
      };
      generatedVerifications.push(verificationRecord);
    });

    // লোকালস্টোরেজে স্কিল ও ভেরিফিকেশন সেভ করি
    const skillsStored = localStorage.getItem(SKILLS_KEY);
    let skillsList: PassportSkill[] = skillsStored ? JSON.parse(skillsStored) : [];
    skillsList = skillsList.filter(s => s.userId !== userId);
    skillsList.push(...generatedSkills);
    localStorage.setItem(SKILLS_KEY, JSON.stringify(skillsList));

    const verificationsStored = localStorage.getItem(VERIFICATION_KEY);
    let verificationsList: VerificationRecord[] = verificationsStored ? JSON.parse(verificationsStored) : [];
    // Filter old records for this user
    verificationsList = verificationsList.filter(v => v.userId !== userId);
    verificationsList.push(...generatedVerifications);
    localStorage.setItem(VERIFICATION_KEY, JSON.stringify(verificationsList));

    // ৩. পাসপোর্টের আন্ডারে হিস্ট্রি টাইমলাইন (Passport History Timeline)
    const generatedHistory: PassportHistoryItem[] = [];
    
    // ক্রমানুসারে সেশন সাজানো (Chrono-ordered to calculate progression)
    const chronoCompleted = [...completedSessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    chronoCompleted.forEach((session, index) => {
      const currentScore = session.scores?.overall || 0;
      let improvement = 'Base Score Assessment';

      if (index > 0) {
        const prevScore = chronoCompleted[index - 1].scores?.overall || 0;
        const diff = currentScore - prevScore;
        if (diff > 0) {
          improvement = `+${diff}% score increase from previous assessment`;
        } else if (diff < 0) {
          improvement = `${diff}% slight adjustment from previous assessment`;
        } else {
          improvement = `Maintained steady performance level`;
        }
      }

      const historyLevel = calculateLevel(currentScore);

      const historyItem: PassportHistoryItem = {
        id: `HIST-${session.id.substring(0, 6).toUpperCase()}`,
        passportId,
        userId,
        interviewId: session.id,
        interviewTitle: session.careerPath + ' Interview Session',
        score: currentScore,
        improvement,
        level: historyLevel,
        date: session.completedAt || session.createdAt,
        summary: `Successfully completed the comprehensive assessment for "${session.careerPath}" with an overall evaluation score of ${currentScore}%.`
      };

      generatedHistory.push(historyItem);
    });

    const historyStored = localStorage.getItem(HISTORY_KEY);
    let historyList: PassportHistoryItem[] = historyStored ? JSON.parse(historyStored) : [];
    historyList = historyList.filter(h => h.userId !== userId);
    historyList.push(...generatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList));
  }
};
