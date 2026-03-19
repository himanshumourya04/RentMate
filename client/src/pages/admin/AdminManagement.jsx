import { useState, useEffect } from 'react';
import {
  getAllManagementUsersAdmin,
  createManagementUserAdmin,
  updateManagementUserAdmin,
  deleteManagementUserAdmin,
} from '../../services/api';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'Mechanical', 'Electrical', 'Civil', 'IT'];

const emptyForm = { name: '', email: '', managementId: '', branch: '', phone: '', password: '' };

const FormFields = ({ form, setForm, isCreate }) => {
  const [showPw, setShowPw] = useState(false);
  return (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
      <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
        required placeholder="e.g. Dr. Priya Sharma" className="input-field" />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
        required placeholder="management@example.com" className="input-field" />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Management ID *</label>
      <input type="text" value={form.managementId} onChange={e => setForm({ ...form, managementId: e.target.value })}
        required placeholder="e.g. MGT-CSE-001" className="input-field" />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Branch *</label>
      <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}
        required className="input-field">
        <option value="">Select Branch</option>
        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
        placeholder="+91 98765 43210" className="input-field" />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Password {isCreate ? '*' : <span className="text-xs font-normal text-slate-400">(leave blank to keep)</span>}
      </label>
      <div className="relative">
        <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          required={isCreate} placeholder="Min. 6 characters" className="input-field pr-10" />
        <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          {showPw ? (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>) : (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
        </button>
      </div>
    </div>
  </div>
  );
};

const AdminModal = ({ title, onSubmit, onClose, isCreate, form, setForm, submitting }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <FormFields form={form} setForm={setForm} isCreate={isCreate} />
        {isCreate && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            🔒 The management team member will log in using <strong>Email + Password + Management ID</strong>. All three must match exactly.
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary min-w-[100px]">
            {submitting ? 'Saving...' : isCreate ? 'Create Account' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const AdminManagement = () => {
  const [managementList, setManagementList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // management object being edited
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchManagement();
  }, []);

  const fetchManagement = async () => {
    setLoading(true);
    try {
      const res = await getAllManagementUsersAdmin();
      setManagementList(res.data);
    } catch {
      toast.error('Failed to load management accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createManagementUserAdmin(form);
      toast.success(`Management Team account created for ${form.name}`);
      setShowCreateModal(false);
      setForm(emptyForm);
      fetchManagement();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create management account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { password, ...updateData } = form; // don't send empty password
      await updateManagementUserAdmin(editTarget._id, updateData);
      toast.success('Management details updated');
      setEditTarget(null);
      setForm(emptyForm);
      fetchManagement();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update management team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete management account for "${name}"?`)) return;
    try {
      await deleteManagementUserAdmin(id);
      toast.success('Management account deleted');
      fetchManagement();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEditModal = (management) => {
    setEditTarget(management);
    setForm({
      name: management.name || '',
      email: management.email || '',
      managementId: management.managementId || '',
      branch: management.branch || '',
      phone: management.phone || '',
      password: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Management Team</h1>
          <p className="text-slate-500 text-sm mt-1">
            Admin creates and manages all management team accounts. Management cannot self-register.
          </p>
        </div>
        <button onClick={() => { setShowCreateModal(true); setForm(emptyForm); }} className="btn-primary">
          + Create Management Account
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 flex gap-3 items-start">
        <span className="text-xl">🔒</span>
        <div>
          <strong>Admin-Controlled Management System</strong>
          <p className="text-emerald-700 text-xs mt-0.5">
            Management accounts can only be created, updated, or deleted by Admin. Management team logs in using email, password, and Management ID — all provided by Admin.
          </p>
        </div>
      </div>

      {/* Management Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Management ID</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Branch</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-slate-400">Loading...</td></tr>
              ) : managementList.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                  No management accounts yet. Use the button above to create one.
                </td></tr>
              ) : (
                managementList.map((management) => (
                  <tr key={management._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          {management.name?.charAt(0)}
                        </div>
                        {management.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{management.managementId || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{management.email}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">{management.branch}</span></td>
                    <td className="px-6 py-4">{management.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(management)}
                        className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition"
                        title="Edit management account"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(management._id, management.name)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                        title="Delete management account"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <AdminModal
          title="➕ Create Management Account"
          onSubmit={handleCreate}
          onClose={() => { setShowCreateModal(false); setForm(emptyForm); }}
          isCreate={true}
          form={form}
          setForm={setForm}
          submitting={submitting}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <AdminModal
          title={`✏️ Edit: ${editTarget.name}`}
          onSubmit={handleUpdate}
          onClose={() => { setEditTarget(null); setForm(emptyForm); }}
          isCreate={false}
          form={form}
          setForm={setForm}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default AdminManagement;
