import React, { useState, useEffect } from 'react';
import { getAdmins, deleteAdmin, getCurrentUser } from '../../../../services/adminService';
import { useNotification } from '../../../ui/NotificationProvider';
import { MdAdd, MdDelete, MdEdit, MdSecurity } from 'react-icons/md';
import CreateAdminModal from './CreateAdminModal';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null); // For editing, if needed later
    const notify = useNotification();
    const currentUser = getCurrentUser();

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await getAdmins();
            setAdmins(response.body || []);
        } catch (error) {
            console.error('Failed to fetch admins:', error);
            notify.error('Error', 'Failed to load admins');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (adminId) => {
        if (!window.confirm('Are you sure you want to remove this admin? This action cannot be undone.')) return;

        try {
            await deleteAdmin(adminId);
            notify.success('Success', 'Admin removed successfully');
            fetchAdmins();
        } catch (error) {
            notify.error('Error', 'Failed to delete admin');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 font-aeonik">Admin Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage platform administrators and their permissions</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <MdAdd className="w-5 h-5" />
                    <span>Add New Admin</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                     <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                     </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Admin User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Permissions</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {admins.map((admin) => (
                                    <tr key={admin._id || admin.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                    {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">{admin.fullName}</div>
                                                    <div className="text-xs text-slate-500">{admin.emailAddress}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {admin._id || admin.id || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                admin.userType === 'SUPERADMIN' 
                                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                                            }`}>
                                                <MdSecurity className="w-3 h-3" />
                                                {admin.userType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {admin.permissions && admin.permissions.length > 0 ? (
                                                    admin.permissions.slice(0, 3).map((perm, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                                            {perm.replace('manage_', '')}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400">No specific permissions</span>
                                                )}
                                                {admin.permissions && admin.permissions.length > 3 && (
                                                    <span className="text-xs text-slate-400">+{admin.permissions.length - 3} more</span>
                                                )}
                                                {admin.userType === 'SUPERADMIN' && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">Full Access</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                admin.active 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                                {admin.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                 {/* Prevent deleting self */}
                                                {currentUser?.sub !== (admin._id || admin.id) && (
                                                    <button 
                                                        onClick={() => handleDelete(admin._id || admin.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete Admin"
                                                    >
                                                        <MdDelete className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateAdminModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchAdmins}
            />
        </div>
    );
};

export default AdminManagement;
