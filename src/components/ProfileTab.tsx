import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, CheckCircle2, AlertCircle, Linkedin, RefreshCw, Briefcase, Award } from 'lucide-react';
import { Card, Badge, Button, PageHeader } from './UI';

interface ProfileTabProps {
  user: any;
  isBn: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  fullNameInput: string;
  setFullNameInput: (val: string) => void;
  phoneInput: string;
  setPhoneInput: (val: string) => void;
  universityInput: string;
  setUniversityInput: (val: string) => void;
  departmentInput: string;
  setDepartmentInput: (val: string) => void;
  semesterInput: string;
  setSemesterInput: (val: string) => void;
  addressInput: string;
  setAddressInput: (val: string) => void;
  bioInput: string;
  setBioInput: (val: string) => void;
  skillsInput: string;
  setSkillsInput: (val: string) => void;
  educationInput: string;
  setEducationInput: (val: string) => void;
  experienceInput: string;
  setExperienceInput: (val: string) => void;
  githubInput: string;
  setgithubInput: (val: string) => void;
  linkedinInput: string;
  setlinkedinInput: (val: string) => void;
  portfolioInput: string;
  setportfolioInput: (val: string) => void;
  calculateProfileCompletion: () => { percent: number; missing: Array<{ key: string; labelEn: string; labelBn: string }> };
  handleAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  deleteProfilePicture: () => Promise<void>;
  uploadingAvatar: boolean;
  showAvatarCropModal: boolean;
  setShowAvatarCropModal: (val: boolean) => void;
  avatarPreviewUrl: string | null;
  setAvatarPreviewUrl: (val: string | null) => void;
  setSelectedAvatarFile: (val: File | null) => void;
  avatarZoom: number;
  setAvatarZoom: (val: number) => void;
  avatarQuality: number;
  setAvatarQuality: (val: number) => void;
  handleCropAndUpload: () => void;
  t: (key: string) => string;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  isBn,
  saveStatus,
  fullNameInput,
  setFullNameInput,
  phoneInput,
  setPhoneInput,
  universityInput,
  setUniversityInput,
  departmentInput,
  setDepartmentInput,
  semesterInput,
  setSemesterInput,
  addressInput,
  setAddressInput,
  bioInput,
  setBioInput,
  skillsInput,
  setSkillsInput,
  educationInput,
  setEducationInput,
  experienceInput,
  setExperienceInput,
  githubInput,
  setgithubInput,
  linkedinInput,
  setlinkedinInput,
  portfolioInput,
  setportfolioInput,
  calculateProfileCompletion,
  handleAvatarFileChange,
  deleteProfilePicture,
  uploadingAvatar,
  showAvatarCropModal,
  setShowAvatarCropModal,
  avatarPreviewUrl,
  setAvatarPreviewUrl,
  setSelectedAvatarFile,
  avatarZoom,
  setAvatarZoom,
  avatarQuality,
  setAvatarQuality,
  handleCropAndUpload,
  t,
}) => {
  const completion = calculateProfileCompletion();

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header with connection and auto-save indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <PageHeader 
            title={t('menuProfile')}
            description={isBn ? 'আপনার প্রোফাইলের সকল তথ্য রিয়েল-টাইমে সুপাবেস ডাটাবেজের সাথে সিনক্রোনাইজড।' : 'Your profile details are fully synchronized with the live Supabase database.'}
          />
        </div>
        
        {/* Connection and Auto-save indicator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live database indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isBn ? 'ডাটাবেজ সিঙ্ক সক্রিয়' : 'Database Sync Active'}</span>
          </div>

          {/* Auto-save status feedback */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            saveStatus === 'saving' 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' 
              : saveStatus === 'saved'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          }`}>
            {saveStatus === 'saving' && (
              <>
                <span className="animate-spin block h-3.5 w-3.5 border-2 border-amber-500 border-t-transparent rounded-full" />
                <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Auto-saving...'}</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isBn ? 'সংরক্ষিত' : 'All saved'}</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>{isBn ? 'ব্যর্থ' : 'Error saving'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Avatar, Account Metadata, Completion Percentage */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Avatar Card */}
          <Card className="flex flex-col items-center text-center gap-4 bg-white dark:bg-[#090909] border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
            {/* Hover Overlay for Avatar Edit */}
            <div className="relative group/avatar cursor-pointer">
              <img 
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                alt="Avatar" 
                className="w-28 h-28 rounded-3xl object-cover border-4 border-slate-100 dark:border-slate-800 shadow-md group-hover/avatar:opacity-85 transition-opacity" 
                referrerPolicy="no-referrer"
              />
              {/* Hidden file selector trigger */}
              <input 
                type="file" 
                accept="image/*"
                id="avatarUploadInput"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <div 
                onClick={() => document.getElementById('avatarUploadInput')?.click()}
                className="absolute inset-0 bg-black/40 hover:bg-black/50 rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all gap-1.5"
              >
                <Edit2 className="w-5 h-5 text-white" />
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">{isBn ? 'পরিবর্তন' : 'Change'}</span>
              </div>
            </div>

            <div className="w-full">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight truncate">{fullNameInput || (isBn ? 'নামহীন ব্যবহারকারী' : 'Anonymous User')}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{user?.email}</p>
            </div>

            {/* Avatar Delete/Remove Action */}
            {user?.avatarUrl && (
              <button 
                type="button"
                disabled={uploadingAvatar}
                onClick={async () => {
                  if (confirm(isBn ? 'আপনি কি প্রোফাইল ছবি মুছে ফেলতে চান?' : 'Are you sure you want to remove your profile picture?')) {
                    await deleteProfilePicture();
                  }
                }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 transition-all"
              >
                {isBn ? 'ছবি মুছে ফেলুন' : 'Remove Photo'}
              </button>
            )}
          </Card>

          {/* Profile Completion percentage Meter Card */}
          <Card className="flex flex-col gap-4 bg-white dark:bg-[#090909] border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{isBn ? 'প্রোফাইল সম্পূর্ণতা' : 'Profile Completion'}</h4>
              <span className="text-xs font-extrabold font-mono text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded-full">{completion.percent}%</span>
            </div>

            {/* Progress bar container */}
            <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${completion.percent}%` }}
              />
            </div>

            {/* Missing fields list */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {completion.missing.length === 0 
                  ? (isBn ? '🎉 চমৎকার! ১০০% সম্পূর্ণ' : '🎉 Amazing! 100% Complete')
                  : (isBn ? 'বাকি থাকা তথ্যাবলী' : 'Remaining details')}
              </span>

              {completion.missing.length > 0 ? (
                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {completion.missing.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-rose-500 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{isBn ? item.labelBn : item.labelEn}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-500 font-medium leading-relaxed">
                  {isBn 
                    ? 'আপনার প্রোফাইল তথ্য সম্পূর্ণ রয়েছে। এটি লাইভ এআই সিভিতে এবং ভাইভাতে অগ্রাধিকার পাবে।' 
                    : 'Your profile has no missing values. This maximizes the quality of your AI Resume and Mock Viva feedback!'}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: All Editable Form Inputs */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="bg-white dark:bg-[#090909] border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-sm flex flex-col gap-5">
            <div className="pb-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{isBn ? 'ব্যক্তিগত ও কারিগরি তথ্যসমূহ' : 'Personal & Professional Profile'}</h4>
              <span className="text-[10px] text-slate-400 font-mono animate-pulse">{isBn ? '⌨️ টাইপ করুন, স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে' : '⌨️ Changes are saved automatically'}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* LinkedIn Connection Card */}
              <div className="md:col-span-2 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#0077B5] text-white rounded-xl shadow-lg">
                    <Linkedin className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                      {isBn ? 'লিঙ্কডইন কানেক্ট করুন' : 'Connect LinkedIn Profile'}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                      {isBn 
                        ? 'আপনার লিঙ্কডইন প্রোফাইল কানেক্ট করে অটোমেটিক কাজের অভিজ্ঞতা ও স্কিলগুলো স্কিলপ্রুফ পাসপোর্টে যোগ করুন।' 
                        : 'Link your LinkedIn profile to automatically pull work experience, education, and skills into your SkillProof passport.'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-[#0077B5]/10 text-[#0077B5] border-[#0077B5]/20 hover:bg-[#0077B5] hover:text-white transition-all whitespace-nowrap"
                  onClick={() => {
                    alert(isBn ? 'লিঙ্কডইন অথেন্টিকেশন ফিচারটি শীঘ্রই আসছে!' : 'LinkedIn OAuth feature integration is coming soon! This will securely sync your professional data.');
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  {isBn ? 'কানেক্ট ও সিঙ্ক' : 'Connect & Sync'}
                </Button>
              </div>

              {/* Full name input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'পূর্ণ নাম' : 'Full Name'}</label>
                <input 
                  type="text" 
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="e.g. Puneet Gautam"
                  className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white"
                />
              </div>

              {/* Phone number input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'ফোন নম্বর' : 'Phone Number'}</label>
                <input 
                  type="text" 
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. +8801700000000"
                  className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Email Input (READ-ONLY) */}
            <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/5 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'ইমেইল (পরিবর্তনযোগ্য নয়)' : 'Email Address (Read-only)'}</label>
                <span className="text-[10px] text-slate-400 font-semibold">{isBn ? '🔒 লক করা' : '🔒 Locked'}</span>
              </div>
              <input 
                type="email" 
                value={user?.email || ''} 
                readOnly
                disabled
                className="bg-slate-100/50 dark:bg-black/30 border border-slate-200/50 dark:border-white/5 rounded-xl px-4 py-2 text-sm text-slate-400 font-mono focus:outline-none cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {isBn 
                  ? 'লগইন ইমেল অ্যাড্রেস পরিবর্তনের জন্য অ্যাডমিনকে রিকোয়েস্ট করুন।' 
                  : 'Login authentication emails are verified and cannot be updated dynamically.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* University / Academic institution */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'বিশ্ববিদ্যালয় / প্রতিষ্ঠান' : 'University / Institution'}</label>
                <input 
                  type="text" 
                  value={universityInput}
                  onChange={(e) => setUniversityInput(e.target.value)}
                  placeholder="e.g. BUET, Dhaka University"
                  className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white"
                />
              </div>

              {/* Department */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'বিভাগ / ডিপার্টমেন্ট' : 'Department / Major'}</label>
                <input 
                  type="text" 
                  value={departmentInput}
                  onChange={(e) => setDepartmentInput(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Current Semester */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'বর্তমান সেমিস্টার' : 'Current Semester'}</label>
                <select 
                  value={semesterInput}
                  onChange={(e) => setSemesterInput(e.target.value)}
                  className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white"
                >
                  <option value="">{isBn ? 'নির্বাচন করুন' : 'Select Semester'}</option>
                  <option value="1st Semester">{isBn ? '১ম সেমিস্টার' : '1st Semester'}</option>
                  <option value="2nd Semester">{isBn ? '২য় সেমিস্টার' : '2nd Semester'}</option>
                  <option value="3rd Semester">{isBn ? '৩য় সেমিস্টার' : '3rd Semester'}</option>
                  <option value="4th Semester">{isBn ? '৪র্থ সেমিস্টার' : '4th Semester'}</option>
                  <option value="5th Semester">{isBn ? '৫ম সেমিস্টার' : '5th Semester'}</option>
                  <option value="6th Semester">{isBn ? '৬ষ্ঠ সেমিস্টার' : '6th Semester'}</option>
                  <option value="7th Semester">{isBn ? '৭ম সেমিস্টার' : '7th Semester'}</option>
                  <option value="8th Semester">{isBn ? '৮ম সেমিস্টার' : '8th Semester'}</option>
                  <option value="Graduated">{isBn ? 'গ্র্যাজুয়েট সম্পন্ন' : 'Graduated'}</option>
                  <option value="N/A">{isBn ? 'প্রযোজ্য নয়' : 'Not Applicable'}</option>
                </select>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'ঠিকানা' : 'Address'}</label>
                <input 
                  type="text" 
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="e.g. Banani, Dhaka, Bangladesh"
                  className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Biography / Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'বায়োগ্রাফি / সংক্ষিপ্ত পরিচিতি' : 'Biography / Short Bio'}</label>
              <textarea 
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                rows={3}
                placeholder={isBn ? 'আপনার পেশাদার বা একাডেমিক লক্ষ্য এবং সংক্ষেপিত বিবরণ লিখুন...' : 'Write a compelling professional summary or brief introduction about yourself...'}
                className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white resize-none"
              />
            </div>

            {/* Skills input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'দক্ষতাসমূহ (কমা দিয়ে আলাদা করুন)' : 'Skills (Comma separated list)'}</label>
              <input 
                type="text" 
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. React, Node.js, TypeScript, SQL"
                className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white"
              />
              {/* Skills list tags preview */}
              {skillsInput.split(',').map(s => s.trim()).filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skillsInput.split(',').map((skill, index) => (
                    <Badge key={index} variant="brand">{skill.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Academic accomplishments / Education */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'একাডেমিক বিবরণ / শিক্ষাগত যোগ্যতা' : 'Academic Accomplishments / Education'}</label>
              <input 
                type="text" 
                value={educationInput}
                onChange={(e) => setEducationInput(e.target.value)}
                placeholder="e.g. B.Sc. in Computer Science & Engineering (GPA: 3.85)"
                className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white"
              />
            </div>

            {/* Work Experience */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'কাজের অভিজ্ঞতা' : 'Professional Work Experience'}</label>
              <textarea 
                value={experienceInput}
                onChange={(e) => setExperienceInput(e.target.value)}
                rows={3}
                placeholder={isBn ? 'আপনার পূর্ববর্তী অভিজ্ঞতা বা ইন্টার্নশিপ বিবরণ...' : 'e.g. Software Engineer Intern at TechCorp (June 2025 - Present) - Developed core features in React...'}
                className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white resize-none"
              />
            </div>

            {/* Social media connections */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
              <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-3">{isBn ? 'সোশ্যাল লিংক ও কানেকশনস' : 'Social Profiles & Links'}</h5>
              
              <div className="grid md:grid-cols-3 gap-4">
                {/* GitHub Link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">GitHub Url</label>
                  <input 
                    type="text" 
                    value={githubInput}
                    onChange={(e) => setgithubInput(e.target.value)}
                    placeholder="https://github.com/username"
                    className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white font-mono"
                  />
                </div>

                {/* LinkedIn Link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">LinkedIn Url</label>
                  <input 
                    type="text" 
                    value={linkedinInput}
                    onChange={(e) => setlinkedinInput(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white font-mono"
                  />
                </div>

                {/* Portfolio Link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Portfolio Url</label>
                  <input 
                    type="text" 
                    value={portfolioInput}
                    onChange={(e) => setportfolioInput(e.target.value)}
                    placeholder="https://portfolio.com"
                    className="bg-slate-50 dark:bg-[#040404] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AVATAR CROP & COMPRESS MODAL */}
      <AnimatePresence>
        {showAvatarCropModal && avatarPreviewUrl && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 flex flex-col gap-5 shadow-2xl relative"
            >
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isBn ? 'ছবি ক্রপ এবং কমপ্রেস করুন' : 'Crop & Compress Avatar'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBn 
                  ? 'ছবিটি ক্রপ করতে জুম পরিবর্তন করুন এবং ফাইলের সাইজ কমাতে কম্প্রেশন মান সমন্বয় করুন।' 
                  : 'Adjust the zoom slider to crop, and quality slider to compress your avatar to optimal size.'}
              </p>

              {/* Live Circle Preview */}
              <div className="flex justify-center py-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-md">
                  <img 
                    src={avatarPreviewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover origin-center transition-transform" 
                    style={{ transform: `scale(${avatarZoom})` }}
                  />
                </div>
              </div>

              {/* Control sliders */}
              <div className="flex flex-col gap-4">
                {/* Zoom Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>{isBn ? '🔍 জুম করুন' : '🔍 Zoom'}</span>
                    <span className="font-mono">{avatarZoom.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={avatarZoom}
                    onChange={(e) => setAvatarZoom(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-slate-100 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Quality / Compression Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>{isBn ? '⚡ গুণমান (কম্প্রেশন)' : '⚡ Quality (Compression)'}</span>
                    <span className="font-mono">{Math.round(avatarQuality * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.4" 
                    max="1" 
                    step="0.05" 
                    value={avatarQuality}
                    onChange={(e) => setAvatarQuality(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-slate-100 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={uploadingAvatar}
                  onClick={() => {
                    setShowAvatarCropModal(false);
                    URL.revokeObjectURL(avatarPreviewUrl);
                    setAvatarPreviewUrl(null);
                    setSelectedAvatarFile(null);
                  }}
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button 
                  variant="primary" 
                  type="button" 
                  disabled={uploadingAvatar}
                  onClick={handleCropAndUpload}
                >
                  {uploadingAvatar 
                    ? (isBn ? 'আপলোড হচ্ছে...' : 'Uploading...') 
                    : (isBn ? 'ক্রপ ও আপলোড' : 'Crop & Upload')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
