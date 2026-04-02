import React from 'react';
import { MdOutlineClose, MdOutlineMonetizationOn, MdOutlinePeople, MdOutlineCheckCircle, MdOutlineTrendingUp } from 'react-icons/md';

const ReferralViewModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-aeonik">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 py-6 bg-indigo-950 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Campaign Details</h2>
                        <p className="text-indigo-200 text-sm mt-1">{data.name} • {data.id}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    >
                        <MdOutlineClose className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${data.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500'}`}>
                                {data.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Type:</span>
                            <span className="px-3 py-1 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
                                {data.type}
                            </span>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-2">
                                <MdOutlinePeople className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase">Participants</span>
                            <span className="text-2xl font-bold text-slate-900">{data.participants}</span>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-2">
                                <MdOutlineCheckCircle className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase">Conversions</span>
                            <span className="text-2xl font-bold text-slate-900">{data.conversions}</span>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-2">
                                <MdOutlineTrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase">Success Rate</span>
                            <span className="text-2xl font-bold text-slate-900">
                                {data.participants > 0 ? Math.round((data.conversions / data.participants) * 100) : 0}%
                            </span>
                        </div>
                    </div>

                    {/* Reward Section */}
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500 overflow-hidden">
                                <MdOutlineMonetizationOn className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Reward Level</h4>
                                <p className="text-2xl font-extrabold text-indigo-950">{data.reward}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralViewModal;
