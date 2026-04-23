import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useNotification } from '../../../ui/NotificationProvider';
import { resolveDispute } from '../../../../services/adminService';

const ResolveDisputeModal = ({ booking, onClose, onResolve }) => {
  const notify = useNotification();
  const [reason, setReason] = useState('');
  const [guestRefundAmount, setGuestRefundAmount] = useState(0);
  const [hostPayoutAmount, setHostPayoutAmount] = useState(0);
  const [targetStatus, setTargetStatus] = useState('CANCELLED');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = booking?.totalAmountRaw || 0;
  const currency = booking?.currency || 'NGN';
  const symbol = currency === 'USD' ? '$' : currency === 'GHC' ? '₵' : '₦';

  const handleResolve = async () => {
    if (!reason.trim()) {
      notify.error('Required Field', 'Please provide a reason for this resolution.');
      return;
    }

    if (guestRefundAmount < 0 || hostPayoutAmount < 0) {
      notify.error('Invalid Amount', 'Amounts cannot be negative.');
      return;
    }

    setIsProcessing(true);
    try {
      const bookingId = booking?.id; // Backend expects the MongoDB ID
      const response = await resolveDispute(
        bookingId, 
        guestRefundAmount, 
        hostPayoutAmount, 
        reason.trim(),
        targetStatus
      );

      if (response.success) {
        notify.success(
          'Dispute Resolved',
          `Dispute for booking #${booking?.referenceCode || bookingId} has been resolved.`
        );
        if (onResolve) onResolve();
        onClose();
      } else {
        notify.error('Resolution Failed', response.message || 'Failed to resolve dispute.');
      }
    } catch (err) {
      console.error('Error resolving dispute:', err);
      notify.error('Error', err.response?.data?.message || 'An error occurred during resolution.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 sm:p-8">
      <div className="w-full max-w-[652px] relative bg-white rounded-[20px] outline outline-1 outline-offset-[-1px] outline-black overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-black text-xl font-bold font-aeonik">
            Resolve Booking Dispute
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <MdClose className="w-5 h-5 text-black" />
          </button>
        </div>

        <div className="p-8 flex-1 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          {/* Booking Info Summary */}
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-700 text-sm font-aeonik">Booking Reference</span>
              <span className="text-amber-900 font-bold font-aeonik">{booking?.referenceCode || booking?.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-700 text-sm font-aeonik">Total Booking Value</span>
              <span className="text-amber-900 font-bold font-aeonik text-lg">
                {symbol}{totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-amber-200">
              <p className="text-[11px] text-amber-800">
                Resolution will finalize the booking. Specify how much should be refunded to the guest vs paid to the host.
              </p>
            </div>
          </div>
          
          {/* Financial Resolution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-black text-sm font-semibold font-aeonik">
                Guest Refund Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{symbol}</span>
                <input
                  type="number"
                  value={guestRefundAmount}
                  onChange={(e) => setGuestRefundAmount(Number(e.target.value))}
                  className="w-full h-12 rounded-xl border border-neutral-300 pl-10 pr-4 text-slate-800 text-lg font-bold font-aeonik focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-black text-sm font-semibold font-aeonik">
                Host Payout Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{symbol}</span>
                <input
                  type="number"
                  value={hostPayoutAmount}
                  onChange={(e) => setHostPayoutAmount(Number(e.target.value))}
                  className="w-full h-12 rounded-xl border border-neutral-300 pl-10 pr-4 text-slate-800 text-lg font-bold font-aeonik focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Resolution Outcome */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-semibold font-aeonik">
              Resolution Outcome (Booking Status)
            </label>
            <div className="flex gap-3">
              {[
                { id: 'CANCELLED', label: 'Cancel & Close', color: 'rose' },
                { id: 'ONGOING', label: 'Resume Stay', color: 'indigo' },
                { id: 'COMPLETED', label: 'Mark Completed', color: 'emerald' },
              ].map((outcome) => (
                <button
                  key={outcome.id}
                  onClick={() => setTargetStatus(outcome.id)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${
                    targetStatus === outcome.id
                      ? (outcome.id === 'CANCELLED' ? 'border-rose-600 bg-rose-600 text-white' : 
                         outcome.id === 'ONGOING' ? 'border-indigo-600 bg-indigo-600 text-white' : 
                         'border-emerald-600 bg-emerald-600 text-white')
                      : 'border-gray-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {outcome.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic">
              * This will be the new status of the booking after resolution.
            </p>
          </div>

          {/* Reason Input */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-semibold font-aeonik">
              Resolution Reason / Notes
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the basis of this resolution..."
              className="w-full h-24 rounded-xl border border-neutral-300 p-4 text-slate-800 text-sm font-normal font-inter placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none transition-all"
            />
            <p className="text-[10px] text-slate-400 italic">
              * This note will be recorded in the internal audit trail.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 flex justify-end items-center gap-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-3 rounded-3xl border border-gray-300 text-slate-600 text-base font-bold font-aeonik hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={isProcessing}
            className="px-8 py-3 rounded-3xl bg-amber-600 text-white text-base font-bold font-aeonik shadow-lg hover:bg-amber-700 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Resolving...</span>
              </div>
            ) : (
              'Resolve Dispute'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolveDisputeModal;
