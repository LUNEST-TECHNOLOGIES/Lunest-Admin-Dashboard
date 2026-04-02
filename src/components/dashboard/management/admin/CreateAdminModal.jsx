import React, { useState } from 'react';
import { createAdmin } from '../../../../services/adminService';
import { useNotification } from '../../../ui/NotificationProvider';
import { MdClose, MdCheckCircle } from 'react-icons/md';

const CreateAdminModal = ({ isOpen, onClose, onSuccess }) => {
    const notify = useNotification();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        emailAddress: '',
        password: '',
        role: 'ADMIN',
        gender: 'OTHERS',
        permissions: [] // default empty
    });

    const availablePermissions = [
        { id: 'manage_users', label: 'Manage Users' },
        { id: 'manage_listings', label: 'Manage Listings' },
        { id: 'manage_bookings', label: 'Manage Bookings' },
        { id: 'manage_finance', label: 'View Finance' },
        { id: 'manage_content', label: 'Content Moderation' },
        { id: 'manage_support', label: 'Support Tickets' }
    ];

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionToggle = (permId) => {
        setFormData(prev => {
            const currentPerms = prev.permissions;
            if (currentPerms.includes(permId)) {
                return { ...prev, permissions: currentPerms.filter(p => p !== permId) };
            } else {
                return { ...prev, permissions: [...currentPerms, permId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.fullName || !formData.emailAddress || !formData.password) {
            notify.warning('Required Fields', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await createAdmin(formData);
            notify.success('Success', 'Admin created successfully');
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                fullName: '',
                emailAddress: '',
                password: '',
                role: 'ADMIN',
                gender: 'OTHERS',
                permissions: []
            });
        } catch (error) {
            console.error('Create admin error:', error);
            notify.error('Error', error.response?.data?.message || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900 font-aeonik">Create New Admin</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <MdClose className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                name="emailAddress"
                                value={formData.emailAddress}
                                onChange={handleChange}
                                placeholder="admin@lunest.app"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                            >
                                <option value="ADMIN">Regular Admin</option>
                                <option value="SUPERADMIN">Super Admin</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Super Admins have full access to all features.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHERS">Others</option>
                            </select>
                        </div>

                        {formData.role === 'ADMIN' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Permissions</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {availablePermissions.map(perm => (
                                        <div 
                                            key={perm.id}
                                            onClick={() => handlePermissionToggle(perm.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                                                formData.permissions.includes(perm.id)
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                : 'bg-white border-slate-200 hover:border-indigo-300'
                                            }`}
                                        >
                                            <span className="text-sm font-medium">{perm.label}</span>
                                            {formData.permissions.includes(perm.id) && (
                                                <MdCheckCircle className="w-5 h-5 text-indigo-600" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                    >
                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                        Create Admin
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateAdminModal;
