import { useNavigate, Link } from 'react-router-dom';
import { getPendingVerifications, approveVerification, rejectVerification, getAllVerifications } from '../services/api';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

import { BACKEND_URL } from '../config';

const VerificationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [activeTab, setActiveTab] = useState('Pending');
  const [remarksMap, setRemarksMap] = useState({});
  const [messagingStudent, setMessagingStudent] = useState(false);
  const navigate = useNavigate();

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getAllVerifications();
      setRequests(res.data);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleAction = async (id, action) => {
    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      const remarks = remarksMap[id] || '';
      if (action === 'approve') {
        await approveVerification(id, remarks);
        toast.success('✅ Request approved! Booking is now active.');
      } else {
        await rejectVerification(id, remarks);
        toast.success('Request rejected.');
      }
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleMessageStudent = async (studentId) => {
    setMessagingStudent(true);
    try {
      const token = localStorage.getItem('rentmate_token');
      await axios.post(`${BACKEND_URL}/api/chat/message`, 
        { 
          receiverId: studentId,
          messageText: "Hello, I have a question regarding your rental verification request."
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      navigate(`/messages?userId=${studentId}`);
    } catch (error) {
        toast.error('Could not start conversation');
    } finally {
        setMessagingStudent(false);
    }
};

  const filtered = requests.filter(r => r.status === activeTab);
  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">Verification Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Branch-specific rental requests assigned to you</p>
          {pendingCount > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              {pendingCount} request{pendingCount > 1 ? 's' : ''} require your attention
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-100 w-fit mb-6">
          {['Pending', 'Approved', 'Rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab} ({requests.filter(r => r.status === tab).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card h-36 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">
              {activeTab === 'Pending' ? '✅' : activeTab === 'Approved' ? '📋' : '📋'}
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No {activeTab.toLowerCase()} requests</h3>
            <p className="text-slate-500 text-sm">
              {activeTab === 'Pending' ? 'All caught up! No pending verifications.' : `No ${activeTab.toLowerCase()} requests yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map(req => (
              <div key={req._id} className="card p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Student Info */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Borrower</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{req.borrowerId?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{req.borrowerId?.name}</p>
                        <p className="text-xs text-slate-500">{req.borrowerId?.email}</p>
                        {(req.borrowerId?.branch || req.branch) && (
                          <span className="inline-flex items-center gap-1 mt-1 bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            🏫 {req.borrowerId?.branch || req.branch}
                          </span>
                        )}
                        {req.borrowerId?.phone && (
                          <p className="text-xs text-slate-400 mt-1">📞 {req.borrowerId.phone}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleMessageStudent(req.borrowerId?._id)}
                            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            💬 Message Student
                          </button>
                          <Link
                            to={`/user/${req.borrowerId?._id}`}
                            target="_blank"
                            className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                          >
                            🔍 View Identity Documents
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Item Info */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Requested Item</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {req.itemId?.image ? (
                          <img src={`${BACKEND_URL}/uploads/${req.itemId.image}`} alt="" className="w-full h-full object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{req.itemId?.itemName}</p>
                        <p className="text-xs text-slate-500">{req.itemId?.category} • ₹{req.itemId?.pricePerDay}/day</p>
                        {req.bookingId && (
                          <p className="text-xs text-primary-600">
                            📅 {new Date(req.bookingId.startDate).toLocaleDateString()} — {new Date(req.bookingId.endDate).toLocaleDateString()} • ₹{req.bookingId.totalPrice}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Request date */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    Requested {new Date(req.requestDate).toLocaleString()}
                    {req.managementId && ` • Processed by ${req.managementId.name}`}
                  </p>
                  {req.status !== 'Pending' && (
                    <span className={`badge ${req.status === 'Approved' ? 'badge-active' : 'badge-rejected'}`}>{req.status}</span>
                  )}
                  {req.remarks && <p className="text-xs text-slate-500 italic">"{req.remarks}"</p>}
                </div>

                {/* Actions for Pending */}
                {req.status === 'Pending' && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Optional: Add remarks (e.g. approved, conditions)..."
                      value={remarksMap[req._id] || ''}
                      onChange={e => setRemarksMap(prev => ({ ...prev, [req._id]: e.target.value }))}
                      className="input-field text-sm py-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(req._id, 'approve')}
                        disabled={processing[req._id]}
                        className="btn-success flex-1 text-sm py-2"
                      >
                        {processing[req._id] ? '...' : '✅ Approve Request'}
                      </button>
                      <button
                        onClick={() => handleAction(req._id, 'reject')}
                        disabled={processing[req._id]}
                        className="btn-danger flex-1 text-sm py-2"
                      >
                        {processing[req._id] ? '...' : '❌ Reject Request'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationRequests;
