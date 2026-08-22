import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAdminTransactions, getAdminTransactionSummary, exportAdminTransactions, manualWalletAdjustment, resolveCautionFee } from '../services/adminService';
import ResolveCautionModal from '../components/dashboard/management/bookings/ResolveCautionModal';

const FinancialManagement = () => {
  const [activeMenu, setActiveMenu] = useState('Financial Management');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef(0);
  const DEBOUNCE_MS = 300;
  const [summary, setSummary] = useState(null);
  const [allTimeSummary, setAllTimeSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All Transactions');
  
  // Default to minimum 1 month ago
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({ userId: '', amount: '', type: 'CREDIT', description: '' });
  const [adjusting, setAdjusting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  
  // State for booking breakdown expansion
  const [expandedBookings, setExpandedBookings] = useState({});
  
  // Prevent duplicate actions
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [selectedBookingForCaution, setSelectedBookingForCaution] = useState(null);

  const tabs = [
    'All Transactions',
    'Guest Payments',
    'Booking Breakdown',
    'Host Earnings',
    'Withdrawals',
    'Wallet Actions',
    'App Fees',
    'VAT',
    'Caution Fees',
    'Coupons',
    'Refunds',
    'Cancellations',
    'Rewards'
  ];

  const statusOptions = ['All', 'ON_HOLD', 'COMPLETED', 'FAILED', 'PROCESSING'];

  // Centralized filter function to eliminate duplication - SYNCED WITH BACKEND CATEGORIES
  const getTabFilters = (tab) => {
    const filters = {};
    
    switch (tab) {
      case 'Booking Breakdown':
        // Show full booking trail (Guest Payment, Host Payout, Platform Fees, VAT, Caution)
        filters.category = 'BOOKING,RENT_AND_SERVICE,RENT,SERVICE_CHARGE,PLATFORM_FEE,VAT,SECURITY_DEPOSIT,HOST_EARNING';
        filters.groupByBooking = true;
        break;
      case 'Guest Payments':
        filters.category = 'BOOKING,COUPON_PAYMENT';
        filters.type = 'DEBIT';
        break;
      case 'Host Earnings':
        // Only show HOST_EARNING to avoid duplicates
        // RENT and SERVICE_CHARGE are legacy categories that are now part of HOST_EARNING
        filters.category = 'HOST_EARNING';
        filters.type = 'CREDIT';
        filters.showInternal = true; // Show the net summary which is marked as internal
        break;

      case 'Withdrawals':
        filters.category = 'WITHDRAWAL';
        break;
      case 'App Fees':
        filters.category = 'PLATFORM_FEE';
        break;

      case 'VAT':
        filters.category = 'VAT';
        break;

      case 'Caution Fees':
        filters.category = 'SECURITY_DEPOSIT';
        break;
      case 'Coupons':
        filters.category = 'COUPON_PAYMENT';
        break;
      case 'Wallet Actions':
        filters.category = 'TOP_UP,ADJUSTMENT,TRANSFER,ADDED_FUNDS';
        break;
      case 'Refunds':
        filters.category = 'REFUND,CANCELLATION_REFUND,CANCELLATION_PENALTY,CANCELLATION_CREDIT';
        break;
      case 'Rewards':
        filters.category = 'REWARD,CASH_REWARD';
        break;
      case 'Cancellations':
        filters.category = 'CANCELLATION_REFUND,CANCELLATION_PENALTY,CANCELLATION_CREDIT';
        break;
      default:
        // 'All Transactions' - no filters
        break;
    }
    
    return filters;
  };

  const fetchData = useCallback(async () => {
    // Prevent rapid re-fetching (debounce)
    const now = Date.now();
    if (now - lastFetchRef.current < DEBOUNCE_MS) {
      console.log('[FinancialManagement] Fetch debounced');
      return;
    }
    lastFetchRef.current = now;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const filters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      if (search) filters.search = search;
      if (statusFilter !== 'All') filters.status = statusFilter;
      
      // Apply tab-specific filters using centralized function
      const tabFilters = getTabFilters(activeTab);
      Object.assign(filters, tabFilters);

      // Debug logging for tab filter validation
      console.log('[FinancialManagement] Tab Filter Applied:', {
        activeTab,
        filters: tabFilters,
        finalFilters: filters
      });

      console.log('[FinancialManagement] Fetching with filters:', filters);

      const [summaryRes, transRes, allTimeRes] = await Promise.all([
        getAdminTransactionSummary({ startDate: filters.startDate, endDate: filters.endDate }, abortControllerRef.current.signal),
        getAdminTransactions({ ...filters, page: pagination.page, limit: pagination.limit }, abortControllerRef.current.signal),
        // All-time summary (no date filter) for cumulative cancellation/refund/penalty stats
        getAdminTransactionSummary({}, abortControllerRef.current.signal)
      ]);
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      console.log('[FinancialManagement] Summary response:', summaryRes);
      console.log('[FinancialManagement] Transactions response:', transRes);

      if (summaryRes.success && summaryRes.body) {
        const overview = summaryRes.body.overview || summaryRes.body;
        console.log('[FinancialManagement] Full summary response:', summaryRes.body);
        console.log('[FinancialManagement] Overview data:', overview);
        console.log('[FinancialManagement] App Fees Only:', overview.appFeesOnly);
        console.log('[FinancialManagement] App Fee Transaction Count:', overview.appFeeTransactionCount);
        console.log('[FinancialManagement] Platform Fees:', overview.platformFees);
        console.log('[FinancialManagement] VAT Revenue:', overview.totalVatRevenue);
        
        // Financial integrity checks
        const metrics = calculateFinancialMetrics(overview);
        if (metrics) {
          console.log('[FinancialManagement] === FINANCIAL INTEGRITY CHECK ===');
          console.log('[FinancialManagement] Revenue Integrity:', metrics.revenueIntegrity ? '✅ PASS' : '❌ FAIL');
          console.log('[FinancialManagement] Balance Integrity:', metrics.balanceIntegrity ? '✅ PASS' : '❌ FAIL');
          console.log('[FinancialManagement] All Positive Values:', metrics.allPositive ? '✅ PASS' : '❌ FAIL');
          console.log('[FinancialManagement] Overall Financial Health:', metrics.financialHealth ? '✅ HEALTHY' : '⚠️ ISSUES DETECTED');
          
          if (!metrics.revenueIntegrity) {
            console.error('[FinancialManagement] REVENUE INTEGRITY FAILED:', {
              appFeesOnly: metrics.netRevenue,
              vatRevenue: metrics.taxCollected,
              platformFees: metrics.grossRevenue,
              expected: metrics.netRevenue + metrics.taxCollected,
              actual: metrics.grossRevenue
            });
          }
          
          if (!metrics.balanceIntegrity) {
            console.error('[FinancialManagement] BALANCE INTEGRITY FAILED:', {
              totalInflow: metrics.totalInflow,
              totalOutflow: metrics.totalOutflow,
              netBalance: metrics.netSystemBalance
            });
          }
          
          if (!metrics.allPositive) {
            console.error('[FinancialManagement] POSITIVE VALUES CHECK FAILED:', {
              totalInflow: metrics.totalInflow,
              totalOutflow: metrics.totalOutflow,
              platformFees: metrics.grossRevenue,
              appFeesOnly: metrics.netRevenue,
              vatRevenue: metrics.taxCollected
            });
          }
        }
        setSummary(overview);
      }
      // Store all-time summary for cumulative cancellation/refund/penalty stats
      if (allTimeRes?.success && allTimeRes?.body) {
        const allTimeOverview = allTimeRes.body.overview || allTimeRes.body;
        setAllTimeSummary(allTimeOverview);
        console.log('[FinancialManagement] All-time overview (cancellation stats):', {
          totalRefunds: allTimeOverview.totalRefunds,
          refundCount: allTimeOverview.refundCount,
          totalPenalties: allTimeOverview.totalPenalties,
          penaltyCount: allTimeOverview.penaltyCount,
          totalPenaltyRevenue: allTimeOverview.totalPenaltyRevenue,
          totalCouponRefunds: allTimeOverview.totalCouponRefunds,
          couponRefundCount: allTimeOverview.couponRefundCount,
          totalCouponValue: allTimeOverview.totalCouponValue,
          byCategory: allTimeRes.body.byCategory,
        });
      }
      if (transRes.success && transRes.body) {
        const txns = transRes.body.transactions || [];
        console.log('[FinancialManagement] Loaded transactions:', txns.length);
        console.log('[FinancialManagement] Sample transaction with userID:', txns[0]?.userId);
        console.log('[FinancialManagement] Formatted user ID:', txns[0]?.userId?._id || txns[0]?.userId?.id || txns[0]?.userId);
        console.log('[FinancialManagement] All transactions have userID:', txns.every(tx => tx.userId));
        
        // Additional validation for Withdrawals tab
        if (activeTab === 'Withdrawals') {
          console.log('[FinancialManagement] Withdrawals Tab - Transactions Returned:', txns.length);
          console.log('[FinancialManagement] Withdrawals Tab - Sample Transactions:', txns.slice(0, 3).map(tx => ({
            category: tx.category,
            type: tx.type,
            amount: tx.amount,
            status: tx.status,
            reference: tx.reference,
            isInternal: tx.metadata?.internal
          })));
          
          // Filter out any non-withdrawal transactions that might have slipped through
          const actualWithdrawals = txns.filter(tx => tx.category === 'WITHDRAWAL');
          if (actualWithdrawals.length !== txns.length) {
            console.warn('[FinancialManagement] Withdrawals Tab - Non-withdrawal transactions detected:', {
              expected: 'WITHDRAWAL',
              actualCount: actualWithdrawals.length,
              totalCount: txns.length,
              invalidTransactions: txns.filter(tx => tx.category !== 'WITHDRAWAL').map(tx => ({
                category: tx.category,
                reference: tx.reference
              }))
            });
            // Only show actual withdrawals
            setTransactions(actualWithdrawals);
            return; // Skip setting transactions again since we already set them
          }
        }

        // General tab validation - ensure all transactions match the expected categories
        const expectedCategories = tabFilters.category ? tabFilters.category.split(',') : [];
        const invalidTransactions = txns.filter(tx => {
          if (expectedCategories.length === 0) return false; // All transactions tab
          return !expectedCategories.includes(tx.category);
        });

        if (invalidTransactions.length > 0) {
          console.warn('[FinancialManagement] Tab Filter Validation Failed:', {
            activeTab,
            expectedCategories,
            invalidTransactions: invalidTransactions.map(tx => ({
              category: tx.category,
              reference: tx.reference
            }))
          });
          // Filter to only valid transactions
          const validTransactions = txns.filter(tx => expectedCategories.includes(tx.category) || expectedCategories.length === 0);
          setTransactions(validTransactions);
          return;
        }
        setTransactions(txns);
        if (transRes.body.pagination) {
          setPagination(transRes.body.pagination);
        }
      } else if (!transRes.success) {
        console.warn('[FinancialManagement] Transaction fetch failed:', transRes);
        setError(transRes.message || 'Failed to load transactions');
      }
    } catch (err) {
      // Don't update state if request was aborted
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        console.log('[FinancialManagement] Fetch aborted');
        return;
      }
      
      // Only update error state if component is mounted
      if (isMountedRef.current) {
        console.error('Error fetching financial data:', err);
        setError(err.message || 'Failed to load financial data. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pagination.page, activeTab, dateRange, search, statusFilter]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, DEBOUNCE_MS);
    
    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchData();
    }
  };

  const handleExport = async () => {
    try {
      const filters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      if (search) filters.search = search;
      if (statusFilter !== 'All') filters.status = statusFilter;
      
      // Apply tab-specific filters using centralized function
      const tabFilters = getTabFilters(activeTab);
      Object.assign(filters, tabFilters);

      const blob = await exportAdminTransactions(filters);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export transactions');
    }
  };

  const handleAdjustment = async (e) => {
    e.preventDefault();
    setAdjusting(true);
    try {
      const res = await manualWalletAdjustment(adjustmentData);
      if (res.success) {
        alert('Wallet adjusted successfully');
        setShowAdjustmentModal(false);
        setAdjustmentData({ userId: '', amount: '', type: 'CREDIT', description: '' });
        fetchData();
      } else {
        alert(res.message || 'Failed to adjust wallet');
      }
    } catch (err) {
      alert('Error adjusting wallet: ' + err.message);
    } finally {
      setAdjusting(false);
    }
  };

  const handleActionComplete = async (transaction, action) => {
    // Prevent duplicate actions
    const now = Date.now();
    if (isActionInProgress || (now - lastActionTime) < 1000) {
      console.log('[FinancialManagement] Action blocked - duplicate or too rapid');
      return;
    }
    
    setIsActionInProgress(true);
    setLastActionTime(now);
    
    console.log(`[FinancialManagement] Action ${action} executed on transaction:`, transaction);
    
    try {
      // For security deposit transactions, use ResolveCautionModal
      if ((action === 'RELEASE_TO_GUEST' || action === 'RELEASE_TO_HOST' || action === 'VIEW_DETAILS') && 
          transaction.category === 'SECURITY_DEPOSIT') {
        
        console.log(`[FinancialManagement] Opening caution resolution modal for:`, transaction);
        
        const reconciliation = transaction.metadata?.reconciliation || {};
        const isResolved = reconciliation.cautionFeeStatus === 'RELEASED_TO_HOST' || 
                           reconciliation.cautionFeeStatus === 'RELEASED_TO_GUEST' ||
                           (transaction.status === 'COMPLETED' && transaction.category === 'SECURITY_DEPOSIT' && transaction.type === 'CREDIT');

        const mockBooking = {
          id: transaction.metadata?.bookingReference || transaction.metadata?.bookingId || transaction.reference,
          referenceCode: transaction.metadata?.bookingReference || 
                         transaction.metadata?.referenceCode ||
                         (transaction.metadata?.bookingId ? `LNS-${transaction.metadata.bookingId.slice(-8).toUpperCase()}` : transaction.reference),
          cautionFeeRaw: transaction.metadata?.escrowBreakdown?.originalDeposit || transaction.amount || 0,
          currency: 'NGN',
          isResolved: isResolved,
          cautionFeeStatus: reconciliation.cautionFeeStatus || (transaction.type === 'CREDIT' ? 'RELEASED_TO_HOST' : 'PENDING'),
          securityDepositResolution: {
            status: reconciliation.cautionFeeStatus || (transaction.type === 'CREDIT' ? 'RELEASED_TO_HOST' : 'PENDING'),
            cautionFeeStatus: reconciliation.cautionFeeStatus || (transaction.type === 'CREDIT' ? 'RELEASED_TO_HOST' : 'PENDING'),
            reason: reconciliation.resolutionReason || transaction.description,
            resolvedAt: reconciliation.resolvedAt || transaction.createdAt,
            resolvedBy: 'ADMIN',
            claimAmount: transaction.amount || 0
          },
          disputeReason: reconciliation.resolutionReason || transaction.description
        };
        
        setSelectedBookingForCaution(mockBooking);
      } else {
        // Handle other action types
        const actionMessages = {
          'APPROVE_WITHDRAWAL': 'Withdrawal Approved',
          'REJECT_WITHDRAWAL': 'Withdrawal Rejected',
          'APPROVE_PAYOUT': 'Payout Approved',
          'REJECT_PAYOUT': 'Payout Rejected',
          'APPROVE_BOOKING': 'Booking Approved',
          'CANCEL_BOOKING': 'Booking Cancelled',
          'VERIFY_COUPON': 'Coupon Verified',
          'REVERSE_TRANSACTION': 'Transaction Reversed',
          'RELEASE_TO_GUEST': `Released ₦${transaction.amount?.toLocaleString('en-NG')} to guest wallet`,
          'RELEASE_TO_HOST': `Released ₦${transaction.amount?.toLocaleString('en-NG')} to host's balance`
        };
        
        alert(`✓ ${actionMessages[action] || action}\nReference: ${transaction.reference}`);
        // Refresh data
        setTimeout(() => fetchData(), 500);
      }
    } catch (error) {
      console.error('[FinancialManagement] Error executing action:', error);
      alert(`❌ Error: ${error.message || 'Failed to complete action. Please try again.'}`);
    } finally {
      setIsActionInProgress(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'on_hold': return 'bg-orange-100 text-orange-600';
      case 'completed': return 'bg-green-100 text-green-600';
      case 'failed': return 'bg-red-100 text-red-600';
      case 'processing': return 'bg-blue-100 text-blue-600';
      case 'cancelled': return 'bg-gray-100 text-gray-500';
      case 'released to host': return 'bg-indigo-100 text-indigo-600';
      case 'refunded to guest': return 'bg-emerald-100 text-emerald-600';
      case 'held for dispute': return 'bg-amber-100 text-amber-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (amount) => {
    // Handle null, undefined, or non-numeric values
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return '₦0.00';
    }
    const numericAmount = Number(amount);
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount).replace('NGN', '₦');
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

  // Calculate comprehensive financial metrics with proper accounting principles
  const calculateFinancialMetrics = (overview) => {
    if (!overview) return null;

    // Core financial data from backend
    const totalInflow = Number(overview.totalInflow) || 0;           // Money INTO system
    const totalOutflow = Number(overview.totalOutflow) || 0;         // Money OUT of system
    const platformFees = Number(overview.platformFees) || 0;         // Total platform revenue (fees + VAT)
    const appFeesOnly = Number(overview.appFeesOnly) || 0;           // Platform fees only (excluding VAT)
    const vatRevenue = Number(overview.totalVatRevenue) || 0;        // VAT collected
    const hostEarnings = Number(overview.totalHostEarnings) || 0;     // Money paid to hosts (combined rent + service charge + caution claims)
    const hostRentEarnings = Number(overview.hostRentEarnings) || 0;     // Host rent earnings
    const hostServiceChargeEarnings = Number(overview.hostServiceChargeEarnings) || 0;     // Host service charge earnings
    const hostCautionEarnings = Number(overview.hostCautionEarnings) || 0;     // Host caution claim earnings
    const withdrawals = Number(overview.totalWithdrawals) || 0;       // User withdrawals
    const escrowedFunds = Number(overview.totalEscrowFunds) || 0;       // Security deposits on hold
    const failedCount = Number(overview.failedTransactionCount) || 0; // Failed transaction count
    const failedAmount = Number(overview.failedTransactionAmount) || 0; // Failed transaction amount
    const couponValue = Number(overview.totalCouponValue) || 0;      // Coupon discounts
    const appFeeCount = Number(overview.appFeeTransactionCount) || 0; // App fee transactions
    const guestAppFeeCount = Number(overview.guestAppFeeCount) || 0; // Guest app fee count
    const hostAppFeeCount = Number(overview.hostAppFeeCount) || 0; // Host app fee count
    const guestAppFees = Number(overview.guestAppFees) || 0; // Guest app fee amount
    const hostAppFees = Number(overview.hostAppFees) || 0; // Host app fee amount
    const guestVatCount = Number(overview.guestVatCount) || 0; // Guest VAT count
    const hostVatCount = Number(overview.hostVatCount) || 0; // Host VAT count
    const guestVatRevenue = Number(overview.guestVatRevenue) || 0; // Guest VAT amount
    const hostVatRevenue = Number(overview.hostVatRevenue) || 0; // Host VAT amount
    const escrowAppFees = Number(overview.escrowAppFees) || 0; // NEW: App fees from caution resolutions
    const escrowVatRevenue = Number(overview.escrowVatRevenue) || 0; // NEW: VAT from caution resolutions
    const totalRefunds = Number(overview.totalRefunds) || 0; // NEW: Total refunds processed
    const refundCount = Number(overview.refundCount) || 0; // NEW: Number of refunds
    const totalPenalties = Number(overview.totalPenalties) || 0; // NEW: Total cancellation penalties
    const penaltyCount = Number(overview.penaltyCount) || 0; // NEW: Number of penalties
    const totalPenaltyRevenue = Number(overview.totalPenaltyRevenue) || 0; // P3 FIX: Penalties retained by platform (separate from app fees)
    const totalCouponRefunds = Number(overview.totalCouponRefunds) || 0; // NEW: Total refunds as coupons
    const couponRefundCount = Number(overview.couponRefundCount) || 0; // NEW: Number of coupon refunds
    
    // NEW: Booking-specific metrics from backend
    const bookingAppFees = Number(overview.bookingAppFees) || 0;      // App fees from booking payments
    const bookingVAT = Number(overview.bookingVAT) || 0;              // VAT from booking payments
    const totalBookingRevenue = Number(overview.totalBookingRevenue) || 0; // Total from all booking transactions

    // Calculated metrics with proper financial logic
    const netSystemBalance = totalInflow - totalOutflow;            // Net money in system
    const processedVolume = totalInflow + totalOutflow;              // Total transaction volume
    const grossRevenue = platformFees;                              // Total platform revenue
    const netRevenue = appFeesOnly;                                 // Revenue after tax
    const taxCollected = vatRevenue;                                 // VAT collected
    const activeTransactions = (overview.totalTransactions || 0) - failedCount; // Successful transactions
    
    // Validation checks for financial integrity
    const revenueIntegrity = Math.abs((appFeesOnly + vatRevenue) - platformFees) < 0.01;
    const balanceIntegrity = netSystemBalance >= -1000; // Allow small negative for processing
    const allPositive = [totalInflow, totalOutflow, platformFees, appFeesOnly, vatRevenue, hostEarnings, withdrawals, escrowedFunds].every(val => val >= 0);

    return {
      grossRevenue: platformFees,
      appFees: appFeesOnly,
      taxCollected: vatRevenue,
      escrowAppFees,
      escrowVatRevenue,
      netRevenue: platformFees - vatRevenue,
      
      // Transaction Metrics
      totalTransactions: overview.totalTransactions || 0,
      successfulTransactions: activeTransactions,
      failedTransactions: failedCount,
      appFeeTransactions: appFeeCount,
      guestAppFeeCount,
      hostAppFeeCount,
      guestAppFees,
      hostAppFees,
      guestVatCount,
      hostVatCount,
      guestVatRevenue,
      hostVatRevenue,
      escrowAppFees,
      escrowVatRevenue,
      bookingAppFees,
      processedVolume,
      
      // Balance Metrics
      totalInflow,
      totalOutflow,
      netSystemBalance,
      balanceIntegrity,
      
      // Payout Metrics
      hostEarnings,
      hostRentEarnings,
      hostServiceChargeEarnings,
      hostCautionEarnings,
      withdrawals,
      escrowedFunds,
      
      // Caution Fee Metrics
      cautionFeesOnHold: overview.cautionFeesOnHold || 0,
      cautionFeesResolved: overview.cautionFeesResolved || 0,
      cautionFeesFailed: overview.cautionFeesFailed || 0,
      cautionFeesOnHoldCount: overview.breakdowns?.cautionFees?.onHoldCount || 0,
      cautionFeesResolvedCount: overview.breakdowns?.cautionFees?.resolvedCount || 0,
      cautionFeesFailedCount: overview.breakdowns?.cautionFees?.failedCount || 0,
      
      // Discount Metrics
      couponValue,
      
      // Failed Stats
      failedAmount,
      
      // NEW: Booking-specific Revenue Metrics
      bookingAppFees,
      bookingVAT,
      totalBookingRevenue,
      totalRefunds,
      refundCount,
      totalPenalties,
      penaltyCount,
      totalPenaltyRevenue,  // P3 FIX: Penalty revenue tracked separately from app fees
      totalCouponRefunds,
      couponRefundCount,
      
      // Validation
      allPositive,
      financialHealth: revenueIntegrity && balanceIntegrity && allPositive
    };
  };

  // Helper function to toggle booking expansion
  const toggleBookingExpansion = (bookingId) => {
    setExpandedBookings(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  // Helper function to group transactions by booking reference
  const groupTransactionsByBooking = (transactions) => {
    const grouped = {};
    
    transactions.forEach(txn => {
      // Primary grouping key: Booking ID
      const bId = (txn.bookingId?._id || txn.bookingId || txn.metadata?.bookingId)?.toString();
      
      // Fallback: extract booking code from description like #LUNMSXQC7XJ4PILW3
      let descRef = null;
      if (txn.description) {
        const match = txn.description.match(/#([A-Z0-9]{8,})/i);
        if (match) descRef = match[1].toUpperCase();
      }
      
      const groupKey = bId || descRef || txn.metadata?.bookingReference || txn.reference;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          booking: null,
          relatedTransactions: [],
          bookingId: bId,
          groupKey: groupKey
        };
      }
      
      // The parent row should be the primary guest BOOKING payment
      if (txn.category === 'BOOKING' || (txn.type === 'DEBIT' && txn.description?.toLowerCase().includes('booking payment'))) {
        if (!grouped[groupKey].booking) {
          grouped[groupKey].booking = txn;
        } else {
          grouped[groupKey].relatedTransactions.push(txn);
        }
      } else {
        grouped[groupKey].relatedTransactions.push(txn);
      }
    });

    // If no explicit BOOKING parent was found for a group, pick the first transaction as parent
    Object.values(grouped).forEach(g => {
      if (!g.booking && g.relatedTransactions.length > 0) {
        g.booking = g.relatedTransactions[0];
        g.relatedTransactions = g.relatedTransactions.slice(1);
      }
    });
    
    return grouped;
  };

  /**
   * Deduplicate transactions for Caution Fees tab:
   * Group by bookingId so each caution resolution shows as one row, not multiple.
   * Consolidate multiple PLATFORM_FEE rows per booking into one for App Fees tab.
   */
  const deduplicateTransactions = (txns) => {
    if (!txns || txns.length === 0) return txns;

    // For Caution Fees tab: group by bookingId and keep only the most meaningful row
    if (activeTab === 'Caution Fees') {
      const byBooking = {};
      const standalone = [];

      txns.forEach(txn => {
        const bId = txn.bookingId?._id || txn.bookingId || txn.metadata?.bookingId;
        if (!bId) {
          standalone.push(txn);
          return;
        }

        if (!byBooking[bId]) {
          byBooking[bId] = [];
        }
        byBooking[bId].push(txn);
      });

      const deduped = [];
      Object.values(byBooking).forEach(group => {
        if (group.length === 1) {
          deduped.push(group[0]);
          return;
        }

        // Pick the primary row: prefer the one with reconciliation status,
        // otherwise the DEBIT (original hold), then fallback to first
        const withReconciliation = group.find(t => t.metadata?.reconciliation?.cautionFeeStatus);
        const primaryDebit = group.find(t => t.type === 'DEBIT' && !t.metadata?.isDisclosure);
        const primary = withReconciliation || primaryDebit || group[0];

        // Mark remaining as sub-rows
        const others = group.filter(t => t !== primary);
        deduped.push({
          ...primary,
          _isBookingParent: true,
          _bookingRef: primary.reference,
          _relatedCount: others.length,
          _relatedTransactions: others
        });

        // If expanded, add sub-rows
        if (expandedBookings[primary.reference]) {
          others.forEach((sub, idx) => {
            deduped.push({
              ...sub,
              _isRelated: true,
              _parentRef: primary.reference,
              _relatedIndex: idx
            });
          });
        }
      });

      return [...deduped, ...standalone];
    }

    // For App Fees tab: Show individual audited fees (Guest Fee & Host Fee) directly as distinct rows
    if (activeTab === 'App Fees') {
      return txns;
    }

    return txns;
  };

  // Define accounting sort priority for booking breakdown sub-rows
  const getSubRowPriority = (txn) => {
    const cat = txn.category || '';
    const desc = (txn.description || '').toLowerCase();
    const isGuest = txn.type === 'DEBIT' || txn.metadata?.guestSide || txn.metadata?.type === 'GUEST' || desc.includes('guest');
    
    // 1. Guest Rent & Service Charge
    if (cat === 'RENT_AND_SERVICE' || (cat === 'RENT' && isGuest) || (cat === 'SERVICE_CHARGE' && isGuest)) return 1;
    // 2. Guest Platform App Fee
    if (cat === 'PLATFORM_FEE' && isGuest) return 2;
    // 3. Guest VAT
    if (cat === 'VAT' && isGuest) return 3;
    // 4. Initial Caution Escrow Deposit (Guest hold)
    if (cat === 'SECURITY_DEPOSIT' && isGuest && !txn.metadata?.isDisclosure) return 4;
    
    // 5. Host Rent Income
    if (cat === 'RENT' && !isGuest) return 5;
    // 6. Host Service Charge Income
    if (cat === 'SERVICE_CHARGE' && !isGuest) return 6;
    // 7. Host Platform App Fee / Commission
    if (cat === 'PLATFORM_FEE' && !isGuest) return 7;
    // 8. Host VAT
    if (cat === 'VAT' && !isGuest) return 8;
    // 9. Host Net Rental Earnings Summary
    if (cat === 'HOST_EARNING') return 9;
    
    // 10. Caution Deposit Resolution (Host Damage Claim or Guest Refund)
    if (cat === 'SECURITY_DEPOSIT' || cat === 'REFUND') return 10;
    
    return 20;
  };

  // Get booking-related transactions with breakdown
  const getBookingBreakdownData = () => {
    // Apply deduplication for applicable tabs
    const dedupedTransactions = deduplicateTransactions(transactions);

    if (activeTab !== 'Booking Breakdown') return { mainTransactions: dedupedTransactions, hasBreakdown: activeTab === 'Caution Fees' };
    
    // If no transactions, return empty
    if (!transactions || transactions.length === 0) {
      return { mainTransactions: [], hasBreakdown: true };
    }
    
    const grouped = groupTransactionsByBooking(transactions);
    const result = [];
    
    Object.entries(grouped).forEach(([bookingRef, data]) => {
      const parentTxn = data.booking;
      
      if (parentTxn) {
        const related = (data.relatedTransactions || []).filter(r => {
          // Filter out internal interim dispute disclosure rows
          if (r.reference?.startsWith('DIS_G_') || r.reference?.startsWith('FEE_CF_') || r.reference?.startsWith('VAT_CF_')) {
            return false;
          }
          if (r.category === 'SECURITY_DEPOSIT' && r.status === 'RESOLVED' && r.reference?.includes('_security_deposit')) {
            return false;
          }
          return true;
        });
        const metadata = parentTxn.metadata || {};
        
        const hasExplicitFee = related.some(r => r.category === 'PLATFORM_FEE');
        const hasExplicitVat = related.some(r => r.category === 'VAT');
        const hasExplicitRent = related.some(r => r.category === 'RENT' || r.category === 'RENT_AND_SERVICE');
        const hasExplicitCaution = related.some(r => r.category === 'SECURITY_DEPOSIT');
        
        const syntheticSubRows = [];
        
        // 1. Synthetic Subtotal/Rent
        if (!hasExplicitRent && (metadata.subtotalBeforeCoupon || metadata.discountedSubtotal)) {
          syntheticSubRows.push({
            reference: `SUB-${bookingRef.slice(-8)}`,
            category: 'RENT_AND_SERVICE',
            amount: metadata.discountedSubtotal || metadata.subtotalBeforeCoupon,
            type: 'DEBIT',
            description: `Rent & Service Charge (Extracted)`,
            userId: parentTxn.userId,
            createdAt: parentTxn.createdAt,
            status: 'COMPLETED',
            _isRelated: true,
            _isSynthetic: true,
            _parentRef: bookingRef
          });
        }
        
        // 2. Synthetic App Fee
        if (!hasExplicitFee && metadata.guestFee > 0) {
          syntheticSubRows.push({
            reference: `FEE-${bookingRef.slice(-8)}`,
            category: 'PLATFORM_FEE',
            amount: metadata.guestFee,
            type: 'DEBIT',
            description: `Guest Service Fee (Extracted)`,
            userId: parentTxn.userId,
            createdAt: parentTxn.createdAt,
            status: 'COMPLETED',
            _isRelated: true,
            _isSynthetic: true,
            _parentRef: bookingRef
          });
        }
        
        // 3. Synthetic VAT
        if (!hasExplicitVat && metadata.guestVat > 0) {
          syntheticSubRows.push({
            reference: `VAT-${bookingRef.slice(-8)}`,
            category: 'VAT',
            amount: metadata.guestVat,
            type: 'DEBIT',
            description: `VAT on Fee (Extracted)`,
            userId: parentTxn.userId,
            createdAt: parentTxn.createdAt,
            status: 'COMPLETED',
            _isRelated: true,
            _isSynthetic: true,
            _parentRef: bookingRef
          });
        }

        // 4. Synthetic Caution Fee
        if (!hasExplicitCaution && metadata.securityDeposit > 0) {
          syntheticSubRows.push({
            reference: `SEC-${bookingRef.slice(-8)}`,
            category: 'SECURITY_DEPOSIT',
            amount: metadata.securityDeposit,
            type: 'DEBIT',
            description: `Caution Deposit (Held in Escrow)`,
            userId: parentTxn.userId,
            createdAt: parentTxn.createdAt,
            status: 'COMPLETED',
            _isRelated: true,
            _isSynthetic: true,
            _parentRef: bookingRef
          });
        }

        // Sort all sub-rows in live transaction sequence
        const allSubRows = [...related, ...syntheticSubRows].sort((a, b) => {
          return getSubRowPriority(a) - getSubRowPriority(b);
        });

        result.push({
          ...parentTxn,
          _isBookingParent: true,
          _bookingRef: bookingRef,
          _relatedCount: allSubRows.length,
          _relatedTransactions: allSubRows
        });
        
        // Add sorted sub-rows if expanded
        if (expandedBookings[bookingRef]) {
          allSubRows.forEach((relatedTxn, idx) => {
            result.push({
              ...relatedTxn,
              _isRelated: true,
              _parentRef: bookingRef,
              _relatedIndex: idx
            });
          });
        }
      }
    });
    
    // Add any transactions that couldn't be grouped (show them as standalone)
    const groupedTxnIds = new Set();
    Object.values(grouped).forEach(data => {
      if (data.booking) {
        if (data.booking._id) groupedTxnIds.add(data.booking._id.toString());
        if (data.booking.reference) groupedTxnIds.add(data.booking.reference);
      }
      (data.relatedTransactions || []).forEach(rt => {
        if (rt._id) groupedTxnIds.add(rt._id.toString());
        if (rt.reference) groupedTxnIds.add(rt.reference);
      });
    });
    
    transactions.forEach(txn => {
      const txnIdStr = txn._id?.toString();
      const isAlreadyGrouped = (txnIdStr && groupedTxnIds.has(txnIdStr)) || (txn.reference && groupedTxnIds.has(txn.reference));
      const hasBookingLink = txn.bookingId || txn.metadata?.bookingId || txn.metadata?.bookingReference;
      
      // Only include non-booking standalone transactions (e.g. Wallet Funding) to prevent fees/VAT appearing on separate rows
      if (!isAlreadyGrouped && !hasBookingLink) {
        const isExcluded = txn.category === 'COUPON_PAYMENT' || 
                           txn.category === 'TOP_UP' || 
                           txn.type === 'TOP_UP' ||
                           txn.category === 'ADDED_FUNDS' ||
                           txn.category === 'WITHDRAWAL';
        result.push({
          ...txn,
          _isBookingParent: !isExcluded,
          _bookingRef: txn.reference,
          _relatedCount: 0,
          _relatedTransactions: []
        });
      }
    });
    
    console.log('[Booking Breakdown] Result count:', result.length);
    return { mainTransactions: result, hasBreakdown: true };
  };

  const { mainTransactions: displayTransactions, hasBreakdown } = getBookingBreakdownData();
  
  // Memoize financial metrics for efficiency and consistent integrity checks
  const financeMetrics = calculateFinancialMetrics(summary);
  const allTimeFinanceMetrics = calculateFinancialMetrics(allTimeSummary);

  const mainStats = [
    {
      title: 'Gross Revenue',
      value: formatCurrency(financeMetrics?.grossRevenue || 0),
      change: 'Platform Total',
      changeText: 'Fees + VAT (Full Inflow)',
      changeColor: 'text-indigo-600',
      icon: '💰',
      critical: true,
      integrity: financeMetrics?.revenueIntegrity
    },
    {
      title: 'Net Revenue',
      value: formatCurrency(financeMetrics?.netRevenue || 0),
      change: financeMetrics?.grossRevenue > 0 
        ? `${Math.round((financeMetrics?.netRevenue / financeMetrics?.grossRevenue) * 100)}% of Gross` 
        : 'N/A',
      changeText: 'Total App Fees (Net)',
      changeColor: 'text-green-600',
      icon: '🏢',
      critical: true,
      integrity: financeMetrics?.revenueIntegrity
    },
    {
      title: 'VAT Collected',
      value: formatCurrency(financeMetrics?.taxCollected || 0),
      change: '7.5% Tax',
      changeText: `₦${(financeMetrics?.guestVatRevenue || 0).toLocaleString()} Guest + ₦${(financeMetrics?.hostVatRevenue || 0).toLocaleString()} Host`,
      changeColor: 'text-purple-600',
      icon: '🏛️',
      critical: true,
      integrity: financeMetrics?.revenueIntegrity
    },
    {
      title: 'Booking App Fees',
      value: formatCurrency(financeMetrics?.bookingAppFees || 0),
      change: financeMetrics?.bookingAppFees > 0 && financeMetrics?.netRevenue > 0
        ? `${Math.round((financeMetrics?.bookingAppFees / financeMetrics?.netRevenue) * 100)}% of App Fees` 
        : '0%',
      changeText: 'Bundled + Split (Guests)',
      changeColor: 'text-orange-600',
      icon: '📱',
      critical: false,
      integrity: true
    },
    {
      title: 'Booking VAT',
      value: formatCurrency(financeMetrics?.bookingVAT || 0),
      change: financeMetrics?.bookingVAT > 0 && financeMetrics?.taxCollected > 0
        ? `${Math.round((financeMetrics?.bookingVAT / financeMetrics?.taxCollected) * 100)}% of Total VAT` 
        : '0%',
      changeText: 'Extracted from Guest Bookings',
      changeColor: 'text-violet-600',
      icon: '🏧',
      critical: false,
      integrity: true
    },
    {
      title: 'Guest App Fee Count',
      value: financeMetrics?.guestAppFeeCount || 0,
      isNumerical: true,
      change: financeMetrics?.guestAppFees > 0 && financeMetrics?.netRevenue > 0
        ? `${Math.round((financeMetrics?.guestAppFees / financeMetrics?.netRevenue) * 100)}% of Total` 
        : '0%',
      changeText: `₦${(financeMetrics?.guestAppFees || 0).toLocaleString()} Guest Fees`,
      changeColor: 'text-orange-600',
      icon: '📱',
      critical: false,
      integrity: true
    },
    {
      title: 'Host App Fee Count',
      value: financeMetrics?.hostAppFeeCount || 0,
      isNumerical: true,
      change: financeMetrics?.hostAppFees > 0 && financeMetrics?.netRevenue > 0
        ? `${Math.round((financeMetrics?.hostAppFees / financeMetrics?.netRevenue) * 100)}% of Total` 
        : '0%',
      changeText: `₦${(financeMetrics?.hostAppFees || 0).toLocaleString()} Host Fees`,
      changeColor: 'text-indigo-600',
      icon: '🏠',
      critical: false,
      integrity: true
    },
    {
      title: 'Guest VAT Count',
      value: financeMetrics?.guestVatCount || 0,
      isNumerical: true,
      change: financeMetrics?.guestVatRevenue > 0 && financeMetrics?.taxCollected > 0
        ? `${Math.round((financeMetrics?.guestVatRevenue / financeMetrics?.taxCollected) * 100)}% of VAT` 
        : '0%',
      changeText: `₦${(financeMetrics?.guestVatRevenue || 0).toLocaleString()} Guest VAT`,
      changeColor: 'text-purple-600',
      icon: '🧾',
      critical: false,
      integrity: true
    },
    {
      title: 'Host VAT Count',
      value: financeMetrics?.hostVatCount || 0,
      isNumerical: true,
      change: financeMetrics?.hostVatRevenue > 0 && financeMetrics?.taxCollected > 0
        ? `${Math.round((financeMetrics?.hostVatRevenue / financeMetrics?.taxCollected) * 100)}% of VAT` 
        : '0%',
      changeText: `₦${(financeMetrics?.hostVatRevenue || 0).toLocaleString()} Host VAT`,
      changeColor: 'text-teal-600',
      icon: '🏛️',
      critical: false,
      integrity: true
    },
    {
      title: 'Host Payouts',
      value: formatCurrency(financeMetrics?.hostEarnings || 0),
      change: financeMetrics?.hostCautionEarnings > 0 
        ? `${formatCurrency(financeMetrics?.hostRentEarnings || 0)} Rent + ${formatCurrency(financeMetrics?.hostCautionEarnings || 0)} Caution`
        : `${formatCurrency(financeMetrics?.hostRentEarnings || 0)} Rent Payouts`,
      changeText: `${formatCurrency(financeMetrics?.hostServiceChargeEarnings || 0)} Service Fee - ${formatCurrency(financeMetrics?.hostVatRevenue || 0)} Host VAT`,
      changeColor: 'text-cyan-600',
      icon: '👨‍💼',
      critical: false,
      integrity: true
    },
    {
      title: 'Platform Escrow Balance',
      value: formatCurrency(financeMetrics?.escrowedFunds || 0),
      change: 'Active Holds',
      changeText: 'Pending earnings + Security deposits',
      changeColor: 'text-amber-600',
      icon: '⏳',
      critical: false,
      integrity: true
    },
    {
      title: 'Coupon Discounts',
      value: formatCurrency(financeMetrics?.couponValue || 0),
      change: 'Marketing Cost',
      changeText: 'Value redeemed by users',
      changeColor: 'text-pink-600',
      icon: '🎟️',
      critical: false,
      integrity: true
    },
    {
      title: 'Failed Trans.',
      value: financeMetrics?.failedTransactions || 0,
      isNumerical: true,
      change: formatCurrency(financeMetrics?.failedAmount || 0),
      changeText: 'Value of failed payments',
      changeColor: 'text-red-600',
      icon: '❌',
      critical: false,
      integrity: true
    },
    {
      title: 'Resolution Revenue',
      value: formatCurrency((financeMetrics?.escrowAppFees || 0) + (financeMetrics?.escrowVatRevenue || 0)),
      change: `${formatCurrency(financeMetrics?.escrowAppFees || 0)} Fees`,
      changeText: `${formatCurrency(financeMetrics?.escrowVatRevenue || 0)} VAT (Resolution Claims)`,
      changeColor: 'text-emerald-700',
      icon: '🛡️',
      critical: false,
      integrity: true
    },
  ];

  // Cancellation & Refund stats — shown in a dedicated section
  const cancellationStats = [
    {
      title: 'Cash Refunds Issued',
      value: formatCurrency(allTimeFinanceMetrics?.totalRefunds || 0),
      count: allTimeFinanceMetrics?.refundCount || 0,
      countLabel: 'refund transactions',
      changeText: 'Total cash returned to guest wallets',
      changeColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      bgColor: 'bg-rose-50',
      icon: '↩️',
    },
    {
      title: 'Penalties Collected',
      value: formatCurrency(allTimeFinanceMetrics?.totalPenalties || 0),
      count: allTimeFinanceMetrics?.penaltyCount || 0,
      countLabel: 'penalty transactions',
      changeText: 'Cancellation penalties deducted from guests',
      changeColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50',
      icon: '⚠️',
    },
    {
      title: 'Penalty Platform Revenue',
      value: formatCurrency(allTimeFinanceMetrics?.totalPenaltyRevenue || 0),
      count: null,
      countLabel: null,
      changeText: 'Portion of penalties retained by platform',
      changeColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      bgColor: 'bg-orange-50',
      icon: '🏦',
    },
    {
      title: 'Credit Refunds Issued',
      value: formatCurrency(allTimeFinanceMetrics?.totalCouponRefunds || 0),
      count: allTimeFinanceMetrics?.couponRefundCount || 0,
      countLabel: 'credit coupon refunds',
      changeText: 'Refunds issued as LUNEST credit coupons',
      changeColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50',
      icon: '🎟️',
    },
  ];

  // Legacy alias for any remaining references
  const stats = mainStats;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar activeMenu={activeMenu} onMenuSelect={setActiveMenu} />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Financial Health Alert */}
            {summary && !financeMetrics?.financialHealth && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">Financial Data Integrity Alert</h3>
                    <p className="text-xs text-red-600 mt-1">
                      Some financial metrics show inconsistencies. Please review the backend calculations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards - Main Financials */}
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Financial Overview</h2>
            </div>
            {/* Compact Main Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 mb-5">
              {mainStats.map((stat, index) => (
                <div key={index} className={`bg-white rounded-xl shadow-xs border ${stat.critical && !stat.integrity ? 'border-red-300 bg-red-50/20' : 'border-slate-200/80'} p-3 hover:shadow-md transition-all relative flex flex-col justify-between`}>
                  {stat.critical && (
                    <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${stat.integrity ? 'bg-green-500' : 'bg-red-500'}`} title={stat.integrity ? 'Data Integrity OK' : 'Data Integrity Issue'}></div>
                  )}
                  
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className={`w-6 h-6 ${stat.critical && !stat.integrity ? 'bg-red-50' : 'bg-blue-50/80'} rounded-lg flex items-center justify-center text-xs shadow-xs shrink-0`}>
                      {stat.icon}
                    </div>
                    <span className={`text-[10px] font-bold ${stat.changeColor} text-right leading-tight break-words`}>{stat.change}</span>
                  </div>
                  <div>
                    <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-tight mb-0.5">{stat.title}</h3>
                    <p className="text-sm sm:text-base font-black text-slate-900 font-mono leading-none my-1">{stat.value}</p>
                    <p className="text-[9px] text-slate-400 leading-tight break-words mt-0.5">{stat.changeText}</p>
                    
                    {stat.critical && !stat.integrity && (
                      <div className="mt-1 text-[9px] text-red-600 font-bold">
                        ⚠️ Issue
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Compact Cancellations & Refunds Section */}
            <div className="mb-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Cancellations &amp; Refunds</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
              {cancellationStats.map((stat, index) => (
                <div key={index} className={`bg-white rounded-xl shadow-xs border ${stat.borderColor} p-3 hover:shadow-md transition-all flex flex-col justify-between`}>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className={`w-6 h-6 ${stat.bgColor} rounded-lg flex items-center justify-center text-xs shrink-0`}>
                      {stat.icon}
                    </div>
                    {stat.count !== null && (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 rounded-md px-1.5 py-0.2">
                        {stat.count} {stat.countLabel}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-tight mb-0.5">{stat.title}</h3>
                    <p className={`text-sm sm:text-base font-black ${stat.changeColor} font-mono leading-none my-1`}>{stat.value}</p>
                    <p className="text-[9px] text-slate-400 leading-tight break-words mt-0.5">{stat.changeText}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-xs font-bold">⚠️ {error}</p>
              </div>
            )}

            {/* Transactions Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border-b border-slate-200/80">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-1.5 p-2 bg-white border-b border-slate-100">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {status === 'All' ? 'All Status' : status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="p-3 border-b border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                  <div className="flex-1 max-w-sm w-full">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search ref or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
                      />
                      <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center w-full sm:w-auto justify-end">
                    <button 
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-full hover:bg-slate-50 cursor-pointer transition-colors shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(dateRange.startDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })} - {new Date(dateRange.endDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    </button>
                    
                    {showDatePicker && (
                      <div className="absolute right-0 top-12 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-4">
                        <h4 className="font-semibold text-gray-900 mb-4">Filter by Date</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input 
                              type="date" 
                              value={dateRange.startDate}
                              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input 
                              type="date" 
                              value={dateRange.endDate}
                              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => setShowDatePicker(false)}
                              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => {
                                setShowDatePicker(false);
                                setPagination(prev => ({ ...prev, page: 1 }));
                                fetchData();
                              }}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium cursor-pointer transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-900 rounded-full hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </button>
                    
                    <button 
                      onClick={() => setShowAdjustmentModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 font-medium cursor-pointer transition-colors"
                    >
                      <span className="text-lg">+</span>
                      Manual Adjustment
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-black text-slate-600">
                    <tr>
                      <th className="px-3.5 py-2.5 min-w-[130px]">Reference</th>
                      <th className="px-3.5 py-2.5 min-w-[150px]">User Details</th>
                      <th className="px-3 py-2.5 min-w-[100px]">Category</th>
                      <th className="px-3 py-2.5 text-center min-w-[95px]">Amount</th>
                      <th className="px-3.5 py-2.5 min-w-[160px]">Description</th>
                      <th className="px-4 py-2.5 min-w-[145px]">Date</th>
                      <th className="px-2 py-2.5 text-center w-20">Status</th>
                      <th className="px-3 py-2.5 text-right w-24">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-slate-400 font-medium">Loading transactions...</td>
                      </tr>
                    ) : displayTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-slate-600">No {activeTab} Found</p>
                            <p className="text-xs">There are no transactions matching your current filters.</p>
                            <button 
                              onClick={() => {
                                setDateRange({
                                  startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0],
                                  endDate: new Date().toISOString().split('T')[0]
                                });
                              }}
                              className="mt-3 text-blue-600 font-bold hover:underline text-xs"
                            >
                              Expand date range
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayTransactions.map((transaction, index) => (
                        <tr 
                          key={index} 
                          className={`hover:bg-slate-50/90 transition-colors ${
                            transaction._isRelated ? 'bg-slate-50/60' : ''
                          } ${transaction._isBookingParent ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (transaction._isBookingParent && hasBreakdown) {
                              toggleBookingExpansion(transaction._bookingRef);
                            }
                          }}
                        >
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-1.5">
                              {transaction._isBookingParent && hasBreakdown && (
                                <button 
                                  className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookingExpansion(transaction._bookingRef);
                                  }}
                                >
                                  <svg 
                                    className={`w-3.5 h-3.5 transform transition-transform ${
                                      expandedBookings[transaction._bookingRef] ? 'rotate-90 text-blue-600' : ''
                                    }`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                              {transaction._isRelated && (
                                <span className="w-3"></span>
                              )}
                              <span className={`px-2 py-0.5 bg-indigo-50 border border-indigo-200/80 rounded-md text-[10px] font-bold text-indigo-700 font-mono tracking-tight ${
                                transaction._isRelated ? 'opacity-80' : ''
                              }`}>
                                {transaction.reference || 'N/A'}
                              </span>
                              {transaction._isBookingParent && transaction._relatedCount > 0 && (
                                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                                  +{transaction._relatedCount}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-2">
                            <div className="flex flex-col min-w-0 max-w-[200px]">
                              <span className="font-bold text-slate-900 text-[11px] leading-tight break-words">{transaction.userId?.fullName || 'N/A'}</span>
                              <span className="text-[10px] text-slate-500 leading-tight break-words mt-0.5">{transaction.userId?.emailAddress || 'N/A'}</span>
                              {transaction.category === 'SECURITY_DEPOSIT' && transaction.metadata?.reconciliation?.cautionFeeStatus && transaction.metadata?.reconciliation?.cautionFeeStatus !== 'ON_HOLD' && (
                                <div className="flex flex-col gap-0.5 mt-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md inline-block w-fit ${
                                    transaction.metadata.reconciliation.cautionFeeStatus === 'RELEASED_TO_GUEST' ? 'bg-green-50 text-green-600 border border-green-200' :
                                    transaction.metadata.reconciliation.cautionFeeStatus === 'RELEASED_TO_HOST' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                                    transaction.metadata.reconciliation.cautionFeeStatus === 'DISPUTED' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
                                  }`}>
                                    {transaction.metadata.reconciliation.cautionFeeStatus === 'RELEASED_TO_GUEST' ? 'Released to Guest' :
                                     transaction.metadata.reconciliation.cautionFeeStatus === 'RELEASED_TO_HOST' ? 'Released to Host' :
                                     transaction.metadata.reconciliation.cautionFeeStatus === 'DISPUTED' ? 'Caution Disputed' : 
                                     transaction.metadata.reconciliation.cautionFeeStatus}
                                  </span>
                                  {transaction.metadata?.reconciliation?.resolutionReason && (
                                    <span className="text-[9px] text-slate-500 italic leading-tight break-words mt-0.5">
                                      Note: {transaction.metadata.reconciliation.resolutionReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              transaction.category === 'CANCELLATION_PENALTY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              transaction.category === 'CANCELLATION_REFUND' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              transaction.category === 'CANCELLATION_CREDIT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              transaction.category === 'TOP_UP' || transaction.type === 'TOP_UP' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                              transaction._isRelated 
                                ? 'bg-blue-50/70 text-blue-700 border-blue-100' 
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {transaction.category === 'TOP_UP' || transaction.type === 'TOP_UP' || transaction.category === 'ADDED_FUNDS'
                                ? 'Wallet Funding'
                                : transaction.category === 'CANCELLATION_REFUND' && (transaction.description?.includes('Caution') || transaction.metadata?.isCautionRefund || transaction.metadata?.cautionPaid) 
                                  ? 'Caution Fee Refund' 
                                  : (transaction.category?.replace(/_/g, ' ') || transaction.type)}
                              {transaction._bookingRef && (
                                <span className="ml-1 text-blue-600 font-semibold text-[9px]">
                                  (#{transaction._bookingRef.slice(-6)})
                                </span>
                              )}
                            </span>
                          </td>
                          <td className={`px-3 py-2 text-center font-mono font-black text-xs whitespace-nowrap ${
                            transaction.metadata?.isDisclosure ? 'text-slate-400' :
                            transaction._isRelated ? 'text-slate-600' : 'text-slate-900'
                          }`}>
                            {transaction.metadata?.isDisclosure ? '' : (transaction.type === 'CREDIT' ? '+' : transaction.type === 'DEBIT' ? '-' : '')} 
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-3.5 py-2 text-[11px] text-slate-600 max-w-[260px] leading-snug break-words">
                            {transaction.description}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-700">
                                {new Date(transaction.createdAt || transaction.timestamp).toLocaleDateString('en-NG', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-medium">
                                {new Date(transaction.createdAt || transaction.timestamp).toLocaleTimeString('en-NG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {!transaction._isRelated && (
                              <FinancialTransactionActions 
                                transaction={transaction}
                                onActionComplete={handleActionComplete}
                              />
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button 
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-600">Previous</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Next</span>
                  <button 
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Manual Wallet Adjustment</h3>
              <button 
                onClick={() => setShowAdjustmentModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  required
                  placeholder="Paste User MongoDB ID"
                  value={adjustmentData.userId}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, userId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    value={adjustmentData.amount}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Action Type</label>
                  <select
                    value={adjustmentData.type}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="CREDIT">Credit Wallet (+)</option>
                    <option value="DEBIT">Deduct Wallet (-)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason / Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Why is this adjustment happening?"
                  value={adjustmentData.description}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2 font-noto">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="flex-1 px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adjusting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Caution Resolution Modal Overlay */}
      {selectedBookingForCaution && (
        <ResolveCautionModal 
          booking={selectedBookingForCaution}
          onClose={() => setSelectedBookingForCaution(null)}
          onResolve={() => {
            fetchData();
            setSelectedBookingForCaution(null);
          }}
        />
      )}
    </div>
  );
};

export default FinancialManagement;
