import React from 'react';
import { MdClose, MdEmail, MdPhone, MdPerson, MdOutlineBadge } from 'react-icons/md';
import { resolveImageUrl } from '../../../../utils/imageUtils';

const ViewUserModal = ({ isOpen, onClose, user, onSendKycReminder, sendingKycId }) => {
  if (!isOpen || !user) return null;

  const rawKyc = (user.kycStatus || '').toUpperCase();
  const isVerified = rawKyc === 'VERIFIED' || rawKyc === 'APPROVED' || user.verified === true;

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

  // Mask NIN / Government ID for security
  const maskNIN = (nin) => {
    if (!nin) return 'Not Provided';
    const str = nin.toString().trim();
    if (str.length <= 4) return str;
    const first = str.substring(0, 3);
    const last = str.slice(-3);
    return `${first}****${last}`;
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
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
      case 'IN_PROGRESS':
      case 'SUBMITTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED':
      case 'FAILED':
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
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop';
                    }}
                />
              ) : (
                <MdPerson className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(user.status)}`}>
                  {user.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">User Identification (ID): {user.walletId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Role Type</span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getRoleStyle(user.role)}`}>
                {user.role}
              </span>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Wallet Liquidity</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(user.walletBalance)}</span>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/80 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Host Earnings</span>
              <span className="text-sm font-bold text-emerald-600">{formatCurrency(user.hostEarnings)}</span>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Primary Contacts & Identity</h4>
            <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <MdEmail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs font-medium select-all">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MdPhone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs font-medium">{user.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MdOutlineBadge className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs font-medium">NIN / National ID: <strong className="text-slate-900 font-mono">{maskNIN(user.nin)}</strong></span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Account & Compliance Overview</h4>
            <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 space-y-4">
              {/* Number of Bookings */}
              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-sm font-medium">Total Lifetime Bookings</span>
                <span className="text-slate-900 font-bold">{user.bookings || 0}</span>
              </div>

              {/* KYC Status */}
              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-sm font-medium">Identification (KYC)</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getKycStyle(user.kycStatus)}`}>
                    {user.kycStatus || 'UNVERIFIED'}
                  </span>
                  {!isVerified && onSendKycReminder && (
                    <button
                      onClick={() => onSendKycReminder(user)}
                      disabled={sendingKycId === user.id}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {sendingKycId === user.id ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Send KYC Email</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Host Application Status */}
              {user.hostApplicationStatus && user.hostApplicationStatus !== 'NONE' && (
                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
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
              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-sm font-medium">Last Known Engagement</span>
                <span className="text-slate-900 text-xs font-bold">{user.lastActivity || 'N/A'}</span>
              </div>

              {/* Member Since */}
              <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
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
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div>
            {!isVerified && onSendKycReminder && (
              <button
                onClick={() => onSendKycReminder(user)}
                disabled={sendingKycId === user.id}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-200 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {sendingKycId === user.id ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Sending Reminder...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Prompt KYC Verification</span>
                  </>
                )}
              </button>
            )}
          </div>
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
