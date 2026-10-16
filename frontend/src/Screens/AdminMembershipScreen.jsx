import { useState } from 'react';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaSearch, FaEdit, FaSave, FaTimes, FaGem, FaStore, FaUsers, FaDollarSign, FaBan, FaRedo } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetAllMembershipsQuery, useAdminUpdateMembershipMutation } from '../slices/eliteApiSlice';
import { useGetAllVendorSubscriptionsQuery } from '../slices/vendorSubscriptionApiSlice';

const statusColors = {
  active: 'text-green-500 bg-green-50 border-green-200',
  canceled: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  expired: 'text-red-500 bg-red-50 border-red-200',
  past_due: 'text-orange-500 bg-orange-50 border-orange-200',
};

const AdminMembershipScreen = () => {
  const [activeTab, setActiveTab] = useState('elite');
  const [eliteFilters, setEliteFilters] = useState({ status: '', search: '', page: 1 });
  const [vendorFilters, setVendorFilters] = useState({ status: '', search: '', page: 1 });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: eliteData, isLoading: eliteLoading, isError: eliteError } = useGetAllMembershipsQuery(eliteFilters);
  const { data: vendorData, isLoading: vendorLoading, isError: vendorError } = useGetAllVendorSubscriptionsQuery(vendorFilters);
  const [adminUpdateMembership, { isLoading: updating }] = useAdminUpdateMembershipMutation();

  const eliteMemberships = eliteData?.memberships || [];
  const vendorSubscriptions = vendorData?.subscriptions || [];
  const eliteTotal = eliteData?.total || 0;
  const vendorTotal = vendorData?.total || 0;

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      plan: item.plan,
      status: item.status,
      autoRenew: item.autoRenew,
      price: item.price,
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split('T')[0] : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (id) => {
    try {
      await adminUpdateMembership({ id, ...editForm }).unwrap();
      toast.success('Membership updated successfully');
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update membership');
    }
  };

  const renderTable = (items, type) => (
    <div className="overflow-x-auto">
      {items.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <FaGem className="mx-auto mb-3 text-3xl text-zinc-300" />
          <p className="font-bold">No memberships found</p>
          <p className="text-sm mt-1">Try changing the filters.</p>
        </div>
      ) : (
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="py-3 px-4 text-zinc-600 font-bold text-xs uppercase tracking-widest">User</th>
              <th className="py-3 px-4 text-zinc-600 font-bold text-xs uppercase tracking-widest">Plan</th>
              <th className="py-3 px-4 text-zinc-600 font-bold text-xs uppercase tracking-widest">Price</th>
              <th className="py-3 px-4 text-zinc-600 font-bold text-xs uppercase tracking-widest">Status</th>
              <th className="py-3 px-4 text-zinc-600 font-bold text-xs uppercase tracking-widest">Expires</th>
              <th className="py-3 px-4 text-zinc-600 font-bold text-xs uppercase tracking-widest">Auto Renew</th>
              <th className="py-3 px-4 text-zinc-600 font-bold text-xs uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                {editingId === item._id ? (
                  <>
                    <td className="py-3 px-4">
                      <p className="font-bold text-zinc-900">{item.user?.name || 'N/A'}</p>
                      <p className="text-xs text-zinc-500">{item.user?.email || ''}</p>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={editForm.plan}
                        onChange={(e) => handleEditChange('plan', e.target.value)}
                        className="border border-zinc-300 rounded px-2 py-1 text-xs w-full"
                      >
                        {type === 'elite'
                          ? ['free', 'monthly', 'yearly'].map(p => <option key={p} value={p}>{p}</option>)
                          : ['free', 'professional', 'enterprise'].map(p => <option key={p} value={p}>{p}</option>)
                        }
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => handleEditChange('price', Number(e.target.value))}
                        className="border border-zinc-300 rounded px-2 py-1 text-xs w-20"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={editForm.status}
                        onChange={(e) => handleEditChange('status', e.target.value)}
                        className="border border-zinc-300 rounded px-2 py-1 text-xs w-full"
                      >
                        {['active', 'canceled', 'expired', 'past_due'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="date"
                        value={editForm.expiresAt}
                        onChange={(e) => handleEditChange('expiresAt', e.target.value)}
                        className="border border-zinc-300 rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={editForm.autoRenew}
                        onChange={(e) => handleEditChange('autoRenew', e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(item._id)}
                          disabled={updating}
                          className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors bg-transparent border-none cursor-pointer"
                          title="Save"
                        >
                          {updating ? <FaSpinner className="animate-spin" /> : <FaSave size={14} />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors bg-transparent border-none cursor-pointer"
                          title="Cancel"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-4">
                      <p className="font-bold text-zinc-900">{item.user?.name || 'N/A'}</p>
                      <p className="text-xs text-zinc-500">{item.user?.email || ''}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border capitalize ${
                        item.plan === 'free' ? 'text-zinc-600 bg-zinc-50 border-zinc-200' :
                        'text-orange-700 bg-orange-50 border-orange-200'
                      }`}>
                        <FaGem size={10} />
                        {item.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-900 font-mono text-xs">${(item.price || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusColors[item.status] || 'text-zinc-600 bg-zinc-50 border-zinc-200'}`}>
                        {item.status === 'active' ? <FaCheckCircle size={10} /> : item.status === 'canceled' ? <FaBan size={10} /> : item.status === 'expired' ? <FaTimesCircle size={10} /> : null}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-500">
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {item.autoRenew ? (
                        <span className="text-green-600 text-xs font-bold"><FaCheckCircle className="inline mr-1" size={10} />On</span>
                      ) : (
                        <span className="text-zinc-400 text-xs"><FaTimesCircle className="inline mr-1" size={10} />Off</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-orange-600 hover:bg-orange-50 p-1.5 rounded transition-colors bg-transparent border-none cursor-pointer"
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-amazon">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Membership <span className="text-orange-600">Management</span>
          </h1>
          <p className="text-zinc-500 mt-1">Manage all user Elite memberships and vendor subscriptions.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FaGem className="text-orange-500" size={14} />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Elite Active</span>
            </div>
            <p className="text-2xl font-black text-zinc-900">{eliteData ? eliteMemberships.filter(m => m.status === 'active').length : '...'}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FaStore className="text-blue-500" size={14} />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Vendor Active</span>
            </div>
            <p className="text-2xl font-black text-zinc-900">{vendorData ? vendorSubscriptions.filter(m => m.status === 'active').length : '...'}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FaDollarSign className="text-green-500" size={14} />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Est. Monthly Rev</span>
            </div>
            <p className="text-2xl font-black text-zinc-900">
              ${eliteData && vendorData
                ? (eliteMemberships.filter(m => m.status === 'active').reduce((s, m) => s + (m.price || 0), 0) +
                   vendorSubscriptions.filter(m => m.status === 'active').reduce((s, m) => s + (m.price || 0), 0)).toFixed(0)
                : '...'}
            </p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FaUsers className="text-purple-500" size={14} />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Members</span>
            </div>
            <p className="text-2xl font-black text-zinc-900">{eliteData ? eliteTotal + vendorTotal : '...'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 mb-6">
          <button
            onClick={() => setActiveTab('elite')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors bg-transparent cursor-pointer ${
              activeTab === 'elite' ? 'border-orange-600 text-orange-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <FaGem size={14} />
            Elite Memberships
            {eliteData && <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{eliteTotal}</span>}
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors bg-transparent cursor-pointer ${
              activeTab === 'vendor' ? 'border-orange-600 text-orange-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <FaStore size={14} />
            Vendor Subscriptions
            {vendorData && <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{vendorTotal}</span>}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'elite' ? 'members' : 'vendors'} by name or email...`}
                value={activeTab === 'elite' ? eliteFilters.search : vendorFilters.search}
                onChange={(e) => {
                  if (activeTab === 'elite') setEliteFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
                  else setVendorFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
                }}
                className="w-full border border-zinc-300 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <select
              value={activeTab === 'elite' ? eliteFilters.status : vendorFilters.status}
              onChange={(e) => {
                if (activeTab === 'elite') setEliteFilters(prev => ({ ...prev, status: e.target.value, page: 1 }));
                else setVendorFilters(prev => ({ ...prev, status: e.target.value, page: 1 }));
              }}
              className="border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="expired">Expired</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {activeTab === 'elite' ? (
            eliteLoading ? (
              <div className="text-center py-12"><FaSpinner className="animate-spin inline text-orange-600" size={28} /></div>
            ) : eliteError ? (
              <div className="text-center py-12 text-red-500 font-bold">Failed to load elite memberships.</div>
            ) : (
              renderTable(eliteMemberships, 'elite')
            )
          ) : (
            vendorLoading ? (
              <div className="text-center py-12"><FaSpinner className="animate-spin inline text-orange-600" size={28} /></div>
            ) : vendorError ? (
              <div className="text-center py-12 text-red-500 font-bold">Failed to load vendor subscriptions.</div>
            ) : (
              renderTable(vendorSubscriptions, 'vendor')
            )
          )}
        </div>

        {/* Pagination */}
        {(activeTab === 'elite' ? eliteData : vendorData) && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-zinc-500">
              Showing {(activeTab === 'elite' ? eliteData : vendorData)?.page || 1} of {(activeTab === 'elite' ? eliteData : vendorData)?.pages || 1} pages
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const p = (activeTab === 'elite' ? eliteData : vendorData)?.page || 1;
                  if (p > 1) {
                    if (activeTab === 'elite') setEliteFilters(prev => ({ ...prev, page: p - 1 }));
                    else setVendorFilters(prev => ({ ...prev, page: p - 1 }));
                  }
                }}
                disabled={(activeTab === 'elite' ? eliteData : vendorData)?.page <= 1}
                className="px-4 py-2 text-sm font-bold rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const p = (activeTab === 'elite' ? eliteData : vendorData)?.page || 1;
                  const pages = (activeTab === 'elite' ? eliteData : vendorData)?.pages || 1;
                  if (p < pages) {
                    if (activeTab === 'elite') setEliteFilters(prev => ({ ...prev, page: p + 1 }));
                    else setVendorFilters(prev => ({ ...prev, page: p + 1 }));
                  }
                }}
                disabled={(activeTab === 'elite' ? eliteData : vendorData)?.page >= (activeTab === 'elite' ? eliteData : vendorData)?.pages}
                className="px-4 py-2 text-sm font-bold rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMembershipScreen;
