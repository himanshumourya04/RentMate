import { Link, useNavigate } from 'react-router-dom';
import { getStudentBookings, finalizeBooking } from '../services/api';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react'; // Added useState and useEffect

import { BACKEND_URL } from '../config';

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'badge-pending', 'Awaiting Payment': 'bg-indigo-100 text-indigo-700', Active: 'badge-active',
    Completed: 'badge-completed', Rejected: 'badge-rejected', Cancelled: 'badge-rejected',
  };
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>;
};

const ManagementBadge = ({ status }) => {
  const map = { Pending: 'badge-pending', Approved: 'badge-active', Rejected: 'badge-rejected' };
  return <span className={`badge ${map[status] || 'badge-pending'} text-xs`}>👩‍🏫 {status}</span>;
};

const MyRentals = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [messagingOwner, setMessagingOwner] = useState(false);
  const [messagingManagement, setMessagingManagement] = useState(false);

  const handleMessageOwner = async (ownerId) => {
      setMessagingOwner(true);
      try {
        const token = localStorage.getItem('rentmate_token');
        await fetch(`${BACKEND_URL}/api/messages/conversation/${ownerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ chatType: 'student_student' })
        });
        navigate('/messages');
      } catch (error) {
          toast.error('Could not start conversation');
      } finally {
          setMessagingOwner(false);
      }
  };

  const handleMessageManagement = async (bookingId) => {
    setMessagingManagement(true);
    try {
      const token = localStorage.getItem('rentmate_token');
      // 1. Get management assigned or any management
      const res = await fetch(`${BACKEND_URL}/api/verification/management/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      const management = await res.json();
      
      if (!res.ok) throw new Error(management.message || 'Management not found');

      // 2. Start conversation
      await fetch(`${BACKEND_URL}/api/messages/conversation/${management._id}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ chatType: 'student_management' })
      });
      navigate('/messages');
    } catch (error) {
        toast.error(error.message || 'Could not start conversation');
    } finally {
        setMessagingManagement(false);
    }
};

  const handleFinalize = async (id) => {
    try {
      await finalizeBooking(id);
      toast.success('Rental confirmed! You can now collect the item.');
      // Refresh list
      const res = await getStudentBookings();
      setBookings(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Finalization failed');
    }
  };

  useEffect(() => {
    getStudentBookings()
      .then(res => setBookings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? bookings : bookings.filter(b => b.bookingStatus === filter);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">My Rentals</h1>
          <p className="text-slate-500 text-sm mt-1">Track all your borrowing requests and their status</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {['All', 'Pending', 'Active', 'Completed', 'Rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
              }`}
            >
              {f} {f !== 'All' && <span className="ml-1 text-xs">({bookings.filter(b => b.bookingStatus === f).length})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card h-28 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No {filter !== 'All' ? filter.toLowerCase() : ''} rentals</h3>
            <p className="text-slate-500 mb-6">Browse available items to request your first rental</p>
            <Link to="/browse" className="btn-primary">Browse Items</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(b => (
              <div key={b._id} className="card p-5">
                <div className="flex items-start gap-4">
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {b.itemId?.image ? (
                      <img src={`${BACKEND_URL}/uploads/${b.itemId.image}`} alt="" className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-slate-800">{b.itemId?.itemName || 'Item'}</h3>
                        <p className="text-xs text-slate-500">{b.itemId?.category} • From: {b.ownerId?.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={b.bookingStatus} />
                        <ManagementBadge status={b.managementVerificationStatus} />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>📅 {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</span>
                      <span className="font-semibold text-slate-700">💰 Total: ₹{b.totalPrice}</span>
                    </div>

                    {b.bookingStatus === 'Pending' && b.managementVerificationStatus === 'Approved' && (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 font-medium">
                          ✨ Management Team approved! You can now officially rent this item.
                        </div>
                        <button
                          onClick={() => handleFinalize(b._id)}
                          className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all animate-pulse"
                        >
                          🚀 Rent Now
                        </button>
                      </div>
                    )}
                    {b.bookingStatus === 'Awaiting Payment' && (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 font-medium">
                          💳 Payment sent! Waiting for owner ({b.ownerId?.name}) to confirm receipt.
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                          <span className="animate-bounce">●</span>
                          <span>Verification complete • Awaiting final activation</span>
                        </div>
                      </div>
                    )}
                    {b.bookingStatus === 'Active' && (
                      <div className="mt-3 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 font-semibold flex items-center gap-2">
                        <span className="text-lg">✅</span> Rental active! You can now use the item.
                      </div>
                    )}
                    {b.bookingStatus === 'Rejected' && (
                      <div className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        ❌ Booking was rejected. You can try requesting other items.
                      </div>
                    )}
                    
                    {/* Message Buttons */}
                    <div className="flex gap-2 mt-4">
                      {b.ownerId && (
                        <button
                          onClick={() => handleMessageOwner(b.ownerId._id)}
                          disabled={messagingOwner}
                          className="flex-1 py-2 btn-secondary text-xs flex items-center justify-center gap-1.5 border-primary-600 text-primary-600 hover:bg-primary-50 transition-all font-semibold"
                        >
                          {messagingOwner ? '...' : `💬 Owner`}
                        </button>
                      )}
                      <button
                        onClick={() => handleMessageManagement(b._id)}
                        disabled={messagingManagement}
                        className="flex-1 py-2 btn-secondary text-xs flex items-center justify-center gap-1.5 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-all font-semibold"
                      >
                        {messagingManagement ? '...' : `👩‍🏫 Management`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRentals;
