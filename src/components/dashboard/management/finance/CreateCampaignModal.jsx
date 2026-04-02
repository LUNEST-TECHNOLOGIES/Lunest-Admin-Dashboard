import React, { useState } from 'react';
import { MdOutlineClose } from 'react-icons/md';

const CreateCampaignModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'Booking',
        status: 'Active',
        reward: ''
    });

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreate = () => {
        onCreate({ 
            id: `C00${Math.floor(Math.random() * 900) + 100}`, // Generate a mock ID
            ...formData,
            participants: 0,
            conversions: 0
        });
        setFormData({ name: '', type: 'Booking', status: 'Active', reward: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[20px] w-full max-w-[650px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center relative">
                    <h2 className="text-lg font-aeonik font-bold text-center w-full">Create New Campaign</h2>
                    <button 
                        onClick={onClose}
                        className="absolute right-6 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <MdOutlineClose className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8">
                    {/* Input Fields Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Campaign Name</label>
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik"
                                placeholder="e.g. Summer Referral Boost"
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Type</label>
                            <select 
                                value={formData.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik appearance-none"
                            >
                                <option value="Booking">Booking</option>
                                <option value="Host Signup">Host Signup</option>
                                <option value="User Signup">User Signup</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-aeonik font-semibold text-slate-900 ml-1">Initial Status</label>
                            <select 
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik appearance-none"
                            >
                                <option value="Active">Active</option>
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
                                className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-aeonik"
                                placeholder="e.g. 10 Points"
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center pt-4">
                        <button 
                            onClick={handleCreate}
                            className="w-[400px] h-[50px] bg-indigo-950 text-white rounded-full font-aeonik font-bold text-base hover:bg-slate-900 transition-all shadow-lg active:scale-95 cursor-pointer"
                        >
                            Create Campaign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCampaignModal;
