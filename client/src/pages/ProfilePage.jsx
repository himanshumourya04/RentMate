import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import toast from 'react-hot-toast';

import { BACKEND_URL } from '../config';
const BRANCHES = ['CSE', 'Mechanical', 'Electrical', 'Civil', 'IT'];

const MANAGEMENT_READONLY_FIELDS = [
  { key: 'name', label: 'Full Name', icon: '👤' },
  { key: 'email', label: 'Email Address', icon: '📧' },
  { key: 'branch', label: 'Branch / Department', icon: '🏫' },
  { key: 'phone', label: 'Phone Number', icon: '📞' },
  { key: 'managementId', label: 'Management ID', icon: '🪪' },
];

const ProfilePage = () => {
  const { user, login } = useAuth();
  const isManagement = user?.role === 'management';
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    branch: user?.branch || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(
    user?.profileImage ? `${BACKEND_URL}/uploads/${user.profileImage}` : null
  );

  const fileInputRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      if (!isManagement) {
        formData.append('name', form.name);
        formData.append('phone', form.phone);
        formData.append('branch', form.branch);
      }
      if (imageFile) formData.append('profileImage', imageFile);

      const { data } = await updateProfile(formData);
      const currentToken = localStorage.getItem('rentmate_token');
      login(data, currentToken);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">My Profile</h1>
            <p className="text-slate-500 text-sm mt-1">
              {isManagement
                ? 'Management Team profile — core details managed by Admin'
                : 'Manage your account details and settings'}
            </p>
          </div>
          {!isManagement && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Management lock notice */}
        {isManagement && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <strong>Admin-Controlled Profile</strong>
              <p className="text-amber-700 mt-0.5 text-xs">Your name, email, branch, phone, and Management ID can only be changed by the Admin. You may update your profile photo below.</p>
            </div>
          </div>
        )}

        <div className="card p-8">
          <form onSubmit={handleSubmit}>

            {/* Header / Avatar */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-100 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 shadow-md border-4 border-white flex items-center justify-center">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl font-bold">{user.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                {/* Management can always update profile image */}
                {(isEditing || isManagement) && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <span className="text-white text-sm font-medium">Change</span>
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                <p className="text-slate-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <span className="badge bg-primary-100 text-primary-700 capitalize">{user.role === 'management' ? 'Management' : user.role}</span>
                  {user.branch && <span className="badge bg-slate-100 text-slate-700">🏫 {user.branch}</span>}
                  {isManagement && user.managementId && (
                    <span className="badge bg-emerald-100 text-emerald-700">🪪 {user.managementId}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Management read-only fields */}
            {isManagement && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                {MANAGEMENT_READONLY_FIELDS.map(({ key, label, icon }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">
                      {icon} {label} <span className="text-xs text-slate-400 font-normal">(Admin controlled)</span>
                    </label>
                    <div className="px-4 py-2.5 bg-slate-100 rounded-xl text-slate-600 cursor-not-allowed select-none border border-slate-200">
                      {user[key] || <span className="text-slate-400 italic">Not set</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Student editable fields */}
            {!isManagement && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  {isEditing ? (
                    <input type="text" name="name" value={form.name} onChange={handleChange} required className="input-field" />
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-700 font-medium">{user.name}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address <span className="text-xs text-slate-400 font-normal ml-1">(Cannot be changed)</span>
                  </label>
                  <div className="px-4 py-2.5 bg-slate-100 rounded-xl text-slate-500 cursor-not-allowed select-none">
                    {user.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                  {isEditing ? (
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="input-field" />
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-700 font-medium">{user.phone || <span className="text-slate-400 italic">Not set</span>}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch</label>
                  {isEditing ? (
                    <select name="branch" value={form.branch} onChange={handleChange} required className="input-field">
                      <option value="">Select Branch</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-700 font-medium">{user.branch || <span className="text-slate-400 italic">Not set</span>}</div>
                  )}
                </div>
              </div>
            )}

            {/* Display Verification Documents (Read-Only) */}
            {!isManagement && (user.selfieImage || user.collegeIdImage) && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Verification Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {user.selfieImage && (
                    <div>
                      <span className="block text-sm font-medium text-slate-700 mb-2">Selfie Image</span>
                      <img src={`${BACKEND_URL}/uploads/${user.selfieImage}`} alt="Selfie" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                    </div>
                  )}
                  {user.collegeIdImage && (
                    <div>
                      <span className="block text-sm font-medium text-slate-700 mb-2">College ID</span>
                      <img src={`${BACKEND_URL}/uploads/${user.collegeIdImage}`} alt="College ID" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Management — profile image upload button */}
            {isManagement && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {imageFile ? 'Change Selected Photo' : 'Select Profile Photo'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !imageFile}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {loading ? 'Saving...' : 'Upload & Save'}
                  </button>
                </div>
                {imageFile && (
                  <p className="text-xs text-emerald-600 font-medium mt-3 text-center sm:text-left">
                    ✓ Photo selected. Click "Upload & Save" to apply.
                  </p>
                )}
              </div>
            )}

            {/* Student edit actions */}
            {!isManagement && isEditing && (
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setForm({ name: user.name, phone: user.phone || '', branch: user.branch || '' });
                    setPreviewImage(user.profileImage ? `${BACKEND_URL}/uploads/${user.profileImage}` : null);
                    setImageFile(null);
                  }}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
