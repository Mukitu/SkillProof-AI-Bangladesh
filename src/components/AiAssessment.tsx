import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Code2, Terminal, ArrowRight, Clock, Sparkles, 
  RefreshCw, X, ChevronRight, ChevronDown, CheckCircle2, AlertTriangle, 
  BookOpen, FileCode, Award, Trash2, Plus, Download, Search, 
  Briefcase, History, BarChart3, Play, Check, CheckSquare, Github, 
  ExternalLink, FileSpreadsheet, Eye, Info, HelpCircle, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend 
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge } from './UI';
import { assessmentDb } from '../lib/assessmentSupabase';
import { assessmentGroq } from '../lib/assessmentGroq';
import { 
  AssessmentRecord, PracticalQuestion, ProjectChallenge, 
  AssessmentDifficulty, AssessmentFeedback, AssessmentScore 
} from '../types/assessment';
import { cvDb } from '../lib/cvSupabase';

export const AiAssessment: React.FC<{ onBack: () => void; onUpdate?: () => void }> = ({ onBack, onUpdate }) => {
  const { isBn, t } = useLanguage();
  const { user } = useAuth();

  // Navigation states
  const [activeSubTab, setActiveSubTab] = useState<'assess' | 'history' | 'compare'>('assess');
  
  // Selection states
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'practical' | 'project'>('practical');
  const [difficulty, setDifficulty] = useState<AssessmentDifficulty>('Beginner');
  const [projectDuration, setProjectDuration] = useState<string>('24 Hours');

  // Load user CV and skills
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userCareerPath, setUserCareerPath] = useState<string>('Software Engineer');
  const [cvContextText, setCvContextText] = useState<string>('');
  const [loadingContext, setLoadingContext] = useState(true);

  // Active Assessment States
  const [isOngoing, setIsOngoing] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState<AssessmentRecord | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [editorCode, setEditorCode] = useState<string>('');
  const [lineNumbers, setLineNumbers] = useState<number[]>([1]);
  
  // Submission fields for Project Mode
  const [zipFileName, setZipFileName] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [demoUrl, setDemoUrl] = useState<string>('');
  const [projectDocs, setProjectDocs] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Action / loading states
  const [generatingChallenge, setGeneratingChallenge] = useState(false);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(false);
  const [historyList, setHistoryList] = useState<AssessmentRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewingPastResult, setViewingPastResult] = useState<AssessmentRecord | null>(null);
  const [showHints, setShowHints] = useState(false);
  
  // Comparison state
  const [selectedHistoryForCompare, setSelectedHistoryForCompare] = useState<string[]>([]);

  // Search/Filter in History
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');

  // Fallback default skills list
  const fallbackSkills = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 
    'Python', 'SQL', 'Java', 'C++', 'UI/UX', 'System Design'
  ];

  // Load User Context & History on Mount
  useEffect(() => {
    const fetchUserContextAndHistory = async () => {
      if (!user) return;
      setLoadingContext(true);
      try {
        // Fetch CV
        const resumes = await cvDb.getResumes(user.id);
        if (resumes && resumes.length > 0) {
          const latestCv = resumes[0];
          const tech = latestCv.skills?.technicalSkills || [];
          const soft = latestCv.skills?.softSkills || [];
          const allSkills = Array.from(new Set([...tech, ...soft]));
          setUserSkills(allSkills.length > 0 ? allSkills : fallbackSkills);
          
          if (latestCv.careerSummary) {
            setCvContextText(`
              Career Summary: ${latestCv.careerSummary}
              Experience: ${latestCv.experience?.map((e: any) => `${e.role} at ${e.company}`).join(', ')}
              Projects: ${latestCv.projects?.map((p: any) => `${p.title}: ${p.description}`).join(', ')}
            `);
          }
        } else {
          setUserSkills(user.skills && user.skills.length > 0 ? user.skills : fallbackSkills);
          setCvContextText(`User Skills: ${user.skills?.join(', ') || 'None'}`);
        }

        // Fetch History
        await loadHistory();
      } catch (err) {
        console.error('Error fetching context:', err);
        setUserSkills(fallbackSkills);
      } finally {
        setLoadingContext(false);
      }
    };

    fetchUserContextAndHistory();
  }, [user]);

  // Load History Function
  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const records = await assessmentDb.getAssessmentsByUserId(user.id);
      setHistoryList(records);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Timer Countdown / Countup
  useEffect(() => {
    let interval: any = null;
    if (isOngoing && activeAssessment) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (activeAssessment.type === 'project') {
            // For project-based, we count down if there's a limit, or count up.
            // Let's count up elapsed time for progress.
            return prev + 1;
          } else {
            // Practical mode - count up elapsed time
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isOngoing, activeAssessment]);

  // Handle editor code modifications to sync line numbers
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditorCode(val);
    const lines = val.split('\n').length;
    setLineNumbers(Array.from({ length: Math.max(1, lines) }, (_, i) => i + 1));
  };

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Calculate Adaptive Difficulty on Skill Change
  const handleSkillChange = async (skill: string) => {
    setSelectedSkill(skill);
    if (!user) return;
    const computedDiff = await assessmentDb.calculateDifficulty(user.id, skill);
    setDifficulty(computedDiff);
  };

  // 1. START ASSESSMENT
  const handleStartAssessment = async () => {
    if (!selectedSkill) return;
    if (!user) return;

    setGeneratingChallenge(true);
    try {
      const newId = `AS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      let questionData: PracticalQuestion | null = null;
      let projectData: ProjectChallenge | null = null;
      let title = '';

      if (selectedMode === 'practical') {
        questionData = await assessmentGroq.generatePracticalQuestion(
          selectedSkill,
          userCareerPath,
          difficulty,
          cvContextText
        );
        title = questionData.question;
        setEditorCode(questionData.initialCode || '');
        // Set line numbers
        const lines = (questionData.initialCode || '').split('\n').length;
        setLineNumbers(Array.from({ length: Math.max(1, lines) }, (_, i) => i + 1));
      } else {
        projectData = await assessmentGroq.generateProjectChallenge(
          selectedSkill,
          userCareerPath,
          difficulty,
          cvContextText
        );
        title = projectData.title;
        // Clean submission states
        setZipFileName('');
        setGithubUrl('');
        setDemoUrl('');
        setProjectDocs('');
      }

      const newRecord: AssessmentRecord = {
        id: newId,
        userId: user.id,
        type: selectedMode,
        skill: selectedSkill,
        difficulty,
        title,
        status: 'ongoing',
        duration: selectedMode === 'project' ? projectDuration : 'Ongoing',
        createdAt: new Date().toISOString(),
        trustScore: 100,
        questionData,
        projectData,
        scores: null,
        feedback: null
      };

      await assessmentDb.saveAssessment(newRecord);
      setActiveAssessment(newRecord);
      setTimerSeconds(0);
      setIsOngoing(true);
      setShowHints(false);
    } catch (err) {
      console.error('Error starting assessment:', err);
    } finally {
      setGeneratingChallenge(false);
    }
  };

  // 2. SUBMIT SOLUTION
  const handleSubmitAssessment = async () => {
    if (!activeAssessment || !user) return;

    setEvaluatingSubmission(true);
    try {
      let evaluation: { scores: AssessmentScore; feedback: AssessmentFeedback; trustScore: number };
      const completedTime = new Date().toISOString();
      const elapsedDurationStr = formatTime(timerSeconds);

      if (activeAssessment.type === 'practical') {
        evaluation = await assessmentGroq.evaluatePracticalSubmission(
          activeAssessment.questionData!,
          editorCode
        );

        // Update record
        const updatedRecord: AssessmentRecord = {
          ...activeAssessment,
          status: evaluation.scores.overallScore >= 60 ? 'completed' : 'failed',
          completedAt: completedTime,
          duration: elapsedDurationStr,
          userSolutionCode: editorCode,
          trustScore: evaluation.trustScore,
          scores: evaluation.scores,
          feedback: evaluation.feedback
        };

        await assessmentDb.updateAssessment(activeAssessment.id, updatedRecord);
        
        // Sync to passport & issue badge if passed
        if (evaluation.scores.overallScore >= 60) {
          await assessmentDb.syncPassportAndBadges(
            user.id,
            activeAssessment.skill,
            evaluation.scores.overallScore,
            user
          );
        }

        setViewingPastResult(updatedRecord);
      } else {
        // Project mode
        if (!zipFileName && !githubUrl) {
          alert(isBn ? 'অনুগ্রহ করে প্রজেক্ট ফাইল (.zip) অথবা গিটহাব লিংক সাবমিট করুন।' : 'Please upload a ZIP file or provide a GitHub repository URL.');
          setEvaluatingSubmission(false);
          return;
        }

        evaluation = await assessmentGroq.evaluateProjectSubmission(
          activeAssessment.projectData!,
          {
            zipName: zipFileName || undefined,
            githubUrl: githubUrl || undefined,
            demoUrl: demoUrl || undefined,
            documentation: projectDocs || undefined
          }
        );

        const updatedRecord: AssessmentRecord = {
          ...activeAssessment,
          status: evaluation.scores.overallScore >= 60 ? 'completed' : 'failed',
          completedAt: completedTime,
          duration: elapsedDurationStr,
          submittedZipName: zipFileName || undefined,
          submittedGithubUrl: githubUrl || undefined,
          submittedDemoUrl: demoUrl || undefined,
          submittedDocumentation: projectDocs || undefined,
          trustScore: evaluation.trustScore,
          scores: evaluation.scores,
          feedback: evaluation.feedback
        };

        await assessmentDb.updateAssessment(activeAssessment.id, updatedRecord);

        // Sync to passport & issue badge if passed
        if (evaluation.scores.overallScore >= 60) {
          await assessmentDb.syncPassportAndBadges(
            user.id,
            activeAssessment.skill,
            evaluation.scores.overallScore,
            user
          );
        }

        setViewingPastResult(updatedRecord);
      }

      // Cleanup active states
      setIsOngoing(false);
      setActiveAssessment(null);
      await loadHistory();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error submitting assessment:', err);
    } finally {
      setEvaluatingSubmission(false);
    }
  };

  // 3. RETAKE / DISCARD ONGOING
  const handleDiscardOngoing = () => {
    if (confirm(isBn ? 'আপনি কি সত্যিই পরীক্ষাটি বাতিল করতে চান? এতে কোনো রেকর্ড সংরক্ষিত হবে না।' : 'Are you sure you want to discard this assessment? No progress will be saved.')) {
      setIsOngoing(false);
      setActiveAssessment(null);
    }
  };

  // 4. DELETE PAST ASSESSMENT RECORD
  const handleDeletePastRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(isBn ? 'আপনি কি নিশ্চিত যে এই অ্যাসেসমেন্ট হিস্ট্রি রেকর্ডটি ডিলিট করতে চান?' : 'Are you sure you want to delete this assessment history record?')) {
      await assessmentDb.deleteAssessment(id);
      if (viewingPastResult?.id === id) setViewingPastResult(null);
      await loadHistory();
    }
  };

  // Drag & drop file management
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        setZipFileName(file.name);
      } else {
        alert(isBn ? 'শুধুমাত্র .zip ফাইল আপলোড করুন!' : 'Only ZIP files are supported!');
      }
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        setZipFileName(file.name);
      } else {
        alert(isBn ? 'শুধুমাত্র .zip ফাইল আপলোড করুন!' : 'Only ZIP files are supported!');
      }
    }
  };

  // Compare Checkbox Helper
  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHistoryForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 3) {
          alert(isBn ? 'সর্বোচ্চ ৩টি অ্যাসেসমেন্ট তুলনা করা সম্ভব!' : 'You can compare up to 3 assessments!');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Download Report Helper
  const handleDownloadReport = (record: AssessmentRecord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(record, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Assessment-Report-${record.skill}-${record.id}.json`);
    dlAnchorElem.click();
  };

  // Filter history records
  const getFilteredHistory = () => {
    return historyList.filter(item => {
      const matchesSearch = item.skill.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
                            item.title.toLowerCase().includes(historySearchQuery.toLowerCase());
      const matchesType = historyTypeFilter === 'all' || item.type === historyTypeFilter;
      return matchesSearch && matchesType;
    });
  };

  // Prepare comparison chart data
  const getComparisonData = () => {
    const itemsToCompare = historyList.filter(h => selectedHistoryForCompare.includes(h.id));
    return itemsToCompare.map(item => ({
      name: `${item.skill} (${item.difficulty})`,
      'Overall Score': item.scores?.overallScore || 0,
      'Logic Score': item.scores?.logicScore || 0,
      'Quality Score': item.scores?.codeQualityScore || 0,
      'Performance': item.scores?.performanceScore || 0,
      'Security': item.scores?.securityScore || 0
    }));
  };

  return (
    <div className="flex flex-col gap-6" id="ai-assessment-hub">
      {/* 1. Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-200 dark:border-white/5 gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-emerald-500" />
            {isBn ? 'এআই স্কিল অ্যাসেসমেন্ট সেন্টার' : 'AI Skill Assessment Center'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isBn ? 'আপনার প্রোফাইল, রেজুমে এবং ক্যারিয়ার গোল অনুযায়ী জেনারেট করা রিয়েল-ওয়ার্ল্ড টেস্ট ভেরিফিকেশন ইঞ্জিন।' : 'Verify your expertise with adaptive, dynamic workspace challenges evaluated by Groq AI.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isOngoing && (
            <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-xl flex gap-1 border border-slate-200 dark:border-white/5">
              <button 
                onClick={() => { setActiveSubTab('assess'); setViewingPastResult(null); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'assess' && !viewingPastResult ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {isBn ? 'মূল্যায়ন শুরু' : 'Assess Skills'}
              </button>
              <button 
                onClick={() => { setActiveSubTab('history'); setViewingPastResult(null); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'history' && !viewingPastResult ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <History className="w-3.5 h-3.5" />
                {isBn ? 'মূল্যায়ন ইতিহাস' : 'History'}
                {historyList.length > 0 && (
                  <span className="bg-emerald-500 text-white dark:text-slate-950 px-1.5 py-0.2 text-[9px] rounded-full font-bold">
                    {historyList.length}
                  </span>
                )}
              </button>
              {historyList.length > 1 && (
                <button 
                  onClick={() => { setActiveSubTab('compare'); setViewingPastResult(null); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'compare' && !viewingPastResult ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  {isBn ? 'পারফরম্যান্স তুলনা' : 'Compare'}
                </button>
              )}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onBack}>
            {isBn ? 'ফিরুন' : 'Back'}
          </Button>
        </div>
      </div>

      {/* 2. MAIN ACTIVE ONGOING WORKSPACE (MODE 1 / MODE 2) */}
      {isOngoing && activeAssessment ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workspace Sidepanel Header */}
          <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 rounded-2xl gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-xl font-bold font-mono">
                {activeAssessment.type === 'practical' ? <Code2 className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">
                  {activeAssessment.type === 'practical' ? (isBn ? 'কোডিং অ্যাসেসমেন্ট' : 'PRACTICAL CODING') : (isBn ? 'প্রজেক্ট অ্যাসেসমেন্ট' : 'PROJECT CHALLENGE')}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                  {activeAssessment.skill} • {activeAssessment.difficulty}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2 bg-slate-200/50 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-300/30 dark:border-white/5">
                <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                  {formatTime(timerSeconds)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDiscardOngoing}>
                  {isBn ? 'বাতিল' : 'Discard'}
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleSubmitAssessment} 
                  isLoading={evaluatingSubmission}
                >
                  <Sparkles className="w-4 h-4" />
                  {isBn ? 'মূল্যায়ন করুন' : 'Submit Exam'}
                </Button>
              </div>
            </div>
          </div>

          {/* Mode 1 Layout: Split View Screen */}
          {activeAssessment.type === 'practical' && activeAssessment.questionData && (
            <>
              {/* Left Column: Specs, requirements, problem statement */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <Card className="p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 flex flex-col gap-4">
                  <div>
                    <Badge variant="brand" className="mb-2">{activeAssessment.difficulty}</Badge>
                    <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                      {activeAssessment.questionData.question}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {isBn ? 'আনুমানিক সময়:' : 'Estimated Time:'} {activeAssessment.questionData.estimatedTime}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex flex-col gap-3">
                    <h5 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                      {isBn ? 'সমস্যা বিবরণী (Problem Statement)' : 'Problem Statement'}
                    </h5>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                      {activeAssessment.questionData.problemStatement}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex flex-col gap-2">
                    <h5 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                      {isBn ? 'প্রয়োজনীয় শর্তসমূহ (Requirements)' : 'Requirements'}
                    </h5>
                    <ul className="flex flex-col gap-2">
                      {activeAssessment.questionData.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex flex-col gap-2">
                    <h5 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                      {isBn ? 'আকাঙ্ক্ষিত আউটপুট (Expected Output)' : 'Expected Output'}
                    </h5>
                    <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-300 whitespace-pre-wrap">
                      {activeAssessment.questionData.expectedOutput}
                    </div>
                  </div>

                  {activeAssessment.questionData.constraints && activeAssessment.questionData.constraints.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex flex-col gap-2">
                      <h5 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                        {isBn ? 'সীমাবদ্ধতা (Constraints)' : 'Constraints'}
                      </h5>
                      <ul className="flex flex-col gap-1.5">
                        {activeAssessment.questionData.constraints.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeAssessment.questionData.hints && activeAssessment.questionData.hints.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                      <button 
                        onClick={() => setShowHints(!showHints)}
                        className="text-xs font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>{showHints ? (isBn ? 'ইঙ্গিত লুকান' : 'Hide Hint') : (isBn ? 'ইঙ্গিত দেখুন' : 'Reveal Hint')}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHints ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {showHints && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium"
                          >
                            {activeAssessment.questionData.hints.join(' ')}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column: Dynamic Code IDE Workspace */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <Card className="p-0 bg-[#09090b] border border-slate-800 rounded-2xl overflow-hidden flex flex-col flex-grow min-h-[500px]">
                  {/* IDE bar */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f0f13] border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold font-mono text-slate-300">
                        main.{activeAssessment.questionData.language === 'javascript' ? 'js' : activeAssessment.questionData.language === 'typescript' ? 'ts' : activeAssessment.questionData.language === 'sql' ? 'sql' : 'py'}
                      </span>
                    </div>
                    <Badge variant="brand" className="font-mono uppercase text-[9px] bg-slate-800 text-slate-300 border-none">
                      {activeAssessment.questionData.language}
                    </Badge>
                  </div>

                  {/* Editor Code Area */}
                  <div className="flex-grow flex relative font-mono text-xs overflow-hidden">
                    {/* Line numbers gutter */}
                    <div className="bg-[#0b0b0e] text-slate-600 text-right pr-3 pl-4 py-4 select-none border-r border-slate-900 flex flex-col min-w-[3.5rem]">
                      {lineNumbers.map(line => (
                        <div key={line} className="h-[20px] leading-[20px]">
                          {line}
                        </div>
                      ))}
                    </div>

                    {/* Textarea Input overlaying rendering */}
                    <textarea
                      value={editorCode}
                      onChange={handleEditorChange}
                      className="flex-grow bg-transparent text-[#e4e4e7] p-4 font-mono text-xs focus:outline-none resize-none overflow-y-auto leading-[20px] h-full min-h-[400px] w-full"
                      spellCheck={false}
                      placeholder={isBn ? 'আপনার কোড এখানে লিখুন...' : 'Write your code implementation here...'}
                    />
                  </div>

                  {/* IDE Status Footer */}
                  <div className="bg-[#0f0f13] border-t border-slate-900 px-4 py-2 flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <div>
                      <span>UTF-8</span>
                    </div>
                    <div>
                      <span>Tab Size: 2 Spaces</span>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* Mode 2 Layout: Project Challenge Workspace */}
          {activeAssessment.type === 'project' && activeAssessment.projectData && (
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Project challenge specification details */}
              <Card className="p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="brand">{activeAssessment.difficulty}</Badge>
                    <Badge variant="info">{isBn ? 'প্রিমিয়াম প্রজেক্ট' : 'Premium Mini-Project'}</Badge>
                  </div>
                  <h4 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                    {activeAssessment.projectData.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                    {activeAssessment.projectData.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                  <h5 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 mb-3">
                    {isBn ? 'প্রধান ফিচারসমূহ (Required Features)' : 'Required Features'}
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeAssessment.projectData.features.map((feat, i) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span className="h-5 w-5 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0">
                          {i+1}
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                  <h5 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 mb-3">
                    {isBn ? 'প্রযুক্তিগত প্রয়োজনীয়তা (Tech Requirements)' : 'Tech Requirements'}
                  </h5>
                  <ul className="flex flex-col gap-2">
                    {activeAssessment.projectData.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                  <h5 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 mb-2">
                    {isBn ? 'মূল্যায়ন মানদণ্ড (Evaluation Criteria)' : 'Evaluation Criteria'}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {activeAssessment.projectData.evaluationCriteria.map((cri, i) => (
                      <span key={i} className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 px-2.5 py-1 text-[10px] rounded-lg font-bold border border-slate-200 dark:border-white/5">
                        {cri}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Project Solution Upload Portal Form */}
              <Card className="p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 flex flex-col gap-6">
                <div>
                  <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    {isBn ? 'প্রজেক্ট সাবমিশন পোর্টাল' : 'Project Submission Portal'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {isBn ? 'আপনার লোকাল ডেভেলপমেন্ট প্রজেক্ট ফাইল (.zip) এবং গিটহাব লিংক সাবমিট করুন।' : 'Submit your local workspace project credentials below for AI CTO review.'}
                  </p>
                </div>

                {/* Drag and Drop Zip uploader */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-200 dark:border-white/5 hover:border-emerald-500/50'}`}
                >
                  <input 
                    type="file" 
                    id="project-zip-upload" 
                    className="hidden" 
                    accept=".zip" 
                    onChange={handleManualFileSelect}
                  />
                  <label htmlFor="project-zip-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-full">
                      <FileCode className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {zipFileName ? zipFileName : (isBn ? 'প্রজেক্ট জিপ ফাইল (.zip) ড্র্যাগ অ্যান্ড ড্রপ বা ক্লিক করে আপলোড করুন' : 'Drag & drop project ZIP or click to browse')}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {zipFileName ? (isBn ? 'আরেকটি ফাইল নির্বাচন করতে ক্লিক করুন' : 'Click to choose another file') : (isBn ? 'সর্বোচ্চ সাইজ: ৩০ মেগাবাইট' : 'Maximum file size: 30MB')}
                      </p>
                    </div>
                  </label>
                </div>

                {/* GitHub URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Github className="w-4 h-4" />
                    <span>{isBn ? 'গিটহাব রিপোজিটরি লিংক (GitHub Repository)' : 'GitHub Repository URL'}</span>
                  </label>
                  <input 
                    type="url"
                    placeholder="https://github.com/username/project-repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Demo URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4" />
                    <span>{isBn ? 'লাইভ ডেমো লিংক (ঐচ্ছিক)' : 'Live Demo URL (Optional)'}</span>
                  </label>
                  <input 
                    type="url"
                    placeholder="https://my-live-demo.vercel.app"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Readme documentation notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {isBn ? 'প্রজেক্ট ডক্স / আর্কিটেকচার নোটস (README Documentation)' : 'Project Documentation / Architecture Notes'}
                  </label>
                  <textarea
                    placeholder={isBn ? 'আপনার প্রজেক্ট আর্কিটেকচার, ডেটাবেস ডিজাইন এবং এপিআই এন্ডপয়েন্ট সম্পর্কে সংক্ষিপ্ত নোট লিখুন...' : 'Outline your software layout, routing designs, modules, or key helper logic details...'}
                    value={projectDocs}
                    onChange={(e) => setProjectDocs(e.target.value)}
                    className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono h-28 resize-none"
                  />
                </div>
              </Card>

            </div>
          )}
        </div>
      ) : viewingPastResult ? (
        /* 3. DETAILED AI EVALUATION & PORTAL SCREEN */
        <div className="flex flex-col gap-6">
          {/* Top Panel Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-6 rounded-2xl gap-4">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${viewingPastResult.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {viewingPastResult.status === 'completed' ? <Award className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={viewingPastResult.status === 'completed' ? 'brand' : 'danger'}>
                    {viewingPastResult.status === 'completed' ? (isBn ? 'উত্তীর্ণ' : 'PASSED') : (isBn ? 'অনুত্তীর্ণ' : 'FAILED')}
                  </Badge>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    ID: {viewingPastResult.id}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                  {viewingPastResult.skill} {isBn ? 'দক্ষতা যাচাই' : 'Expertise Verification'} • {viewingPastResult.difficulty}
                </h3>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
              <Button variant="outline" size="sm" onClick={() => handleDownloadReport(viewingPastResult)}>
                <Download className="w-4 h-4" />
                {isBn ? 'রিপোর্ট ডাউনলোড' : 'Download Report'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingPastResult(null)}>
                {isBn ? 'তালিকায় ফিরুন' : 'Back to List'}
              </Button>
            </div>
          </div>

          {/* Scoring Visual Matrix Breakdown & Metrics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual Metrics card */}
            <Card className="lg:col-span-5 p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 flex flex-col gap-6 items-center justify-center">
              <div className="w-full">
                <h4 className="font-display font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 text-center md:text-left">
                  {isBn ? 'মূল্যায়ন স্কোর ম্যাট্রিক্স' : 'Evaluation Score Matrix'}
                </h4>
              </div>

              {/* Huge dynamic circular progress indicator */}
              <div className="relative h-40 w-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    stroke="rgba(16, 185, 129, 0.05)" 
                    strokeWidth="12" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    stroke="#10b981" 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * (viewingPastResult.scores?.overallScore || 0)) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                    {viewingPastResult.scores?.overallScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    {isBn ? 'ওভারঅল স্কোর' : 'OVERALL'}
                  </span>
                </div>
              </div>

              {/* Sub-scores breakdown list */}
              <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-6 font-sans">
                {viewingPastResult.scores && Object.entries(viewingPastResult.scores).map(([key, val]) => {
                  if (key === 'overallScore' || val === undefined) return null;
                  // Human Readable keys
                  const label = key.replace('Score', '').replace(/^[a-z]/, c => c.toUpperCase());
                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">{label}</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Anti-plagiarism Trust score badge */}
              <div className="w-full bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  {isBn ? 'সততা ও বিশ্বাসযোগ্যতা রেটিং:' : 'Submission Integrity Score:'}
                </span>
                <span className="font-mono font-bold text-emerald-500">
                  {viewingPastResult.trustScore}%
                </span>
              </div>
            </Card>

            {/* AI Detailed Audit Accordions */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Strengths and weaknesses panel */}
              {viewingPastResult.feedback && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <Card className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col gap-3">
                    <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {isBn ? 'সবল দিকসমূহ (Strong Points)' : 'Strong Points'}
                    </h5>
                    <ul className="flex flex-col gap-2">
                      {viewingPastResult.feedback.strongPoints.map((p, i) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed flex gap-1.5 items-start">
                          <span className="text-emerald-500 font-bold shrink-0">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  {/* Room for growth */}
                  <Card className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col gap-3">
                    <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      {isBn ? 'দুর্বল দিকসমূহ (Room for Growth)' : 'Room for Growth'}
                    </h5>
                    <ul className="flex flex-col gap-2">
                      {viewingPastResult.feedback.weakPoints.map((p, i) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed flex gap-1.5 items-start">
                          <span className="text-amber-500 font-bold shrink-0">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              )}

              {/* Structured Feedbacks Tabs */}
              {viewingPastResult.feedback && (
                <Card className="p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 flex flex-col gap-4 font-sans">
                  
                  {/* Code review continuous narrative paragraph */}
                  <div className="flex flex-col gap-2">
                    <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                      {isBn ? 'এআই কোড রিভিউ ও আর্কিটেকচার অডিট' : 'AI Code Review & Architecture Audit'}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                      {viewingPastResult.feedback.codeReview}
                    </p>
                  </div>

                  {/* Alternative solutions / recommendation codeblock */}
                  {viewingPastResult.feedback.alternativeSolution && (
                    <div className="flex flex-col gap-2 mt-2">
                      <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                        {isBn ? 'উৎকৃষ্ট বিকল্প সমাধান ধারা (Optimized Alternative)' : 'Optimized Alternative Approach'}
                      </h5>
                      <div className="bg-[#09090b] border border-slate-800 rounded-xl p-4 text-xs font-mono text-[#e4e4e7] overflow-x-auto whitespace-pre">
                        {viewingPastResult.feedback.alternativeSolution}
                      </div>
                    </div>
                  )}

                  {/* Guidelines Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
                    <div className="flex flex-col gap-2">
                      <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                        {isBn ? 'পারফরম্যান্স টিপস' : 'Performance optimization'}
                      </h5>
                      <ul className="flex flex-col gap-1.5">
                        {viewingPastResult.feedback.performanceSuggestions.map((s, i) => (
                          <li key={i} className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex gap-1.5 items-start">
                            <span className="text-emerald-500 font-bold shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                        {isBn ? 'নিরাপত্তা সংক্রান্ত নির্দেশনা' : 'Security Best Practices'}
                      </h5>
                      <ul className="flex flex-col gap-1.5">
                        {viewingPastResult.feedback.securitySuggestions.map((s, i) => (
                          <li key={i} className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex gap-1.5 items-start">
                            <span className="text-red-500 font-bold shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Resources & Next concepts */}
                  <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                        {isBn ? 'পরবর্তী টার্গেট এবং সুপারিশমালা' : 'Next concepts to learn'}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold">
                        {viewingPastResult.feedback.nextRecommendation}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {viewingPastResult.feedback.learningResources.map((link, i) => (
                        <span key={i} className="bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 rounded-lg px-2 py-1 text-[10px] font-bold">
                          {link}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Study Focus Recommendation Plan */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mt-2">
                    <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono tracking-wider">
                      {isBn ? 'এআই স্টাডি ফোকাস প্ল্যান (AI Study Focus Plan)' : 'AI Study Focus Plan'}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-emerald-300 mt-1.5 leading-relaxed font-medium">
                      {viewingPastResult.feedback.improvementPlan}
                    </p>
                  </div>
                </Card>
              )}

            </div>
          </div>
        </div>
      ) : activeSubTab === 'compare' ? (
        /* 4. PERFORMANCE COMPARISON INSIGHTS VIEW */
        <div className="flex flex-col gap-6 font-sans">
          <Card className="p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 flex flex-col gap-6">
            <div>
              <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                {isBn ? 'পারফরম্যান্স প্রগ্রেস চার্ট' : 'Performance Progress Chart'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isBn ? 'আপনার সিলেক্ট করা স্কিল অ্যাসেসমেন্ট সমূহের তুলনামূলক গ্রাফিক্যাল ভিউ।' : 'A comparative breakdown across selected skill metrics to assess domain coverage.'}
              </p>
            </div>

            {selectedHistoryForCompare.length < 2 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <BarChart3 className="w-12 h-12 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {isBn ? 'তুলনা শুরু করতে ইতিহাস পেইজ থেকে কমপক্ষে ২টি অ্যাসেসমেন্ট সিলেক্ট করুন।' : 'Please check at least 2 assessments in the History tab to compare them.'}
                </p>
                <Button variant="outline" size="sm" onClick={() => setActiveSubTab('history')}>
                  {isBn ? 'ইতিহাস পেইজে যান' : 'Go to History'}
                </Button>
              </div>
            ) : (
              <>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getComparisonData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" fontSize={10} stroke="#64748b" />
                      <YAxis domain={[0, 100]} fontSize={10} stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#090909', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '12px' 
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="Overall Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Logic Score" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Quality Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Performance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-white/5 pt-6">
                  {historyList.filter(h => selectedHistoryForCompare.includes(h.id)).map(item => (
                    <Card key={item.id} className="p-4 bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="brand">{item.difficulty}</Badge>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">{item.skill}</h5>
                        </div>
                        <span className="font-mono font-bold text-lg text-emerald-500">{item.scores?.overallScore}%</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <p>{isBn ? 'টাইপ:' : 'Type:'} {item.type === 'practical' ? (isBn ? 'কোডিং প্রাকটিক্যাল' : 'Coding Practical') : (isBn ? 'প্রজেক্ট' : 'Project-Based')}</p>
                        <p className="mt-1">{isBn ? 'সম্পন্ন সময়:' : 'Completed At:'} {new Date(item.completedAt || '').toLocaleDateString()}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setViewingPastResult(item)}>
                        {isBn ? 'বিশদ বিবরণ দেখুন' : 'View Full Feedback'}
                      </Button>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      ) : activeSubTab === 'history' ? (
        /* 5. HISTORIC LOG LIST & ARCHIVE */
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder={isBn ? 'স্কিল বা টাইটেল দিয়ে খুঁজুন...' : 'Search assessments...'}
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end">
              <select 
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">{isBn ? 'সকল টাইপ' : 'All Types'}</option>
                <option value="practical">{isBn ? 'প্রাকটিক্যাল কোডিং' : 'Coding Practical'}</option>
                <option value="project">{isBn ? 'প্রজেক্ট বেজড' : 'Project Based'}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                {isBn ? 'ইতিহাস রেকর্ড লোড হচ্ছে...' : 'Loading history records...'}
              </div>
            ) : getFilteredHistory().length > 0 ? (
              getFilteredHistory().map(record => (
                <div 
                  key={record.id}
                  onClick={() => setViewingPastResult(record)}
                  className="p-4 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 text-slate-500">
                      {record.type === 'practical' ? <Code2 className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={record.status === 'completed' ? 'brand' : 'danger'}>
                          {record.status === 'completed' ? (isBn ? 'সফল' : 'PASSED') : (isBn ? 'অনুত্তীর্ণ' : 'FAILED')}
                        </Badge>
                        <span className="text-[10px] font-mono font-medium text-slate-400">{record.difficulty}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5 truncate">
                        {record.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {isBn ? 'সম্পন্ন সময়:' : 'Completed At:'} {new Date(record.completedAt || '').toLocaleDateString()} • {isBn ? 'সময়কাল:' : 'Duration:'} {record.duration}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-400">{isBn ? 'স্কোর' : 'Score'}</span>
                      <span className="font-mono font-bold text-base text-emerald-500 mt-0.5">{record.scores?.overallScore || 0}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {historyList.length > 1 && (
                        <button 
                          onClick={(e) => handleToggleCompare(record.id, e)}
                          className={`p-2 rounded-xl border transition-all ${selectedHistoryForCompare.includes(record.id) ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'border-slate-200 dark:border-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                          title={isBn ? 'তুলনা করুন' : 'Add to Compare'}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleDeletePastRecord(record.id, e)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-white/5 text-slate-400 hover:text-red-500 transition-all"
                        title={isBn ? 'ডিলিট করুন' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-8 h-8 text-slate-400" />
                <p className="text-sm text-slate-500">
                  {isBn ? 'কোনো মূল্যায়ন হিস্ট্রি পাওয়া যায়নি।' : 'No assessment logs found.'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 6. MAIN CHOOSE SKILL & START CONFIGURATION VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings configurations on left */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="p-6 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 flex flex-col gap-6">
              <div>
                <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {isBn ? 'অ্যাসেসমেন্ট সেটিংস কনফিগারেশন' : 'Assessment Configuration'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isBn ? 'আপনার পছন্দমত দক্ষতা এবং টেস্ট ক্যাটাগরি সিলেক্ট করুন।' : 'Tailor your custom coding exam parameters. Groq AI generates tasks dynamically.'}
                </p>
              </div>

              {/* 1. Skill Selector chips */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {isBn ? '১. যাচাইয়ের জন্য কারিগরি দক্ষতা সিলেক্ট করুন (Select Skill to Assess)' : '1. Choose Expertise to Assess'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {userSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => handleSkillChange(skill)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border ${selectedSkill === skill ? 'bg-emerald-500 text-white dark:text-slate-950 border-emerald-500 shadow-md dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Mode select card buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div 
                  onClick={() => setSelectedMode('practical')}
                  className={`p-5 rounded-2xl cursor-pointer border transition-all flex flex-col gap-3 ${selectedMode === 'practical' ? 'border-emerald-500 bg-emerald-500/5 shadow-md' : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] hover:border-slate-300 dark:hover:border-white/10'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="h-9 w-9 bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-xl">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <Badge variant={selectedMode === 'practical' ? 'brand' : 'outline'}>
                      {isBn ? 'ফ্রি / ডিফল্ট' : 'FREE / DEFAULT'}
                    </Badge>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isBn ? 'কোডিং ও প্র্যাকটিক্যাল এক্সাম (Mode 1)' : 'Practical Exam (Mode 1)'}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      {isBn ? 'সরাসরি ইন্টিগ্রেটেড কোড এডিটর-এ প্রবলেম সলভ করুন। গ্রক এআই সাথে সাথে স্কোর এবং ফিডব্যাক প্রদান করবে।' : 'Solve dynamic programming tasks inside the browser code IDE. Instantly graded by AI.'}
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedMode('project')}
                  className={`p-5 rounded-2xl cursor-pointer border transition-all flex flex-col gap-3 ${selectedMode === 'project' ? 'border-cyan-500 bg-cyan-500/5 shadow-md' : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] hover:border-slate-300 dark:hover:border-white/10'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="h-9 w-9 bg-cyan-500/10 text-cyan-500 flex items-center justify-center rounded-xl">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <Badge variant={selectedMode === 'project' ? 'info' : 'outline'}>
                      {isBn ? 'প্রিমিয়াম এক্সক্লুসিভ' : 'PREMIUM'}
                    </Badge>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isBn ? 'প্রজেক্ট বেজড অ্যাসেসমেন্ট (Mode 2)' : 'Project Assessment (Mode 2)'}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      {isBn ? 'একটি রিয়েল-ওয়ার্ল্ড মিনি প্রজেক্ট রিকোয়ারমেন্টস জেনারেট করুন। লোকাল কোডিং শেষ করে জিপ বা গিটহাব সাবমিট করুন।' : 'Generate developer project specifications. Complete coding locally and upload file credentials.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Duration select for project-based mode only */}
              {selectedMode === 'project' && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {isBn ? '৩. প্রজেক্ট সাবমিশন ডেডলাইন টাইমার সিলেক্ট করুন' : '3. Choose Project Time Duration'}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['2 Hours', '6 Hours', '24 Hours', '48 Hours', 'Custom'].map(dur => (
                      <button
                        key={dur}
                        onClick={() => setProjectDuration(dur)}
                        className={`px-2 py-2 text-xs font-bold rounded-xl transition-all border ${projectDuration === dur ? 'bg-cyan-500 text-white dark:text-slate-950 border-cyan-500' : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end border-t border-slate-100 dark:border-white/5 pt-6 mt-2">
                <Button 
                  variant="primary" 
                  disabled={!selectedSkill}
                  onClick={handleStartAssessment}
                  isLoading={generatingChallenge}
                >
                  <Play className="w-4 h-4" />
                  <span>{isBn ? 'অ্যাসেসমেন্ট শুরু করুন' : 'Start Assessment'}</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick tips & user status card on right */}
          <div className="lg:col-span-4 flex flex-col gap-6 font-sans">
            <Card className="p-6 bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col gap-5">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {isBn ? 'মূল্যায়ন নির্দেশিকা' : 'Assessment Blueprint'}
                </h4>
              </div>

              <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 font-bold font-mono text-[10px]">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">{isBn ? 'ডাইনামিক জেনারেশন' : 'Custom Tailored'}</h5>
                    <p className="mt-1">{isBn ? 'পরীক্ষার প্রশ্ন আপনার বর্তমান রেজুমেতে থাকা প্রজেক্ট এবং দক্ষতার সাথে ম্যাচ করে তৈরি হবে।' : 'The tasks generated match your specific background, career trajectory, and existing competency.'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 font-bold font-mono text-[10px]">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">{isBn ? 'অ্যাডাপ্টিভ ডিফিকাল্টি' : 'Adaptive Difficulty'}</h5>
                    <p className="mt-1">{isBn ? 'যদি আপনি আগের পরীক্ষায় ভালো স্কোর পেয়ে থাকেন, তবে এআই স্বয়ংক্রিয়ভাবে পরবর্তী অ্যাটেম্পট হার্ড লেভেলে নিবে।' : 'The engine monitors past scores. Achieving higher values automatically transitions subsequent targets to higher tiers.'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 font-bold font-mono text-[10px]">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">{isBn ? 'স্কিল পাসপোর্ট আপডেট' : 'Credentials Validation'}</h5>
                    <p className="mt-1">{isBn ? 'পরীক্ষায় উত্তীর্ণ হলে (>= ৬০% স্কোর) আপনার স্কিল পাসপোর্টে এবং ক্যারিয়ার রোডম্যাপে অগ্রগতি যোগ হবে।' : 'Sufficient score (>= 60%) unlocks verified passport badges and synchronizes performance progress with roadmap items.'}</p>
                  </div>
                </div>
              </div>

              {/* Status info */}
              <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-900 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-[10px] uppercase font-mono font-bold text-slate-400">{isBn ? 'অ্যাসেসমেন্ট ট্রায়ালস' : 'TOTAL ATTEMPTS'}</h5>
                  <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">{historyList.length}</p>
                </div>
                <div className="text-right">
                  <h5 className="text-[10px] uppercase font-mono font-bold text-slate-400">{isBn ? 'পাস রেট' : 'PASS RATE'}</h5>
                  <p className="text-xl font-bold font-mono text-emerald-500 mt-1">
                    {historyList.length > 0 
                      ? `${Math.round((historyList.filter(h => h.status === 'completed').length / historyList.length) * 100)}%`
                      : '0%'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
