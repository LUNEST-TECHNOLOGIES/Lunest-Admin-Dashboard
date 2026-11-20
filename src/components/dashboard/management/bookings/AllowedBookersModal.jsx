import React, { useState, useEffect } from 'react';
import { MdClose, MdSearch, MdVerifiedUser, MdPersonAdd, MdDeleteOutline } from 'react-icons/md';
import { getBookingWhitelistedUsers, toggleUserWhitelist, getUsers } from '../../../../services/adminService';

export default function AllowedBookersModal({ isOpen, onClose, onWhitelistUpdated }) {
  const [whitelistedUsers, setWhitelistedUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionPendingId, setActionPendingId] = useState(null);

  const [apiError404, setApiError404] = useState(false);

  const fetchWhitelisted = async () => {
    try {
      setLoadingList(true);
      setApiError404(false);
      const res = await getBookingWhitelistedUsers();
      const list = res?.body?.users || [];
      setWhitelistedUsers(list);
    } catch (err) {
      if (err?.response?.status === 404) {
        setApiError404(true);
        console.warn('[AllowedBookersModal] /admin/users/booking-whitelist route is not yet deployed on live API (HTTP 404).');
      } else {
        console.error('Failed to fetch whitelisted users:', err);
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWhitelisted();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await getUsers({ search: searchQuery.trim(), limit: 15 });
      const rawList = Array.isArray(res?.body) ? res.body : (res?.body?.users || res?.data || []);
      const usersFound = rawList.filter(u => u && (u._id || u.id));
      setSearchResults(usersFound);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleWhitelist = async (userId, targetStatus) => {
    try {
      setActionPendingId(userId);
      await toggleUserWhitelist(userId, targetStatus);
      await fetchWhitelisted();
      // Update local search results
      setSearchResults(prev => prev.map(u => {
        if ((u._id || u.id) === userId) {
          return { ...u, bookingWhitelisted: targetStatus };
        }
        return u;
      }));
      if (onWhitelistUpdated) onWhitelistUpdated();
    } catch (err) {
      console.error('Failed to toggle whitelist:', err);
      alert('Failed to update whitelist status. Please try again.');
    } finally {
      setActionPendingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MdVerifiedUser className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Booking Whitelist Manager</h3>
              <p className="text-xs text-slate-500">Allow specific users to book in private-access mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Add User via Search */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <MdPersonAdd className="w-4 h-4 text-indigo-600" />
              <span>Add User to Whitelist</span>
            </h4>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by name, email or phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Search Results</span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {searchResults.map(user => {
                    const uId = user._id || user.id;
                    const isAlreadyWhitelisted = whitelistedUsers.some(w => (w._id || w.id) === uId) || user.bookingWhitelisted;
                    const isPending = actionPendingId === uId;

                    return (
                      <div key={uId} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                        <div className="truncate pr-2">
                          <span className="font-bold text-slate-900 block truncate">{user.fullName || 'User'}</span>
                          <span className="text-[11px] text-slate-400 block truncate">{user.emailAddress} {user.phoneNumber ? `• ${user.phoneNumber}` : ''}</span>
                        </div>
                        {isAlreadyWhitelisted ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            Whitelisted
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleWhitelist(uId, true)}
                            disabled={isPending}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded transition disabled:opacity-50 cursor-pointer flex-shrink-0"
                          >
                            {isPending ? 'Adding...' : '+ Whitelist'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Whitelisted Users List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Currently Whitelisted Users ({whitelistedUsers.length})
              </h4>
              <button
                onClick={fetchWhitelisted}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Refresh List
              </button>
            </div>

            {loadingList ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading whitelisted users...</div>
            ) : apiError404 ? (
              <div className="py-6 px-4 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-900">Backend Whitelist API not yet live on api.lunest.app (404)</p>
                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                  The backend route was created locally in <code className="bg-amber-100 px-1 rounded">Lunest_backend</code>. Once you deploy via <code className="bg-amber-100 px-1 rounded">./deploy.sh</code> or run the backend locally, your 3 whitelisted users will appear here live.
                </p>
              </div>
            ) : whitelistedUsers.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">No users currently whitelisted</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Search above to grant early/private booking access to testers or VIPs.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                {whitelistedUsers.map(user => {
                  const uId = user._id || user.id;
                  const isPending = actionPendingId === uId;

                  return (
                    <div key={uId} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs truncate">{user.fullName || 'User'}</span>
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold">
                              ALLOWED
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">{user.emailAddress} {user.phoneNumber ? `• ${user.phoneNumber}` : ''}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleWhitelist(uId, false)}
                        disabled={isPending}
                        title="Remove from whitelist"
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 flex-shrink-0"
                      >
                        <MdDeleteOutline className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{isPending ? 'Removing...' : 'Remove'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

