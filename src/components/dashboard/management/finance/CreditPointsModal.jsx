import React, { useState } from 'react';
import { MdOutlineClose } from 'react-icons/md';

const CreditPointsModal = ({ isOpen, onClose, user, onCredit }) => {
    const [formData, setFormData] = useState({
        points: '',
        reason: ''
    });

    if (!isOpen) return null;

    const handleSave = () => {
        onCredit({ 
            userId: user.walletId, 
            points: formData.points, 
            reason: formData.reason 
        });
        setFormData({ points: '', reason: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[20px] w-full max-w-[650px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 relative">
                    <button 
                        onClick={onClose}
                        className="absolute right-6 top-6 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <MdOutlineClose className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center gap-6 mt-4">
                        <h2 className="text-lg font-aeonik font-bold text-slate-900">Credit Points</h2>
                        <p className="text-base font-aeonik font-medium text-indigo-950">
                            User: <span className="font-bold">{user?.name || 'User'}</span>
                        </p>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8">
                    {/* Points Input */}
                    <div className="space-y-1.5 px-4">
                        <label className="block text-sm font-aeonik font-semibold text-slate-900">Points:</label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={formData.points}
                                onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
                                className="w-full h-11 px-5 bg-white border border-slate-400 rounded-[10px] text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="Input point amount e.g “3, 10 or 50”..."
                            />
                        </div>
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-1.5 px-4">
                        <label className="block text-sm font-aeonik font-semibold text-slate-900">Reason:</label>
                        <div className="relative">
                            <textarea 
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full h-24 px-5 py-3 bg-white border border-slate-400 rounded-[10px] text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                placeholder="Give a reason for crediting..."
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center items-center gap-10 pt-4">
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 border border-red-600 rounded-full font-aeonik font-bold text-base text-red-600 hover:bg-red-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-8 py-3 bg-indigo-950 text-white rounded-full font-aeonik font-bold text-base hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                        >
                            Credit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditPointsModal;
