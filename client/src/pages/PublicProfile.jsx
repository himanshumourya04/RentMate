import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

import { BACKEND_URL } from '../config';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('rentmate_token');
        const { data } = await axios.get(`${BACKEND_URL}/api/users/student/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(data);
      } catch {
        toast.error('Could not load user profile or user not found');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchProfile();
    } else {
      toast.error('Please login to view profiles');
      navigate('/login');
    }
  }, [id, user, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="text-primary-600 text-sm font-medium mb-6 hover:underline">
          ← Back
        </button>

        <div className="card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-100 mb-8">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 shadow-md flex items-center justify-center">
              {profile.profileImage ? (
                <img src={`${BACKEND_URL}/uploads/${profile.profileImage}`} alt={profile.name} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/100x100?text=?'} />
              ) : (
                <span className="text-white text-3xl font-bold">{profile.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-800">{profile.name}</h2>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <span className="badge bg-primary-100 text-primary-700 capitalize">Student</span>
                {profile.branch && <span className="badge bg-slate-100 text-slate-700">🏫 {profile.branch}</span>}
                {profile.managementVerified && (
                  <span className="badge bg-emerald-100 text-emerald-700">✓ Verified</span>
                )}
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-lg font-bold text-slate-800 mb-4">Identity Verification</h3>
             <p className="text-sm text-slate-500 mb-6 bg-slate-100 p-4 rounded-xl">
               For community safety and trust, members can view each other's verified identification documents before engaging in rentals.
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {profile.selfieImage ? (
                 <div>
                   <span className="block text-sm font-medium text-slate-700 mb-2">Live Selfie</span>
                   <img src={`${BACKEND_URL}/uploads/${profile.selfieImage}`} alt="Selfie" className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm" />
                 </div>
               ) : (
                 <div className="h-48 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm bg-slate-50">No selfie uploaded</div>
               )}
               
               {profile.collegeIdImage ? (
                 <div>
                   <span className="block text-sm font-medium text-slate-700 mb-2">College ID Card</span>
                   <img src={`${BACKEND_URL}/uploads/${profile.collegeIdImage}`} alt="College ID" className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm" />
                 </div>
               ) : (
                 <div className="h-48 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm bg-slate-50">No College ID uploaded</div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
