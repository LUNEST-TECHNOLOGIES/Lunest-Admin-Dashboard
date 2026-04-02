import React from 'react';
import { MdClose, MdEmail, MdPhone, MdPerson, MdAccountBalanceWallet, MdVerified, MdEvent, MdOutlineBadge } from 'react-icons/md';
import { resolveImageUrl } from '../../../../utils/imageUtils';

const ViewUserModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₦0.00';
    const numericAmount = parseFloat(amount.toString().replace(/[₦,]/g, ''));
    return `₦${numericAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Get status badge style
  const getStatusStyle = (status) => {
    return status === 'Active' 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      : 'bg-rose-50 text-rose-700 border-rose-200';
  };

  // Mask NIN for security
  const maskNIN = (nin) => {
    if (!nin) return 'Not Provided';
    const str = nin.toString();
    if (str.length <= 4) return str;
    return '*'.repeat(str.length - 4) + str.slice(-4);
  };

  // Get role badge style
  const getRoleStyle = (role) => {
    switch (role) {
      case 'Host':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Admin':
      case 'Super Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Get KYC status style
  const getKycStyle = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
      <div className="w-full max-w-[650px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
              {user.avatar ? (
                <img 
                    src={resolveImageUrl(user.avatar)} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                />
              ) : (
                <MdPerson className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div>
              <h2 className="text-slate-900 text-xl font-bold">{user.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-slate-500 text-sm font-medium">{user.email}</p>
                {user.verified && <MdVerified className="w-4 h-4 text-indigo-500" title="Verified Account" />}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer border border-slate-100"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Status Badges Row */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(user.status)}`}>
              {user.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleStyle(user.role)}`}>
              {user.role}
            </span>
            {user.subscription && user.subscription !== 'N/A' && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                {user.subscription}
              </span>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* User ID */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:border-indigo-100 group">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                <MdOutlineBadge className="w-4 h-4" />
                <span>Identification ID</span>
              </div>
              <p className="text-slate-900 font-bold text-sm tracking-tight">{user.walletId}</p>
            </div>

            {/* NIN */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:border-indigo-100 group">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                <MdVerified className="w-4 h-4" />
                <span>National ID (NIN)</span>
              </div>
              <p className="text-slate-900 font-bold text-sm tracking-widest">{maskNIN(user.nin)}</p>
            </div>

            {/* Email */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:border-indigo-100 group">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                <MdEmail className="w-4 h-4" />
                <span>Contact Email</span>
              </div>
              <p className="text-slate-900 font-bold text-sm truncate" title={user.email}>{user.email}</p>
            </div>

            {/* Phone */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:border-indigo-100 group">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                <MdPhone className="w-4 h-4" />
                <span>Phone Number</span>
              </div>
              <p className="text-slate-900 font-bold text-sm">{user.phone || 'Not provided'}</p>
            </div>

            {/* Wallet Balance */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:border-indigo-100 group sm:col-span-2">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                <MdAccountBalanceWallet className="w-4 h-4" />
                <span>Wallet Balance</span>
              </div>
              <p className="text-indigo-600 font-black text-sm tabular-nums">{formatCurrency(user.walletBalance)}</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
            <div className="px-4 py-3 bg-slate-50/50">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Account Analytics & Verification</h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Number of Bookings */}
              <div className="flex justify-between items-center bg-white">
                <span className="text-slate-500 text-sm font-medium">Total Lifetime Bookings</span>
                <span className="text-slate-900 font-bold">{user.bookings || 0}</span>
              </div>

              {/* KYC Status */}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-medium">Identification (KYC)</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getKycStyle(user.kycStatus)}`}>
                  {user.kycStatus || 'NONE'}
                </span>
              </div>

              {/* Host Application Status */}
              {user.hostApplicationStatus && user.hostApplicationStatus !== 'NONE' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Host Application Status</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                    user.hostApplicationStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    user.hostApplicationStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {user.hostApplicationStatus}
                  </span>
                </div>
              )}

              {/* Last Activity */}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-medium">Last Known Engagement</span>
                <span className="text-slate-900 text-xs font-bold">{user.lastActivity}</span>
              </div>

              {/* Member Since */}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-medium">Platform Joined Date</span>
                <span className="text-slate-900 text-xs font-bold">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Internal ID */}
          <div className="mt-8 flex items-center justify-between px-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Reference</p>
            <code className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-mono">{user.id}</code>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;
