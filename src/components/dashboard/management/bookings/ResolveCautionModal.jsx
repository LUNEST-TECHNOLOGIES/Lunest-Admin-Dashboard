import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useNotification } from '../../../ui/NotificationProvider';
import { resolveCautionFee } from '../../../../services/adminService';

const ResolveCautionModal = ({ booking, onClose, onResolve }) => {
  const notify = useNotification();
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('RELEASE_TO_GUEST'); // 'RELEASE_TO_GUEST' | 'RELEASE_TO_HOST' | 'PARTIAL_SPLIT'
  
  const cautionAmount = booking?.cautionFeeRaw || 0;
  const currency = booking?.currency || 'NGN';
  const symbol = currency === 'USD' ? '$' : currency === 'GHC' ? '₵' : '₦';

  // State for Partial Split
  const [hostSplitAmount, setHostSplitAmount] = useState(Math.round(cautionAmount / 2));
  const [guestSplitAmount, setGuestSplitAmount] = useState(cautionAmount - Math.round(cautionAmount / 2));
  const [isProcessing, setIsProcessing] = useState(false);

  // Identify who raised the dispute (GUEST vs HOST)
  const disputeOrigin = (
    booking?.disputedBy ||
    booking?.disputeInitiator ||
    booking?.raisedBy ||
    booking?.securityDepositDispute?.raisedBy ||
    (booking?.securityDepositResolution?.resolvedBy === 'HOST' ? 'HOST' : 
     booking?.securityDepositResolution?.resolvedBy === 'GUEST' ? 'GUEST' : 
     booking?.disputeType ? 'GUEST' : null)
  );

  const isDisputed = Boolean(
    booking?.isDisputed || 
    booking?.disputeRaised || 
    booking?.status === 'DISPUTED' || 
    booking?.securityDepositStatus === 'DISPUTED' ||
    disputeOrigin ||
    booking?.disputeReason
  );

  const guestName = booking?.guestName || booking?.userName || booking?.user?.fullName || booking?.bookedBy?.fullName || 'Guest';
  const hostName = booking?.hostName || booking?.host?.fullName || booking?.listing?.host?.fullName || 'Host';

  // Handle bidirectional split balance
  const handleHostAmountChange = (val) => {
    const num = Math.max(0, Math.min(cautionAmount, Number(val) || 0));
    setHostSplitAmount(num);
    setGuestSplitAmount(Math.max(0, cautionAmount - num));
  };

  const handleGuestAmountChange = (val) => {
    const num = Math.max(0, Math.min(cautionAmount, Number(val) || 0));
    setGuestSplitAmount(num);
    setHostSplitAmount(Math.max(0, cautionAmount - num));
  };

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

    if (action === 'PARTIAL_SPLIT') {
      if (hostSplitAmount <= 0 || guestSplitAmount <= 0 || (hostSplitAmount + guestSplitAmount !== cautionAmount)) {
        notify.error('Invalid Split', `Host and Guest amounts must sum to the full caution deposit of ${symbol}${cautionAmount.toLocaleString()}.`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const bookingRef = booking?.referenceCode || booking?.id;
      
      // Determine effective backend action and claimAmount
      let backendAction = action;
      let effectiveClaim = cautionAmount;

      if (action === 'RELEASE_TO_GUEST') {
        backendAction = 'RELEASE_TO_GUEST';
        effectiveClaim = 0;
      } else if (action === 'RELEASE_TO_HOST') {
        backendAction = 'RELEASE_TO_HOST';
        effectiveClaim = cautionAmount;
      } else if (action === 'PARTIAL_SPLIT') {
        backendAction = 'PARTIAL_SPLIT';
        effectiveClaim = hostSplitAmount;
      }

      const response = await resolveCautionFee(bookingRef, backendAction, reason.trim(), effectiveClaim);

      if (response.success) {
        const actionLabel = action === 'PARTIAL_SPLIT' 
          ? `split between Host (${symbol}${hostSplitAmount.toLocaleString()}) and Guest (${symbol}${guestSplitAmount.toLocaleString()})`
          : action.toLowerCase().replace(/_/g, ' ');

        notify.success(
          'Caution Resolved',
          `Caution fee for booking ${bookingRef} has been ${actionLabel}.`
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
      <div className="w-full max-w-[620px] max-h-[92vh] relative bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Sticky */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-slate-900 text-lg font-bold font-aeonik tracking-tight">
              {isAlreadyResolved ? 'Caution Settlement Details' : 'Resolve Caution Fee & Dispute'}
            </h2>
            <p className="text-slate-400 text-xs font-medium">
              {isAlreadyResolved ? 'Escrow settlement outcome & transaction receipt' : 'Adjudicate caution deposit escrow and damage claims'}
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
          
          {/* Dispute Origin Banner */}
          {isDisputed && !isAlreadyResolved && (
            <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              disputeOrigin === 'HOST'
                ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                : 'bg-blue-50/80 border-blue-200 text-blue-950'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                disputeOrigin === 'HOST' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {disputeOrigin === 'HOST' ? 'H' : 'G'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Dispute Raised By:
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    disputeOrigin === 'HOST' 
                      ? 'bg-purple-200 text-purple-900' 
                      : 'bg-blue-200 text-blue-900'
                  }`}>
                    {disputeOrigin === 'HOST' ? `Host (${hostName})` : `Guest (${guestName})`}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {disputeOrigin === 'HOST'
                    ? `Host ${hostName} submitted a property damage or rule violation claim on the security deposit.`
                    : `Guest ${guestName} initiated a caution fee refund request / dispute.`}
                </p>
              </div>
            </div>
          )}

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
                  This caution deposit has already been settled and processed through the escrow system.
                </p>
              </div>
            </div>
          )}

          {/* Booking Info Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs pb-2 border-b border-slate-200/60">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Guest</span>
                <span className="text-slate-800 font-bold">{guestName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Host</span>
                <span className="text-slate-800 font-bold">{hostName}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-aeonik">Booking Reference</span>
              <span className="text-slate-900 font-bold text-sm font-aeonik font-mono">
                {booking?.referenceCode || booking?.id || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-aeonik">Caution Deposit In Escrow</span>
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
                  {isAlreadyResolved ? 'Settlement Reason / Notes:' : `Submitted Dispute Reason (${disputeOrigin || resolvedBy}):`}
                </span>
                <p className="text-slate-800 text-xs font-medium bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  {resolvedReason || booking?.disputeReason}
                </p>
              </div>
            )}
          </div>
          
          {/* Fee & VAT Clarification Notice */}
          <div className="bg-slate-100/70 border border-slate-200/80 p-3 rounded-xl flex items-start gap-2.5">
            <span className="text-slate-400 font-black text-sm">ℹ</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800 font-semibold">Accounting Note:</strong> The platform App Fee (5%) and VAT (7.5%) collected at initial booking covered platform transaction processing. Caution fee release allocates the deposit principal held in escrow.
            </p>
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
              {/* Action Selection (3-Way Choice) */}
              <div className="space-y-2">
                <label className="text-slate-800 text-xs font-bold font-aeonik uppercase tracking-wider">
                  Select Resolution Action
                </label>
                <div className={`grid grid-cols-3 gap-2.5 ${cautionAmount === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                  
                  {/* 1. Release to Guest */}
                  <button
                    type="button"
                    onClick={() => setAction('RELEASE_TO_GUEST')}
                    disabled={cautionAmount === 0}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                      action === 'RELEASE_TO_GUEST'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs font-aeonik">100% to Guest</span>
                    <span className={`text-[10px] leading-tight ${action === 'RELEASE_TO_GUEST' ? 'text-emerald-100' : 'text-slate-400'}`}>
                      Full refund
                    </span>
                  </button>

                  {/* 2. Release to Host */}
                  <button
                    type="button"
                    onClick={() => setAction('RELEASE_TO_HOST')}
                    disabled={cautionAmount === 0}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                      action === 'RELEASE_TO_HOST'
                        ? 'border-purple-600 bg-purple-600 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs font-aeonik">100% to Host</span>
                    <span className={`text-[10px] leading-tight ${action === 'RELEASE_TO_HOST' ? 'text-purple-100' : 'text-slate-400'}`}>
                      Full damage claim
                    </span>
                  </button>

                  {/* 3. Partial Split */}
                  <button
                    type="button"
                    onClick={() => setAction('PARTIAL_SPLIT')}
                    disabled={cautionAmount === 0}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                      action === 'PARTIAL_SPLIT'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs font-aeonik">Partial Split</span>
                    <span className={`text-[10px] leading-tight ${action === 'PARTIAL_SPLIT' ? 'text-indigo-100' : 'text-slate-400'}`}>
                      Custom allocation
                    </span>
                  </button>

                </div>
              </div>

              {/* Partial Split Interactive Sliders & Inputs */}
              {action === 'PARTIAL_SPLIT' && (
                <div className="flex flex-col gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-950 text-xs font-bold font-aeonik">
                      Custom Split Allocation
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 font-mono">
                      Total: {symbol}{cautionAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Host Amount Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-purple-900 block">
                        Host Damage Claim
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
                        <input
                          type="number"
                          value={hostSplitAmount}
                          onChange={(e) => handleHostAmountChange(e.target.value)}
                          max={cautionAmount}
                          min={0}
                          className="w-full h-9 rounded-lg border border-purple-200 pl-7 pr-2 text-slate-800 text-xs font-bold font-mono bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                    </div>

                    {/* Guest Amount Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-900 block">
                        Guest Refund Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
                        <input
                          type="number"
                          value={guestSplitAmount}
                          onChange={(e) => handleGuestAmountChange(e.target.value)}
                          max={cautionAmount}
                          min={0}
                          className="w-full h-9 rounded-lg border border-emerald-200 pl-7 pr-2 text-slate-800 text-xs font-bold font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Split Visual Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${(hostSplitAmount / cautionAmount) * 100}%` }}
                        className="bg-purple-600 h-full transition-all duration-300"
                        title={`Host: ${symbol}${hostSplitAmount.toLocaleString()}`}
                      />
                      <div 
                        style={{ width: `${(guestSplitAmount / cautionAmount) * 100}%` }}
                        className="bg-emerald-600 h-full transition-all duration-300"
                        title={`Guest: ${symbol}${guestSplitAmount.toLocaleString()}`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span className="text-purple-700">Host: {Math.round((hostSplitAmount / cautionAmount) * 100)}%</span>
                      <span className="text-emerald-700">Guest: {Math.round((guestSplitAmount / cautionAmount) * 100)}%</span>
                    </div>
                  </div>
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
                  placeholder="Explain the outcome of this dispute resolution for records and receipts..."
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
                action === 'RELEASE_TO_GUEST' 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : action === 'RELEASE_TO_HOST' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
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
