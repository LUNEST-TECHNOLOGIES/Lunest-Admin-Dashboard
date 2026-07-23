import React, { useState, useEffect } from 'react';
import { 
    MdOutlineClose, 
    MdOutlinePeople, 
    MdOutlineHotel, 
    MdOutlineCheckCircle, 
    MdOutlineBookmark, 
    MdOutlineVerifiedUser,
    MdOutlinePersonOutline,
    MdOutlineRefresh
} from 'react-icons/md';
import { getReferredUsers } from '../../../../services/adminService';

const ReferrerDetailsModal = ({ isOpen, onClose, referrer, onEditCustomCode }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [filterRole, setFilterRole] = useState('ALL'); // ALL | GUESTS | HOSTS

    useEffect(() => {
        const targetId = referrer?._id || referrer?.id || referrer?.userId || referrer?.userID;
        if (isOpen && targetId) {
            fetchReferralDetails(targetId);
        } else {
            setData(null);
        }
    }, [isOpen, referrer]);

    const fetchReferralDetails = async (referrerId) => {
        setLoading(true);
        try {
            const res = await getReferredUsers(referrerId);
            if (res.success && res.body) {
                setData(res.body);
            }
        } catch (err) {
            console.error('Failed to fetch referrer details:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !referrer) return null;

    const summary = data?.summary || {
        totalReferred: referrer.directReferrals || 0,
        guestsOnboarded: referrer.guestsOnboarded || 0,
        guestsBooked: referrer.guestsBooked || 0,
        hostsOnboarded: referrer.hostsOnboarded || 0,
        hostsApproved: referrer.hostsApproved || 0
    };

    const users = data?.users || [];

    const filteredUsers = users.filter(u => {
        if (filterRole === 'GUESTS') return u.userType !== 'HOST' && u.hostApplicationStatus !== 'APPROVED';
        if (filterRole === 'HOSTS') return u.userType === 'HOST' || u.hostApplicationStatus === 'APPROVED' || u.hostApplicationStatus === 'PENDING';
        return true;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-aeonik">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 py-6 bg-indigo-950 text-white flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold">{referrer.name || referrer.fullName || 'Referrer Details'}</h2>
                            {referrer.referralCode && (
                                <span className="px-3 py-0.5 bg-indigo-800/80 border border-indigo-700 rounded-full text-xs font-mono font-bold text-indigo-200">
                                    {referrer.referralCode}
                                </span>
                            )}
                        </div>
                        <p className="text-indigo-200 text-sm mt-1">{referrer.email} • ID: {referrer.userId || referrer._id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {onEditCustomCode && (
                            <button
                                onClick={() => onEditCustomCode(referrer)}
                                className="px-3.5 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white border border-indigo-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                Edit Code
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-300 hover:text-white"
                        >
                            <MdOutlineClose className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-6 flex-1">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col">
                            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
                                <MdOutlinePeople className="w-4 h-4" />
                                Guests Onboarded
                            </div>
                            <span className="text-2xl font-extrabold text-indigo-950">{summary.guestsOnboarded}</span>
                        </div>

                        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col">
                            <div className="flex items-center gap-2 text-green-700 text-xs font-bold uppercase tracking-wider mb-1">
                                <MdOutlineBookmark className="w-4 h-4" />
                                Guests Booked
                            </div>
                            <span className="text-2xl font-extrabold text-green-950">{summary.guestsBooked}</span>
                            <span className="text-[11px] text-green-600 font-medium mt-0.5">
                                {summary.guestsOnboarded > 0 ? Math.round((summary.guestsBooked / summary.guestsOnboarded) * 100) : 0}% conversion
                            </span>
                        </div>

                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col">
                            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
                                <MdOutlineHotel className="w-4 h-4" />
                                Hosts Onboarded
                            </div>
                            <span className="text-2xl font-extrabold text-amber-950">{summary.hostsOnboarded}</span>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col">
                            <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
                                <MdOutlineVerifiedUser className="w-4 h-4" />
                                Hosts Approved
                            </div>
                            <span className="text-2xl font-extrabold text-blue-950">{summary.hostsApproved}</span>
                            <span className="text-[11px] text-blue-600 font-medium mt-0.5">
                                {summary.hostsOnboarded > 0 ? Math.round((summary.hostsApproved / summary.hostsOnboarded) * 100) : 0}% approved
                            </span>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex gap-2">
                            {['ALL', 'GUESTS', 'HOSTS'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setFilterRole(role)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        filterRole === role
                                            ? 'bg-indigo-900 text-white shadow'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {role === 'ALL' ? `All (${users.length})` : role === 'GUESTS' ? `Guests (${summary.guestsOnboarded})` : `Hosts (${summary.hostsOnboarded})`}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => fetchReferralDetails(referrer._id || referrer.id || referrer.userId || referrer.userID)}
                            className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:text-indigo-800 cursor-pointer"
                        >
                            <MdOutlineRefresh className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>

                    {/* Referred Users Table */}
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-slate-400 font-medium text-sm">Loading referral breakdown...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-medium text-sm">
                            No referred users found for this category
                        </div>
                    ) : (
                        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">User Details</th>
                                        <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Role</th>
                                        <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Guest Booking</th>
                                        <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Host Status</th>
                                        <th className="px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">Joined Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredUsers.map((u, idx) => {
                                        const isHostRole = u.userType === 'HOST' || u.hostApplicationStatus === 'APPROVED';
                                        return (
                                            <tr key={u._id || idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{u.fullName || 'User'}</span>
                                                        <span className="text-xs text-slate-500">{u.emailAddress || '-'}</span>
                                                        {u.userID && <span className="text-[10px] text-slate-400 font-mono">ID: {u.userID}</span>}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                                        isHostRole 
                                                            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                                    }`}>
                                                        {isHostRole ? 'HOST' : 'GUEST'}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    {u.hasBooked ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-bold">
                                                            <MdOutlineCheckCircle className="w-3.5 h-3.5 text-green-600" />
                                                            Booked
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md text-xs font-medium">
                                                            No Bookings
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    {u.isHostApproved ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-bold">
                                                            <MdOutlineVerifiedUser className="w-3.5 h-3.5 text-blue-600" />
                                                            Approved Host
                                                        </span>
                                                    ) : u.hostApplicationStatus === 'PENDING' ? (
                                                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold">
                                                            Pending Application
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                                                    {formatDate(u.createdAt)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-all cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferrerDetailsModal;
