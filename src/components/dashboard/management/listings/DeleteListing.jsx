import React, { useState } from 'react';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { deleteListing } from '../../../../services/adminService';
import { useNotification } from '../../../ui/NotificationProvider';

const DeleteListing = ({ listing, isOpen, onClose, onDeleted }) => {
    const notify = useNotification();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteListing(listing._id || listing.id);
            notify.success(
                'Deleted Successfully',
                `${listing.propertyName || listing.title} has been removed permanently.`
            );
            onDeleted();
            onClose();
        } catch (error) {
            console.error('Error deleting listing:', error);
            notify.error(
                'Deletion Failed',
                error.message || 'Failed to delete listing'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-red-50 p-3 rounded-full">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            disabled={isDeleting}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">
                            Delete Listing?
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">"{listing.propertyName || listing.title}"</span>? 
                            This action cannot be undone and all data associated with this listing will be permanently removed.
                        </p>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 italic">
                                Note: This will also remove the listing from all search results and user bookmarks.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200 active:scale-95"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Yes, Delete'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteListing;
