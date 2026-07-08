import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  FolderGit2, 
  Github, 
  ExternalLink, 
  FileText, 
  FileArchive, 
  Eye, 
  Check, 
  X, 
  ChevronRight, 
  Award,
  ArrowLeft,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { AssessmentRecord, AssessmentScore, AssessmentFeedback } from '../../types/assessment';

interface AssessmentsViewProps {
  assessments: AssessmentRecord[];
  onUpdateAssessment: (id: string, updates: any) => Promise<boolean>;
  onNavigate: (route: string) => void;
}

export const AdminAssessmentsView: React.FC<AssessmentsViewProps> = ({ 
  assessments, 
  onUpdateAssessment,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Single assessment details
  const [selectedAss, setSelectedAss] = useState<AssessmentRecord | null>(null);

  // Score editing overrides
  const [scoreOverall, setScoreOverall] = useState(0);
  const [scoreCodeQuality, setScoreCodeQuality] = useState(0);
  const [scoreSecurity, setScoreSecurity] = useState(0);
  const [scoreArchitecture, setScoreArchitecture] = useState(0);
  const [adminFeedbackText, setAdminFeedbackText] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter
  const filtered = assessments.filter(ass => {
    const title = ass.title || '';
    const skill = ass.skill || '';
    const matchesSearch = 
      title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      skill.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = typeFilter === 'all' || ass.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || ass.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenReview = (ass: AssessmentRecord) => {
    setSelectedAss(ass);
    setScoreOverall(ass.scores?.overallScore || 0);
    setScoreCodeQuality(ass.scores?.codeQualityScore || 0);
    setScoreSecurity(ass.scores?.securityScore || 0);
    setScoreArchitecture(ass.scores?.architectureScore || 0);
    setAdminFeedbackText(ass.feedback?.codeReview || '');
  };

  const handleApprove = async () => {
    if (!selectedAss) return;

    const updatedScores: AssessmentScore = {
      overallScore: scoreOverall,
      codeQualityScore: scoreCodeQuality,
      securityScore: scoreSecurity,
      architectureScore: scoreArchitecture,
      logicScore: scoreOverall,
      projectScore: scoreOverall
    };

    const updatedFeedback: AssessmentFeedback = {
      strongPoints: selectedAss.feedback?.strongPoints || ['Excellent structure'],
      weakPoints: selectedAss.feedback?.weakPoints || ['Minor code style formatting improvements'],
      codeReview: adminFeedbackText || 'Reviewed and approved by Enterprise Admin.',
      performanceSuggestions: selectedAss.feedback?.performanceSuggestions || [],
      securitySuggestions: selectedAss.feedback?.securitySuggestions || [],
      bestPractices: selectedAss.feedback?.bestPractices || [],
      industryStandardTips: selectedAss.feedback?.industryStandardTips || [],
      alternativeSolution: selectedAss.feedback?.alternativeSolution || '',
      learningResources: selectedAss.feedback?.learningResources || [],
      nextRecommendation: selectedAss.feedback?.nextRecommendation || '',
      improvementPlan: selectedAss.feedback?.improvementPlan || ''
    };

    const success = await onUpdateAssessment(selectedAss.id, {
      status: 'completed',
      scores: updatedScores,
      feedback: updatedFeedback,
      completedAt: new Date().toISOString()
    });

    if (success) {
      alert('অ্যাসেসমেন্ট সফলভাবে মূল্যায়ন সম্পন্ন করা হয়েছে!');
      setSelectedAss(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAss) return;
    if (!window.confirm('আপনি কি এই সাবমিশনটি রিজেক্ট করতে চান?')) return;

    const success = await onUpdateAssessment(selectedAss.id, {
      status: 'failed',
      completedAt: new Date().toISOString()
    });

    if (success) {
      alert('সাবমিশনটি রিজেক্ট বা ফেইল্ড হিসেবে চিহ্নিত করা হয়েছে।');
      setSelectedAss(null);
    }
  };

  if (selectedAss) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header toolbar */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setSelectedAss(null)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>অ্যাসেসমেন্ট তালিকায় ফিরুন</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleReject}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <X className="h-3.5 w-3.5" />
              <span>রিজেক্ট করুন (Reject)</span>
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Check className="h-3.5 w-3.5" />
              <span>মূল্যায়ন সাবমিট (Approve & Score)</span>
            </button>
          </div>
        </div>

        {/* Challenge details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-start flex-wrap gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-950">{selectedAss.title}</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-extrabold uppercase">{selectedAss.type}</span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">টুল ক্যাটাগরি: {selectedAss.skill} | সাবমিটেড আইডি: {selectedAss.id}</p>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400 font-mono block">তারিখ: {new Date(selectedAss.createdAt).toLocaleString()}</span>
              <span className="text-amber-600 font-semibold block">ট্রাস্ট স্কোর: {selectedAss.trustScore || 100}% (প্লাজিয়ারিজম কমপ্লায়েন্স)</span>
            </div>
          </div>

          {/* Submissions items (Code or zip/links) */}
          {selectedAss.type === 'practical' ? (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">ইউজারের সাবমিট করা কোড সলিউশন (Submitted Code)</span>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-xs font-mono max-h-96 leading-relaxed">
                <code>{selectedAss.userSolutionCode || '// কোড পাওয়া যায়নি।'}</code>
              </pre>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Submission links */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-800 block">প্রজেক্ট ফাইল এবং সোর্স কোড লিঙ্ক</span>
                <div className="space-y-2 text-xs">
                  {selectedAss.submittedZipName && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <FileArchive className="h-4 w-4 text-amber-500" />
                      <span className="font-mono">জিপ ফাইল: {selectedAss.submittedZipName}</span>
                    </div>
                  )}
                  {selectedAss.submittedGithubUrl && (
                    <a 
                      href={selectedAss.submittedGithubUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 text-emerald-600 hover:underline font-mono truncate"
                    >
                      <Github className="h-4 w-4 text-slate-800" />
                      <span>{selectedAss.submittedGithubUrl}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {selectedAss.submittedDemoUrl && (
                    <a 
                      href={selectedAss.submittedDemoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 text-blue-600 hover:underline font-mono truncate"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-500" />
                      <span>{selectedAss.submittedDemoUrl}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Documentation */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-800 block">সাবমিটেড প্রজেক্ট ডকুমেন্টেশন</span>
                <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-6">
                  {selectedAss.submittedDocumentation || 'কোনো আলাদা ডকুমেন্টেশন সাবমিট করা হয়নি। গিটহাব রিডমি চেক করুন।'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Administrative Review Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form scores inputs */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-emerald-500" />
              স্কোর বা রেটিং ওভাররাইড (Override Scores)
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Overall Score */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>ওভারঅল স্কোর (Overall Score)</span>
                  <span className="text-emerald-600 font-mono">{scoreOverall}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={scoreOverall} 
                  onChange={(e) => setScoreOverall(Number(e.target.value))}
                  className="w-full accent-emerald-500" 
                />
              </div>

              {/* Code Quality */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>কোড কোয়ালিটি স্কোর (Code Quality)</span>
                  <span className="text-purple-600 font-mono">{scoreCodeQuality}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={scoreCodeQuality} 
                  onChange={(e) => setScoreCodeQuality(Number(e.target.value))}
                  className="w-full accent-purple-500" 
                />
              </div>

              {/* Architecture Score */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>আর্কিটেকচার স্কোর (Architecture)</span>
                  <span className="text-blue-600 font-mono">{scoreArchitecture}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={scoreArchitecture} 
                  onChange={(e) => setScoreArchitecture(Number(e.target.value))}
                  className="w-full accent-blue-500" 
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
                  value={scoreSecurity} 
                  onChange={(e) => setScoreSecurity(Number(e.target.value))}
                  className="w-full accent-amber-500" 
                />
              </div>
            </div>
          </div>

          {/* Feedback reviewer text */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">অ্যাডমিন ফিডব্যাক ও কোড রিভিউ (Review Notes)</h3>
            <textarea
              value={adminFeedbackText}
              onChange={(e) => setAdminFeedbackText(e.target.value)}
              placeholder="সাবমিশনটির স্ট্রং পয়েন্ট, দুর্বলতা, এবং কোডের কোয়ালিটি সম্পর্কে আপনার প্রফেশনাল রিভিউ এখানে লিখুন। এটি ইউজারের স্কিল পাসপোর্টে প্রতিফলিত হবে..."
              className="w-full h-44 p-3 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 text-xs font-sans leading-relaxed"
            />
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-150 flex gap-2.5 text-xs text-blue-800">
              <AlertCircle className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
              <span>মূল্যায়নটি সাবমিট করা মাত্রই ইউজারের স্কিল পাসপোর্টে এবং হিস্ট্রি তালিকায় এই আপডেটটি অটোমেটিক সিঙ্ক হয়ে যাবে। কোন ম্যানুয়াল রিলোডের প্রয়োজন নেই।</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">অ্যাসেসমেন্ট ও প্রজেক্ট ইভ্যালুয়েশন</h1>
        <p className="text-slate-500 text-xs">ব্যবহারকারীদের প্র্যাকটিক্যাল কোডিং ও সাবমিট করা রিয়েল-লাইফ প্রজেক্টগুলো রিভিউ করুন, স্কোর ও ট্রাস্ট ওভাররাইড করুন এবং চূড়ান্ত রিভিউ দিন।</p>
      </div>

      {/* Advanced Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="অ্যাসেসমেন্ট টাইটেল বা স্কিল দিয়ে সার্চ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 font-sans"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden text-slate-600 font-sans"
        >
          <option value="all">সকল ক্যাটাগরি (Practical & Project)</option>
          <option value="practical">কোডিং প্র্যাকটিক্যাল (Mode 1)</option>
          <option value="project">প্রজেক্ট সাবমিশন (Mode 2)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden text-slate-600 font-sans"
        >
          <option value="all">সকল অবস্থা (All Status)</option>
          <option value="ongoing">চলমান (Ongoing / Pending)</option>
          <option value="completed">অনুমোদিত ও সম্পন্ন (Approved)</option>
          <option value="failed">বাতিল / রিজেক্টেড (Rejected)</option>
        </select>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-bold border-b border-slate-150">
                <th className="p-4">টাস্ক / প্রজেক্ট টাইটেল</th>
                <th className="p-4">টাইপ</th>
                <th className="p-4">মূল স্কিল ক্যাটাগরি</th>
                <th className="p-4">অবস্থা (Status)</th>
                <th className="p-4">ট্রাস্ট স্কোর</th>
                <th className="p-4 text-right">পদক্ষেপ (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map(ass => (
                <tr key={ass.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 block text-xs truncate max-w-xs">{ass.title}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">ID: {ass.id}</span>
                    </div>
                  </td>
                  <td className="p-4 uppercase font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ass.type === 'project' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {ass.type}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    {ass.skill}
                  </td>
                  <td className="p-4 font-mono">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ass.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      ass.status === 'ongoing' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {ass.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-600">
                    {ass.trustScore || 100}%
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenReview(ass)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-slate-700 hover:text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1 transition shadow-xs"
                    >
                      <Eye className="h-3 w-3" />
                      <span>রিভিউ করুন</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">কোনো অ্যাসেসমেন্ট বা প্রজেক্ট সাবমিশন হিস্ট্রি পাওয়া যায়নি।</td>
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
