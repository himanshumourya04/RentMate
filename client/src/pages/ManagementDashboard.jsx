import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllVerifications } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudentCard = ({ student, label, color }) => {
  const navigate = useNavigate();
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</span>
          <p className="font-semibold text-slate-800 mt-0.5">{student?.name || '—'}</p>
          <p className="text-xs text-slate-500">{student?.branch} • {student?.phone || 'No phone'}</p>
        </div>
        {student && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/user/${student._id}`);
            }}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition font-medium text-primary-600 hover:text-primary-700 shadow-sm"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

const ManagementDashboard = () => {
  const { user } = useAuth();
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllVerifications()
      .then((reqRes) => {
        setAllRequests(reqRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending = allRequests.filter(r => r.status === 'Pending').length;
  const approved = allRequests.filter(r => r.status === 'Approved').length;
  const rejected = allRequests.filter(r => r.status === 'Rejected').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">👨‍🏫</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-800">Management Dashboard</h1>
                {user?.branch && (
                  <span className="badge bg-primary-100 text-primary-700 font-bold text-xs px-3 py-1">
                    🏫 {user.branch} Branch
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm">
                Welcome, {user?.name} — Verifying requests for the <strong>{user?.branch || 'your'}</strong> branch
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending Requests', value: pending, icon: '⏳', color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'Approved', value: approved, icon: '✅', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { label: 'Rejected', value: rejected, icon: '❌', color: 'text-red-600 bg-red-50 border-red-200' },
          ].map(stat => (
            <div key={stat.label} className={`card p-5 border ${stat.color.split(' ')[2]}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${stat.color.split(' ').slice(0,2).join(' ')}`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-extrabold text-slate-800">{loading ? '-' : stat.value}</div>
              <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        {/* Tab: Rent Requests */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                Recent Activity — <span className="text-primary-600">{user?.branch} Branch</span>
              </h2>
              <Link to="/verification-requests" className="text-xs text-primary-600 hover:underline font-medium">
                Review pending →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : allRequests.length === 0 ? (
              <div className="card text-center py-12 text-slate-400">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm">No {user?.branch} branch requests yet</p>
              </div>
            ) : (
              allRequests.map(req => {
                const borrower = req.borrowerId;
                const lender = req.itemId?.ownerId || null;
                return (
                  <div key={req._id} className="card p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="font-semibold text-slate-800">{borrower?.name} → {req.itemId?.itemName}</p>
                        <p className="text-xs text-slate-500">
                          <span className="inline-flex items-center bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-semibold mr-1">
                            {borrower?.branch || req.branch}
                          </span>
                          {new Date(req.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`badge ${req.status === 'Pending' ? 'badge-pending' : req.status === 'Approved' ? 'badge-active' : 'badge-rejected'}`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Borrower + Lender details inline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <StudentCard
                        student={borrower}
                        label="🎒 Borrower"
                        color="bg-blue-50 border-blue-200"
                      />
                      <StudentCard
                        student={lender}
                        label="📦 Lender"
                        color="bg-purple-50 border-purple-200"
                      />
                    </div>

                    {req.status === 'Pending' && (
                      <div className="mt-3 text-center">
                        <Link to="/verification-requests" className="text-xs text-primary-600 hover:underline font-medium">
                          Review this request →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

      </div>
    </div>
  );
};

export default ManagementDashboard;
