import { useState, useEffect } from 'react';
import { getAllRequestsAdmin, deleteRequestAdmin, getReportsAdmin, resolveReportAdmin, togglePinRequest, createAdminBanner, updateBannerAdmin } from '../../services/api';
import toast from 'react-hot-toast';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'reports'
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentBanner, setCurrentBanner] = useState(null);
  const [form, setForm] = useState({ itemName: '', description: '', isPinned: false, type: 'admin', image: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, repRes] = await Promise.all([
        getAllRequestsAdmin(),
        getReportsAdmin()
      ]);
      setRequests(reqRes.data);
      setReports(repRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this banner/request? This will also remove associated reports.')) return;
    try {
      await deleteRequestAdmin(id);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleTogglePin = async (id, currentStatus) => {
    try {
      await togglePinRequest(id);
      toast.success(currentStatus ? 'Unpinned' : 'Pinned to top');
      fetchData();
    } catch (err) {
      toast.error('Failed to pin');
    }
  };

  const handleResolveReport = async (id) => {
    if (!window.confirm('Mark this report as resolved?')) return;
    try {
      await resolveReportAdmin(id);
      toast.success('Report resolved');
      fetchData();
    } catch (err) {
      toast.error('Failed to resolve report');
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setForm({ itemName: '', description: '', isPinned: false, type: 'admin', image: null });
    setIsModalOpen(true);
  };

  const openEditModal = (banner) => {
    setModalMode('edit');
    setCurrentBanner(banner);
    setForm({ 
      itemName: banner.itemName || '', 
      description: banner.description || '', 
      isPinned: banner.isPinned || false, 
      type: banner.type || 'user', 
      image: null 
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('itemName', form.itemName);
    formData.append('description', form.description);
    if (modalMode === 'edit') {
      formData.append('type', form.type);
      formData.append('isPinned', form.isPinned);
    }
    if (form.image) {
      formData.append('image', form.image);
    }

    try {
      if (modalMode === 'add') {
        if (!form.image) return toast.error('Image is required for new banners');
        await createAdminBanner(formData);
        toast.success('Admin Banner Created!');
      } else {
        await updateBannerAdmin(currentBanner._id, formData);
        toast.success('Banner Updated!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading request data...</div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Banner & Query Moderation</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage user item requests, admin announcements, and review abuse reports.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary text-sm flex gap-2 items-center w-full sm:w-auto justify-center">
          + Add Announcement
        </button>
      </div>

      <div className="flex gap-2 sm:gap-4 border-b border-slate-200 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('requests')}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'requests' ? 'border-primary-600 text-primary-700 bg-primary-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
        >
          All Banners & Requests ({requests.length})
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'reports' ? 'border-red-600 text-red-700 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
        >
          User Reports 
          {reports.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {reports.filter(r => r.status === 'pending').length} New
            </span>
          )}
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Banner Details</th>
                  <th className="p-4 font-semibold mt-1">Type</th>
                  <th className="p-4 font-semibold">Status / Expires</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(req => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      {req.type === 'admin' ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-amber-600 text-sm">👑 Admin</span>
                          <span className="text-xs text-slate-500 mt-0.5">System Wide</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-sm">{req.userId?.name || 'Deleted User'}</span>
                          <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full w-fit mt-1">{req.branch || 'N/A'}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        {req.image && (
                          <img src={req.image || '/placeholder-image.png'} onError={(e) => { e.target.src = '/placeholder-image.png'; }} alt="Banner" className="w-12 h-12 object-cover rounded shadow-sm border border-slate-200" />
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1">{req.itemName}</p>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{req.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {req.type === 'admin' ? (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded w-fit">ADMIN</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 w-fit">USER</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {req.status === 'active' 
                          ? <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded w-fit">ACTIVE</span>
                          : <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded w-fit">CLOSED</span>
                        }
                        <span className="text-[11px] text-slate-400">
                          {req.type === 'admin' ? 'No Expiry' : `Exp: ${new Date(req.expiresAt).toLocaleDateString()}`}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right border-l border-slate-50 shrink-0">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleTogglePin(req._id, req.isPinned)}
                          className={`p-2 rounded-lg transition ${req.isPinned ? 'text-white bg-red-500 hover:bg-red-600' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
                          title={req.isPinned ? "Unpin Request" : "Pin Banner to Featured Carousel"}
                        >
                          📌
                        </button>
                        <button 
                          onClick={() => openEditModal(req)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition"
                          title="Edit Banner"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteRequest(req._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                          title="Delete Banner"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <div className="p-12 text-center text-slate-500">No banners found.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                   <th className="p-4 font-semibold uppercase">Reporter</th>
                   <th className="p-4 font-semibold uppercase">Reported Item</th>
                   <th className="p-4 font-semibold uppercase">Reason</th>
                   <th className="p-4 font-semibold uppercase">Status</th>
                   <th className="p-4 font-semibold text-right uppercase">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {reports.map(report => (
                   <tr key={report._id} className="hover:bg-slate-50/50 transition">
                     <td className="p-4">
                       <p className="font-semibold text-slate-800 text-sm">{report.reporterId?.name}</p>
                       <p className="text-xs text-slate-500">{report.reporterId?.email}</p>
                       <p className="text-[10px] text-slate-400 mt-1">{new Date(report.createdAt).toLocaleString()}</p>
                     </td>
                     <td className="p-4 max-w-[200px]">
                       {report.requestId ? (
                         <>
                           <p className="font-bold text-sm text-slate-800 truncate">{report.requestId.itemName}</p>
                           <p className="text-xs text-slate-500 mt-1">Posted by: {report.requestId.userId?.name || 'Admin'}</p>
                         </>
                       ) : (
                         <span className="text-xs italic text-red-500">Item Deleted</span>
                       )}
                     </td>
                     <td className="p-4">
                       <p className="text-sm text-slate-700 bg-red-50 p-2 rounded border border-red-100">{report.reason}</p>
                     </td>
                     <td className="p-4">
                       {report.status === 'pending' 
                         ? <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">PENDING</span>
                         : <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">RESOLVED</span>
                       }
                     </td>
                     <td className="p-4 text-right space-x-2">
                       {report.status === 'pending' && (
                         <button 
                           onClick={() => handleResolveReport(report._id)}
                           className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition"
                         >
                           Resolve
                         </button>
                       )}
                       {report.requestId && (
                         <button 
                           onClick={() => handleDeleteRequest(report.requestId._id)}
                           className="text-xs font-bold bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 border border-slate-200 px-3 py-1.5 rounded-lg transition"
                           title="Delete the offending request"
                         >
                           Delete Item
                         </button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {reports.length === 0 && (
               <div className="p-12 text-center text-slate-500">No reports found. Good job community! ✨</div>
             )}
           </div>
        </div>
      )}

      {/* Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">
                {modalMode === 'add' ? 'Create Announcement Banner' : 'Edit Banner'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition"
              >✕</button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Banner Title / Item Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={form.itemName}
                  onChange={(e) => setForm({...form, itemName: e.target.value})}
                  placeholder="E.g., Mid-Term Break Equipment Rules"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows="3"
                  className="input-field"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Add details about the announcement..."
                ></textarea>
              </div>

              {modalMode === 'edit' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Banner Type</label>
                    <select
                      className="input-field"
                      value={form.type}
                      onChange={(e) => setForm({...form, type: e.target.value})}
                    >
                      <option value="user">User Request</option>
                      <option value="admin">Admin Announcement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pinned?</label>
                    <select
                      className="input-field"
                      value={form.isPinned}
                      onChange={(e) => setForm({...form, isPinned: e.target.value === 'true'})}
                    >
                      <option value="false">Normal</option>
                      <option value="true">Pinned</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Banner Image {modalMode === 'edit' && <span className="text-slate-400 font-normal">(Leave empty to keep existing)</span>}
                </label>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={(e) => setForm({...form, image: e.target.files[0]})}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100 transition-colors"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
