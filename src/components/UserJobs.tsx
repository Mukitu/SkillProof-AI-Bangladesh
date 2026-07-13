import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Search, MapPin, DollarSign, Calendar, GraduationCap, 
  Award, ArrowUpRight, Heart, Info, ChevronRight, X, AlertCircle, 
  Sparkles, CheckCircle2, Star, BookOpen, Clock, Building, ThumbsUp
} from 'lucide-react';
import { Job, AiMatchReport } from '../types/job';
import { UserProfile } from '../types';
import { jobDb } from '../lib/jobSupabase';
import { Card, Button, Badge } from './UI';

interface UserJobsProps {
  user: UserProfile;
  isBn: boolean;
  onNavigateToTab?: (tab: string) => void;
}

export const UserJobs: React.FC<UserJobsProps> = ({ user, isBn, onNavigateToTab }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [aiReports, setAiReports] = useState<Record<string, AiMatchReport>>({});
  const [calculatingAi, setCalculatingAi] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'all' | 'saved'>('all');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'match' | 'deadline' | 'company'>('match');

  useEffect(() => {
    loadJobsData();
  }, [user.id]);

  const loadJobsData = async () => {
    setLoading(true);
    try {
      const allJobs = await jobDb.getAllJobs();
      // Only display published, active and non-expired jobs
      const today = new Date();
      const activePublished = allJobs.filter(job => {
        const isPublished = job.publishStatus === 'Published';
        const isStatusActive = job.employmentStatus !== 'closed' && job.employmentStatus !== 'expired';
        const isNotExpired = new Date(job.deadline) >= today;
        return isPublished && isStatusActive && isNotExpired;
      });

      const savedIds = await jobDb.getSavedJobs(user.id);
      setSavedJobIds(savedIds);

      // Pre-calculate AI Match for all active jobs
      setCalculatingAi(true);
      const reports: Record<string, AiMatchReport> = {};
      for (const job of activePublished) {
        reports[job.id] = await jobDb.calculateAiMatch(user, job);
      }
      setAiReports(reports);
      setCalculatingAi(false);

      setJobs(activePublished);
    } catch (err) {
      console.error('Error loading jobs data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = savedJobIds.includes(jobId);
    if (isSaved) {
      const success = await jobDb.unsaveJob(user.id, jobId);
      if (success) {
        setSavedJobIds(prev => prev.filter(id => id !== jobId));
      }
    } else {
      const success = await jobDb.saveJob(user.id, jobId);
      if (success) {
        setSavedJobIds(prev => [...prev, jobId]);
      }
    }
  };

  // Extract unique filter options from the jobs list
  const categories = ['all', ...Array.from(new Set(jobs.map(j => j.jobCategory)))];
  const locations = ['all', ...Array.from(new Set(jobs.map(j => j.location)))];
  const experiences = ['all', ...Array.from(new Set(jobs.map(j => j.experience)))];
  const types = ['all', ...Array.from(new Set(jobs.map(j => j.jobType)))];

  // Apply filters and search
  const filteredJobs = jobs.filter(job => {
    const isSavedMatch = viewMode === 'all' || savedJobIds.includes(job.id);
    const matchesSearch = 
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.preferredSkills.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || job.jobCategory === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || job.location === selectedLocation;
    const matchesExperience = selectedExperience === 'all' || job.experience === selectedExperience;
    const matchesType = selectedType === 'all' || job.jobType === selectedType;

    return isSavedMatch && matchesSearch && matchesCategory && matchesLocation && matchesExperience && matchesType;
  });

  // Apply sorting
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === 'company') {
      return a.companyName.localeCompare(b.companyName);
    }
    // Highest Match First (Default)
    const scoreA = aiReports[a.id]?.matchPercentage || 0;
    const scoreB = aiReports[b.id]?.matchPercentage || 0;
    return scoreB - scoreA;
  });

  const activeJobReport = activeJob ? aiReports[activeJob.id] : null;

  return (
    <div className="flex flex-col gap-6" id="user-jobs-portal">
      {/* Portal Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-500" />
            <span>{isBn ? 'স্মার্ট ক্যারিয়ার ও জব পোর্টাল' : 'Smart Career & Jobs Portal'}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isBn 
              ? 'আপনার এআই স্কিল প্রোফাইল, রেজুমে এবং লার্নিং হিস্ট্রির সাথে মানানসই সেরা কাজের সুযোগগুলো আবিষ্কার করুন।' 
              : 'Discover the best job opportunities matched specifically with your AI skill profile and resume analysis.'}
          </p>
        </div>

        {/* Saved Jobs Toggle button */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            {isBn ? 'সবগুলো চাকরি' : 'All Jobs'}
          </button>
          <button
            onClick={() => setViewMode('saved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'saved'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>{isBn ? 'সংরক্ষিত চাকরি' : 'Saved Jobs'} ({savedJobIds.length})</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col gap-4">
        {/* Search Row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder={isBn ? 'পদবী, কোম্পানি, ক্যাটাগরি বা স্কিল দিয়ে সার্চ করুন...' : 'Search by job title, company, category, or skills...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-800 dark:text-white"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold whitespace-nowrap">{isBn ? 'ক্রমানুসারে:' : 'Sort By:'}</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="match">{isBn ? 'সর্বোচ্চ এআই ম্যাচিং' : 'Highest AI Match'}</option>
              <option value="latest">{isBn ? 'সবচেয়ে সাম্প্রতিক' : 'Latest'}</option>
              <option value="deadline">{isBn ? 'আবেদনের শেষ সময়' : 'Application Deadline'}</option>
              <option value="company">{isBn ? 'কোম্পানির নাম' : 'Company Name'}</option>
            </select>
          </div>
        </div>

        {/* Filters Selectors Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{isBn ? 'ক্যাটাগরি' : 'Category'}</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">{isBn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{isBn ? 'অবস্থান' : 'Location'}</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">{isBn ? 'সব অবস্থান' : 'All Locations'}</option>
              {locations.filter(l => l !== 'all').map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Experience Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{isBn ? 'অভিজ্ঞতা' : 'Experience'}</span>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">{isBn ? 'সব অভিজ্ঞতা' : 'All Experiences'}</option>
              {experiences.filter(ex => ex !== 'all').map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>

          {/* Job Type Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{isBn ? 'চাকরির ধরন' : 'Job Type'}</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">{isBn ? 'সব ধরন' : 'All Types'}</option>
              {types.filter(t => t !== 'all').map(tp => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Jobs list & Details panel */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 font-bold">{isBn ? 'চাকরি এবং এআই ম্যাচিং হিসেব করা হচ্ছে...' : 'Loading jobs and calculating AI matches...'}</p>
        </div>
      ) : sortedJobs.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center p-8 gap-4">
          <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-600" />
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{isBn ? 'কোনো সার্কুলার পাওয়া যায়নি' : 'No jobs found'}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mx-auto">
              {isBn 
                ? 'আপনার সার্চ টার্ম পরিবর্তন করুন অথবা সংরক্ষিত ট্যাবে কোনো চাকরি সেভ করা আছে কিনা তা চেক করুন।' 
                : 'Modify your search terms, check filters or make sure you have saved jobs in your saved list.'}
            </p>
          </div>
          {viewMode === 'saved' && (
            <Button size="sm" onClick={() => setViewMode('all')}>
              {isBn ? 'চাকরি খুঁজতে ফিরে যান' : 'Back to explore jobs'}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Jobs List (Span 7 on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-4 max-h-[85vh] overflow-y-auto pr-1">
            {sortedJobs.map((job) => {
              const aiReport = aiReports[job.id];
              const score = aiReport?.matchPercentage || 30;
              const isSaved = savedJobIds.includes(job.id);
              const isActive = activeJob?.id === job.id;

              return (
                <div
                  key={job.id}
                  onClick={() => setActiveJob(job)}
                  className={`cursor-pointer p-5 rounded-2xl border bg-white dark:bg-[#0c0c0c] transition-all hover:translate-x-1 duration-300 relative overflow-hidden flex flex-col gap-4 ${
                    isActive 
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/50' 
                      : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  {/* Company Banner Background (Half height / absolute top) */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500/30 to-blue-500/30" />

                  {/* Top: Header Company & Job title */}
                  <div className="flex justify-between items-start pt-1 gap-3">
                    <div className="flex gap-3.5 items-center">
                      <img
                        src={job.companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80'}
                        alt={job.companyName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-white/10 bg-slate-100 dark:bg-white/5"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{job.companyName}</h4>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mt-0.5 hover:text-emerald-500 transition-colors">{job.jobTitle}</h3>
                      </div>
                    </div>

                    {/* AI Score Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center gap-1 text-xs font-bold font-mono shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{score}% Match</span>
                      </div>
                      {job.featuredJob && (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 mt-2">
                          {isBn ? 'ফিচার্ড' : 'Featured'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mid: Key Details Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs border-y border-slate-100 dark:border-white/5 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{job.jobType}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{isBn ? `শেষ তারিখ: ${new Date(job.deadline).toLocaleDateString('bn-BD')}` : `Deadline: ${job.deadline}`}</span>
                    </div>
                  </div>

                  {/* Bottom: Skills & CTAs */}
                  <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-3 pt-1">
                    {/* Skills requirements pills */}
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {(job.preferredSkills || '').split(',').slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-full text-[10px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                      {(job.preferredSkills || '').split(',').length > 3 && (
                        <span className="text-[10px] text-slate-400">
                          +{((job.preferredSkills || '').split(',').length - 3)} {isBn ? 'আরও' : 'more'}
                        </span>
                      )}
                    </div>

                    {/* Buttons Row */}
                    <div className="flex gap-2 shrink-0 ml-auto">
                      <button
                        onClick={(e) => handleToggleSave(job.id, e)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          isSaved
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-300 border-slate-200 dark:border-white/5 hover:text-red-500'
                        }`}
                        title={isSaved ? (isBn ? 'রিমুভ করুন' : 'Remove Saved') : (isBn ? 'সেভ করুন' : 'Save Job')}
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

                      <Button
                        variant={isActive ? 'primary' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveJob(job);
                        }}
                      >
                        <span>{isBn ? 'বিস্তারিত' : 'Details'}</span>
                      </Button>

                      <a
                        href={job.officialApplyUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <span>{isBn ? 'আবেদন' : 'Apply'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Job Details Pane & AI Matching Report (Span 5) */}
          <div className="lg:col-span-5 sticky top-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto pb-6">
            {activeJob ? (
              <div className="bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col gap-5 p-5 relative">
                {/* Close Button on Top Right (Mainly for Mobile viewing layout) */}
                <button 
                  onClick={() => setActiveJob(null)}
                  className="absolute top-4 right-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-slate-300 rounded-full p-1.5 transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Banner Header Image */}
                <div className="relative h-28 -mx-5 -mt-5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20">
                  {activeJob.bannerImage ? (
                    <img
                      src={activeJob.bannerImage}
                      alt="Banner"
                      className="w-full h-full object-cover opacity-60 dark:opacity-40"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-emerald-500/20">
                      <Briefcase className="w-16 h-16" />
                    </div>
                  )}
                  {/* Featured badge */}
                  {activeJob.featuredJob && (
                    <span className="absolute bottom-2 left-4 px-2 py-0.5 rounded bg-blue-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                      ★ {isBn ? 'ফিচার্ড সার্কুলার' : 'Featured Job'}
                    </span>
                  )}
                </div>

                {/* Company Logo & Basic info */}
                <div className="flex gap-4 items-start border-b border-slate-100 dark:border-white/5 pb-4">
                  <img
                    src={activeJob.companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80'}
                    alt={activeJob.companyName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-950 shadow-md bg-white shrink-0 -mt-8 relative z-10"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeJob.companyName}</h3>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display mt-0.5">{activeJob.jobTitle}</h2>
                    <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded">
                      {activeJob.jobCategory}
                    </span>
                  </div>
                </div>

                {/* AI Matching Report Section */}
                <div className="p-4 bg-slate-50 dark:bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
                  <div className="absolute right-3 top-3 opacity-10 text-emerald-500">
                    <Sparkles className="w-12 h-12" />
                  </div>

                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>{isBn ? 'এআই ম্যাচিং রিপোর্ট' : 'AI Match Report'}</span>
                    </h4>
                    <span className="text-lg font-black font-mono text-emerald-500">
                      {activeJobReport?.matchPercentage || 30}% Match
                    </span>
                  </div>

                  {/* Meter Progress */}
                  <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${activeJobReport?.matchPercentage || 30}%` }}
                    />
                  </div>

                  {/* Recommendation block */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {activeJobReport?.aiRecommendation}
                  </p>

                  {/* Skills lists */}
                  <div className="grid grid-cols-2 gap-3.5 border-t border-slate-200 dark:border-white/5 pt-3">
                    {/* Matching Skills */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isBn ? 'মিল থাকা দক্ষতা' : 'Matching Skills'}</span>
                      </span>
                      {activeJobReport?.matchingSkills && activeJobReport.matchingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {activeJobReport.matchingSkills.map((s, i) => (
                            <span key={i} className="text-[9px] font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/5">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">{isBn ? 'কোনো মিল পাওয়া যায়নি' : 'No matches'}</span>
                      )}
                    </div>

                    {/* Missing Skills */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অর্জনের পরামর্শ' : 'Missing Skills'}</span>
                      </span>
                      {activeJobReport?.missingSkills && activeJobReport.missingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {activeJobReport.missingSkills.map((s, i) => (
                            <span key={i} className="text-[9px] font-semibold px-2 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">{isBn ? 'সবগুলো দক্ষতা মিলেছে' : 'All skills match'}</span>
                      )}
                    </div>
                  </div>

                  {/* Resume Readiness */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">{isBn ? 'রিজিউম প্রস্তুতি:' : 'Resume Readiness:'}</span>
                    {activeJobReport?.resumeReadiness}
                  </div>

                  {/* Roadmap suggestion with tab navigation button */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-2">
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">{isBn ? 'এআই রোডম্যাপ পরামর্শ:' : 'Roadmap Suggestion:'}</span>
                      {activeJobReport?.careerRoadmapSuggestion}
                    </div>
                    {onNavigateToTab && (
                      <button
                        onClick={() => onNavigateToTab('roadmap')}
                        className="text-left text-[10px] font-extrabold text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5 mt-1"
                      >
                        <span>{isBn ? 'লার্নিং রোডম্যাপে যান' : 'Go to Learning Roadmap'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Job Details Card Section */}
                <div className="flex flex-col gap-4 text-xs">
                  {/* Job Specs */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'অভিজ্ঞতার সীমানা' : 'Experience'}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeJob.experience}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'শিক্ষাগত যোগ্যতা' : 'Education'}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeJob.education}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'কর্মস্থল' : 'Workplace'}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeJob.location}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'বেতন' : 'Salary'}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeJob.salary}</span>
                    </div>
                    {activeJob.vacancy && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'শূন্য পদসংখ্যা' : 'Vacancies'}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeJob.vacancy} {isBn ? 'জন' : 'Positions'}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isBn ? 'আবেদনের শেষ সময়' : 'Apply Deadline'}</span>
                      <span className="text-red-500 font-bold font-mono">{activeJob.deadline}</span>
                    </div>
                  </div>

                  {/* 1. Job Description / Responsibilities */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white border-l-2 border-emerald-500 pl-2">
                      {isBn ? 'দায়িত্বসমূহ (Responsibilities)' : 'Responsibilities'}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-2">
                      {activeJob.responsibilities}
                    </p>
                  </div>

                  {/* 2. Job Requirements */}
                  <div className="flex flex-col gap-1.5 mt-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white border-l-2 border-emerald-500 pl-2">
                      {isBn ? 'যোগ্যতাসমূহ (Requirements)' : 'Requirements'}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-2">
                      {activeJob.requirements}
                    </p>
                  </div>

                  {/* 3. Benefits */}
                  <div className="flex flex-col gap-1.5 mt-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white border-l-2 border-emerald-500 pl-2">
                      {isBn ? 'সুবিধাসমূহ (Benefits)' : 'Benefits'}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-2">
                      {activeJob.benefits}
                    </p>
                  </div>

                  {/* Apply Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5 mt-3 items-center">
                    <button
                      onClick={(e) => handleToggleSave(activeJob.id, e)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                        savedJobIds.includes(activeJob.id)
                          ? 'bg-red-500/15 text-red-500 border-red-500/25'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/5 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${savedJobIds.includes(activeJob.id) ? 'fill-current' : ''}`} />
                      <span>{savedJobIds.includes(activeJob.id) ? (isBn ? 'সংরক্ষিত' : 'Saved') : (isBn ? 'সেভ করুন' : 'Save Job')}</span>
                    </button>

                    <a
                      href={activeJob.officialApplyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-center font-bold text-xs shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>{isBn ? 'অফিসিয়াল পোর্টালে আবেদন করুন' : 'Apply on Official Site'}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Warning advice */}
                  <p className="text-[10px] text-slate-500 text-center leading-relaxed mt-1 bg-slate-50 dark:bg-white/[0.01] p-3 border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                    ⚠️ {isBn 
                      ? 'SkillProof AI কোনো চার্জ ছাড়াই সরাসরি চাকরিদাতাদের অফিসিয়াল ক্যারিয়ার লিংকে রিডাইরেক্ট করে। আবেদন প্রক্রিয়াটি সম্পন্ন করতে অন্য ট্যাবে ওপেন হওয়া লিংকে আপনার সিভি সাবমিট করুন।' 
                      : 'SkillProof AI redirects you securely to the official job opening page. Submit your CV and application details directly on that portal.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-[#0c0c0c]/50 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl p-8 text-center text-slate-400 py-20 flex flex-col items-center justify-center gap-3">
                <Info className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-bold">{isBn ? 'বিস্তারিত দেখতে যেকোনো চাকরির সার্কুলারে ক্লিক করুন।' : 'Click any job opening to view the full specifications and AI Match Report.'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
