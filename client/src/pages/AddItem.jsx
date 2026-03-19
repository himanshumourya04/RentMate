import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addItem } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Books', 'Electronics', 'Gadgets', 'Transport', 'Clothing', 'Project Tools', 'Hostel Essentials', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair', 'Poor'];

const AddItem = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    itemName: '', description: '', category: '', pricePerDay: '', condition: 'Good',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemName || !form.description || !form.category || !form.pricePerDay) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (imageFile) formData.append('image', imageFile);
      await addItem(formData);
      toast.success('Item listed successfully! 🎉');
      navigate('/my-listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">List an Item for Rent</h1>
          <p className="text-slate-500 text-sm mt-1">Share your item with the campus community and earn money</p>
        </div>

        <div className="card p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Item Photo</label>
              <div
                onClick={() => document.getElementById('imageUpload').click()}
                className={`cursor-pointer border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden transition-all ${
                  preview ? 'border-primary-300' : 'border-slate-200 hover:border-primary-300'
                }`}
                style={{ height: '200px' }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-sm text-slate-500">Click to upload item photo</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                )}
              </div>
              <input id="imageUpload" type="file" accept="image/*" onChange={handleImage} className="hidden" />
              {preview && (
                <button type="button" onClick={() => { setPreview(null); setImageFile(null); }} className="text-xs text-red-500 mt-1 hover:underline">Remove photo</button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Item Name *</label>
              <input type="text" name="itemName" value={form.itemName} onChange={handleChange} placeholder="e.g. Engineering Mathematics Textbook" className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the item — edition, specifications, condition details..." rows={3} className="input-field resize-none" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                <select name="category" value={form.category} onChange={handleChange} className="input-field" required>
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Condition</label>
                <select name="condition" value={form.condition} onChange={handleChange} className="input-field">
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Price Per Day (₹) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                <input type="number" name="pricePerDay" value={form.pricePerDay} onChange={handleChange} placeholder="e.g. 25" min="0" step="0.5" className="input-field pl-8" required />
              </div>
              <p className="text-xs text-slate-400 mt-1">Set a fair daily rental rate</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-amber-700">
                ⚠️ By listing this item, you agree to maintain it in the described condition and make it available for approved rental periods.
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                {loading ? 'Listing...' : '🚀 List Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItem;
