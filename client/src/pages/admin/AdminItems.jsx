import { useState, useEffect } from 'react';
import { getAllItemsAdmin, deleteItemAdmin } from '../../services/api';
import toast from 'react-hot-toast';

import { BACKEND_URL } from '../../config';

const AdminItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await getAllItemsAdmin();
      setItems(res.data);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    try {
      await deleteItemAdmin(id);
      toast.success('Item deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const filtered = items.filter(item =>
    (item.itemName || item.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Item Management</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} total listings on the platform</p>
        </div>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-56 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Item</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Added</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No items found.</td></tr>
              ) : filtered.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={`${BACKEND_URL}/uploads/${item.image}`} alt={item.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{item.itemName || item.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.ownerId ? (
                      <div>
                        <p className="font-medium text-slate-800">{item.ownerId.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{item.ownerId.email}</p>
                      </div>
                    ) : <span className="text-slate-400 italic text-xs">Account deleted</span>}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary-600">₹{item.pricePerDay}<span className="text-xs text-slate-500 font-normal">/day</span></td>
                  <td className="px-6 py-4 text-slate-500">{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition" title="Delete">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No items found.</p>
        ) : filtered.map((item) => (
          <div key={item._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
              {item.image ? (
                <img src={`${BACKEND_URL}/uploads/${item.image}`} alt={item.itemName} className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{item.itemName || item.title}</p>
              <p className="text-xs text-slate-500 capitalize">{item.category}</p>
              <p className="text-xs font-semibold text-primary-600 mt-1">₹{item.pricePerDay}/day</p>
              {item.ownerId && <p className="text-xs text-slate-400 truncate">{item.ownerId.name}</p>}
            </div>
            <button onClick={() => handleDelete(item._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminItems;
