import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemById, requestBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

import { BACKEND_URL } from '../config';

const ItemDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ startDate: '', endDate: '' });
  const [requesting, setRequesting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [messagingOwner, setMessagingOwner] = useState(false);

  useEffect(() => {
    getItemById(id)
      .then(res => setItem(res.data))
      .catch(() => toast.error('Item not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalDays = booking.startDate && booking.endDate
    ? Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24))
    : 0;

  const totalPrice = totalDays > 0 ? totalDays * (item?.pricePerDay || 0) : 0;

  const handleRequest = async () => {
    if (!user) { navigate('/login'); return; }
    if (!booking.startDate || !booking.endDate) { toast.error('Please select start and end dates'); return; }
    if (totalDays <= 0) { toast.error('End date must be after start date'); return; }
    setRequesting(true);
    try {
      await requestBooking({ itemId: id, startDate: booking.startDate, endDate: booking.endDate });
      toast.success('Booking request sent! A management member will verify it shortly.');
      setShowModal(false);
      navigate('/my-rentals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking request failed');
    } finally {
      setRequesting(false);
    }
  };

  const handleMessageOwner = async () => {
      if (!user) { navigate('/login'); return; }
      setMessagingOwner(true);
      try {
        const token = localStorage.getItem('rentmate_token');
        await axios.post(`${BACKEND_URL}/api/chat/message`, 
          { 
            receiverId: item.ownerId._id,
            messageText: `Hi, I'm interested in your ${item.itemName}!`
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        navigate(`/messages?userId=${item.ownerId._id}`);
      } catch (error) {
          toast.error(error.response?.data?.message || 'Could not start conversation');
      } finally {
          setMessagingOwner(false);
      }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!item) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">Item not found</div>
  );

  const imageUrl = item.image ? `${BACKEND_URL}/uploads/${item.image}` : null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-600 text-sm font-medium mb-6 hover:underline">
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="card overflow-hidden">
            <div className="h-72 lg:h-96 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt={item.itemName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-7xl">📦</span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-primary-100 text-primary-700">{item.category}</span>
                {item.availability
                  ? <span className="badge bg-emerald-100 text-emerald-700">✓ Available</span>
                  : <span className="badge bg-red-100 text-red-700">✗ Unavailable</span>}
                {item.condition && <span className="badge bg-slate-100 text-slate-600">{item.condition}</span>}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800">{item.itemName}</h1>
              <p className="text-slate-500 mt-2 leading-relaxed">{item.description}</p>
            </div>

            <div className="card p-5">
              <div className="text-3xl font-extrabold text-primary-600 mb-1">
                ₹{item.pricePerDay}<span className="text-base font-normal text-slate-500"> /day</span>
              </div>
              {item.ownerId && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/user/${item.ownerId._id}`)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                      {item.ownerId?.profileImage ? (
                        <img src={`${BACKEND_URL}/uploads/${item.ownerId.profileImage}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm">{item.ownerId?.name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm hover:text-primary-600 transition-colors flex items-center gap-1">
                        {item.ownerId?.name}
                      </p>
                      {item.ownerId?.branch && <p className="text-xs text-slate-500">{item.ownerId.branch} Department</p>}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/user/${item.ownerId._id}`)}
                    className="h-9 px-4 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition text-sm font-medium w-full sm:w-auto"
                  >
                    View Profile
                  </button>
                </div>
              )}
            </div>

            {item.availability && user?.role === 'student' && item.ownerId?._id !== user?._id && (
              <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex-1 py-3 text-base"
                  >
                    📅 Request to Borrow
                  </button>
                  <button
                    onClick={handleMessageOwner}
                    disabled={messagingOwner}
                    className="btn-secondary flex-1 py-3 text-base border-primary-600 text-primary-600 hover:bg-primary-50"
                  >
                    {messagingOwner ? 'Starting Chat...' : '💬 Message Owner'}
                  </button>
              </div>
            )}
            {!user && (
              <button onClick={() => navigate('/login')} className="btn-primary w-full py-3 text-base">
                Login to Request Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">Request Booking</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <p className="text-sm text-slate-600 mb-4">Booking for: <span className="font-semibold">{item.itemName}</span></p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    value={booking.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setBooking({ ...booking, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date *</label>
                  <input
                    type="date"
                    value={booking.endDate}
                    min={booking.startDate || new Date().toISOString().split('T')[0]}
                    onChange={e => setBooking({ ...booking, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                {totalDays > 0 && (
                  <div className="bg-primary-50 rounded-xl p-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Duration</span>
                      <span className="font-medium">{totalDays} day{totalDays > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Rate</span>
                      <span className="font-medium">₹{item.pricePerDay}/day</span>
                    </div>
                    <div className="flex justify-between font-bold text-primary-600 text-base border-t border-primary-100 pt-2 mt-2">
                      <span>Total</span>
                      <span>₹{totalPrice}</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                  ⚠️ Your request will be verified by a management member before confirmation.
                </p>
                <button onClick={handleRequest} disabled={requesting} className="btn-primary w-full py-3">
                  {requesting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetails;
