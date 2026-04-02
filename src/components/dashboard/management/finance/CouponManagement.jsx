import React, { useState, useEffect, useCallback } from 'react';
import {
  MdOutlineConfirmationNumber,
  MdOutlineSearch,
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
  MdOutlineAddCircleOutline,
  MdOutlineDelete,
  MdOutlineRefresh,
  MdOutlineClose,
  MdOutlineCheckCircle,
  MdOutlineCancel,
  MdOutlineAccessTime
} from 'react-icons/md';
import StatsCard from '../../StatsCard';
import { useNotification } from '../../../ui/NotificationProvider';
import {
  getAdminCoupons,
  getCouponStats,
  adminCreateCoupon,
  adminDeleteCoupon
} from '../../../../services/adminService';

const CouponManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const notify = useNotification();

  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    usedCoupons: 0,
    expiredCoupons: 0,
    totalDiscountUsed: 0
  });
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Form state for create modal
  const [formData, setFormData] = useState({
    discountValue: '',
    discountType: 'PERCENTAGE',
    currency: 'NGN',
    validityDays: '90',
    code: '',
    userId: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCoupons(1);
  }, [activeFilter]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCoupons(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const fetchStats = async () => {
    try {
      const res = await getCouponStats();
      if (res.success && res.body) {
        setStats(res.body);
      }
    } catch (err) {
      console.error('Failed to fetch coupon stats:', err);
    }
  };

  const fetchCoupons = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAdminCoupons(page, 20, searchTerm, activeFilter);
      if (res.success && res.body) {
        setCoupons(res.body.coupons || []);
        setPagination(res.body.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeFilter]);

  const handleCreate = async () => {
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      notify.error('Validation', 'Discount value must be greater than 0');
      return;
    }
    if (formData.discountType === 'PERCENTAGE' && Number(formData.discountValue) > 100) {
      notify.error('Validation', 'Percentage discount cannot exceed 100');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        discountValue: Number(formData.discountValue),
        discountType: formData.discountType,
        currency: formData.currency,
        validityDays: Number(formData.validityDays) || 90,
      };
      if (formData.code.trim()) payload.code = formData.code.trim();
      if (formData.userId.trim()) payload.userId = formData.userId.trim();

      const res = await adminCreateCoupon(payload);
      if (res.success) {
        notify.success('Coupon Created', `Coupon ${res.body?.code || ''} created successfully`);
        setShowCreateModal(false);
        setFormData({ discountValue: '', discountType: 'PERCENTAGE', currency: 'NGN', validityDays: '90', code: '', userId: '' });
        fetchStats();
        fetchCoupons(1);
      } else {
        notify.error('Error', res.message || 'Failed to create coupon');
      }
    } catch (err) {
      notify.error('Error', err.message || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (couponId) => {
    try {
      const res = await adminDeleteCoupon(couponId);
      if (res.success) {
        notify.success('Deleted', 'Coupon deleted successfully');
        setShowDeleteConfirm(null);
        fetchStats();
        fetchCoupons(pagination.page);
      } else {
        notify.error('Error', res.message || 'Failed to delete coupon');
      }
    } catch (err) {
      notify.error('Error', err.message || 'Failed to delete coupon');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getCouponStatus = (coupon) => {
    if (coupon.isUsed) return 'used';
    if (coupon.validity && new Date(coupon.validity) < new Date()) return 'expired';
    return 'active';
  };

  const statusBadge = (status) => {
    const styles = {
      active: 'bg-green-50 text-green-700 border-green-200',
      used: 'bg-blue-50 text-blue-700 border-blue-200',
      expired: 'bg-red-50 text-red-700 border-red-200'
    };
    const icons = {
      active: <MdOutlineCheckCircle className="w-3.5 h-3.5" />,
      used: <MdOutlineConfirmationNumber className="w-3.5 h-3.5" />,
      expired: <MdOutlineAccessTime className="w-3.5 h-3.5" />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filters = [
    { key: 'all', label: 'All Coupons' },
    { key: 'active', label: 'Active' },
    { key: 'used', label: 'Used' },
    { key: 'expired', label: 'Expired' }
  ];

  const statsCards = [
    {
      label: 'Total Coupons',
      value: stats.totalCoupons,
      growth: '',
      description: 'all time',
      icon: <MdOutlineConfirmationNumber />,
      bgColor: 'indigo',
      iconColor: 'indigo'
    },
    {
      label: 'Active Coupons',
      value: stats.activeCoupons,
      growth: '',
      description: 'available to use',
      icon: <MdOutlineCheckCircle />,
      bgColor: 'green',
      iconColor: 'green'
    },
    {
      label: 'Used Coupons',
      value: stats.usedCoupons,
      growth: '',
      description: 'redeemed',
      icon: <MdOutlineConfirmationNumber />,
      bgColor: 'blue',
      iconColor: 'blue'
    },
    {
      label: 'Expired Coupons',
      value: stats.expiredCoupons,
      growth: '',
      description: 'no longer valid',
      icon: <MdOutlineCancel />,
      bgColor: 'red',
      iconColor: 'red'
    }
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-aeonik">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl border border-slate-100 shadow-sm w-full md:w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeFilter === f.key
                ? 'bg-indigo-900 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Search & Actions Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by coupon code or owner name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => { fetchStats(); fetchCoupons(); }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-100 transition-all cursor-pointer"
            >
              <MdOutlineRefresh className="w-5 h-5" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-900 text-white rounded-lg text-sm font-bold hover:bg-indigo-800 transition-all cursor-pointer"
            >
              <MdOutlineAddCircleOutline className="w-5 h-5" />
              Create Coupon
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-400 font-medium">Loading...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-medium">No coupons found</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-indigo-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Discount Rule</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Actual Discount Used</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Validity</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {coupons.map((coupon, idx) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr key={coupon._id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-bold text-indigo-700 font-mono">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {coupon.owner ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{coupon.owner.fullName || 'Unknown'}</span>
                            <span className="text-xs text-slate-500">{coupon.owner.emailAddress || ''}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {coupon.owner._id || coupon.owner.id || 'N/A'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">
                          {coupon.discount?.type === 'PERCENTAGE'
                            ? `${coupon.discount?.value}%`
                            : `₦${(coupon.discount?.value || 0).toLocaleString()}`}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          {coupon.discount?.type === 'PERCENTAGE' ? 'off' : coupon.discount?.currency || 'NGN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-indigo-600">
                          {coupon.totalDiscountUsed > 0 
                            ? `₦${(coupon.totalDiscountUsed || 0).toLocaleString()}` 
                            : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {coupon.validity ? formatDate(coupon.validity) : 'No expiry'}
                      </td>
                      <td className="px-6 py-4">{statusBadge(status)}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(coupon.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        {status === 'active' && !coupon.isUsed ? (
                          showDeleteConfirm === coupon._id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleDelete(coupon._id)}
                                className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-all cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(coupon._id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-all cursor-pointer ml-auto"
                            >
                              <MdOutlineDelete className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between font-aeonik">
            <button
              onClick={() => fetchCoupons(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdOutlineKeyboardArrowLeft className="w-5 h-5" />
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <button
              onClick={() => fetchCoupons(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <MdOutlineKeyboardArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Total Discount Used */}
      {stats.totalDiscountUsed > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <MdOutlineConfirmationNumber className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Discount Value Redeemed</p>
              <p className="text-2xl font-bold text-slate-900">₦{stats.totalDiscountUsed.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[20px] w-full max-w-[650px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center relative">
              <h2 className="text-lg font-aeonik font-bold text-center w-full">Create New Coupon</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute right-6 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <MdOutlineClose className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {/* Discount Value */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Discount Value *</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik"
                    placeholder="e.g. 10"
                    min="1"
                  />
                </div>

                {/* Discount Type */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik appearance-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₦)</option>
                  </select>
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik appearance-none"
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                {/* Validity Days */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, validityDays: e.target.value }))}
                    className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik"
                    placeholder="90"
                    min="1"
                  />
                </div>

                {/* Coupon Code (Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Coupon Code <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik font-mono"
                    placeholder="Auto-generated if empty"
                  />
                </div>

                {/* Assign to User (Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Assign to User ID <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik font-mono"
                    placeholder="Leave empty for unassigned"
                  />
                </div>
              </div>

              {/* Preview */}
              {formData.discountValue && (
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <p className="text-sm text-indigo-700 font-medium">
                    This coupon will give{' '}
                    <span className="font-bold">
                      {formData.discountType === 'PERCENTAGE'
                        ? `${formData.discountValue}% off`
                        : `₦${Number(formData.discountValue).toLocaleString()} off`}
                    </span>
                    {formData.validityDays && `, valid for ${formData.validityDays} days`}
                    {formData.code && ` with code ${formData.code}`}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-full text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !formData.discountValue}
                  className="px-6 py-2.5 bg-indigo-900 text-white rounded-full text-sm font-bold hover:bg-indigo-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
