import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitFeedback } from '../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FEEDBACK_TYPES = ['Bug Report', 'Feature Request', 'General Feedback', 'Complaint'];

const SubmitFeedback = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [type, setType] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Screenshot must be under 5MB');
    }
    setScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please provide a star rating');
    if (!message.trim()) return toast.error('Please enter your feedback message');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('feedbackType', type);
      formData.append('message', message.trim());
      if (screenshot) formData.append('screenshot', screenshot);

      await submitFeedback(formData);
      toast.success('Thank you for your feedback! 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <p className="text-slate-500">Please log in to submit feedback.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4 flex items-start justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Help Us Improve</h1>
          <p className="text-slate-500 mt-2">Your feedback shapes the future of RentMate.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-indigo-50 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                <div className="px-4 py-3 bg-slate-50 rounded-xl text-slate-500 border border-slate-200 cursor-not-allowed select-none">
                  {user.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="px-4 py-3 bg-slate-50 rounded-xl text-slate-500 border border-slate-200 cursor-not-allowed select-none">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">How would you rate your experience? *</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <svg
                      className={`w-10 h-10 transition-colors duration-200 ${(hoverRating || rating) >= star ? 'text-amber-400' : 'text-slate-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all"
              >
                {FEEDBACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">Detailed Message *</label>
                <span className="text-xs text-slate-400">{message.length}/2000</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all min-h-[120px] resize-y"
                placeholder="Tell us what you loved, what broke, or what you'd like to see next..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Attach a Screenshot (Optional)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors inline-block">
                  <span>📎 Choose File</span>
                  <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleImageChange} />
                </label>
                {screenshot && <span className="text-xs font-semibold text-indigo-600 max-w-[150px] truncate">{screenshot.name}</span>}
              </div>
              {preview && (
                <div className="mt-4 relative group">
                  <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => { setScreenshot(null); setPreview(null); }}
                    className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-lg shadow-sm hover:bg-red-50 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loading ? 'Submitting...' : '🚀 Submit Feedback'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitFeedback;
