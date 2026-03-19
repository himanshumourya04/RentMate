import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItemRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'Mechanical', 'Electrical', 'Civil', 'IT'];

const AddRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    itemName: '',
    description: '',
    branch: user?.branch || '',
    duration: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return toast.error('An image of the requested item is required');
    
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      formData.append('image', image);

      await createItemRequest(formData);
      toast.success('Item request posted to the Query Dashboard! 🎉');
      navigate('/query-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  // Verification check removed as per user request

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-800 font-medium mb-4 flex items-center gap-1 transition">
          ← Back
        </button>
        <h1 className="text-3xl font-extrabold text-slate-800">Post an Item Request</h1>
        <p className="text-slate-500 mt-1">Can't find what you need? Ask the campus community!</p>
      </div>

      <div className="card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
              <input 
                type="text" 
                name="itemName" 
                required 
                value={form.itemName} 
                onChange={handleChange}
                placeholder="e.g. Scientific Calculator Casio fx-991EX"
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <textarea 
                name="description" 
                required 
                value={form.description} 
                onChange={handleChange}
                placeholder="Describe exactly what you're looking for..."
                className="input-field min-h-[120px] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Branch *</label>
              <select 
                name="branch" 
                required 
                value={form.branch} 
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select Target Branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">How long do you need it? *</label>
              <input 
                type="text" 
                name="duration" 
                required 
                value={form.duration} 
                onChange={handleChange}
                placeholder="e.g. 2 days, 1 week, entire semester..."
                className="input-field"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-3">Item Reference Photo *</label>
             <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative overflow-hidden group">
               <input 
                 type="file" 
                 accept="image/*" 
                 onChange={handleImageChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 required
               />
               {preview ? (
                  <img src={preview} alt="Upload preview" className="max-h-64 mx-auto rounded-lg object-contain shadow-sm" />
               ) : (
                  <div className="py-8">
                    <span className="text-4xl text-slate-400 mb-2 block">📷</span>
                    <p className="text-slate-600 font-medium">Click or drag image here</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
               )}
             </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-800">
            <span className="text-xl">ℹ️</span>
            <p>Your request will be visible to all verified students for exactly <strong>7 days</strong>. You are allowed exactly <strong>5 requests per day</strong>. If a user has this item, they will be able to message you directly.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base"
          >
            {loading ? 'Posting Request...' : '✅ Post Request to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRequest;
