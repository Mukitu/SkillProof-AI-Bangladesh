import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Search, Plus, Edit2, Trash2, Copy, Star, Eye, CheckCircle2, 
  X, AlertCircle, Building, MapPin, DollarSign, Calendar, Sliders, ArrowUpRight
} from 'lucide-react';
import { Job } from '../../types/job';
import { jobDb } from '../../lib/jobSupabase';

export const AdminJobsView: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategory, setJobCategory] = useState('Software Engineering');
  const [jobType, setJobType] = useState('Full-time');
  const [location, setLocation] = useState('Dhaka, Bangladesh');
  const [salary, setSalary] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [vacancy, setVacancy] = useState<number>(1);
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [benefits, setBenefits] = useState('');
  const [deadline, setDeadline] = useState('');
  const [officialApplyUrl, setOfficialApplyUrl] = useState('');
  const [publishStatus, setPublishStatus] = useState<'Published' | 'Draft' | 'Archived'>('Published');
  const [featuredJob, setFeaturedJob] = useState(false);
  const [tags, setTags] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await jobDb.getAllJobs();
      setJobs(data);
    } catch (err) {
      console.error('Error fetching admin jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setCompanyLogo('');
    setBannerImage('');
    setJobTitle('');
    setJobCategory('Software Engineering');
    setJobType('Full-time');
    setLocation('Dhaka, Bangladesh');
    setSalary('');
    setExperience('');
    setEducation('');
    setVacancy(1);
    setResponsibilities('');
    setRequirements('');
    setPreferredSkills('');
    setBenefits('');
    setDeadline('');
    setOfficialApplyUrl('');
    setPublishStatus('Published');
    setFeaturedJob(false);
    setTags('');
    setSelectedJobId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (job: Job) => {
    setFormMode('edit');
    setSelectedJobId(job.id);
    setCompanyName(job.companyName);
    setCompanyLogo(job.companyLogo || '');
    setBannerImage(job.bannerImage || '');
    setJobTitle(job.jobTitle);
    setJobCategory(job.jobCategory);
    setJobType(job.jobType);
    setLocation(job.location);
    setSalary(job.salary);
    setExperience(job.experience);
    setEducation(job.education);
    setVacancy(job.vacancy || 1);
    setResponsibilities(job.responsibilities);
    setRequirements(job.requirements);
    setPreferredSkills(job.preferredSkills);
    setBenefits(job.benefits);
    setDeadline(job.deadline);
    setOfficialApplyUrl(job.officialApplyUrl);
    setPublishStatus(job.publishStatus);
    setFeaturedJob(job.featuredJob);
    setTags(job.tags ? job.tags.join(', ') : '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !jobTitle || !salary || !responsibilities || !requirements || !preferredSkills || !deadline || !officialApplyUrl) {
      alert('অনুগ্রহ করে তারকাচিহ্নিত (*) বাধ্যতামূলক ঘরগুলো পূরণ করুন!');
      return;
    }

    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const jobData = {
      companyName,
      companyLogo,
      bannerImage,
      jobTitle,
      jobCategory,
      jobType,
      location,
      salary,
      experience,
      education,
      vacancy,
      responsibilities,
      requirements,
      preferredSkills,
      benefits,
      deadline,
      officialApplyUrl,
      publishStatus,
      featuredJob,
      tags: tagsArray,
      seoTitle: `${jobTitle} Job - ${companyName}`,
      seoDescription: `${jobTitle} at ${companyName}. Required skills: ${preferredSkills}. Deadline: ${deadline}`
    };

    try {
      if (formMode === 'create') {
        await jobDb.createJob(jobData);
        alert('নতুন জব সার্কুলারটি সফলভাবে তৈরি করা হয়েছে!');
      } else if (formMode === 'edit' && selectedJobId) {
        await jobDb.updateJob(selectedJobId, jobData);
        alert('জব সার্কুলারটি সফলভাবে আপডেট করা হয়েছে!');
      }
      setIsFormOpen(false);
      resetForm();
      loadJobs();
    } catch (err) {
      console.error('Error saving job circular:', err);
      alert('সংরক্ষণের সময় সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিতভাবে এই জব সার্কুলারটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না!')) {
      try {
        await jobDb.deleteJob(id);
        alert('সার্কুলারটি সফলভাবে মুছে ফেলা হয়েছে!');
        loadJobs();
      } catch (err: any) {
        console.error('Error deleting job:', err);
        alert(`সার্কুলারটি মুছে ফেলা যায়নি: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleDuplicate = async (job: Job) => {
    try {
      const duplicatedData = {
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        bannerImage: job.bannerImage,
        jobTitle: `Copy of ${job.jobTitle}`,
        jobCategory: job.jobCategory,
        jobType: job.jobType,
        location: job.location,
        salary: job.salary,
        experience: job.experience,
        education: job.education,
        vacancy: job.vacancy,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        preferredSkills: job.preferredSkills,
        benefits: job.benefits,
        deadline: job.deadline,
        officialApplyUrl: job.officialApplyUrl,
        publishStatus: 'Draft' as const, // Force duplicate as Draft
        featuredJob: false,
        tags: job.tags || [],
        seoTitle: `Copy of ${job.jobTitle} - ${job.companyName}`,
        seoDescription: job.seoDescription
      };

      await jobDb.createJob(duplicatedData);
      alert('সার্কুলারটি সফলভাবে ডুপ্লিকেট করে খসড়া (Draft) হিসেবে সংরক্ষণ করা হয়েছে!');
      loadJobs();
    } catch (err) {
      console.error('Error duplicating job:', err);
    }
  };

  const handleToggleFeature = async (job: Job) => {
    try {
      await jobDb.updateJob(job.id, { featuredJob: !job.featuredJob });
      loadJobs();
    } catch (err) {
      console.error('Error toggling feature status:', err);
    }
  };

  const handleQuickStatusChange = async (id: string, status: 'Published' | 'Draft' | 'Archived') => {
    try {
      await jobDb.updateJob(id, { publishStatus: status });
      loadJobs();
    } catch (err) {
      console.error('Error changing publish status:', err);
    }
  };

  // Filter & Search Jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobCategory.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || job.publishStatus === statusFilter;
    const matchesCategory = categoryFilter === 'all' || job.jobCategory === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categories = Array.from(new Set(jobs.map(j => j.jobCategory)));

  return (
    <div className="space-y-6 animate-fade-in" id="admin-jobs-management">
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-500" />
            <span>জব সার্কুলার পোর্টাল ব্যবস্থাপনা (Careers Manager)</span>
          </h1>
          <p className="text-slate-500 text-xs">অ্যাডমিন কন্ট্রোল পোর্টাল: ক্যারিয়ার সার্কুলার তৈরি, রিমুভ, ডুপ্লিকেট, পাবলিশ এবং পোর্টালে বিজ্ঞাপন প্রদর্শন নিয়ন্ত্রণ করুন।</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন সার্কুলার যুক্ত করুন</span>
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="পদবী, কোম্পানি বা ক্যাটাগরি দিয়ে সার্চ করুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 font-sans"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden text-slate-600 font-sans"
        >
          <option value="all">সব পাবলিশিং স্ট্যাটাস</option>
          <option value="Published">পাবলিশড (Published)</option>
          <option value="Draft">খসড়া (Draft)</option>
          <option value="Archived">আর্কাইভড (Archived)</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden text-slate-600 font-sans"
        >
          <option value="all">সব ক্যাটাগরি</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Main Jobs Listing Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">জব সার্কুলার ডাটাবেজ লোড হচ্ছে...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-slate-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-800">কোনো জব সার্কুলার পাওয়া যায়নি!</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">অনুগ্রহ করে ভিন্ন কোনো কিওয়ার্ড বা ফিল্টার সিলেক্ট করুন।</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">কোম্পানি ও পদবী</th>
                  <th className="py-3 px-4">ক্যাটাগরি / ধরন</th>
                  <th className="py-3 px-4">লোকেশন / বেতন</th>
                  <th className="py-3 px-4">শেষ তারিখ</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Title & Company */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <img 
                          src={job.companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80'} 
                          alt="logo" 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-950 truncate block hover:text-emerald-600 transition-colors">{job.jobTitle}</span>
                            <button
                              onClick={() => handleToggleFeature(job)}
                              className={`p-0.5 rounded shrink-0 ${job.featuredJob ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-400'}`}
                              title={job.featuredJob ? 'ফিচার্ড লিস্ট থেকে রিমুভ করুন' : 'ফিচার্ড করুন'}
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 uppercase tracking-wide">{job.companyName}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Type */}
                    <td className="py-3.5 px-4 font-sans text-slate-600 font-medium">
                      <span className="block text-slate-900 font-semibold">{job.jobCategory}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold mt-1 inline-block">{job.jobType}</span>
                    </td>

                    {/* Location & Salary */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{job.location}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{job.salary}</span>
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 px-4 font-mono font-bold text-red-500">
                      {job.deadline}
                    </td>

                    {/* Quick PublishStatus Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={job.publishStatus}
                        onChange={(e) => handleQuickStatusChange(job.id, e.target.value as any)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          job.publishStatus === 'Published' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : job.publishStatus === 'Draft'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(job)}
                          className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-emerald-600 transition"
                          title="ডুপ্লিকেট করুন (Clone)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(job)}
                          className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-blue-600 transition"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1.5 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded text-slate-400 hover:text-red-500 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold font-mono">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} circulars
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-[10px] bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-50"
                >
                  পূর্ববর্তী
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 text-[10px] bg-white border border-slate-200 rounded text-slate-600 disabled:opacity-50"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT DIALOG MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {formMode === 'create' ? 'নতুন ক্যারিয়ার সার্কুলার যুক্ত করুন' : 'সার্কুলার সম্পাদনা করুন'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">সবচেয়ে সঠিক তথ্য প্রদানের মাধ্যমে পোর্টাল আপডেট করুন।</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* General details group */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="flex flex-col gap-1">
                  <label className="font-bold">কোম্পানির নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Brain Station 23"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="p-2 border border-slate-200 rounded bg-white text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">কোম্পানি লোগো URL</label>
                  <input
                    type="text"
                    placeholder="যেমন: https://example.com/logo.png"
                    value={companyLogo}
                    onChange={(e) => setCompanyLogo(e.target.value)}
                    className="p-2 border border-slate-200 rounded bg-white text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">কোম্পানি ব্যানার URL</label>
                  <input
                    type="text"
                    placeholder="যেমন: https://example.com/banner.jpg"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    className="p-2 border border-slate-200 rounded bg-white text-xs"
                  />
                </div>
              </div>

              {/* Job Info Group */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold">চাকরির পদবী / পদের নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Lead Front-end Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">ক্যাটাগরি *</label>
                  <select
                    value={jobCategory}
                    onChange={(e) => setJobCategory(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="IT & Networking">IT & Networking</option>
                    <option value="Design & UI/UX">Design & UI/UX</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Project Management">Project Management</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">চাকরির ধরন *</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value="Full-time">Full-time (স্থায়ী)</option>
                    <option value="Part-time">Part-time (খন্ডকালীন)</option>
                    <option value="Contract">Contract (চুক্তিবদ্ধ)</option>
                    <option value="Internship">Internship (ইন্টার্নশিপ)</option>
                    <option value="Remote">Remote (রিমোট)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">অবস্থান / লোকেশন *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Banani, Dhaka or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">বেতন / স্যালারি রেঞ্জ *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 50,000 - 75,000 BDT"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">প্রয়োজনীয় অভিজ্ঞতা *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 2-3 Years or Mid-Level"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">শিক্ষাগত যোগ্যতা *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: B.Sc in CSE or equivalent"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">শূন্য পদের সংখ্যা</label>
                  <input
                    type="number"
                    min={1}
                    value={vacancy}
                    onChange={(e) => setVacancy(Number(e.target.value))}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">আবেদনের শেষ সময় (YYYY-MM-DD) *</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>

              {/* Requirements & Description Full Text (Using standard textareas for flexibility) */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold">গুরুত্বপূর্ণ দায়িত্বসমূহ (Responsibilities) *</label>
                  <span className="text-[9px] text-slate-400">প্রতিটি দায়িত্ব আলাদা লাইনে টাইপ করুন।</span>
                  <textarea
                    rows={4}
                    required
                    placeholder="যেমন:&#10;1. React UI ডিজাইন এবং কোডিং করা।&#10;2. টিমের অন্যদের সাহায্য করা।"
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs h-24"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">প্রয়োজনীয় যোগ্যতাসমূহ (Requirements) *</label>
                  <span className="text-[9px] text-slate-400">প্রতিটি যোগ্যতা আলাদা লাইনে টাইপ করুন।</span>
                  <textarea
                    rows={4}
                    required
                    placeholder="যেমন:&#10;1. HTML/CSS/React এ নূন্যতম ২ বছর কাজ করার অভিজ্ঞতা।&#10;2. ভাল কমিউনিকেশন স্কিল।"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs h-24"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">পছন্দসই দক্ষতা (Preferred Skills) *</label>
                  <span className="text-[9px] text-slate-400">কমা (,) দিয়ে স্কিলগুলোর নাম লিখুন। এটি এআই ম্যাচিং অ্যালগরিদমের জন্য ব্যবহৃত হবে।</span>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: React, TypeScript, Tailwind CSS, Git"
                    value={preferredSkills}
                    onChange={(e) => setPreferredSkills(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">সুযোগ-সুবিধাসমূহ (Benefits)</label>
                  <textarea
                    rows={3}
                    placeholder="যেমন:&#10;1. বছরে ২টি উৎসব বোনাস।&#10;2. ফ্রি লাঞ্চ।"
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs h-20"
                  />
                </div>
              </div>

              {/* Tags & Official links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold">ট্যাগস (Tags)</label>
                  <span className="text-[9px] text-slate-400">কমা (,) দিয়ে লিখুন। যেমন: React, Frontend, Dhaka</span>
                  <input
                    type="text"
                    placeholder="যেমন: React, Fulltime"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">অফিসিয়াল আবেদনের লিংক *</label>
                  <span className="text-[9px] text-slate-400">ক্লিক করলে এই লিংকে চলে যাবে (নতুন ব্রাউজার ট্যাবে)।</span>
                  <input
                    type="url"
                    required
                    placeholder="যেমন: https://careers.brainstation-23.com/apply"
                    value={officialApplyUrl}
                    onChange={(e) => setOfficialApplyUrl(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>

              {/* Publishing toggles */}
              <div className="flex flex-wrap gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <label className="font-bold">পাবলিশিং স্ট্যাটাস:</label>
                  <select
                    value={publishStatus}
                    onChange={(e) => setPublishStatus(e.target.value as any)}
                    className="p-1.5 border border-slate-200 rounded bg-white font-bold"
                  >
                    <option value="Published">Published (লাইভ)</option>
                    <option value="Draft">Draft (খসড়া)</option>
                    <option value="Archived">Archived (আর্কাইভ)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuredJob}
                    onChange={(e) => setFeaturedJob(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>ফিচার্ড সার্কুলার হিসেবে চিহ্নিত করুন (Featured Job)</span>
                </label>
              </div>

              {/* Modal Action Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md"
                >
                  {formMode === 'create' ? 'সার্কুলার পাবলিশ করুন' : 'আপডেট সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
