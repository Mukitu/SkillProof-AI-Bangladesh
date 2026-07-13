import React, { useState } from 'react';
import { 
  FolderGit2, 
  Search, 
  Github, 
  ExternalLink, 
  FileArchive, 
  Eye, 
  Check, 
  X, 
  ChevronRight, 
  Award,
  ArrowLeft,
  Sliders,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { AssessmentRecord, AssessmentScore, AssessmentFeedback } from '../../types/assessment';

interface ProjectsViewProps {
  assessments: AssessmentRecord[];
  onUpdateAssessment: (id: string, updates: any) => Promise<boolean>;
  onNavigate: (route: string) => void;
}

export const AdminProjectsView: React.FC<ProjectsViewProps> = ({ 
  assessments, 
  onUpdateAssessment,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');

  // Single project details
  const [selectedProj, setSelectedProj] = useState<AssessmentRecord | null>(null);

  // Mark out of 10 state
  const [projectMark, setProjectMark] = useState<number>(8); // Default 8/10
  
  // Custom project criteria scores
  const [scoreCodeQuality, setScoreCodeQuality] = useState(80);
  const [scoreSecurity, setScoreSecurity] = useState(80);
  const [scoreArchitecture, setScoreArchitecture] = useState(80);
  const [adminFeedbackText, setAdminFeedbackText] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter only 'project' type assessments
  const projectAssessments = assessments.filter(ass => ass.type === 'project');

  // Filter based on search/filters
  const filtered = projectAssessments.filter(ass => {
    const title = ass.title || '';
    const skill = ass.skill || '';
    const matchesSearch = 
      title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      skill.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || ass.status === statusFilter;
    const matchesSkill = skillFilter === 'all' || ass.skill === skillFilter;

    return matchesSearch && matchesStatus && matchesSkill;
  });

  // Unique skills for filtering
  const uniqueSkills = Array.from(new Set(projectAssessments.map(a => a.skill))).filter(Boolean);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenReview = (proj: AssessmentRecord) => {
    setSelectedProj(proj);
    
    // Convert current overall score to 10 points or default
    const existingMark = proj.scores?.projectScore 
      ? Math.round(proj.scores.projectScore / 10) 
      : (proj.scores?.overallScore ? Math.round(proj.scores.overallScore / 10) : 8);
    
    setProjectMark(existingMark);
    setScoreCodeQuality(proj.scores?.codeQualityScore || 80);
    setScoreSecurity(proj.scores?.securityScore || 80);
    setScoreArchitecture(proj.scores?.architectureScore || 80);
    setAdminFeedbackText(proj.feedback?.codeReview || '');
  };

  const handleApprove = async () => {
    if (!selectedProj) return;

    // A mark out of 10 converted to out of 100
    const calculatedOverallScore = projectMark * 10;

    const updatedScores: AssessmentScore = {
      overallScore: calculatedOverallScore,
      projectScore: calculatedOverallScore,
      codeQualityScore: scoreCodeQuality,
      securityScore: scoreSecurity,
      architectureScore: scoreArchitecture,
      logicScore: calculatedOverallScore,
      // Store the specific mark out of 10 inside scores
      ...({ projectMarkOutOf10: projectMark } as any)
    };

    const updatedFeedback: AssessmentFeedback = {
      strongPoints: selectedProj.feedback?.strongPoints || ['Excellent architecture and routing structure', 'Well-defined data models'],
      weakPoints: selectedProj.feedback?.weakPoints || ['Needs better error handling middleware', 'Clean up console logs before production'],
      codeReview: adminFeedbackText || 'Reviewed, tested, and graded by Enterprise Admin.',
      performanceSuggestions: selectedProj.feedback?.performanceSuggestions || [],
      securitySuggestions: selectedProj.feedback?.securitySuggestions || [],
      bestPractices: selectedProj.feedback?.bestPractices || [],
      industryStandardTips: selectedProj.feedback?.industryStandardTips || [],
      alternativeSolution: selectedProj.feedback?.alternativeSolution || '',
      learningResources: selectedProj.feedback?.learningResources || [],
      nextRecommendation: selectedProj.feedback?.nextRecommendation || '',
      improvementPlan: selectedProj.feedback?.improvementPlan || ''
    };

    const success = await onUpdateAssessment(selectedProj.id, {
      status: 'completed',
      scores: updatedScores,
      feedback: updatedFeedback,
      completedAt: new Date().toISOString()
    });

    if (success) {
      alert(`প্রজেক্টের মূল্যায়ন সফলভাবে সম্পন্ন করা হয়েছে! প্রাপ্ত নম্বর: ${projectMark}/১০`);
      setSelectedProj(null);
    }
  };

  const handleReject = async () => {
    if (!selectedProj) return;
    if (!window.confirm('আপনি কি এই প্রজেক্ট সাবমিশনটি রিজেক্ট করতে চান?')) return;

    const success = await onUpdateAssessment(selectedProj.id, {
      status: 'failed',
      completedAt: new Date().toISOString()
    });

    if (success) {
      alert('প্রজেক্ট সাবমিশনটি রিজেক্ট বা ফেইল্ড হিসেবে চিহ্নিত করা হয়েছে।');
      setSelectedProj(null);
    }
  };

  if (selectedProj) {
    const existingMark = selectedProj.scores?.projectScore 
      ? selectedProj.scores.projectScore / 10 
      : (selectedProj.scores?.overallScore ? selectedProj.scores.overallScore / 10 : null);

    return (
      <div className="space-y-6 animate-fade-in text-xs">
        {/* Header toolbar */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <button 
            onClick={() => setSelectedProj(null)}
            className="flex items-center gap-2 font-bold text-slate-600 hover:text-slate-900 transition bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>প্রজেক্ট তালিকায় ফিরুন</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleReject}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold flex items-center gap-1.5 transition"
            >
              <X className="h-3.5 w-3.5" />
              <span>রিজেক্ট করুন (Reject)</span>
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              <span>মূল্যায়ন সাবমিট (Submit & Grade)</span>
            </button>
          </div>
        </div>

        {/* Challenge details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex justify-between items-start flex-wrap gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-extrabold uppercase flex items-center gap-1">
                  <FolderGit2 className="w-3 h-3" />
                  Project Module
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-extrabold uppercase">
                  {selectedProj.difficulty}
                </span>
                <h2 className="text-sm font-bold text-slate-950 ml-1">{selectedProj.title}</h2>
              </div>
              <p className="text-slate-500 text-xs mt-1">টেকনোলজি ক্যাটাগরি: <strong className="text-slate-700">{selectedProj.skill}</strong> | প্রজেক্ট আইডি: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[10px]">{selectedProj.id}</code></p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-mono block">সাবমিশন তারিখ: {new Date(selectedProj.createdAt).toLocaleString()}</span>
              <span className="text-emerald-600 font-bold block mt-1">প্লাজিয়ারিজম ট্রাস্ট স্কোর: {selectedProj.trustScore || 100}%</span>
            </div>
          </div>

          {/* User Submitted Project Links and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Repository and Demos links */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Github className="w-4 h-4 text-slate-800" />
                সোর্স কোড এবং সলিউশন লিংকসমূহ
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GitHub link block */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">GitHub Repository</span>
                  {selectedProj.submittedGithubUrl ? (
                    <a 
                      href={selectedProj.submittedGithubUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 text-indigo-600 font-semibold group transition"
                    >
                      <span className="truncate font-mono mr-1">{selectedProj.submittedGithubUrl}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-indigo-500" />
                    </a>
                  ) : (
                    <p className="text-slate-400 italic">কোনো গিটহাব রিপোজিটরি লিংক দেওয়া হয়নি</p>
                  )}
                </div>

                {/* Live demo link block */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Live Demo Deployment</span>
                  {selectedProj.submittedDemoUrl ? (
                    <a 
                      href={selectedProj.submittedDemoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:border-emerald-400 text-emerald-600 font-semibold group transition"
                    >
                      <span className="truncate font-mono mr-1">{selectedProj.submittedDemoUrl}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-emerald-500" />
                    </a>
                  ) : (
                    <p className="text-slate-400 italic">কোনো লাইভ ডেপ্লয়মেন্ট ডেমো লিংক দেওয়া হয়নি</p>
                  )}
                </div>
              </div>

              {/* ZIP File details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center">
                    <FileArchive className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Submitted Workspace Archive</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedProj.submittedZipName || 'No-archive-payload.zip'}
                    </span>
                  </div>
                </div>
                {selectedProj.submittedZipName && (
                  <button 
                    onClick={() => alert('জিপ ডাউনলোড সিমুলেশন: ফাইলটি লোকাল রিভিউয়ারে ট্রান্সফার করা হয়েছে।')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 transition"
                  >
                    <span>ফাইল ডাউনলোড করুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Readme Documentation block */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="p-4 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    User Architecture Notes
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-56 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {selectedProj.submittedDocumentation || 'কোনো আলাদা আর্কিটেকচার নোটস সাবমিট করা হয়নি। ব্যবহারকারী সোর্স লিংক চেক করতে অনুরোধ করেছেন।'}
                  </p>
                </div>
                <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800/60">
                  সংযুক্ত ডেটাবেস স্কিমা ও এপিআই এন্ডপয়েন্ট সংক্রান্ত ডিটেইলস এখানে রিডমে ফাইল হিসেবে সাবমিট করা হয়।
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Administrative Review, Marking and Feedback Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form scores inputs (Mark out of 10) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-5">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-emerald-500" />
              প্রজেক্ট মূল্যায়ন স্কোর (Grading Marks)
            </h3>

            {/* Mark out of 10 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3 text-center">
              <span className="text-xs font-bold text-slate-700 block">প্রাপ্ত নাম্বার (Project Mark out of 10)</span>
              
              <div className="flex items-center justify-center gap-1 my-1">
                <span className="text-3xl font-extrabold text-indigo-600 font-mono">{projectMark}</span>
                <span className="text-slate-400 text-lg font-mono">/ ১০</span>
              </div>

              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1"
                value={projectMark} 
                onChange={(e) => setProjectMark(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer" 
              />
              
              <div className="flex justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>১ (Poor)</span>
                <span>৫ (Average)</span>
                <span>১০ (Excellent)</span>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400 block border-b pb-1.5">ক্রাইটেরিয়া ব্রেকডাউন ( out of 100% )</span>
              
              {/* Code Quality */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>কোড কোয়ালিটি (Code Quality)</span>
                  <span className="text-purple-600 font-mono">{scoreCodeQuality}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={scoreCodeQuality} 
                  onChange={(e) => setScoreCodeQuality(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer" 
                />
              </div>

              {/* Architecture Score */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>সিস্টেম আর্কিটেকচার (Architecture)</span>
                  <span className="text-blue-600 font-mono">{scoreArchitecture}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={scoreArchitecture} 
                  onChange={(e) => setScoreArchitecture(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer" 
                />
              </div>

              {/* Security score */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>সিকিউরিটি রেটিং (Security)</span>
                  <span className="text-amber-600 font-mono">{scoreSecurity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={scoreSecurity} 
                  onChange={(e) => setScoreSecurity(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer" 
                />
              </div>
            </div>
          </div>

          {/* Feedback reviewer text */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">রিভিউ ও প্রফেশনাল ফিডব্যাক (Reviewer Feedback Notes)</h3>
              <textarea
                value={adminFeedbackText}
                onChange={(e) => setAdminFeedbackText(e.target.value)}
                placeholder="প্রজেক্টটির সোর্স কোড রিলায়াবিলিটি, রেসপন্সিভ ডিজাইন, রাউটিং লজিক এবং ওভারঅল ইমপ্লিমেন্টেশন সম্পর্কে আপনার ফিডব্যাক লিখুন। এটি ইউজারের লার্নিং ড্যাশবোর্ড এবং স্কিল পাসপোর্টে প্রতিফলিত হবে..."
                className="w-full h-52 p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-xs font-sans leading-relaxed resize-none"
              />
            </div>
            
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex gap-2.5 text-indigo-900">
              <AlertCircle className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>এই মূল্যায়নটি সাবমিট করার সাথে সাথেই প্রজেক্টের মোট স্কোর (প্রাপ্ত নম্বর × ১০) হিসেবে কনভার্ট হয়ে ইউজারের স্কিল পাসপোর্টে আপডেট হবে এবং সিস্টেমে স্থায়ীভাবে স্টোর হবে।</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">প্রজেক্ট-ভিত্তিক অ্যাসেসমেন্ট মূল্যায়ন প্যানেল</h1>
        <p className="text-slate-500 text-xs">ব্যবহারকারীদের সাবমিট করা প্রজেক্ট, গিটহাব কোড রিপোজিটরি, লাইভ ডেমো এবং README রিভিউ করুন, ফিডব্যাক লিখুন এবং ১০ নম্বরের স্কেলে নম্বর দিন।</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="প্রজেক্ট টাইটেল বা স্কিল দিয়ে সার্চ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-600 font-sans"
        >
          <option value="all">সকল স্কিল ক্যাটাগরি</option>
          {uniqueSkills.map(skill => (
            <option key={skill} value={skill}>{skill}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-600 font-sans"
        >
          <option value="all">সকল অবস্থা (All Status)</option>
          <option value="ongoing">চলমান / পেন্ডিং (Pending Review)</option>
          <option value="completed">মূল্যায়িত ও সম্পন্ন (Graded & Completed)</option>
          <option value="failed">বাতিল / অনুত্তীর্ণ (Rejected)</option>
        </select>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-bold border-b border-slate-150">
                <th className="p-4">প্রজেক্ট টাইটেল ও সাবমিশন আইডি</th>
                <th className="p-4">প্রধান স্কিল ক্যাটাগরি</th>
                <th className="p-4">গিটহাব / সোর্স লিংক</th>
                <th className="p-4">প্রাপ্ত নম্বর ( out of 10 )</th>
                <th className="p-4">অবস্থা (Status)</th>
                <th className="p-4 text-right">পদক্ষেপ (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map(proj => {
                // Get mark out of 10
                const mark = proj.scores?.projectScore 
                  ? proj.scores.projectScore / 10 
                  : (proj.scores?.overallScore ? proj.scores.overallScore / 10 : null);

                return (
                  <tr key={proj.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block text-xs truncate max-w-xs">{proj.title}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">ID: {proj.id} • {proj.difficulty}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                        {proj.skill}
                      </span>
                    </td>
                    <td className="p-4 font-mono max-w-[150px] truncate">
                      {proj.submittedGithubUrl ? (
                        <a 
                          href={proj.submittedGithubUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 inline-flex"
                        >
                          <Github className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                          <span className="truncate">{proj.submittedGithubUrl.replace('https://github.com/', '')}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">কোনো লিংক নেই</span>
                      )}
                    </td>
                    <td className="p-4">
                      {mark !== null ? (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-indigo-600 text-sm font-mono">{mark}</span>
                          <span className="text-slate-400 font-mono text-[10px]">/১০</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 animate-pulse" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        proj.status === 'ongoing' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {proj.status === 'completed' ? 'Graded' : proj.status === 'ongoing' ? 'Pending Review' : 'Rejected'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenReview(proj)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 font-bold inline-flex items-center gap-1 transition shadow-2xs"
                      >
                        <Eye className="h-3 w-3" />
                        <span>{proj.status === 'completed' ? 'রিভিউ দেখুন' : 'মূল্যায়ন করুন'}</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">কোনো প্রজেক্ট সাবমিশন হিস্ট্রি পাওয়া যায়নি।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">পৃষ্ঠা {currentPage} / {totalPages} (মোট {filtered.length} টি)</span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(c => Math.max(c - 1, 1))}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 font-bold transition"
              >
                আগেরটি
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 font-bold transition"
              >
                পরেরটি
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
