/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, Mic, MicOff, Send, Play, Volume2, RefreshCw, 
  CheckCircle2, AlertTriangle, ChevronRight, ArrowLeft, 
  Clock, Award, BookOpen, TrendingUp, Sparkles, Timer, 
  ChevronDown, User, Mail, Phone, MapPin, Calendar, 
  ChevronUp, Trash2, History, BarChart3, PieChart, 
  HelpCircle, Activity, Info, Brain, ShieldAlert, Check,
  FileText, LayoutDashboard
} from 'lucide-react';
import { Card, Button, Badge } from './UI';
import { cvDb } from '../lib/cvSupabase';
import { interviewDb } from '../lib/interviewSupabase';
import { interviewGroq } from '../lib/interviewGroq';
import { CvData, InterviewSession, InterviewQA, InterviewMemory } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LineChart, Line, AreaChart, Area } from 'recharts';

interface AiInterviewProps {
  userId: string;
  isBn: boolean;
  onBack: () => void;
}

export const AiInterview: React.FC<AiInterviewProps> = ({ userId, isBn, onBack }) => {
  // ==========================================
  // স্টেট ম্যানেজমেন্ট (State Management)
  // ==========================================
  const [step, setStep] = useState<'home' | 'interview' | 'loading' | 'summary' | 'history'>('home');
  const [resumes, setResumes] = useState<CvData[]>([]);
  const [selectedCv, setSelectedCv] = useState<CvData | null>(null);
  const [isCvsLoading, setIsCvsLoading] = useState(true);
  
  // ক্যারিয়ার ও স্কিল ডিটেকশন স্টেট
  const [analysis, setAnalysis] = useState<{
    careerPath: string;
    skills: string[];
    readinessScore: number;
    duration: string;
    resumeScore: number;
  } | null>(null);
  const [isAnalyzingCv, setIsAnalyzingCv] = useState(false);

  // ইন্টারভিউ চলমান স্টেট
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentCategory, setCurrentCategory] = useState('HR');
  const [answerText, setAnswerText] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [averageScore, setAverageScore] = useState(0);

  // ভয়েস ইন্টারভিউ ও ট্রান্সক্রিপ্ট স্টেট (Web Speech API)
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  
  // টাইমার স্টেট
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // পূর্ববর্তী সেশন হিস্ট্রি স্টেট
  const [historySessions, setHistorySessions] = useState<InterviewSession[]>([]);
  const [selectedHistorySession, setSelectedHistorySession] = useState<InterviewSession | null>(null);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expandedQa, setExpandedQa] = useState<Record<string, boolean>>({});

  // এডাপ্টিভ ইন্টারভিউ ইঞ্জিন স্টেট (Adaptive Interview Engine state)
  const [homeTab, setHomeTab] = useState<'dashboard' | 'setup'>('dashboard');
  const [adaptiveMemory, setAdaptiveMemory] = useState<InterviewMemory | null>(null);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);

  // রিফ রেফারেন্সসমূহ (Refs)
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textEndRef = useRef<HTMLDivElement | null>(null);

  // ==========================================
  // ইনিশিয়াল ডাটা লোড (Initial Data Loading)
  // ==========================================
  useEffect(() => {
    loadUserCVs();
    loadInterviewHistory();
    checkSpeechSupport();

    return () => {
      stopTimer();
      stopVoiceSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [userId]);

  // এডাপ্টিভ মেমোরি অটো-কম্পাইলেশন (Auto compile adaptive memory if history exists but memory does not)
  useEffect(() => {
    if (historySessions.length > 0 && !adaptiveMemory && !isMemoryLoading) {
      const compileInitialMemory = async () => {
        setIsMemoryLoading(true);
        try {
          const latest = historySessions[0];
          const previous = historySessions.slice(1);
          const compiled = await interviewGroq.compileAdaptiveMemory(userId, previous, latest);
          await interviewDb.saveMemory(compiled);
          setAdaptiveMemory(compiled);
        } catch (e) {
          console.error('Error auto-compiling memory:', e);
        } finally {
          setIsMemoryLoading(false);
        }
      };
      compileInitialMemory();
    }
  }, [historySessions, adaptiveMemory, isMemoryLoading, userId]);

  // ব্রাউজার ভয়েস রিকগনিশন সমর্থন চেক করা
  const checkSpeechSupport = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  };

  // সিভিসমূহ লোড করা
  const loadUserCVs = async () => {
    setIsCvsLoading(true);
    try {
      const cvList = await cvDb.getResumes(userId);
      setResumes(cvList);
      
      if (cvList.length > 0) {
        // ডিফল্টভাবে সর্বশেষ তৈরি সিভি সিলেক্ট করা
        setSelectedCv(cvList[0]);
        analyzeCvData(cvList[0]);
      } else {
        setSelectedCv(null);
        setAnalysis(null);
      }
    } catch (err) {
      console.error('Error loading resumes:', err);
    } finally {
      setIsCvsLoading(false);
    }
  };

  // ইন্টারভিউ ইতিহাস ও এডাপ্টিভ মেমোরি লোড করা
  const loadInterviewHistory = async () => {
    setIsMemoryLoading(true);
    try {
      const history = await interviewDb.getSessions(userId);
      setHistorySessions(history);
      
      const memory = await interviewDb.getMemory(userId);
      setAdaptiveMemory(memory);

      if (history.length > 0) {
        setHomeTab('dashboard');
      } else {
        setHomeTab('setup');
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsMemoryLoading(false);
    }
  };

  // ডেমো সিভি জেনারেটর (Demo CV Generator for Instant UX)
  const getDemoCv = (): CvData => {
    return {
      id: 'demo_software_cv',
      userId,
      personalInfo: {
        name: 'Ariful Islam',
        email: 'nishat.af27@gmail.com',
        phone: '+880 1712-345678',
        address: 'Dhaka, Bangladesh',
        linkedin: 'https://linkedin.com/in/ariful-islam',
        github: 'https://github.com/ariful-islam',
        portfolio: 'https://ariful.dev'
      },
      careerSummary: 'Detail-oriented and performance-driven Frontend Engineer with 2+ years of hands-on experience designing, developing, and deploying robust user interfaces using the React/Vite ecosystem. Expert at optimizing client-side rendering bottlenecks and building accessible web modules.',
      education: [
        {
          id: 'edu_demo',
          degree: 'Bachelor of Science in Computer Science',
          institution: 'University of Dhaka',
          year: '2022',
          gpa: '3.68 / 4.00'
        }
      ],
      experience: [
        {
          id: 'exp_demo',
          company: 'Dynamic Tech Bangladesh',
          role: 'Junior Frontend Developer',
          duration: 'Jan 2023 - Present',
          description: 'Responsible for creating pixel-perfect layouts using Tailwind CSS. Collaborated with cross-functional product leads to migrate key services to React 18, enhancing performance by 30%. Built interactive real-time dashboards utilizing charting mechanisms.',
          isCurrent: true
        }
      ],
      projects: [
        {
          id: 'proj_demo',
          title: 'E-Commerce Core Dashboard',
          description: 'Designed a comprehensive management dashboard with customizable charts, real-time sales reporting, and detailed order logs.',
          techStack: 'React, Tailwind CSS, Recharts, LocalStorage',
          github: 'https://github.com/username/dashboard',
          liveLink: 'https://dashboard-preview.net'
        }
      ],
      skills: {
        softSkills: ['Problem Solving', 'Team Collaboration', 'Adaptive Mindset', 'Agile Communication'],
        technicalSkills: ['React', 'Next.js', 'JavaScript (ES6+)', 'TypeScript', 'Tailwind CSS', 'Vite', 'Git', 'Node.js'],
        languages: ['Bangla (Native)', 'English (Professional)'],
        certificates: ['Advanced React Certificate (Meta)']
      },
      templateId: 'modern',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scores: {
        atsScore: 78,
        resumeQualityScore: 82,
        skillScore: 85,
        professionalismScore: 80,
        communicationScore: 75
      }
    };
  };

  // সিভির উপর ভিত্তি করে ক্যারিয়ার ও স্কিল অটোমেটিক এনালাইসিস
  const analyzeCvData = async (cv: CvData) => {
    setIsAnalyzingCv(true);
    try {
      const res = await interviewGroq.analyzeCvForInterview(cv);
      setAnalysis(res);
    } catch (err) {
      console.error('Error analyzing CV:', err);
    } finally {
      setIsAnalyzingCv(false);
    }
  };

  const handleCvChange = (cvId: string) => {
    const selected = resumes.find(c => c.id === cvId) || (cvId === 'demo_software_cv' ? getDemoCv() : null);
    if (selected) {
      setSelectedCv(selected);
      analyzeCvData(selected);
    }
  };

  // ==========================================
  // টাইমার ইউটিলিটি (Timer Utilities)
  // ==========================================
  const startTimer = () => {
    setDurationSeconds(0);
    setTimerActive(true);
    timerRef.current = setInterval(() => {
      setDurationSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerActive(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ==========================================
  // ভয়েস সংশ্লেষণ (Speech Synthesis / TTS)
  // ==========================================
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    stopVoiceSpeaking();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    // ক্রোম বা সাফারির জন্য ভালো মানের ভয়েস নির্বাচন
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.includes('Google US English') || 
      v.name.includes('Samantha') || 
      v.name.includes('Zira') ||
      v.name.includes('Microsoft Zira')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // ==========================================
  // ভয়েস রিকগনিশন (Speech Recognition / STT)
  // ==========================================
  const toggleRecording = () => {
    if (!speechSupported) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    stopVoiceSpeaking();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsRecording(true);
      setInterimTranscript('');
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim);
      if (final) {
        setAnswerText(prev => prev + final);
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setInterimTranscript('');
  };

  // ==========================================
  // ইন্টারভিউ প্রসেস প্রবাহ (Interview Process Flow)
  // ==========================================
  
  // ইন্টারভিউ শুরু করা
  const startInterview = async () => {
    if (!selectedCv || !analysis) return;
    
    setStep('loading');
    stopVoiceSpeaking();

    // ১. একটি নতুন ইন্টারভিউ সেশন অবজেক্ট তৈরি করা
    const newSession: InterviewSession = {
      id: `session_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
      userId,
      cvId: selectedCv.id,
      careerPath: analysis.careerPath,
      skills: analysis.skills,
      status: 'in_progress',
      duration: 0,
      createdAt: new Date().toISOString(),
      qa: []
    };

    try {
      // ২. গ্রক এপিআই দিয়ে প্রথম স্বাগত ও ওপেনিং প্রশ্ন তৈরি করা (Personalized adaptive start)
      const firstQ = await interviewGroq.generateFirstQuestion(analysis.careerPath, analysis.skills, adaptiveMemory);
      
      newSession.qa.push({
        id: `qa_1`,
        question: firstQ,
        timestamp: new Date().toISOString()
      });

      setSession(newSession);
      setCurrentQuestion(firstQ);
      setCurrentQuestionIndex(0);
      setCurrentCategory('HR');
      setAnswerText('');
      setFeedbackMessage('');
      setAverageScore(0);
      
      // সুপাবেজ ডাটাবেজে সংরক্ষণ করা
      await interviewDb.saveSession(newSession);

      setStep('interview');
      startTimer();
      
      // কিছুক্ষণ পর ভয়েস রিড-আউট করা
      setTimeout(() => {
        speakText(firstQ);
      }, 600);

    } catch (err) {
      console.error('Failed to initialize interview:', err);
      setStep('home');
    }
  };

  // উত্তর জমা দেওয়া এবং পরবর্তী প্রশ্ন আনা (Submit Answer & Fetch Next Question)
  const submitAnswer = async () => {
    if (!session || isSubmittingAnswer) return;

    const trimmedAnswer = answerText.trim();
    if (!trimmedAnswer) return;

    stopRecording();
    stopVoiceSpeaking();
    setIsSubmittingAnswer(true);

    try {
      const updatedQa = [...session.qa];
      const currentQaItem = { ...updatedQa[currentQuestionIndex] };
      currentQaItem.answer = trimmedAnswer;
      currentQaItem.transcript = trimmedAnswer; // Groq whisper fallback / text matches transcription
      
      // পরবর্তী প্রশ্নের প্রকার ঠিক করা
      const nextQCount = currentQuestionIndex + 2; // ১-ভিত্তিক সূচক
      
      // গ্রক এপিআই এর মাধ্যমে উত্তর মূল্যায়ন ও পরবর্তী প্রশ্ন তৈরি (Personalized adaptive follow-up)
      const res = await interviewGroq.processAnswerAndGenerateNext(
        session.careerPath,
        session.skills,
        updatedQa.slice(0, currentQuestionIndex).map(q => ({
          ...q,
          answer: q.answer || ''
        })),
        trimmedAnswer,
        nextQCount,
        adaptiveMemory
      );

      // কারেন্ট আইটেমে মূল্যায়ন স্কোর ও ফিডব্যাক যুক্ত করি
      currentQaItem.scores = res.answerScores;
      currentQaItem.feedback = res.answerFeedback;
      updatedQa[currentQuestionIndex] = currentQaItem;

      // রিয়েলটাইম স্কোর ট্র্যাকিং
      calculateRunningAverage(updatedQa);

      // ৫টি প্রশ্ন শেষ হলে ইন্টারভিউ শেষ করা হবে
      const isLastQuestion = currentQuestionIndex >= 4;

      if (isLastQuestion) {
        // ইন্টারভিউ শেষ করার ধাপ
        stopTimer();
        setStep('loading');
        
        const finalSession: InterviewSession = {
          ...session,
          status: 'completed',
          duration: durationSeconds,
          completedAt: new Date().toISOString(),
          qa: updatedQa
        };

        // গ্রক দিয়ে ওভারঅল সামারি স্কোর জেনারেট করি
        const summary = await interviewGroq.generateInterviewSummary(
          session.careerPath,
          session.skills,
          updatedQa
        );

        finalSession.scores = summary.scores;
        finalSession.feedback = summary.feedback;

        setSession(finalSession);
        await interviewDb.saveSession(finalSession);

        // রিয়েলটাইমে নতুন এডাপ্টিভ মেমোরি জেনারেট করি (Compile new Adaptive memory in real-time)
        try {
          const updatedMemory = await interviewGroq.compileAdaptiveMemory(userId, historySessions, finalSession);
          await interviewDb.saveMemory(updatedMemory);
          setAdaptiveMemory(updatedMemory);
        } catch (memErr) {
          console.error('Error generating adaptive memory:', memErr);
        }

        await loadInterviewHistory(); // রিলোড হিস্ট্রি লিষ্ট
        
        setStep('summary');
      } else {
        // পরবর্তী প্রশ্নের দিকে অগ্রসর হওয়া
        const nextQaItem: InterviewQA = {
          id: `qa_${nextQCount}`,
          question: res.nextQuestion,
          timestamp: new Date().toISOString()
        };

        updatedQa.push(nextQaItem);

        const updatedSession = {
          ...session,
          qa: updatedQa
        };

        setSession(updatedSession);
        setCurrentQuestion(res.nextQuestion);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentCategory(res.nextCategory);
        setAnswerText('');
        setFeedbackMessage(res.answerFeedback);

        // সুপাবেজ অটোসেভ
        await interviewDb.saveSession(updatedSession);

        // নতুন প্রশ্নটি ভয়েস রিড-আউট করা
        setTimeout(() => {
          speakText(res.nextQuestion);
        }, 300);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // চলমান এভারেজ স্কোর হিসাব করা
  const calculateRunningAverage = (qaItems: InterviewQA[]) => {
    let total = 0;
    let count = 0;
    qaItems.forEach(item => {
      if (item.scores) {
        const itemAvg = (
          item.scores.technical + 
          item.scores.confidence + 
          item.scores.communication + 
          item.scores.problemSolving + 
          item.scores.professionalism + 
          item.scores.english
        ) / 6;
        total += itemAvg;
        count++;
      }
    });
    if (count > 0) {
      setAverageScore(Math.round(total / count));
    }
  };

  // প্রশ্ন এড়িয়ে যাওয়া (Skip Question)
  const skipQuestion = () => {
    setAnswerText('I would like to skip this question and move on to the next challenge.');
    setTimeout(() => {
      submitAnswer();
    }, 200);
  };

  // প্রশ্ন রিপিট করা
  const repeatQuestion = () => {
    speakText(currentQuestion);
  };

  const deleteSessionRecord = async (id: string) => {
    if (confirm(isBn ? 'আপনি কি এই ইন্টারভিউ রেকর্ডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this interview record?')) {
      await interviewDb.deleteSession(id, userId);
      loadInterviewHistory();
      if (selectedHistorySession?.id === id) {
        setSelectedHistorySession(null);
      }
    }
  };

  // ক্যান্ডিডেটের নাম প্রথম অক্ষর বড় করা
  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SP';
  };

  // রিচার্টস ডাটা প্রিপারেশন
  const getRadarData = (scores: InterviewSession['scores']) => {
    if (!scores) return [];
    return [
      { subject: isBn ? 'টেকনিক্যাল' : 'Technical', A: scores.technical, fullMark: 100 },
      { subject: isBn ? 'কনফিডেন্স' : 'Confidence', A: scores.confidence, fullMark: 100 },
      { subject: isBn ? 'যোগাযোগ' : 'Communication', A: scores.communication, fullMark: 100 },
      { subject: isBn ? 'প্রব্লেম সলভিং' : 'Problem Solving', A: scores.problemSolving, fullMark: 100 },
      { subject: isBn ? 'পেশাদারিত্ব' : 'Professionalism', A: scores.professionalism, fullMark: 100 },
      { subject: isBn ? 'ইংরেজি দক্ষতা' : 'English', A: scores.english, fullMark: 100 }
    ];
  };

  const getTimelineBarData = (qa: InterviewQA[]) => {
    return qa.filter(q => q.scores).map((q, i) => ({
      name: `Q ${i+1}`,
      Technical: q.scores?.technical || 0,
      Confidence: q.scores?.confidence || 0,
      Communication: q.scores?.communication || 0,
      ProblemSolving: q.scores?.problemSolving || 0,
      Professionalism: q.scores?.professionalism || 0,
      English: q.scores?.english || 0
    }));
  };

  const getTimelineChartData = () => {
    if (!adaptiveMemory) return [];
    const history = [...adaptiveMemory.improvementHistory];
    if (history.length === 1) {
      return [
        { date: 'CV Base', Overall: analysis?.resumeScore || 70, Technical: 65, Communication: 65 },
        { date: history[0].date, Overall: history[0].overallScore, Technical: history[0].technicalScore, Communication: history[0].communicationScore }
      ];
    }
    return history.map(h => ({
      date: h.date,
      Overall: h.overallScore,
      Technical: h.technicalScore,
      Communication: h.communicationScore
    }));
  };

  return (
    <div className="w-full min-h-screen text-slate-800 dark:text-slate-100 font-sans p-2 sm:p-6 transition-all duration-300">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 mb-2 group transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" />
            {isBn ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
          </button>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/10 border border-emerald-500/20">
              <Video className="w-6 sm:w-7 h-6 sm:h-7" />
            </span>
            {isBn ? 'এআই লাইভ ইন্টারভিউ ইঞ্জিন' : 'AI Live Interview Engine'}
            <Badge variant="brand">{isBn ? 'সিভি ভিত্তিক' : 'CV Based'}</Badge>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setStep(step === 'history' ? 'home' : 'history')}
            className="text-xs sm:text-sm font-semibold gap-1.5"
          >
            <History className="w-4 h-4" />
            {step === 'history' 
              ? (isBn ? 'ইন্টারভিউ হোম' : 'Interview Home') 
              : (isBn ? 'ইন্টারভিউ রেকর্ডসমূহ' : 'Interview Records')}
          </Button>
        </div>
      </div>

      {/* =========================================================
          STEP 1: INTERVIEW HOME / SETUP (ইন্টারভিউ হোম)
          ========================================================= */}
      {step === 'home' && (
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          {/* ট্যাব নির্বাচক (Tab Switcher) */}
          {historySessions.length > 0 && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl self-start mb-2">
              <button
                onClick={() => setHomeTab('dashboard')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  homeTab === 'dashboard'
                    ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-md border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                {isBn ? 'এআই এডাপ্টিভ ড্যাশবোর্ড' : 'AI Adaptive Dashboard'}
              </button>
              <button
                onClick={() => setHomeTab('setup')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  homeTab === 'setup'
                    ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-md border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Play className="w-4 h-4" />
                {isBn ? 'নতুন ইন্টারভিউ শুরু করুন' : 'Start New Interview'}
              </button>
            </div>
          )}

          {/* ট্যাব ১: এডাপ্টিভ ড্যাশবোর্ড */}
          {homeTab === 'dashboard' && historySessions.length > 0 && (
            isMemoryLoading && !adaptiveMemory ? (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#0c0c0c]/80 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl shadow-md">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-16 w-16 rounded-full border-4 border-emerald-500/10 animate-ping" />
                  <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white mt-2">
                  {isBn ? 'আপনার ইন্টারভিউ মেমোরি বিশ্লেষণ করা হচ্ছে...' : 'Analyzing Interview Memory...'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  {isBn ? 'এআই আপনার সম্পূর্ণ পারফর্ম্যান্স ও দুর্বলতার হিস্ট্রি প্রসেস করে স্টাডি প্ল্যান তৈরি করছে।' : 'The AI is processing your complete performance history and weaknesses to generate a personalized path.'}
                </p>
              </div>
            ) : adaptiveMemory ? (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-2">
                  {/* Readiness Gauge */}
                  <div className="lg:col-span-4 bg-white dark:bg-[#0c0c0c]/80 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                        <Brain className="w-4 h-4 text-emerald-500" />
                        {isBn ? 'ইন্টারভিউ প্রস্তুতি সূচক' : 'Interview Readiness Index'}
                      </h3>
                      <div className="flex items-center gap-5 my-4">
                        <div className="relative h-24 w-24 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className="stroke-slate-100 dark:stroke-slate-800/60"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              className="stroke-emerald-500"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 40}
                              strokeDashoffset={2 * Math.PI * 40 * (1 - (adaptiveMemory.readinessScore || 70) / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-2xl font-black font-mono text-slate-800 dark:text-white">
                            {adaptiveMemory.readinessScore}%
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <Badge variant="brand" className="w-max mb-1.5 px-2.5 py-0.5 text-[10px]">
                            {adaptiveMemory.readinessScore >= 80 
                              ? (isBn ? 'প্রস্তুতি চমৎকার' : 'EXCELLENT') 
                              : adaptiveMemory.readinessScore >= 60 
                              ? (isBn ? 'মধ্যম প্রস্তুতি' : 'MODERATE') 
                              : (isBn ? 'প্রস্তুতি প্রয়োজন' : 'PRACTICE NEEDED')}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-medium leading-tight">
                            {isBn ? 'সর্বশেষ সেশনের ওপর ভিত্তি করে' : 'Based on continuous AI evaluation.'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-2 font-medium">
                      {adaptiveMemory.readinessExplanation}
                    </p>
                  </div>

                  {/* Quick Adaptive Metrics (Smart Improvement Engine) */}
                  <div className="lg:col-span-8 bg-white dark:bg-[#0c0c0c]/80 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-6 shadow-md flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        {isBn ? 'স্মার্ট ইম্প্রুভমেন্ট এনালাইটিক্স' : 'Smart Improvement Analytics'}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Award className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              {isBn ? 'সবচেয়ে উন্নত দক্ষতা' : 'Most Improved Skill'}
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 dark:text-white block">
                              {adaptiveMemory.metrics?.mostImprovedSkill || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              {isBn ? 'সবচেয়ে জটিল বিষয়' : 'Most Difficult Skill'}
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 dark:text-white block">
                              {adaptiveMemory.metrics?.mostDifficultSkill || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              {isBn ? 'ঘনঘন পুনরাবৃত্ত ভুল' : 'Most Repeated Mistake'}
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 dark:text-white block line-clamp-1">
                              {adaptiveMemory.metrics?.mostRepeatedMistake || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              {isBn ? 'দ্রুত বর্ধনশীল ক্ষেত্র' : 'Fastest Growing Skill'}
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 dark:text-white block">
                              {adaptiveMemory.metrics?.fastestGrowingSkill || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <span className="text-xs text-slate-400 font-medium">
                        {isBn ? 'এআই এখন আপনার দুর্বলতা অনুসারে পরবর্তী ভাইভা কাস্টমাইজ করবে।' : 'AI will adapt the next session around your active weak topics.'}
                      </span>
                      <Button
                        variant="primary"
                        onClick={startInterview}
                        disabled={isAnalyzingCv || !analysis}
                        className="px-6 py-2.5 text-xs font-extrabold gap-2 rounded-xl shrink-0 shadow-lg shadow-emerald-500/10"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        {isBn ? 'পরবর্তী এডাপ্টিভ ইন্টারভিউ শুরু করুন' : 'Launch Adaptive Interview'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Progress Timeline & Weak/Strong Skills Column */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase flex items-center justify-between mb-4">
                        <span className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-500" />
                          {isBn ? 'দক্ষতা বৃদ্ধি ও স্কিল গ্রোথ টাইমলাইন' : 'Skill Growth Timeline'}
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                          {adaptiveMemory.improvementHistory.length > 1
                            ? (adaptiveMemory.improvementHistory[adaptiveMemory.improvementHistory.length - 1].overallScore >= 
                               adaptiveMemory.improvementHistory[0].overallScore
                                ? (isBn ? 'উন্নতিশীল প্রবণতা' : 'IMPROVING TREND')
                                : (isBn ? 'অবনতিশীল প্রবণতা' : 'DECLINING TREND'))
                            : (isBn ? 'প্রথম সেশন ট্র্যাকিং' : 'TRACKING ACTIVE')}
                        </span>
                      </h3>

                      <div className="h-64 mt-2 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getTimelineChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#94a3b8" 
                              fontSize={10} 
                              tickLine={false} 
                              axisLine={false} 
                            />
                            <YAxis 
                              stroke="#94a3b8" 
                              fontSize={10} 
                              domain={[30, 100]} 
                              tickLine={false} 
                              axisLine={false} 
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                border: 'none', 
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '11px'
                              }} 
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                            <Line 
                              name={isBn ? 'সামগ্রিক স্কোর' : 'Overall Score'} 
                              type="monotone" 
                              dataKey="Overall" 
                              stroke="#10b981" 
                              strokeWidth={3} 
                              dot={{ r: 4 }} 
                              activeDot={{ r: 6 }} 
                            />
                            <Line 
                              name={isBn ? 'কারিগরি একুরেসি' : 'Technical Accuracy'} 
                              type="monotone" 
                              dataKey="Technical" 
                              stroke="#3b82f6" 
                              strokeWidth={2} 
                              dot={{ r: 3 }} 
                            />
                            <Line 
                              name={isBn ? 'যোগাযোগ দক্ষতা' : 'Communication'} 
                              type="monotone" 
                              dataKey="Communication" 
                              stroke="#f59e0b" 
                              strokeWidth={2} 
                              dot={{ r: 3 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Card className="border-amber-500/20 dark:border-amber-500/10 bg-amber-500/5 shadow-sm">
                        <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4.5 h-4.5" />
                          {isBn ? 'আপনার দুর্বল বিষয়সমূহ' : 'Weak Topics to Improve'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                          {isBn ? 'বিগত ভাইভাগুলোতে এই ক্ষেত্রগুলোতে আপনার তুলনামূলক ঘাটতি দেখা গেছে।' : 'Topics requiring study based on lower evaluation scores in previous sessions.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {adaptiveMemory.weakTopics.map((topic, i) => (
                            <div 
                              key={i} 
                              className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-500/20 flex items-center gap-1.5 shadow-sm"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {topic}
                            </div>
                          ))}
                          {adaptiveMemory.weakTopics.length === 0 && (
                            <span className="text-xs text-slate-400 font-mono italic">
                              {isBn ? 'কোনো দুর্বলতা সনাক্ত করা যায়নি।' : 'No major weak topics identified yet!'}
                            </span>
                          )}
                        </div>
                      </Card>

                      <Card className="border-emerald-500/20 dark:border-emerald-500/10 bg-emerald-500/5 shadow-sm">
                        <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4.5 h-4.5" />
                          {isBn ? 'আপনার সবল ক্ষেত্রসমূহ' : 'Strong Areas & Strengths'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                          {isBn ? 'এই বিষয়গুলোতে এআই ভাইভায় আপনি অত্যন্ত চমৎকার পারফর্ম করেছেন।' : 'Excellent response and technical correctness displayed in these skills.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {adaptiveMemory.strongTopics.map((topic, i) => (
                            <div 
                              key={i} 
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-500/20 flex items-center gap-1.5 shadow-sm"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {topic}
                            </div>
                          ))}
                          {adaptiveMemory.strongTopics.length === 0 && (
                            <span className="text-xs text-slate-400 font-mono italic">
                              {isBn ? 'কোনো সবল দিক সনাক্ত করা যায়নি।' : 'Complete an interview to capture strong topics.'}
                            </span>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Study Plan & AI Insights Column */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                        <BookOpen className="w-4.5 h-4.5 text-emerald-500" />
                        {isBn ? 'ব্যক্তিগতকৃত স্টাডি প্ল্যান' : 'Personalized Study Plan'}
                      </h3>

                      <div className="flex flex-col gap-5">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <Badge variant="brand" className="mt-0.5 shrink-0 px-2 py-0.5 text-[10px]">
                              {isBn ? 'আজকের লক্ষ্য' : 'TODAY\'S GOAL'}
                            </Badge>
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                              {adaptiveMemory.studyPlan?.todayGoal}
                            </p>
                          </div>

                          <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/40">
                            <Badge variant="outline" className="mt-0.5 shrink-0 px-2 py-0.5 text-[10px]">
                              {isBn ? 'সাপ্তাহিক লক্ষ্য' : 'WEEKLY GOAL'}
                            </Badge>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {adaptiveMemory.studyPlan?.weekGoal}
                            </p>
                          </div>

                          <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/40">
                            <Badge variant="outline" className="mt-0.5 shrink-0 px-2 py-0.5 text-[10px] text-emerald-600 border-emerald-500/20">
                              {isBn ? 'পরবর্তী লক্ষ্য' : 'TARGET'}
                            </Badge>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                              {adaptiveMemory.studyPlan?.nextInterviewGoal}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                            {isBn ? 'বাস্তব অনুশীলন কর্মসমূহ' : 'Interactive Practice Tasks'}
                          </h4>
                          <div className="flex flex-col gap-2.5">
                            {adaptiveMemory.studyPlan?.practiceTasks?.map((task, idx) => (
                              <label 
                                key={idx}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/20 border border-slate-100 dark:border-slate-800/40 cursor-pointer transition-colors"
                              >
                                <input 
                                  type="checkbox"
                                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                  {task}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {adaptiveMemory.studyPlan?.miniProjects && adaptiveMemory.studyPlan.miniProjects.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                              {isBn ? 'সহায়ক মিনি প্রজেক্ট' : 'Hands-on Mini Projects'}
                            </h4>
                            <div className="flex flex-col gap-2">
                              {adaptiveMemory.studyPlan.miniProjects.map((project, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                  <span className="font-extrabold text-purple-600 dark:text-purple-400 block mb-1">
                                    {isBn ? `মিনি প্রজেক্ট ${idx + 1}` : `Project Suggestion ${idx + 1}`}
                                  </span>
                                  {project}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {adaptiveMemory.studyPlan?.practiceQuestions && adaptiveMemory.studyPlan.practiceQuestions.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                              {isBn ? 'প্রস্তুতি প্রশ্নসমূহ' : 'Suggested Interview Questions'}
                            </h4>
                            <div className="flex flex-col gap-2">
                              {adaptiveMemory.studyPlan.practiceQuestions.map((q, idx) => (
                                <div 
                                  key={idx} 
                                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/40 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed"
                                >
                                  "{q}"
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase flex items-center gap-2 mb-4">
                        <Sparkles className="w-4.5 h-4.5 text-purple-500" />
                        {isBn ? 'এআই পার্সোনালাইজড অবসার্ভেশন' : 'AI Career Engine Insights'}
                      </h3>
                      <div className="flex flex-col gap-3">
                        {adaptiveMemory.aiInsights.map((insight, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start">
                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {insight}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ) : null
          )}

          {/* ট্যাব ২: সিভি সেটআপ এবং নতুন সেশন আরম্ভ (অথবা কোনো হিস্ট্রি না থাকলে ডিফল্ট শো) */}
          {(homeTab === 'setup' || historySessions.length === 0) && (
            resumes.length === 0 ? (
              <Card className="max-w-3xl mx-auto border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md text-center p-12 my-6">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-3">
                  {isBn ? 'কোনো জীবনবৃত্তান্ত (CV) পাওয়া যায়নি!' : 'No Active CV/Resume Found!'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed mb-8">
                  {isBn 
                    ? 'এআই লাইভ ভাইভা ইন্টারেক্টিভ কাস্টমাইজড প্রশ্নগুলো তৈরি করতে আপনার জীবনবৃত্তান্তের তথ্য প্রয়োজন। দয়া করে প্রথমে "এআই সিভি এডিটর" সেকশনে গিয়ে একটি নতুন প্রফেশনাল রেজুমে তৈরি অথবা আপলোড করুন।' 
                    : 'The live mock interview engine requires your CV analysis to generate dynamic, role-adaptive questions customized specifically to your target roles. Please create or upload a resume in the "AI Smart CV" module first.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button 
                    variant="primary" 
                    onClick={onBack}
                    className="w-full sm:w-auto font-bold px-6 py-2.5"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {isBn ? 'ড্যাশবোর্ড হোমে ফিরে যান' : 'Go to Dashboard Home'}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* বাম কলাম: ক্যান্ডিডেট প্রোফাইল ও সিভি নির্বাচন */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                    <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-500" />
                      {isBn ? 'প্রার্থীর তথ্য ও সিভি' : 'Candidate & CV Information'}
                    </h3>

                    {isCvsLoading ? (
                      <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                        <span className="text-xs text-slate-400 font-mono">Loading CV files...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {/* সিভি সিলেকশন ড্রপডাউন */}
                        <div>
                          <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            {isBn ? 'সক্রিয় জীবনবৃত্তান্ত (Resume) নির্বাচন' : 'Select Active Resume'}
                          </label>
                          <div className="relative">
                            <select 
                              value={selectedCv?.id || ''}
                              onChange={(e) => handleCvChange(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none pr-10 font-medium"
                            >
                              {resumes.map(cv => (
                                <option key={cv.id} value={cv.id} className="dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                                  {cv.personalInfo.name} - {cv.id === 'demo_software_cv' ? (isBn ? 'সিস্টেম ডেমো সিভি' : 'System Demo CV') : cv.personalInfo.email}
                                </option>
                              ))}
                              {resumes.length === 0 && (
                                <option value="demo_software_cv">{isBn ? 'ডেমো ডেভেলপার প্রোফাইল' : 'Demo Developer Profile'}</option>
                              )}
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* নির্বাচিত সিভির প্রার্থীর সংক্ষিপ্ত তথ্য */}
                        {selectedCv && (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                                {getInitials(selectedCv.personalInfo.name)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedCv.personalInfo.name}</h4>
                                <span className="text-[10px] text-slate-400 font-mono font-medium tracking-wide">ID: {selectedCv.id}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{selectedCv.personalInfo.email}</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{selectedCv.personalInfo.phone || 'N/A'}</span>
                              </span>
                              <span className="flex items-center gap-1.5 sm:col-span-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{selectedCv.personalInfo.address || 'Dhaka, Bangladesh'}</span>
                              </span>
                            </div>
                          </div>
                        )}

                        {resumes.length === 0 && (
                          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              {isBn 
                                ? 'আপনার কোনো সিভি সংরক্ষিত নেই। আমরা পরীক্ষা করার সুবিধার্থে একটি ডেমো ডেভেলপার সিভি দিয়ে ইন্টারভিউ রেডি করেছি।' 
                                : 'No uploaded resumes found. We loaded a high-quality system developer resume so you can try the live interview engine instantly!'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>

                  {/* এআই অটো-ডিটেক্টেড ক্যারিয়ার পাথ কার্ড */}
                  <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                    <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-emerald-500" />
                      {isBn ? 'এআই ক্যারিয়ার ডিটেক্টর' : 'AI Career Path Detector'}
                    </h3>

                    {isAnalyzingCv ? (
                      <div className="py-12 flex flex-col items-center gap-3">
                        <div className="h-2 w-24 bg-emerald-500/20 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 animate-pulse w-1/2 rounded-full" />
                        </div>
                        <span className="text-xs text-slate-400 animate-pulse">Analyzing CV keywords...</span>
                      </div>
                    ) : analysis ? (
                      <div className="flex flex-col gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            {isBn ? 'স্বয়ংক্রিয়ভাবে সনাক্তকৃত ক্যারিয়ার পাথ' : 'Detected Career Path'}
                          </span>
                          <div className="px-4 py-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            {analysis.careerPath}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            {isBn ? 'সিভি থেকে সংগৃহীত মূল স্কিলসমূহ' : 'Detected Keywords & Skills'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.skills.map((skill, i) => (
                              <span 
                                key={i} 
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400">
                        {isBn ? 'সিভি বিশ্লেষণ করা যায়নি।' : 'Unable to parse CV.'}
                      </div>
                    )}
                  </Card>
                </div>

                {/* ডান কলাম: রেডিটনেস মিটার ও স্টার্ট ইন্টারভিউ */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-500" />
                        {isBn ? 'ইন্টারভিউ প্রস্তুতি ও এনালাইসিস' : 'Interview Readiness Analysis'}
                      </h3>

                      {isAnalyzingCv ? (
                        <div className="py-24 flex items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                      ) : analysis ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* এআই রেডিটনেস স্কোর */}
                          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                              {isBn ? 'ইন্টারভিউ প্রস্তুতি স্কোর' : 'Interview Readiness Score'}
                            </span>
                            <div className="relative flex items-center justify-center h-28 w-28">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" fill="transparent" />
                                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" className="text-emerald-500" fill="transparent"
                                  strokeDasharray={2 * Math.PI * 48}
                                  strokeDashoffset={2 * Math.PI * 48 * (1 - analysis.readinessScore / 100)} 
                                />
                              </svg>
                              <span className="absolute text-2xl font-black font-mono text-slate-900 dark:text-white">
                                {analysis.readinessScore}%
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 mt-3 font-semibold">
                              {analysis.readinessScore > 80 
                                ? (isBn ? 'চমৎকার প্রস্তুতি!' : 'Excellent Readiness!') 
                                : (isBn ? 'মাঝারি প্রস্তুতি' : 'Moderate Readiness')}
                            </span>
                          </div>

                          {/* বিবরণী মেটাডাটা */}
                          <div className="flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                              <Award className="w-5 h-5 text-emerald-500 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{isBn ? 'জীবনবৃত্তান্ত স্কোর' : 'Resume Score'}</p>
                                <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{analysis.resumeScore}/100</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                              <Clock className="w-5 h-5 text-cyan-500 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{isBn ? 'আনুমানিক সময়সীমা' : 'Estimated Duration'}</p>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">{analysis.duration}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                              <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{isBn ? 'ভাইভা প্রশ্নের সংখ্যা' : 'Total Question'}</p>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">{isBn ? '৫টি এআই ফলো-আপ' : '5 Dynamic Q&As'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* স্টার্ট ইন্টারভিউ অ্যাকশন বোতাম */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3">
                      <p className="text-xs text-slate-500 leading-relaxed text-center">
                        {isBn 
                          ? 'স্টার্ট বোতামে ক্লিক করলে এআই আপনার ক্যারিয়ার পাথ এবং প্রজেক্টের উপর ভিত্তি করে লাইভ প্রশ্ন করবে। আপনি আপনার মাইক্রোফোন ব্যবহার করে ইংরেজিতে উত্তর দিবেন।' 
                          : 'Click start to launch the real-time interview. The AI will ask interactive, dynamic questions adapted from your CV profile, and you will respond using your microphone or keyboard.'}
                      </p>
                      <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={startInterview}
                        disabled={isAnalyzingCv || !analysis}
                        className="w-full text-base font-bold shadow-xl py-3.5 mt-2"
                      >
                        <Play className="w-5 h-5 fill-slate-950" />
                        {isBn ? 'লাইভ এআই ইন্টারভিউ শুরু করুন' : 'Start Live AI Interview'}
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* =========================================================
          STEP 2: RUNNING INTERVIEW (চলতি ভাইভা ইন্টারফেস)
          ========================================================= */}
      {step === 'interview' && (
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* বাম পাশে: এআই অবতার এবং লাইভ প্যারামিটার */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md text-center py-8">
              
              {/* এআই অবতার এবং স্পিকিং পালস এনিমেশন */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className={`absolute h-28 w-28 rounded-full border-4 ${isSpeaking ? 'border-emerald-500/40 scale-110 animate-ping' : 'border-slate-100 dark:border-slate-800'} transition-all`} />
                <div className={`absolute h-24 w-24 rounded-full border-2 ${isSpeaking ? 'border-emerald-400/60 scale-105 animate-pulse' : 'border-slate-200 dark:border-slate-800/50'} transition-all`} />
                
                <div className={`h-20 w-20 rounded-full bg-slate-950 flex items-center justify-center shadow-lg border-2 ${isSpeaking ? 'border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-400'}`}>
                  {isSpeaking ? (
                    <Volume2 className="w-10 h-10 animate-bounce" />
                  ) : (
                    <Video className="w-10 h-10" />
                  )}
                </div>
              </div>

              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {isSpeaking ? (isBn ? 'এআই কথা বলছে...' : 'AI is Speaking...') : (isBn ? 'এআই শুনছে...' : 'AI is Listening...')}
              </h4>
              <p className="text-xs text-slate-400 mt-1">{isBn ? 'ডাইনামিক এআই ইন্টারভিউয়ার' : 'Dynamic AI Recruiter'}</p>

              {/* চলমান ভয়েস ওয়েভ এনিমেশন (যখন ইউজার রেকর্ড করছে) */}
              <div className="h-10 flex items-center justify-center gap-1 mt-6">
                {isRecording ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [12, 36, 12] }}
                      transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-1.5 rounded-full bg-emerald-500"
                    />
                  ))
                ) : (
                  <div className="w-32 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                )}
              </div>

              {/* রানিং স্কোর মিটার ও প্রগ্রেস */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 px-4">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    {isBn ? 'চলমান প্রশ্ন নম্বর' : 'Question Progress'}
                  </span>
                  <div className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                    {currentQuestionIndex + 1} / 5
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    {isBn ? 'চলতি ইন্টারভিউ স্কোর' : 'Avg Score'}
                  </span>
                  <div className="text-base font-black text-emerald-500 font-mono">
                    {averageScore > 0 ? `${averageScore}%` : '---'}
                  </div>
                </div>

                <div className="text-left mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    {isBn ? 'ইন্টারভিউ টাইম' : 'Time Elapsed'}
                  </span>
                  <div className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1 justify-start">
                    <Timer className="w-4 h-4 text-cyan-500 shrink-0" />
                    {formatTime(durationSeconds)}
                  </div>
                </div>

                <div className="text-right mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    {isBn ? 'ক্যাটাগরি' : 'Type'}
                  </span>
                  <Badge variant="info">{currentCategory}</Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* ডান পাশে: মূল প্রশ্নপত্র, ট্রান্সক্রিপ্ট এবং উত্তর লেখার ক্ষেত্র */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md p-6 sm:p-8 flex-1 flex flex-col justify-between">
              
              {/* প্রশ্ন ক্ষেত্র */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold font-mono text-emerald-500 tracking-wider uppercase">
                    {isBn ? `প্রশ্ন নং ${currentQuestionIndex + 1}` : `Question #${currentQuestionIndex + 1}`}
                  </span>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={repeatQuestion}
                      title={isBn ? 'প্রশ্নটি আবার শুনুন' : 'Repeat question audio'}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 transition-all border border-slate-200/40 dark:border-slate-800/40"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* এআই এর প্রশ্ন টেক্সট */}
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-slate-950 dark:text-emerald-100 text-sm sm:text-base font-bold leading-relaxed mb-6 font-sans">
                  {currentQuestion}
                </div>

                {/* এআই পূর্ববর্তী উত্তরের সংক্ষিপ্ত এনালাইসিস প্রদর্শন করে */}
                {feedbackMessage && (
                  <div className="mb-6 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                      <strong className="not-italic text-purple-500 dark:text-purple-400">{isBn ? 'এআই ফিডব্যাক: ' : 'Interviewer Comment: '}</strong>
                      "{feedbackMessage}"
                    </p>
                  </div>
                )}
              </div>

              {/* উত্তর প্রদানের ক্ষেত্র */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  {isBn ? 'আপনার উত্তর এখানে প্রদান করুন (ইংরেজিতে)' : 'Provide Your Answer (In English)'}
                </label>

                {/* যদি ব্রাউজারে স্পিচ সাপোর্ট না করে সতর্কতা */}
                {!speechSupported && (
                  <div className="mb-3 text-[10px] text-amber-500 flex items-center gap-1 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    {isBn ? 'ভয়েস ইনপুট এই ব্রাউজারে কাজ করছে না। ম্যানুয়ালি টাইপ করুন।' : 'Microphone input is unsupported in your browser. Please type your answers.'}
                  </div>
                )}

                {/* টেক্সট এরিয়া ইনপুট */}
                <div className="relative">
                  <textarea 
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder={isBn ? 'স্পিচ-টু-টেক্সট দিয়ে কথা বলুন অথবা সরাসরি এখানে ইংরেজিতে টাইপ করুন...' : 'Speak using the microphone or type your response here in English...'}
                    className="w-full h-40 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 transition-all font-medium leading-relaxed resize-none"
                    disabled={isSubmittingAnswer}
                  />

                  {/* ইন্টারিম ট্রান্সক্রিপ্টিং ওভারলে */}
                  {isRecording && interimTranscript && (
                    <div className="absolute bottom-4 left-4 right-12 bg-emerald-500/90 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
                      🎙️ {interimTranscript}...
                    </div>
                  )}

                  {/* মাইক্রোফোন বাটন টেক্সট এরিয়ার পাশে */}
                  {speechSupported && (
                    <button 
                      onClick={toggleRecording}
                      disabled={isSubmittingAnswer}
                      className={`absolute right-3 top-3 p-3 rounded-xl transition-all ${
                        isRecording 
                          ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-500 border border-slate-200/40 dark:border-slate-800/40'
                      }`}
                      title={isRecording ? (isBn ? 'রেকর্ডিং বন্ধ করুন' : 'Stop voice recording') : (isBn ? 'কথা বলা শুরু করুন' : 'Start voice recording')}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* নিচে অ্যাকশন বাটনসমূহ */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  {/* বাদ দেওয়া এবং পুনরায় চেষ্টা */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={skipQuestion}
                      disabled={isSubmittingAnswer}
                      className="w-full sm:w-auto text-xs font-bold"
                    >
                      {isBn ? 'প্রশ্নটি এড়িয়ে যান' : 'Skip Question'}
                    </Button>
                  </div>

                  {/* সাবমিট বোতাম */}
                  <Button 
                    variant="primary" 
                    onClick={submitAnswer}
                    disabled={isSubmittingAnswer || !answerText.trim()}
                    isLoading={isSubmittingAnswer}
                    className="w-full sm:w-auto font-bold px-8 shadow-xl"
                  >
                    {isBn ? 'পরবর্তী প্রশ্ন' : 'Submit & Next'}
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================
          STEP 3: SKELETON / LOADING TRANSITION (লোডিং ট্রানজিশন)
          ========================================================= */}
      {step === 'loading' && (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-emerald-500">
              AI
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
            {isBn ? 'এআই এনালাইসিস চলছে...' : 'AI Recruiter is Processing...'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            {isBn 
              ? 'এআই আপনার আগের উত্তরের টেকনিক্যাল নির্ভুলতা, কনফিডেন্স, কমিউনিকেশন এবং ভাষা পরিমাপ করছে...' 
              : 'Our advanced Llama-3.1 model is compiling performance statistics, calculating composite metrics, and structuring qualitative feedback...'}
          </p>
        </div>
      )}

      {/* =========================================================
          STEP 4: INTERVIEW SUMMARY / RESULTS (ইন্টারভিউ ফলাফল)
          ========================================================= */}
      {step === 'summary' && session && (
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          
          {/* অভিনন্দন ব্যানার */}
          <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isBn ? 'অভিনন্দন! আপনার ইন্টারভিউ সফলভাবে সম্পন্ন হয়েছে।' : 'Congratulations! Interview Completed successfully.'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isBn ? 'এআই আপনার কর্মক্ষমতা এবং প্রতিটি প্রশ্নের নির্ভুলতা পরিমাপ করেছে।' : 'AI evaluated your technical responses, confidence level, and linguistic fluency.'}
                </p>
              </div>
            </div>
            
            <Button variant="primary" onClick={() => setStep('home')} className="text-xs font-bold gap-1">
              <RefreshCw className="w-4 h-4" />
              {isBn ? 'নতুন ইন্টারভিউ দিন' : 'Take Another Interview'}
            </Button>
          </div>

          {/* প্রধান স্কোরবোর্ড কার্ড */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* বাম পাশ: সামগ্রিক পরিসংখ্যান ও গ্রাফিক্স */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md py-8 text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  {isBn ? 'সামগ্রিক মূল্যায়ন স্কোর' : 'Overall Interview Score'}
                </span>

                <div className="relative inline-flex items-center justify-center h-40 w-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" fill="transparent" />
                    <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="12" className="text-emerald-500" fill="transparent"
                      strokeDasharray={2 * Math.PI * 68}
                      strokeDashoffset={2 * Math.PI * 68 * (1 - (session.scores?.overall || 0) / 100)} 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black font-mono text-slate-900 dark:text-white">
                      {session.scores?.overall}%
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      {session.scores && session.scores.overall > 80 
                        ? (isBn ? 'উত্তীর্ণ' : 'Passed') 
                        : (isBn ? 'উন্নতি প্রয়োজন' : 'Needs Practice')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 px-4">
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase block">{isBn ? 'মোট সময়সীমা' : 'Duration'}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono mt-0.5">{formatTime(session.duration)} mins</p>
                  </div>

                  <div className="text-center border-x border-slate-100 dark:border-slate-800/60">
                    <p className="text-[9px] font-bold text-slate-400 uppercase block">{isBn ? 'প্রশ্নের সংখ্যা' : 'Questions'}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono mt-0.5">{session.qa.length} Qs</p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase block">{isBn ? 'ক্যারিয়ার পাথ' : 'Career Path'}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5" title={session.careerPath}>{session.careerPath}</p>
                  </div>
                </div>
              </Card>

              {/* রাডার চার্ট ভিজ্যুয়ালাইজেশন */}
              <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md p-6">
                <h4 className="text-sm font-bold font-display text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  {isBn ? 'দক্ষতা মেট্রিক্স ভিজ্যুয়ালাইজেশন' : 'Performance Skill Breakdown'}
                </h4>

                <div className="h-64 w-full text-slate-900 dark:text-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData(session.scores)}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 8 }} />
                      <Radar name="Candidate" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* ডান পাশে: সব স্কোর এবং এআই গুণগত ফিডব্যাক */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  {isBn ? 'উপ-দক্ষতা স্কোরসমূহ' : 'Detailed Metrics Evaluation'}
                </h3>

                {session.scores && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* কার্ট আইটেম: টেকনিক্যাল নির্ভুলতা */}
                    {[
                      { label: isBn ? 'টেকনিক্যাল নির্ভুলতা' : 'Technical Accuracy', score: session.scores.technical, color: 'bg-emerald-500' },
                      { label: isBn ? 'কনফিডেন্স বা আত্মবিশ্বাস' : 'Confidence Level', score: session.scores.confidence, color: 'bg-cyan-500' },
                      { label: isBn ? 'যোগাযোগ দক্ষতা' : 'Communication Fluency', score: session.scores.communication, color: 'bg-indigo-500' },
                      { label: isBn ? 'প্রব্লেম সলভিং' : 'Problem Solving', score: session.scores.problemSolving, color: 'bg-pink-500' },
                      { label: isBn ? 'পেশাদারিত্ব ও এটিকেট' : 'Professionalism', score: session.scores.professionalism, color: 'bg-amber-500' },
                      { label: isBn ? 'ইংরেজি বাচনভঙ্গি' : 'English Articulation', score: session.scores.english, color: 'bg-purple-500' }
                    ].map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.label}</span>
                          <span className="text-xs font-black font-mono text-slate-900 dark:text-white">{m.score}/100</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${m.color}`} style={{ width: `${m.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ফিডব্যাক কার্ড: শক্তি, দুর্বলতা, ভুল, সাজেশন */}
              {session.feedback && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* ১. সবল দিকসমূহ */}
                  <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                    <h4 className="text-xs font-extrabold uppercase tracking-wide text-emerald-500 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {isBn ? 'সবল দিকসমূহ (Strengths)' : 'Top Strengths'}
                    </h4>
                    <ul className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {session.feedback.strengths.map((str, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          <p className="leading-relaxed font-medium">{str}</p>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  {/* ২. দুর্বল দিকসমূহ */}
                  <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                    <h4 className="text-xs font-extrabold uppercase tracking-wide text-amber-500 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <AlertTriangle className="w-4 h-4" />
                      {isBn ? 'উন্নতির ক্ষেত্রসমূহ (Weaknesses)' : 'Key Weaknesses'}
                    </h4>
                    <ul className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {session.feedback.weaknesses.map((weak, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          <p className="leading-relaxed font-medium">{weak}</p>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  {/* ৩. শীর্ষ ভুলসমূহ */}
                  <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                    <h4 className="text-xs font-extrabold uppercase tracking-wide text-red-500 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <ShieldAlert className="w-4 h-4" />
                      {isBn ? 'ইন্টারভিউ চলাকালীন ভুলসমূহ' : 'Top Interview Mistakes'}
                    </h4>
                    <ul className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {session.feedback.mistakes.map((mist, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                          <p className="leading-relaxed font-medium">{mist}</p>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  {/* ৪. গুরুত্বপূর্ণ পরামর্শসমূহ */}
                  <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
                    <h4 className="text-xs font-extrabold uppercase tracking-wide text-purple-400 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <Sparkles className="w-4 h-4" />
                      {isBn ? 'এআই পরামর্শসমূহ (Improvement)' : 'Improvement Suggestions'}
                    </h4>
                    <ul className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {session.feedback.suggestions.map((sug, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                          <p className="leading-relaxed font-medium">{sug}</p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* ইন্টারভিউ কথোপকথন রেকর্ড ও বিস্তারিত রিভিউ */}
          <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md p-6">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              {isBn ? 'সম্পূর্ণ ভাইভা কথোপকথন ও বিশ্লেষণ' : 'Interview Q&A Transcript Review'}
            </h3>

            {/* ভার্টিক্যাল টাইমলাইন */}
            <div className="relative border-l border-slate-200 dark:border-slate-800 pl-6 ml-4 flex flex-col gap-8">
              {session.qa.map((qaItem, index) => (
                <div key={qaItem.id} className="relative">
                  {/* আইকন ডট */}
                  <span className="absolute -left-10 top-0.5 bg-emerald-500 text-slate-950 h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border-4 border-white dark:border-[#0c0c0c]">
                    {index + 1}
                  </span>

                  <div className="flex flex-col gap-3">
                    {/* প্রশ্ন ক্ষেত্র */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? 'প্রশ্ন' : 'Question'}</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-emerald-100 leading-relaxed mt-1">{qaItem.question}</p>
                    </div>

                    {/* উত্তর ক্ষেত্র */}
                    {qaItem.answer && (
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          {isBn ? 'প্রার্থীর উত্তর (ভয়েস ট্রান্সক্রিপ্ট)' : 'Your Response (Voice Transcript)'}
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">"{qaItem.answer}"</p>
                        
                        {/* প্রতিটি উত্তরের ইন্ডিভিজুয়াল এআই রিভিউ ও স্কোর */}
                        {qaItem.scores && (
                          <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-3">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
                              {isBn ? 'এআই স্কোরকার্ড' : 'AI Response Scorecard'}
                            </span>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                              <span>{isBn ? 'টেকনিক্যাল' : 'Tech'}: <span className="font-mono text-emerald-500">{qaItem.scores.technical}%</span></span>
                              <span>{isBn ? 'কনফিডেন্স' : 'Confidence'}: <span className="font-mono text-cyan-500">{qaItem.scores.confidence}%</span></span>
                              <span>{isBn ? 'কমিউনিকেশন' : 'Comm'}: <span className="font-mono text-indigo-500">{qaItem.scores.communication}%</span></span>
                              <span>{isBn ? 'প্রব্লেম সলভিং' : 'Problem Solving'}: <span className="font-mono text-pink-500">{qaItem.scores.problemSolving}%</span></span>
                              <span>{isBn ? 'পেশাদারিত্ব' : 'Professionalism'}: <span className="font-mono text-amber-500">{qaItem.scores.professionalism}%</span></span>
                              <span>{isBn ? 'ইংরেজি দক্ষতা' : 'English'}: <span className="font-mono text-purple-500">{qaItem.scores.english}%</span></span>
                            </div>
                            
                            {qaItem.feedback && (
                              <p className="text-[11px] text-slate-400 leading-relaxed italic mt-1 bg-emerald-500/5 px-2.5 py-1.5 rounded border border-emerald-500/10">
                                <strong>{isBn ? 'এআই টিউটর: ' : 'AI Evaluation: '}</strong>
                                {qaItem.feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================
          STEP 5: HISTORY LIST (পূর্ববর্তী ইন্টারভিউ রেকর্ডসমূহ)
          ========================================================= */}
      {step === 'history' && (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <Card className="border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0c0c0c]/80 shadow-md">
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" />
                {isBn ? 'সম্পূর্ণ ইন্টারভিউ হিস্ট্রি ও রেকর্ড' : 'Interview History Records'}
              </span>
              <Badge variant="brand">{historySessions.length} {isBn ? 'রেকর্ড' : 'sessions'}</Badge>
            </h3>

            {/* যদি কোনো রেকর্ড না থাকে */}
            {historySessions.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center">
                  <Video className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'কোনো পূর্ববর্তী রেকর্ড পাওয়া যায়নি।' : 'No Interview Sessions Found'}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  {isBn ? 'ড্যাশবোর্ড হোমে গিয়ে আপনার প্রথম এআই ভাইভা শুরু করুন।' : 'Complete an AI live interview to populate this section with beautiful records.'}
                </p>
                <Button variant="primary" size="sm" onClick={() => setStep('home')} className="mt-2 text-xs font-bold">
                  {isBn ? 'ইন্টারভিউ শুরু করুন' : 'Start Your First Interview'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {historySessions.map(sess => (
                  <div 
                    key={sess.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 transition-all gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sess.careerPath}</h4>
                        <div className="flex flex-wrap gap-2 items-center mt-1 text-[10px] text-slate-400 font-semibold font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(sess.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{formatTime(sess.duration)} mins</span>
                          <span>•</span>
                          <span>{sess.qa.length} Qs</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">{isBn ? 'স্কোর' : 'Overall Score'}</span>
                        <span className="text-base font-black font-mono text-emerald-500">{sess.scores?.overall || 0}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSession(sess);
                            setStep('summary');
                          }}
                          className="text-xs font-bold"
                        >
                          {isBn ? 'বিস্তারিত দেখুন' : 'View Report'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>

                        <button 
                          onClick={() => deleteSessionRecord(sess.id)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-red-500/10 dark:bg-slate-900 dark:hover:bg-red-500/15 text-slate-400 hover:text-red-500 transition-all border border-slate-200/40 dark:border-slate-800/40"
                          title={isBn ? 'রেকর্ড মুছুন' : 'Delete session record'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
