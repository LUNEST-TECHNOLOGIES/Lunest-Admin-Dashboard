import React, { useState, useEffect } from 'react';
import { MdOutlineClose } from 'react-icons/md';

const CampaignEditModal = ({ isOpen, onClose, campaign, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        status: '',
        reward: ''
    });

    useEffect(() => {
        if (campaign) {
            setFormData({
                name: campaign.name || '',
                type: campaign.type || '',
                status: campaign.status || '',
                reward: campaign.reward || ''
            });
        }
    }, [campaign]);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave({ ...campaign, ...formData });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[20px] w-full max-w-[650px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center relative">
                    <h2 className="text-lg font-aeonik font-bold text-center w-full">Edit Campaign</h2>
                    <button 
                        onClick={onClose}
                        className="absolute right-6 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <MdOutlineClose className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8">
                    {/* Campaign ID (Read Only) */}
                    <div className="flex justify-between items-center">
                        <span className="font-aeonik font-semibold text-slate-900">Campaign ID:</span>
                        <span className="font-aeonik font-semibold text-slate-900">{campaign?.id || 'C002'}</span>
                    </div>

                    {/* Input Fields Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Name</label>
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="Referral Boost"
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Type</label>
                            <input 
                                type="text"
                                value={formData.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="Booking"
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Status</label>
                            <select 
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Paused">Paused</option>
                            </select>
                        </div>

                        {/* Rewards */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Rewards</label>
                            <input 
                                type="text"
                                value={formData.reward}
                                onChange={(e) => handleChange('reward', e.target.value)}
                                className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="Shortlet"
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center pt-4">
                        <button 
                            onClick={handleSave}
                            className="w-[400px] h-[50px] bg-indigo-950 text-white rounded-full font-aeonik font-bold text-base hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                        >
                            Save Edits
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignEditModal;
