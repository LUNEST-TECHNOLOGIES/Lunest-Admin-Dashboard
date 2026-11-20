import React, { useState } from 'react';
import { MdClose, MdBlock, MdCheckCircle } from 'react-icons/md';

export default function RestrictBookingModal({
  isOpen,
  onClose,
  user,
  onConfirm,
  loading = false
}) {
  const [reason, setReason] = useState('');

  if (!isOpen || !user) return null;

  const isRestricting = user.canBook !== false; // true if currently allowed, so action will restrict

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(user, !isRestricting, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isRestricting ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {isRestricting ? <MdBlock className="w-5 h-5" /> : <MdCheckCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isRestricting ? 'Restrict User Booking' : 'Restore User Booking'}
              </h3>
              <p className="text-xs text-slate-500">
                {user.fullName || user.emailAddress}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isRestricting ? (
            <>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                Restricting this user prevents them from creating new bookings. Their account will remain active for browsing, messaging, and managing previous bookings.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Reason for Restriction
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Unresolved property dispute, fraudulent payment activity, or identity mismatch..."
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition placeholder:text-slate-400"
                  required
                />
              </div>
            </>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
              This will restore full booking privileges for <strong>{user.fullName}</strong>. They will immediately be able to book properties across LUNEST.
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4.5 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isRestricting
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30'
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                <span>{isRestricting ? 'Restrict Bookings' : 'Restore Bookings'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

