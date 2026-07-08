import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Activity, Award, Calendar, ChevronRight, Download, 
  Target, Zap, AlertCircle, RefreshCw, Star, CheckCircle2, 
  Clock, FileText, BrainCircuit, BarChart3, Presentation, BookOpen, Share2, Printer
} from 'lucide-react';
import { Card, Button, Badge } from './UI';
import { useAuth } from '../contexts/AuthContext';
import { cvDb } from '../lib/cvSupabase';
import { interviewDb } from '../lib/interviewSupabase';
import { passportDb } from '../lib/passportSupabase';
import { roadmapDb } from '../lib/roadmapSupabase';
import { progressDb } from '../lib/progressSupabase';
import { progressGroq } from '../lib/progressGroq';
import { CareerProgress, TimelineEvent } from '../types/progress';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

export const AiProgressTracker: React.FC<{ onNavigateToTab: (tabId: string) => void }> = ({ onNavigateToTab }) => {
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progressData, setProgressData] = useState<CareerProgress | null>(null);
  const [scoreDetails, setScoreDetails] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [completionStats, setCompletionStats] = useState<any>({});
  
  const [cvs, setCvs] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [passports, setPassports] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const passport = await passportDb.getPassportByUserId(user.id);
      const fetchedPassports = passport ? [passport] : [];
      const [fetchedCvs, fetchedInterviews, fetchedRoadmaps, savedProgress] = await Promise.all([
        cvDb.getResumes(user.id),
        interviewDb.getSessions(user.id),
        roadmapDb.getRoadmaps(user.id),
        progressDb.getProgress(user.id)
      ]);

      setCvs(fetchedCvs);
      setInterviews(fetchedInterviews);
      setPassports(fetchedPassports);
      setRoadmaps(fetchedRoadmaps);
      
      if (savedProgress) {
        setProgressData(savedProgress);
      }

      calculateStats(fetchedCvs, fetchedInterviews, fetchedPassports, fetchedRoadmaps);
      generateTimeline(fetchedCvs, fetchedInterviews, fetchedPassports, fetchedRoadmaps);
      
    } catch (err) {
      console.error('Error loading progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (c: any[], i: any[], p: any[], r: any[]) => {
    let profileScore = 0;
    if (profile?.fullName) profileScore += 20;
    if (profile?.headline) profileScore += 20;
    if (profile?.about) profileScore += 20;
    if (profile?.skills && profile.skills.length > 0) profileScore += 20;
    if (profile?.portfolioUrl) profileScore += 10;
    if (profile?.linkedinUrl) profileScore += 10;

    setCompletionStats({
      profile: profileScore,
      cv: c.length > 0 ? 100 : 0,
      interview: i.length > 0 ? 100 : (i.length > 0 ? 50 : 0),
      passport: p.length > 0 ? 100 : 0,
      roadmap: r.length > 0 ? 100 : 0,
      overall: Math.round((profileScore + (c.length > 0 ? 100 : 0) + (i.length > 0 ? 100 : 0) + (p.length > 0 ? 100 : 0) + (r.length > 0 ? 100 : 0)) / 5)
    });
  };

  const generateTimeline = (c: any[], i: any[], p: any[], r: any[]) => {
    const events: TimelineEvent[] = [];
    c.forEach(x => events.push({ id: x.id, type: 'cv', title: 'Resume Analyzed', description: 'AI evaluated your resume', date: x.createdAt }));
    i.forEach(x => events.push({ id: x.id, type: 'interview', title: 'Interview Completed', description: 'Completed a mock interview', date: x.date }));
    p.forEach(x => events.push({ id: x.id, type: 'passport', title: 'Skill Passport Updated', description: 'New skills added', date: x.lastUpdated }));
    r.forEach(x => events.push({ id: x.id, type: 'roadmap', title: 'Roadmap Generated', description: 'Created a new career roadmap', date: x.createdAt }));
    
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTimeline(events);
  };

  const handleGenerateInsights = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const insights = await progressGroq.generateInsights(profile, cvs, interviews, passports, roadmaps);
      setScoreDetails(insights.scoreDetails);
      
      const newProgress: CareerProgress = {
        id: progressData?.id || `prog-${Date.now()}`,
        userId: user.id,
        careerScore: insights.careerScore,
        streakInfo: progressData?.streakInfo || {
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date().toISOString()
        },
        achievements: progressData?.achievements || [],
        aiInsights: insights.aiInsights,
        createdAt: progressData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Auto unlock badges
      const achievements = [...newProgress.achievements];
      if (cvs.length > 0 && !achievements.find(a => a.title === 'First Resume')) {
        achievements.push({ id: 'ach-1', title: 'First Resume', description: 'Uploaded first resume', icon: 'FileText', unlockedAt: new Date().toISOString() });
      }
      if (interviews.length > 0 && !achievements.find(a => a.title === 'First Interview')) {
        achievements.push({ id: 'ach-2', title: 'First Interview', description: 'Completed first AI interview', icon: 'Presentation', unlockedAt: new Date().toISOString() });
      }
      newProgress.achievements = achievements;

      await progressDb.saveProgress(newProgress);
      setProgressData(newProgress);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-mono">Loading Progress...</p>
      </div>
    );
  }

  const radarData = scoreDetails ? [
    { subject: 'Communication', A: scoreDetails.communication, fullMark: 100 },
    { subject: 'Technical', A: scoreDetails.technicalSkills, fullMark: 100 },
    { subject: 'Problem Solving', A: scoreDetails.problemSolving, fullMark: 100 },
    { subject: 'Portfolio', A: scoreDetails.portfolio, fullMark: 100 },
    { subject: 'Interview', A: scoreDetails.interview, fullMark: 100 },
    { subject: 'Confidence', A: scoreDetails.confidence, fullMark: 100 },
    { subject: 'Resume', A: scoreDetails.resume, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            AI Career Progress Tracker
          </h2>
          <p className="text-slate-400">Track your verified skills, streaks, and career readiness score.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateInsights} disabled={generating} variant="primary" className="bg-emerald-500 hover:bg-emerald-600 text-white">
            {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
            {generating ? 'Analyzing...' : 'Generate AI Insights'}
          </Button>
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Score & Streak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-emerald-500/20 p-6 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Target className="w-32 h-32 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Career Readiness Score</h3>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-white">{progressData?.careerScore || 0}</span>
                <span className="text-slate-500 mb-1">/100</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant={progressData?.careerScore && progressData.careerScore > 70 ? 'success' : 'warning'}>
                  {progressData?.careerScore && progressData.careerScore > 70 ? 'High Readiness' : 'Needs Improvement'}
                </Badge>
              </div>
            </Card>

            <Card className="bg-slate-900 border-blue-500/20 p-6 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Zap className="w-32 h-32 text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Learning Streak</h3>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-white">{progressData?.streakInfo?.currentStreak || 0}</span>
                <span className="text-slate-500 mb-1">Days</span>
              </div>
              <p className="text-xs text-slate-500 mt-4">Longest streak: {progressData?.streakInfo?.longestStreak || 0} days</p>
            </Card>
          </div>

          {/* AI Insights */}
          {progressData?.aiInsights && (
            <Card className="bg-slate-900 border-white/5 p-6">
               <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                 <BrainCircuit className="w-5 h-5 text-emerald-400" />
                 Groq AI Insights
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <h4 className="text-sm font-bold text-emerald-400 mb-3 uppercase">Strengths</h4>
                   <ul className="space-y-2">
                     {progressData.aiInsights.strengths.map((s, i) => (
                       <li key={i} className="flex gap-2 text-sm text-slate-300">
                         <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                         <span>{s}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
                 
                 <div>
                   <h4 className="text-sm font-bold text-red-400 mb-3 uppercase">Areas to Improve</h4>
                   <ul className="space-y-2">
                     {progressData.aiInsights.weaknesses.map((w, i) => (
                       <li key={i} className="flex gap-2 text-sm text-slate-300">
                         <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                         <span>{w}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>

               <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-800">
                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Next Best Action</h4>
                 <p className="text-emerald-300 text-sm">{progressData.aiInsights.nextBestAction}</p>
               </div>
            </Card>
          )}

          {/* Radar Chart */}
          {radarData.length > 0 && (
            <Card className="bg-slate-900 border-white/5 p-6">
              <h3 className="font-bold text-white mb-6">Skill Dimensions</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} />
                    <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          
          {/* Profile Completion */}
          <Card className="bg-slate-900 border-white/5 p-6">
            <h3 className="font-bold text-white mb-4">Profile Completion</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Overall</span>
                  <span className="text-emerald-400 font-bold">{completionStats.overall}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${completionStats.overall}%` }}></div>
                </div>
              </div>
              
              <div className="pt-2 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500"/> Resume</span>
                  {completionStats.cv > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Badge variant="outline" className="text-[10px]">Missing</Badge>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300 flex items-center gap-2"><Presentation className="w-4 h-4 text-slate-500"/> Interview</span>
                  {completionStats.interview > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Badge variant="outline" className="text-[10px]">Missing</Badge>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300 flex items-center gap-2"><Award className="w-4 h-4 text-slate-500"/> Passport</span>
                  {completionStats.passport > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Badge variant="outline" className="text-[10px]">Missing</Badge>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300 flex items-center gap-2"><Target className="w-4 h-4 text-slate-500"/> Roadmap</span>
                  {completionStats.roadmap > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Badge variant="outline" className="text-[10px]">Missing</Badge>}
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="bg-slate-900 border-white/5 p-6">
            <h3 className="font-bold text-white mb-4">Activity Timeline</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {timeline.length > 0 ? timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                    {i !== timeline.length - 1 && <div className="w-px h-full bg-slate-800 my-1"></div>}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-bold text-slate-200">{event.title}</p>
                    <p className="text-xs text-slate-500">{event.description}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
              )}
            </div>
          </Card>

          {/* Achievements */}
          <Card className="bg-slate-900 border-white/5 p-6">
            <h3 className="font-bold text-white mb-4">Achievements</h3>
            <div className="space-y-3">
              {progressData?.achievements && progressData.achievements.length > 0 ? (
                progressData.achievements.map((ach) => (
                  <div key={ach.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{ach.title}</p>
                      <p className="text-[10px] text-slate-500">{new Date(ach.unlockedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Complete tasks to earn badges!</p>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};
