import React, { useState, useEffect } from 'react';
import { adminDb, Testimonial, Statistic } from '../../lib/adminSupabase';
import { 
  Star, 
  Trash2, 
  Edit3, 
  Plus, 
  Save, 
  X, 
  Sliders, 
  BarChart3, 
  MessageSquare,
  Sparkles,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

export const AdminReviewsStatsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'stats'>('reviews');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Lists
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [statistics, setStatistics] = useState<Statistic[]>([]);

  // Editing States
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editingStatistic, setEditingStatistic] = useState<Statistic | null>(null);

  // Form inputs for Testimonials
  const [testName, setTestName] = useState('');
  const [testRole, setTestRole] = useState('');
  const [testImage, setTestImage] = useState('');
  const [testText, setTestText] = useState('');
  const [testRating, setTestRating] = useState(5);

  // Form inputs for Statistics
  const [statValue, setStatValue] = useState('');
  const [statLabel, setStatLabel] = useState('');
  const [statLabelEn, setStatLabelEn] = useState('');
  const [statColor, setStatColor] = useState('text-brand-green');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tests = await adminDb.getTestimonials();
      const stats = await adminDb.getStatistics();
      setTestimonials(tests);
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading reviews & stats data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // --- TESTIMONIAL ACTIONS ---
  const handleStartAddTestimonial = () => {
    setEditingTestimonial({
      id: '',
      name: '',
      role: '',
      image_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      comment: '',
      rating: 5
    });
    setTestName('');
    setTestRole('');
    setTestImage('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80');
    setTestText('');
    setTestRating(5);
  };

  const handleStartEditTestimonial = (test: Testimonial) => {
    setEditingTestimonial(test);
    setTestName(test.name);
    setTestRole(test.role);
    setTestImage(test.image_url);
    setTestText(test.comment);
    setTestRating(test.rating);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || !testRole.trim() || !testText.trim()) {
      showToast('সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন', 'error');
      return;
    }

    setSaving(true);
    try {
      let updatedList: Testimonial[] = [];
      const newTestimonial: Testimonial = {
        id: editingTestimonial?.id || `test-${Math.random().toString(36).substring(2, 9)}`,
        name: testName,
        role: testRole,
        image_url: testImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        comment: testText,
        rating: testRating
      };

      if (editingTestimonial?.id) {
        // Edit
        updatedList = testimonials.map(t => t.id === editingTestimonial.id ? newTestimonial : t);
      } else {
        // Add
        updatedList = [...testimonials, newTestimonial];
      }

      const success = await adminDb.saveTestimonials(updatedList);
      if (success) {
        setTestimonials(updatedList);
        setEditingTestimonial(null);
        showToast('রিভিউ সফলভাবে সংরক্ষণ করা হয়েছে!');
      } else {
        showToast('সংরক্ষণ করতে ব্যর্থ হয়েছে', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('সার্ভার ত্রুটি ঘটেছে', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই রিভিউটি মুছে ফেলতে চান?')) return;

    try {
      const updatedList = testimonials.filter(t => t.id !== id);
      const success = await adminDb.saveTestimonials(updatedList);
      if (success) {
        setTestimonials(updatedList);
        showToast('রিভিউটি সফলভাবে মুছে ফেলা হয়েছে!');
      } else {
        showToast('মুছে ফেলতে ব্যর্থ হয়েছে', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('সার্ভার ত্রুটি ঘটেছে', 'error');
    }
  };

  // --- STATISTIC ACTIONS ---
  const handleStartAddStatistic = () => {
    setEditingStatistic({
      id: '',
      value: '',
      label: '',
      labelEn: '',
      color: 'text-brand-green'
    });
    setStatValue('');
    setStatLabel('');
    setStatLabelEn('');
    setStatColor('text-brand-green');
  };

  const handleStartEditStatistic = (stat: Statistic) => {
    setEditingStatistic(stat);
    setStatValue(stat.value);
    setStatLabel(stat.label);
    setStatLabelEn(stat.labelEn);
    setStatColor(stat.color || 'text-brand-green');
  };

  const handleSaveStatistic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statValue.trim() || !statLabel.trim() || !statLabelEn.trim()) {
      showToast('সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন', 'error');
      return;
    }

    setSaving(true);
    try {
      let updatedList: Statistic[] = [];
      const newStat: Statistic = {
        id: editingStatistic?.id || `stat-${Math.random().toString(36).substring(2, 9)}`,
        value: statValue,
        label: statLabel,
        labelEn: statLabelEn,
        color: statColor
      };

      if (editingStatistic?.id) {
        // Edit
        updatedList = statistics.map(s => s.id === editingStatistic.id ? newStat : s);
      } else {
        // Add
        updatedList = [...statistics, newStat];
      }

      const success = await adminDb.saveStatistics(updatedList);
      if (success) {
        setStatistics(updatedList);
        setEditingStatistic(null);
        showToast('পরিসংখ্যান সফলভাবে সংরক্ষণ করা হয়েছে!');
      } else {
        showToast('সংরক্ষণ করতে ব্যর্থ হয়েছে', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('সার্ভার ত্রুটি ঘটেছে', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStatistic = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই পরিসংখ্যানটি মুছে ফেলতে চান?')) return;

    try {
      const updatedList = statistics.filter(s => s.id !== id);
      const success = await adminDb.saveStatistics(updatedList);
      if (success) {
        setStatistics(updatedList);
        showToast('পরিসংখ্যান সফলভাবে মুছে ফেলা হয়েছে!');
      } else {
        showToast('মুছে ফেলতে ব্যর্থ হয়েছে', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('সার্ভার ত্রুটি ঘটেছে', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">তথ্য লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-base font-bold text-slate-950 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-emerald-600" />
            ল্যান্ডিং পেজ কনটেন্ট ম্যানেজার
          </h1>
          <p className="text-xs text-slate-500">
            ল্যান্ডিং পেজের রিয়েল-টাইম ইউজার রিভিউ ও হোমপেজ পরিসংখ্যানসমূহ এখান থেকে সহজেই এড, এডিট বা রিমুভ করুন।
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>রিলোড</span>
        </button>
      </div>

      {/* Toast Notification */}
      {message && (
        <div className={`p-3.5 rounded-lg border text-xs font-semibold shadow-xs ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('reviews'); setEditingTestimonial(null); }}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'reviews' 
              ? 'border-emerald-600 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          } flex items-center gap-2`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>ব্যবহারকারীদের রিভিউ ({testimonials.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('stats'); setEditingStatistic(null); }}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'stats' 
              ? 'border-emerald-600 text-emerald-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          } flex items-center gap-2`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>হোমপেজ পরিসংখ্যান ({statistics.length})</span>
        </button>
      </div>

      {/* --- REVIEWS TAB --- */}
      {activeTab === 'reviews' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Reviews List (Left side) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                সক্রিয় রিভিউসমূহ
              </h2>
              {!editingTestimonial && (
                <button
                  onClick={handleStartAddTestimonial}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>নতুন রিভিউ যুক্ত করুন</span>
                </button>
              )}
            </div>

            {testimonials.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <p className="text-xs text-slate-500">কোনো রিভিউ পাওয়া যায়নি। ডানদিকের ফর্ম থেকে নতুন রিভিউ তৈরি করুন।</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {testimonials.map((test) => (
                  <div 
                    key={test.id} 
                    className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 relative hover:border-slate-300 transition"
                  >
                    <div>
                      {/* Rating stars */}
                      <div className="flex gap-0.5 text-amber-400 mb-2">
                        {[...Array(test.rating)].map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 italic leading-relaxed">
                        "{test.comment}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={test.image_url} 
                          alt={test.name} 
                          className="h-8 w-8 rounded-full object-cover border border-emerald-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
                          }}
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{test.name}</h4>
                          <p className="text-[10px] text-slate-500">{test.role}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEditTestimonial(test)}
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded transition"
                          title="সম্পাদনা"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(test.id)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testimonial Form (Right side) */}
          <div className="lg:col-span-1">
            {editingTestimonial ? (
              <form onSubmit={handleSaveTestimonial} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4 sticky top-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-950">
                    {editingTestimonial.id ? 'রিভিউ সম্পাদনা' : 'নতুন রিভিউ যোগ'}
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setEditingTestimonial(null)} 
                    className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-50 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">নাম (Name)</label>
                  <input 
                    type="text" 
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="উদা: সাকিব আল হাসান"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                {/* Role/Podobi */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">পদবী ও প্রতিষ্ঠান (Role / Subtitle)</label>
                  <input 
                    type="text" 
                    value={testRole}
                    onChange={(e) => setTestRole(e.target.value)}
                    placeholder="উদা: সফটওয়্যার ইঞ্জিনিয়ার, রেইজ আইটি"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                {/* Comment Text */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">মন্তব্য (Comment / Review)</label>
                  <textarea 
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="রিভিউয়ের বিস্তারিত এখানে লিখুন..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs h-24 resize-none"
                    required
                  />
                </div>

                {/* Profile Picture URL */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    প্রোফাইল পিকচার লিংক (Avatar URL)
                  </label>
                  <input 
                    type="text" 
                    value={testImage}
                    onChange={(e) => setTestImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block">কোনো ছবির অনলাইন ডিরেক্ট লিংক দিন।</span>
                </div>

                {/* Rating (1-5 Stars) */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">রেটিং স্টারস (Rating Rating)</label>
                  <select 
                    value={testRating} 
                    onChange={(e) => setTestRating(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (৫ স্টার - ডিফল্ট)</option>
                    <option value="4">⭐⭐⭐⭐ (৪ স্টার)</option>
                    <option value="3">⭐⭐⭐ (৩ স্টার)</option>
                    <option value="2">⭐⭐ (২ স্টার)</option>
                    <option value="1">⭐ (১ স্টার)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTestimonial(null)}
                    className="w-1/2 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-75"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 text-center space-y-4">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900">নতুন রিভিউ যোগ করুন</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    বাংলাদেশি সফল ডেভেলপার ও রিক্রুটারদের রিভিউ সরাসরি আপনার হোমপেজের স্লাইডার বা গ্রিডে লাইভ পাবলিশ করুন।
                  </p>
                </div>
                <button
                  onClick={handleStartAddTestimonial}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>তৈরি করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- STATISTICS TAB --- */}
      {activeTab === 'stats' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Statistics List (Left side) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                সক্রিয় পরিসংখ্যান কার্ডসমূহ
              </h2>
              {!editingStatistic && (
                <button
                  onClick={handleStartAddStatistic}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>নতুন পরিসংখ্যান যুক্ত করুন</span>
                </button>
              )}
            </div>

            {statistics.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <p className="text-xs text-slate-500">কোনো পরিসংখ্যান পাওয়া যায়নি। ডানদিকের ফর্ম থেকে নতুন পরিসংখ্যান তৈরি করুন।</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {statistics.map((stat) => (
                  <div 
                    key={stat.id} 
                    className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`text-2xl font-black font-display ${stat.color || 'text-brand-green'}`}>
                          {stat.value}
                        </span>
                        {/* Action buttons */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartEditStatistic(stat)}
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded transition"
                            title="সম্পাদনা"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStatistic(stat.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-800 block">🇧🇩 {stat.label}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">🇬🇧 {stat.labelEn}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statistic Form (Right side) */}
          <div className="lg:col-span-1">
            {editingStatistic ? (
              <form onSubmit={handleSaveStatistic} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4 sticky top-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-950">
                    {editingStatistic.id ? 'পরিসংখ্যান সম্পাদনা' : 'নতুন পরিসংখ্যান যোগ'}
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setEditingStatistic(null)} 
                    className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-50 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Value */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">সংখ্যা / মান (Value / Metric)</label>
                  <input 
                    type="text" 
                    value={statValue}
                    onChange={(e) => setStatValue(e.target.value)}
                    placeholder="উদা: ১৫,০০০+ বা ৯৪.২%"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold"
                    required
                  />
                </div>

                {/* Label Bn */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">লেবেল বাংলা (Label BN)</label>
                  <input 
                    type="text" 
                    value={statLabel}
                    onChange={(e) => setStatLabel(e.target.value)}
                    placeholder="উদা: সম্পন্ন মূল্যায়ন"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                {/* Label En */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">লেবেল ইংরেজি (Label EN)</label>
                  <input 
                    type="text" 
                    value={statLabelEn}
                    onChange={(e) => setStatLabelEn(e.target.value)}
                    placeholder="উদা: Assessments Completed"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                {/* Text Color / Accent Class */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">হাইলাইট কালার থিম (Accent Color)</label>
                  <select 
                    value={statColor} 
                    onChange={(e) => setStatColor(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
                  >
                    <option value="text-brand-green">Emerald Green (সবুজ - ডিফল্ট)</option>
                    <option value="text-brand-blue">Royal Blue (নীল)</option>
                    <option value="text-purple-500">Purple (বেগুনী)</option>
                    <option value="text-emerald-500">Classic Emerald (ক্লাসিক সবুজ)</option>
                    <option value="text-red-500">Tomato Red (লাল)</option>
                    <option value="text-amber-500">Amber Glow (হলুদ/কমলা)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingStatistic(null)}
                    className="w-1/2 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-75"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 text-center space-y-4">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900">নতুন পরিসংখ্যান কার্ড যোগ করুন</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    আপনার প্ল্যাটফর্মের সফল পরিসংখ্যান যেমন সম্পন্ন ইন্টারভিউ, মোট অ্যাক্টিভ ইউজার বা নিয়োগদাতা পার্টনারদের সংখ্যা প্রদর্শন করুন।
                  </p>
                </div>
                <button
                  onClick={handleStartAddStatistic}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>তৈরি করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
