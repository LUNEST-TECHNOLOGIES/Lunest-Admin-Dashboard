import React, { useState, useRef, useEffect } from 'react';
import { MdMoreVert } from 'react-icons/md';
import { useNotification } from '../../../ui/NotificationProvider';
import RefundReviewModal from './RefundReviewModal';
import AddNoteModal from './AddNoteModal';
import ApplyPenaltyModal from './ApplyPenaltyModal';
import CheckoutWithDisputeModal from './CheckoutWithDisputeModal';
import ResolveCautionModal from './ResolveCautionModal';
import ResolveDisputeModal from './ResolveDisputeModal';
import { 
  approveRefund, 
  updateBookingInternalNote, 
  manualWalletAdjustment,
  updateBooking
} from '../../../../services/adminService';


const BookingActionButton = ({ booking, refresh, isLastItems }) => {

  const notify = useNotification();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showResolveCautionModal, setShowResolveCautionModal] = useState(false);
  const [showResolveDisputeModal, setShowResolveDisputeModal] = useState(false);

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

  const handleRefund = () => {
    setShowRefundModal(true);
    setIsMenuOpen(false);
  };

  const handleAddNote = () => {
    setShowAddNoteModal(true);
    setIsMenuOpen(false);
  };

  const handlePenalizeHost = () => {
    setShowPenaltyModal(true);
    setIsMenuOpen(false);
  };

  const handleCheckout = () => {
    setShowCheckoutModal(true);
    setIsMenuOpen(false);
  };

  const handleResolveDispute = () => {
    setShowResolveDisputeModal(true);
    setIsMenuOpen(false);
  };

  const handleResolveCaution = () => {
    setShowResolveCautionModal(true);
    setIsMenuOpen(false);
  };

  const handleRefundApproval = async (amount) => {
    try {
      await approveRefund(booking.bookingId, amount);
      notify.success('Refund Approved', `Successfully approved refund of ${booking.currency}${amount}`);
      setShowRefundModal(false);
      if (refresh) refresh();
    } catch (error) {
      console.error('Refund approval failed:', error);
      notify.error('Refund Failed', error.response?.data?.message || error.message);
    }
  };

  const handleAddNoteSubmit = async (note) => {
    try {
      await updateBookingInternalNote(booking.referenceCode, note);
      notify.success('Note Added', 'Staff note has been saved to this booking');
      setShowAddNoteModal(false);
      if (refresh) refresh();
    } catch (error) {
      console.error('Adding note failed:', error);
      notify.error('Failed to Add Note', error.response?.data?.message || error.message);
    }
  };

  const handlePenaltySubmit = async (data) => {
    try {
      // Use manual wallet adjustment to apply penalty
      await manualWalletAdjustment({
        userId: booking.listing?.host?._id,
        amount: -Math.abs(data.amount),
        type: 'DEBIT',
        description: `Penalty for booking ${booking.id}: ${data.reason}`
      });
      
      notify.success('Penalty Applied', `Host has been penalized ${booking.currency}${data.amount}`);
      setShowPenaltyModal(false);
      if (refresh) refresh();
    } catch (error) {
      console.error('Applying penalty failed:', error);
      notify.error('Penalty Failed', error.response?.data?.message || error.message);
    }
  };

  const handleCheckoutConfirm = async (checkoutData) => {
    try {
      console.log('Checkout confirmed with data:', checkoutData);
      
      // If there's a dispute, we might need to update the booking status or resolve caution
      if (checkoutData.disputeRaised) {
        await updateBooking(booking.bookingId, { 
          status: 'COMPLETED',
          disputeRaised: true,
          disputeReason: checkoutData.disputeReason 
        });
      } else {
        await updateBooking(booking.bookingId, { status: 'COMPLETED' });
      }

      notify.success('Checkout Confirmed', 'Booking has been marked as completed');
      setShowCheckoutModal(false);
      if (refresh) refresh();
    } catch (error) {
      console.error('Checkout confirmation failed:', error);
      notify.error('Checkout Failed', 'Failed to confirm checkout. Please try again.');
    }
  };

  return (
    <div className={`w-8 h-8 flex-shrink-0 relative ${isMenuOpen ? 'z-[60]' : 'z-50'}`} ref={menuRef}>
      {/* Action Button Trigger */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`w-full h-full flex items-center justify-center rounded-lg border transition-all cursor-pointer shadow-sm ${
          isMenuOpen 
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <MdMoreVert className="w-5 h-5 text-current" />
      </button>

      {/* Action Menu Dropdown */}
      {isMenuOpen && (
        <div className={`absolute right-0 ${isLastItems ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white rounded-xl border border-slate-100 shadow-2xl shadow-slate-200/60 z-50 p-1.5 w-44 animate-in fade-in zoom-in duration-200`}>
          <div className="flex flex-col gap-0.5">
            
            {/* Refund Action - Only available when a refund has been explicitly requested and has not been processed */}
            {(booking.refundRequested || booking.rawStatus === 'REFUND_REQUESTED') && !booking.isRefunded && (
              <button
                onClick={handleRefund}
                className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-rose-50 hover:text-rose-700 transition-all group cursor-pointer"
              >
                <img src="/assets/icons/action-menu/close-x.svg" alt="Refund" className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                <span className="text-xs font-bold">Process Refund</span>
              </button>
            )}

            {/* Add Note Action */}
            <button
              onClick={handleAddNote}
              className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-slate-50 hover:text-slate-900 transition-all group cursor-pointer"
            >
              <img src="/assets/icons/action-menu/vuesax/outline/edit.svg" alt="Add Note" className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              <span className="text-xs font-bold">
                {(booking.securityDepositResolution?.reason || booking.internalNote) && 
                 (booking.cautionFeeStatus?.includes('RELEASED')) 
                 ? 'View Note' : 'Add Staff Note'}
              </span>
            </button>

            {/* Checkout Button - Only for Active (ONGOING) bookings */}
            {booking.status === 'Active' && (
              <button
                onClick={handleCheckout}
                className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-indigo-50 hover:text-indigo-700 transition-all group cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full border-2 border-indigo-400 group-hover:border-indigo-600 border-t-transparent animate-spin-slow" />
                <span className="text-xs font-bold">Confirm Checkout</span>
              </button>
            )}

            {/* Penalize Host Action */}
            <button
              onClick={handlePenalizeHost}
              className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-amber-50 hover:text-amber-700 transition-all group cursor-pointer"
            >
              <div className="w-4 h-4 flex items-center justify-center text-amber-500 font-black">!</div>
              <span className="text-xs font-bold">Penalize Host</span>
            </button>

            {/* Resolve Caution Dispute Button - ONLY for COMPLETED bookings where a DISPUTE was raised on caution fee */}
            {booking.rawStatus === 'COMPLETED' && (booking.disputeRaised || booking.cautionFeeStatus === 'DISPUTED') && (
              <>
                <div className="my-1 border-t border-slate-50"></div>
                <button
                  onClick={handleResolveCaution}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg flex justify-start items-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer"
                >
                  <span className="text-xs font-bold">Resolve Caution Dispute</span>
                </button>
              </>
            )}

            {/* Resolve Booking Dispute Button - Only for DISPUTED status */}
            {booking.rawStatus === 'DISPUTED' && (
              <>
                <div className="my-1 border-t border-slate-50"></div>
                <button
                  onClick={handleResolveDispute}
                  className="w-full px-3 py-2 bg-amber-600 text-white rounded-lg flex justify-start items-center gap-3 hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 cursor-pointer"
                >
                  <span className="text-xs font-bold">Resolve Dispute</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showResolveDisputeModal && (
        <ResolveDisputeModal
          booking={booking}
          onClose={() => setShowResolveDisputeModal(false)}
          onResolve={() => {
            if (refresh) refresh();
          }}
        />
      )}

      {/* Refund Review Modal */}
      {showRefundModal && (
        <RefundReviewModal
          booking={booking}
          onClose={() => setShowRefundModal(false)}
          onApprove={handleRefundApproval}
        />
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <AddNoteModal
          booking={booking}
          onClose={() => setShowAddNoteModal(false)}
          onAddNote={handleAddNoteSubmit}
        />
      )}

      {/* Apply Penalty Modal */}
      {showPenaltyModal && (
        <ApplyPenaltyModal
          booking={booking}
          onClose={() => setShowPenaltyModal(false)}
          onApplyPenalty={handlePenaltySubmit}
        />
      )}

      {/* Checkout with Dispute Modal */}
      {showCheckoutModal && (
        <CheckoutWithDisputeModal
          booking={booking}
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          onConfirm={handleCheckoutConfirm}
        />
      )}

      {/* Resolve Caution Modal */}
      {showResolveCautionModal && (
        <ResolveCautionModal
          booking={booking}
          onClose={() => setShowResolveCautionModal(false)}
          onResolve={refresh}
        />
      )}

    </div>

  );
};

export default BookingActionButton;
