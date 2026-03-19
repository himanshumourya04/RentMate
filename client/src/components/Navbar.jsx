import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const token = localStorage.getItem('rentmate_token');
          const { data } = await axios.get(`${BACKEND_URL}/api/chat/unread-count`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUnreadCount(data.count);
        } catch (error) {
          console.error('Failed to fetch unread count:', error);
        }
      };
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 5000);
      window.addEventListener('unread-update', fetchUnreadCount);
      return () => {
        clearInterval(interval);
        window.removeEventListener('unread-update', fetchUnreadCount);
      };
    }
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkCls = 'px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all whitespace-nowrap';

  return (
    <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-2">

          {/* Logo — fixed, never shrinks */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={logo} alt="RentMate Logo" className="w-9 h-9 object-contain" />
            <span className="text-lg font-bold text-slate-800 hidden sm:block">
              Rent<span className="text-primary-600">Mate</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto min-w-0 ml-2">
            <Link to="/" className={navLinkCls}>Home</Link>
            <Link to="/browse" className={navLinkCls}>Browse</Link>

            {user?.role === 'student' && (
              <>
                <Link to="/query-dashboard" className="px-2.5 py-1.5 rounded-lg text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-all whitespace-nowrap">Queries</Link>
                <Link to="/dashboard" className={navLinkCls}>Dashboard</Link>
                <Link to="/add-item" className={navLinkCls}>List Item</Link>
                <Link to="/my-listings" className={navLinkCls}>My Listings</Link>
                <Link to="/my-rentals" className={navLinkCls}>My Rentals</Link>
                <Link to="/feedback" className="px-2.5 py-1.5 rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-all whitespace-nowrap">Feedback</Link>
              </>
            )}

            {user?.role === 'management' && (
              <>
                <Link to="/management-dashboard" className={navLinkCls}>Dashboard</Link>
                <Link to="/verification-requests" className={navLinkCls}>Verifications</Link>
                <Link to="/feedback" className="px-2.5 py-1.5 rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-all whitespace-nowrap">Feedback</Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="px-2.5 py-1.5 rounded-lg text-sm font-bold text-amber-600 hover:bg-amber-50 transition-all whitespace-nowrap">Dashboard</Link>
                <Link to="/admin/management" className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all whitespace-nowrap">Management</Link>
                <Link to="/admin/students" className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all whitespace-nowrap">Students</Link>
                <Link to="/admin/items" className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all whitespace-nowrap">Items</Link>
                <Link to="/admin/requests" className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all whitespace-nowrap">Requests</Link>
                <Link to="/admin/feedback" className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-all whitespace-nowrap">Feedback</Link>
              </>
            )}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 ml-auto">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/messages" className="relative px-2.5 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all">
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className="flex items-center gap-2 px-2.5 py-1.5 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    {user.profileImage ? (
                      <img src={`${BACKEND_URL}/uploads/${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 leading-none">{user.name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-primary-600 capitalize mt-0.5">{user.role === 'management' ? 'Management' : user.role}</p>
                  </div>
                </Link>
                <button onClick={handleLogout} className="btn-secondary text-xs py-1.5 px-3">Logout</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5">Login</Link>
                <Link to="/signup" className="btn-primary text-sm py-1.5">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 ml-auto"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1 shadow-lg max-h-[80vh] overflow-y-auto">
          <Link to="/" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">🏠 Home</Link>
          <Link to="/browse" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">🔍 Browse Items</Link>

          {user && (
            <Link to="/messages" className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              <span>💬 Messages</span>
              {unreadCount > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>}
            </Link>
          )}

          {user?.role === 'student' && (
            <>
              <div className="border-t border-slate-100 pt-1 mt-1">
                <p className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Student</p>
              </div>
              <Link to="/query-dashboard" className="block px-3 py-2 rounded-lg text-sm font-bold text-emerald-700 hover:bg-emerald-50">📋 Query Dashboard</Link>
              <Link to="/dashboard" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">📊 Dashboard</Link>
              <Link to="/add-item" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">➕ List Item</Link>
              <Link to="/my-listings" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">📦 My Listings</Link>
              <Link to="/my-rentals" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">🛒 My Rentals</Link>
              <Link to="/feedback" className="block px-3 py-2 rounded-lg text-sm font-bold text-indigo-700 hover:bg-indigo-50">💡 Submit Feedback</Link>
            </>
          )}

          {user?.role === 'management' && (
            <>
              <div className="border-t border-slate-100 pt-1 mt-1">
                <p className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Management</p>
              </div>
              <Link to="/management-dashboard" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">📊 Dashboard</Link>
              <Link to="/verification-requests" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">✅ Verifications</Link>
              <Link to="/feedback" className="block px-3 py-2 rounded-lg text-sm font-bold text-indigo-700 hover:bg-indigo-50">💡 Submit Feedback</Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="border-t border-slate-100 pt-1 mt-1">
                <p className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Admin Panel</p>
              </div>
              <Link to="/admin/dashboard" className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-700 hover:bg-amber-50">👑 Dashboard</Link>
              <Link to="/admin/management" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-amber-50">👨‍🏫 Management</Link>
              <Link to="/admin/students" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-amber-50">🎓 Students</Link>
              <Link to="/admin/items" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-amber-50">📦 Items</Link>
              <Link to="/admin/requests" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-amber-50">📋 Requests</Link>
              <Link to="/admin/feedback" className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-amber-50">💬 Feedback</Link>
            </>
          )}

          <div className="border-t border-slate-100 pt-2 mt-2">
            {user ? (
              <div className="space-y-1">
                <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.profileImage ? (
                      <img src={`${BACKEND_URL}/uploads/${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role === 'management' ? 'Management' : user.role}</p>
                  </div>
                </Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                  🚪 Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2 px-3 pt-1">
                <Link to="/login" className="flex-1 text-center btn-secondary text-sm py-2">Login</Link>
                <Link to="/signup" className="flex-1 text-center btn-primary text-sm py-2">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
