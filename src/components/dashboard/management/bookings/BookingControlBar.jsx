import React, { useState, useEffect } from 'react';
import { 
  MdPlayCircleFilled, 
  MdPauseCircleFilled, 
  MdVpnKey, 
  MdSettings, 
  MdPeople, 
  MdWarning, 
  MdRefresh,
  MdCheckCircle
} from 'react-icons/md';
import { getBookingControls, updateBookingControls } from '../../../../services/adminService';
import AllowedBookersModal from './AllowedBookersModal';
import EditBookingNoticeModal from './EditBookingNoticeModal';

export default function BookingControlBar() {
  const [controls, setControls] = useState({
    bookingStatus: null,
    bookingNotice: '',
    whitelistNotice: '',
    pausedAt: null,
    pausedBy: null,
    stats: {
      whitelistedCount: 0,
      restrictedCount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [savingNotice, setSavingNotice] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [apiMissing, setApiMissing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchControls = async () => {
    try {
      setLoading(true);
      setApiMissing(false);
      const res = await getBookingControls();
      if (!res?.body?.bookingStatus) throw new Error('Missing booking mode');
      setControls(res.body);
    } catch (err) {
      setApiMissing(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
  }, []);

  const handleStatusChange = async (targetStatus) => {
    if (targetStatus === controls.bookingStatus) return;

    if (targetStatus === 'PAUSED') {
      const ok = window.confirm(
        '⚠️ Are you sure you want to PAUSE all bookings platform-wide?\n\n' +
        'This pauses new bookings for every guest, including approved private-access guests.'
      );
      if (!ok) return;
    }

    try {
      setUpdatingStatus(true);
      const res = await updateBookingControls({ bookingStatus: targetStatus });
      if (res?.body) {
        setControls(prev => ({
          ...prev,
          ...res.body,
          stats: prev.stats
        }));
      } else {
        throw new Error('Missing confirmed booking mode');
      }
      showToast(
        targetStatus === 'OPEN' ? 'Booking engine set to LIVE (All Guests)' :
        targetStatus === 'WHITELIST_ONLY' ? 'Booking engine set to WHITELIST ONLY' :
        'Booking engine PAUSED globally'
      );
    } catch (err) {
      showToast('Could not confirm the change. Refreshing booking controls.');
      await fetchControls();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotices = async (notices) => {
    try {
      setSavingNotice(true);
      const res = await updateBookingControls(notices);
      if (res?.body) {
        setControls(prev => ({
          ...prev,
          ...res.body,
          stats: prev.stats
        }));
        showToast('Guest booking notices updated successfully');
      }
      setShowNoticeModal(false);
    } catch (err) {
      console.error('Failed to save notices:', err);
      alert('Failed to save notices. Please try again.');
    } finally {
      setSavingNotice(false);
    }
  };

  if (loading) return <p role="status">Loading booking controls…</p>;
  if (apiMissing) return <p role="alert">Booking controls are unavailable. <button onClick={fetchControls}>Retry</button></p>;
  const status = controls.bookingStatus;

  return (
    <div className="mb-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm transition-all relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 right-4 z-20 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5 animate-in fade-in duration-200">
          <MdCheckCircle className="text-emerald-400 w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Bar: Header, Live Pill, Mode Switcher, and Tools */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold transition-all shadow-sm ${
            status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
            status === 'WHITELIST_ONLY' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
            'bg-rose-50 text-rose-600 border border-rose-100'
          }`}>
            {status === 'OPEN' && <MdPlayCircleFilled className="w-6 h-6" />}
            {status === 'WHITELIST_ONLY' && <MdVpnKey className="w-5 h-5" />}
            {status === 'PAUSED' && <MdPauseCircleFilled className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 font-aeonik tracking-tight">Booking Engine Live Controls</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                status === 'WHITELIST_ONLY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status === 'OPEN' ? 'bg-emerald-500 animate-pulse' :
                  status === 'WHITELIST_ONLY' ? 'bg-amber-500 animate-pulse' :
                  'bg-rose-500 animate-pulse'
                }`}></span>
                {status === 'OPEN' && 'Live for All Guests'}
                {status === 'WHITELIST_ONLY' && 'Private Access (Whitelist Only)'}
                {status === 'PAUSED' && 'Paused Globally'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {status === 'OPEN' && 'All verified guests can reserve and pay for properties.'}
              {status === 'WHITELIST_ONLY' && 'Only approved beta/VIP tester accounts on the Whitelist can create bookings.'}
              {status === 'PAUSED' && `Bookings are currently blocked platform-wide ${controls.pausedBy ? `(paused by ${controls.pausedBy})` : ''}.`}
            </p>
          </div>
        </div>

        {/* Center: Segmented Mode Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start lg:self-auto shadow-inner">
          <button
            onClick={() => handleStatusChange('OPEN')}
            disabled={updatingStatus}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              status === 'OPEN'
                ? 'bg-white text-emerald-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All Guests</span>
          </button>

          <button
            onClick={() => handleStatusChange('WHITELIST_ONLY')}
            disabled={updatingStatus}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              status === 'WHITELIST_ONLY'
                ? 'bg-white text-amber-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Whitelist Only</span>
          </button>

          <button
            onClick={() => handleStatusChange('PAUSED')}
            disabled={updatingStatus}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              status === 'PAUSED'
                ? 'bg-white text-rose-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Pause Bookings</span>
          </button>
        </div>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowWhitelistModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-indigo-300"
          >
            <MdPeople className="w-4 h-4 text-indigo-600" />
            <span>Allowed Bookers</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-100">
              {controls.stats?.whitelistedCount || 0}
            </span>
          </button>

          <button
            onClick={() => setShowNoticeModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-slate-300"
            title="Configure maintenance and whitelist guest notices"
          >
            <MdSettings className="w-4 h-4 text-slate-500" />
            <span>Notice Settings</span>
          </button>

          <button
            onClick={fetchControls}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm"
            title="Refresh Controls"
          >
            <MdRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notice Banner (when in WHITELIST_ONLY or PAUSED mode) */}
      {status !== 'OPEN' && (
        <div className={`mt-4 p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
          status === 'PAUSED'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <MdWarning className={`w-4.5 h-4.5 flex-shrink-0 mt-0.5 ${
            status === 'PAUSED' ? 'text-rose-600' : 'text-amber-600'
          }`} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-wider text-[10px]">
                {status === 'PAUSED' ? 'Active Guest Maintenance Notice:' : 'Active Whitelist Access Notice:'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">(shown on guest apps upon booking)</span>
            </div>
            <p className="mt-1 font-medium leading-relaxed italic text-slate-800">
              "{status === 'PAUSED' ? controls.bookingNotice : controls.whitelistNotice}"
            </p>
          </div>
          <button
            onClick={() => setShowNoticeModal(true)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold shadow-xs cursor-pointer flex-shrink-0"
          >
            Edit Notice
          </button>
        </div>
      )}

      {/* Modals */}
      <AllowedBookersModal
        isOpen={showWhitelistModal}
        onClose={() => setShowWhitelistModal(false)}
        onWhitelistUpdated={fetchControls}
      />

      <EditBookingNoticeModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        initialBookingNotice={controls.bookingNotice}
        initialWhitelistNotice={controls.whitelistNotice}
        onSave={handleSaveNotices}
        saving={savingNotice}
      />
    </div>
  );
}
