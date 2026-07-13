import React, { useState, useEffect } from 'react';
import { supabaseClient, isRealSupabase } from '../../lib/supabase';
import { Card, Button } from '../UI';
import { Link, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export const AdminProjectSubmissionsView = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [mark, setMark] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      if (isRealSupabase && supabaseClient) {
        const { data, error } = await supabaseClient
          .from('project_submissions')
          .select('*, profiles(full_name, email)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) {
          setSubmissions(data);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching project submissions:', err);
      const stored = localStorage.getItem('skillproof_project_submissions');
      setSubmissions(stored ? JSON.parse(stored) : []);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sub: any) => {
    setSelectedSub(sub);
    setFeedback(sub.feedback || '');
    setMark(sub.mark || 0);
  };

  const handleSave = async () => {
    if (!selectedSub) return;
    setSaving(true);
    try {
      if (isRealSupabase && supabaseClient) {
        const { error } = await supabaseClient
          .from('project_submissions')
          .update({ feedback, mark })
          .eq('id', selectedSub.id);
        if (error) {
          console.warn('Supabase update failed, falling back to local');
        } else {
          setSubmissions(submissions.map(s => s.id === selectedSub.id ? { ...s, feedback, mark } : s));
          setSelectedSub(null);
          return;
        }
      }
      const updated = submissions.map(s => s.id === selectedSub.id ? { ...s, feedback, mark } : s);
      setSubmissions(updated);
      localStorage.setItem('skillproof_project_submissions', JSON.stringify(updated));
      setSelectedSub(null);
    } catch (err) {
      console.error('Error updating submission:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading submissions...</div>;
  }

  if (selectedSub) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Review Submission</h2>
          <Button variant="outline" size="sm" onClick={() => setSelectedSub(null)}>Back to List</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-700">Student Info</h3>
            <div>
              <p className="text-sm text-slate-500">Name</p>
              <p className="font-medium">{selectedSub.profiles?.full_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium">{selectedSub.profiles?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Project Link</p>
              <a href={selectedSub.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-1">
                <ExternalLink className="w-4 h-4" /> View Project
              </a>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-700">Evaluation</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mark (out of 10)</label>
              <input 
                type="number" 
                min="0" max="10"
                value={mark}
                onChange={e => setMark(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Feedback</label>
              <textarea 
                rows={4}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Provide constructive feedback..."
              />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Evaluation'}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Project Submissions</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
            <tr>
              <th className="p-4 font-medium">Student</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Link</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Mark</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.map(sub => (
              <tr key={sub.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-medium text-slate-800">{sub.profiles?.full_name || 'User'}</div>
                  <div className="text-xs text-slate-500">{sub.profiles?.email}</div>
                </td>
                <td className="p-4 text-slate-600">
                  {new Date(sub.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <a href={sub.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    <Link className="w-4 h-4" /> Link
                  </a>
                </td>
                <td className="p-4">
                  {sub.mark !== null ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Evaluated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </td>
                <td className="p-4 font-medium text-slate-700">
                  {sub.mark !== null ? `${sub.mark}/10` : '-'}
                </td>
                <td className="p-4">
                  <Button variant="outline" size="sm" onClick={() => handleSelect(sub)}>
                    Review
                  </Button>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
