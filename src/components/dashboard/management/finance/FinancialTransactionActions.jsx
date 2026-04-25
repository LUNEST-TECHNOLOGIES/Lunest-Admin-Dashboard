import React, { useState, useEffect } from 'react';
import { finalizeWithdrawal, verifyWithdrawalStatus, resendWithdrawalOTP } from '../../../../services/adminService';

const Icons = {
  Document: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  ArrowRight: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  ArrowLeft: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  CheckCircle: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  XCircle: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Undo: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
  Eye: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Wallet: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  ShieldCheck: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
};

/**
 * FinancialTransactionActions Component
 */
const FinancialTransactionActions = ({ transaction, onActionComplete }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    return () => setShowDetailModal(false);
  }, [transaction]);

  const getActionButtonsForCategory = () => {
    const category = transaction.category?.toLowerCase() || '';
    const status = transaction.status?.toUpperCase();
    const isPending = status === 'ON_HOLD' || status === 'PENDING';

    if (category === 'security_deposit' || category.includes('caution') || category.includes('deposit')) {
      if (!isPending) return [{ label: 'View', icon: <Icons.Eye />, styleClass: 'bg-slate-50 text-slate-700 hover:bg-slate-100', action: 'VIEW_DETAILS' }];
      return [
        { label: 'To Guest', icon: <Icons.ArrowLeft />, styleClass: 'bg-green-50 text-green-700 hover:bg-green-100', action: 'RELEASE_TO_GUEST' },
        { label: 'To Host', icon: <Icons.ArrowRight />, styleClass: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', action: 'RELEASE_TO_HOST' },
        { label: 'View', icon: <Icons.Eye />, styleClass: 'bg-slate-50 text-slate-700 hover:bg-slate-100', action: 'VIEW_DETAILS' }
      ];
    }

    if (category === 'coupon_payment' || category.includes('coupon') || transaction.type?.includes('COUPON')) {
      if (status === 'VERIFIED' || status === 'COMPLETED') return [{ label: 'Details', icon: <Icons.Eye />, styleClass: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', action: 'VIEW_COUPON' }];
      return [
        { label: 'Verify', icon: <Icons.CheckCircle />, styleClass: 'bg-green-50 text-green-700 hover:bg-green-100', action: 'VERIFY_COUPON' },
        { label: 'View', icon: <Icons.Eye />, styleClass: 'bg-slate-50 text-slate-700 hover:bg-slate-100', action: 'VIEW_COUPON' }
      ];
    }

    if (category.includes('host') || category.includes('rent') || category.includes('earning') || category.includes('service')) {
      if (!isPending) return [{ label: 'Payout', icon: <Icons.Wallet />, styleClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100', action: 'VIEW_PAYOUT' }];
      return [
        { label: 'Approve', icon: <Icons.CheckCircle />, styleClass: 'bg-green-50 text-green-700 hover:bg-green-100', action: 'APPROVE_PAYOUT' },
        { label: 'Reject', icon: <Icons.XCircle />, styleClass: 'bg-red-50 text-red-700 hover:bg-red-100', action: 'REJECT_PAYOUT' }
      ];
    }

    if (category.includes('booking') || category.includes('payment')) {
      if (!isPending) return [{ label: 'View', icon: <Icons.Eye />, styleClass: 'bg-purple-50 text-purple-700 hover:bg-purple-100', action: 'VIEW_BOOKING' }];
      return [
        { label: 'Approve', icon: <Icons.CheckCircle />, styleClass: 'bg-green-50 text-green-700 hover:bg-green-100', action: 'APPROVE_BOOKING' },
        { label: 'Cancel', icon: <Icons.XCircle />, styleClass: 'bg-red-50 text-red-700 hover:bg-red-100', action: 'CANCEL_BOOKING' }
      ];
    }

    if (category.includes('withdrawal')) {
      if (!isPending) return [{ label: 'View', icon: <Icons.Eye />, styleClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100', action: 'VIEW_DETAILS' }];
      return [
        { label: 'Finalize (OTP)', icon: <Icons.ShieldCheck />, styleClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100', action: 'FINALIZE_WITHDRAWAL' },
        { label: 'Verify Status', icon: <Icons.CheckCircle />, styleClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100', action: 'VERIFY_WITHDRAWAL_STATUS' },
        { label: 'Reject', icon: <Icons.XCircle />, styleClass: 'bg-red-50 text-red-700 hover:bg-red-100', action: 'REJECT_WITHDRAWAL' }
      ];
    }

    if (category.includes('vat') || category.includes('tax') || category.includes('platform') || category.includes('fee')) {
      return [
        { label: 'Tax Details', icon: <Icons.Document />, styleClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100', action: 'VIEW_TAX' }
      ];
    }

    if (category.includes('topup') || category.includes('top_up') || category.includes('adjustment')) {
      return [
        { label: 'Wallet', icon: <Icons.Wallet />, styleClass: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100', action: 'VIEW_WALLET' }
      ];
    }

    return [
      { label: 'View', icon: <Icons.Eye />, styleClass: 'bg-slate-50 text-slate-700 hover:bg-slate-100', action: 'VIEW_DETAILS' }
    ];
  };

  const handleAction = (e, action) => {
    // Prevent row clicks from triggering if clicking button
    e.stopPropagation();
    setSelectedAction(action);
    setShowDetailModal(true);
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(Number(amount))) return '₦0.00';
    return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatWalletId = (wallet) => {
    // Handle different wallet ID formats
    if (!wallet) return 'N/A';
    
    // If it's already in LNT format, return as is
    if (typeof wallet === 'string' && wallet.startsWith('LNT')) {
      return wallet;
    }
    
    // If it's an ObjectId, convert to string and format as LNT
    if (typeof wallet === 'object' && wallet._id) {
      return `LNT${wallet._id.slice(-8).toUpperCase()}`;
    }
    
    // If it's a string ID, format as LNT
    if (typeof wallet === 'string') {
      // If it looks like an ObjectId (24 hex chars)
      if (/^[a-f0-9]{24}$/i.test(wallet)) {
        return `LNT${wallet.slice(-8).toUpperCase()}`;
      }
      // If it's already in some format, just ensure LNT prefix
      if (wallet.length >= 8) {
        return `LNT${wallet.slice(-8).toUpperCase()}`;
      }
      return `LNT${wallet.toUpperCase()}`;
    }
    
    return 'N/A';
  };

  const getTransactionDetails = () => {
    const details = {
      Reference: transaction.reference,
      Category: transaction.category?.replace(/_/g, ' ') || transaction.type,
      Amount: formatCurrency(transaction.amount),
      Status: transaction.status,
      Date: new Date(transaction.createdAt || transaction.timestamp).toLocaleString('en-NG', {
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      }),
      User: `${transaction.userId?.fullName || 'N/A'} (${transaction.userId?.emailAddress || 'N/A'})`,
      'User ID': transaction.userId?._id || transaction.userId?.id || transaction.userId || 'N/A',
      Description: transaction.description || 'No description',
    };

    if (transaction.category === 'COUPON_PAYMENT' && transaction.metadata) {
      details['🎟️ Coupon Code'] = transaction.metadata.couponCode || 'N/A';
      if (transaction.metadata.originalAmount !== undefined) {
        details['Original Amount'] = formatCurrency(transaction.metadata.originalAmount);
      }
      if (transaction.metadata.discountAmount !== undefined) {
        details['💰 Total Discount Value'] = formatCurrency(transaction.metadata.discountAmount);
      }
      if (transaction.metadata.finalAmount !== undefined) {
        details['Final Amount'] = formatCurrency(transaction.metadata.finalAmount);
      }
    }

    if (transaction.category === 'SECURITY_DEPOSIT' && transaction.metadata) {
      details['Booking ID'] = transaction.metadata.bookingId || 'N/A';
      details['Booking Reference'] = transaction.metadata.bookingReference || transaction.metadata.referenceCode || `LNS-${transaction.metadata.bookingId?.slice(-8).toUpperCase()}`;
      
      // Show release destination if resolved
      if (transaction.metadata.reconciliation?.cautionFeeStatus && transaction.metadata.reconciliation?.cautionFeeStatus !== 'ON_HOLD') {
        const releaseMap = {
          'RELEASED_TO_GUEST': '↩️ Released to Guest',
          'RELEASED_TO_HOST': '→ Released to Host',
          'DISPUTED': '⚠️ Under Dispute'
        };
        details['💰 Release Status'] = releaseMap[transaction.metadata.reconciliation.cautionFeeStatus] || transaction.metadata.reconciliation.cautionFeeStatus;
      }
      if (transaction.metadata.reconciliation?.releasedTo) {
        details['Released To'] = transaction.metadata.reconciliation.releasedTo === 'GUEST' ? 'Guest Wallet' : 
                                  transaction.metadata.reconciliation.releasedTo === 'HOST' ? 'Host Wallet' : transaction.metadata.reconciliation.releasedTo;
      }
      if (transaction.metadata.reconciliation?.releasedAt) {
        details['Released At'] = new Date(transaction.metadata.reconciliation.releasedAt).toLocaleString('en-NG');
      }
      if (transaction.metadata.reconciliation?.releaseReference) {
        details['Release Reference'] = transaction.metadata.reconciliation.releaseReference;
      }
    }

    return details;
  };

  const actionButtons = getActionButtonsForCategory();

  return (
    <>
      {/* Action Buttons Inline */}
      <div className="flex justify-end items-center gap-1.5 min-w-max">
        {actionButtons.map((btn, idx) => (
          <button
            key={idx}
            onClick={(e) => handleAction(e, btn.action)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${btn.styleClass}`}
            title={btn.label}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex flex-col items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center sm:rounded-t-2xl">
              <h3 className="text-lg font-bold text-white flex gap-2 items-center">
                {selectedAction === 'VIEW_COUPON' ? '🎟️ Coupon Details' :
                 selectedAction === 'VIEW_BOOKING' ? '📖 Booking Information' :
                 selectedAction === 'VIEW_TAX' ? '🏛️ Tax Details' :
                 selectedAction === 'VIEW_WALLET' ? '💳 Wallet Details' :
                 selectedAction === 'RELEASE_TO_GUEST' ? '↩️ Release to Guest' :
                 selectedAction === 'RELEASE_TO_HOST' ? '→ Release to Host' :
                 selectedAction === 'VIEW_PAYOUT' ? '💳 Payout Details' :
                 '📋 Transaction Details'}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-indigo-200 hover:text-white transition-colors"
                title="Close"
              >
                <Icons.XCircle />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
                {Object.entries(getTransactionDetails()).map(([key, value], idx, arr) => {
                  const isDiscountField = key.includes('Discount') || key.includes('💰');
                  const isHighlight = key.includes('💰') || key.includes('🎟️');
                  return (
                    <div key={key} className={`flex justify-between items-start pb-3 ${idx !== arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isHighlight ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {key}
                      </span>
                      <span className={`text-right flex-1 ml-4 text-sm ${isDiscountField ? 'text-green-600 font-bold' : 'text-slate-900 font-medium'}`}>
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons in Modal */}
              {selectedAction === 'FINALIZE_WITHDRAWAL' && (
                <div className="space-y-4 pt-2">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          Confirm OTP to finalize Paystack transfer.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      OTP from Admin Email
                    </label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-3xl font-mono tracking-[0.5em] bg-slate-50"
                      maxLength={6}
                      autoFocus
                    />
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={async () => {
                          setIsProcessing(true);
                          try {
                            const res = await resendWithdrawalOTP(transaction.reference);
                            alert(res.message || 'OTP resent successfully');
                          } catch (err) {
                            alert(err.message || 'Failed to resend OTP');
                          } finally {
                            setIsProcessing(false);
                          }
                        }}
                        disabled={isProcessing}
                        className="text-indigo-600 text-xs font-bold hover:text-indigo-800 transition-colors uppercase tracking-widest"
                      >
                        {isProcessing ? 'Processing...' : 'Resend OTP'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => { setShowDetailModal(false); setOtp(''); }}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isProcessing || otp.length < 5}
                      onClick={async () => {
                        setIsProcessing(true);
                        try {
                          const transferCode = transaction.metadata?.transfer_code;
                          // Note: We now send reference as a fallback so backend can resolve transferCode
                          const res = await finalizeWithdrawal(transferCode, otp, transaction.reference);
                          if (res.success) {
                            setShowDetailModal(false);
                            setOtp('');
                            onActionComplete(transaction, 'WITHDRAWAL_FINALIZED');
                          } else {
                            alert(res.message || 'Failed to finalize');
                          }
                        } catch (err) {
                          alert(err.message);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-indigo-900 text-white rounded-xl hover:bg-indigo-800 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                    >
                      {isProcessing ? 'Finalizing...' : 'Finalize Transfer'}
                    </button>
                  </div>
                </div>
              )}

              {selectedAction === 'RELEASE_TO_GUEST' && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      setIsProcessing(true);
                      try { await onActionComplete?.(transaction, 'RELEASE_TO_GUEST'); setShowDetailModal(false); }
                      finally { setIsProcessing(false); }
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Release to Guest'}
                  </button>
                </div>
              )}

              {selectedAction === 'RELEASE_TO_HOST' && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      setIsProcessing(true);
                      try { await onActionComplete?.(transaction, 'RELEASE_TO_HOST'); setShowDetailModal(false); }
                      finally { setIsProcessing(false); }
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Release to Host'}
                  </button>
                </div>
              )}

              {selectedAction === 'VERIFY_COUPON' && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      setIsProcessing(true);
                      try { await onActionComplete?.(transaction, 'VERIFY_COUPON'); setShowDetailModal(false); }
                      finally { setIsProcessing(false); }
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Verify Redemption'}
                  </button>
                </div>
              )}

              {(selectedAction === 'APPROVE_PAYOUT' || selectedAction === 'APPROVE_BOOKING' || selectedAction === 'APPROVE_WITHDRAWAL') && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      setIsProcessing(true);
                      try { await onActionComplete?.(transaction, selectedAction); setShowDetailModal(false); }
                      finally { setIsProcessing(false); }
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Approval'}
                  </button>
                </div>
              )}

              {(selectedAction === 'REJECT_PAYOUT' || selectedAction === 'CANCEL_BOOKING' || selectedAction === 'REJECT_WITHDRAWAL') && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      setIsProcessing(true);
                      try { await onActionComplete?.(transaction, selectedAction); setShowDetailModal(false); }
                      finally { setIsProcessing(false); }
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              )}

              {selectedAction === 'VERIFY_WITHDRAWAL_STATUS' && (
                <div className="pt-2">
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
                    <p className="text-sm text-amber-700">
                      Querying Paystack for the latest status of this transfer. If the status has changed on Paystack, it will be updated in the system.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setIsProcessing(true);
                      try {
                        const res = await verifyWithdrawalStatus(transaction.reference);
                        if (res.success) {
                          alert(res.message || 'Status verified successfully');
                          setShowDetailModal(false);
                          onActionComplete(transaction, 'WITHDRAWAL_VERIFIED');
                        } else {
                          alert(res.message || 'Failed to verify status');
                        }
                      } catch (err) {
                        alert(err.message || 'Error occurred during verification');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-bold transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Verifying...' : 'Verify Latest Status'}
                  </button>
                </div>
              )}

              {selectedAction === 'REVERSE_TRANSACTION' && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      setIsProcessing(true);
                      try { await onActionComplete?.(transaction, 'REVERSE_TRANSACTION'); setShowDetailModal(false); }
                      finally { setIsProcessing(false); }
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Reversal'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinancialTransactionActions;
