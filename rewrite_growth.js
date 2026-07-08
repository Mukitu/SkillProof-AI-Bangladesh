import fs from 'fs';

const template = `
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  TrendingUp, Award, BookOpen, Calendar, 
  CheckSquare, Code, MessageSquareText, Shield, 
  Sparkles, Target, Zap, ChevronRight, 
  Loader2, Play, BookOpenCheck, ExternalLink, 
  Clock, Flame, HelpCircle, FileText, ArrowRight, CheckCircle2,
  RefreshCw, Briefcase, Server, ShieldCheck, Map
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, BarChart, Bar, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Card, Button, Badge } from './UI';
import { cvDb } from '../lib/cvSupabase';
import { interviewDb } from '../lib/interviewSupabase';
import { passportDb } from '../lib/passportSupabase';
import { growthDb } from '../lib/growthSupabase';
import { growthGroq } from '../lib/growthGroq';
import { CareerProgressData, TaskItem } from '../types/growth';
import { v4 as uuidv4 } from 'uuid';

interface AiCareerGrowthProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const AiCareerGrowth: React.FC<AiCareerGrowthProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<CareerProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'assistant', text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await growthDb.getCareerProgress(user.id);
      if (data) {
        setProgress(data);
      } else {
        await generateNewProgress();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const generateNewProgress = async () => {
    if (!user) return;
    setGenerating(true);
    setError(null);
    try {
      // Load all user data
      const resumes = await cvDb.getResumes(user.id);
      const interviews = await interviewDb.getSessions(user.id);
      const skills = await passportDb.getSkills(user.id);

      const aiData = await growthGroq.generateCareerProgress(user, resumes, interviews, skills);
      
      const newProgress: CareerProgressData = {
        id: uuidv4(),
        userId: user.id,
        ...aiData as any,
        lastGenerated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await growthDb.saveCareerProgress(newProgress);
      setProgress(newProgress);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleTaskToggle = async (section: keyof CareerProgressData['actionPlan'], taskId: string) => {
    if (!progress) return;
    const newPlan = { ...progress.actionPlan };
    newPlan[section] = newPlan[section].map((t: TaskItem) => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const newProgress = { ...progress, actionPlan: newPlan };
    setProgress(newProgress);
    await growthDb.updateActionPlan(user!.id, newPlan);
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !user || !progress) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const reply = await growthGroq.chat(user, progress, msg);
      setChatMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Error: " + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-mono">Loading Career Growth Hub...</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-emerald-400 animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-display font-bold text-white mb-2">Analyzing Your Career Profile</h3>
          <p className="text-slate-400 font-mono text-sm max-w-md">Groq AI is processing your resumes, interview history, and skill passport to generate a personalized career roadmap...</p>
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <Card className="text-center py-12 border-red-500/20 bg-red-500/5">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Analysis Failed</h3>
        <p className="text-slate-400 text-sm mb-6">{error || "Could not load data."}</p>
        <Button onClick={generateNewProgress} variant="primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Analysis
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white font-display">AI Career Coach</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Personalized career growth plan based on your verified skills and interviews.
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs font-mono text-slate-500">
            <Clock className="w-3 h-3" />
            Last updated: {new Date(progress.lastGenerated).toLocaleString()}
          </div>
        </div>
        <Button onClick={generateNewProgress} variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Career Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-slate-900 border-white/5 text-center">
          <p className="text-slate-400 text-xs mb-1 font-mono uppercase">Overall Score</p>
          <p className="text-3xl font-bold text-emerald-400">{progress.overallScore}</p>
        </Card>
        <Card className="p-4 bg-slate-900 border-white/5 text-center">
          <p className="text-slate-400 text-xs mb-1 font-mono uppercase">Resume Score</p>
          <p className="text-3xl font-bold text-white">{progress.resumeScore}</p>
        </Card>
        <Card className="p-4 bg-slate-900 border-white/5 text-center">
          <p className="text-slate-400 text-xs mb-1 font-mono uppercase">ATS Score</p>
          <p className="text-3xl font-bold text-white">{progress.atsScore}</p>
        </Card>
        <Card className="p-4 bg-slate-900 border-white/5 text-center">
          <p className="text-slate-400 text-xs mb-1 font-mono uppercase">Interview Score</p>
          <p className="text-3xl font-bold text-white">{progress.interviewScore}</p>
        </Card>
        <Card className="p-4 bg-slate-900 border-white/5 text-center">
          <p className="text-slate-400 text-xs mb-1 font-mono uppercase">Skill Score</p>
          <p className="text-3xl font-bold text-white">{progress.skillScore}</p>
        </Card>
        <Card className="p-4 bg-slate-900 border-white/5 text-center">
          <p className="text-slate-400 text-xs mb-1 font-mono uppercase">Profile</p>
          <p className="text-3xl font-bold text-blue-400">{progress.profileCompletion}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Readiness */}
          <Card className="bg-slate-900 border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">Job Readiness</h2>
              </div>
              <Badge variant={progress.jobReadiness === 'Highly Competitive' ? 'success' : 'default'}>
                {progress.jobReadiness}
              </Badge>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{progress.readinessReason}</p>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-emerald-950/20 border-emerald-500/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-md font-bold text-emerald-400">Top Strengths</h3>
              </div>
              <ul className="space-y-3">
                {progress.strengths.slice(0,5).map((s, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-200">{s.name}</span>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">{s.confidence}%</Badge>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-red-950/20 border-red-500/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-red-400" />
                <h3 className="text-md font-bold text-red-400">Areas to Improve</h3>
              </div>
              <ul className="space-y-3">
                {progress.weaknesses.slice(0,5).map((w, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-200">{w.name}</span>
                    <Badge variant="outline" className={\`text-[10px] \${w.priority === 'High' ? 'border-red-500/50 text-red-400' : 'border-orange-500/30 text-orange-400'}\`}>{w.priority}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* AI Suggestions */}
          <Card className="bg-slate-900 border-white/5 p-6">
             <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Personalized AI Coach</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-500" /> Short-term Focus
                </h4>
                <ul className="space-y-2 text-sm text-slate-400 pl-6 list-disc">
                  {progress.aiSuggestions.shortTerm?.map((s,i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500" /> Long-term Goals
                </h4>
                <ul className="space-y-2 text-sm text-slate-400 pl-6 list-disc">
                  {progress.aiSuggestions.longTerm?.map((s,i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          </Card>

          {/* Career Paths */}
          <Card className="bg-slate-900 border-white/5 p-6">
             <div className="flex items-center gap-2 mb-6">
                <Map className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">Suggested Career Paths</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {progress.careerPaths.map((cp, idx) => (
                 <div key={idx} className="p-4 rounded-xl border border-white/5 bg-slate-950">
                    <h3 className="font-bold text-emerald-400 mb-1">{cp.title}</h3>
                    <p className="text-xs text-slate-400 mb-3">{cp.matchReason}</p>
                    <div className="text-[10px] font-mono text-slate-500">
                      Missing: {cp.missingSkills.join(', ')} <br/>
                      Time: {cp.expectedLearningTime}
                    </div>
                 </div>
               ))}
            </div>
          </Card>

           {/* Project Recommendations */}
           <Card className="bg-slate-900 border-white/5 p-6">
             <div className="flex items-center gap-2 mb-6">
                <Code className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Project Recommendations</h2>
            </div>
            <div className="space-y-4">
               {progress.projectRecommendations.map((pr, idx) => (
                 <div key={idx} className="p-4 rounded-xl border border-white/5 bg-slate-950 flex flex-col md:flex-row gap-4 justify-between">
                    <div>
                      <h3 className="font-bold text-slate-200 mb-1 flex items-center gap-2">
                        {pr.title}
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">{pr.difficulty}</Badge>
                      </h3>
                      <p className="text-xs text-slate-400 mb-2">{pr.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {pr.requiredSkills.map(skill => (
                          <span key={skill} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-slate-300">{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right md:text-left mt-2 md:mt-0 text-[10px] font-mono text-slate-500">
                      <Clock className="w-3 h-3 inline mr-1" /> {pr.estimatedTime}
                    </div>
                 </div>
               ))}
            </div>
          </Card>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Action Plan */}
          <Card className="bg-slate-900 border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Action Plan</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Today's Tasks</h4>
                <div className="space-y-2">
                  {progress.actionPlan.today?.map(task => (
                    <div key={task.id} className="flex items-start gap-3">
                      <button onClick={() => handleTaskToggle('today', task.id)} className={\`mt-0.5 shrink-0 w-5 h-5 rounded border \${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 hover:border-emerald-500'}\`}>
                        {task.completed && <CheckCircle2 className="w-4 h-4 mx-auto" />}
                      </button>
                      <span className={\`text-sm \${task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}\`}>{task.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">This Week</h4>
                <div className="space-y-2">
                  {progress.actionPlan.thisWeek?.map(task => (
                    <div key={task.id} className="flex items-start gap-3">
                      <button onClick={() => handleTaskToggle('thisWeek', task.id)} className={\`mt-0.5 shrink-0 w-5 h-5 rounded border \${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 hover:border-emerald-500'}\`}>
                        {task.completed && <CheckCircle2 className="w-4 h-4 mx-auto" />}
                      </button>
                      <span className={\`text-sm \${task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}\`}>{task.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Learning Resources */}
          <Card className="bg-slate-900 border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Resources</h2>
            </div>
            <div className="space-y-3">
              {progress.learningResources.map((res, idx) => (
                <a key={idx} href={res.url || '#'} target="_blank" rel="noreferrer" className="block p-3 rounded-lg bg-slate-950 border border-white/5 hover:border-emerald-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-emerald-400">{res.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </div>
                  <Badge variant="outline" className="text-[9px] mb-2">{res.type}</Badge>
                  <p className="text-[10px] text-slate-400">{res.reason}</p>
                </a>
              ))}
            </div>
          </Card>

          {/* AI Chat Coach */}
          <Card className="bg-slate-900 border-white/5 p-0 overflow-hidden flex flex-col" style={{ height: '400px' }}>
            <div className="p-4 border-b border-white/5 bg-slate-950/50 flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white">AI Coach Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-slate-300">
                Hi {user?.fullName}! I'm your AI Career Coach. Ask me anything about your roadmap, resume, or skills.
              </div>
              {chatMessages.map((msg, i) => (
                <div key={i} className={\`p-3 rounded-lg text-sm \${msg.role === 'user' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-100 ml-4' : 'bg-slate-800 border border-white/5 text-slate-300 mr-4'}\`}>
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Coach is thinking...
                </div>
              )}
            </div>
            <div className="p-3 border-t border-white/5 bg-slate-950/50">
              <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
                <Button type="submit" disabled={!chatInput.trim() || chatLoading} className="px-3">
                  <Play className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};
`
fs.writeFileSync('src/components/AiCareerGrowth.tsx', template);
console.log('AiCareerGrowth updated.');
