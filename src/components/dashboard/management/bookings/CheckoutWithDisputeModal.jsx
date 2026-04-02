import React, { useState } from 'react';
import { MdClose, MdWarning, MdCheckCircle } from 'react-icons/md';

const CheckoutWithDisputeModal = ({ 
  booking, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeAction, setDisputeAction] = useState('RELEASE_TO_GUEST');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDispute, setHasDispute] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const checkoutData = {
        bookingId: booking.bookingId,
        checkoutConfirmed: true
      };

      // Add dispute data if dispute is being submitted
      if (hasDispute && disputeReason.trim()) {
        checkoutData.disputeReason = disputeReason.trim();
        checkoutData.disputeAction = disputeAction;
      }

      await onConfirm(checkoutData);
      onClose();
    } catch (error) {
      console.error('Checkout confirmation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Confirm Checkout</h3>
            <p className="text-blue-100 text-sm mt-1">
              Booking #{booking.id} - {booking.guestName}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Booking Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Property:</span>
                <p className="font-medium text-gray-900">{booking.listing?.propertyName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Dates:</span>
                <p className="font-medium text-gray-900">{booking.dateRange}</p>
              </div>
              <div>
                <span className="text-gray-500">Guest:</span>
                <p className="font-medium text-gray-900">{booking.guestName}</p>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <p className="font-medium text-gray-900">{booking.amount}</p>
              </div>
            </div>
          </div>

          {/* Caution Fee Dispute Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MdWarning className="w-5 h-5 text-amber-500" />
              <h4 className="font-semibold text-gray-900">Security Deposit / Caution Fee</h4>
            </div>

            <div className="space-y-4">
              {/* Checkbox for dispute */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDispute}
                  onChange={(e) => setHasDispute(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    I want to submit a dispute regarding the security deposit
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Check this if there are issues with the property that require withholding or returning the security deposit
                  </p>
                </div>
              </label>

              {hasDispute && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                  {/* Dispute Action */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dispute Resolution Action
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="disputeAction"
                          value="RELEASE_TO_GUEST"
                          checked={disputeAction === 'RELEASE_TO_GUEST'}
                          onChange={(e) => setDisputeAction(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          Return full security deposit to guest
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="disputeAction"
                          value="RELEASE_TO_HOST"
                          checked={disputeAction === 'RELEASE_TO_HOST'}
                          onChange={(e) => setDisputeAction(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          Withhold security deposit for host
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Dispute Reason */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dispute Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows="4"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="Please provide detailed reason for the security deposit dispute (e.g., property damage, cleaning issues, etc.)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  I confirm that the guest has checked out and the property is vacated
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  This action will mark the booking as completed and trigger any applicable payments
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-all"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <MdCheckCircle className="w-4 h-4" />
                  Confirm Checkout
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutWithDisputeModal;
