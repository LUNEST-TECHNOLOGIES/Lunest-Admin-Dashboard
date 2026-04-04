import React, { useState, useRef, useEffect } from 'react';
import { MdMoreVert } from 'react-icons/md';
import ListingDetailsPopup from '../listings/ListingDetailsPopup';
import ApproveListing from '../listings/ApproveListing';
import RejectListing from '../listings/RejectListing';
import EditListing from '../listings/EditListing';
import DeleteListing from '../listings/DeleteListing';
import AlertNotification from './AlertNotification';
import { useNotification } from '../../../ui/NotificationProvider';
import { approveListing, rejectListing, updateListing, deleteListing } from '../../../../services/adminService';

const ActionMenu = ({ listing, onListingUpdated, isLastItem }) => {
  const notify = useNotification();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <>
      <div className={`w-8 h-8 flex-shrink-0 relative ${isMenuOpen ? 'z-[60]' : 'z-50'}`} ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-full h-full flex items-center justify-center rounded-lg border transition-all cursor-pointer shadow-sm ${
            isMenuOpen 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MdMoreVert className="w-5 h-5" />
        </button>

        {/* Action Menu Dropdown - Overlay below, content left-aligned */}
        {isMenuOpen && (
          <div className={`absolute right-0 ${isLastItem ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white rounded-xl border border-slate-100 shadow-2xl shadow-slate-200/60 z-50 p-1.5 w-44 animate-in fade-in zoom-in duration-200`}>
            <div className="flex flex-col gap-0.5">
              {/* View */}
              <button 
                onClick={() => {
                  setShowDetailsPopup(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-lg flex justify-start items-center gap-3 hover:bg-indigo-50 hover:text-indigo-700 transition-all group cursor-pointer"
              >
                <img src="/assets/icons/action-menu/vuesax/linear/vuesax/linear/eye.svg" alt="View" className="w-4.5 h-4.5 opacity-70 group-hover:opacity-100" />
                <div className="text-xs font-bold font-aeonik">View Details</div>
              </button>

              {/* Approve */}
              <button 
                onClick={() => {
                  setShowApprovePopup(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-lg flex justify-start items-center gap-3 hover:bg-emerald-50 hover:text-emerald-700 transition-all group cursor-pointer"
              >
                <img src="/assets/icons/action-menu/done-v.svg" alt="Approve" className="w-4.5 h-4.5 opacity-70 group-hover:opacity-100" />
                <div className="text-xs font-bold font-aeonik">Approve</div>
              </button>

              {/* Reject */}
              <button 
                onClick={() => {
                  setShowRejectPopup(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-lg flex justify-start items-center gap-3 hover:bg-rose-50 hover:text-rose-700 transition-all group cursor-pointer"
              >
                <img src="/assets/icons/action-menu/close-x.svg" alt="Reject" className="w-4.5 h-4.5 opacity-70 group-hover:opacity-100" />
                <div className="text-xs font-bold font-aeonik">Reject</div>
              </button>

              {/* Edit Info */}
              <button 
                onClick={() => {
                  setShowEditPopup(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-lg flex justify-start items-center gap-3 hover:bg-slate-50 hover:text-slate-900 transition-all group cursor-pointer"
              >
                <img src="/assets/icons/action-menu/vuesax/outline/edit.svg" alt="Edit Info" className="w-4.5 h-4.5 opacity-70 group-hover:opacity-100" />
                <div className="text-xs font-bold font-aeonik">Edit Info</div>
              </button>
              
              <div className="my-1 border-t border-slate-50"></div>

              {/* Delete */}
              <button 
                onClick={() => {
                  setShowDeletePopup(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 rounded-lg flex justify-start items-center gap-3 hover:bg-red-50 hover:text-red-700 transition-all group cursor-pointer"
              >
                <img src="/assets/icons/action-menu/vuesax/linear/vuesax/linear/trash.svg" alt="Delete" className="w-4.5 h-4.5 grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100" 
                  onError={(e) => { e.target.src = "/assets/icons/action-menu/close-x.svg"; }} // Fallback if icon doesn't exist
                />
                <div className="text-xs font-bold font-aeonik">Delete</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listing Details Popup */}
      {showDetailsPopup && (
        <ListingDetailsPopup 
          listing={listing}
          onClose={() => setShowDetailsPopup(false)}
          onListingUpdated={onListingUpdated}
        />
      )}

      {/* Approve Listing Popup */}
      {showApprovePopup && (
        <ApproveListing 
          listing={listing}
          isLoading={isLoading}
          onClose={() => setShowApprovePopup(false)}
          onApprove={async () => {
            try {
              setIsLoading(true);
              const response = await approveListing(listing?.id);
              console.log('Listing approved:', response);
              
              // Show success notification AFTER backend confirms
              notify.success(
                'Listing Approved!',
                `ID: ${listing?.id} - ${listing?.title} - User: ${listing?.hostName} has been approved successfully.`
              );
              
              setShowApprovePopup(false);
              
              // Notify parent to refresh listings
              if (onListingUpdated) {
                onListingUpdated();
              }
            } catch (error) {
              console.error('Error approving listing:', error);
              notify.error(
                'Approval Failed',
                error.response?.data?.message || error.message || 'Failed to approve listing'
              );
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}

      {/* Reject Listing Popup */}
      {showRejectPopup && (
        <RejectListing 
          listing={listing}
          isLoading={isLoading}
          onClose={() => setShowRejectPopup(false)}
          onReject={async (data) => {
            try {
              setIsLoading(true);
              const response = await rejectListing(listing?.id, data.reason);
              console.log('Listing rejected:', response);
              
              // Show error notification AFTER backend confirms
              notify.error(
                'Listing Rejected!',
                `ID: ${listing?.id} - ${listing?.title} - User: ${listing?.hostName} has been rejected. Reason: ${data.reason || 'No reason provided'}`
              );
              
              setShowRejectPopup(false);
              
              // Notify parent to refresh listings
              if (onListingUpdated) {
                onListingUpdated();
              }
            } catch (error) {
              console.error('Error rejecting listing:', error);
              notify.error(
                'Rejection Failed',
                error.response?.data?.message || error.message || 'Failed to reject listing'
              );
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}

      {/* Edit Listing Popup */}
      {showEditPopup && (
        <EditListing 
          listing={listing}
          isLoading={isLoading}
          onClose={() => setShowEditPopup(false)}
          onSave={async (data) => {
            try {
              setIsLoading(true);
              const response = await updateListing(listing?.id, data);
              console.log('Listing updated:', response);
              
              // Show success notification AFTER backend confirms
              notify.success(
                'Listing Updated!',
                `ID: ${listing?.id} - ${data.title || listing?.title} - User: ${listing?.hostName} has been updated successfully.`
              );
              
              setShowEditPopup(false);
              
              // Notify parent to refresh listings
              if (onListingUpdated) {
                onListingUpdated();
              }
            } catch (error) {
              console.error('Error updating listing:', error);
              notify.error(
                'Update Failed',
                error.response?.data?.message || error.message || 'Failed to update listing'
              );
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}

      {/* Delete Listing Popup */}
      {showDeletePopup && (
        <DeleteListing 
          listing={listing}
          isOpen={showDeletePopup}
          onClose={() => setShowDeletePopup(false)}
          onDeleted={() => {
              if (onListingUpdated) {
                  onListingUpdated();
              }
          }}
        />
      )}

      {/* Alert Notification */}
      {alert && (
        <AlertNotification
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
          duration={3000}
        />
      )}
    </>
  );
};

export default ActionMenu;
