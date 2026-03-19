import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyListings, deleteItem, updateItem } from '../services/api';
import toast from 'react-hot-toast';

import { BACKEND_URL } from '../config';
const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Tools', 'Sports', 'Other'];

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchListings = () => {
    setLoading(true);
    getMyListings()
      .then(res => setListings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchListings(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await deleteItem(id);
      toast.success('Item deleted');
      // fetch();

      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const formData = new FormData();
      formData.append('availability', String(!item.availability));
      await updateItem(item._id, formData);
      toast.success(`Marked as ${!item.availability ? 'Available' : 'Unavailable'}`);
      // fetch();

      fetchListings();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      itemName: item.itemName,
      description: item.description,
      category: item.category,
      pricePerDay: item.pricePerDay,
      condition: item.condition,
    });
    setImageFile(null);
    setPreviewImage(item.image ? `${BACKEND_URL}/uploads/${item.image}` : null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setImageFile(null);
    setPreviewImage(null);
  };

  const handleEditChange = (e) => setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitEdit = async (e, id) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => formData.append(key, editForm[key]));
      if (imageFile) formData.append('image', imageFile);

      await updateItem(id, formData);
      toast.success('Listing updated successfully!');
      cancelEdit();
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">My Listings</h1>
            <p className="text-slate-500 text-sm mt-1">Items you've listed for rent</p>
          </div>
          <Link to="/add-item" className="btn-primary text-sm">+ List New Item</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <div key={i} className="card animate-pulse"><div className="h-40 bg-slate-200" /><div className="p-4 space-y-2"><div className="h-4 bg-slate-200 rounded w-3/4" /><div className="h-3 bg-slate-200 rounded w-1/2" /></div></div>)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No listings yet</h3>
            <p className="text-slate-500 mb-6">Start earning by listing your items for rent!</p>
            <Link to="/add-item" className="btn-primary">List Your First Item</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(item => (
              <div key={item._id} className="card overflow-hidden">
                {editingId === item._id ? (
                  // Edit Mode
                  <form onSubmit={(e) => submitEdit(e, item._id)} className="p-4 space-y-3">
                    <div className="relative h-32 bg-slate-100 rounded-lg overflow-hidden group mb-3">
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                      <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xl">📷</span>
                        <span className="text-xs font-semibold mt-1">Change Image</span>
                        <input type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" />
                      </label>
                    </div>

                    <input type="text" name="itemName" value={editForm.itemName} onChange={handleEditChange} required className="input-field py-1.5 text-sm" placeholder="Item Name" />

                    <div className="grid grid-cols-2 gap-2">
                      <select name="category" value={editForm.category} onChange={handleEditChange} className="input-field py-1.5 text-sm">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="number" name="pricePerDay" value={editForm.pricePerDay} onChange={handleEditChange} required min="0" className="input-field py-1.5 text-sm" placeholder="₹/day" />
                    </div>

                    <textarea name="description" value={editForm.description} onChange={handleEditChange} required className="input-field py-1.5 text-sm h-20 resize-none" placeholder="Description..." />

                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={cancelEdit} className="flex-1 btn-secondary text-xs py-2">Cancel</button>
                      <button type="submit" className="flex-1 btn-primary text-xs py-2">Save</button>
                    </div>
                  </form>
                ) : (
                  // View Mode
                  <>
                    <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200">
                      {item.image ? (
                        <img src={`${BACKEND_URL}/uploads/${item.image}`} alt={item.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`badge ${item.availability ? 'badge-active' : 'badge-rejected'}`}>
                          {item.availability ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-800 mb-1 truncate">{item.itemName}</h3>
                      <p className="text-xs text-slate-500 mb-2 truncate">{item.category} • {item.description}</p>
                      <p className="text-lg font-bold text-primary-600 mb-3">₹{item.pricePerDay}<span className="text-xs font-normal text-slate-500">/day</span></p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`w-full text-xs py-2 rounded-lg font-medium transition-all shadow-sm ${item.availability ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 ring-1 ring-amber-200 ring-inset' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 ring-1 ring-emerald-200 ring-inset'}`}
                        >
                          {item.availability ? 'Pause Listing (Make Unavailable)' : 'Resume Listing (Make Available)'}
                        </button>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(item)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs py-2 rounded-lg font-medium transition-colors">Edit Details</button>
                          <button onClick={() => handleDelete(item._id)} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs py-2 rounded-lg font-medium transition-colors">Delete</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListings;
