import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRequestById, getManagementByBranch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BACKEND_URL } from '../config';

// Native relative time helper — no extra packages needed
const timeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [managementProfiles, setManagementProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data } = await getRequestById(id);
        setRequest(data);
        if (data.branch) {
          try {
            const mgtRes = await getManagementByBranch(data.branch);
            setManagementProfiles(mgtRes.data);
          } catch(err) {
            console.error('Failed to load management for this branch', err);
          }
        }
      } catch (err) {
        toast.error('Failed to load request details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const isOwner = user && user._id === request.userId._id;

  let requestImageUrl = '/placeholder-image.png';
  if (typeof request.image === 'string') {
    requestImageUrl = request.image.startsWith('http') ? request.image : `${BACKEND_URL}/uploads/${request.image}`;
  } else if (request.image && request.image.url) {
    requestImageUrl = request.image.url.startsWith('http') ? request.image.url : `${BACKEND_URL}${request.image.url}`;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-800 transition font-medium">
          <span className="mr-2">&larr;</span> Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-1/2 relative h-72 md:h-auto bg-slate-100">
            <img 
              src={requestImageUrl} 
              alt={request.itemName} 
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.target.src = '/placeholder-image.png'; }}
            />
            {request.isPinned && (
              <div className="absolute top-4 left-4 bg-red-600 shadow-lg text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                <span>📌</span> Featured Request
              </div>
            )}
            <div className={`absolute bottom-4 left-4 border backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full shadow-sm
              ${request.status === 'active' ? 'bg-emerald-100/90 text-emerald-800 border-emerald-200' : 'bg-slate-100/90 text-slate-800 border-slate-200'}`}>
              ● {request.status.toUpperCase()}
            </div>
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{request.itemName}</h1>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                <span className="flex items-center gap-1"><span className="text-lg">⏳</span> {request.duration}</span>
                <span className="flex items-center gap-1"><span className="text-lg">📍</span> {request.branch}</span>
                <span className="flex items-center gap-1"><span className="text-lg">🕒</span> {timeAgo(request.createdAt)}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>📝</span> Description
                </h3>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">{request.description}</p>
              </div>

              <div className="mb-8 pb-8 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>👤</span> Request Creator
                </h3>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4 hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <img 
                      src={request.userId.profileImage ? `${BACKEND_URL}/uploads/${request.userId.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(request.userId.name)}&background=random`} 
                      alt={request.userId.name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-100"
                    />
                    <div>
                      <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        {request.userId.name}
                        {request.userId.managementVerified && (
                          <span className="text-blue-500 text-xl" title="Verified Student">✓</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500 font-medium">{request.userId.branch || 'Unknown'} Department</p>
                    </div>
                  </div>
                  {!isOwner && (
                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                      <Link to={`/user/${request.userId._id}`} className="flex-1 sm:flex-none h-10 px-4 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition text-sm font-medium">
                        View Profile
                      </Link>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div>
              {isOwner ? (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start gap-3">
                  <span className="text-xl">👋</span>
                  <p className="text-sm text-amber-800 font-medium leading-snug text-left">
                    This is your request. Other users can click here to message you if they have this item.
                  </p>
                </div>
              ) : request.status === 'active' ? (
                user?.role === 'student' ? (
                  <Link to={`/messages?userId=${request.userId._id}`} className="btn-primary w-full py-4 text-lg font-bold shadow-md shadow-primary-200 hover:shadow-lg hover:shadow-primary-300 transition-all flex items-center justify-center gap-2">
                    <span>🤝</span> I Have This Item
                  </Link>
                ) : null
              ) : (
                <div className="bg-slate-100 text-slate-500 font-bold p-4 rounded-xl text-center">
                  This request is closed.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
