import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserMinus, 
  UserCheck, 
  Crown, 
  Trash2, 
  Edit3, 
  Eye, 
  ArrowLeft, 
  Award, 
  Video, 
  FileText, 
  GraduationCap, 
  CreditCard,
  Map,
  X,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { UserProfile } from '../../types';
import { AssessmentRecord } from '../../types/assessment';

interface UsersViewProps {
  users: (UserProfile & { role: string; status: string; premium: boolean; premiumExpiry?: string })[];
  assessments: AssessmentRecord[];
  resumes: any[];
  interviews: any[];
  passports: any[];
  roadmaps: any[];
  onUpdateUser: (userId: string, updates: any) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
  currentUserRole: string;
}

export const AdminUsersView: React.FC<UsersViewProps> = ({ 
  users, 
  assessments, 
  resumes, 
  interviews, 
  passports, 
  roadmaps,
  onUpdateUser,
  onDeleteUser,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('all');

  // Selected single user detail drilldown state
  const [selectedUser, setSelectedUser] = useState<(UserProfile & { role: string; status: string; premium: boolean; premiumExpiry?: string }) | null>(null);
  
  // Modals for editing/actions
  const [editingUser, setEditingUser] = useState<(UserProfile & { role: string; status: string; premium: boolean; premiumExpiry?: string }) | null>(null);
  const [editRole, setEditRole] = useState('user');
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  
  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const isSuperAdmin = currentUserRole === 'super_admin';

  // Filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
      
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesSub = 
      subFilter === 'all' || 
      (subFilter === 'premium' && user.premium) || 
      (subFilter === 'free' && !user.premium);

    return matchesSearch && matchesRole && matchesStatus && matchesSub;
  });

  // Paginated users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditFullName(user.fullName);
    setEditPhone(user.phone || '');
    setEditPassword('');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const updates: any = {
      fullName: editFullName,
      phone: editPhone,
      role: editRole
    };
    if (editPassword) {
      updates.customPassword = editPassword;
    }
    const success = await onUpdateUser(editingUser.id, updates);
    if (success) {
      // Refresh local selected status if drilldown is open
      if (selectedUser && selectedUser.id === editingUser.id) {
        setSelectedUser({ 
          ...selectedUser, 
          fullName: editFullName, 
          phone: editPhone, 
          role: editRole,
          customPassword: editPassword || selectedUser.customPassword
        });
      }
      setEditingUser(null);
      if (editPassword) {
        alert(`ব্যবহারকারী পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে। নতুন পাসওয়ার্ড: ${editPassword}`);
      }
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const success = await onUpdateUser(user.id, { status: newStatus });
    if (success && selectedUser && selectedUser.id === user.id) {
      setSelectedUser({ ...selectedUser, status: newStatus });
    }
  };

  const handleTogglePremium = async (user: any) => {
    const newPremium = !user.premium;
    const newExpiry = newPremium ? '2027-12-31' : undefined;
    const success = await onUpdateUser(user.id, { premium: newPremium, premiumExpiry: newExpiry });
    if (success && selectedUser && selectedUser.id === user.id) {
      setSelectedUser({ ...selectedUser, premium: newPremium, premiumExpiry: newExpiry });
    }
  };

  const handleResetProgress = async (userId: string) => {
    if (!window.confirm('আপনি কি সত্যিই এই ব্যবহারকারীর ক্যারিয়ার রোডম্যাপ এবং প্রগ্রেস লেভেল রিসেট করতে চান?')) return;
    
    // Clear roadmaps in localStorage for user
    const storedRoadmaps = localStorage.getItem('skillproof_roadmaps');
    if (storedRoadmaps) {
      let rList = JSON.parse(storedRoadmaps);
      rList = rList.filter((r: any) => r.userId !== userId);
      localStorage.setItem('skillproof_roadmaps', JSON.stringify(rList));
    }
    
    // Reset core progress points
    await onUpdateUser(userId, { skills: [] });
    alert('ব্যবহারকারীর প্রোগ্রেস রিসেট করা হয়েছে।');
  };

  const handleResetAssessments = async (userId: string) => {
    if (!window.confirm('আপনি কি সত্যিই এই ব্যবহারকারীর সকল অ্যাসেসমেন্ট এবং ইন্টারভিউ হিস্ট্রি ডিলিট করতে চান?')) return;
    
    // Clear assessments in localStorage for user
    const storedAss = localStorage.getItem('skillproof_assessments');
    if (storedAss) {
      let aList = JSON.parse(storedAss);
      aList = aList.filter((a: any) => a.userId !== userId);
      localStorage.setItem('skillproof_assessments', JSON.stringify(aList));
    }

    // Clear interviews
    const storedInt = localStorage.getItem('skillproof_interview_sessions');
    if (storedInt) {
      let iList = JSON.parse(storedInt);
      iList = iList.filter((i: any) => i.userId !== userId);
      localStorage.setItem('skillproof_interview_sessions', JSON.stringify(iList));
    }

    alert('অ্যাসেসমেন্ট ও ইন্টারভিউ হিস্ট্রি ডিলিট করা হয়েছে।');
  };

  const handleDeleteUserConfirm = async () => {
    if (!deleteConfirmId) return;
    const success = await onDeleteUser(deleteConfirmId);
    if (success) {
      if (selectedUser && selectedUser.id === deleteConfirmId) {
        setSelectedUser(null);
      }
      setDeleteConfirmId(null);
    }
  };

  // User details loader
  const userResumes = resumes.filter(r => r.userId === selectedUser?.id || r.user_id === selectedUser?.id);
  const userInterviews = interviews.filter(i => i.userId === selectedUser?.id || i.user_id === selectedUser?.id);
  const userAssessments = assessments.filter(a => a.userId === selectedUser?.id || a.user_id === selectedUser?.id);
  const userPassport = passports.find(p => p.userId === selectedUser?.id || p.user_id === selectedUser?.id);
  const userRoadmap = roadmaps.find(r => r.userId === selectedUser?.id || r.user_id === selectedUser?.id);

  // Single Drilldown View
  if (selectedUser) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back header */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ব্যবহারকারী তালিকায় ফিরে যান</span>
          </button>

          <div className="flex gap-2">
            <button 
              onClick={() => handleOpenEdit(selectedUser)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>তথ্য এডিট</span>
            </button>
            <button 
              onClick={() => handleToggleStatus(selectedUser)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                selectedUser.status === 'suspended' 
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
              }`}
            >
              {selectedUser.status === 'suspended' ? <UserCheck className="h-3.5 w-3.5" /> : <UserMinus className="h-3.5 w-3.5" />}
              <span>{selectedUser.status === 'suspended' ? 'অ্যাকাউন্ট সচল করুন' : 'অ্যাকাউন্ট সাসপেন্ড'}</span>
            </button>
            <button 
              onClick={() => handleTogglePremium(selectedUser)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                selectedUser.premium 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span>{selectedUser.premium ? 'প্রিমিয়াম বাতিল' : 'প্রিমিয়াম লাইসেন্স দিন'}</span>
            </button>
            {isSuperAdmin && (
              <button 
                onClick={() => setDeleteConfirmId(selectedUser.id)}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>অ্যাকাউন্ট ডিলিট</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-slate-200/50 flex items-center justify-center font-bold text-slate-600 text-xl font-sans shrink-0 uppercase">
            {selectedUser.fullName.substring(0, 2)}
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{selectedUser.fullName}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                selectedUser.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                selectedUser.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {selectedUser.role}
              </span>
              {selectedUser.premium && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <Crown className="h-2.5 w-2.5 fill-amber-500 stroke-amber-500" />
                  Premium
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-6 text-xs text-slate-500 font-mono">
              <span>ইমেইল: {selectedUser.email}</span>
              <span>মোবাইল: {selectedUser.phone || 'N/A'}</span>
              <span>রেজিস্ট্রেশন: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Grid for entity details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Passport & Resume */}
          <div className="space-y-6 lg:col-span-1">
            {/* Passport Detail Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3 flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-emerald-500" />
                এআই স্কিল পাসপোর্ট
              </h3>
              {userPassport ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Passport ID</span>
                      <span className="text-xs font-bold text-emerald-800">{userPassport.id}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded text-xs font-sans">
                      LEVEL: {userPassport.level}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block">CV Score</span>
                      <span className="font-bold text-slate-700">{userPassport.resumeScore || 0}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block">Viva Score</span>
                      <span className="font-bold text-slate-700">{userPassport.interviewScore || 0}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block">Readiness</span>
                      <span className="font-bold text-slate-700">{userPassport.readinessScore || 0}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">এখনো কোনো স্কিল পাসপোর্ট জেনারেট করা হয়নি।</p>
              )}
            </div>

            {/* Resume Detail Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                এআই সিভি তথ্য
              </h3>
              {userResumes.length > 0 ? (
                <div className="space-y-3">
                  {userResumes.map((res, rIdx) => (
                    <div key={rIdx} className="p-2.5 hover:bg-slate-50 border border-slate-100 rounded-lg transition text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-800 block">টেমপ্লেট: {res.templateId || 'ATS Friendly'}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">আপডেট: {new Date(res.updatedAt || res.createdAt).toLocaleDateString()}</span>
                      </div>
                      {res.scores?.atsScore && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold text-[10px]">
                          ATS: {res.scores.atsScore}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">কোনো সিভি আপলোড বা এডিট করা হয়নি।</p>
              )}
            </div>

            {/* Quick resets & tools */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3 flex items-center gap-2">
                <RotateCcw className="h-4.5 w-4.5 text-slate-500" />
                অ্যাডমিন কুইক রিসেট টুলস
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleResetProgress(selectedUser.id)}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-center rounded-lg text-xs font-semibold transition"
                >
                  ক্যারিয়ার প্রগ্রেস রিসেট
                </button>
                <button 
                  onClick={() => handleResetAssessments(selectedUser.id)}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-center rounded-lg text-xs font-semibold transition"
                >
                  কোডিং অ্যাসেসমেন্ট রিসেট
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Interview QA and Assessments Submissions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interviews Sessions List */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3 flex items-center gap-2">
                <Video className="h-4.5 w-4.5 text-purple-500" />
                মক ভাইভা সেশনসমূহ (AI Mock Interview Sessions)
              </h3>
              {userInterviews.length > 0 ? (
                <div className="space-y-4">
                  {userInterviews.map((session, sIdx) => (
                    <div key={sIdx} className="p-4 bg-slate-50/50 rounded-xl border border-slate-150">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <span className="font-semibold text-xs text-slate-800 block">{session.careerPath}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{new Date(session.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            session.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {session.status === 'completed' ? 'সম্পন্ন' : 'চলমান'}
                          </span>
                          {session.scores?.overall && (
                            <span className="px-2 py-1 bg-purple-600 text-white font-bold rounded text-xs">
                              স্কোর: {session.scores.overall}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Accordion / QA Transcript summary */}
                      {session.qa && session.qa.length > 0 && (
                        <div className="mt-3 border-t border-slate-200/60 pt-3.5 space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono tracking-wider">QA Transcript Excerpt</span>
                          {session.qa.slice(0, 2).map((qItem: any, qIdx: number) => (
                            <div key={qIdx} className="space-y-1 text-xs">
                              <p className="text-slate-800 font-medium">প্রশ্ন {qIdx + 1}: {qItem.question}</p>
                              <p className="text-emerald-700 bg-emerald-50/40 p-2 rounded border border-emerald-100/50 italic">উত্তর: {qItem.answer || qItem.transcript || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">এখনো কোনো এআই ভাইভা সেশন শুরু করা হয়নি।</p>
              )}
            </div>

            {/* Practical & Project Assessments list */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3 flex items-center gap-2">
                <GraduationCap className="h-4.5 w-4.5 text-emerald-500" />
                কোডিং ও প্রজেক্ট অ্যাসেসমেন্ট হিস্ট্রি (Assessments Submissions)
              </h3>
              {userAssessments.length > 0 ? (
                <div className="space-y-4">
                  {userAssessments.map((ass, aIdx) => (
                    <div key={aIdx} className="p-4 bg-slate-50/50 rounded-xl border border-slate-150">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-slate-800">{ass.title}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">{ass.type}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono">{new Date(ass.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ass.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            ass.status === 'ongoing' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {ass.status}
                          </span>
                          {ass.scores?.overallScore && (
                            <span className="px-2 py-1 bg-emerald-600 text-white font-bold rounded text-xs">
                              {ass.scores.overallScore}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Project Specific Submission */}
                      {ass.type === 'project' && (ass.submittedGithubUrl || ass.submittedDemoUrl) && (
                        <div className="mt-3 p-2.5 bg-slate-100 rounded-lg text-xs font-mono space-y-1">
                          {ass.submittedGithubUrl && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">GitHub:</span>
                              <a href={ass.submittedGithubUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate max-w-xs">{ass.submittedGithubUrl}</a>
                            </div>
                          )}
                          {ass.submittedDemoUrl && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Live Demo:</span>
                              <a href={ass.submittedDemoUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate max-w-xs">{ass.submittedDemoUrl}</a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">এখনো কোনো কোডিং বা প্রজেক্ট অ্যাসেসমেন্ট সাবমিট করা হয়নি।</p>
              )}
            </div>
          </div>
        </div>

        {/* Delete confirmation popup */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scale-up space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <h4 className="font-bold text-slate-900">অ্যাকাউন্ট ডিলিট নিশ্চিত করুন</h4>
              </div>
              <p className="text-xs text-slate-600">
                আপনি কি নিশ্চিতভাবে এই ব্যবহারকারীর অ্যাকাউন্ট এবং সংশ্লিষ্ট সকল ডাটা (সিভি, ভাইভা হিস্ট্রি, অ্যাসেসমেন্ট, স্কিল পাসপোর্ট) চিরতরে ডিলিট করতে চান? এই অ্যাকশনটি রিভার্স করা সম্ভব নয়।
              </p>
              <div className="flex justify-end gap-2.5">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleDeleteUserConfirm}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  ডিলিট নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Multi User Table View
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">ব্যবহারকারী ডাটাবেজ ব্যবস্থাপনা</h1>
        <p className="text-slate-500 text-xs">প্ল্যাটফর্মের সকল রেজিস্টার্ড ব্যবহারকারীদের তালিকা দেখুন, এডিট করুন, প্রিমিয়াম গ্রান্ট করুন বা অ্যাকাউন্ট সাময়িক সাসপেন্ড করুন।</p>
      </div>

      {/* Advanced search, filtering and sorting */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ইউজার নাম, ইমেইল বা মোবাইল দিয়ে সার্চ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 font-sans"
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden text-slate-600"
        >
          <option value="all">সকল রোলস (All Roles)</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">System Admin</option>
          <option value="moderator">Moderator</option>
          <option value="support">Support</option>
          <option value="viewer">Viewer</option>
          <option value="user">Standard User</option>
        </select>

        {/* Premium filter */}
        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden text-slate-600"
        >
          <option value="all">সকল লাইসেন্স টাইপ</option>
          <option value="premium">প্রিমিয়াম মেম্বার</option>
          <option value="free">ফ্রি ইউজার</option>
        </select>
      </div>

      {/* Main Grid table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-bold border-b border-slate-150">
                <th className="p-4">ব্যবহারকারী</th>
                <th className="p-4">রোল (Role)</th>
                <th className="p-4">লাইসেন্স টাইপ</th>
                <th className="p-4">অ্যাকাউন্ট স্ট্যাটাস</th>
                <th className="p-4">যোগদানের তারিখ</th>
                <th className="p-4 text-right">পদক্ষেপ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8.5 w-8.5 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center font-bold text-slate-600 font-sans uppercase">
                        {user.fullName.substring(0, 2)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block text-xs">{user.fullName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.premium ? (
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold flex items-center gap-0.5 w-fit">
                        <Crown className="h-2.5 w-2.5 fill-amber-500 stroke-amber-500" />
                        Premium
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Standard Free</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {user.status === 'suspended' ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 font-mono">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedUser(user)}
                        title="প্রোফাইল বিবরণ দেখুন"
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(user)}
                        title="তথ্য এডিট করুন"
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200 transition"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        title={user.status === 'suspended' ? 'অ্যাকাউন্ট অ্যাক্টিভেট করুন' : 'অ্যাকাউন্ট সাসপেন্ড করুন'}
                        className={`p-1.5 rounded border transition ${
                          user.status === 'suspended' 
                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-600' 
                            : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-600'
                        }`}
                      >
                        {user.status === 'suspended' ? <UserCheck className="h-3.5 w-3.5" /> : <UserMinus className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">কোনো রেজিস্টার্ড ইউজার প্রোফাইল পাওয়া যায়নি।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">পৃষ্ঠা {currentPage} / {totalPages} (মোট {filteredUsers.length} জন)</span>
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

      {/* Edit User Modal Dialog */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scale-up space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Edit3 className="h-4.5 w-4.5 text-emerald-500" />
                ব্যবহারকারী প্রোফাইল তথ্য এডিট
              </h3>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">পূর্ণ নাম (Full Name)</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 text-xs font-sans"
                />
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">মোবাইল ফোন (Mobile Phone)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 text-xs font-mono"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">রোল নির্ধারণ (System Role)</label>
                <select
                  value={editRole}
                  disabled={editingUser.email === 'nishat.af27@gmail.com'} // Lock super admin owner role
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-hidden text-xs bg-white text-slate-700"
                >
                  <option value="user">Standard User</option>
                  <option value="viewer">Viewer Only</option>
                  <option value="support">Support Staff</option>
                  <option value="moderator">Content Moderator</option>
                  <option value="admin">System Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {editingUser.email === 'nishat.af27@gmail.com' && (
                  <span className="text-[10px] text-red-500 block">সিস্টেমের প্রধান সুপাবেজ ক্রিয়েটর রোল লক করা আছে।</span>
                )}
              </div>

              {/* Reset Password */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">পাসওয়ার্ড পরিবর্তন/রিসেট (Reset Password)</label>
                <input
                  type="text"
                  placeholder="খালি রাখলে আগের পাসওয়ার্ড বহাল থাকবে (উদাঃ skillproof123)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 text-xs font-sans bg-white"
                />
                <span className="text-[10px] text-slate-400 block">অ্যাডমিন পাসওয়ার্ড পরিবর্তন করে ইউজারকে জানালে, সে নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবে।</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
              >
                তথ্য আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
