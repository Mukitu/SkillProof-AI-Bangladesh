// src/components/AiCareerRoadmap.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Map, Target, Loader2, Sparkles, AlertCircle, RefreshCw, 
  Calendar, CheckCircle2, ChevronRight, Download, History,
  Trash2, Briefcase, FileText, Code2, Clock, BookOpen, User, CheckSquare
} from 'lucide-react';
import { Card, Button, Badge } from './UI';
import { cvDb } from '../lib/cvSupabase';
import { interviewDb } from '../lib/interviewSupabase';
import { passportDb } from '../lib/passportSupabase';
import { roadmapDb } from '../lib/roadmapSupabase';
import { growthDb } from '../lib/growthSupabase';
import { roadmapGroq } from '../lib/roadmapGroq';
import { CareerRoadmapData, RoadmapPhase, RoadmapTask } from '../types/roadmap';

interface AiCareerRoadmapProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const AiCareerRoadmap: React.FC<AiCareerRoadmapProps> = ({ onNavigateToTab }) => {
  // ক্যারিয়ার রোডম্যাপ হাব মূল কম্পোনেন্ট (Career Roadmap Main Component)
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [roadmap, setRoadmap] = useState<CareerRoadmapData | null>(null);
  const [history, setHistory] = useState<CareerRoadmapData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [targetCareer, setTargetCareer] = useState('');
  const [activePhase, setActivePhase] = useState<string>('7 Days');
  const [showHistory, setShowHistory] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [compareMode, setCompareMode] = useState<CareerRoadmapData | null>(null);

  const CAREER_OPTIONS = [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Mobile Developer', 'AI Engineer', 'Data Scientist',
    'Cybersecurity Analyst', 'Cloud Engineer', 'UI/UX Designer'
  ];

  // ডাটাবেজ থেকে রোডম্যাপ লোড করা এবং নতুন আপডেট আছে কিনা তা চেক করা
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const allRoadmaps = await roadmapDb.getRoadmaps(user.id);
      setHistory(allRoadmaps);
      
      const data = allRoadmaps.length > 0 ? allRoadmaps[0] : null;
      let needsUpdate = false;
      
      if (!data) {
         // User has no roadmap
      } else {
         const resumes = await cvDb.getResumes(user.id);
         const interviews = await interviewDb.getSessions(user.id);
         const skills = await passportDb.getSkillsByUserId(user.id);
         
         const lastGenTime = new Date(data.lastGenerated).getTime();
         const latestResume = Math.max(0, ...resumes.map(r => new Date(r.updatedAt || r.createdAt || 0).getTime()));
         const latestInterview = Math.max(0, ...interviews.map(i => new Date(i.completedAt || i.createdAt || 0).getTime()));
         const latestSkill = Math.max(0, ...skills.map(s => new Date(s.lastAssessmentDate || 0).getTime()));
         
         const latestChange = Math.max(latestResume, latestInterview, latestSkill);
         if (latestChange > lastGenTime) {
            needsUpdate = true;
         }
         setNeedsUpdate(needsUpdate);
      }

