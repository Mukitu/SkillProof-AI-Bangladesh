/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Download, Award, FileText, Video, TrendingUp, Printer, 
  Share2, Copy, ExternalLink, Calendar, ArrowUpDown, Clock, 
  ArrowUpRight, BarChart3, CheckCircle2, AlertCircle, Sparkles, 
  Cpu, Check, History, X, ChevronRight, FileDown, ShieldAlert, Trash2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge } from './UI';
import { reportsDb } from '../lib/reportsSupabase';
import { cvDb } from '../lib/cvSupabase';
import { interviewDb } from '../lib/interviewSupabase';
import { passportDb } from '../lib/passportSupabase';
import { roadmapDb } from '../lib/roadmapSupabase';
import { progressDb } from '../lib/progressSupabase';
import { AiReport, DownloadHistory, ReportType } from '../types/reports';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip 
} from 'recharts';

interface AiReportsProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const AiReports: React.FC<AiReportsProps> = ({ onNavigateToTab }) => {
  const { isBn, t } = useLanguage();
  const { user } = useAuth();
  
  // স্টেটসমূহ (State Declarations)
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<AiReport[]>([]);
  const [downloads, setDownloads] = useState<DownloadHistory[]>([]);
  const [activeReport, setActiveReport] = useState<AiReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingOverall, setGeneratingOverall] = useState(false);

  // ক্যানভাস রেফারেন্স ফর ডাউনলোড পিএনজি (Canvas Ref for PNG generation)
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // এআই সার্বিক ক্যারিয়ার এনালাইসিস বাটন লজিক (AI Overall Career Report generation with Groq)
  const handleGenerateOverallReport = async () => {
    if (!user) return;
    setGeneratingOverall(true);
    try {
      const resumes = await cvDb.getResumes(user.id);
      const interviews = await interviewDb.getSessions(user.id);
      const skills = await passportDb.getSkillsByUserId(user.id);
      const passport = await passportDb.getPassportByUserId(user.id);
      const roadmaps = await roadmapDb.getRoadmaps(user.id);
      const progress = await progressDb.getProgress(user.id);

      const prompt = `You are an elite enterprise AI Career Architect in Bangladesh.
Your task is to analyze the user's real profile, CV analytics, interview sessions, skill passports, roadmap progress, and career tracking metrics to generate a comprehensive, highly personalized Overall Career Summary Report.

Use ONLY the provided real data. Do not hallucinate or add any placeholder fields.
User Profile:
Name: ${user.fullName || 'User'}
Education: ${user.education || 'N/A'}
Experience: ${user.experience || 'N/A'}
Target Career: ${passport?.careerPath || 'Software/Technical Engineering'}

CV Analytics (Resume Analysis):
${JSON.stringify(resumes.map(r => ({
  scores: r.scores,
  feedback: r.feedback,
  skills: r.skills
})))}

Interview History (Viva evaluations):
${JSON.stringify(interviews.map(i => ({
  careerPath: i.careerPath,
  scores: i.scores,
  feedback: i.feedback
})))}

Verified Skills:
${JSON.stringify(skills.map(s => ({
  name: s.skillName,
  level: s.level,
  score: s.score
})))}

Career Roadmap:
${JSON.stringify(roadmaps.map(r => ({
  targetCareer: r.targetCareer,
  phasesCount: r.phases?.length
})))}

Generate an extensive response in JSON format. The response must be a single JSON object.
You MUST respond with a JSON object ONLY, formatted EXACTLY according to the schema below. Do not wrap the JSON in markdown code blocks, and do not include any other text.

Schema:
{
  "summary": "Detailed paragraph explaining overall career status and preparedness",
  "strengths": ["list of 3 key professional strengths found from data"],
  "weaknesses": ["list of 3 critical improvement areas"],
  "readinessScore": number (0 to 100 based on achievements),
  "missingSkills": ["list of technical skills missing from the resume but highly requested"],
  "priorityLearningAreas": ["list of priority areas the user should immediately learn"],
  "suggestedNextSteps": ["list of immediate action steps for career growth"],
  "recommendedCertifications": ["list of industry certifications recommended for this role"],
  "recommendedPortfolioProjects": ["list of high-impact portfolio projects they should build"],
  "recommendedInterviewPrep": ["list of interview prep focus topics to practice"]
}`;

      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 3000
        })
      });

      if (!response.ok) throw new Error('Groq Proxy API error');
      const apiResult = await response.json();
      const content = apiResult.choices?.[0]?.message?.content;
      
      if (content) {
        let cleanJson = content.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        }
        const data = JSON.parse(cleanJson);

        const reportId = `rep_overall_${user.id}`;
        const newReport: AiReport = {
          id: reportId,
          userId: user.id,
          type: 'overall_career',
          titleBn: 'সার্বিক ক্যারিয়ার ওভারভিউ ও এআই বিশ্লেষণ',
          titleEn: 'Overall Career Overview & AI Analysis',
          createdAt: new Date().toISOString(),
          data: {
            summary: data.summary,
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
            readinessScore: data.readinessScore || passport?.readinessScore || 70,
            missingSkills: data.missingSkills || [],
            priorityLearningAreas: data.priorityLearningAreas || [],
            suggestedNextSteps: data.suggestedNextSteps || [],
            recommendedCertifications: data.recommendedCertifications || [],
            recommendedPortfolioProjects: data.recommendedPortfolioProjects || [],
            recommendedInterviewPrep: data.recommendedInterviewPrep || [],
            generatedDate: new Date().toISOString()
          }
        };

        await reportsDb.saveReport(newReport);
        await loadData();
        setActiveReport(newReport);
      }
    } catch (err) {
      console.error('Failed to generate overall report:', err);
    } finally {
      setGeneratingOverall(false);
    }
  };

  // ডাউনলোড রিসিভড ডেটা JSON আকারে
  const handleDownloadJSON = (report: AiReport) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `SPAI-Report-${report.id}.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (user) {
      reportsDb.addDownloadHistory(user.id, `${report.titleEn}.json`, 'JSON', 'Completed');
      loadData();
    }
  };

  // ডাউনলোড রিসিভড ডেটা CSV আকারে
  const handleDownloadCSV = (report: AiReport) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Field,Value\n";
    csvContent += `Report ID,${report.id}\n`;
    csvContent += `Title,${report.titleEn}\n`;
    csvContent += `Date,${new Date(report.createdAt).toLocaleDateString()}\n`;
    csvContent += `Type,${report.type}\n`;
    
    const data = report.data as any;
    Object.keys(data).forEach(key => {
      const val = data[key];
      if (Array.isArray(val)) {
        csvContent += `"${key}","${val.join('; ')}"\n`;
      } else if (typeof val === 'object') {
        csvContent += `"${key}","${JSON.stringify(val).replace(/"/g, '""')}"\n`;
      } else {
        csvContent += `"${key}","${val}"\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.setAttribute("href", encodedUri);
    a.setAttribute("download", `SPAI-Report-${report.id}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (user) {
      reportsDb.addDownloadHistory(user.id, `${report.titleEn}.csv`, 'CSV', 'Completed');
      loadData();
    }
  };

  // রিপোর্ট ডিলিট করা
  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm(isBn ? 'আপনি কি এই রিপোর্টটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this report?')) {
      const success = await reportsDb.deleteReport(reportId);
      if (success) {
        setActiveReport(null);
        await loadData();
      }
    }
  };

  // ডাটা লোড করা (Load report and download history)
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // রিয়েল ডাটা সোর্স থেকে রিপোর্ট রিড ও আপডেট করে (Syncs and fetches)
      const reps = await reportsDb.getReports(user.id);
      setReports(reps);
      
      const history = await reportsDb.getDownloadHistory(user.id);
      setDownloads(history);
    } catch (err) {
      console.error('Error loading reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // কপি শেয়ার লিংক ফাংশন (Copy Share Link)
  const handleCopyLink = (report: AiReport) => {
    const shareUrl = `${window.location.origin}/verify/${report.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(report.id);
    
    // ইতিহাস আপডেট করা
    if (user) {
      reportsDb.addDownloadHistory(user.id, `${report.titleEn} - Share Link`, 'Link', 'Completed');
      loadData();
    }
    
    setTimeout(() => setCopiedId(null), 2000);
  };

  // কিউআর কোড ডাউনলোড করা (Download QR Card Image)
  const handleDownloadQR = (report: AiReport) => {
    const verifyUrl = `${window.location.origin}/verify/${report.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verifyUrl)}`;
    
    // ডাউনলোড রিকোয়েস্ট চালানো
    fetch(qrUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SPAI-Verification-QR-${report.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // ডাউনলোড হিস্টোরি অ্যাড
        if (user) {
          reportsDb.addDownloadHistory(userIdSafe(), `QR_Code_${report.type}.png`, 'QR', 'Completed');
          loadData();
        }
      })
      .catch(err => {
        console.error('Error downloading QR:', err);
        if (user) {
          reportsDb.addDownloadHistory(userIdSafe(), `QR_Code_${report.type}.png`, 'QR', 'Failed');
          loadData();
        }
      });
  };

  // পিএনজি স্কিল কার্ড জেনারেট এবং ডাউনলোড (Generate and download beautiful PNG Skill Card)
  const handleDownloadPNG = (report: AiReport) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ১. ব্যাকগ্রাউন্ড গ্রেডিয়েন্ট (Background gradient)
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, '#0F172A'); // Slate 900
    grad.addColorStop(0.5, '#1E293B'); // Slate 800
    grad.addColorStop(1, '#020617'); // Slate 950
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // ২. বর্ডার ও ডেকোরেশন (Border & Styling)
    ctx.strokeStyle = '#22C55E'; // Brand Green
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 580, 380);

    // ৩. গ্লো ইফেক্ট (Glow corner)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.05)';
    ctx.beginPath();
    ctx.arc(300, 200, 150, 0, Math.PI * 2);
    ctx.fill();

    // ৪. টেক্সট অ্যাড করা (Draw titles and content)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('SkillProof AI Bangladesh', 40, 50);

    ctx.fillStyle = '#10B981';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('OFFICIAL SKILL CERTIFICATION', 40, 75);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(user?.fullName || 'Ariful Islam', 40, 140);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(`Report: ${report.titleEn}`, 40, 175);
    ctx.fillText(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, 40, 205);

    // ৫. স্কোরের উপর ভিত্তি করে ভিন্ন ব্যাজ আঁকা (Score Badge)
    let scoreText = 'N/A';
    if (report.type === 'resume') {
      scoreText = `Score: ${(report.data as any).resumeScore}%`;
    } else if (report.type === 'interview') {
      scoreText = `Overall: ${(report.data as any).overallScore}%`;
    } else if (report.type === 'passport') {
      scoreText = `Readiness: ${(report.data as any).readinessScore}%`;
    } else if (report.type === 'growth') {
      scoreText = `Target Met`;
    } else if (report.type === 'improvement') {
      scoreText = `Up: +${(report.data as any).improvementPercentage}%`;
    }

    ctx.fillStyle = '#22C55E';
    ctx.fillRect(40, 240, 160, 45);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(scoreText, 55, 268);

    // ৬. ভেরিফাইড সিল (Verification Stamp)
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(480, 280, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#22C55E';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED', 480, 275);
    ctx.fillText('AI SECURE', 480, 292);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px monospace';
    ctx.fillText(`ID: ${report.id}`, 480, 350);

    // ডাউনলোড মেকানিজম (Convert canvas to URL & Download)
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `SPAI-SkillCard-${report.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // ডাউনলোড হিস্টোরি আপডেট
    if (user) {
      reportsDb.addDownloadHistory(user.id, `SkillCard_${report.type}.png`, 'PNG', 'Completed');
      loadData();
    }
  };

  // পিডিএফ প্রিন্ট ট্রিগার (Print PDF version)
  const handlePrint = (report: AiReport) => {
    // ডাউনলোড হিস্টোরি অ্যাড
    if (user) {
      reportsDb.addDownloadHistory(user.id, `${report.titleEn}.pdf`, 'PDF', 'Completed');
      loadData();
    }
    
    // উইন্ডো প্রিন্ট চালানো
    window.print();
  };

  // নিরাপদ ইউজার আইডি (Safe user ID extraction)
  const userIdSafe = () => user?.id || 'demo_user_id';

  // ড্যাশবোর্ডের মূল পরিসংখ্যান গণনা (Calculate Report Dashboard Summary Stats)
  const getLatestResumeScore = () => {
    const resumeReps = reports.filter(r => r.type === 'resume');
    if (resumeReps.length === 0) return 0;
    return (resumeReps[0].data as any).resumeScore || 0;
  };

  const getLatestInterviewScore = () => {
    const interviewReps = reports.filter(r => r.type === 'interview');
    if (interviewReps.length === 0) return 0;
    return (interviewReps[0].data as any).overallScore || 0;
  };

  const getReadinessScore = () => {
    const passReps = reports.filter(r => r.type === 'passport');
    if (passReps.length === 0) return 0;
    return (passReps[0].data as any).readinessScore || 0;
  };

  const getSkillLevel = () => {
    const score = getReadinessScore();
    if (score === 0) return isBn ? 'নতুন' : 'Beginner';
    if (score < 40) return 'Beginner';
    if (score < 55) return 'Bronze';
    if (score < 70) return 'Silver';
    if (score < 85) return 'Gold';
    if (score < 95) return 'Platinum';
    return 'Expert';
  };

  const getPassportStatus = () => {
    const passReps = reports.filter(r => r.type === 'passport');
    if (passReps.length === 0) return isBn ? 'অনুপস্থিত' : 'Inactive';
    return isBn ? 'যাচাইকৃত (Verified)' : 'Verified';
  };

  const getTotalInterviews = () => {
    return reports.filter(r => r.type === 'interview').length;
  };

  const getChartData = () => {
    const dataPoints: { name: string; score: number }[] = [];
    const interviewReps = reports.filter(r => r.type === 'interview').slice().reverse();
    const resumeReps = reports.filter(r => r.type === 'resume').slice().reverse();
    const passportReps = reports.filter(r => r.type === 'passport').slice().reverse();

    if (resumeReps.length > 0) {
      resumeReps.forEach((r, i) => {
        dataPoints.push({
          name: `${isBn ? 'সিভি' : 'CV'} #${i + 1}`,
          score: (r.data as any).resumeScore || 70
        });
      });
    }
    if (interviewReps.length > 0) {
      interviewReps.forEach((r, i) => {
        dataPoints.push({
          name: `${isBn ? 'ভাইভা' : 'Viva'} #${i + 1}`,
          score: (r.data as any).overallScore || 70
        });
      });
    }
    if (passportReps.length > 0) {
      passportReps.forEach((r, i) => {
        dataPoints.push({
          name: `${isBn ? 'পাসপোর্ট' : 'Passport'} #${i + 1}`,
          score: (r.data as any).readinessScore || 70
        });
      });
    }

    if (dataPoints.length === 0) {
      return [
        { name: isBn ? 'শুরু' : 'Start', score: 40 },
        { name: isBn ? 'বর্তমান' : 'Current', score: 60 }
      ];
    }
    return dataPoints.slice(-6);
  };

  const getRadarData = () => {
    const latestResume = reports.find(r => r.type === 'resume');
    const latestInterview = reports.find(r => r.type === 'interview');
    const latestPassport = reports.find(r => r.type === 'passport');

    const techScore = latestInterview ? ((latestInterview.data as any).technical || 70) : 60;
    const commScore = latestInterview ? ((latestInterview.data as any).communication || 70) : 65;
    const atsScore = latestResume ? ((latestResume.data as any).atsScore || 75) : 55;
    const readinessScore = latestPassport ? ((latestPassport.data as any).readinessScore || 70) : 60;

    return [
      { subject: isBn ? 'টেকনিক্যাল' : 'Technical', value: techScore },
      { subject: isBn ? 'যোগাযোগ' : 'Communication', value: commScore },
      { subject: isBn ? 'এটিএস ফিট' : 'ATS Fit', value: atsScore },
      { subject: isBn ? 'ক্যারিয়ার রেডিনেস' : 'Readiness', value: readinessScore }
    ];
  };

  // সার্চ এবং ফিল্টারিং লজিক (Search, filter and sort reports)
  const filteredReports = reports.filter(r => {
    // সার্চ ফিল্টার
    const titleMatch = (isBn ? r.titleBn : r.titleEn).toLowerCase().includes(searchQuery.toLowerCase());
    
    // টাইপ ফিল্টার
    const typeMatch = selectedType === 'all' || r.type === selectedType;
    
    // তারিখ ফিল্টার
    let dateMatch = true;
    if (selectedDateFilter !== 'all') {
      const now = new Date();
      const reportDate = new Date(r.createdAt);
      const diffTime = Math.abs(now.getTime() - reportDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (selectedDateFilter === 'today') {
        dateMatch = diffDays <= 1;
      } else if (selectedDateFilter === 'week') {
        dateMatch = diffDays <= 7;
      } else if (selectedDateFilter === 'month') {
        dateMatch = diffDays <= 30;
      }
    }
    
    return titleMatch && typeMatch && dateMatch;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // লোডিং কঙ্কাল (Loading Skeleton)
  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse p-4">
        {/* টপ কার্ডস কঙ্কাল */}
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-900 border border-white/5 rounded-2xl" />
          ))}
        </div>
        {/* মেইন কন্টেন্ট কঙ্কাল */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900 border border-white/5 rounded-3xl" />
          <div className="h-96 bg-slate-900 border border-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* ১. পেজ হেডার এবং ইন্ট্রো (Page Header) */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-green/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-blue/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-brand-green/20 to-brand-blue/20 text-brand-green">
              <Award className="w-6 h-6 animate-pulse" />
            </span>
            <Badge variant="brand">{isBn ? 'এআই রিপোর্ট সেন্টার' : 'AI Export Center'}</Badge>
          </div>
          <h1 className="text-3xl font-extrabold font-display text-white tracking-tight sm:text-4xl">
            {isBn ? 'এআই রিপোর্ট ও এক্সপোর্ট সেন্টার' : 'AI Reports & Export Center'}
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
            {isBn 
              ? 'আপনার এআই মূল্যায়ন, সিভি স্কোর, ভাইভা পারফরম্যান্স এবং স্কিল পাসপোর্টের পেশাদার রিপোর্ট ডাউনলোড, কপি লিঙ্ক ও ভেরিফাই করুন।' 
              : 'Access, preview, download, and share professional reports for all your AI assessments, CV scores, and skill milestones.'}
          </p>
        </div>
        
        {/* অ্যাকশন বাটনসমূহ */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
          <Button
            variant="brand"
            onClick={handleGenerateOverallReport}
            disabled={generatingOverall}
            className="flex items-center justify-center gap-2 relative overflow-hidden group shadow-lg hover:shadow-brand-green/20"
          >
            <Sparkles className={`w-4 h-4 ${generatingOverall ? 'animate-spin' : 'group-hover:animate-bounce'}`} />
            <span>
              {generatingOverall 
                ? (isBn ? 'এআই বিশ্লেষণ চলছে...' : 'AI Analyzing...') 
                : (isBn ? 'এআই ক্যারিয়ার সামারি' : 'AI Career Summary')}
            </span>
          </Button>

          {onNavigateToTab && (
            <Button 
              variant="secondary" 
              onClick={() => onNavigateToTab('interview')}
              className="flex items-center justify-center gap-2 bg-slate-900 border border-white/5 hover:bg-slate-800 text-white"
            >
              <Video className="w-4 h-4 text-brand-green" />
              <span>{isBn ? 'নতুন ভাইভা পরীক্ষা' : 'Take a New Viva'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ২. রিপোর্ট ড্যাশবোর্ড ওভারভিউ স্ট্যাটস (REPORT DASHBOARD SUMMARY) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5 bg-slate-900 border-white/5 relative overflow-hidden group hover:border-brand-green/20 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-green/5 blur-2xl group-hover:bg-brand-green/10 transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">{isBn ? 'সর্বশেষ সিভি স্কোর' : 'Latest CV Score'}</span>
            <FileText className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-display text-white">{getLatestResumeScore()}</span>
            <span className="text-xs text-slate-500">%</span>
          </div>
        </Card>

        <Card className="p-5 bg-slate-900 border-white/5 relative overflow-hidden group hover:border-brand-blue/20 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-blue/5 blur-2xl group-hover:bg-brand-blue/10 transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">{isBn ? 'সর্বশেষ ভাইভা স্কোর' : 'Latest Viva Score'}</span>
            <Video className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-display text-white">{getLatestInterviewScore()}</span>
            <span className="text-xs text-slate-500">%</span>
          </div>
        </Card>

        <Card className="p-5 bg-slate-900 border-white/5 relative overflow-hidden group hover:border-brand-green/20 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-green/5 blur-2xl group-hover:bg-brand-green/10 transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">{isBn ? 'চলতি স্কিল লেভেল' : 'Current Skill Level'}</span>
            <Award className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold font-display text-brand-green">{getSkillLevel()}</span>
            <span className="text-[10px] text-slate-500 mt-1">{isBn ? `রেডিনেস স্কোর: ${getReadinessScore()}%` : `Readiness: ${getReadinessScore()}%`}</span>
          </div>
        </Card>

        <Card className="p-5 bg-slate-900 border-white/5 relative overflow-hidden group hover:border-brand-blue/20 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-blue/5 blur-2xl group-hover:bg-brand-blue/10 transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">{isBn ? 'পাসপোর্ট স্ট্যাটাস' : 'Passport Status'}</span>
            <TrendingUp className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight">{getPassportStatus()}</span>
            <span className="text-[10px] text-slate-500 mt-1">{isBn ? `মোট ইন্টারভিউ: ${getTotalInterviews()}টি` : `Total Interviews: ${getTotalInterviews()}`}</span>
          </div>
        </Card>
      </div>

      {/* এআই অ্যানালিটিক্স ড্যাশবোর্ড গ্রাফস (AI Analytics Dashboard Charts) */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* ১. ক্যারিয়ার রেডিনেস ও অ্যাক্টিভিটি ট্রেন্ড (Area Chart) */}
        <Card className="p-6 bg-slate-900 border-white/5 relative overflow-hidden flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-green" />
              <span>{isBn ? 'দক্ষতা ও ক্যারিয়ার স্কোর ট্রেন্ড' : 'Readiness & Activity Trend'}</span>
            </h3>
            <Badge variant="outline" className="text-slate-400 border-white/10 text-[10px]">Real-Time Sync</Badge>
          </div>
          <div className="h-60 w-full font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#F8FAFC', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" name={isBn ? 'স্কোর' : 'Score'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ২. স্কিল ক্যাটাগরি ডিস্ট্রিবিউশন (Radar / Bar Chart) */}
        <Card className="p-6 bg-slate-900 border-white/5 relative overflow-hidden flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-brand-blue" />
              <span>{isBn ? 'প্রধান ৪টি মূল্যায়ন মাত্রা' : 'Core Evaluation Pillars'}</span>
            </h3>
            <Badge variant="outline" className="text-slate-400 border-white/10 text-[10px]">AI Evaluated</Badge>
          </div>
          <div className="h-60 w-full font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getRadarData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="subject" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#F8FAFC', fontSize: '11px' }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} name={isBn ? 'দক্ষতার হার' : 'Pillar Score'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ৩. সার্চ এবং ফিল্টার কন্ট্রোল (Search and Filter controls) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-900 border border-white/5 rounded-2xl shadow-md">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder={isBn ? 'রিপোর্ট খুঁজুন...' : 'Search reports...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-green/40 font-sans"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          {/* টাইপ ফিল্টার */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-green/40"
          >
            <option value="all">{isBn ? 'সব রিপোর্ট টাইপ' : 'All Types'}</option>
            <option value="resume">{isBn ? 'সিভি বিশ্লেষণ' : 'Resume Analysis'}</option>
            <option value="interview">{isBn ? 'ভাইভা পারফরম্যান্স' : 'Interview Performance'}</option>
            <option value="passport">{isBn ? 'স্কিল পাসপোর্ট' : 'Skill Passport'}</option>
            <option value="growth">{isBn ? 'ক্যারিয়ার গ্রোথ' : 'Career Growth'}</option>
            <option value="improvement">{isBn ? 'উন্নতি ট্র্যাকিং' : 'Improvement Tracking'}</option>
            <option value="roadmap">{isBn ? 'ক্যারিয়ার রোডম্যাপ' : 'Career Roadmap'}</option>
            <option value="overall_career">{isBn ? 'সার্বিক ক্যারিয়ার এনালাইসিস' : 'Overall Career Summary'}</option>
          </select>

          {/* ডেট ফিল্টার */}
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-green/40"
          >
            <option value="all">{isBn ? 'সব সময়' : 'All Time'}</option>
            <option value="today">{isBn ? 'আজকে' : 'Today'}</option>
            <option value="week">{isBn ? 'এই সপ্তাহ' : 'This Week'}</option>
            <option value="month">{isBn ? 'এই মাস' : 'This Month'}</option>
          </select>

          {/* সর্ট অর্ডার বাটন */}
          <Button
            variant="ghost"
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1.5 px-3 py-2 border border-white/5 rounded-xl hover:bg-white/5 !text-white text-xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'newest' ? (isBn ? 'নতুন প্রথম' : 'Newest First') : (isBn ? 'পুরাতন প্রথম' : 'Oldest First')}</span>
          </Button>
        </div>
      </div>

      {/* ৪. প্রধান গ্রিড: রিপোর্টসমূহ এবং ডাউনলোড হিস্টোরি (Main Dashboard Layout) */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* বাম দিকের কলাম: রিপোর্ট লিস্ট (Report List) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-green" />
              <span>{isBn ? 'উপলব্ধ মূল্যায়ন রিপোর্টসমূহ' : 'Available Assessment Reports'}</span>
            </h2>
            <Badge variant="brand">{filteredReports.length}</Badge>
          </div>

          {filteredReports.length === 0 ? (
            <Card className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/50 border-white/5">
              <div className="h-14 w-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {isBn ? 'কোনো রিপোর্ট পাওয়া যায়নি' : 'No Reports Found'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                {isBn 
                  ? 'আপনার কোনো এআই ডাটা মেলেনি। একটি নতুন ভাইভা টেস্ট দিলে বা সিভি এনালাইসিস করলে স্বয়ংক্রিয়ভাবে রিপোর্ট তৈরি হবে।' 
                  : 'You have not completed any AI activities that generate reports yet. Upload a CV or take an interview first.'}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filteredReports.map((report) => {
                  const Icon = report.type === 'resume' ? FileText :
                             report.type === 'interview' ? Video :
                             report.type === 'passport' ? Award :
                             report.type === 'growth' ? TrendingUp :
                             report.type === 'roadmap' ? ArrowUpRight : BarChart3;
                  
                  return (
                    <motion.div
                      key={report.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="p-5 bg-slate-900 border-white/5 hover:border-brand-green/20 group hover:shadow-xl transition-all h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="p-2.5 rounded-xl bg-slate-800 text-brand-green group-hover:bg-brand-green/10 transition-colors">
                              <Icon className="w-5 h-5" />
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="text-md font-bold text-white mb-2 leading-snug group-hover:text-brand-green transition-colors">
                            {isBn ? report.titleBn : report.titleEn}
                          </h3>

                          {/* টাইপ ট্যাগ */}
                          <div className="flex items-center gap-1.5 mb-4">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
                            <span className="text-[11px] text-slate-400 capitalize">
                              {report.type === 'overall_career' ? (isBn ? 'সার্বিক ক্যারিয়ার' : 'Overall Career') : report.type} {isBn ? 'রিপোর্ট' : 'Report'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                          <Button 
                            variant="secondary"
                            onClick={() => setActiveReport(report)}
                            className="w-full text-xs flex items-center justify-center gap-1.5 py-2 hover:bg-brand-green hover:text-slate-950 transition-all font-semibold"
                          >
                            <span>{isBn ? 'রিপোর্ট প্রিভিউ করুন' : 'Preview Report'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                          
                          <div className="grid grid-cols-4 gap-1">
                            <button
                              onClick={() => handleCopyLink(report)}
                              title="Copy Link"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-brand-green/10 text-slate-300 hover:text-brand-green text-[10px] flex items-center justify-center font-mono gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedId === report.id ? 'Copied' : 'Link'}</span>
                            </button>
                            <button
                              onClick={() => handleDownloadPNG(report)}
                              title="PNG card"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-brand-green/10 text-slate-300 hover:text-brand-green text-[10px] flex items-center justify-center gap-1"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span>Card</span>
                            </button>
                            <button
                              onClick={() => handleDownloadQR(report)}
                              title="QR Code"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-brand-green/10 text-slate-300 hover:text-brand-green text-[10px] flex items-center justify-center gap-1"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>QR</span>
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              title="Delete Report"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 text-[10px] flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Del</span>
                            </button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ডান দিকের কলাম: ডাউনলোড হিস্টোরি (Download History Panel) */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <History className="w-5 h-5 text-brand-blue" />
              <span>{isBn ? 'ডাউনলোড হিস্টোরি' : 'Download History'}</span>
            </h2>
            <Badge variant="brand">{downloads.length}</Badge>
          </div>

          <Card className="p-5 bg-slate-900 border-white/5 flex flex-col gap-4">
            {downloads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500">
                  {isBn ? 'কোনো ডাউনলোডের ইতিহাস নেই।' : 'No download history found.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                {downloads.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-xs" title={item.fileName}>
                        {item.fileName}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="uppercase font-mono text-brand-green">{item.type}</span>
                        <span>•</span>
                        <span>{new Date(item.downloadDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'Completed' ? 'bg-brand-green' : 'bg-red-500'}`} />
                      <span className={`text-[10px] font-mono ${item.status === 'Completed' ? 'text-brand-green' : 'text-red-400'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* ৫. বিশদ রিপোর্ট প্রিভিউ মোডাল (Detailed Report Preview Modal) */}
      <AnimatePresence>
        {activeReport && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-200"
            >
              {/* প্রিভিউ মোডাল হেডার (Modal Header) */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-brand-green/10 text-brand-green">
                    {activeReport.type === 'resume' ? <FileText className="w-5 h-5" /> :
                     activeReport.type === 'interview' ? <Video className="w-5 h-5" /> :
                     activeReport.type === 'passport' ? <Award className="w-5 h-5" /> :
                     activeReport.type === 'growth' ? <TrendingUp className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {isBn ? activeReport.titleBn : activeReport.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Generated: {new Date(activeReport.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveReport(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* প্রিভিউ মোডাল বডি (Modal Body containing specific Report Details) */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 print-report-content">
                
                {/* ক. সিভি রিপোর্ট (RESUME REPORT VIEW) */}
                {activeReport.type === 'resume' && (
                  <div className="flex flex-col gap-6">
                    {/* স্কোর ওভারভিউ */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-center">
                        <span className="text-xs text-slate-400 block mb-1">{isBn ? 'সিভি কোয়ালিটি স্কোর' : 'Resume Quality Score'}</span>
                        <span className="text-3xl font-bold font-display text-brand-green">{(activeReport.data as any).resumeScore}%</span>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-center">
                        <span className="text-xs text-slate-400 block mb-1">{isBn ? 'এটিএস ফিট স্কোর' : 'ATS Fit Score'}</span>
                        <span className="text-3xl font-bold font-display text-brand-blue">{(activeReport.data as any).atsScore}%</span>
                      </div>
                    </div>

                    {/* প্রোফাইল কমপ্লিশন বার */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-slate-400">{isBn ? 'প্রোফাইল সম্পূর্ণতা' : 'Profile Completion'}</span>
                        <span className="font-bold text-white">{(activeReport.data as any).profileCompletion}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-brand-green h-full" style={{ width: `${(activeReport.data as any).profileCompletion}%` }} />
                      </div>
                    </div>

                    {/* শক্তির দিক ও দুর্বলতা (Strengths and Weaknesses) */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                        <h4 className="text-sm font-bold text-brand-green mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isBn ? 'শক্তির দিকসমূহ (Strengths)' : 'Key Strengths'}</span>
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                          {(activeReport.data as any).strengths.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" />
                          <span>{isBn ? 'ঘাটতিসমূহ (Weaknesses)' : 'Weak Areas'}</span>
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                          {(activeReport.data as any).weaknesses.map((w: string, idx: number) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* বাদ পড়া স্কিল এবং পরামর্শ (Missing Skills and Suggestions) */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-brand-blue" />
                        <span>{isBn ? 'বাদ পড়া দরকারি স্কিল' : 'Missing Tech Stack'}</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(activeReport.data as any).missingSkills.map((sk: string, idx: number) => (
                          <Badge key={idx} variant="brand">{sk}</Badge>
                        ))}
                      </div>

                      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-green" />
                        <span>{isBn ? 'উন্নতি করার পরামর্শ' : 'Actionable Suggestions'}</span>
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-2">
                        {(activeReport.data as any).suggestions.map((sg: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-brand-green mt-1">•</span>
                            <span>{sg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* খ. ভাইভা পারফরম্যান্স রিপোর্ট (INTERVIEW PERFORMANCE REPORT VIEW) */}
                {activeReport.type === 'interview' && (
                  <div className="flex flex-col gap-6">
                    {/* স্কোরবোর্ড */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-center col-span-2 sm:col-span-1">
                        <span className="text-xs text-slate-400 block mb-1">{isBn ? 'সার্বিক ভাইভা স্কোর' : 'Overall Score'}</span>
                        <span className="text-3xl font-extrabold font-display text-brand-green">{(activeReport.data as any).overallScore}%</span>
                      </div>
                      
                      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col justify-center text-center">
                        <span className="text-[11px] text-slate-400 block mb-0.5">{isBn ? 'টেকনিক্যাল গভীরতা' : 'Technical'}</span>
                        <span className="text-lg font-bold text-white">{(activeReport.data as any).technical}%</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col justify-center text-center">
                        <span className="text-[11px] text-slate-400 block mb-0.5">{isBn ? 'যোগাযোগ দক্ষতা' : 'Communication'}</span>
                        <span className="text-lg font-bold text-white">{(activeReport.data as any).communication}%</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col justify-center text-center">
                        <span className="text-[11px] text-slate-400 block mb-0.5">{isBn ? 'আত্মবিশ্বাস' : 'Confidence'}</span>
                        <span className="text-lg font-bold text-white">{(activeReport.data as any).confidence}%</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col justify-center text-center">
                        <span className="text-[11px] text-slate-400 block mb-0.5">{isBn ? 'সমস্যা সমাধান' : 'Problem Solving'}</span>
                        <span className="text-lg font-bold text-white">{(activeReport.data as any).problemSolving}%</span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col justify-center text-center">
                        <span className="text-[11px] text-slate-400 block mb-0.5">{isBn ? 'ইংরেজি বাচনভঙ্গি' : 'English Skills'}</span>
                        <span className="text-lg font-bold text-white">{(activeReport.data as any).english}%</span>
                      </div>
                    </div>

                    {/* প্রশ্নসংখ্যা ও উত্তরের সারাংশ */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <span className="text-xs text-slate-500 block mb-1">
                        {isBn ? `মোট জিজ্ঞাসিত প্রশ্ন: ${(activeReport.data as any).questionsCount}টি` : `Total Questions Asked: ${(activeReport.data as any).questionsCount}`}
                      </span>
                      <h4 className="text-sm font-bold text-white mb-2">{isBn ? 'উত্তরের এআই বিশ্লেষণ ও সারাংশ' : 'Answer Summary & AI Insights'}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {(activeReport.data as any).answerSummary}
                      </p>
                    </div>

                    {/* ভাইভা শক্তির দিক, দুর্বলতা ও পরামর্শ */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                        <h4 className="text-sm font-bold text-brand-green mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isBn ? 'শক্তির ক্ষেত্রসমূহ' : 'Key Strengths'}</span>
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                          {(activeReport.data as any).strengths.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" />
                          <span>{isBn ? 'উন্নতি করার ক্ষেত্র' : 'Areas to Improve'}</span>
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                          {(activeReport.data as any).weaknesses.map((w: string, idx: number) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-green" />
                        <span>{isBn ? 'এআই গাইডলাইন ও পরবর্তী পরামর্শ' : 'AI Career Recommendations'}</span>
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-2">
                        {(activeReport.data as any).suggestions.map((sg: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-brand-green mt-1">•</span>
                            <span>{sg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* গ. স্কিল পাসপোর্ট রিপোর্ট (SKILL PASSPORT REPORT VIEW) */}
                {activeReport.type === 'passport' && (
                  <div className="flex flex-col gap-6">
                    {/* টপ পাসপোর্ট ডিটেইলস */}
                    <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex flex-col gap-1.5 text-center sm:text-left">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Passport ID</span>
                        <span className="text-md font-bold text-white font-mono">{(activeReport.data as any).passportId}</span>
                        <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                          <Badge variant="brand">{isBn ? 'অগ্রগতি ট্র্যাকার সক্রিয়' : 'Active Passport'}</Badge>
                          <span className="text-xs text-slate-400">{isBn ? `রেডিনেস স্কোর: ${(activeReport.data as any).readinessScore}%` : `Readiness: ${(activeReport.data as any).readinessScore}%`}</span>
                        </div>
                      </div>

                      {/* কিউআর কোড সিল */}
                      <div className="flex flex-col items-center gap-1.5">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent((activeReport.data as any).verificationUrl)}`}
                          alt="QR Code Stamp"
                          className="w-20 h-20 bg-white p-1 rounded-lg border"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">Verify Online</span>
                      </div>
                    </div>

                    {/* বর্তমান দক্ষতা ও ব্যাজ তালিকা */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                        <Award className="w-5 h-5 text-brand-green" />
                        <span>{isBn ? 'অর্জিত স্কিল ও দক্ষতা লেভেল' : 'Verified Skills & Badges'}</span>
                      </h4>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {(activeReport.data as any).skills.map((sk: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">{sk.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">Score: {sk.score}%</span>
                              <Badge variant="brand" className="uppercase text-[9px]">{sk.level}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ঘ. ক্যারিয়ার গ্রোথ রিপোর্ট (CAREER GROWTH REPORT VIEW) */}
                {activeReport.type === 'growth' && (
                  <div className="flex flex-col gap-6">
                    {/* ওভারভিউ লক্ষ্য */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-500 block mb-0.5">{isBn ? 'আপনার প্রধান ক্যারিয়ার গোল' : 'Primary Target Role'}</span>
                          <span className="text-md font-bold text-white">{(activeReport.data as any).goalTitle}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block mb-0.5">{isBn ? 'চলতি উইকলি টাস্ক গোল' : 'Weekly Goal'}</span>
                          <span className="text-sm text-slate-300 font-semibold">{(activeReport.data as any).weeklyGoal}</span>
                        </div>
                      </div>
                    </div>

                    {/* উন্নত ও ঘাটতিযুক্ত দক্ষতা */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                        <h4 className="text-sm font-bold text-brand-green mb-2">{isBn ? 'উন্নতি সাধিত স্কিল' : 'Improved Skills'}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeReport.data as any).improvedSkills.length === 0 ? (
                            <span className="text-xs text-slate-400">Not enough data</span>
                          ) : (
                            (activeReport.data as any).improvedSkills.map((s: string, idx: number) => (
                              <Badge key={idx} variant="brand">{s}</Badge>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <h4 className="text-sm font-bold text-red-400 mb-2">{isBn ? 'দুর্বলতার ক্ষেত্র ও ঘাটতি স্কিল' : 'Target Skills to Build'}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeReport.data as any).weakSkills.length === 0 ? (
                            <span className="text-xs text-slate-400">Not enough data</span>
                          ) : (
                            (activeReport.data as any).weakSkills.map((s: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-red-400 border-red-500/20">{s}</Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* অর্জন এবং লার্নিং টাইমলাইন */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-3">{isBn ? 'টাইমলাইন ও অর্জিত অগ্রগতি মাইলস্টোন' : 'Growth Timeline & Milestones'}</h4>
                      <div className="flex flex-col gap-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-brand-green/20">
                        {(activeReport.data as any).growthTimeline.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-4 pl-6 relative">
                            <span className="absolute left-[5px] top-[7px] w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                            <div className="flex-1 text-xs">
                              <span className="text-[10px] text-slate-500 block">{new Date(item.date).toLocaleDateString()}</span>
                              <p className="text-slate-200 mt-0.5">{item.event}</p>
                              <span className="text-[10px] text-brand-green">Score: {item.score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ঙ. ইন্টারভিউ ইমপ্রুভমেন্ট রিপোর্ট (INTERVIEW IMPROVEMENT REPORT VIEW) */}
                {activeReport.type === 'improvement' && (
                  <div className="flex flex-col gap-6">
                    {/* সার্বিক স্কোর উন্নয়ন হার */}
                    <div className="p-5 bg-gradient-to-r from-brand-green/10 to-brand-blue/10 rounded-2xl border border-brand-green/20 text-center flex flex-col items-center justify-center gap-1">
                      <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">{isBn ? 'সার্বিক ভাইভা ইমপ্রুভমেন্ট রেট' : 'Overall Improvement Rate'}</span>
                      <span className="text-4xl font-black font-display text-brand-green">
                        +{(activeReport.data as any).improvementPercentage}%
                      </span>
                      <p className="text-xs text-slate-400 mt-1 max-w-md">
                        {isBn 
                          ? `পূর্ববর্তী ভাইভা স্কোর ${(activeReport.data as any).previousScore}% থেকে সর্বশেষ ভাইভাতে ${(activeReport.data as any).currentScore}% স্কোর অর্জন করেছেন।` 
                          : `You moved from a ${(activeReport.data as any).previousScore}% score in your prior interview to a ${(activeReport.data as any).currentScore}% score in your latest interview.`}
                      </p>
                    </div>

                    {/* স্কিল ভিত্তিক তুলনা */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-4">{isBn ? 'দক্ষতা ভিত্তিক তুলনা ও অগ্রগতি' : 'Skill Area Performance Progression'}</h4>
                      <div className="space-y-4">
                        {(activeReport.data as any).skillComparison.map((sc: any, idx: number) => {
                          const diff = sc.current - sc.prev;
                          return (
                            <div key={idx} className="text-xs">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="font-semibold text-slate-300">{sc.name}</span>
                                <span className={diff >= 0 ? 'text-brand-green' : 'text-red-400'}>
                                  {diff >= 0 ? `+${diff}%` : `${diff}%`}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500">Prev:</span>
                                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-slate-600 h-full" style={{ width: `${sc.prev}%` }} />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{sc.prev}%</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500">Now:</span>
                                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-brand-green h-full" style={{ width: `${sc.current}%` }} />
                                  </div>
                                  <span className="text-[10px] text-brand-green font-mono">{sc.current}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* আত্মবিশ্বাস ও যোগাযোগ তুলনা */}
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                        <h4 className="font-bold text-white mb-2">{isBn ? 'আত্মবিশ্বাস বৃদ্ধির তুলনা' : 'Confidence Level Progression'}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">{isBn ? 'পূর্ববর্তী ভাইভা:' : 'Previous Viva:'} {(activeReport.data as any).confidenceComparison.prev}%</span>
                          <span className="text-brand-green font-bold">{isBn ? 'সর্বশেষ ভাইভা:' : 'Latest Viva:'} {(activeReport.data as any).confidenceComparison.current}%</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                        <h4 className="font-bold text-white mb-2">{isBn ? 'যোগাযোগ দক্ষতা তুলনা' : 'Communication Flow Progression'}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">{isBn ? 'পূর্ববর্তী ভাইভা:' : 'Previous Viva:'} {(activeReport.data as any).communicationComparison.prev}%</span>
                          <span className="text-brand-green font-bold">{isBn ? 'সর্বশেষ ভাইভা:' : 'Latest Viva:'} {(activeReport.data as any).communicationComparison.current}%</span>
                        </div>
                      </div>
                    </div>

                    {/* এআই পরামর্শ */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-green" />
                        <span>{isBn ? 'এআই কাস্টম পরামর্শ ও গাইডলাইন' : 'Targeted AI Advice & Next Action Steps'}</span>
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-2">
                        {(activeReport.data as any).aiSuggestions.map((sg: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-brand-green mt-1">•</span>
                            <span>{sg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* চ. ক্যারিয়ার রোডম্যাপ রিপোর্ট (CAREER ROADMAP REPORT VIEW) */}
                {activeReport.type === 'roadmap' && (
                  <div className="flex flex-col gap-6">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-500 block mb-0.5">{isBn ? 'ক্যারিয়ার পাথ' : 'Target Career Path'}</span>
                          <span className="text-md font-bold text-white">{(activeReport.data as any).targetCareer}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block mb-0.5">{isBn ? 'আনুমানিক সমাপ্তি সময়কাল' : 'Estimated Duration'}</span>
                          <span className="text-sm text-brand-green font-bold">{(activeReport.data as any).estimatedCompletion || '6 Months'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-brand-green" />
                        <span>{isBn ? 'রোডম্যাপ মাইলস্টোন ধাপসমূহ' : 'Roadmap Phases & Milestones'}</span>
                      </h4>
                      <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-brand-green/20">
                        {((activeReport.data as any).phases || []).map((phase: any, pIdx: number) => (
                          <div key={pIdx} className="flex gap-4 pl-8 relative">
                            <span className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${phase.status === 'Completed' ? 'bg-brand-green border-brand-green' : 'bg-slate-900 border-slate-700'}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-xs font-bold text-white">{phase.title}</h5>
                                <Badge variant="brand" className="text-[9px] uppercase">{phase.status}</Badge>
                              </div>
                              <p className="text-[11px] text-slate-400 mb-2">{phase.description}</p>
                              
                              {phase.skills && phase.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {phase.skills.map((sk: string, sIdx: number) => (
                                    <Badge key={sIdx} variant="outline" className="text-[9px] text-slate-300 border-white/5">{sk}</Badge>
                                  ))}
                                </div>
                              )}
                              
                              {phase.resources && phase.resources.length > 0 && (
                                <div className="p-2 bg-slate-900 rounded-lg border border-white/5">
                                  <span className="text-[10px] text-slate-500 block mb-1 font-semibold">{isBn ? 'প্রস্তাবিত রিসোর্সসমূহ:' : 'Recommended Resources:'}</span>
                                  <ul className="list-disc list-inside text-[10px] text-brand-blue space-y-0.5">
                                    {phase.resources.map((res: string, rIdx: number) => (
                                      <li key={rIdx}>{res}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ছ. সার্বিক ক্যারিয়ার সামারি রিপোর্ট (OVERALL CAREER SUMMARY REPORT VIEW) */}
                {activeReport.type === 'overall_career' && (
                  <div className="flex flex-col gap-6">
                    {/* মূল সামারি প্যারাগ্রাফ */}
                    <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-brand-green/5 blur-2xl rounded-full pointer-events-none" />
                      <h4 className="text-sm font-bold text-white mb-2.5 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-green animate-pulse" />
                        <span>{isBn ? 'এআই সার্বিক মূল্যায়ন সারাংশ' : 'Comprehensive AI Executive Summary'}</span>
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {(activeReport.data as any).summary}
                      </p>
                    </div>

                    {/* শক্তির দিক ও দুর্বলতা (Strengths and Weaknesses) */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                        <h4 className="text-sm font-bold text-brand-green mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isBn ? 'চিহ্নিত পেশাদার শক্তিমত্তা' : 'Identified Core Strengths'}</span>
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                          {((activeReport.data as any).strengths || []).map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" />
                          <span>{isBn ? 'উন্নতিযোগ্য ক্ষেত্রসমূহ' : 'Areas for Direct Action'}</span>
                        </h4>
                        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                          {((activeReport.data as any).weaknesses || []).map((w: string, idx: number) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* স্কিল অ্যান্ড লার্নিং অ্যাকশন প্ল্যান */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 grid sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">{isBn ? 'অনুপস্থিত টেক স্কিলসমূহ' : 'Missing Tech Stack'}</h4>
                        <div className="flex flex-wrap gap-1">
                          {((activeReport.data as any).missingSkills || []).map((sk: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-red-400 border-red-500/20 text-[9px]">{sk}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">{isBn ? 'অগ্রাধিকার শিক্ষা ক্ষেত্র' : 'Priority Learning Areas'}</h4>
                        <div className="flex flex-wrap gap-1">
                          {((activeReport.data as any).priorityLearningAreas || []).map((la: string, idx: number) => (
                            <Badge key={idx} variant="brand" className="text-[9px]">{la}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* সাজেস্টেড অ্যাকশন ও পরবর্তী ধাপ */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-brand-blue" />
                        <span>{isBn ? 'পরবর্তী বাস্তবসম্মত পদক্ষেপ' : 'Next Growth Action Steps'}</span>
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-2.5">
                        {((activeReport.data as any).suggestedNextSteps || []).map((step: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="p-0.5 rounded bg-brand-green/20 text-brand-green font-mono text-[9px] font-bold mt-0.5">0{idx + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* পোর্টফোলিও প্রজেক্ট ও ভাইভা প্রস্তুতি */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex flex-col gap-2">
                        <h5 className="text-xs font-bold text-brand-green">{isBn ? 'প্রস্তাবিত সার্টিফিকেশন' : 'Target Certifications'}</h5>
                        <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                          {((activeReport.data as any).recommendedCertifications || []).map((cert: string, idx: number) => (
                            <li key={idx}>{cert}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex flex-col gap-2">
                        <h5 className="text-xs font-bold text-brand-blue">{isBn ? 'হাই-ইমপ্যাক্ট প্রজেক্ট আইডিয়া' : 'High-Impact Project Ideas'}</h5>
                        <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                          {((activeReport.data as any).recommendedPortfolioProjects || []).map((proj: string, idx: number) => (
                            <li key={idx}>{proj}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex flex-col gap-2">
                        <h5 className="text-xs font-bold text-white">{isBn ? 'ভাইভা অনুশীলনের বিষয়' : 'Interview Prep Focus'}</h5>
                        <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                          {((activeReport.data as any).recommendedInterviewPrep || []).map((prep: string, idx: number) => (
                            <li key={idx}>{prep}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* প্রিভিউ মোডাল ফুটার (Modal Export Controls) */}
              <div className="p-6 border-t border-white/5 flex flex-wrap gap-3 items-center justify-between bg-slate-950">
                <Button
                  variant="ghost"
                  onClick={() => setActiveReport(null)}
                  className="hover:bg-white/5 !text-white text-xs py-2.5 font-semibold"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close Preview'}
                </Button>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handlePrint(activeReport)}
                    className="flex items-center gap-1.5 text-xs py-2 px-3 border border-white/5 hover:bg-slate-800"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isBn ? 'পিডিএফ ও প্রিন্ট' : 'PDF / Print'}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadJSON(activeReport)}
                    className="flex items-center gap-1.5 text-xs py-2 px-3 border border-white/5 hover:bg-slate-800"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadCSV(activeReport)}
                    className="flex items-center gap-1.5 text-xs py-2 px-3 border border-white/5 hover:bg-slate-800"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </Button>

                  <Button
                    variant="brand"
                    onClick={() => handleDownloadPNG(activeReport)}
                    className="flex items-center gap-1.5 text-xs py-2 px-3 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBn ? 'PNG কার্ড' : 'Download PNG'}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleCopyLink(activeReport)}
                    className="flex items-center gap-1.5 text-xs py-2 px-3 border border-white/5 hover:bg-slate-800"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>
                      {copiedId === activeReport.id ? (isBn ? 'লিঙ্ক কপিড!' : 'Copied!') : (isBn ? 'শেয়ার লিঙ্ক' : 'Copy Link')}
                    </span>
                  </Button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
