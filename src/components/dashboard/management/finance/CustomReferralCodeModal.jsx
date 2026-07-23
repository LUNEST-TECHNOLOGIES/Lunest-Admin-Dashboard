import React, { useState, useEffect } from 'react';
import { 
    MdOutlineClose, 
    MdOutlineEdit, 
    MdOutlineLink, 
    MdOutlineCheckCircle, 
    MdOutlineErrorOutline, 
    MdOutlineSearch,
    MdOutlinePerson,
    MdOutlineCheck
} from 'react-icons/md';
import { assignCustomReferralCode, getUsers } from '../../../../services/adminService';
import { useNotification } from '../../../ui/NotificationProvider';

const CustomReferralCodeModal = ({ isOpen, onClose, user, onSuccess }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [customCode, setCustomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const notify = useNotification();

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setSelectedUser(user);
                setUserSearchTerm(`${user.name || user.fullName || ''} (${user.email || user.emailAddress || ''})`);
                setCustomCode(user.referralCode || '');
            } else {
                setSelectedUser(null);
                setUserSearchTerm('');
                setCustomCode('');
            }
            setSearchResults([]);
            setShowDropdown(false);
            setError('');
        }
    }, [isOpen, user]);

    // Live search users when typing in search input
    useEffect(() => {
        if (!isOpen || user || !userSearchTerm || selectedUser) return;

        const timer = setTimeout(async () => {
            if (userSearchTerm.trim().length >= 2) {
                setSearchingUsers(true);
                try {
                    const res = await getUsers({ search: userSearchTerm.trim() });
                    if (res && res.body) {
                        const list = Array.isArray(res.body) ? res.body : (res.body.users || []);
                        setSearchResults(list.slice(0, 8));
                        setShowDropdown(true);
                    }
                } catch (err) {
                    console.error('Failed to search users:', err);
                } finally {
                    setSearchingUsers(false);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [userSearchTerm, isOpen, user, selectedUser]);

    if (!isOpen) return null;

    const sanitizedCode = customCode.trim().replace(/\s+/g, '').toUpperCase();
    const previewLink = `https://lunest.app/join/${sanitizedCode || 'YOURCODE'}`;

    const handleSelectUser = (u) => {
        setSelectedUser(u);
        setUserSearchTerm(`${u.fullName || u.name} (${u.emailAddress || u.email})`);
        setCustomCode(u.referralCode || '');
        setShowDropdown(false);
        setError('');
    };

    const handleClearUser = () => {
        if (user) return; // Locked if passed from table row
        setSelectedUser(null);
        setUserSearchTerm('');
        setCustomCode('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        const targetIdentifier = selectedUser ? (selectedUser._id || selectedUser.id || selectedUser.emailAddress || selectedUser.email) : userSearchTerm.trim();

        if (!targetIdentifier) {
            setError('Please select or search for a target user by Name or Email');
            return;
        }

        if (!sanitizedCode) {
            setError('Please enter a custom referral code');
            return;
        }

        if (!/^[A-Z0-9]{3,20}$/.test(sanitizedCode)) {
            setError('Referral code must be 3-20 letters and numbers only.');
            return;
        }

        setLoading(true);
        try {
            const res = await assignCustomReferralCode(targetIdentifier, sanitizedCode);
            if (res.success) {
                const targetName = res.body?.fullName || selectedUser?.name || selectedUser?.fullName || userSearchTerm;
                notify.success(
                    'Referral Code Assigned', 
                    `Custom referral code '${sanitizedCode}' assigned to ${targetName}!`
                );
                if (onSuccess) onSuccess(res.body);
                onClose();
            } else {
                setError(res.message || 'Failed to assign custom referral code');
            }
        } catch (err) {
            console.error('Custom referral code error:', err);
            setError(err.message || 'An error occurred while saving the referral code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-aeonik">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-6 py-5 bg-indigo-950 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MdOutlineEdit className="w-6 h-6 text-indigo-300" />
                        <div>
                            <h3 className="text-xl font-bold">Assign Custom Referral Code</h3>
                            <p className="text-xs text-indigo-200 mt-0.5">
                                {selectedUser ? `${selectedUser.fullName || selectedUser.name} • ID: ${selectedUser.userID || selectedUser.userId || selectedUser._id}` : 'Select user by Name or Email'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                        <MdOutlineClose className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                            <MdOutlineErrorOutline className="w-5 h-5 shrink-0 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Target User Search & Selection */}
                    <div className="space-y-1.5 relative">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                            Target User (Search by Name or Email)
                        </label>
                        <div className="relative">
                            <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Type name or email (e.g. Tayo, tayo@lunest.app)..."
                                value={userSearchTerm}
                                onChange={(e) => {
                                    setUserSearchTerm(e.target.value);
                                    if (selectedUser) setSelectedUser(null);
                                    setError('');
                                }}
                                disabled={!!user}
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-85 disabled:bg-slate-100"
                            />
                            {userSearchTerm && !user && (
                                <button 
                                    type="button" 
                                    onClick={handleClearUser}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <MdOutlineClose className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Search Loading Indicator */}
                        {searchingUsers && (
                            <p className="text-[11px] text-indigo-600 font-medium animate-pulse">Searching users...</p>
                        )}

                        {/* Search Dropdown List */}
                        {showDropdown && searchResults.length > 0 && !selectedUser && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[120] max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {searchResults.map((u) => (
                                    <div
                                        key={u._id}
                                        onClick={() => handleSelectUser(u)}
                                        className="p-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                                {(u.fullName || u.emailAddress || 'U').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900">{u.fullName || 'User'}</span>
                                                <span className="text-[11px] text-slate-500">{u.emailAddress}</span>
                                            </div>
                                        </div>
                                        {u.referralCode && (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
                                                {u.referralCode}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-[11px] text-slate-400">Select a user from search results or enter their registered email address.</p>
                    </div>

                    {/* Custom Code Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                            Custom Referral Code / ID
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="e.g. VIPHOST, SUMMER2026, TAYO100"
                                value={customCode}
                                onChange={(e) => {
                                    setCustomCode(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                maxLength={20}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm tracking-wide uppercase transition-all"
                            />
                        </div>
                        <p className="text-[11px] text-slate-400">3-20 letters and numbers (no spaces). Auto-converted to uppercase.</p>
                    </div>

                    {/* Live Preview Box */}
                    <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-2">
                        <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                            <MdOutlineLink className="w-4 h-4 text-indigo-600" />
                            Live Shareable Referral Link
                        </span>
                        <div className="px-3 py-2 bg-white rounded-lg border border-indigo-200 font-mono text-xs font-semibold text-indigo-700 break-all select-all">
                            {previewLink}
                        </div>
                        <p className="text-[10px] text-indigo-600 font-medium">
                            ✨ The user's mobile app will automatically reflect this code & link on their profile. Shareable link routes signups directly to them.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !sanitizedCode || (!selectedUser && !userSearchTerm.trim())}
                            className="flex-1 py-3 bg-indigo-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-950 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <MdOutlineCheckCircle className="w-4 h-4" />
                                    Assign Code
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomReferralCodeModal;
