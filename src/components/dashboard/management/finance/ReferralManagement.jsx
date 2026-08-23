import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  MdOutlinePeople, 
  MdOutlineStars, 
  MdOutlineChangeCircle, 
  MdOutlineConfirmationNumber,
  MdOutlineSearch,
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
  MdOutlineMonetizationOn,
  MdOutlineFileDownload,
  MdOutlineAddCircleOutline,
  MdOutlineVisibility,
  MdOutlineEdit,
  MdOutlineAccountBalanceWallet,
  MdOutlineRedeem,
  MdOutlineSwapVert,
  MdOutlineRefresh
} from 'react-icons/md';
import StatsCard from '../../StatsCard';
import CreditPointsModal from './CreditPointsModal';
import ConvertPointsModal from './ConvertPointsModal';
import ReferrerDetailsModal from './ReferrerDetailsModal';
import ReferralLeaderboard from './ReferralLeaderboard';
import CustomReferralCodeModal from './CustomReferralCodeModal';
import { useNotification } from '../../../ui/NotificationProvider';
import {
    getReferralStats,
    getReferralTree,
    getManualRewardLogs,
    adminCreditPoints,
    getCreditBonusUsers,
    getPromoImpact
} from '../../../../services/adminService';

const ReferralManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Leaderboard');
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCustomCodeModalOpen, setIsCustomCodeModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedReferrer, setSelectedReferrer] = useState(null);
    const [selectedUserForCustomCode, setSelectedUserForCustomCode] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'directReferrals', direction: 'desc' });
    const notify = useNotification();

    // Loading & data states
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalPointsIssued: 0,
        activeReferrers: 0,
        pointsConverted: 0,
        couponsIssued: 0
    });
    const [referralTreeData, setReferralTreeData] = useState([]);
    const [treePagination, setTreePagination] = useState({ page: 1, pages: 1, total: 0 });
    const [logsData, setLogsData] = useState([]);
    const [logsPagination, setLogsPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [creditBonusData, setCreditBonusData] = useState([]);
    const [creditPagination, setCreditPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [promoData, setPromoData] = useState({ referralSuccessRate: 0, revenueFromReferrals: 0, pointsConversionRate: 0 });

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    // Fetch tab data when tab changes
    useEffect(() => {
        fetchTabData();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await getReferralStats();
            if (res.success && res.body) {
                setStats(res.body);
            }
        } catch (err) {
            console.error('Failed to fetch referral stats:', err);
        }
    };

    const fetchTabData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            if (activeTab === 'Referral Tree') {
                const res = await getReferralTree(page, 20, searchTerm);
                if (res.success && res.body) {
                    setReferralTreeData(res.body.referrers || []);
                    setTreePagination(res.body.pagination || { page: 1, pages: 1, total: 0 });
                }
            } else if (activeTab === 'Manual Reward Logs') {
                const res = await getManualRewardLogs(page, 20);
                if (res.success && res.body) {
                    setLogsData(res.body.logs || []);
                    setLogsPagination(res.body.pagination || { page: 1, pages: 1, total: 0 });
                }
            } else if (activeTab === 'Credit Bonus') {
                const res = await getCreditBonusUsers(page, 20, searchTerm);
                if (res.success && res.body) {
                    setCreditBonusData(res.body.users || []);
                    setCreditPagination(res.body.pagination || { page: 1, pages: 1, total: 0 });
                }
            } else if (activeTab === 'Promo Impact') {
                const res = await getPromoImpact();
                if (res.success && res.body) {
                    setPromoData(res.body);
                }
            }
        } catch (err) {
            console.error(`Failed to fetch ${activeTab} data:`, err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, searchTerm]);

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (activeTab === 'Referral Tree' || activeTab === 'Credit Bonus') {
                fetchTabData(1);
            }
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const statsCards = [
        { 
            label: 'Total Points Issued', 
            value: stats.totalPointsIssued, 
            growth: '', 
            description: 'all time', 
            icon: <MdOutlineStars />,
            bgColor: 'indigo',
            iconColor: 'indigo'
        },
        { 
            label: 'Active Referrers', 
            value: stats.activeReferrers, 
            growth: '', 
            description: 'with referral codes', 
            icon: <MdOutlinePeople />,
            bgColor: 'green',
            iconColor: 'green'
        },
        { 
            label: 'Points Converted', 
            value: stats.pointsConverted, 
            growth: '', 
            description: 'redeemed value', 
            icon: <MdOutlineChangeCircle />,
            bgColor: 'amber',
            iconColor: 'amber',
            isCurrency: true
        },
        { 
            label: 'Coupons Issued', 
            value: stats.couponsIssued, 
            growth: '', 
            description: 'auto & manual', 
            icon: <MdOutlineConfirmationNumber />,
            bgColor: 'blue',
            iconColor: 'blue'
        }
    ];

    // Sorting Logic for Referral Tree
    const sortedReferralTree = useMemo(() => {
        const sortableItems = [...referralTreeData];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [referralTreeData, sortConfig]);

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const handleCreditAction = (user) => {
        setSelectedUser(user);
        setIsCreditModalOpen(true);
    };

    const handleConvertAction = (user) => {
        setSelectedUser(user);
        setIsConvertModalOpen(true);
    };

    const getCurrentPagination = () => {
        if (activeTab === 'Referral Tree') return treePagination;
        if (activeTab === 'Manual Reward Logs') return logsPagination;
        if (activeTab === 'Credit Bonus') return creditPagination;
        return { page: 1, pages: 1, total: 0 };
    };

    const handlePageChange = (newPage) => {
        fetchTabData(newPage);
    };

    const tabs = ['Leaderboard', 'Referral Tree', 'Manual Reward Logs', 'Credit Bonus', 'Promo Impact'];

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const renderTable = () => {
        if (activeTab === 'Leaderboard') {
            return (
                <ReferralLeaderboard 
                    searchTerm={searchTerm}
                    onSelectReferrer={(user) => {
                        setSelectedReferrer(user);
                        setIsDetailsModalOpen(true);
                    }}
                    onEditCustomCode={(user) => {
                        setSelectedUserForCustomCode(user);
                        setIsCustomCodeModalOpen(true);
                    }}
                />
            );
        }

        if (loading) {
            return (
                <div className="p-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-400 font-medium">Loading...</p>
                </div>
            );
        }

        if (activeTab === 'Manual Reward Logs') {
            if (logsData.length === 0) {
                return <div className="p-20 text-center text-slate-400 font-medium">No manual reward logs yet</div>;
            }
            return (
                <table className="w-full text-left">
                    <thead className="bg-indigo-50/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">User Details</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Reward</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {logsData.map((log, idx) => (
                            <tr key={log._id || idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 text-slate-600 font-medium">{formatDate(log.createdAt)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{log.user?.fullName || 'Unknown'}</span>
                                        <span className="text-xs text-slate-500">{log.user?.emailAddress || ''}</span>
                                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {log.user?._id || log.user?.id || log.user || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-900">
                                    <div className="flex items-center gap-1.5 font-semibold">
                                        <MdOutlineMonetizationOn className="w-4 h-4 text-amber-500" />
                                        {log.point} Points
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{log.description || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === 'Referral Tree') {
            if (sortedReferralTree.length === 0) {
                return <div className="p-20 text-center text-slate-400 font-medium">No referrers found</div>;
            }
            return (
                <table className="w-full text-left">
                    <thead className="bg-indigo-50/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">User Details</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Referral Code</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer group hover:bg-indigo-100 transition-colors" onClick={() => requestSort('directReferrals')}>
                                <div className="flex items-center gap-1">
                                    Total Referrals
                                    <MdOutlineSwapVert className={`w-4 h-4 transition-colors ${sortConfig.key === 'directReferrals' ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Guests Onboarded</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Hosts Onboarded</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer group hover:bg-indigo-100 transition-colors" onClick={() => requestSort('totalEarnedPoints')}>
                                <div className="flex items-center gap-1">
                                    Total Points
                                    <MdOutlineSwapVert className={`w-4 h-4 transition-colors ${sortConfig.key === 'totalEarnedPoints' ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {sortedReferralTree.map((user, idx) => (
                            <tr key={user._id || idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{user.name}</span>
                                        <span className="text-xs text-slate-500">{user.email}</span>
                                        {user.userId && <span className="text-xs text-slate-500 font-medium mt-0.5">ID: {user.userId}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-bold text-indigo-700 font-mono">
                                        {user.referralCode}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-700 font-bold">{user.directReferrals}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{user.guestsOnboarded || 0}</span>
                                        <span className="text-xs text-green-600 font-medium">
                                            ({user.guestsBooked || 0} booked{user.totalGuestBookings > 0 ? ` • ${user.totalGuestBookings} ${user.totalGuestBookings === 1 ? 'stay' : 'stays'}` : ''})
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{user.hostsOnboarded || 0}</span>
                                        <span className="text-xs text-blue-600 font-medium">({user.hostsApproved || 0} approved)</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                        <MdOutlineMonetizationOn className="w-4 h-4 text-amber-500" />
                                        {user.totalEarnedPoints} Points
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => {
                                                setSelectedUserForCustomCode(user);
                                                setIsCustomCodeModalOpen(true);
                                            }}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                                            title="Assign or Edit Custom Referral Code"
                                        >
                                            <MdOutlineEdit className="w-3.5 h-3.5" />
                                            Edit Code
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedReferrer(user);
                                                setIsDetailsModalOpen(true);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                                        >
                                            <MdOutlineVisibility className="w-3.5 h-3.5" />
                                            View Referrals
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === 'Credit Bonus') {
            if (creditBonusData.length === 0) {
                return <div className="p-20 text-center text-slate-400 font-medium">No users with points found</div>;
            }
            return (
                <table className="w-full text-left">
                    <thead className="bg-indigo-50/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">User Details</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Total Points</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Pending Points</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Converted to Cash</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Coupons Earned</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {creditBonusData.map((user, idx) => (
                            <tr key={user._id || idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{user.name}</span>
                                        <span className="text-xs text-slate-500">{user.email}</span>
                                        {user.userId && <span className="text-xs text-slate-500 font-medium mt-0.5">ID: {user.userId}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                        <MdOutlineMonetizationOn className="w-4 h-4 text-amber-500" />
                                        {user.totalPoints} Points
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <MdOutlineAccountBalanceWallet className="w-4 h-4 text-slate-400" />
                                        {user.pendingPoints} Pending
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-indigo-600 font-bold">₦{(user.convertedCash || 0).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 font-semibold text-blue-600">
                                        <MdOutlineConfirmationNumber className="w-4 h-4" />
                                        {user.couponsEarned}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleCreditAction(user)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                                        >
                                            <MdOutlineAccountBalanceWallet className="w-3.5 h-3.5" />
                                            Credit
                                        </button>
                                        <button 
                                            onClick={() => handleConvertAction(user)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer"
                                        >
                                            <MdOutlineRedeem className="w-3.5 h-3.5" />
                                            Convert
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === 'Promo Impact') {
            return (
                <div className="p-12 space-y-12 bg-white flex flex-col items-center justify-center min-h-[400px]">
                    <div className="flex flex-col lg:flex-row gap-8 w-full justify-between items-center max-w-6xl mx-auto">
                        <div className="flex-1 w-full bg-white border border-green-500 rounded-[10px] p-10 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-lg hover:shadow-green-500/5">
                            <span className="text-[40px] font-bold text-green-500 font-aeonik">{promoData.referralSuccessRate}%</span>
                            <span className="text-lg font-medium text-slate-400 font-aeonik">Referral Success Rate</span>
                        </div>
                        
                        <div className="flex-1 w-full bg-white border border-blue-500 rounded-[10px] p-10 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-lg hover:shadow-blue-500/5">
                            <span className="text-[40px] font-bold text-blue-500 font-aeonik">₦{(promoData.revenueFromReferrals || 0).toLocaleString()}</span>
                            <span className="text-lg font-medium text-slate-400 font-aeonik">Revenue from Referrals</span>
                        </div>

                        <div className="flex-1 w-full bg-white border border-red-500 rounded-[10px] p-10 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-lg hover:shadow-red-500/5">
                            <span className="text-[40px] font-bold text-red-500 font-aeonik">{promoData.pointsConversionRate}%</span>
                            <span className="text-lg font-medium text-slate-400 font-aeonik">Points Conversion Rate</span>
                        </div>
                    </div>
                </div>
            );
        }

        return <div className="p-20 text-center text-slate-400 font-medium font-aeonik">Select a tab to view content</div>;
    };

    const pagination = getCurrentPagination();

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-aeonik">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat, idx) => (
                    <StatsCard key={idx} {...stat} />
                ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl border border-slate-100 shadow-sm w-full md:w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                            activeTab === tab 
                                ? 'bg-indigo-900 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        {tab}
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
                            placeholder="Search by name, email, or referral code..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => {
                                setSelectedUserForCustomCode(null);
                                setIsCustomCodeModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-900 text-white rounded-lg text-sm font-bold hover:bg-indigo-950 transition-all cursor-pointer shadow-sm"
                        >
                            <MdOutlineAddCircleOutline className="w-5 h-5" />
                            Assign Custom Code
                        </button>
                        <button 
                            onClick={() => { fetchStats(); fetchTabData(); }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-100 transition-all cursor-pointer"
                        >
                            <MdOutlineRefresh className="w-5 h-5" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Dynamic Table */}
                <div className="overflow-x-auto">
                    {renderTable()}
                </div>

                {/* Pagination */}
                {activeTab !== 'Promo Impact' && pagination.pages > 1 && (
                    <div className="p-6 border-t border-slate-100 flex items-center justify-between font-aeonik">
                        <button 
                            onClick={() => handlePageChange(pagination.page - 1)}
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
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.pages}
                            className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <MdOutlineKeyboardArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreditPointsModal
                isOpen={isCreditModalOpen}
                onClose={() => setIsCreditModalOpen(false)}
                user={selectedUser}
                onCredit={async (data) => {
                    try {
                        await adminCreditPoints(selectedUser?._id, data.points, data.reason);
                        notify.success('Points Awarded', `${data.points} points credited to ${selectedUser?.name}.`);
                        setIsCreditModalOpen(false);
                        fetchStats();
                        fetchTabData();
                    } catch (err) {
                        notify.error('Error', err.message || 'Failed to credit points');
                    }
                }}
            />
            <ConvertPointsModal
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                user={selectedUser}
                onConvert={(data) => {
                    notify.success('Points Converted', `Conversion of ${data.points} points approved for ${selectedUser?.name}.`);
                    setIsConvertModalOpen(false);
                }}
            />
            <ReferrerDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                referrer={selectedReferrer}
                onEditCustomCode={(refUser) => {
                    setSelectedUserForCustomCode(refUser);
                    setIsCustomCodeModalOpen(true);
                }}
            />
            <CustomReferralCodeModal
                isOpen={isCustomCodeModalOpen}
                onClose={() => setIsCustomCodeModalOpen(false)}
                user={selectedUserForCustomCode}
                onSuccess={() => {
                    fetchStats();
                    fetchTabData();
                }}
            />
        </div>
    );
};

export default ReferralManagement;
