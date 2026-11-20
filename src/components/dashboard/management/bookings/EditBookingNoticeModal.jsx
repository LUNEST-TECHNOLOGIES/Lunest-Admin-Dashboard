import React, { useState, useEffect } from 'react';
import { MdClose, MdInfoOutline, MdSave } from 'react-icons/md';

export default function EditBookingNoticeModal({
  isOpen,
  onClose,
  initialBookingNotice = '',
  initialWhitelistNotice = '',
  onSave,
  saving = false
}) {
  const [bookingNotice, setBookingNotice] = useState(initialBookingNotice);
  const [whitelistNotice, setWhitelistNotice] = useState(initialWhitelistNotice);

  useEffect(() => {
    setBookingNotice(initialBookingNotice || 'Bookings are temporarily paused for maintenance. Please check back shortly.');
    setWhitelistNotice(initialWhitelistNotice || 'LUNEST bookings are currently in private access mode. Only invited members can place bookings at this time.');
  }, [initialBookingNotice, initialWhitelistNotice, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ bookingNotice, whitelistNotice });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MdInfoOutline className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Configure Guest Booking Notices</h3>
              <p className="text-xs text-slate-500">Messages displayed to guests when bookings are paused or restricted</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              🔴 Global Maintenance Notice (When Paused)
            </label>
            <textarea
              rows={3}
              value={bookingNotice}
              onChange={(e) => setBookingNotice(e.target.value)}
              placeholder="e.g. Bookings are temporarily paused for routine system maintenance..."
              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition placeholder:text-slate-400"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Returned to mobile and web guests if they attempt to book while paused.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              🟡 Whitelist / Private Beta Notice
            </label>
            <textarea
              rows={3}
              value={whitelistNotice}
              onChange={(e) => setWhitelistNotice(e.target.value)}
              placeholder="e.g. LUNEST bookings are currently in private access mode..."
              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition placeholder:text-slate-400"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Shown to non-whitelisted users when the platform is in Whitelist-Only mode.</p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <MdSave className="w-4 h-4" />
                  <span>Save Notices</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

