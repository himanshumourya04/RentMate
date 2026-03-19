import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudentBookings, getMyListings, getOwnerBookings, acceptPayment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

import { BACKEND_URL } from '../config';

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'badge-pending', 
    'Awaiting Payment': 'bg-indigo-100 text-indigo-700',
    Active: 'badge-active', 
    Completed: 'badge-completed',
    Rejected: 'badge-rejected', 
    Cancelled: 'badge-rejected',
  };
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>;
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [b, l, ob] = await Promise.all([
        getStudentBookings(), 
        getMyListings(),
        getOwnerBookings()
      ]); 
      setBookings(b.data); 
      setListings(l.data);
      setOwnerBookings(ob.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptPayment = async (id) => {
    setProcessing(true);
    try {
      await acceptPayment(id);
      toast.success('Payment accepted! Rental is now active.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept payment');
    } finally {
      setProcessing(false);
    }
  };

  const pendingIncoming = ownerBookings.filter(b => b.bookingStatus === 'Awaiting Payment').length;
  const pendingOutgoing = bookings.filter(b => b.bookingStatus === 'Pending' || b.bookingStatus === 'Awaiting Payment').length;
  const activeRentals = bookings.filter(b => b.bookingStatus === 'Active').length;
  const totalListings = listings.length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-slate-500 text-sm capitalize">{user?.branch || 'Student'} • {user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending Requests', value: pendingOutgoing, icon: '⏳', color: 'text-amber-600 bg-amber-50' },
            { label: 'Active Rentals', value: activeRentals, icon: '✅', color: 'text-emerald-600 bg-emerald-50' },
            { label: 'My Listings', value: totalListings, icon: '📦', color: 'text-primary-600 bg-primary-50' },
            { label: 'Payments to Confirm', value: pendingIncoming, icon: '💰', color: 'text-indigo-600 bg-indigo-50' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-extrabold text-slate-800">{loading ? '-' : stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link to="/browse" className="card p-5 flex items-center gap-4 hover:border-primary-200 border border-transparent transition-all group">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🔍</div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Browse Items</div>
              <div className="text-xs text-slate-500">Find items to rent</div>
            </div>
          </Link>
          <Link to="/add-item" className="card p-5 flex items-center gap-4 hover:border-primary-200 border border-transparent transition-all group">
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">➕</div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">List New Item</div>
              <div className="text-xs text-slate-500">Start earning today</div>
            </div>
          </Link>
          <Link to="/my-rentals" className="card p-5 flex items-center gap-4 hover:border-primary-200 border border-transparent transition-all group">
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📋</div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">My Rentals</div>
              <div className="text-xs text-slate-500">Track your bookings</div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Borrowing (Student as Borrower) */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span>📋</span> My Borrowing Requests
              </h2>
              <Link to="/my-rentals" className="text-xs text-primary-600 hover:underline">View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-sm">No requests found. <Link to="/browse" className="text-primary-600 underline">Browse items!</Link></p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 3).map(b => (
                  <div key={b._id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden text-lg">
                      {b.itemId?.image ? (
                        <img src={`${BACKEND_URL}/uploads/${b.itemId.image}`} alt="" className="w-full h-full object-cover" />
                      ) : <span>📦</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">{b.itemId?.itemName}</p>
                      <p className="text-[10px] text-slate-500">{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={b.bookingStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Requests (Student as Owner) */}
          <div className="card p-6 border-2 border-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span>💰</span> Incoming Rental Requests
                {pendingIncoming > 0 && <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse font-bold">{pendingIncoming}</span>}
              </h2>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : ownerBookings.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-sm">No incoming requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ownerBookings.filter(b => b.bookingStatus === 'Awaiting Payment' || b.bookingStatus === 'Active').slice(0, 3).map(b => (
                  <div key={b._id} className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${b.bookingStatus === 'Awaiting Payment' ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-100' : 'bg-slate-50 border-transparent'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden text-lg">
                        {b.itemId?.image ? (
                          <img src={`${BACKEND_URL}/uploads/${b.itemId.image}`} alt="" className="w-full h-full object-cover" />
                        ) : <span>📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">{b.itemId?.itemName}</p>
                        <p className="text-xs text-slate-600 border-b border-indigo-100 w-fit pb-0.5 mb-1 flex items-center gap-1">
                           <span className="opacity-50 italic">Borrower:</span> {b.borrowerId?.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-sm font-black text-indigo-700 mb-1">₹{b.totalPrice}</p>
                        <StatusBadge status={b.bookingStatus} />
                      </div>
                    </div>
                    
                    {b.bookingStatus === 'Awaiting Payment' && (
                      <button
                        onClick={() => handleAcceptPayment(b._id)}
                        disabled={processing}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                      >
                        {processing ? 'Processing...' : '✅ Confirm Payment Received'}
                      </button>
                    )}
                  </div>
                ))}
                {ownerBookings.filter(b => b.bookingStatus === 'Awaiting Payment' || b.bookingStatus === 'Active').length === 0 && (
                   <div className="text-center py-8 text-slate-400 italic text-xs">
                     No active or payment-pending requests.
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
