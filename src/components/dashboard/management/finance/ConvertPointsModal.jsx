import React, { useState, useEffect } from 'react';
import { MdOutlineClose, MdOutlineAccountBalanceWallet, MdOutlineConfirmationNumber } from 'react-icons/md';

const ConvertPointsModal = ({ isOpen, onClose, user, onConvert }) => {
    const [points, setPoints] = useState('');
    const [targetType, setTargetType] = useState('WALLET'); // WALLET | COUPON
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPoints('');
            setTargetType('WALLET');
            setSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen || !user) return null;

    const availablePoints = Number(user.totalPoints || 0);
    const numericPoints = parseInt(points) || 0;
    const nairaAmount = numericPoints * 1; // 1 point = ₦1

    const handleSave = async () => {
        if (!numericPoints || numericPoints <= 0) return;
        setSubmitting(true);
        try {
            await onConvert({ 
                userId: user._id || user.id || user.userId, 
                points: numericPoints,
                targetType
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[20px] w-full max-w-[550px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 font-aeonik">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 relative">
                    <button 
                        onClick={onClose}
                        className="absolute right-6 top-6 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                        <MdOutlineClose className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center gap-1 mt-2">
                        <h2 className="text-xl font-bold text-slate-900">Convert Points</h2>
                        <p className="text-sm font-medium text-slate-500">
                            User: <span className="font-bold text-slate-900">{user?.name || user?.fullName || 'User'}</span>
                        </p>
                        <span className="text-xs px-2.5 py-0.5 bg-amber-50 text-amber-800 font-bold border border-amber-200 rounded-full mt-1">
                            Available: {availablePoints} Points (₦{availablePoints.toLocaleString()})
                        </span>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-6">
                    {/* Destination Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Convert Destination</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setTargetType('WALLET')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                    targetType === 'WALLET'
                                        ? 'bg-indigo-900 text-white border-indigo-900 shadow-sm'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <MdOutlineAccountBalanceWallet className="w-4 h-4" />
                                Wallet Cash
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType('COUPON')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                    targetType === 'COUPON'
                                        ? 'bg-indigo-900 text-white border-indigo-900 shadow-sm'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <MdOutlineConfirmationNumber className="w-4 h-4" />
                                Discount Coupon
                            </button>
                        </div>
                    </div>

                    {/* Points Input */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Points to Convert</label>
                            {availablePoints > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setPoints(String(availablePoints))}
                                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                    Use Max ({availablePoints})
                                </button>
                            )}
                        </div>
                        <input 
                            type="number"
                            value={points}
                            max={availablePoints}
                            min={1}
                            onChange={(e) => setPoints(e.target.value)}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="Enter points (e.g. 10, 50, 100)..."
                        />
                    </div>

                    {/* Amount Preview */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-slate-600">Naira Equivalent</span>
                        <span className="text-lg font-extrabold text-indigo-950 font-mono">
                            ₦{nairaAmount.toLocaleString()}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end items-center gap-3 pt-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            disabled={submitting || numericPoints <= 0 || numericPoints > availablePoints}
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-indigo-950 text-white rounded-xl font-bold text-xs hover:bg-indigo-900 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Converting...' : `Approve ${targetType === 'WALLET' ? 'Wallet Credit' : 'Coupon'}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConvertPointsModal;
