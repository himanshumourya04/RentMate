import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getActiveRequests, reportItemRequest, deleteItemRequest, updateItemRequest, getManagementByBranch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BACKEND_URL } from '../config';

const QueryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [managementProfiles, setManagementProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Report Modal state
  const [reportModal, setReportModal] = useState({ show: false, requestId: null, reason: '' });
  
  // Edit Modal state
  const [editModal, setEditModal] = useState({ show: false, reqData: null });
  const [editFile, setEditFile] = useState(null);

  useEffect(() => {
    fetchRequests();
    if (user && user.role === 'student') {
      fetchManagementProfiles();
    }
  }, [user]);

  const fetchManagementProfiles = async () => {
    try {
      const { data } = await getManagementByBranch();
      setManagementProfiles(data);
    } catch (err) {
      console.error('Failed to load management profiles:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await getActiveRequests(); // No branch filter — fetch all active requests
      setRequests(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load active requests');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportModal.reason) return toast.error('Reason is required');
    try {
      await reportItemRequest(reportModal.requestId, reportModal.reason);
      toast.success('Report submitted securely. Admins will review it.');
      setReportModal({ show: false, requestId: null, reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this specific request? This cannot be undone.")) return;
    try {
      await deleteItemRequest(id);
      toast.success('Request deleted successfully');
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete request');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const { _id, itemName, description, branch, duration } = editModal.reqData;
    
    if (!itemName || !description || !branch || !duration) {
      return toast.error('All text fields are required');
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('itemName', itemName);
      formData.append('description', description);
      formData.append('branch', branch);
      formData.append('duration', duration);
      if (editFile) formData.append('image', editFile);

      const { data } = await updateItemRequest(_id, formData);
      toast.success('Request updated successfully');
      
      // Update local state instead of full refetch to save bandwidth
      setRequests(prev => prev.map(r => r._id === _id ? { ...r, ...data.request } : r));
      
      setEditModal({ show: false, reqData: null });
      setEditFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Query Dashboard</h1>
          <p className="text-slate-500 mt-1">Request items you need from peers on campus.</p>
        </div>
        <div className="flex gap-4 items-center w-full md:w-auto">
          <Link to="/add-request" className="btn-primary whitespace-nowrap">
            ➕ Post a Request
          </Link>
        </div>
      </div>

      {/* Management Team Section for Students */}
      {user && user.role === 'student' && managementProfiles.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4 tracking-tight">Your Branch Management Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managementProfiles.map(profile => (
              <div key={profile._id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition duration-300">
                <div className="flex items-center gap-3">
                  <img 
                    src={profile.profileImage ? `${BACKEND_URL}/uploads/${profile.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`} 
                    alt={profile.name} 
                    className="w-12 h-12 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{profile.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{profile.branch} Management</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link to={`/user/${profile._id}`} className="h-9 px-3 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition text-sm font-medium" title="View Profile">
                    Profile
                  </Link>
                  <Link to={`/messages?userId=${profile._id}`} className="h-9 px-3 flex items-center justify-center bg-primary-50 border border-primary-100 text-primary-700 hover:bg-primary-100 hover:text-primary-800 rounded-xl transition text-sm font-medium" title="Message">
                    Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <span className="text-6xl mb-4 block">📢</span>
          <h2 className="text-slate-800 text-xl font-bold">No active requests found.</h2>
          <p className="text-slate-500 mt-2 mb-6">Be the first to ask for an item!</p>
          <Link to="/add-request" className="btn-primary text-sm px-6">Post a Request</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(req => (
            <div key={req._id} className="bg-white border text-sm border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
              <Link to={`/requests/${req._id}`} className="block group">
                <div className="h-48 overflow-hidden bg-slate-100 relative">
                  <img 
                    src={req.image || 'https://placehold.co/400x300?text=No+Image'} 
                    alt={req.itemName} 
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-slate-700 rounded-lg shadow-sm">
                    ⏳ Need for: {req.duration}
                  </div>
                </div>
                <div className="px-5 pt-4 pb-2">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors" title={req.itemName}>
                      {req.itemName}
                    </h3>
                    <span className="bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded font-medium border border-primary-100 shrink-0 ml-2">
                      {req.branch}
                    </span>
                  </div>
                  <p className="text-slate-600 mb-3 line-clamp-2 h-10">{req.description}</p>
                </div>
              </Link>
              <div className="px-5 pb-5 pt-2">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <img 
                      src={req.userId?.profileImage ? `${BACKEND_URL}/uploads/${req.userId.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(req.userId?.name || 'U')}&background=random`} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover bg-slate-200"
                    />
                    <div className="text-xs">
                      <p className="font-medium text-slate-800">{req.userId?.name || 'Unknown'}</p>
                      <p className="text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {user && user.role === 'admin' ? (
                    // Admin: full Edit + Delete on all posts
                    <>
                      <button
                        onClick={() => setEditModal({ show: true, reqData: { _id: req._id, itemName: req.itemName, description: req.description, branch: req.branch, duration: req.duration } })}
                        className="flex-1 py-2 text-sm font-semibold bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(req._id)}
                        className="flex-1 py-2 text-sm font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  ) : user && user.role === 'student' && user._id === req.userId?._id ? (
                    // Post Owner (student): Edit + Delete within 2-day window
                    <>
                      <div className="w-full mb-1">
                        {(() => {
                          const msLeft = new Date(req.expiresAt) - new Date();
                          const hrsLeft = Math.max(0, Math.floor(msLeft / 3600000));
                          const minsLeft = Math.max(0, Math.floor((msLeft % 3600000) / 60000));
                          return (
                            <p className={`text-xs font-medium text-center ${hrsLeft < 6 ? 'text-red-500' : 'text-slate-400'}`}>
                              ⏳ Auto-deletes in {hrsLeft > 0 ? `${hrsLeft}h ` : ''}{minsLeft}m
                            </p>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => setEditModal({ show: true, reqData: { _id: req._id, itemName: req.itemName, description: req.description, branch: req.branch, duration: req.duration } })}
                        className="flex-1 py-2 text-sm font-semibold bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(req._id)}
                        className="flex-1 py-2 text-sm font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  ) : user && user._id !== req.userId?._id ? (
                    // Another Student or Management: I Have This + Report
                    <>
                      <button
                        onClick={() => navigate(`/messages?userId=${req.userId._id}`)}
                        className="btn-primary flex-1 py-2 text-sm"
                      >
                        💬 I Have This
                      </button>
                      <button
                        onClick={() => setReportModal({ show: true, requestId: req._id, reason: '' })}
                        className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 px-3 rounded-xl transition"
                        title="Report this request"
                      >
                        🚩
                      </button>
                    </>
                  ) : (
                    <button disabled className="bg-slate-100 text-slate-400 flex-1 py-2 rounded-xl text-sm font-semibold cursor-not-allowed">
                      Your request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-red-800">🚩 Report Request</h3>
              <button onClick={() => setReportModal({ show: false, requestId: null, reason: '' })} className="text-slate-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <form onSubmit={submitReport} className="p-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Why are you reporting this?</label>
              <textarea
                required
                value={reportModal.reason}
                onChange={e => setReportModal({ ...reportModal, reason: e.target.value })}
                className="input-field min-h-[100px] resize-none"
                placeholder="e.g. Spam, offensive content, prohibited item..."
              />
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setReportModal({ show: false, requestId: null, reason: '' })} className="btn-secondary">Cancel</button>
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold transition">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {editModal.show && editModal.reqData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-primary-50">
              <h3 className="font-bold text-primary-800 text-lg">✏️ Edit Request</h3>
              <button onClick={() => { setEditModal({ show: false, reqData: null }); setEditFile(null); }} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editModal.reqData.itemName}
                  onChange={e => setEditModal(m => ({ ...m, reqData: { ...m.reqData, itemName: e.target.value } }))}
                  className="input-field"
                  placeholder="What item do you need?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  value={editModal.reqData.description}
                  onChange={e => setEditModal(m => ({ ...m, reqData: { ...m.reqData, description: e.target.value } }))}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Describe what you need..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    required
                    value={editModal.reqData.branch}
                    onChange={e => setEditModal(m => ({ ...m, reqData: { ...m.reqData, branch: e.target.value } }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={editModal.reqData.duration}
                    onChange={e => setEditModal(m => ({ ...m, reqData: { ...m.reqData, duration: e.target.value } }))}
                    className="input-field"
                    placeholder="e.g. 1 week"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Replace Image <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setEditFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
                {editFile && <p className="text-xs text-emerald-600 mt-1">✅ New image selected: {editFile.name}</p>}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setEditModal({ show: false, reqData: null }); setEditFile(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary px-8" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryDashboard;
