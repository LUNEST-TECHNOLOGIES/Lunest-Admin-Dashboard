import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useNotification } from '../../../ui/NotificationProvider';
import { resolveCautionFee } from '../../../../services/adminService';

const ResolveCautionModal = ({ booking, onClose, onResolve }) => {
  const notify = useNotification();
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('RELEASE_TO_GUEST'); // Default action
  const [claimAmount, setClaimAmount] = useState(booking?.cautionFeeRaw || 0);
  const [isProcessing, setIsProcessing] = useState(false);

  const cautionAmount = booking?.cautionFeeRaw || 0;
  const currency = booking?.currency || 'NGN';
  const symbol = currency === 'USD' ? '$' : currency === 'GHC' ? '₵' : '₦';

  const handleResolve = async () => {
    if (action === 'RELEASE_TO_HOST' && (claimAmount <= 0 || claimAmount > cautionAmount)) {
      notify.error('Invalid Amount', `Claim amount must be between 1 and ${symbol}${cautionAmount.toLocaleString()}.`);
      return;
    }

    setIsProcessing(true);
    try {
      // Use referenceCode (e.g., LNS-XXX) not MongoDB id for the API endpoint
      const bookingRef = booking?.referenceCode || booking?.id;
      const response = await resolveCautionFee(bookingRef, action, reason.trim(), action === 'RELEASE_TO_HOST' ? claimAmount : cautionAmount);

      if (response.success) {
        notify.success(
          'Caution Resolved',
          `Caution fee for booking ${bookingRef} has been ${action.toLowerCase().replace(/_/g, ' ')}.`
        );
        if (onResolve) onResolve();
        onClose();
      } else {
        notify.error('Resolution Failed', response.message || 'Failed to resolve caution fee.');
      }
    } catch (err) {
      console.error('Error resolving caution fee:', err);
      notify.error('Error', err.response?.data?.message || 'An error occurred during resolution.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 sm:p-8">
      <div className="w-full max-w-[652px] min-h-[420px] relative bg-white rounded-[20px] outline outline-1 outline-offset-[-1px] outline-black overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-black text-xl font-bold font-aeonik">
            Resolve Caution Fee
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <MdClose className="w-5 h-5 text-black" />
          </button>
        </div>

        <div className="p-8 flex-1 flex flex-col gap-6">
          {/* Booking Info Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm font-aeonik">Booking Reference</span>
              <span className="text-slate-900 font-bold font-aeonik">{booking?.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm font-aeonik">Caution Amount</span>
              <span className="text-slate-900 font-bold font-aeonik text-lg">
                {symbol}{cautionAmount.toLocaleString()}
              </span>
            </div>
            {(booking?.securityDepositResolution?.reason || booking?.disputeReason) && (
              <div className="pt-2 border-t border-slate-200/60 mt-2">
                <span className="text-amber-700 text-xs font-bold font-aeonik uppercase tracking-wider block mb-1">
                  Submitted Dispute Reason ({booking?.securityDepositResolution?.resolvedBy || 'Claimant'}):
                </span>
                <p className="text-slate-700 text-sm font-medium bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/50">
                  {booking?.securityDepositResolution?.reason || booking?.disputeReason}
                </p>
              </div>
            )}
          </div>
          
          {/* Zero Caution Fee Message */}
          {cautionAmount === 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-black text-xl">!</div>
              <div className="flex-1">
                <p className="text-amber-900 font-bold text-sm">Zero caution fee to resolve</p>
                <p className="text-amber-700 text-xs">This booking does not have a security deposit held in escrow.</p>
              </div>
            </div>
          )}

          {/* Action Selection */}
          <div className="space-y-3">
            <label className="text-black text-sm font-semibold font-aeonik">
              Resolution Action
            </label>
            <div className={`flex gap-4 ${cautionAmount === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                onClick={() => setAction('RELEASE_TO_GUEST')}
                disabled={cautionAmount === 0}
                className={`flex-1 py-10 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  action === 'RELEASE_TO_GUEST'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-gray-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="font-bold font-aeonik text-lg">Release to Guest</span>
                <span className={`text-xs text-center ${action === 'RELEASE_TO_GUEST' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Full refund of the security deposit to the guest's wallet.
                </span>
              </button>
              
              <button
                onClick={() => setAction('RELEASE_TO_HOST')}
                disabled={cautionAmount === 0}
                className={`flex-1 py-10 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  action === 'RELEASE_TO_HOST'
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="font-bold font-aeonik text-lg">Release to Host</span>
                <span className={`text-xs text-center ${action === 'RELEASE_TO_HOST' ? 'text-slate-100' : 'text-slate-400'}`}>
                  Transfer the security deposit to the host as compensation.
                </span>
              </button>
            </div>
          </div>

          {/* Partial Claim Input (Visible only for Host Release) */}
          {action === 'RELEASE_TO_HOST' && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center">
                <label className="text-black text-sm font-semibold font-aeonik">
                  Claim Amount
                </label>
                <span className="text-xs text-slate-500">
                  Max: {symbol}{cautionAmount.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{symbol}</span>
                <input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(Number(e.target.value))}
                  max={cautionAmount}
                  className="w-full h-12 rounded-xl border border-neutral-300 pl-10 pr-4 text-slate-800 text-lg font-bold font-aeonik focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Any remaining balance will be automatically refunded to the guest.
              </p>
            </div>
          )}

          {/* Reason Input */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-semibold font-aeonik">
              Resolution Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this resolution is being made..."
              className="w-full h-24 rounded-xl border border-neutral-300 p-4 text-slate-800 text-sm font-normal font-inter placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none transition-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 flex justify-end items-center gap-4">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-3 rounded-3xl border border-gray-300 text-slate-600 text-base font-bold font-aeonik hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={isProcessing || cautionAmount === 0}
            className={`px-8 py-3 rounded-3xl text-white text-base font-bold font-aeonik shadow-lg transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 ${
              action === 'RELEASE_TO_GUEST' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Confirm Resolution'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolveCautionModal;
