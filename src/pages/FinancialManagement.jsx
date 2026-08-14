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
        // Show all booking-related split transactions (RENT_AND_SERVICE, PLATFORM_FEE, VAT, SECURITY_DEPOSIT)
        // BOOKING is now internal summary to avoid double-counting
        filters.category = 'RENT_AND_SERVICE,PLATFORM_FEE,VAT,SECURITY_DEPOSIT';
        filters.type = 'DEBIT';
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
      // For security deposit transactions, use the new ResolveCautionModal
      if ((action === 'RELEASE_TO_GUEST' || action === 'RELEASE_TO_HOST') && 
          transaction.category === 'SECURITY_DEPOSIT') {
        
        console.log(`[FinancialManagement] Opening caution resolution modal for:`, transaction);
        
        // Construct a 'mini-booking' object that the modal expects
        const mockBooking = {
          id: transaction.metadata?.bookingId || transaction.reference,
          referenceCode: transaction.metadata?.bookingReference || 
                         transaction.metadata?.referenceCode ||
                         (transaction.metadata?.bookingId ? `LNS-${transaction.metadata.bookingId.slice(-8).toUpperCase()}` : transaction.reference),
          cautionFeeRaw: transaction.amount || 0,
          currency: 'NGN' // Default
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
      // Extract booking reference from metadata or reference
      let bookingRef = txn.metadata?.bookingReference;
      let bookingId = txn.metadata?.bookingId;
      
      // For BOOKING category, extract base reference to match with related transactions
      if (txn.category === 'BOOKING' || txn.category === 'RENT' || txn.category === 'SERVICE_CHARGE') {
        if (bookingRef) {
          // Use metadata bookingReference if available
          bookingId = bookingId || txn._id;
        } else if (txn.reference) {
          // Extract base reference (e.g., "GUEST_PAYSTACK_abc123_SUMMARY" -> "GUEST_PAYSTACK_abc123")
          const parts = txn.reference.split('_');
          if (parts.length >= 3 && parts[0] === 'GUEST') {
            bookingRef = parts.slice(0, 3).join('_');
          } else if (parts.length >= 2 && parts[0] === 'HOST') {
            bookingRef = parts.slice(0, 2).join('_');
          } else {
            bookingRef = txn.reference;
          }
          bookingId = bookingId || txn._id;
        }
      }
      
      // For related transactions (PLATFORM_FEE, VAT, etc.), link to their parent booking
      if (!bookingRef && txn.reference) {
        // Try multiple patterns to extract booking reference
        // Pattern 1: "GUEST_PAYSTACK_abc123_FEE" -> "GUEST_PAYSTACK_abc123"
        const parts = txn.reference.split('_');
        if (parts.length >= 3 && parts[0] === 'GUEST') {
          bookingRef = parts.slice(0, 3).join('_');
        }
        // Pattern 2: "HOST_EARN_abc123" -> extract base
        else if (parts.length >= 2 && parts[0] === 'HOST') {
          bookingRef = parts.slice(0, 2).join('_');
        }
        // Pattern 3: Use bookingId from metadata if available
        else if (bookingId) {
          bookingRef = `BOOKING_${bookingId}`;
        }
      }
      
      if (bookingRef) {
        if (!grouped[bookingRef]) {
          grouped[bookingRef] = {
            booking: null,
            relatedTransactions: [],
            bookingId: bookingId
          };
        }
        
        // Categorize as parent if it's a main booking-related transaction
        // EXCLUDE COUPON_PAYMENT from parent categories - no breakdown shown
        const isParentCategory = ['BOOKING', 'RENT', 'SERVICE_CHARGE'].includes(txn.category);
        if (isParentCategory) {
          grouped[bookingRef].booking = txn;
        } else {
          grouped[bookingRef].relatedTransactions.push(txn);
        }
      }
    });
    
    return grouped;
  };

  // Get booking-related transactions with breakdown
  const getBookingBreakdownData = () => {
    if (activeTab !== 'Booking Breakdown') return { mainTransactions: transactions, hasBreakdown: false };
    
    // If no transactions, return empty
    if (!transactions || transactions.length === 0) {
      return { mainTransactions: [], hasBreakdown: true };
    }
    
    const grouped = groupTransactionsByBooking(transactions);
    const result = [];
    
    // Debug logging
    console.log('[Booking Breakdown] Grouped bookings:', Object.keys(grouped));
    console.log('[Booking Breakdown] Total transactions:', transactions.length);
    console.log('[Booking Breakdown] Sample transaction:', transactions[0]?.reference, transactions[0]?.category);
    
    Object.entries(grouped).forEach(([bookingRef, data]) => {
      // All groups should have a parent now (BOOKING, RENT, or SERVICE_CHARGE)
      const parentTxn = data.booking;
      
      if (parentTxn) {
        // Pre-calculate synthetic sub-rows to get an accurate count
        const related = data.relatedTransactions || [];
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
            description: `Net subtotal (Extracted)`,
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
            description: `App Fee (Extracted)`,
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
            description: `VAT (Extracted)`,
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
            description: `Caution Fee (Extracted)`,
            userId: parentTxn.userId,
            createdAt: parentTxn.createdAt,
            status: 'COMPLETED',
            _isRelated: true,
            _isSynthetic: true,
            _parentRef: bookingRef
          });
        }

        const totalRelatedCount = related.length + syntheticSubRows.length;

        result.push({
          ...parentTxn,
          _isBookingParent: true,
          _bookingRef: bookingRef,
          _relatedCount: totalRelatedCount,
          _relatedTransactions: related
        });
        
        // Add all sub-rows if expanded
        if (expandedBookings[bookingRef]) {
          const allSubRows = [...related, ...syntheticSubRows];
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
      if (data.booking) groupedTxnIds.add(data.booking._id || data.booking.reference);
      data.relatedTransactions.forEach(rt => groupedTxnIds.add(rt._id || rt.reference));
    });
    
    transactions.forEach(txn => {
      const txnId = txn._id || txn.reference;
      if (!groupedTxnIds.has(txnId)) {
        // Show ungrouped transactions as standalone parents
        // EXCLUDE COUPON_PAYMENT from showing breakdown
        const isCoupon = txn.category === 'COUPON_PAYMENT';
        result.push({
          ...txn,
          _isBookingParent: !isCoupon, // COUPON_PAYMENT is not a parent
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
      change: `${formatCurrency(financeMetrics?.hostRentEarnings || 0)} Host Earning`,
      changeText: `${formatCurrency(financeMetrics?.hostServiceChargeEarnings || 0)} Service - ${formatCurrency(financeMetrics?.hostVatRevenue || 0)} VAT`,
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
              {mainStats.map((stat, index) => (
                <div key={index} className={`bg-white rounded-lg shadow-md border ${stat.critical && !stat.integrity ? 'border-red-300' : 'border-gray-200'} p-6 hover:shadow-lg transition-shadow relative`}>
                  {/* Integrity Indicator for Critical Cards */}
                  {stat.critical && (
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${stat.integrity ? 'bg-green-500' : 'bg-red-500'}`} title={stat.integrity ? 'Data Integrity OK' : 'Data Integrity Issue'}></div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.critical && !stat.integrity ? 'bg-red-50' : 'bg-blue-50'} rounded-full flex items-center justify-center text-xl`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</h3>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="mt-2 flex flex-col items-start gap-1">
                      <span className={`text-xs font-bold ${stat.changeColor}`}>{stat.change}</span>
                      <span className="text-xs text-gray-400">{stat.changeText}</span>
                    </div>
                    
                    {/* Critical Data Warning */}
                    {stat.critical && !stat.integrity && (
                      <div className="mt-2 text-xs text-red-600 font-medium">
                        ⚠️ Data Integrity Issue
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Cancellations & Refunds Section */}
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">Cancellations &amp; Refunds</h2>
              <p className="text-xs text-gray-400 mb-4">Breakdown of cancellation penalties, cash refunds, and credit refunds within the selected date range.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {cancellationStats.map((stat, index) => (
                <div key={index} className={`bg-white rounded-lg shadow-md border ${stat.borderColor} p-6 hover:shadow-lg transition-shadow`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center text-xl`}>
                      {stat.icon}
                    </div>
                    {stat.count !== null && (
                      <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-1">
                        {stat.count} {stat.countLabel}
                      </span>
                    )}
                  </div>
                  <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</h3>
                  <p className={`text-2xl font-bold ${stat.changeColor}`}>{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-2">{stat.changeText}</p>
                  <button
                    className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    onClick={() => {
                      setActiveTab('Cancellations');
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    View transactions →
                  </button>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">⚠️ {error}</p>
              </div>
            )}

            {/* Transactions Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border-b border-slate-100">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      activeTab === tab
                        ? 'bg-blue-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border-b border-slate-100">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {status === 'All' ? 'All Status' : status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="p-4 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search reference or description and press Enter"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 relative">
                    <button 
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
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
                <table className="w-full text-sm">
                  <thead className="bg-indigo-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">User Details</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider min-w-[200px]">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">Loading transactions...</td>
                      </tr>
                    ) : displayTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-lg font-semibold text-slate-600">No {activeTab} Found</p>
                            <p className="text-sm">There are no transactions matching your current filters and date range.</p>
                            <button 
                              onClick={() => {
                                setDateRange({
                                  startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0],
                                  endDate: new Date().toISOString().split('T')[0]
                                });
                              }}
                              className="mt-4 text-blue-600 font-medium hover:underline text-sm"
                            >
                              Try expanding the date range
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayTransactions.map((transaction, index) => (
                        <tr 
                          key={index} 
                          className={`hover:bg-slate-50/80 transition-colors ${
                            transaction._isRelated ? 'bg-slate-50/50' : ''
                          } ${transaction._isBookingParent ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (transaction._isBookingParent && hasBreakdown) {
                              toggleBookingExpansion(transaction._bookingRef);
                            }
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {transaction._isBookingParent && hasBreakdown && (
                                <button 
                                  className="text-gray-500 hover:text-blue-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookingExpansion(transaction._bookingRef);
                                  }}
                                >
                                  <svg 
                                    className={`w-4 h-4 transform transition-transform ${
                                      expandedBookings[transaction._bookingRef] ? 'rotate-90' : ''
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
                                <span className="w-4"></span>
                              )}
                              <span className={`px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-bold text-indigo-700 font-mono ${
                                transaction._isRelated ? 'opacity-75' : ''
                              }`}>
                                {transaction.reference || 'N/A'}
                              </span>
                              {transaction._isBookingParent && transaction._relatedCount > 0 && (
                                <span className="text-xs text-blue-600 font-medium">
                                  ({transaction._relatedCount} related)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{transaction.userId?.fullName || 'N/A'}</span>
                              <span className="text-xs text-slate-500">{transaction.userId?.emailAddress || 'N/A'}</span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">User ID: {transaction.userId?._id || transaction.userId?.id || transaction.userId || 'N/A'}</span>
                              {transaction.category === 'SECURITY_DEPOSIT' && transaction.metadata?.reconciliation?.cautionFeeStatus && transaction.metadata?.reconciliation?.cautionFeeStatus !== 'ON_HOLD' && (
                                <div className="flex flex-col gap-1 mt-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block w-fit ${
                                    transaction.metadata.reconciliation.cautionFeeStatus === 'RELEASED_TO_GUEST' ? 'bg-green-50 text-green-600 border border-green-100' :
                                    transaction.metadata.reconciliation.cautionFeeStatus === 'RELEASED_TO_HOST' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                    transaction.metadata.reconciliation.cautionFeeStatus === 'DISPUTED' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-gray-50 text-gray-600 border border-gray-100'
                                  }`}>
                                    {transaction.metadata.reconciliation.cautionFeeStatus === 'RELEASED_TO_GUEST' ? 'Released to Guest' :
                                     transaction.metadata.reconciliation.cautionFeeStatus === 'RELEASED_TO_HOST' ? 'Released to Host' :
                                     transaction.metadata.reconciliation.cautionFeeStatus === 'DISPUTED' ? 'Caution Disputed' : 
                                     transaction.metadata.reconciliation.cautionFeeStatus}
                                  </span>
                                  {transaction.metadata?.reconciliation?.resolutionReason && (
                                    <p className="text-[10px] text-slate-500 italic leading-tight break-words mt-1 border-t border-slate-50 pt-1" title={transaction.metadata.reconciliation.resolutionReason}>
                                      Note: {transaction.metadata.reconciliation.resolutionReason}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              transaction.category === 'CANCELLATION_PENALTY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              transaction.category === 'CANCELLATION_REFUND' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              transaction.category === 'CANCELLATION_CREDIT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              transaction._isRelated 
                                ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {transaction.category?.replace(/_/g, ' ') || transaction.type}
                              {transaction._bookingRef && (
                                <span className="ml-1 text-blue-600 font-semibold">
                                  (#{transaction._bookingRef.slice(-8)})
                                </span>
                              )}
                            </span>
                          </td>
                          <td className={`px-6 py-4 font-bold ${
                            transaction.metadata?.isDisclosure ? 'text-slate-400' :
                            transaction._isRelated ? 'text-slate-600' : 'text-slate-900'
                          }`}>
                            {transaction.metadata?.isDisclosure ? '' : (transaction.type === 'CREDIT' ? '+' : transaction.type === 'DEBIT' ? '-' : '')} 
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className={`px-6 py-4 text-sm break-words min-w-[200px] ${
                            transaction._isRelated ? 'text-slate-400' : 'text-slate-500'
                          }`}>{transaction.description}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(transaction.createdAt || transaction.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
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
