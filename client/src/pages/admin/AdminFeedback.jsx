import { BACKEND_URL } from '../../config';
import { useState, useEffect } from 'react';
import { getAllFeedbackAdmin, updateFeedbackStatusAdmin, deleteFeedbackAdmin } from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => { fetchFeedbacks(); }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data } = await getAllFeedbackAdmin();
      setFeedbacks(data);
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateFeedbackStatusAdmin(id, newStatus);
      toast.success(`Marked as ${newStatus}`);
      fetchFeedbacks();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback permanently?')) return;
    try {
      await deleteFeedbackAdmin(id);
      toast.success('Feedback deleted');
      fetchFeedbacks();
    } catch {
      toast.error('Failed to delete feedback');
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchType = filterType === 'All' || f.feedbackType === filterType;
    const matchStatus = filterStatus === 'All' || f.status === filterStatus;
    return matchType && matchStatus;
  });

  const typeColor = (type) => {
    if (type === 'Bug Report') return 'bg-rose-100 text-rose-700';
    if (type === 'Feature Request') return 'bg-indigo-100 text-indigo-700';
    if (type === 'Complaint') return 'bg-orange-100 text-orange-700';
    return 'bg-slate-100 text-slate-700';
  };

  const statusColor = (status) => {
    if (status === 'new') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'reviewed') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  if (loading) return (
    <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
      Loading feedback dashboard...
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">User Feedback & Bug Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Review and manage platform feedback from users.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Types</option>
            <option value="Bug Report">Bug Reports</option>
            <option value="Feature Request">Feature Requests</option>
            <option value="General Feedback">General</option>
            <option value="Complaint">Complaints</option>
          </select>
        </div>
      </div>

      {/* Summary count */}
      <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-medium">
        Showing {filteredFeedbacks.length} of {feedbacks.length} submissions
      </div>

      {/* Card list — fully responsive, no horizontal scroll needed */}
      {filteredFeedbacks.length === 0 ? (
        <div className="p-10 text-center text-slate-400">No feedback matches your filters.</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filteredFeedbacks.map((item) => (
            <li key={item._id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                {/* Left: user info + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeColor(item.feedbackType)}`}>
                      {item.feedbackType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{item.email}</p>

                  {/* Star rating */}
                  <div className="flex gap-0.5 text-amber-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-current' : 'text-slate-200 fill-current'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Message */}
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{item.message}</p>

                  {/* Screenshot thumbnail */}
                  {item.screenshot && (
                    <a href={`${BACKEND_URL}/uploads/${item.screenshot}`} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-3 w-20 h-14 rounded-lg border border-slate-200 overflow-hidden hover:ring-2 hover:ring-indigo-400 transition">
                      <img src={`${BACKEND_URL}/uploads/${item.screenshot}`} alt="Screenshot" className="w-full h-full object-cover" />
                    </a>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>

                {/* Right: status + delete */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 flex-shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdateStatus(item._id, e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide outline-none border-2 transition-colors cursor-pointer ${statusColor(item.status)}`}
                  >
                    <option value="new">NEW</option>
                    <option value="reviewed">REVIEWED</option>
                    <option value="resolved">RESOLVED</option>
                  </select>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Feedback"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminFeedback;
