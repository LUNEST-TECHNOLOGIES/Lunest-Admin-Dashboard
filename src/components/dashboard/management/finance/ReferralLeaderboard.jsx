import React, { useState, useEffect } from 'react';
import { 
    MdOutlineEmojiEvents, 
    MdOutlineStars, 
    MdOutlinePeople, 
    MdOutlineBookmark, 
    MdOutlineVerifiedUser, 
    MdOutlineVisibility,
    MdOutlineRefresh,
    MdOutlineWorkspacePremium,
    MdOutlineEdit
} from 'react-icons/md';
import { getReferralLeaderboard } from '../../../../services/adminService';

const ReferralLeaderboard = ({ onSelectReferrer, onEditCustomCode, searchTerm = '' }) => {
    const [loading, setLoading] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [totalActive, setTotalActive] = useState(0);

    useEffect(() => {
        fetchLeaderboard();
    }, [searchTerm]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await getReferralLeaderboard(50, searchTerm);
            if (res.success && res.body) {
                setLeaderboard(res.body.leaderboard || []);
                setTotalActive(res.body.totalActiveReferrers || 0);
            }
        } catch (err) {
            console.error('Failed to fetch referral leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center">
                <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-medium">Loading Referral Leaderboard...</p>
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="p-20 text-center text-slate-400 font-medium">
                <MdOutlineEmojiEvents className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                No active referrers found for the leaderboard matching "{searchTerm || 'all'}".
            </div>
        );
    }

    const firstPlace = leaderboard[0];
    const secondPlace = leaderboard[1];
    const thirdPlace = leaderboard[2];
    const remainingList = leaderboard;

    return (
        <div className="space-y-8 font-aeonik p-6 bg-slate-50/50">
            {/* Top Bar Info */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <MdOutlineEmojiEvents className="w-6 h-6 text-amber-500" />
                        Referral & Reward Champions
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">Top-performing referrers ranked by total earned points & successful conversions.</p>
                </div>
                <button 
                    onClick={fetchLeaderboard}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                >
                    <MdOutlineRefresh className="w-4 h-4 text-slate-500" />
                    Refresh Ranks
                </button>
            </div>

            {/* Top 3 Podium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* 2nd Place */}
                {secondPlace ? (
                    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-md relative overflow-hidden flex flex-col items-center text-center order-2 md:order-1 transition-all hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                            🥈 2ND PLACE
                        </div>

                        <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-600 font-extrabold text-xl mb-3 mt-2 shadow-inner">
                            {secondPlace.name ? secondPlace.name.substring(0, 2).toUpperCase() : '2nd'}
                        </div>

                        <h4 className="font-bold text-slate-900 text-lg leading-snug">{secondPlace.name}</h4>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{secondPlace.email}</span>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-mono font-bold mt-2">
                            {secondPlace.referralCode}
                        </span>

                        <div className="w-full bg-slate-50 rounded-xl p-3 mt-4 border border-slate-100 flex justify-around">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Points</span>
                                <span className="text-lg font-black text-amber-600 flex items-center justify-center gap-1">
                                    <MdOutlineStars className="w-4 h-4" />
                                    {secondPlace.totalEarnedPoints}
                                </span>
                            </div>
                            <div className="border-r border-slate-200"></div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Booked</span>
                                <span className="text-lg font-black text-green-600">{secondPlace.guestsBooked}</span>
                            </div>
                            <div className="border-r border-slate-200"></div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Hosts</span>
                                <span className="text-lg font-black text-blue-600">{secondPlace.hostsApproved}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full mt-4">
                            {onEditCustomCode && (
                                <button 
                                    onClick={() => onEditCustomCode(secondPlace)}
                                    className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                    <MdOutlineEdit className="w-3.5 h-3.5" />
                                    Edit Code
                                </button>
                            )}
                            {onSelectReferrer && (
                                <button 
                                    onClick={() => onSelectReferrer(secondPlace)}
                                    className="flex-1 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                                >
                                    View Referrals
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="order-2 md:order-1"></div>
                )}

                {/* 1st Place (Gold Podium) */}
                {firstPlace && (
                    <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-7 border-2 border-amber-400 shadow-xl relative overflow-hidden flex flex-col items-center text-center order-1 md:order-2 -translate-y-2 transition-all hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <MdOutlineWorkspacePremium className="w-4 h-4" />
                            👑 1ST PLACE
                        </div>

                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 border-4 border-white flex items-center justify-center text-white font-black text-2xl mb-3 mt-2 shadow-lg">
                            {firstPlace.name ? firstPlace.name.substring(0, 2).toUpperCase() : '1st'}
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-xl leading-snug">{firstPlace.name}</h4>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{firstPlace.email}</span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-mono font-bold mt-2">
                            {firstPlace.referralCode}
                        </span>

                        <div className="w-full bg-amber-50/80 rounded-xl p-4 mt-4 border border-amber-200/60 flex justify-around shadow-inner">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-amber-800/70 block">Points</span>
                                <span className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
                                    <MdOutlineStars className="w-5 h-5 text-amber-500" />
                                    {firstPlace.totalEarnedPoints}
                                </span>
                            </div>
                            <div className="border-r border-amber-200/80"></div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-amber-800/70 block">Guests Booked</span>
                                <span className="text-2xl font-black text-green-600">{firstPlace.guestsBooked}</span>
                            </div>
                            <div className="border-r border-amber-200/80"></div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-amber-800/70 block">Hosts Approved</span>
                                <span className="text-2xl font-black text-blue-600">{firstPlace.hostsApproved}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full mt-5">
                            {onEditCustomCode && (
                                <button 
                                    onClick={() => onEditCustomCode(firstPlace)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                    <MdOutlineEdit className="w-3.5 h-3.5" />
                                    Edit Code
                                </button>
                            )}
                            {onSelectReferrer && (
                                <button 
                                    onClick={() => onSelectReferrer(firstPlace)}
                                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-md transition-all cursor-pointer"
                                >
                                    View Referrals
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {thirdPlace ? (
                    <div className="bg-white rounded-2xl p-6 border-2 border-amber-700/30 shadow-md relative overflow-hidden flex flex-col items-center text-center order-3 transition-all hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 bg-amber-800/20 text-amber-900 text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                            🥉 3RD PLACE
                        </div>

                        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-700/40 flex items-center justify-center text-amber-900 font-extrabold text-xl mb-3 mt-2 shadow-inner">
                            {thirdPlace.name ? thirdPlace.name.substring(0, 2).toUpperCase() : '3rd'}
                        </div>

                        <h4 className="font-bold text-slate-900 text-lg leading-snug">{thirdPlace.name}</h4>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">{thirdPlace.email}</span>
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-mono font-bold mt-2">
                            {thirdPlace.referralCode}
                        </span>

                        <div className="w-full bg-slate-50 rounded-xl p-3 mt-4 border border-slate-100 flex justify-around">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Points</span>
                                <span className="text-lg font-black text-amber-600 flex items-center justify-center gap-1">
                                    <MdOutlineStars className="w-4 h-4" />
                                    {thirdPlace.totalEarnedPoints}
                                </span>
                            </div>
                            <div className="border-r border-slate-200"></div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Booked</span>
                                <span className="text-lg font-black text-green-600">{thirdPlace.guestsBooked}</span>
                            </div>
                            <div className="border-r border-slate-200"></div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Hosts</span>
                                <span className="text-lg font-black text-blue-600">{thirdPlace.hostsApproved}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full mt-4">
                            {onEditCustomCode && (
                                <button 
                                    onClick={() => onEditCustomCode(thirdPlace)}
                                    className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                    <MdOutlineEdit className="w-3.5 h-3.5" />
                                    Edit Code
                                </button>
                            )}
                            {onSelectReferrer && (
                                <button 
                                    onClick={() => onSelectReferrer(thirdPlace)}
                                    className="flex-1 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                                >
                                    View Referrals
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="order-3"></div>
                )}
            </div>

            {/* Ranked Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-slate-900 text-base">Full Leaderboard Standings</h4>
                        <p className="text-xs text-slate-500">Showing top active referrers ({remainingList.length} total)</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-indigo-50/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Referrer Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Referral Code</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Total Points</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Guests Booked</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Hosts Approved</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Total Referrals</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {remainingList.map((user) => {
                                const isTop3 = user.rank <= 3;
                                return (
                                    <tr key={user._id} className={`hover:bg-slate-50/80 transition-colors ${isTop3 ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                                                    user.rank === 1 ? 'bg-yellow-400 text-amber-950 shadow-sm' :
                                                    user.rank === 2 ? 'bg-slate-300 text-slate-900' :
                                                    user.rank === 3 ? 'bg-amber-700 text-white' :
                                                    'bg-slate-100 text-slate-600 font-bold'
                                                }`}>
                                                    #{user.rank}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500">{user.badge}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{user.name}</span>
                                                <span className="text-xs text-slate-500">{user.email}</span>
                                                {user.userId && <span className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {user.userId}</span>}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-bold text-indigo-700 font-mono">
                                                {user.referralCode}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                                                <MdOutlineStars className="w-4 h-4 text-amber-500" />
                                                {user.totalEarnedPoints} Points
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-bold text-green-700">
                                                <MdOutlineBookmark className="w-4 h-4 text-green-600" />
                                                {user.guestsBooked} Booked
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-bold text-blue-700">
                                                <MdOutlineVerifiedUser className="w-4 h-4 text-blue-600" />
                                                {user.hostsApproved} Approved
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-slate-700 font-bold">
                                            {user.directReferrals} Total
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {onEditCustomCode && (
                                                    <button 
                                                        onClick={() => onEditCustomCode(user)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                                                        title="Edit Referral Code"
                                                    >
                                                        <MdOutlineEdit className="w-3.5 h-3.5" />
                                                        Edit Code
                                                    </button>
                                                )}
                                                {onSelectReferrer && (
                                                    <button 
                                                        onClick={() => onSelectReferrer(user)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                                                    >
                                                        <MdOutlineVisibility className="w-3.5 h-3.5" />
                                                        View Referrals
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReferralLeaderboard;
