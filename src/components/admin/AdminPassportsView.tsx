import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  QrCode, 
  Check, 
  X, 
  ShieldAlert, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Eye
} from 'lucide-react';
import { SkillPassport } from '../../types/passport';

interface PassportsViewProps {
  passports: SkillPassport[];
  onUpdatePassportStatus: (passportId: string, status: 'Verified' | 'Pending' | 'Rejected' | 'Revoked') => Promise<boolean>;
  onNavigate: (route: string) => void;
}

export const AdminPassportsView: React.FC<PassportsViewProps> = ({ 
  passports, 
  onUpdatePassportStatus,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected single passport overview modal
  const [selectedPassport, setSelectedPassport] = useState<SkillPassport | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filtered = passports.filter(pass => {
    const name = pass.fullName || '';
    const pid = pass.id || '';
    const career = pass.careerPath || '';
    
    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      pid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      career.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || pass.verificationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleStatusChange = async (passportId: string, status: 'Verified' | 'Pending' | 'Rejected' | 'Revoked') => {
    const success = await onUpdatePassportStatus(passportId, status);
    if (success) {
      alert(`পাসপোর্ট স্ট্যাটাস সফলভাবে '${status}' এ পরিবর্তিত হয়েছে!`);
      if (selectedPassport && selectedPassport.id === passportId) {
        setSelectedPassport({ ...selectedPassport, verificationStatus: status });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">স্কিল পাসপোর্ট অনুমোদন ও প্রদান</h1>
        <p className="text-slate-500 text-xs">প্ল্যাটফর্মের ব্যবহারকারীদের অর্জিত প্রোফেশনাল স্কিল পাসপোর্টগুলো যাচাই করুন, অনুমোদন দিন, স্থগিত বা সাময়িক বাতিল (Revoke) করুন।</p>
      </div>

      {/* Advanced filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ইউজার নাম, পাসপোর্ট আইডি বা ক্যারিয়ার ট্র্যাক দিয়ে সার্চ..."
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
          <option value="all">সকল অবস্থা (All Status)</option>
          <option value="Verified">অনুমোদিত ও ভেরিফাইড (Verified)</option>
          <option value="Pending">যাচাইধীন (Pending)</option>
          <option value="Rejected">প্রত্যাখ্যাত (Rejected)</option>
          <option value="Revoked">স্থগিত/বাতিলকৃত (Revoked)</option>
        </select>
      </div>

      {/* Main passports list */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-bold border-b border-slate-150">
                <th className="p-4">পাসপোর্ট আইডি</th>
                <th className="p-4">ব্যবহারকারী</th>
                <th className="p-4">ক্যারিয়ার ট্র্যাক</th>
                <th className="p-4">রেডিনেস স্কোর</th>
                <th className="p-4">অবস্থা (Verification)</th>
                <th className="p-4 text-right">পদক্ষেপ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map(pass => (
                <tr key={pass.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-mono font-bold text-emerald-700">
                    {pass.id}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{pass.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{pass.userId}</div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">
                    {pass.careerPath}
                  </td>
                  <td className="p-4 font-mono font-bold">
                    <span className="text-slate-800 text-xs">{pass.readinessScore}%</span>
                    <span className="text-[10px] text-slate-400 block">Level: {pass.level}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      pass.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                      pass.verificationStatus === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      pass.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {pass.verificationStatus || 'Verified'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedPassport(pass)}
                        title="পাসপোর্ট ভিউ ও অ্যাকশন"
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(pass.id, 'Verified')}
                        disabled={pass.verificationStatus === 'Verified'}
                        title="অনুমোদন দিন"
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded disabled:opacity-50 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(pass.id, 'Revoked')}
                        disabled={pass.verificationStatus === 'Revoked'}
                        title="স্থগিত/বাতিল করুন (Revoke)"
                        className="p-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-600 rounded disabled:opacity-50 transition"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">কোনো স্কিল পাসপোর্ট ডাটা পাওয়া যায়নি।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">পৃষ্ঠা {currentPage} / {totalPages} (মোট {filtered.length} টি পাসপোর্ট)</span>
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

      {/* Passport Preview modal */}
      {selectedPassport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
            {/* Header branding */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white">SP</div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">PROFESSIONAL SKILL PASSPORT</h3>
                  <p className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest font-mono">Verified Credentials</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPassport(null)} 
                className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content info */}
            <div className="p-6 space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row gap-5 items-center">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 font-bold text-xl uppercase text-slate-500">
                  {selectedPassport.fullName.substring(0, 2)}
                </div>
                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <h4 className="font-bold text-slate-950 text-base">{selectedPassport.fullName}</h4>
                  <p className="text-slate-600 font-medium">ক্যারিয়ার লক্ষ্য: {selectedPassport.careerPath}</p>
                  <p className="text-slate-400 font-mono text-[10px]">পাসপোর্ট আইডি: {selectedPassport.id}</p>
                </div>
                {/* QR Code */}
                <div className="h-16 w-16 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center shrink-0">
                  <QrCode className="h-12 w-12 text-slate-800" />
                </div>
              </div>

              {/* Evaluation score grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">CV Score</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{selectedPassport.resumeScore}%</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">ATS Score</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{selectedPassport.atsScore}%</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Viva Score</span>
                  <span className="font-bold text-slate-800 text-sm block mt-0.5">{selectedPassport.interviewScore}%</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Overall</span>
                  <span className="font-bold text-emerald-600 text-sm block mt-0.5">{selectedPassport.readinessScore}%</span>
                </div>
              </div>

              {/* Status indicator and actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">পাসপোর্ট অনুমোদন অবস্থা (Verification Status):</span>
                  <span className={`px-3 py-1 rounded-full font-bold uppercase ${
                    selectedPassport.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                    selectedPassport.verificationStatus === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedPassport.verificationStatus || 'Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => handleStatusChange(selectedPassport.id, 'Verified')}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-lg transition"
                  >
                    অনুমোদন দিন (Verify)
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedPassport.id, 'Revoked')}
                    className="p-2 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-600 font-bold rounded-lg transition"
                  >
                    বাতিল/স্থগিত করুন
                  </button>
                  <a
                    href={`/passport/${selectedPassport.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1.5 transition shadow-sm shadow-blue-600/10"
                  >
                    <span>পাবলিক পেজ ভিউ</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
