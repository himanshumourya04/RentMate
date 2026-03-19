import { useState, useEffect } from 'react';
import { getAdminStats } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalManagement: 0,
    totalItems: 0,
    activeRentals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getAdminStats();
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load system stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-500' },
    { label: 'Students', value: stats.totalStudents, color: 'bg-indigo-500' },
    { label: 'Management', value: stats.totalManagement, color: 'bg-purple-500' },
    { label: 'Total Items', value: stats.totalItems, color: 'bg-emerald-500' },
    { label: 'Active Rentals', value: stats.activeRentals, color: 'bg-amber-500' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">System Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Live metrics from the RentMate platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className={`w-12 h-12 rounded-full ${card.color} text-white flex items-center justify-center mb-4 shadow-sm text-xl`}>
              {card.value}
            </div>
            <p className="text-slate-500 text-sm font-medium">{card.label}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800">System is Operational</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
          Welcome to the developer control panel. Use the sidebar to manage management team authorizations, student accounts, item listings, and branches.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