      setRoadmap(data);
      if (needsUpdate && data) {
         // Show a subtle notification that a regeneration is suggested
         // We won't block the UI
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

  // ইউজারের ডেটাবেস ও গ্রক এআই ব্যবহার করে নতুন রোডম্যাপ জেনারেট করা
  const generateNewRoadmap = async (customTarget: string = '') => {
    if (!user) return;
    setGenerating(true);
    setError(null);
    setShowHistory(false);
    try {
      const resumes = await cvDb.getResumes(user.id);
      const interviews = await interviewDb.getSessions(user.id);
      const skills = await passportDb.getSkillsByUserId(user.id);

      const aiData = await roadmapGroq.generateRoadmap(customTarget, user, resumes, interviews, skills);
      
      const newRoadmap: CareerRoadmapData = {
        id: crypto.randomUUID(),
        userId: user.id,
        ...aiData as any,
        lastGenerated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await roadmapDb.saveRoadmap(newRoadmap);
      setRoadmap(newRoadmap);
      setHistory(prev => [newRoadmap, ...prev]);
      setActivePhase('7 Days');
      setNeedsUpdate(false);
      setCompareMode(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // টাস্ক সম্পন্ন মার্ক করা এবং ডাটাবেজে সংরক্ষণ করা
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

  const handleDelete = async (id: string) => {
      if (!user) return;
      await roadmapDb.deleteRoadmap(user.id, id);
      setHistory(prev => prev.filter(r => r.id !== id));
      if (roadmap?.id === id) {
          const rem = history.filter(r => r.id !== id);
          setRoadmap(rem.length > 0 ? rem[0] : null);
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-mono">Loading Career Roadmap...</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <Map className="absolute inset-0 m-auto w-6 h-6 text-emerald-400 animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-display font-bold text-white mb-2">Architecting Your Career Roadmap</h3>
          <p className="text-slate-400 font-mono text-sm max-w-md">Groq AI is designing a multi-phase learning journey tailored to your exact skills and interview history...</p>
        </div>
      </div>
    );
  }

  if (!roadmap && !error) {
     return (
       <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8 border-emerald-500/20 bg-slate-900/50 text-center">
             <Map className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
             <h2 className="text-2xl font-bold text-white mb-4">Generate Your Career Roadmap</h2>
             <p className="text-slate-400 mb-8">We will use your Skill Passport, Resumes, and Interview History to build a personalized 1-year learning plan.</p>
             
             <div className="max-w-md mx-auto mb-8 space-y-4 text-left">
                <label className="block text-sm font-medium text-slate-300">Target Career (Optional)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                   {CAREER_OPTIONS.map(opt => (
                       <Badge 
                         key={opt} 
                         variant={targetCareer === opt ? 'success' : 'outline'}
                         className="cursor-pointer"
                         onClick={() => setTargetCareer(opt)}
                       >
                           {opt}
                       </Badge>
                   ))}
                </div>
                <input 
                  type="text"
                  placeholder="e.g. AI Engineer, Full Stack..."
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white"
                />
             </div>
             
             <Button onClick={() => generateNewRoadmap(targetCareer)} variant="primary" className="w-full md:w-auto">
                 <Sparkles className="w-4 h-4 mr-2" />
                 Generate My Roadmap
             </Button>
          </Card>
       </div>
     );
  }
  
  if (error && !roadmap) {
      return (
        <Card className="text-center py-12 border-red-500/20 bg-red-500/5">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Generation Failed</h3>
          <p className="text-slate-400 text-sm mb-6">{error || "Could not load data."}</p>
          <Button onClick={() => generateNewRoadmap()} variant="primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Generation
          </Button>
        </Card>
      );
  }

  const phaseData = roadmap?.phases.find(p => p.phaseName === activePhase) || roadmap?.phases[0];

  const renderPhaseDetails = (data: RoadmapPhase | undefined, titlePrefix: string = '') => {
    if (!data) return null;
    return (
             <div className="space-y-6 animate-in fade-in duration-300" key={data.id + titlePrefix}>
                <Card className="bg-slate-900 border-white/5 p-6">
                   <div className="flex items-start justify-between mb-4">
                     <div>
                       <Badge variant="outline" className="border-blue-500/30 text-blue-400 mb-2">{data.difficultyLevel}</Badge>
                       <h2 className="text-xl font-bold text-white mb-2">{titlePrefix} {data.phaseName} Goal</h2>
                       <p className="text-slate-300 text-sm">{data.goal}</p>
                     </div>
                     <div className="text-right text-sm font-mono text-slate-400 shrink-0">
                       <Clock className="w-4 h-4 inline mr-1" /> {data.estimatedTime}
                     </div>
                   </div>
                   
                   <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2 text-sm"><Target className="w-4 h-4" /> Skills to Master</h3>
                          <div className="flex flex-wrap gap-2">
                             {data.skillsToLearn?.map(skill => (
                                <span key={skill} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs text-slate-300">{skill}</span>
                             ))}
                          </div>
                        </div>
                        {data.technologies && data.technologies.length > 0 && (
                          <div className="flex-1">
                            <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2 text-sm"><Code2 className="w-4 h-4" /> Technologies</h3>
                            <div className="flex flex-wrap gap-2">
                               {data.technologies.map(tech => (
                                  <span key={tech} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs">{tech}</span>
                               ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {data.topics && data.topics.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-bold text-purple-400 mb-3 flex items-center gap-2 text-sm"><BookOpen className="w-4 h-4" /> Core Topics</h3>
                            <div className="flex flex-wrap gap-2">
                               {data.topics.map(topic => (
                                  <span key={topic} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-xs">{topic}</span>
                               ))}
                            </div>
                        </div>
                      )}
                   </div>
                </Card>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {/* Projects */}
                   <Card className="bg-slate-900 border-white/5 p-6">
                      <h3 className="font-bold text-amber-400 mb-4 flex items-center gap-2 text-sm"><Code2 className="w-4 h-4" /> Portfolio Project</h3>
                      {data.portfolioProject && (
                         <div className="p-4 bg-slate-950 rounded-xl border border-white/5 mb-6">
                            <h4 className="font-bold text-white mb-1 text-sm">{data.portfolioProject.projectName}</h4>
                            <p className="text-xs text-slate-400 mb-3">{data.portfolioProject.description}</p>
                            <div className="text-[10px] text-slate-500 mb-2">Outcome: {data.portfolioProject.expectedOutcome}</div>
                            <div className="flex flex-wrap gap-1">
                               {data.portfolioProject.requiredSkills.map(s => <span key={s} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] rounded font-mono">{s}</span>)}
                            </div>
                         </div>
                      )}
                      
                      <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4" /> Mini Projects</h3>
                      <div className="space-y-3">
                         {data.miniProjects.map((mp, idx) => (
                             <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-white/5">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-slate-200 text-sm">{mp.projectName}</h4>
                                  <span className="text-[9px] font-mono text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">{mp.difficulty}</span>
                                </div>
                                <p className="text-xs text-slate-400">{mp.description}</p>
                             </div>
                         ))}
                      </div>
                   </Card>
                   
                   {/* Learning & Prep */}
                   <div className="space-y-6">
                       <Card className="bg-slate-900 border-white/5 p-6">
                          <h3 className="font-bold text-emerald-400 mb-4 flex items-center gap-2 text-sm"><FileText className="w-4 h-4" /> Practice Tasks</h3>
                          <ul className="space-y-2 text-sm text-slate-300">
                             {data.practiceTasks.map((t, idx) => (
                                 <li key={idx} className="flex gap-2"><ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" /> <span className="text-xs">{t}</span></li>
                             ))}
                          </ul>
                          
                          <h3 className="font-bold text-purple-400 mb-4 mt-6 flex items-center gap-2 text-sm"><User className="w-4 h-4" /> Interview Prep</h3>
                          <ul className="space-y-2 text-sm text-slate-300">
                             {data.interviewPreparation.map((t, idx) => (
                                 <li key={idx} className="flex gap-2"><ChevronRight className="w-4 h-4 text-purple-500 shrink-0" /> <span className="text-xs">{t}</span></li>
                             ))}
                          </ul>
                       </Card>
                       
                       <Card className="bg-slate-900 border-white/5 p-6">
                          <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2 text-sm"><BookOpen className="w-4 h-4" /> Resources</h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                             {data.freeLearningResources.map((res, idx) => (
                                 <a key={idx} href={res.url || '#'} target="_blank" rel="noreferrer" className="block p-3 rounded-lg bg-slate-950 border border-white/5 hover:border-blue-500/30 transition-colors">
                                     <div className="font-bold text-sm text-blue-400 mb-1">{res.title}</div>
                                     <div className="text-[10px] text-slate-500 mb-1">{res.type}</div>
                                     <p className="text-[11px] text-slate-400">{res.reason}</p>
                                 </a>
                             ))}
                          </div>
                       </Card>
                   </div>
                </div>
             </div>
    );
  };

  return (
    <div className="career-roadmap-print-container space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Map className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white font-display">AI Career Roadmap</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Target Career: <span className="text-emerald-400 font-bold">{roadmap?.targetCareer}</span>
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs font-mono text-slate-500">
            <Clock className="w-3 h-3" />
            Last updated: {roadmap && new Date(roadmap.lastGenerated).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => setShowHistory(!showHistory)} variant="outline" className="border-slate-700">
             <History className="w-4 h-4 mr-2" />
             History
           </Button>
           <Button onClick={() => {
               window.print();
           }} variant="outline" className="border-slate-700">
             <Download className="w-4 h-4 mr-2" />
             Export PDF
           </Button>
           <Button onClick={() => generateNewRoadmap(roadmap?.targetCareer)} variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
             <RefreshCw className="w-4 h-4 mr-2" />
             Regenerate
           </Button>
        </div>
      </div>
      
      {/* Update Prompt */}
      <AnimatePresence>
        {needsUpdate && !generating && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
             <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                   <h4 className="font-bold text-blue-400 text-sm">New Data Available</h4>
                   <p className="text-slate-300 text-xs">Your Resume, Skill Passport, or Interview results have been updated. Regenerate your roadmap to reflect these changes.</p>
                </div>
             </div>
             <Button onClick={() => generateNewRoadmap(roadmap?.targetCareer)} variant="primary" size="sm" className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Regenerate Now
             </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {showHistory && (
          <Card className="bg-slate-900 border-white/5 p-6 animate-in slide-in-from-top-4">
              <h3 className="font-bold text-white mb-4">Roadmap History</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                 {history.map(h => (
                     <div key={h.id} className={`p-4 rounded-lg border ${roadmap?.id === h.id ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 bg-slate-950'} flex justify-between items-center`}>
                         <div>
                             <div className="font-bold text-slate-200">{h.targetCareer}</div>
                             <div className="text-xs text-slate-500">{new Date(h.lastGenerated).toLocaleString()}</div>
                         </div>
                         <div className="flex gap-2">
                             {roadmap?.id !== h.id && (
                                 <>
                                 <Button onClick={() => setRoadmap(h)} variant="outline" size="sm" className="text-xs py-1">View</Button>
                             <Button onClick={() => setCompareMode(compareMode?.id === h.id ? null : h)} variant="outline" size="sm" className="text-xs py-1 border-blue-500/30 text-blue-400">Compare</Button>
                                 </>
                             )}
                             <Button onClick={() => handleDelete(h.id)} variant="outline" size="sm" className="text-xs py-1 text-red-400 border-red-500/30 hover:bg-red-500/10"><Trash2 className="w-3 h-3" /></Button>
                         </div>
                     </div>
                 ))}
              </div>
          </Card>
      )}

      {/* Main Roadmap Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar - Navigation & Tasks */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-white/5 p-4">
             <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Timeline</h3>
             <div className="space-y-2">
                {roadmap?.phases.map(p => (
                   <button 
                     key={p.id}
                     onClick={() => setActivePhase(p.phaseName)}
                     className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${activePhase === p.phaseName ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-transparent text-slate-400 hover:bg-slate-800'}`}
                   >
                     {p.phaseName}
                   </button>
                ))}
             </div>
          </Card>
          
          <Card className="bg-slate-900 border-white/5 p-4">
             <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Daily Tasks</h3>
             
             <div className="space-y-6">
               <div>
                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Today</h4>
                 <div className="space-y-2">
                   {roadmap?.dailyTasks.today?.map(task => (
                     <div key={task.id} className="flex items-start gap-2">
                       <button onClick={() => handleTaskToggle('today', task.id)} className={`mt-0.5 shrink-0 w-4 h-4 rounded border ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'}`}>
                         {task.completed && <CheckCircle2 className="w-3 h-3 mx-auto" />}
                       </button>
                       <span className={`text-xs ${task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task.text}</span>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div>
                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Tomorrow</h4>
                 <div className="space-y-2">
                   {roadmap?.dailyTasks.tomorrow?.map(task => (
                     <div key={task.id} className="flex items-start gap-2">
                       <button onClick={() => handleTaskToggle('tomorrow', task.id)} className={`mt-0.5 shrink-0 w-4 h-4 rounded border ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'}`}>
                         {task.completed && <CheckCircle2 className="w-3 h-3 mx-auto" />}
                       </button>
                       <span className={`text-xs ${task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task.text}</span>
                     </div>
                   ))}
                 </div>
               </div>
               <div>
                 <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 mt-4">Weekly Goal</h4>
                 <div className="space-y-2">
                   {roadmap?.dailyTasks.weeklyGoal?.map(task => (
                     <div key={task.id} className="flex items-start gap-2">
                       <button onClick={() => handleTaskToggle('weeklyGoal', task.id)} className={`mt-0.5 shrink-0 w-4 h-4 rounded border ${task.completed ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600'}`}>
                         {task.completed && <CheckCircle2 className="w-3 h-3 mx-auto" />}
                       </button>
                       <span className={`text-xs ${task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task.text}</span>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div>
                 <h4 className="text-xs font-bold text-purple-400 uppercase mb-2 mt-4">Monthly Goal</h4>
                 <div className="space-y-2">
                   {roadmap?.dailyTasks.monthlyGoal?.map(task => (
                     <div key={task.id} className="flex items-start gap-2">
                       <button onClick={() => handleTaskToggle('monthlyGoal', task.id)} className={`mt-0.5 shrink-0 w-4 h-4 rounded border ${task.completed ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-600'}`}>
                         {task.completed && <CheckCircle2 className="w-3 h-3 mx-auto" />}
                       </button>
                       <span className={`text-xs ${task.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task.text}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          </Card>
        </div>
        
        {/* Right Area - Phase Details */}
        <div className="lg:col-span-3">
           {!compareMode ? (
              renderPhaseDetails(phaseData, '')
           ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <div>
                    <h3 className="font-bold text-white mb-4 bg-emerald-500/10 text-emerald-400 p-2 rounded-lg text-center border border-emerald-500/20">Current: {roadmap?.targetCareer}</h3>
                    {renderPhaseDetails(phaseData, '')}
                 </div>
                 <div>
                    <h3 className="font-bold text-white mb-4 bg-blue-500/10 text-blue-400 p-2 rounded-lg text-center border border-blue-500/20">Compare: {compareMode.targetCareer}</h3>
                    {renderPhaseDetails(compareMode.phases.find(p => p.phaseName === activePhase) || compareMode.phases[0], '')}
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};