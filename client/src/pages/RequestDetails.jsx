import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRequestById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data } = await getRequestById(id);
        setRequest(data);
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
              src={request.image.url} 
              alt={request.itemName} 
              className="absolute inset-0 w-full h-full object-cover"
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

              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                <img 
                  src={request.userId.profileImage?.url || '/default-avatar.png'} 
                  alt={request.userId.name} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                />
                <div>
                  <p className="text-sm text-slate-500 font-medium">Requested by</p>
                  <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    {request.userId.name}
                    {request.userId.managementVerified && (
                      <span className="text-blue-500 text-xl" title="Verified Student">✓</span>
                    )}
                  </p>
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
                <Link to={`/messages?userId=${request.userId._id}`} className="btn-primary w-full py-4 text-lg font-bold shadow-md shadow-primary-200 hover:shadow-lg hover:shadow-primary-300 transition-all flex items-center justify-center gap-2">
                  <span>🤝</span> I Have This Item
                </Link>
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
