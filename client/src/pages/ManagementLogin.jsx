import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { managementLoginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ManagementLogin = () => {
  const [form, setForm] = useState({ email: '', password: '', managementId: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.managementId) {
      toast.error('All three fields are required');
      return;
    }
    setLoading(true);
    try {
      const res = await managementLoginUser(form);
      login(res.data, res.data.token);
      toast.success(`Welcome, ${res.data.name}! 👨‍🏫`);
      navigate('/management-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please use Admin provided details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl">👨‍🏫</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Management Team Login</h1>
          <p className="text-slate-500 text-sm mt-1">Use the credentials provided by your administrator</p>
        </div>

        <div className="card p-8 border-t-4 border-emerald-500">
          {/* Info Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 text-xs text-emerald-700">
            <strong>🔒 Secure Management Portal</strong> — All three fields must exactly match your Admin-provided credentials.
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="management@example.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input-field pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>) : (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Management ID *</label>
              <input
                type="text"
                name="managementId"
                value={form.managementId}
                onChange={handleChange}
                placeholder="e.g. FAC-CSE-001"
                className="input-field"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Your Management ID as assigned by the Admin</p>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 text-base rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : '🔐 Management Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-slate-500">
              Not management?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">Student Login</Link>
            </p>
            <p className="text-xs text-slate-400">
              Credentials issue? Contact your Institute Admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementLogin;
