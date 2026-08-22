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

  // Check if caution fee is already resolved / settled
  const isAlreadyResolved = 
    booking?.isResolved === true ||
    booking?.securityDepositResolution?.status === 'RELEASED_TO_HOST' ||
    booking?.securityDepositResolution?.status === 'RELEASED_TO_GUEST' ||
    booking?.securityDepositResolution?.status === 'RESOLVED' ||
    booking?.securityDepositResolution?.cautionFeeStatus === 'RELEASED_TO_HOST' ||
    booking?.securityDepositResolution?.cautionFeeStatus === 'RELEASED_TO_GUEST' ||
    booking?.cautionFeeStatus === 'RELEASED_TO_HOST' ||
    booking?.cautionFeeStatus === 'RELEASED_TO_GUEST';

  const resolvedStatus = 
    booking?.securityDepositResolution?.cautionFeeStatus || 
    booking?.securityDepositResolution?.status || 
    booking?.cautionFeeStatus || 
    'RESOLVED';

  const resolvedReason = 
    booking?.securityDepositResolution?.reason || 
    booking?.securityDepositResolution?.resolutionReason || 
    booking?.disputeReason || 
    'Settlement completed by Admin';

  const resolvedAt = 
    booking?.securityDepositResolution?.resolvedAt || 
    booking?.resolvedAt;

  const resolvedBy = 
    booking?.securityDepositResolution?.resolvedBy || 
    'ADMIN';

  const handleResolve = async () => {
    if (isAlreadyResolved) {
      notify.info('Already Settled', 'This caution fee has already been resolved and settled.');
      onClose();
      return;
    }

    if (action === 'RELEASE_TO_HOST' && (claimAmount <= 0 || claimAmount > cautionAmount)) {
      notify.error('Invalid Amount', `Claim amount must be between 1 and ${symbol}${cautionAmount.toLocaleString()}.`);
      return;
    }

    setIsProcessing(true);
    try {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-[560px] max-h-[90vh] relative bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Sticky */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-slate-900 text-lg font-bold font-aeonik tracking-tight">
              {isAlreadyResolved ? 'Caution Settlement Details' : 'Resolve Caution Fee'}
            </h2>
            <p className="text-slate-400 text-xs font-medium">
              {isAlreadyResolved ? 'Escrow settlement outcome & receipt' : 'Manage security deposit escrow settlement'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4">
          
          {/* If already resolved, show clean settled status banner */}
          {isAlreadyResolved && (
            <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
              resolvedStatus === 'RELEASED_TO_HOST' 
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950' 
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                resolvedStatus === 'RELEASED_TO_HOST' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                ✓
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider">Settled &amp; Resolved</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    resolvedStatus === 'RELEASED_TO_HOST' ? 'bg-indigo-200/60 text-indigo-800' : 'bg-emerald-200/60 text-emerald-800'
                  }`}>
                    {resolvedStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  This deposit has already been settled and processed through the escrow system.
                </p>
              </div>
            </div>
          )}

          {/* Booking Info Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-aeonik">Booking Reference</span>
              <span className="text-slate-900 font-bold text-sm font-aeonik font-mono">
                {booking?.referenceCode || booking?.id || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-aeonik">Caution Deposit Amount</span>
              <span className="text-slate-900 font-black text-base font-aeonik font-mono">
                {symbol}{cautionAmount.toLocaleString()}
              </span>
            </div>
            
            {/* Resolution Metadata if settled */}
            {isAlreadyResolved && (
              <div className="pt-2 border-t border-slate-200/60 mt-1 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Resolution Status:</span>
                  <span className="font-bold text-slate-900">{resolvedStatus.replace(/_/g, ' ')}</span>
                </div>
                {resolvedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Settled At:</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px]">
                      {new Date(resolvedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Resolved By:</span>
                  <span className="font-bold text-slate-900">{resolvedBy}</span>
                </div>
              </div>
            )}

            {/* Dispute / Resolution Reason */}
            {(resolvedReason || booking?.disputeReason) && (
              <div className="pt-2 border-t border-slate-200/60 mt-1">
                <span className="text-slate-700 text-[11px] font-bold font-aeonik uppercase tracking-wider block mb-1">
                  {isAlreadyResolved ? 'Settlement Reason / Notes:' : `Submitted Dispute Reason (${resolvedBy}):`}
                </span>
                <p className="text-slate-800 text-xs font-medium bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {resolvedReason || booking?.disputeReason}
                </p>
              </div>
            )}
          </div>
          
          {/* Zero Caution Fee Message */}
          {!isAlreadyResolved && cautionAmount === 0 && (
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-black text-sm">!</div>
              <div className="flex-1">
                <p className="text-amber-900 font-bold text-xs">Zero caution fee to resolve</p>
                <p className="text-amber-700 text-[11px]">This booking does not have a security deposit held in escrow.</p>
              </div>
            </div>
          )}

          {/* Interactive Resolution Section (Only visible if NOT already resolved) */}
          {!isAlreadyResolved && (
            <>
              {/* Action Selection */}
              <div className="space-y-2">
                <label className="text-slate-800 text-xs font-bold font-aeonik uppercase tracking-wider">
                  Resolution Action
                </label>
                <div className={`grid grid-cols-2 gap-3 ${cautionAmount === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setAction('RELEASE_TO_GUEST')}
                    disabled={cautionAmount === 0}
                    className={`py-3.5 px-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      action === 'RELEASE_TO_GUEST'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-sm font-aeonik">Release to Guest</span>
                    <span className={`text-[10px] text-center line-clamp-2 ${action === 'RELEASE_TO_GUEST' ? 'text-slate-300' : 'text-slate-400'}`}>
                      Full refund of deposit to guest wallet.
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setAction('RELEASE_TO_HOST')}
                    disabled={cautionAmount === 0}
                    className={`py-3.5 px-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      action === 'RELEASE_TO_HOST'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-sm font-aeonik">Release to Host</span>
                    <span className={`text-[10px] text-center line-clamp-2 ${action === 'RELEASE_TO_HOST' ? 'text-indigo-100' : 'text-slate-400'}`}>
                      Transfer claim to host for damages.
                    </span>
                  </button>
                </div>
              </div>

              {/* Partial Claim Input (Visible only for Host Release) */}
              {action === 'RELEASE_TO_HOST' && (
                <div className="flex flex-col gap-1.5 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <label className="text-indigo-950 text-xs font-bold font-aeonik">
                      Claim Amount to Host
                    </label>
                    <span className="text-[11px] font-bold text-indigo-600">
                      Max: {symbol}{cautionAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{symbol}</span>
                    <input
                      type="number"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(Number(e.target.value))}
                      max={cautionAmount}
                      className="w-full h-10 rounded-lg border border-indigo-200 pl-8 pr-3 text-slate-800 text-sm font-bold font-aeonik bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                    />
                  </div>
                  {claimAmount < cautionAmount && (
                    <p className="text-[11px] text-indigo-700 font-medium">
                      * Remaining {symbol}{(cautionAmount - claimAmount).toLocaleString()} will be automatically refunded to guest.
                    </p>
                  )}
                </div>
              )}

              {/* Reason Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-800 text-xs font-bold font-aeonik uppercase tracking-wider">
                  Resolution Note / Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the outcome of this dispute resolution..."
                  className="w-full h-20 rounded-xl border border-slate-200 p-3 text-slate-800 text-xs font-normal font-inter placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions - Sticky */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-3 sticky bottom-0 z-20">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold font-aeonik hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {isAlreadyResolved ? 'Close' : 'Cancel'}
          </button>
          
          {!isAlreadyResolved && (
            <button
              type="button"
              onClick={handleResolve}
              disabled={isProcessing || cautionAmount === 0}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold font-aeonik shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                action === 'RELEASE_TO_GUEST' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Confirm Resolution'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResolveCautionModal;
