/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Sparkles, Plus, Trash2, UploadCloud, CheckCircle, 
  AlertCircle, ArrowRight, ArrowLeft, Check, X, Download, 
  Loader2, Activity, Briefcase, GraduationCap, Award, Cpu, 
  Globe, Languages, ExternalLink, RefreshCw, Layout, Eye,
  CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';

import { Card, Button, Badge } from './UI';
import { cvDb } from '../lib/cvSupabase';
import { cvGroq } from '../lib/cvGroq';
import { CvData, PersonalInfo, EducationItem, ExperienceItem, ProjectItem, CvSkills, ResumeTemplateId, AiScores, AiFeedback, CvImprovementHistory } from '../types';

interface AiSmartCvProps {
  userId: string;
  isBn: boolean;
  onBack: () => void;
}

// ইন-মেমোরি সফল বা ব্যর্থ মেসেজ দেখানোর জন্য কাস্টম টোস্ট মেকানিজম (Custom Toast)
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const AiSmartCv: React.FC<AiSmartCvProps> = ({ userId, isBn, onBack }) => {
  // অ্যাপ স্টেটসমূহ (Core App States)
  const [activeView, setActiveView] = useState<'home' | 'builder' | 'dashboard'>('home');
  const [cvList, setCvList] = useState<CvData[]>([]);
  const [selectedCv, setSelectedCv] = useState<CvData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ফাইল আপলোড স্টেট (File Upload States)
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // উইজার্ড স্টেট (CV Builder Wizard States)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [wizardCv, setWizardCv] = useState<Partial<CvData>>({
    personalInfo: {
      name: '',
      phone: '',
      email: '',
      address: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    careerSummary: '',
    education: [],
    experience: [],
    projects: [],
    skills: {
      softSkills: [],
      technicalSkills: [],
      languages: [],
      certificates: []
    },
    templateId: 'modern'
  });

  // এআই ইম্প্রুভমেন্ট তুলনা স্টেট (AI Comparison Mode State)
  const [comparison, setComparison] = useState<{
    isOpen: boolean;
    section: 'summary' | 'experience' | 'project';
    itemId?: string;
    before: string;
    after: string;
  } | null>(null);

  // নোটিফিকেশন টোস্ট ফাংশন (Add interactive toast notifications)
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // ডাটাবেজ থেকে সিভি লিস্ট লোড করা (Load CV data on mount)
  const loadCvs = async () => {
    setLoading(true);
    try {
      const list = await cvDb.getResumes(userId);
      setCvList(list);
      if (list.length > 0) {
        // সর্বশেষ এডিট করা সিভি সিলেক্ট করি (Select latest edited CV)
        setSelectedCv(list[0]);
      }
    } catch (err) {
      showToast(isBn ? 'সিভি লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load CVs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCvs();
  }, [userId]);

  // এপিআই কি কনফিগারেশন ওয়ার্নিং ব্যানার চেক (Check environment keys)
  const hasSupabase = cvDb.isConfigured();
  const hasGroq = cvGroq.isConfigured();

  // ==========================================
  // অটো সেভ সিস্টেম (Auto Save Mechanism)
  // ==========================================
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const triggerAutoSave = (updatedData: CvData) => {
    setSaving(true);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const res = await cvDb.saveResume(updatedData);
        if (res.success) {
          // লোকাল লিস্ট রিফ্রেশ (Refresh local listing cached copies)
          setCvList(prev => prev.map(item => item.id === updatedData.id ? updatedData : item));
        }
      } catch (err) {
        console.error('Auto save failure:', err);
      } finally {
        setSaving(false);
      }
    }, 1500); // ১.৫ সেকেন্ড ডিবিল্ডিং ডিলে (1.5s debounce delay)
  };

  // ==========================================
  // ফিচার এ: সিভি বিল্ডার উইজার্ড হ্যান্ডলারস
  // ==========================================

  const startNewCv = () => {
    const newId = 'cv_' + Math.random().toString(36).substr(2, 9);
    setWizardCv({
      id: newId,
      userId,
      personalInfo: {
        name: '',
        phone: '',
        email: '',
        address: '',
        linkedin: '',
        github: '',
        portfolio: ''
      },
      careerSummary: '',
      education: [
        { id: 'edu_1', degree: '', institution: '', year: '', gpa: '' }
      ],
      experience: [
        { id: 'exp_1', company: '', role: '', duration: '', description: '', isCurrent: false }
      ],
      projects: [
        { id: 'proj_1', title: '', description: '', techStack: '', github: '', liveLink: '' }
      ],
      skills: {
        softSkills: ['Problem Solving', 'Communication'],
        technicalSkills: ['React', 'JavaScript'],
        languages: ['English', 'Bangla'],
        certificates: []
      },
      templateId: 'modern',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setCurrentStep(1);
    setActiveView('builder');
  };

  // ইনপুট হ্যান্ডলার (General Wizard Inputs updates)
  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setWizardCv(prev => {
      const next = {
        ...prev,
        personalInfo: {
          ...prev.personalInfo!,
          [field]: value
        }
      };
      // অটো সেভ ট্রিগার যদি বিল্ডার মোডে সিভি আইডি জেনারেট হয়ে থাকে
      if (next.id) triggerAutoSave(next as CvData);
      return next;
    });
  };

  const updateCareerSummary = (value: string) => {
    setWizardCv(prev => {
      const next = { ...prev, careerSummary: value };
      if (next.id) triggerAutoSave(next as CvData);
      return next;
    });
  };

  // ক্যারিয়ার সামারি এআই অ্যাসিস্ট (Groq Summary Writer)
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const handleAiAssistSummary = async () => {
    setGeneratingSummary(true);
    showToast(isBn ? 'এআই ক্যারিয়ার সামারি জেনারেট করছে...' : 'AI is generating career summary...', 'info');
    try {
      const profileInfo = {
        name: wizardCv.personalInfo?.name || 'Professional',
        skills: wizardCv.skills?.technicalSkills || [],
        education: wizardCv.education?.[0]?.degree || '',
        experience: wizardCv.experience?.[0]?.description || ''
      };
      const summary = await cvGroq.generateCareerSummary(profileInfo);
      
      // ডাইরেক্ট কম্পেয়ার মোড চালু করি (Enable comparisons)
      setComparison({
        isOpen: true,
        section: 'summary',
        before: wizardCv.careerSummary || '',
        after: summary
      });
    } catch (err) {
      showToast(isBn ? 'এআই সামারি তৈরিতে ত্রুটি।' : 'AI Assist summary failed.', 'error');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // এডুকেশন ডাইনামিক ফিল্ডস (Education item add/edit/remove)
  const addEducation = () => {
    const newItem: EducationItem = {
      id: 'edu_' + Math.random().toString(36).substr(2, 5),
      degree: '',
      institution: '',
      year: '',
      gpa: ''
    };
    setWizardCv(prev => {
      const next = { ...prev, education: [...prev.education!, newItem] };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  const updateEducation = (id: string, field: keyof EducationItem, value: string) => {
    setWizardCv(prev => {
      const updated = prev.education!.map(item => item.id === id ? { ...item, [field]: value } : item);
      const next = { ...prev, education: updated };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  const removeEducation = (id: string) => {
    if (wizardCv.education!.length <= 1) {
      showToast(isBn ? 'কমপক্ষে একটি শিক্ষাগত যোগ্যতা থাকতে হবে।' : 'At least one education entry is required.', 'info');
      return;
    }
    setWizardCv(prev => {
      const next = { ...prev, education: prev.education!.filter(item => item.id !== id) };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  // এক্সপেরিয়েন্স ডাইনামিক ফিল্ডস (Experience item add/edit/remove)
  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: 'exp_' + Math.random().toString(36).substr(2, 5),
      company: '',
      role: '',
      duration: '',
      description: '',
      isCurrent: false
    };
    setWizardCv(prev => {
      const next = { ...prev, experience: [...prev.experience!, newItem] };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  const updateExperience = (id: string, field: keyof ExperienceItem, value: string | boolean) => {
    setWizardCv(prev => {
      const updated = prev.experience!.map(item => item.id === id ? { ...item, [field]: value } : item);
      const next = { ...prev, experience: updated };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  const removeExperience = (id: string) => {
    setWizardCv(prev => {
      const next = { ...prev, experience: prev.experience!.filter(item => item.id !== id) };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  // এআই ইম্প্রুভ এক্সপেরিয়েন্স (Improve experience description with Groq)
  const [improvingId, setImprovingId] = useState<string | null>(null);
  const handleAiImproveExperience = async (id: string) => {
    const expItem = wizardCv.experience?.find(item => item.id === id);
    if (!expItem || !expItem.description) {
      showToast(isBn ? 'অনুগ্রহ করে প্রথমে কাজের বিবরণ লিখুন।' : 'Please enter a description first.', 'info');
      return;
    }
    setImprovingId(id);
    showToast(isBn ? 'এআই কাজের বিবরণ রিরাইট করছে...' : 'AI is enhancing the work description...', 'info');
    try {
      const improved = await cvGroq.improveDescription(expItem.description, `Experience Role: ${expItem.role} at ${expItem.company}`);
      setComparison({
        isOpen: true,
        section: 'experience',
        itemId: id,
        before: expItem.description,
        after: improved
      });
    } catch (err) {
      showToast(isBn ? 'বর্ণনা ইম্প্রুভ করতে ত্রুটি।' : 'Failed to improve description.', 'error');
    } finally {
      setImprovingId(null);
    }
  };

  // প্রজেক্ট ডাইনামিক ফিল্ডস (Projects dynamic add/edit/remove)
  const addProject = () => {
    const newItem: ProjectItem = {
      id: 'proj_' + Math.random().toString(36).substr(2, 5),
      title: '',
      description: '',
      techStack: '',
      github: '',
      liveLink: ''
    };
    setWizardCv(prev => {
      const next = { ...prev, projects: [...prev.projects!, newItem] };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  const updateProject = (id: string, field: keyof ProjectItem, value: string) => {
    setWizardCv(prev => {
      const updated = prev.projects!.map(item => item.id === id ? { ...item, [field]: value } : item);
      const next = { ...prev, projects: updated };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  const removeProject = (id: string) => {
    setWizardCv(prev => {
      const next = { ...prev, projects: prev.projects!.filter(item => item.id !== id) };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  // এআই ইম্প্রুভ প্রজেক্ট (Improve project description with Groq)
  const [improvingProjId, setImprovingProjId] = useState<string | null>(null);
  const handleAiImproveProject = async (id: string) => {
    const projItem = wizardCv.projects?.find(item => item.id === id);
    if (!projItem || !projItem.description) {
      showToast(isBn ? 'অনুগ্রহ করে প্রথমে প্রজেক্ট বিবরণ লিখুন।' : 'Please enter project description first.', 'info');
      return;
    }
    setImprovingProjId(id);
    showToast(isBn ? 'এআই প্রজেক্টের বর্ণনা রিরাইট করছে...' : 'AI is enhancing project description...', 'info');
    try {
      const improved = await cvGroq.improveDescription(projItem.description, `Project: ${projItem.title} using ${projItem.techStack}`);
      setComparison({
        isOpen: true,
        section: 'project',
        itemId: id,
        before: projItem.description,
        after: improved
      });
    } catch (err) {
      showToast(isBn ? 'বর্ণনা ইম্প্রুভ করতে ত্রুটি।' : 'Failed to improve description.', 'error');
    } finally {
      setImprovingProjId(null);
    }
  };

  // স্কিল ও সার্টিফিকেটস কালেকশন হ্যান্ডলার (Collect skills inputs)
  const handleSkillsChange = (type: keyof CvSkills, index: number, value: string) => {
    setWizardCv(prev => {
      const updatedList = [...prev.skills![type]];
      updatedList[index] = value;
      const next = {
        ...prev,
        skills: {
          ...prev.skills!,
          [type]: updatedList
        }
      };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  const addSkillItem = (type: keyof CvSkills) => {
    setWizardCv(prev => {
      const next = {
        ...prev,
        skills: {
          ...prev.skills!,
          [type]: [...prev.skills![type], '']
        }
      };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  const removeSkillItem = (type: keyof CvSkills, index: number) => {
    setWizardCv(prev => {
      const next = {
        ...prev,
        skills: {
          ...prev.skills!,
          [type]: prev.skills![type].filter((_, i) => i !== index)
        }
      };
      triggerAutoSave(next as CvData);
      return next;
    });
  };

  // কম্পেয়ার এআই রেজাল্ট অ্যাকসেপ্ট বা রিজেক্ট করা (Accept/Reject AI comparative feedback)
  const handleAcceptComparison = async () => {
    if (!comparison) return;
    
    const { section, itemId, after, before } = comparison;

    // হিস্ট্রি সেভ করি (Save improvement history)
    const historyItem: CvImprovementHistory = {
      id: 'hist_' + Math.random().toString(36).substr(2, 9),
      cvId: wizardCv.id!,
      section,
      sectionItemId: itemId,
      beforeText: before,
      afterText: after,
      timestamp: new Date().toISOString(),
      status: 'accepted'
    };
    await cvDb.saveImprovementHistory(historyItem);

    setWizardCv(prev => {
      let next = { ...prev };
      if (section === 'summary') {
        next.careerSummary = after;
      } else if (section === 'experience' && itemId) {
        next.experience = prev.experience!.map(item => item.id === itemId ? { ...item, description: after } : item);
      } else if (section === 'project' && itemId) {
        next.projects = prev.projects!.map(item => item.id === itemId ? { ...item, description: after } : item);
      }
      triggerAutoSave(next as CvData);
      return next;
    });

    setComparison(null);
    showToast(isBn ? 'এআই পরামর্শ সফলভাবে যুক্ত হয়েছে!' : 'AI suggestion applied successfully!', 'success');
  };

  const handleRejectComparison = async () => {
    if (!comparison) return;

    // রিজেক্ট হিস্ট্রি ট্র্যাকিং (Save history as rejected)
    const historyItem: CvImprovementHistory = {
      id: 'hist_' + Math.random().toString(36).substr(2, 9),
      cvId: wizardCv.id!,
      section: comparison.section,
      sectionItemId: comparison.itemId,
      beforeText: comparison.before,
      afterText: comparison.after,
      timestamp: new Date().toISOString(),
      status: 'rejected'
    };
    await cvDb.saveImprovementHistory(historyItem);

    setComparison(null);
    showToast(isBn ? 'এআই পরামর্শ বাতিল করা হয়েছে।' : 'AI suggestion rejected.', 'info');
  };

  // উইজার্ড কমপ্লিট এবং সেভ করা (Finish CV Builder Wizard)
  const handleFinishWizard = async () => {
    setSaving(true);
    try {
      const finalCv: CvData = {
        ...wizardCv as CvData,
        updatedAt: new Date().toISOString()
      };
      
      // যদি এনালাইসিস না করা থাকে, সাধারণ প্রাথমিক স্কোর জেনারেট করা হবে (Apply initial profile completion metrics)
      const completion = calculateProfileCompletion(finalCv);
      finalCv.scores = finalCv.scores || {
        atsScore: Math.round(50 + completion * 0.3),
        resumeQualityScore: Math.round(45 + completion * 0.45),
        skillScore: Math.round(40 + completion * 0.4),
        professionalismScore: Math.round(55 + completion * 0.35),
        communicationScore: Math.round(60 + completion * 0.25)
      };

      const res = await cvDb.saveResume(finalCv);
      if (res.success) {
        setSelectedCv(finalCv);
        showToast(isBn ? 'সিভি জেনারেশন সম্পন্ন হয়েছে!' : 'CV compiled and saved successfully!', 'success');
        await loadCvs();
        setActiveView('dashboard');
      } else {
        showToast(res.error || 'সংরক্ষণ করতে ব্যর্থ।', 'error');
      }
    } catch (err) {
      showToast(isBn ? 'সিভি সংরক্ষণে ত্রুটি।' : 'Failed to finalize CV builder.', 'error');
    } finally {
      setSaving(false);
    }
  };


  // ==========================================
  // ফিচার বি: ফাইল আপলোড এবং অটো এআই এনালাইসিস
  // ==========================================

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  // আপলোড ফাইল প্রসেস করা ও Groq এনালাইসিস চালনা (Handle File processing & Groq analysis)
  const handleFileSelected = async (file: File) => {
    // সাইজ ও ফরম্যাট চেক (PDF/DOCX, Max 10MB)
    const allowedExtensions = ['pdf', 'docx'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      showToast(isBn ? 'শুধুমাত্র PDF এবং DOCX ফাইল আপলোড করুন।' : 'Only PDF and DOCX files are allowed.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showToast(isBn ? 'ফাইল সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে হবে।' : 'File size must not exceed 10MB.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    showToast(isBn ? 'সিভি ফাইল ক্লাউডে আপলোড হচ্ছে...' : 'Uploading CV file to Cloud...', 'info');

    try {
      // ১. ফাইল আপলোড করা সুপাবেজ স্টোরেজ-এ (Upload file to Supabase storage)
      setUploadProgress(40);
      const uploadRes = await cvDb.uploadCVFile(userId, file);
      
      if (!uploadRes.success) {
        throw new Error(uploadRes.error || 'Storage upload error');
      }

      setUploadProgress(60);
      showToast(isBn ? 'এআই সিভি এনালাইসিস এবং এক্সট্রাকশন চালু হচ্ছে...' : 'Extracting CV and calling AI Analysis...', 'info');

      // ২. ফাইল টেক্সট এনালাইসিস (Extract plain strings from document to feed into Groq)
      // রিয়েল ব্রাউজারে আমরা ফাইলের নাম এবং কিছু রিড করা স্ট্রিং পাঠাই
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const rawText = reader.result as string;
          // টেক্সট ফিল্টার করে কেবল সাধারণ রিডএবল স্ট্রিংগুলো রাখি
          const printableText = rawText.replace(/[^\x20-\x7E\s]/g, '').substr(0, 4000);

          setUploadProgress(85);
          // গ্রক কল করা (Perform AI extraction & analysis on Groq Llama-3.1-70B)
          const analysisResult = await cvGroq.analyzeUploadedCV(file.name, printableText);

          setUploadProgress(95);

          // ৩. সিভি অবজেক্ট ডাটাবেজ-এ সেভ করা (Save analysis CvData to Supabase/localStorage)
          const generatedId = 'cv_' + Math.random().toString(36).substr(2, 9);
          const newCvData: CvData = {
            id: generatedId,
            userId,
            personalInfo: analysisResult.extractedData.personalInfo as PersonalInfo,
            careerSummary: analysisResult.extractedData.careerSummary || '',
            education: analysisResult.extractedData.education || [],
            experience: analysisResult.extractedData.experience || [],
            projects: analysisResult.extractedData.projects || [],
            skills: analysisResult.extractedData.skills || { softSkills: [], technicalSkills: [], languages: [], certificates: [] },
            templateId: 'modern',
            scores: analysisResult.scores,
            feedback: analysisResult.feedback,
            isAnalyzed: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const dbRes = await cvDb.saveResume(newCvData);
          if (dbRes.success) {
            setUploadProgress(100);
            showToast(isBn ? 'সিভি সফলভাবে আপলোড ও এনালাইসিস করা হয়েছে!' : 'CV uploaded and evaluated successfully!', 'success');
            await loadCvs();
            setSelectedCv(newCvData);
            setActiveView('dashboard');
          } else {
            throw new Error(dbRes.error || 'Database save failed');
          }
        } catch (err: any) {
          showToast(err.message || 'সিভি এনালাইসিস করতে সমস্যা হয়েছে।', 'error');
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.readAsText(file); // text buffer read to get raw strings

    } catch (err: any) {
      showToast(err.message || 'আপলোড ব্যর্থ হয়েছে।', 'error');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };


  // ==========================================
  // ডাউনলোড পিডিএফ এবং টেমপ্লেটস (Templates & Downloads)
  // ==========================================
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>('modern');

  const triggerDownloadPdf = () => {
    // এআই স্টুডিও ফ্রেম এবং সাইডবার লুকিয়ে প্রিন্ট করার স্টাইল যুক্ত করা হয়েছে (Adds print-safe viewport handling)
    showToast(isBn ? 'প্রিন্ট ডায়ালগ ওপেন করা হচ্ছে। প্রিন্ট করার সময় "Background graphics" চেক করুন।' : 'Opening Print dialog. Ensure "Background graphics" is enabled.', 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  };


  // ==========================================
  // রি-এনালাইসিস (Trigger Deep Re-Analysis)
  // ==========================================
  const [reanalyzing, setReanalyzing] = useState<boolean>(false);
  
  const triggerReanalysis = async () => {
    if (!selectedCv) return;
    setReanalyzing(true);
    showToast(isBn ? 'এআই পুনরায় সিভি এনালাইসিস ও স্কোরিং করছে...' : 'AI is re-evaluating resume scores...', 'info');
    try {
      const textToAnalyze = `
        Name: ${selectedCv.personalInfo.name}
        Career: ${selectedCv.careerSummary}
        Skills: ${selectedCv.skills.technicalSkills.join(', ')} | ${selectedCv.skills.softSkills.join(', ')}
        Experience: ${selectedCv.experience.map(e => `${e.role} at ${e.company}: ${e.description}`).join('; ')}
        Education: ${selectedCv.education.map(ed => `${ed.degree} from ${ed.institution}`).join('; ')}
      `;

      const analysis = await cvGroq.analyzeUploadedCV('user_cv.pdf', textToAnalyze);
      
      const updatedCv: CvData = {
        ...selectedCv,
        scores: analysis.scores,
        feedback: analysis.feedback,
        isAnalyzed: true,
        updatedAt: new Date().toISOString()
      };

      const res = await cvDb.saveResume(updatedCv);
      if (res.success) {
        setSelectedCv(updatedCv);
        setCvList(prev => prev.map(c => c.id === updatedCv.id ? updatedCv : c));
        showToast(isBn ? 'সিভি রি-এনালাইসিস সম্পন্ন!' : 'Resume re-analysis completed!', 'success');
      }
    } catch (err) {
      showToast(isBn ? 'পুনরায় এনালাইসিস করতে সমস্যা হয়েছে।' : 'Re-analysis failed.', 'error');
    } finally {
      setReanalyzing(false);
    }
  };

  // প্রোফাইল কমপ্লিশন মেজারমেন্ট (Calculate Profile Completion %)
  const calculateProfileCompletion = (cv: Partial<CvData>): number => {
    let score = 10;
    if (cv.personalInfo?.name) score += 15;
    if (cv.personalInfo?.email && cv.personalInfo?.phone) score += 15;
    if (cv.careerSummary) score += 15;
    if (cv.education && cv.education.length > 0) score += 15;
    if (cv.experience && cv.experience.length > 0) score += 15;
    if (cv.skills?.technicalSkills && cv.skills.technicalSkills.length > 0) score += 15;
    return Math.min(score, 100);
  };

  // রাডার চার্ট ডেটা জেনারেটর (Format Recharts Radar chart dataset)
  const getRadarData = (scores?: AiScores) => {
    if (!scores) return [];
    return [
      { subject: isBn ? 'এটিএস ম্যাচ (ATS)' : 'ATS Match', A: scores.atsScore, fullMark: 100 },
      { subject: isBn ? 'সিভি কোয়ালিটি' : 'CV Quality', A: scores.resumeQualityScore, fullMark: 100 },
      { subject: isBn ? 'টেকনিক্যাল স্কিল' : 'Tech Skill', A: scores.skillScore, fullMark: 100 },
      { subject: isBn ? 'প্রফেশনালিজম' : 'Professionalism', A: scores.professionalismScore, fullMark: 100 },
      { subject: isBn ? 'কমিউনিকেশন' : 'Communication', A: scores.communicationScore, fullMark: 100 },
    ];
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-[80vh] pb-16">
      
      {/* ১. কাস্টম নোটিফিকেশন টোস্ট ডিসপ্লে (Inline Notification Toasts Display) */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`p-4 rounded-xl border shadow-2xl flex items-start gap-3 pointer-events-auto ${
                toast.type === 'success' 
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' 
                  : toast.type === 'error' 
                  ? 'bg-red-950/90 border-red-500/30 text-red-200' 
                  : 'bg-cyan-950/90 border-cyan-500/30 text-cyan-200'
              }`}
            >
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Loader2 className="w-5 h-5 text-cyan-400 shrink-0 animate-spin mt-0.5" />}
              <span className="text-xs font-medium leading-relaxed">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ২. ইন্টিগ্রেশন সতর্কীকরণ ব্যানার (Credentials check warning panel) */}
      {(!hasSupabase || !hasGroq) && (
        <div className="bg-gradient-to-r from-amber-950/25 to-amber-900/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex gap-3">
            <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-amber-400">
                {isBn ? 'স্যান্ডবক্স মোড সক্রিয় (Sandbox Workspace Mode Active)' : 'Sandbox Workspace Mode Active'}
              </h5>
              <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {isBn 
                  ? 'আপনার .env ফাইলের VITE_SUPABASE_URL এবং VITE_GROQ_API_KEY কনফিগার করা নেই। অ্যাপ্লিকেশনটি লোকাল ডাটাবেজে অটো-সেভ এবং সিমুলেটেড হাই-ফিডেলিটি এলএলএম (Llama-3.1) জেনারেটর ব্যবহার করছে।' 
                  : 'Your VITE_SUPABASE_URL and VITE_GROQ_API_KEY secrets are not configured. The app remains fully functional using local database storage and offline Llama-3.1 evaluation.'}
              </p>
            </div>
          </div>
          <Badge variant="info" className="text-amber-500 border-amber-500/20 uppercase text-[9px] font-mono shrink-0">
            {isBn ? 'লোকাল সেফ' : 'Local Sandbox'}
          </Badge>
        </div>
      )}

      {/* ৩. একটিভ ভিউ সুইচার রেন্ডারিং (Switch Active Panels) */}
      <AnimatePresence mode="wait">
        
        {/* =========================================================
            ভিউ ১: সিভি হোম স্ক্রিন (CV Home Section)
            ========================================================= */}
        {activeView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-8"
          >
            {/* Beautiful Header */}
            <div className="text-center md:text-left py-4 border-b border-white/5">
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
                <span>{isBn ? 'এআই স্মার্ট সিভি' : 'AI Smart CV'}</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">PRO_V1</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                {isBn 
                  ? 'এআই-এর সাহায্যে আপনার পেশাদার রেজুমে তৈরি, এনালাইসিস এবং ইম্প্রুভ করুন।' 
                  : 'Build, Analyze and Improve your Professional Resume using AI.'}
              </p>
            </div>

            {/* Two Large Action Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
              
              {/* Card 1: Create New CV */}
              <Card 
                hoverEffect 
                className="group relative flex flex-col justify-between border border-white/5 bg-[#0a0a0a] hover:border-emerald-500/30 overflow-hidden rounded-3xl p-8 cursor-pointer h-72 transition-all duration-300"
                onClick={startNewCv}
              >
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
                
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Plus className="w-8 h-8" />
                </div>
                
                <div className="mt-8">
                  <h3 className="font-display font-black text-white text-xl group-hover:text-emerald-400 transition-colors">
                    {isBn ? 'নতুন সিভি তৈরি করুন' : 'Create New CV'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    {isBn 
                      ? 'অত্যাধুনিক মাল্টি-স্টেপ উইজার্ড ফর্ম পূরণ করে এআই অ্যাসিস্ট ও টেমপ্লেট সহ প্রফেশনাল সিভি লিখুন।' 
                      : 'Build an optimized resume with our step-by-step assistant, rich templates, and real-time AI guidance.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mt-6">
                  <span>{isBn ? 'বিল্ডার শুরু করুন' : 'Start Builder'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>

              {/* Card 2: Upload Existing CV */}
              <Card 
                hoverEffect
                className={`group relative flex flex-col justify-between border ${dragActive ? 'border-cyan-500 bg-cyan-950/10' : 'border-white/5 bg-[#0a0a0a]'} hover:border-cyan-500/30 overflow-hidden rounded-3xl p-8 cursor-pointer h-72 transition-all duration-300`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-cyan-500/5 blur-3xl rounded-full group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept=".pdf,.docx" 
                  className="hidden" 
                />

                <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  {isUploading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <div className="mt-8">
                  <h3 className="font-display font-black text-white text-xl group-hover:text-cyan-400 transition-colors">
                    {isBn ? 'বর্তমান সিভি আপলোড করুন' : 'Upload Existing CV'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    {isBn 
                      ? 'পিডিএফ (PDF) অথবা ডকএক্স (DOCX) সিভি আপলোড করে সরাসরি রিয়েল-টাইম এআই স্কোর ও পরামর্শ পান।' 
                      : 'Upload PDF or DOCX file (up to 10MB) to evaluate your ATS score, match key skills, and generate metrics.'}
                  </p>
                </div>

                {isUploading ? (
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-6 overflow-hidden">
                    <div className="bg-cyan-500 h-1.5 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mt-6">
                    <span>{isBn ? 'ফাইল সিলেক্ট বা ড্রপ করুন' : 'Select or Drop File'}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Card>

            </div>

            {/* My Saved Resumes section */}
            {cvList.length > 0 && (
              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-black text-white text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span>{isBn ? 'আমার সংরক্ষিত রেজুমে ড্যাশবোর্ড' : 'Saved Resumes Dashboard'}</span>
                  </h3>
                  <Badge variant="brand">{cvList.length} Resumes</Badge>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cvList.map((cv) => (
                    <Card 
                      key={cv.id} 
                      hoverEffect 
                      className={`relative overflow-hidden border border-white/5 bg-[#0d0d0d] rounded-2xl p-5 hover:border-emerald-500/20 transition-all ${selectedCv?.id === cv.id ? 'ring-2 ring-emerald-500/50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(cv.updatedAt).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(isBn ? 'সিভিটি মুছে ফেলতে চান?' : 'Are you sure to delete this resume?')) {
                                await cvDb.deleteResume(cv.id, userId);
                                showToast(isBn ? 'সিভি মুছে ফেলা হয়েছে' : 'CV deleted successfully');
                                loadCvs();
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-white text-sm line-clamp-1">{cv.personalInfo.name || 'Untitled CV'}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{cv.careerSummary || 'No summary configured.'}</p>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">ATS MATCH</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">{cv.scores?.atsScore || 0}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">SKILLS</span>
                          <span className="text-sm font-bold text-cyan-400 font-mono">{cv.scores?.skillScore || 0}%</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="glass" 
                          size="xs" 
                          className="w-full text-[11px]"
                          onClick={() => {
                            setSelectedCv(cv);
                            setActiveView('dashboard');
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span>{isBn ? 'ড্যাশবোর্ড দেখুন' : 'View Stats'}</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="xs" 
                          className="w-full text-[11px]"
                          onClick={() => {
                            setWizardCv(cv);
                            setCurrentStep(1);
                            setActiveView('builder');
                          }}
                        >
                          <span>{isBn ? 'এডিট সিভি' : 'Edit CV'}</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* =========================================================
            ভিউ ২: সিভি বিল্ডার মাল্টি-স্টেপ উইজার্ড (Wizard Form)
            ========================================================= */}
        {activeView === 'builder' && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto w-full"
          >
            {/* Left Side: Steps Indicator & Editor Panel */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Header with Save Status */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-display font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>{isBn ? 'সিভি এডিটর ও এআই বিল্ডার' : 'Resume Editor & AI Builder'}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Step {currentStep} of 7 • Add achievements and click AI assist</p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {saving ? (
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Auto Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Saved to Cloud</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step Navigation Progress Bar */}
              <div className="w-full bg-white/5 rounded-full h-1">
                <div 
                  className="bg-emerald-500 h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${(currentStep / 7) * 100}%` }}
                />
              </div>

              {/* Wizard Content Steps Switch */}
              <div className="bg-[#090909]/80 border border-white/5 rounded-3xl p-6 min-h-[450px]">
                
                {/* -------------------------------------
                    STEP 1: Personal Information
                    ------------------------------------- */}
                {currentStep === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">{isBn ? '১. ব্যক্তিগত তথ্য' : '1. Personal Information'}</h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">{isBn ? 'পূর্ণ নাম' : 'Full Name'}</label>
                        <input 
                          type="text" 
                          value={wizardCv.personalInfo?.name || ''} 
                          onChange={(e) => updatePersonalInfo('name', e.target.value)}
                          placeholder="Ariful Islam"
                          className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/40 text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">{isBn ? 'ফোন নম্বর' : 'Phone Number'}</label>
                        <input 
                          type="text" 
                          value={wizardCv.personalInfo?.phone || ''} 
                          onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                          placeholder="+8801712-345678"
                          className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/40 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">{isBn ? 'ইমেইল এড্রেস' : 'Email Address'}</label>
                        <input 
                          type="email" 
                          value={wizardCv.personalInfo?.email || ''} 
                          onChange={(e) => updatePersonalInfo('email', e.target.value)}
                          placeholder="ariful@example.com"
                          className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/40 text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">{isBn ? 'স্থায়ী ঠিকানা' : 'Address'}</label>
                        <input 
                          type="text" 
                          value={wizardCv.personalInfo?.address || ''} 
                          onChange={(e) => updatePersonalInfo('address', e.target.value)}
                          placeholder="Dhaka, Bangladesh"
                          className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/40 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">LinkedIn Link</label>
                        <input 
                          type="text" 
                          value={wizardCv.personalInfo?.linkedin || ''} 
                          onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                          className="bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">GitHub Link</label>
                        <input 
                          type="text" 
                          value={wizardCv.personalInfo?.github || ''} 
                          onChange={(e) => updatePersonalInfo('github', e.target.value)}
                          placeholder="https://github.com/username"
                          className="bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">Portfolio Link</label>
                        <input 
                          type="text" 
                          value={wizardCv.personalInfo?.portfolio || ''} 
                          onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                          placeholder="https://mywebsite.dev"
                          className="bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                        />
                      </div>
                    </div>

                    {/* Photo upload mock block */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      <label className="text-xs text-slate-400 font-medium">{isBn ? 'প্রোফাইল ছবি' : 'Photo Link'}</label>
                      <input 
                        type="text" 
                        value={wizardCv.personalInfo?.photoUrl || ''} 
                        onChange={(e) => updatePersonalInfo('photoUrl', e.target.value)}
                        placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                        className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                      />
                    </div>
                  </motion.div>
                )}

                {/* -------------------------------------
                    STEP 2: Career Summary
                    ------------------------------------- */}
                {currentStep === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">{isBn ? '২. ক্যারিয়ার সামারি' : '2. Career Summary'}</h3>
                      
                      <Button 
                        variant="primary" 
                        size="xs" 
                        type="button"
                        onClick={handleAiAssistSummary}
                        disabled={generatingSummary}
                        className="text-[10px] gap-1"
                      >
                        {generatingSummary ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{isBn ? 'এআই অ্যাসিস্ট' : 'AI Assist'}</span>
                      </Button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isBn 
                        ? 'আপনার ক্যারিয়ারের মূল ফোকাস এবং সংক্ষেপ আলোচনা করুন। এটি খালি রাখলে "AI Assist" বাটন আপনার প্রোফাইলের তথ্যের ওপর ভিত্তি করে চমৎকার সামারি লিখে দেবে।' 
                        : 'Describe your professional summary. If left empty, "AI Assist" will leverage your details to draft a tailored summary.'}
                    </p>

                    <textarea
                      value={wizardCv.careerSummary || ''}
                      onChange={(e) => updateCareerSummary(e.target.value)}
                      rows={8}
                      placeholder="e.g. Experienced software professional specialized in..."
                      className="w-full bg-[#121212] border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500/40 text-white leading-relaxed"
                    />
                  </motion.div>
                )}

                {/* -------------------------------------
                    STEP 3: Education (Dynamic Add/Remove)
                    ------------------------------------- */}
                {currentStep === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">{isBn ? '৩. শিক্ষাগত যোগ্যতা' : '3. Education'}</h3>
                      <Button variant="outline" size="xs" onClick={addEducation} className="gap-1.5 text-xs text-slate-300">
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isBn ? 'নতুন যোগ করুন' : 'Add New'}</span>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2">
                      {wizardCv.education?.map((edu, idx) => (
                        <div key={edu.id} className="p-4 bg-[#121212] border border-white/5 rounded-2xl relative flex flex-col gap-3">
                          <button 
                            onClick={() => removeEducation(edu.id)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <span className="text-[10px] font-mono text-emerald-500">Degree #{idx + 1}</span>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 uppercase">Degree Title</label>
                              <input 
                                type="text" 
                                value={edu.degree} 
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="B.Sc. in Computer Science"
                                className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 uppercase">Institution</label>
                              <input 
                                type="text" 
                                value={edu.institution} 
                                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                placeholder="University of Dhaka"
                                className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                              />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 uppercase">Year</label>
                              <input 
                                type="text" 
                                value={edu.year} 
                                onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                                placeholder="2018 - 2022"
                                className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 uppercase">GPA / Class</label>
                              <input 
                                type="text" 
                                value={edu.gpa || ''} 
                                onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                                placeholder="3.75 / 4.00"
                                className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* -------------------------------------
                    STEP 4: Work Experience (Dynamic with AI Improve)
                    ------------------------------------- */}
                {currentStep === 4 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">{isBn ? '৪. কর্মসংস্থানের অভিজ্ঞতা' : '4. Work Experience'}</h3>
                      <Button variant="outline" size="xs" onClick={addExperience} className="gap-1.5 text-xs text-slate-300">
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isBn ? 'নতুন কাজের বিবরণ' : 'Add Experience'}</span>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2">
                      {wizardCv.experience?.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-xs">
                          No experiences loaded. Click 'Add Experience' to include professional history.
                        </div>
                      ) : (
                        wizardCv.experience?.map((exp, idx) => (
                          <div key={exp.id} className="p-4 bg-[#121212] border border-white/5 rounded-2xl relative flex flex-col gap-3">
                            <button 
                              onClick={() => removeExperience(exp.id)}
                              className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono text-emerald-500">Company #{idx + 1}</span>
                              
                              <Button 
                                variant="glass" 
                                size="xs" 
                                className="text-[10px] gap-1 px-2.5 py-1 text-emerald-400 border border-emerald-500/10"
                                onClick={() => handleAiImproveExperience(exp.id)}
                                disabled={improvingId === exp.id}
                              >
                                {improvingId === exp.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                <span>{isBn ? 'এআই ইম্প্রুভ' : 'AI Improve'}</span>
                              </Button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 uppercase">Company Name</label>
                                <input 
                                  type="text" 
                                  value={exp.company} 
                                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                  placeholder="Tech Services Ltd"
                                  className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 uppercase">Role / Title</label>
                                <input 
                                  type="text" 
                                  value={exp.role} 
                                  onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                                  placeholder="React Developer"
                                  className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                                />
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 uppercase">Duration (Date range)</label>
                                <input 
                                  type="text" 
                                  value={exp.duration} 
                                  onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                                  placeholder="Jan 2023 - Present"
                                  className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-4">
                                <input 
                                  type="checkbox" 
                                  id={`current-${exp.id}`}
                                  checked={exp.isCurrent}
                                  onChange={(e) => updateExperience(exp.id, 'isCurrent', e.target.checked)}
                                  className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-[#090909] border-white/10"
                                />
                                <label htmlFor={`current-${exp.id}`} className="text-xs text-slate-400 cursor-pointer">
                                  {isBn ? 'বর্তমানে এখানে কাজ করছি' : 'Currently work here'}
                                </label>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 uppercase">Job Description (Bullet lists or sentences)</label>
                              <textarea 
                                value={exp.description} 
                                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                placeholder="State accomplishments. E.g. Built high-fidelity dashboards that reduced page latency..."
                                rows={3}
                                className="bg-[#090909] border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500/40 text-white leading-relaxed"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* -------------------------------------
                    STEP 5: Projects (Dynamic with AI Improve)
                    ------------------------------------- */}
                {currentStep === 5 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">{isBn ? '৫. প্রজেক্টের বিবরণ (আনলিমিটেড)' : '5. Projects (Unlimited)'}</h3>
                      <Button variant="outline" size="xs" onClick={addProject} className="gap-1.5 text-xs text-slate-300">
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isBn ? 'নতুন প্রজেক্ট' : 'Add Project'}</span>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2">
                      {wizardCv.projects?.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-xs">
                          No projects. Click "Add Project" to list your builds.
                        </div>
                      ) : (
                        wizardCv.projects?.map((proj, idx) => (
                          <div key={proj.id} className="p-4 bg-[#121212] border border-white/5 rounded-2xl relative flex flex-col gap-3">
                            <button 
                              onClick={() => removeProject(proj.id)}
                              className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono text-emerald-500">Project #{idx + 1}</span>
                              <Button 
                                variant="glass" 
                                size="xs" 
                                className="text-[10px] gap-1 px-2.5 py-1 text-emerald-400 border border-emerald-500/10"
                                onClick={() => handleAiImproveProject(proj.id)}
                                disabled={improvingProjId === proj.id}
                              >
                                {improvingProjId === proj.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                <span>{isBn ? 'এআই ইম্প্রুভ' : 'AI Improve'}</span>
                              </Button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 uppercase">Project Title</label>
                                <input 
                                  type="text" 
                                  value={proj.title} 
                                  onChange={(e) => updateProject(proj.id, 'title', e.target.value)}
                                  placeholder="E-Commerce Platform"
                                  className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 uppercase">Tech Stack used</label>
                                <input 
                                  type="text" 
                                  value={proj.techStack} 
                                  onChange={(e) => updateProject(proj.id, 'techStack', e.target.value)}
                                  placeholder="React, Redux, Node.js"
                                  className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                                />
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 uppercase">GitHub Repository Link</label>
                                <input 
                                  type="text" 
                                  value={proj.github || ''} 
                                  onChange={(e) => updateProject(proj.id, 'github', e.target.value)}
                                  placeholder="https://github.com/..."
                                  className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 uppercase">Live Website URL</label>
                                <input 
                                  type="text" 
                                  value={proj.liveLink || ''} 
                                  onChange={(e) => updateProject(proj.id, 'liveLink', e.target.value)}
                                  placeholder="https://website-live.net"
                                  className="bg-[#090909] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/40 text-white"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 uppercase">Project Description (Achievements/Impact)</label>
                              <textarea 
                                value={proj.description} 
                                onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                                placeholder="E.g. Built fully responsive client interface. Integrated checkout flow using Stripe API."
                                rows={2.5}
                                className="bg-[#090909] border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500/40 text-white leading-relaxed"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* -------------------------------------
                    STEP 6: Skills & Certificates
                    ------------------------------------- */}
                {currentStep === 6 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">{isBn ? '৬. কারিগরি ও অন্যান্য দক্ষতা' : '6. Skills & Credentials'}</h3>

                    <div className="grid sm:grid-cols-2 gap-6 max-h-[360px] overflow-y-auto pr-2">
                      
                      {/* Technical Skills */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span className="text-[11px] font-bold text-slate-400">TECHNICAL SKILLS</span>
                          <button onClick={() => addSkillItem('technicalSkills')} className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> {isBn ? 'যোগ' : 'Add'}
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {wizardCv.skills?.technicalSkills.map((sk, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input 
                                type="text" 
                                value={sk} 
                                onChange={(e) => handleSkillsChange('technicalSkills', idx, e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                              />
                              <button onClick={() => removeSkillItem('technicalSkills', idx)} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Soft Skills */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span className="text-[11px] font-bold text-slate-400">SOFT SKILLS</span>
                          <button onClick={() => addSkillItem('softSkills')} className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> {isBn ? 'যোগ' : 'Add'}
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {wizardCv.skills?.softSkills.map((sk, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input 
                                type="text" 
                                value={sk} 
                                onChange={(e) => handleSkillsChange('softSkills', idx, e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                              />
                              <button onClick={() => removeSkillItem('softSkills', idx)} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Languages */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span className="text-[11px] font-bold text-slate-400">LANGUAGES</span>
                          <button onClick={() => addSkillItem('languages')} className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> {isBn ? 'যোগ' : 'Add'}
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {wizardCv.skills?.languages.map((sk, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input 
                                type="text" 
                                value={sk} 
                                onChange={(e) => handleSkillsChange('languages', idx, e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                              />
                              <button onClick={() => removeSkillItem('languages', idx)} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Certificates */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span className="text-[11px] font-bold text-slate-400">CERTIFICATES & AWARDS</span>
                          <button onClick={() => addSkillItem('certificates')} className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> {isBn ? 'যোগ' : 'Add'}
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {wizardCv.skills?.certificates.map((sk, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input 
                                type="text" 
                                value={sk} 
                                onChange={(e) => handleSkillsChange('certificates', idx, e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                              />
                              <button onClick={() => removeSkillItem('certificates', idx)} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* -------------------------------------
                    STEP 7: Choose Template & Finalize
                    ------------------------------------- */}
                {currentStep === 7 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">{isBn ? '৭. টেমপ্লেট নির্বাচন করুন' : '7. Choose Resume Template'}</h3>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {isBn 
                        ? 'আপনার সিভিটির জন্য মানানসই টেমপ্লেট বেছে নিন। ডানপাশের উইন্ডো-তে ইনস্ট্যান্ট লাইভ প্রিভিউ দেখতে পাবেন।' 
                        : 'Pick a high-performing professional design format. You can preview the interactive rendering in the right layout pane.'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(['modern', 'minimal', 'corporate', 'creative', 'ats_friendly'] as ResumeTemplateId[]).map((tempId) => (
                        <div 
                          key={tempId}
                          onClick={() => {
                            setWizardCv(prev => {
                              const next = { ...prev, templateId: tempId };
                              triggerAutoSave(next as CvData);
                              return next;
                            });
                          }}
                          className={`p-3 bg-[#121212] border rounded-xl cursor-pointer text-center hover:border-emerald-500/40 transition-all ${
                            wizardCv.templateId === tempId 
                              ? 'border-emerald-500 text-emerald-400' 
                              : 'border-white/5 text-slate-400'
                          }`}
                        >
                          <Layout className="w-5 h-5 mx-auto mb-2 opacity-75" />
                          <span className="text-[11px] uppercase tracking-wider font-bold block">{tempId.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 p-4 bg-emerald-950/15 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{isBn ? 'সব তথ্য সেভ করা হয়েছে!' : 'All fields auto-saved!'}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{isBn ? 'নিচের ফিনিশ বাটনে ক্লিক করে ড্যাশবোর্ড এবং প্রিন্ট ভিউ-তে যান।' : 'Proceed to complete wizard build and inspect AI scoring dashboard.'}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Wizard Nav Controls Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (currentStep > 1) {
                      setCurrentStep(prev => prev - 1);
                    } else {
                      if (confirm(isBn ? 'বিল্ডার থেকে বের হতে চান?' : 'Leave CV builder?')) {
                        setActiveView('home');
                      }
                    }
                  }}
                  className="gap-1 text-slate-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{currentStep === 1 ? (isBn ? 'হোম পেজ' : 'Exit') : (isBn ? 'পূর্ববর্তী' : 'Back')}</span>
                </Button>

                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <span>STEP {currentStep} / 7</span>
                </div>

                {currentStep < 7 ? (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="gap-1"
                  >
                    <span>{isBn ? 'পরবর্তী' : 'Next'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleFinishWizard}
                    disabled={saving}
                    className="gap-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-slate-950 font-bold"
                  >
                    <span>{isBn ? 'কমপ্লিট বিল্ড' : 'Finish CV'}</span>
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>

            </div>

            {/* Right Side: Interactive Live CV Preview Pane */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>{isBn ? 'লাইভ টেমপ্লেট প্রিভিউ' : 'Live Template Preview'}</span>
                </span>
                
                <Badge variant="brand">{wizardCv.templateId?.toUpperCase()}</Badge>
              </div>

              {/* Live interactive document viewer card */}
              <div className="bg-white text-slate-900 rounded-3xl p-6 min-h-[500px] shadow-2xl border border-white/10 font-sans text-xs overflow-y-auto max-h-[600px] print-area">
                <div id="cv-preview-render">
                  {renderSelectedTemplate(wizardCv as CvData)}
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* =========================================================
            ভিউ ৩: এআই সিভি এনালাইসিস ড্যাশবোর্ড (CV Dashboard)
            ========================================================= */}
        {activeView === 'dashboard' && selectedCv && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-8 max-w-7xl mx-auto w-full"
          >
            {/* Header section with buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-display font-black text-white">{selectedCv.personalInfo.name}</h1>
                  <Badge variant="brand">{selectedCv.templateId.toUpperCase()}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">CV Dashboard & AI evaluation report • Last compiled on {new Date(selectedCv.updatedAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setActiveView('home')} className="text-slate-300">
                  {isBn ? 'হোম-এ ফিরুন' : 'All CVs'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setWizardCv(selectedCv);
                    setCurrentStep(1);
                    setActiveView('builder');
                  }}
                  className="text-slate-300"
                >
                  {isBn ? 'এডিট করুন' : 'Edit Resume'}
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={triggerDownloadPdf} 
                  className="gap-1.5 bg-emerald-500 font-bold text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  <span>{isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</span>
                </Button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">ATS MATCH</span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-2 block">{selectedCv.scores?.atsScore || 0}%</span>
                <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-400 h-1" style={{ width: `${selectedCv.scores?.atsScore || 0}%` }} />
                </div>
              </div>

              <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">CV QUALITY</span>
                <span className="text-2xl font-black font-mono text-cyan-400 mt-2 block">{selectedCv.scores?.resumeQualityScore || 0}%</span>
                <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-cyan-400 h-1" style={{ width: `${selectedCv.scores?.resumeQualityScore || 0}%` }} />
                </div>
              </div>

              <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">SKILLS VALUE</span>
                <span className="text-2xl font-black font-mono text-purple-400 mt-2 block">{selectedCv.scores?.skillScore || 0}%</span>
                <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-purple-400 h-1" style={{ width: `${selectedCv.scores?.skillScore || 0}%` }} />
                </div>
              </div>

              <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">PROFESSIONALISM</span>
                <span className="text-2xl font-black font-mono text-amber-500 mt-2 block">{selectedCv.scores?.professionalismScore || 0}%</span>
                <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-1" style={{ width: `${selectedCv.scores?.professionalismScore || 0}%` }} />
                </div>
              </div>

              <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-4 text-center col-span-2 lg:col-span-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">COMPLETION</span>
                <span className="text-2xl font-black font-mono text-white mt-2 block">{calculateProfileCompletion(selectedCv)}%</span>
                <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                  <div className="bg-white h-1" style={{ width: `${calculateProfileCompletion(selectedCv)}%` }} />
                </div>
              </div>

            </div>

            {/* Middle row: Charts + Strengths / Weaknesses */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Radar Chart Panel */}
              <div className="lg:col-span-5 bg-[#090909]/90 border border-white/5 rounded-3xl p-6 flex flex-col justify-between h-[380px]">
                <div>
                  <h3 className="font-display font-black text-white text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>{isBn ? 'এআই স্কোর গ্রাফিক্যাল এনালাইসিস' : 'AI Intelligence Score Graph'}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono">Llama-3.1-70B Matrix Output</p>
                </div>

                <div className="h-[280px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData(selectedCv.scores)}>
                      <PolarGrid stroke="#222" />
                      <PolarAngleAxis dataKey="subject" stroke="#888" fontSize={10} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#444" />
                      <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strengths & Weaknesses Panel */}
              <div className="lg:col-span-7 bg-[#090909]/90 border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
                
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="font-display font-black text-white text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>{isBn ? 'সিভি মূল্যায়ন ও ফিডব্যাক' : 'Resume Evaluations & Suggestions'}</span>
                  </h3>
                  
                  <Button 
                    variant="glass" 
                    size="xs" 
                    className="text-[10px] gap-1 px-3 py-1 text-emerald-400"
                    onClick={triggerReanalysis}
                    disabled={reanalyzing}
                  >
                    {reanalyzing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>{isBn ? 'পুনরায় এনালাইসিস' : 'Re-Analyze'}</span>
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 max-h-[260px] overflow-y-auto pr-2">
                  
                  {/* Strengths */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">STRENGTHS</span>
                    <ul className="space-y-2">
                      {selectedCv.feedback?.strengths.map((str, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">WEAKNESSES / REMEDIATIONS</span>
                    <ul className="space-y-2">
                      {selectedCv.feedback?.weaknesses.map((wk, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>

            </div>

            {/* Bottom details: Missing Skills, ATS warnings, Formatting & Career suggestion */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Missing Skills */}
              <Card className="flex flex-col gap-3 border border-white/5 bg-[#0a0a0a]">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">MISSING TECH SKILLS</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedCv.feedback?.missingSkills?.map((sk, i) => (
                    <Badge key={i} variant="info" className="text-[10px] px-2 py-0.5">{sk}</Badge>
                  ))}
                </div>
              </Card>

              {/* Grammar Problems */}
              <Card className="flex flex-col gap-3 border border-white/5 bg-[#0a0a0a]">
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider">GRAMMAR & WRITING ISSUES</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedCv.feedback?.grammarProblems?.map((prob, i) => (
                    <li key={i} className="flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{prob}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* ATS Warnings */}
              <Card className="flex flex-col gap-3 border border-white/5 bg-[#0a0a0a]">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">ATS FORMAT COMPLIANCE</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedCv.feedback?.atsIssues?.map((iss, i) => (
                    <li key={i} className="flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <span>{iss}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Career Suggestions */}
              <Card className="flex flex-col gap-3 border border-white/5 bg-[#0a0a0a]">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">CAREER ROADMAP ADVICE</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedCv.feedback?.careerSuggestions?.map((sug, i) => (
                    <li key={i} className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </Card>

            </div>

            {/* Print preview layout inside dashboard */}
            <div className="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
                <h3 className="font-display font-black text-white text-sm flex items-center gap-2">
                  <Layout className="w-5 h-5 text-emerald-400" />
                  <span>{isBn ? 'সিভি টেমপ্লেট ও প্রিন্ট লেআউট' : 'Active Template & Print Layout'}</span>
                </h3>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      const tempId = e.target.value as ResumeTemplateId;
                      setSelectedTemplate(tempId);
                      setSelectedCv(prev => {
                        if (!prev) return null;
                        const next = { ...prev, templateId: tempId };
                        cvDb.saveResume(next);
                        return next;
                      });
                    }}
                    className="bg-[#121212] border border-white/10 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                    <option value="corporate">Corporate</option>
                    <option value="creative">Creative</option>
                    <option value="ats_friendly">ATS Friendly</option>
                  </select>
                </div>
              </div>

              {/* Printable container block with custom print rules */}
              <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl border border-white/10 overflow-hidden" id="cv-print-area">
                {renderSelectedTemplate({
                  ...selectedCv,
                  templateId: selectedTemplate
                })}
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* =========================================================
          মডাল: এআই তুলনা এবং ইম্প্রুভমেন্ট (Compare suggestions)
          ========================================================= */}
      <AnimatePresence>
        {comparison && comparison.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 max-w-3xl w-full flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-display font-black text-white text-base">
                    {isBn ? 'এআই প্রফেশনাল ইম্প্রুভমেন্ট তুলনা' : 'Compare AI Enhancement Suggestions'}
                  </h3>
                </div>
                <button onClick={() => setComparison(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-5 mt-2">
                
                {/* Before */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest">YOUR ORIGINAL TEXT</span>
                  <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 text-xs text-slate-400 min-h-[180px] leading-relaxed whitespace-pre-line">
                    {comparison.before || (isBn ? '[ফাইলটি খালি ছিল]' : '[Empty summary/input]')}
                  </div>
                </div>

                {/* After */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-widest">AI IMPROVED TEXT</span>
                  <div className="bg-[#121212] border border-emerald-500/20 rounded-2xl p-4 text-xs text-slate-200 min-h-[180px] leading-relaxed whitespace-pre-line relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-400 text-[8px] font-mono border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">ATS Optimized</div>
                    {comparison.after}
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-3">
                <Button variant="outline" size="sm" onClick={handleRejectComparison} className="text-red-400 hover:text-red-300">
                  <X className="w-4 h-4 mr-1" />
                  <span>{isBn ? 'প্রত্যাখ্যান করুন' : 'Reject Suggestions'}</span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleAcceptComparison} className="bg-emerald-500 text-slate-950 font-bold">
                  <Check className="w-4 h-4 mr-1" />
                  <span>{isBn ? 'পরামর্শ গ্রহণ করুন' : 'Apply AI Changes'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  // ==========================================
  // রেজুমে টেমপ্লেটস রেন্ডারিং ফাংশনসমূহ (Templates list)
  // ==========================================
  function renderSelectedTemplate(cv: CvData): React.ReactNode {
    if (!cv || !cv.personalInfo) return <div className="text-center py-12 text-slate-400">Loading live template...</div>;
    
    switch (cv.templateId) {
      case 'modern':
        return renderModern(cv);
      case 'minimal':
        return renderMinimal(cv);
      case 'corporate':
        return renderCorporate(cv);
      case 'creative':
        return renderCreative(cv);
      case 'ats_friendly':
        return renderAtsFriendly(cv);
      default:
        return renderModern(cv);
    }
  }

  // ১. MODERN TEMPLATE (মডার্ন টেমপ্লেট)
  function renderModern(cv: CvData) {
    return (
      <div className="p-4 leading-normal select-text text-[11px] text-slate-800 bg-white">
        {/* Header bar */}
        <div className="border-b-2 border-emerald-500 pb-4 mb-4 flex justify-between items-start gap-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-none">{cv.personalInfo.name}</h1>
            <p className="text-xs text-slate-500 mt-1.5 tracking-wide">{cv.personalInfo.address}</p>
          </div>
          <div className="text-right flex flex-col gap-0.5 text-slate-600">
            <span>{cv.personalInfo.phone}</span>
            <span>{cv.personalInfo.email}</span>
            <div className="flex gap-2 mt-1 justify-end font-mono text-[9px] text-slate-400">
              {cv.personalInfo.linkedin && <span>LinkedIn</span>}
              {cv.personalInfo.github && <span>GitHub</span>}
            </div>
          </div>
        </div>

        {/* Summary */}
        {cv.careerSummary && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Career Profile</h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{cv.careerSummary}</p>
          </div>
        )}

        {/* Work Experience */}
        {cv.experience?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Employment History</h3>
            <div className="space-y-3">
              {cv.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{exp.role} @ {exp.company}</span>
                    <span className="font-normal text-slate-500">{exp.duration}</span>
                  </div>
                  <p className="text-slate-700 mt-1 whitespace-pre-line leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {cv.projects?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Key Projects</h3>
            <div className="space-y-3">
              {cv.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{proj.title} <span className="font-normal text-[10px] text-slate-500">({proj.techStack})</span></span>
                    {proj.liveLink && <span className="font-normal text-[9px] text-emerald-500">Live</span>}
                  </div>
                  <p className="text-slate-700 mt-0.5 whitespace-pre-line leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid: Education + Skills */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Education</h3>
            {cv.education?.map((edu) => (
              <div key={edu.id} className="mb-2 text-slate-700">
                <p className="font-bold text-slate-900">{edu.degree}</p>
                <p>{edu.institution} • {edu.year}</p>
                {edu.gpa && <p className="text-[10px] text-slate-500 font-mono">GPA: {edu.gpa}</p>}
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Core Competencies</h3>
            <div className="space-y-1 text-slate-700">
              <p><strong className="text-slate-900">Technical:</strong> {cv.skills.technicalSkills.join(', ')}</p>
              <p><strong className="text-slate-900">Soft Skills:</strong> {cv.skills.softSkills.join(', ')}</p>
              <p><strong className="text-slate-900">Languages:</strong> {cv.skills.languages.join(', ')}</p>
              {cv.skills.certificates?.length > 0 && (
                <p><strong className="text-slate-900">Certificates:</strong> {cv.skills.certificates.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ২. MINIMAL TEMPLATE (মিনিমাল টেমপ্লেট)
  function renderMinimal(cv: CvData) {
    return (
      <div className="p-4 leading-normal select-text text-[11px] text-slate-800 bg-white font-serif">
        <div className="text-center mb-6">
          <h1 className="text-2xl tracking-wide text-slate-900 font-normal">{cv.personalInfo.name}</h1>
          <p className="text-xs text-slate-500 mt-1 italic">{cv.personalInfo.email}  |  {cv.personalInfo.phone}  |  {cv.personalInfo.address}</p>
        </div>

        {cv.careerSummary && (
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1 mb-2">Summary</h3>
            <p className="text-slate-700 italic leading-relaxed">{cv.careerSummary}</p>
          </div>
        )}

        {cv.experience?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1 mb-2">Experience</h3>
            <div className="space-y-3">
              {cv.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{exp.role}, {exp.company}</span>
                    <span className="font-normal text-slate-500 text-[10px]">{exp.duration}</span>
                  </div>
                  <p className="text-slate-700 mt-1 whitespace-pre-line leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {cv.projects?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1 mb-2">Projects</h3>
            <div className="space-y-3">
              {cv.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="font-bold text-slate-900">{proj.title}</div>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{proj.techStack}</p>
                  <p className="text-slate-700 mt-1 leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1 mb-2">Education & Skills</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {cv.education?.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="font-bold text-slate-900">{edu.degree}</p>
                  <p className="text-slate-500">{edu.institution} ({edu.year})</p>
                </div>
              ))}
            </div>
            <div className="text-xs">
              <p><strong>Technical:</strong> {cv.skills.technicalSkills.join(', ')}</p>
              <p><strong>Soft:</strong> {cv.skills.softSkills.join(', ')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ৩. CORPORATE TEMPLATE (কর্পোরেট টেমপ্লেট)
  function renderCorporate(cv: CvData) {
    return (
      <div className="p-4 leading-normal select-text text-[11px] text-slate-800 bg-white">
        <div className="grid grid-cols-3 gap-4 border-b border-slate-300 pb-4 mb-4">
          <div className="col-span-2">
            <h1 className="text-2xl font-black text-slate-900 uppercase leading-none">{cv.personalInfo.name}</h1>
            <p className="text-xs text-slate-500 mt-2 tracking-wider font-semibold">DHAKA, BANGLADESH</p>
          </div>
          <div className="text-right text-[10px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">{cv.personalInfo.email}</p>
            <p>{cv.personalInfo.phone}</p>
            <p>{cv.personalInfo.linkedin || ''}</p>
          </div>
        </div>

        {cv.careerSummary && (
          <div className="mb-4">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 mb-2">Executive Overview</h3>
            <p className="text-slate-700 leading-relaxed text-[11px]">{cv.careerSummary}</p>
          </div>
        )}

        {cv.experience?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 mb-2">Professional Experience</h3>
            <div className="space-y-3">
              {cv.experience.map((exp) => (
                <div key={exp.id} className="text-[11px]">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{exp.company.toUpperCase()} — {exp.role}</span>
                    <span>{exp.duration}</span>
                  </div>
                  <p className="text-slate-700 mt-1.5 whitespace-pre-line leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {cv.education?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 mb-2">Academic Qualifications</h3>
            <div className="space-y-2">
              {cv.education.map((edu) => (
                <div key={edu.id} className="flex justify-between text-[11px] text-slate-700">
                  <span><strong>{edu.institution}</strong> — {edu.degree}</span>
                  <span>{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 mb-2">Key Skills</h3>
          <p className="text-slate-700 text-[11px]">
            <strong>Core Technical:</strong> {cv.skills.technicalSkills.join(', ')}  |  
            <strong> Management/Soft:</strong> {cv.skills.softSkills.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // ৪. CREATIVE TEMPLATE (ক্রিয়েটিভ টেমপ্লেট)
  function renderCreative(cv: CvData) {
    return (
      <div className="p-4 leading-normal select-text text-[11px] text-slate-800 bg-white grid grid-cols-12 gap-5">
        {/* Left column (Sidebar style inside CV) */}
        <div className="col-span-4 bg-slate-50 p-4 rounded-2xl flex flex-col gap-4 text-slate-700 border border-slate-100">
          <div className="text-center">
            {cv.personalInfo.photoUrl && (
              <img src={cv.personalInfo.photoUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-purple-300" referrerPolicy="no-referrer" />
            )}
            <h1 className="text-base font-black text-purple-900 leading-none">{cv.personalInfo.name}</h1>
            <p className="text-[9px] text-purple-400 font-mono mt-1">DEVELOPER</p>
          </div>

          <div className="space-y-2 text-[9px] border-t border-purple-100 pt-3">
            <p className="font-bold text-slate-800 uppercase">CONTACT</p>
            <p>{cv.personalInfo.phone}</p>
            <p className="break-all">{cv.personalInfo.email}</p>
            <p>{cv.personalInfo.address}</p>
          </div>

          <div className="space-y-2 border-t border-purple-100 pt-3">
            <p className="font-bold text-slate-800 text-[9px] uppercase">SKILLS</p>
            <div className="flex flex-wrap gap-1">
              {cv.skills.technicalSkills.map((sk, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px]">{sk}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-8 flex flex-col gap-4">
          {cv.careerSummary && (
            <div>
              <h3 className="text-xs font-bold text-purple-800 uppercase border-b-2 border-purple-100 pb-1 mb-1.5">Who I Am</h3>
              <p className="text-slate-600 leading-relaxed">{cv.careerSummary}</p>
            </div>
          )}

          {cv.experience?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-purple-800 uppercase border-b-2 border-purple-100 pb-1 mb-1.5">Work History</h3>
              <div className="space-y-3">
                {cv.experience.map((exp) => (
                  <div key={exp.id}>
                    <h4 className="font-bold text-slate-900">{exp.role} <span className="text-purple-600">@ {exp.company}</span></h4>
                    <span className="text-[10px] text-slate-400 font-mono">{exp.duration}</span>
                    <p className="text-slate-600 mt-1 whitespace-pre-line leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cv.projects?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-purple-800 uppercase border-b-2 border-purple-100 pb-1 mb-1.5">Projects Built</h3>
              <div className="space-y-2">
                {cv.projects.map((proj) => (
                  <div key={proj.id} className="text-slate-600">
                    <span className="font-bold text-slate-900">{proj.title}</span>
                    <p className="text-[10px] italic">{proj.techStack}</p>
                    <p className="mt-0.5 leading-relaxed">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ৫. ATS FRIENDLY TEMPLATE (এটিএস ফ্রেন্ডলি টেমপ্লেট)
  function renderAtsFriendly(cv: CvData) {
    return (
      <div className="p-4 leading-normal select-text text-[11px] text-slate-900 bg-white font-sans max-w-[800px] mx-auto">
        {/* Centered clean text with no columns/graphics to ensure high machine parsability */}
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold uppercase tracking-tight text-black">{cv.personalInfo.name}</h1>
          <p className="text-slate-700 mt-1 text-[11px]">
            Address: {cv.personalInfo.address}  |  Phone: {cv.personalInfo.phone}  |  Email: {cv.personalInfo.email}
          </p>
          {cv.personalInfo.linkedin && (
            <p className="text-slate-600 text-[10px] mt-0.5">LinkedIn: {cv.personalInfo.linkedin}  |  GitHub: {cv.personalInfo.github || ''}</p>
          )}
        </div>

        <hr className="border-t border-black my-3" />

        {cv.careerSummary && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-1">Professional Summary</h3>
            <p className="text-slate-800 leading-relaxed whitespace-pre-line text-[11px]">{cv.careerSummary}</p>
          </div>
        )}

        {cv.experience?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-1.5">Professional Experience</h3>
            <div className="space-y-3">
              {cv.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between font-bold text-black text-[11px]">
                    <span>{exp.company}</span>
                    <span>{exp.duration}</span>
                  </div>
                  <div className="italic text-slate-700 text-[10.5px] font-semibold">{exp.role}</div>
                  <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed text-[10.5px]">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {cv.projects?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-1.5">Technical Projects</h3>
            <div className="space-y-3">
              {cv.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between font-bold text-black text-[11px]">
                    <span>{proj.title}</span>
                    {proj.liveLink && <span className="font-normal text-slate-600">{proj.liveLink}</span>}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600">Technologies: {proj.techStack}</div>
                  <p className="text-slate-800 mt-1 text-[10.5px] leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {cv.education?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-1.5">Education</h3>
            <div className="space-y-2">
              {cv.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between font-bold text-black text-[11px]">
                    <span>{edu.institution}</span>
                    <span>{edu.year}</span>
                  </div>
                  <div className="text-slate-700 text-[10.5px]">{edu.degree} {edu.gpa ? `— GPA: ${edu.gpa}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-2">
          <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-1.5">Skills & Technical Competencies</h3>
          <p className="text-slate-800 text-[10.5px] leading-relaxed">
            <strong>Core Technical Skills:</strong> {cv.skills.technicalSkills.join(', ')} <br />
            <strong>Soft Professional Skills:</strong> {cv.skills.softSkills.join(', ')} <br />
            <strong>Languages:</strong> {cv.skills.languages.join(', ')}
          </p>
        </div>
      </div>
    );
  }
};
