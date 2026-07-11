import React, { useState, useEffect } from 'react';
import { StatsCard, ChatCard, AlertContainer } from './index';
import { BookingsIcon, RevenueIcon, UsersIcon, KycIcon, DisputesIcon, GuestsIcon, TotalUsersIcon, ListingsIcon } from '../AllIcons';
import { 
  CreditCard, 
  Wallet, 
  Banknote, 
  ArrowDownLeft, 
  ArrowUpRight, 
  XCircle, 
  AlertTriangle,
  Download
} from 'lucide-react';
import ManagementMenu from './ManagementMenu';
import { 
  getTransactions,
  getAdminTransactions,
  exportAdminTransactions,
  getAdminTransactionSummary,
  getAuditLogs, 
  markNotificationRead,
  manualVerifyTransaction,
  getActivitySummary,
  resolveCautionFee
} from '../../services/adminService';
import SupportCenter from './management/support/SupportCenter';
import DisputesReports from './management/support/DisputesReports';
import FinancialTransactionActions from './management/finance/FinancialTransactionActions';
// Libraries loaded via CDN in index.html
const { jsPDF } = window.jspdf || {};
const autoTable = window.jspdf?.autoTable;
const XLSX = window.XLSX;

/**
 * Dashboard Content Router
 * Conditionally renders content based on activeMenu
 */

// Dashboard Content
export const DashboardContent = ({ stats }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await getActivitySummary(5);
      if (data && data.length > 0) {
        setActivities(data);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard icon={<TotalUsersIcon />} label="Total Users" value={stats.totalUsers || 0} description="all registered" bgColor="blue" iconColor="blue" />
        <StatsCard icon={<GuestsIcon />} label="Active Guests" value={stats.totalGuests || 0} description="active users" bgColor="green" iconColor="green" />
        <StatsCard icon={<UsersIcon />} label="Active Hosts" value={stats.activeHosts || 0} description="new this month" bgColor="violet" iconColor="indigo" />
        <StatsCard icon={<BookingsIcon />} label="Total Bookings" value={stats.totalBookings || 0} description="since last month" bgColor="violet" iconColor="indigo" />
      </div>
      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard icon={<Banknote />} label="Total Revenue" value={stats.totalRevenue || 0} description="fees + VAT" bgColor="violet" iconColor="indigo" isCurrency={true} />
        <StatsCard icon={<Wallet />} label="Total Escrow Balance" value={stats.totalEscrowFunds || 0} description="pending earnings + deposits" bgColor="amber" iconColor="orange" isCurrency={true} />
        <StatsCard icon={<KycIcon />} label="Pending KYC" value={stats.pendingKYC || 0} description="needs review" bgColor="orange" iconColor="orange" />
        <StatsCard icon={<ListingsIcon />} label="Pending Listings" value={stats.pendingListings || 0} description="awaiting approval" bgColor="orange" iconColor="orange" />
      </div>
      {/* Stats Cards - Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard icon={<DisputesIcon />} label="Open Disputes" value={stats.openDisputes || 0} description="since last month" bgColor="red" iconColor="red" />
      </div>
      {/* Alerts */}
      <div className="overflow-x-auto">
        <AlertContainer tabs={['Review Listings', 'Open Tickets', 'Process Payouts']} alerts={[]} onAddCategory={() => console.log('Add new category')} />
      </div>
      {/* Activity Summary */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md border border-stone-300 p-7">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        ) : (
          <ChatCard title="Activity Summary" activities={activities} />
        )}
      </div>
    </div>
  );
};

// Management Content
export const ManagementContent = ({ activeSubmenu = 'Listing Management' }) => (
  <ManagementMenu activeSubmenu={activeSubmenu} />
);

// Financial Management Content
export const FinancialManagementContent = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('All Transactions');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [financeStats, setFinanceStats] = useState({
    totalRevenue: 0,
    pendingPayouts: 0,
    failedTransactions: 0,
    appFees: 0,
    funding: 0,
    hostPayments: 0,
    withdrawals: 0,
    guestPayments: 0,
    processedVolume: 0,
    vat: 0,
    escrow: 0,
    couponValue: 0,
    appFeeTransactionCount: 0,
    totalRefunds: 0,
    totalPenalties: 0,
    totalCouponRefunds: 0
  });
  
  // Prevent duplicate actions
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);

  useEffect(() => {
    fetchFinancialData();
    const interval = setInterval(fetchFinancialData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [pagination.page, activeTab, dateRange, statusFilter, search]);

  // Reset page when tab changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setTransactions([]); // Clear current list to show loading state immediately
  }, [activeTab]);

  // Format wallet ID to LNT format
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
    const hostEarnings = Number(overview.totalHostEarnings) || 0;     // Money paid to hosts
    const withdrawals = Number(overview.totalWithdrawals) || 0;       // User withdrawals
    const escrowedFunds = Number(overview.escrowedFunds) || 0;       // Security deposits on hold
    const failedCount = Number(overview.failedTransactionCount) || 0; // Failed transaction count
    const failedAmount = Number(overview.failedTransactionAmount) || 0; // Failed transaction amount
    const couponValue = Number(overview.totalCouponValue) || 0;      // Coupon discounts
    const appFeeCount = Number(overview.appFeeTransactionCount) || 0; // App fee transactions
    const totalRefunds = Number(overview.totalRefunds) || 0; // NEW: Total refunds processed
    const totalPenalties = Number(overview.totalPenalties) || 0; // NEW: Total cancellation penalties
    const totalCouponRefunds = Number(overview.totalCouponRefunds) || 0; // NEW: Total refunds as coupons

    // Calculated metrics with proper financial logic
    const processedVolume = totalInflow + totalOutflow;              // Total transaction volume
    const grossRevenue = platformFees;                              // Total platform revenue
    const netRevenue = appFeesOnly;                                 // Revenue after tax
    const taxCollected = vatRevenue;                                 // VAT collected
    const activeTransactions = (overview.totalTransactions || 0) - failedCount; // Successful transactions
    
    // Validation checks for financial integrity
    const revenueIntegrity = Math.abs((appFeesOnly + vatRevenue) - platformFees) < 0.01;
    const allPositive = [totalInflow, totalOutflow, platformFees, appFeesOnly, vatRevenue, hostEarnings, withdrawals, escrowedFunds].every(val => val >= 0);

    return {
      // Revenue Metrics
      totalRevenue: grossRevenue,           // Gross Revenue stat card
      appFees: netRevenue,                 // Net App Fees stat card
      vat: taxCollected,                   // VAT Collected stat card
      revenueIntegrity,
      
      // Transaction Metrics
      failedTransactions: failedCount,       // Failed Trans. stat card
      processedVolume: processedVolume,      // Used in Processed Volume display
      appFeeTransactionCount: appFeeCount,   // App Fee Count stat card
      
      // Balance Metrics
      funding: totalInflow,                  // Total Inflow stat card
      
      // Payout Metrics
      hostPayments: hostEarnings,            // Host Earnings stat card
      withdrawals: withdrawals,              // Withdrawals stat card
      escrow: escrowedFunds,                 // Escrowed Funds stat card
      
      // Discount Metrics
      couponValue: couponValue,              // Coupon Value stat card
      
      // Cancellation Metrics
      totalRefunds,
      totalPenalties,
      totalCouponRefunds,
      
      // Validation
      allPositive,
      financialHealth: revenueIntegrity && allPositive
    };
  };

  // Validate financial calculations for accuracy - matching stat cards
  const validateFinancialCalculations = (overview) => {
    const totalInflow = overview.totalInflow || 0;
    const totalOutflow = overview.totalOutflow || 0;
    const platformFees = overview.platformFees || 0;
    const appFeesOnly = overview.appFeesOnly || 0;
    const vatRevenue = overview.totalVatRevenue || 0;
    const hostEarnings = overview.totalHostEarnings || 0;
    const withdrawals = overview.totalWithdrawals || 0;
    const escrowedFunds = overview.escrowedFunds || 0;
    const failedCount = overview.failedTransactionCount || 0;
    const couponValue = overview.totalCouponValue || 0;
    const appFeeTransactionCount = overview.appFeeTransactionCount || 0;
    const bookingAppFees = overview.bookingAppFees || 0;
    const bookingVAT = overview.bookingVAT || 0;
    const totalRefunds = overview.totalRefunds || 0;
    const totalPenalties = overview.totalPenalties || 0;
    const totalCouponRefunds = overview.totalCouponRefunds || 0;
    
    // Calculate derived values to match stat cards
    const processedVolume = totalInflow + totalOutflow;
    
    // Validation checks matching stat cards
    const validations = {
      // Gross Revenue (platformFees) should equal appFeesOnly + vatRevenue
      grossRevenueMatch: Math.abs((appFeesOnly + vatRevenue) - platformFees) < 0.01,
      
      // Net App Fees should be positive and less than gross revenue
      netAppFeesValid: appFeesOnly >= 0 && appFeesOnly <= platformFees,
      
      // Host Earnings should be positive
      hostEarningsValid: hostEarnings >= 0,
      
      // Withdrawals should be positive and not exceed total outflow
      withdrawalsValid: withdrawals >= 0 && withdrawals <= totalOutflow,
      
      // Escrowed Funds should be positive
      escrowedFundsValid: escrowedFunds >= 0,
      
      // VAT should be ~7.5% of app fees
      vatRatioValid: appFeesOnly > 0 ? vatRevenue / appFeesOnly > 0.05 && vatRevenue / appFeesOnly < 0.1 : true,
      
      // Processed Volume should equal totalInflow + totalOutflow
      processedVolumeValid: processedVolume >= 0,
      
      // Total Inflow should be positive
      totalInflowValid: totalInflow >= 0,
      
      // Failed Transactions count should be valid
      failedTransactionsValid: failedCount >= 0,
      
      // Coupon Value should be positive
      couponValueValid: couponValue >= 0,
      
      // App Fee Transaction Count should be valid
      appFeeCountValid: appFeeTransactionCount >= 0,
      
      // All values should be positive numbers
      allPositive: [totalInflow, totalOutflow, platformFees, appFeesOnly, vatRevenue, hostEarnings, withdrawals, escrowedFunds, couponValue, bookingAppFees, bookingVAT, totalRefunds, totalPenalties, totalCouponRefunds].every(val => val >= 0)
    };
    
    // Log validation results with stat card correspondence
    console.log('[FinancialManagement] Validation Results:', validations);
    console.log('[FinancialManagement] Stat Card Values:', {
      grossRevenue: platformFees,
      netAppFees: appFeesOnly,
      hostEarnings: hostEarnings,
      withdrawals: withdrawals,
      escrowedFunds: escrowedFunds,
      vatCollected: vatRevenue,
      totalInflow: totalInflow,
      processedVolume: processedVolume,
      failedTransactions: failedCount,
      couponValue: couponValue,
      appFeeCount: appFeeTransactionCount,
      bookingAppFees,
      bookingVAT,
      totalRefunds,
      totalPenalties,
      totalCouponRefunds
    });
    
    // Return validated and corrected data
    return {
      totalRevenue: platformFees,           // Gross Revenue stat card
      appFees: appFeesOnly,                 // Net App Fees stat card
      hostPayments: hostEarnings,            // Host Earnings stat card
      withdrawals: withdrawals,              // Withdrawals stat card
      failedTransactions: failedCount,       // Failed Trans. stat card
      processedVolume: processedVolume,      // Used in Processed Volume display
      funding: totalInflow,                  // Total Inflow stat card
      vat: vatRevenue,                       // VAT Collected stat card
      escrow: escrowedFunds,                 // Escrowed Funds stat card
      couponValue: couponValue,              // Coupon Value stat card
      appFeeTransactionCount: appFeeTransactionCount, // App Fee Count stat card
      bookingAppFees: bookingAppFees,               // Booking-specific fees
      bookingVAT: bookingVAT,                       // Booking-specific VAT
      totalRefunds,
      totalPenalties,
      totalCouponRefunds,
      validations
    };
  };

  // Centralized filter function to eliminate duplication - SYNCED WITH BACKEND CATEGORIES
  const getTabFilters = (tab) => {
    const filters = {};
    
    switch (tab) {
      case 'Guest Payments':
        filters.category = 'BOOKING';
        filters.type = 'DEBIT';
        break;
      case 'Host Earnings':
        filters.category = 'HOST_EARNING,RENT,SERVICE_CHARGE,BOOKING';
        filters.type = 'CREDIT';
        break;
      case 'Withdrawals':
        filters.category = 'WITHDRAWAL';
        break;
      case 'App Fees':
        filters.category = 'PLATFORM_FEE,BOOKING';
        break;
      case 'VAT':
        filters.category = 'VAT,BOOKING';
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
        filters.category = 'REFUND,CANCELLATION_REFUND,CANCELLATION_PENALTY';
        break;
      case 'Rewards':
        filters.category = 'REWARD,CASH_REWARD';
        break;
      default:
        // 'All Transactions' - no filters
        break;
    }
    
    return filters;
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
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

      const [summaryRes, transRes] = await Promise.all([
        getAdminTransactionSummary({ startDate: filters.startDate, endDate: filters.endDate }),
        getAdminTransactions({ ...filters, page: pagination.page, limit: pagination.limit })
      ]);

      if (transRes && transRes.success && transRes.body) {
        const transactions = transRes.body.transactions || [];
        setTransactions(transactions);
        if (transRes.body.pagination) {
          setPagination(transRes.body.pagination);
        }
        
        // Debug logging for Withdrawals tab
        if (activeTab === 'Withdrawals') {
          console.log('[FinancialManagement] Withdrawals Tab - Transactions Returned:', transactions.length);
          console.log('[FinancialManagement] Withdrawals Tab - Sample Transactions:', transactions.slice(0, 3).map(tx => ({
            category: tx.category,
            type: tx.type,
            amount: tx.amount,
            status: tx.status,
            reference: tx.reference,
            isInternal: tx.metadata?.internal
          })));
          
          // Additional validation: Filter out any non-withdrawal transactions that might have slipped through
          const actualWithdrawals = transactions.filter(tx => tx.category === 'WITHDRAWAL');
          if (actualWithdrawals.length !== transactions.length) {
            console.warn('[FinancialManagement] Withdrawals Tab - Non-withdrawal transactions detected:', {
              expected: 'WITHDRAWAL',
              actualCount: actualWithdrawals.length,
              totalCount: transactions.length,
              invalidTransactions: transactions.filter(tx => tx.category !== 'WITHDRAWAL').map(tx => ({
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
        const invalidTransactions = transactions.filter(tx => {
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
          const validTransactions = transactions.filter(tx => expectedCategories.includes(tx.category) || expectedCategories.length === 0);
          setTransactions(validTransactions);
          return;
        }
      } else if (transRes && transRes.body && Array.isArray(transRes.body)) {
        // Fallback if returned as raw array
        setTransactions(transRes.body);
      }

      if (summaryRes && summaryRes.success && summaryRes.body) {
        const overview = summaryRes.body.overview || summaryRes.body;
        setSummary(overview);
        
        // Use the new comprehensive financial calculation
        const metrics = calculateFinancialMetrics(overview);
        setFinanceStats(metrics);
        
        // Log financial health status
        if (metrics) {
          console.log('[FinancialManagement] === FINANCIAL HEALTH CHECK ===');
          console.log('[FinancialManagement] Financial Health:', metrics.financialHealth ? '✅ HEALTHY' : '⚠️ ISSUES DETECTED');
          console.log('[FinancialManagement] Revenue Integrity:', metrics.revenueIntegrity ? '✅ PASS' : '❌ FAIL');
          console.log('[FinancialManagement] Balance Integrity: N/A (removed)');
          
          if (!metrics.financialHealth) {
            console.warn('[FinancialManagement] Financial data integrity issues detected');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setLoading(false);
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
      if ((action === 'RELEASE_TO_GUEST' || action === 'RELEASE_TO_HOST') && 
          transaction.category === 'SECURITY_DEPOSIT' && 
          transaction.metadata?.bookingId) {
        
        const bookingRef = transaction.metadata.bookingReference || 
                          transaction.metadata.referenceCode ||
                          `LNS-${transaction.metadata.bookingId?.slice(-8).toUpperCase()}`;
        
        const response = await resolveCautionFee(bookingRef, action, `Admin resolution: ${action}`);
        
        if (response.success) {
          alert(`✓ Successfully ${action === 'RELEASE_TO_GUEST' ? 'released to guest wallet' : 'released to host'}: ₦${transaction.amount?.toLocaleString('en-NG')}\nReference: ${bookingRef}`);
          setTimeout(() => fetchFinancialData(), 500);
        } else {
          throw new Error(response.message || 'Failed to complete action');
        }
      } else {
        const actionMessages = {
          'APPROVE_WITHDRAWAL': 'Withdrawal Approved',
          'REJECT_WITHDRAWAL': 'Withdrawal Rejected',
          'APPROVE_PAYOUT': 'Payout Approved',
          'REJECT_PAYOUT': 'Payout Rejected',
          'APPROVE_BOOKING': 'Booking Approved',
          'CANCEL_BOOKING': 'Booking Cancelled',
          'VERIFY_COUPON': 'Coupon Verified',
          'REVERSE_TRANSACTION': 'Transaction Reversed',
        };
        
        alert(`✓ ${actionMessages[action] || action}\nReference: ${transaction.reference || 'N/A'}`);
        setTimeout(() => fetchFinancialData(), 500);
      }
    } catch (error) {
      console.error('[FinancialManagement] Error executing action:', error);
      alert(`❌ Error: ${error.message || 'Failed to complete action. Please try again.'}`);
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchFinancialData();
    }
  };

  const handleExportClick = async () => {
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

  const tabs = [
    'All Transactions',
    'Guest Payments',
    'Host Earnings',
    'Withdrawals',
    'Wallet Actions',
    'App Fees',
    'VAT',
    'Caution Fees',
    'Coupons',
    'Refunds',
    'Rewards'
  ];

  const statusOptions = ['All', 'ON_HOLD', 'COMPLETED', 'FAILED'];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'on_hold': return 'bg-orange-100 text-orange-600';
      case 'processing': return 'bg-blue-100 text-blue-600';
      case 'completed': return 'bg-green-100 text-green-600';
      case 'failed': return 'bg-red-100 text-red-600';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor revenue, platform fees and transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
            <span className="text-xs font-semibold text-indigo-600 block uppercase tracking-wider">Processed Volume</span>
            <span className="text-lg font-bold text-indigo-900">₦{financeStats.processedVolume?.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
          </div>
        </div>
      </div>

      {/* Financial Health Alert */}
      {summary && !calculateFinancialMetrics(summary)?.financialHealth && (
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

      {/* Stats Cards - Premium Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 lg:gap-6">
        <StatsCard icon={<Banknote />} label="Gross Revenue" value={financeStats.totalRevenue} description="fees + VAT" bgColor="violet" iconColor="indigo" isCurrency={true} />
        <StatsCard icon={<Wallet />} label="Net App Fees" value={financeStats.appFees} description="excluding tax" bgColor="blue" iconColor="blue" isCurrency={true} />
        <StatsCard icon={<CreditCard />} label="Host Earnings" value={financeStats.hostPayments} description="processed funds" bgColor="green" iconColor="green" isCurrency={true} />
        <StatsCard icon={<AlertTriangle />} label="Escrowed Funds" value={financeStats.escrow} description="active holds" bgColor="amber" iconColor="amber" isCurrency={true} />
        <StatsCard icon={<ArrowDownLeft />} label="Withdrawals" value={financeStats.withdrawals} description="successful" bgColor="orange" iconColor="orange" isCurrency={true} />
        
        <StatsCard icon={<Banknote />} label="VAT Collected" value={financeStats.vat} description="7.5% tax" bgColor="indigo" iconColor="indigo" isCurrency={true} />
        <StatsCard icon={<ArrowUpRight />} label="Total Inflow" value={financeStats.funding} description="money in system" bgColor="blue" iconColor="blue" isCurrency={true} />
        <StatsCard icon={<XCircle />} label="Failed Trans." value={financeStats.failedTransactions} description="error count" bgColor="red" iconColor="red" isCurrency={false} />
        <StatsCard icon={<CreditCard />} label="Total Discount Value Redeemed" value={financeStats.couponValue} description="promos used" bgColor="violet" iconColor="indigo" isCurrency={true} />
        <StatsCard icon={<CreditCard />} label="App Fee Count" value={financeStats.appFeeTransactionCount} description="fee transactions" bgColor="purple" iconColor="purple" isCurrency={false} />

        <StatsCard icon={<Banknote />} label="Total Refunds (Cash)" value={financeStats.totalRefunds} description="guest payouts" bgColor="red" iconColor="red" isCurrency={true} />
        <StatsCard icon={<AlertTriangle />} label="Total Penalties" value={financeStats.totalPenalties} description="deductions" bgColor="orange" iconColor="orange" isCurrency={true} />
        <StatsCard icon={<Wallet />} label="Cancellation Credits" value={financeStats.totalCouponRefunds} description="platform credits" bgColor="purple" iconColor="purple" isCurrency={true} />
      </div>

      {/* Financial Validation Debug Panel */}
      {process.env.NODE_ENV === 'development' && financeStats.validations && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Financial Validation Results (Stat Cards)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div className={`flex items-center gap-2 ${financeStats.validations.grossRevenueMatch ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.grossRevenueMatch ? 'bg-green-500' : 'bg-red-500'}`}></div>
              Gross Revenue
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.netAppFeesValid ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.netAppFeesValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              Net App Fees
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.hostEarningsValid ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.hostEarningsValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              Host Earnings
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.withdrawalsValid ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.withdrawalsValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              Withdrawals
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.escrowedFundsValid ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.escrowedFundsValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              Escrowed Funds
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.vatRatioValid ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.vatRatioValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              VAT Ratio
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.totalInflowValid ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.totalInflowValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              Total Inflow
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.failedTransactionsValid ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.failedTransactionsValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              Failed Trans.
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.couponValueValid ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.couponValueValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              Discount Value
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.appFeeCountValid ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.appFeeCountValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              App Fee Count
            </div>
            <div className={`flex items-center gap-2 ${financeStats.validations.allPositive ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${financeStats.validations.allPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              All Positive
            </div>
          </div>
        </div>
      )}

      {/* Transactions Section */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden transition-all">
        {/* Navigation & Controls Section */}
        <div className="p-1 bg-slate-50/80 border-b border-slate-200">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 ${
                  activeTab === tab
                    ? 'bg-blue-900 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                    : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Date and Status Filters */}
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 border-b border-slate-100 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
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
          
          <div className="flex gap-2 items-center">
            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Date Range:</span>
            <input 
              type="date" 
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <span className="text-slate-400">to</span>
            <input 
              type="date" 
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Search and Export */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter User ID, Reference or Type (Press Enter to search)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button 
                onClick={handleExportClick}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-50 text-blue-900 rounded-full hover:bg-blue-100 cursor-pointer transition-colors w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Ref</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-24 text-center">
                    <div className="inline-flex flex-col items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-slate-400 font-medium animate-pulse">Syncing transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-24 text-center">
                    <div className="inline-flex flex-col items-center opacity-30">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-bold text-lg leading-tight">No Transactions Found</p>
                      <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or date range</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, index) => (
                  <TransactionRow 
                    key={tx._id || index}
                    tx={tx}
                    index={index}
                    activeTab={activeTab}
                    onActionComplete={handleActionComplete}
                    manualVerifyTransaction={manualVerifyTransaction}
                    fetchFinancialData={fetchFinancialData}
                    getStatusColor={getStatusColor}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className={`p-2 border border-slate-200 rounded-lg transition-colors cursor-pointer ${pagination.page <= 1 ? 'opacity-50 bg-slate-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-slate-500">Previous</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Page {pagination.page} of {pagination.pages || 1}</span>
            <span className="text-xs text-slate-400 ml-2">({pagination.total} total)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Next</span>
            <button 
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages || 1, prev.page + 1) }))}
              disabled={pagination.page >= (pagination.pages || 1)}
              className={`p-2 border border-slate-200 rounded-lg transition-colors cursor-pointer ${pagination.page >= (pagination.pages || 1) ? 'opacity-50 bg-slate-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// Promotions Content
export const PromotionsContent = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-lg font-semibold text-slate-900 font-aeonik mb-4">Promotional Campaigns</h2>
    <p className="text-slate-600 font-aeonik">Create and manage promotional campaigns and discounts.</p>
  </div>
);

// Support Content
export const SupportContent = ({ activeSubmenu = 'Support Center' }) => {
  if (activeSubmenu === 'Disputes & Report') return <DisputesReports />;
  return <SupportCenter />;
};

// Subscription Content
export const SubscriptionContent = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-lg font-semibold text-slate-900 font-aeonik mb-4">Subscription Plans</h2>
    <p className="text-slate-600 font-aeonik">Manage subscription tiers, pricing, and user subscriptions.</p>
  </div>
);

// Settings Content
export const SettingsContent = () => (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 font-aeonik mb-4">Platform Settings</h2>
      <p className="text-slate-600 font-aeonik">Configure general platform settings.</p>
    </div>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 font-aeonik mb-4">Access Controls</h2>
      <p className="text-slate-600 font-aeonik">Manage user roles and permissions.</p>
    </div>
  </div>
);

// Content Moderation
export const ContentModerationContent = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-lg font-semibold text-slate-900 font-aeonik mb-4">Content Review</h2>
    <p className="text-slate-600 font-aeonik">Review and moderate user-generated content.</p>
  </div>
);

// Messages Content
export const MessagesContent = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-lg font-semibold text-slate-900 font-aeonik mb-4">Message Monitoring</h2>
    <p className="text-slate-600 font-aeonik">Monitor and manage user communications.</p>
  </div>
);

// Audit Logs Content
export const AuditLogsContent = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [filter, searchTerm, startDate, endDate, pagination.page]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await getAuditLogs({ 
        limit: pagination.limit, 
        page: pagination.page, 
        type: filter !== 'all' ? filter : undefined, 
        search: searchTerm,
        startDate,
        endDate
      });
      
      const responseData = response.body || response;
      setLogs(responseData.logs || (Array.isArray(responseData) ? responseData : []));
      
      // Update pagination state from backend response
      const paginationData = responseData.pagination || response.pagination;
      if (paginationData) {
        setPagination({
          page: paginationData.page || pagination.page,
          limit: paginationData.limit || pagination.limit,
          total: paginationData.total || 0,
          pages: paginationData.pages || 1
        });
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMatchingLogsForExport = async () => {
    try {
      setLoading(true);
      const limit = pagination.total || 5000;
      const response = await getAuditLogs({
        limit,
        page: 1,
        type: filter !== 'all' ? filter : undefined,
        search: searchTerm,
        startDate,
        endDate
      });
      const responseData = response.body || response;
      const logsArray = responseData.logs || (Array.isArray(responseData) ? responseData : responseData.body || []);
      return Array.isArray(logsArray) ? logsArray : [];
    } catch (e) {
      console.error('Failed to fetch logs for export:', e);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change (except for page itself)
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filter, searchTerm, startDate, endDate]);

  const filteredLogs = logs; // Filtering is handled server-side now for pagination accuracy

  const categories = ['all', 'User Management', 'Listings', 'Bookings', 'Finance', 'Verification', 'Disputes', 'Content Moderation', 'System / AI Agent'];

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-orange-100 text-orange-700 border-orange-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[priority] || colors.low;
  };

  const getStatusBadge = (status) => {
    return status === 'pending' 
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'USER_REGISTERED': '👤',
      'HOST_APPLICATION': '🏠',
      'NEW_LISTING': '📍',
      'NEW_BOOKING': '📅',
      'BOOKING_CANCELLED': '❌',
      'KYC_SUBMITTED': '📋',
      'PAYOUT_REQUEST': '💰',
      'DISPUTE_OPENED': '⚠️',
      'LISTING_REPORTED': '🚩',
      'USER_REPORTED': '🚨',
      'WITHDRAWAL_REQUEST': '💳'
    };
    return icons[type] || '📝';
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 font-aeonik">System Audit Logs</h2>
            <p className="text-sm text-slate-500 font-aeonik">Track and monitor all system activities and administrative actions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">From:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">To:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search logs by action, user, email or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
            <button
              onClick={() => fetchAuditLogs()}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <span className="text-4xl mb-2">📋</span>
            <span>No audit logs found</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xl">{getTypeIcon(log.type)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{log.action}</div>
                        <div className="text-xs text-slate-500 mt-1 max-w-xs truncate">{log.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{log.user}</div>
                        <div className="text-xs text-slate-400">{log.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full">
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(log.priority)}`}>
                          {log.priority?.charAt(0).toUpperCase() + log.priority?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(log.status)}`}>
                          {log.status?.charAt(0).toUpperCase() + log.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {log.status === 'pending' && (
                          <button
                            onClick={async () => {
                              try {
                                await markNotificationRead(log.id);
                                fetchAuditLogs();
                              } catch (e) {
                                console.error('Failed to mark as read:', e);
                              }
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Mark as Reviewed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer with counts and pagination */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-500 font-aeonik">
                  Showing <span className="font-semibold text-slate-900">{Math.min(pagination.total, (pagination.page - 1) * pagination.limit + 1)}</span> to <span className="font-semibold text-slate-900">{Math.min(pagination.total, pagination.page * pagination.limit)}</span> of <span className="font-semibold text-slate-900">{pagination.total}</span> results
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1 || loading}
                  className={`p-2 border border-slate-200 rounded-lg transition-all ${pagination.page <= 1 || loading ? 'opacity-40 cursor-not-allowed bg-slate-100' : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm active:scale-95'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else {
                      const start = Math.max(1, Math.min(pagination.page - 2, pagination.pages - 4));
                      pageNum = start + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        disabled={loading}
                        className={`w-9 h-9 text-sm font-medium rounded-lg transition-all ${pagination.page === pageNum ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 bg-white border border-slate-200'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, pagination.page + 1) }))}
                  disabled={pagination.page >= pagination.pages || loading}
                  className={`p-2 border border-slate-200 rounded-lg transition-all ${pagination.page >= pagination.pages || loading ? 'opacity-40 cursor-not-allowed bg-slate-100' : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm active:scale-95'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <span>Export Logs</span>
                  <svg className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isExportOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden py-1">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 italic text-[10px] text-slate-500">
                      Exports {pagination.total || logs.length} matching logs
                    </div>
                    <button
                      onClick={async () => {
                        setIsExportOpen(false);
                        const exportLogs = await fetchAllMatchingLogsForExport();
                        if (exportLogs.length === 0) {
                          alert("No logs to export.");
                          return;
                        }
                        const XLSXLib = window.XLSX;
                        if (!XLSXLib) {
                          alert("Export library (SheetJS) is not loaded yet.");
                          return;
                        }
                        const exportData = exportLogs.map(log => ({
                            Type: log.type || '',
                            Action: log.action || '',
                            User: log.user || '',
                            Email: log.userEmail || '',
                            Category: log.category || '',
                            Priority: log.priority || '',
                            Status: log.status || '',
                            Timestamp: new Date(log.timestamp).toLocaleString(),
                            Description: log.description || ''
                        }));
                        const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
                        const ws = XLSXLib.utils.json_to_sheet(exportData);
                        const csv = XLSXLib.utils.sheet_to_csv(ws);
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 border-b border-slate-50"
                    >
                      <span className="text-green-600">📊</span> Export as CSV
                    </button>
                    <button
                      onClick={async () => {
                        setIsExportOpen(false);
                        const exportLogs = await fetchAllMatchingLogsForExport();
                        if (exportLogs.length === 0) {
                          alert("No logs to export.");
                          return;
                        }
                        const jsPDFClass = window.jspdf?.jsPDF;
                        if (!jsPDFClass) {
                          alert("Export library (jsPDF) is not loaded yet.");
                          return;
                        }
                        const doc = new jsPDFClass();
                        doc.text(`Audit Logs - ${new Date().toLocaleDateString()}`, 14, 15);
                        
                        const tableData = exportLogs.map(log => [
                            log.type || '',
                            log.action || '',
                            log.user || '',
                            log.category || '',
                            log.priority || '',
                            log.status || '',
                            new Date(log.timestamp).toLocaleString()
                        ]);
                        
                        const autoTablePlugin = window.jspdf?.autoTable || window.autoTable;
                        if (autoTablePlugin) {
                          autoTablePlugin(doc, {
                            head: [['Type', 'Action', 'User', 'Category', 'Priority', 'Status', 'Timestamp']],
                            body: tableData,
                            startY: 20,
                            styles: { fontSize: 8 },
                            headStyles: { fillColor: [79, 70, 229] }
                          });
                        } else if (typeof doc.autoTable === 'function') {
                          doc.autoTable({
                            head: [['Type', 'Action', 'User', 'Category', 'Priority', 'Status', 'Timestamp']],
                            body: tableData,
                            startY: 20,
                            styles: { fontSize: 8 },
                            headStyles: { fillColor: [79, 70, 229] }
                          });
                        }
                        doc.save(`audit_logs_${new Date().toISOString().split('T')[0]}.pdf`);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 border-b border-slate-50"
                    >
                      <span className="text-red-500">📄</span> Export as PDF
                    </button>
                    <button
                      onClick={async () => {
                        setIsExportOpen(false);
                        const exportLogs = await fetchAllMatchingLogsForExport();
                        if (exportLogs.length === 0) {
                          alert("No logs to export.");
                          return;
                        }
                        const XLSXLib = window.XLSX;
                        if (!XLSXLib) {
                          alert("Export library (SheetJS) is not loaded yet.");
                          return;
                        }
                        const exportData = exportLogs.map(log => ({
                            Type: log.type || '',
                            Action: log.action || '',
                            User: log.user || '',
                            Email: log.userEmail || '',
                            Category: log.category || '',
                            Priority: log.priority || '',
                            Status: log.status || '',
                            Timestamp: new Date(log.timestamp).toLocaleString(),
                            Description: log.description || ''
                        }));
                        const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
                        const ws = XLSXLib.utils.json_to_sheet(exportData);
                        const wb = XLSXLib.utils.book_new();
                        XLSXLib.utils.book_append_sheet(wb, ws, "Audit Logs");
                        XLSXLib.writeFile(wb, filename);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                    >
                      <span className="text-indigo-600">Excel</span> Export as Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// TransactionRow component for handling expandable breakdown
const TransactionRow = ({ tx, index, activeTab, onActionComplete, manualVerifyTransaction, fetchFinancialData, getStatusColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if this is a booking transaction that should show breakdown
  // Expanded detection for LUNEST_ reference prefix as confirmed in user data
  // Exclude PLATFORM_FEE, VAT, HOST_EARNING, RENT, and SERVICE_CHARGE as they don't need a breakdown themselves
  const isBookingTransaction = 
    (tx.category === 'BOOKING' || tx.reference?.startsWith('LUNEST_') || tx.bookingId) && 
    !['PLATFORM_FEE', 'VAT', 'HOST_EARNING', 'RENT', 'SERVICE_CHARGE'].includes(tx.category);

  // Function to render a single row of the transaction table
  const renderRow = (transaction, isSubRow = false, subType = '') => {
    const isBooking = transaction.category === 'BOOKING';
    const isFee = transaction.category === 'PLATFORM_FEE';
    const isVat = transaction.category === 'VAT';

    // Determine displayed amount based on activeTab for bundled bookings
    let displayAmount = transaction.amount || 0;
    let isBundledDisplay = false;

    if (isBooking && !isSubRow) {
      if (activeTab === 'App Fees') {
        const fee = transaction.metadata?.guestFee || (Math.abs(displayAmount) / 1.05375 * 0.05);
        displayAmount = fee;
        isBundledDisplay = true;
      } else if (activeTab === 'VAT') {
        const vat = transaction.metadata?.guestVat || (Math.abs(displayAmount) / 1.05375 * 0.05 * 0.075);
        displayAmount = vat;
        isBundledDisplay = true;
      } else if (activeTab === 'Host Earnings') {
        const hostEarnings = transaction.metadata?.hostEarnings || (Math.abs(displayAmount) * 0.97);
        displayAmount = hostEarnings;
        isBundledDisplay = true;
      }
    }

    return (
      <tr key={transaction._id || `${index}-${subType}`} className={`group hover:bg-blue-50/30 transition-all duration-200 ${isSubRow ? 'bg-slate-50/50' : ''}`}>
        <td className="px-6 py-5">
          <div className="flex flex-col">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-700 font-mono shadow-sm group-hover:border-blue-200 group-hover:bg-blue-50/50 transition-colors">
              {transaction.reference || 'N/A'}
            </span>
            {transaction.bookingId && !isSubRow && (
              <span className="text-[10px] text-blue-500 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Linked to Booking</span>
            )}
            {isSubRow && (
              <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{subType}</span>
            )}
          </div>
        </td>
        <td className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
              {(transaction.userId?.fullName || transaction.metadata?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-900 truncate">
                {transaction.userId?.fullName || (transaction.metadata?.fullName) || (typeof transaction.userId === 'string' ? 'User' : 'Unknown')}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {transaction.userId?.emailAddress || transaction.metadata?.email || 'No email registered'}
              </span>
            </div>
          </div>
        </td>
        <td className="px-6 py-5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
            transaction.type === 'CREDIT' 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-rose-50 text-rose-600 border border-rose-100'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${transaction.type === 'CREDIT' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
            {transaction.type}
          </span>
        </td>
        <td className="px-6 py-5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${
              isFee ? 'bg-blue-50 text-blue-600 border-blue-100' :
              isVat ? 'bg-purple-50 text-purple-600 border-purple-100' :
              transaction.category === 'CANCELLATION_PENALTY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              transaction.category === 'CANCELLATION_REFUND' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              transaction.category === 'CANCELLATION_CREDIT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              'bg-slate-100 text-slate-500 border-slate-200/50'
            }`}>
              {transaction.category?.replace(/_/g, ' ')}
            </span>
            {isBundledDisplay && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px] font-black uppercase tracking-tighter shadow-sm animate-pulse">
                Bundled
              </span>
            )}
            {isBookingTransaction && !isSubRow && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm border border-blue-100/50 cursor-pointer"
              >
                {isExpanded ? '▼' : '▶'} Breakdown
              </button>
            )}
          </div>
        </td>
        <td className="px-6 py-5">
           <span className={`text-[14px] font-black ${transaction.type === 'CREDIT' ? 'text-emerald-700' : (isBundledDisplay ? 'text-blue-700' : 'text-slate-900')}`}>
             {transaction.type === 'CREDIT' ? '+' : '-'}₦{Math.abs(displayAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
           </span>
        </td>
        <td className="px-6 py-5">
           <span className="text-slate-500 font-medium">₦{(transaction.fee || 0).toLocaleString()}</span>
        </td>
        <td className="px-6 py-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded border border-slate-100">{transaction.channel || 'WALLET'}</span>
        </td>
        <td className="px-6 py-5 text-slate-500 font-medium">
          {new Date(transaction.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </td>
        <td className="px-6 py-5">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </td>
        <td className="px-6 py-5 text-right">
          {!isSubRow && (
            <div className="flex justify-end gap-2 items-center">
              {transaction.status === 'PENDING' && transaction.channel === 'PAYSTACK' && (
                <button 
                  onClick={async () => {
                    try {
                      const res = await manualVerifyTransaction(transaction.reference);
                      alert(res.message || "Manual verification triggered");
                      fetchFinancialData();
                    } catch (e) {
                      alert("Verification failed: " + e.message);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100 cursor-pointer"
                >
                  Verify
                </button>
              )}
              <FinancialTransactionActions 
                transaction={transaction}
                onActionComplete={onActionComplete}
              />
            </div>
          )}
        </td>
      </tr>
    );
  };

  // Check if this is an old-style booking transaction that needs visual splitting
  const isOldBooking = tx.category === 'BOOKING' && tx.metadata?.guestSide && !tx.metadata?.isSplit;
  
  if (isOldBooking) {
    const total = tx.amount || 0;
    const appFee = total * 0.05;
    const vat = appFee * 0.075;
    const net = total - appFee - vat;

    return (
      <React.Fragment>
        {renderRow({ ...tx, amount: net, description: `Booking Payment (Net)` }, false, 'Net Payment')}
        {renderRow({ ...tx, category: 'PLATFORM_FEE', amount: appFee, description: `App Fee` }, true, 'App Fee')}
        {renderRow({ ...tx, category: 'VAT', amount: vat, description: `VAT Charge` }, true, 'VAT')}
        
        {/* Expanded breakdown row */}
        {isExpanded && (
          <tr className="bg-blue-50/30">
            <td colSpan="10" className="px-6 py-4">
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-blue-700 mb-3">Historical Booking Breakdown (Estimated):</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-[10px] text-slate-500">Rent + Service Charge + Caution</div>
                    <div className="text-[12px] font-bold text-slate-900">₦{net.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-[10px] text-slate-500">App Fee (5%)</div>
                    <div className="text-[12px] font-bold text-blue-600">₦{appFee.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-[10px] text-slate-500">VAT on App Fee (7.5%)</div>
                    <div className="text-[12px] font-bold text-purple-600">₦{vat.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {renderRow(tx)}
      
      {/* Breakdown rows for booking transactions */}
      {isBookingTransaction && isExpanded && (
        <tr className="bg-blue-50/20">
          <td colSpan="10" className="px-6 py-2 border-l-4 border-l-blue-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Subtotal</span>
                  <span className="text-[13px] font-black text-slate-900 font-mono">
                    ₦{(tx.metadata?.subtotalBeforeCoupon || tx.metadata?.hostTotal || (Math.abs(tx.amount || 0) / 1.05375)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">App Fee (5%)</span>
                  <span className="text-[13px] font-black text-blue-700 font-mono">
                    ₦{(tx.metadata?.guestFee || (Math.abs(tx.amount || 0) / 1.05375 * 0.05)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-purple-500 font-bold uppercase tracking-wider mb-0.5">VAT (7.5%)</span>
                  <span className="text-[13px] font-black text-purple-700 font-mono">
                    ₦{(tx.metadata?.guestVat || (Math.abs(tx.amount || 0) / 1.05375 * 0.05 * 0.075)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {(tx.metadata?.couponDiscount > 0 || tx.metadata?.couponApplied) && (
                  <div className="flex flex-col border-l border-slate-200 pl-6">
                    <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mb-0.5">Discount ({tx.metadata?.couponCode || 'PROMO'})</span>
                    <span className="text-[13px] font-black text-emerald-600 font-mono">
                      -₦{(tx.metadata?.couponDiscount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-lg border border-slate-200/50">
                <div className={`w-1.5 h-1.5 rounded-full ${tx.metadata?.subtotalBeforeCoupon ? 'bg-emerald-500' : 'bg-blue-400'}`}></div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {tx.metadata?.subtotalBeforeCoupon ? 'Direct Metadata' : 'Extracted Calculation'}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

// Profile Content Component
export const ProfileContent = () => {
  const [adminUser, setAdminUser] = useState(() => {
    const stored = localStorage.getItem('adminUser');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile Form State
  const [fullName, setFullName] = useState(adminUser?.fullName || '');
  const [gender, setGender] = useState(adminUser?.gender || 'OTHERS');
  const [phoneNumber, setPhoneNumber] = useState(adminUser?.phoneNumber || '');
  const [location, setLocation] = useState(adminUser?.location || '');
  const [nin, setNin] = useState(adminUser?.nin || '');
  
  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Load states and feedback states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Listen to changes in local storage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('adminUser');
      try {
        if (stored) {
          const userData = JSON.parse(stored);
          setAdminUser(userData);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync state if adminUser object changes
  useEffect(() => {
    if (adminUser) {
      setFullName(adminUser.fullName || '');
      setGender(adminUser.gender || 'OTHERS');
      setPhoneNumber(adminUser.phoneNumber || '');
      setLocation(adminUser.location || '');
      setNin(adminUser.nin || '');
    }
  }, [adminUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setSavingProfile(true);

    try {
      const payload = {
        fullName,
        gender,
        phoneNumber: phoneNumber || undefined,
        location: location || undefined,
        nin: nin || undefined
      };
      
      const adminService = await import('../../services/adminService');
      const response = await adminService.updateAdminProfile(payload);
      
      if (response && response.success && response.body) {
        // Merge updated fields back into localStorage adminUser
        const updatedUser = {
          ...adminUser,
          ...response.body
        };
        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
        setAdminUser(updatedUser);
        setProfileSuccess('Profile updated successfully!');
        
        // Trigger a custom event to notify Navbar/Sidebar to update immediately
        window.dispatchEvent(new Event('storage'));
      } else {
        setProfileError(response?.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setProfileError(err.message || 'An error occurred while updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);

    try {
      const adminService = await import('../../services/adminService');
      const response = await adminService.updateAdminPassword(currentPassword, newPassword, confirmPassword);
      
      if (response && response.success) {
        setPasswordSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(response?.message || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError(err.message || 'An error occurred while changing password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const permissionsList = adminUser?.permissions || [];

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-7">
        
        {/* Left Column: Glassmorphism Avatar & Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md relative">
            {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
            <div className="w-6 h-6 bg-green-500 rounded-full absolute bottom-1 right-1 border-4 border-white" />
          </div>
          
          <h2 className="mt-4 text-lg font-bold text-slate-800 font-aeonik">{fullName || 'Admin User'}</h2>
          <span className="mt-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 capitalize">
            {adminUser?.userType?.toLowerCase() || 'admin'}
          </span>
          <p className="mt-2 text-sm text-slate-400 font-aeonik">{adminUser?.emailAddress || 'No Email'}</p>
          
          <div className="w-full border-t border-slate-100 my-5"></div>
          
          {/* Permissions Grid */}
          <div className="w-full text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assigned Permissions</h3>
            {permissionsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {permissionsList.map((perm, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-700 text-xs font-medium rounded-md border border-slate-200"
                  >
                    <span className="text-green-500 font-bold">✓</span> {perm.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No custom permissions assigned. Full access control.</p>
            )}
          </div>
        </div>

        {/* Right Column: Profile & Settings Tabs */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-colors border-b-2 font-aeonik ${
                activeTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Profile Details
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-colors border-b-2 font-aeonik ${
                activeTab === 'security'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Security Settings
            </button>
          </div>

          <div className="p-6">
            {/* Tab 1: Profile Details Form */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2">
                    <span>✅</span> {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                    <span>❌</span> {profileError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address (Read-only)</label>
                    <input
                      type="email"
                      value={adminUser?.emailAddress || ''}
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm text-slate-400 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHERS">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +2348012345678"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Lagos, Nigeria"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">National Identification Number (NIN)</label>
                    <input
                      type="text"
                      value={nin}
                      onChange={(e) => setNin(e.target.value)}
                      placeholder="11 digits"
                      maxLength={11}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:bg-indigo-400"
                  >
                    {savingProfile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Profile Details'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Security & Password Form */}
            {activeTab === 'security' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                {passwordSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2">
                    <span>✅</span> {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                    <span>❌</span> {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:bg-indigo-400"
                  >
                    {savingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export function ContentRouter({ activeMenu, stats }) {
  const contentMap = {
    'Dashboard': <DashboardContent stats={stats} />,
    'Users': <ManagementContent activeSubmenu="Users" />,
    'Listings': <ManagementContent activeSubmenu="Listing Management" />,
    'Listing Management': <ManagementContent activeSubmenu="Listing Management" />,
    'Bookings': <ManagementContent activeSubmenu="Booking Management" />,
    'Booking Management': <ManagementContent activeSubmenu="Booking Management" />,
    'Transactions': <FinancialManagementContent />,
    'KYC Verification': <ManagementContent activeSubmenu="KYC Verification" />,
    'Admin Management': <ManagementContent activeSubmenu="Admin Management" />,
    'Finance & Growth': <FinancialManagementContent />,
    'Financial Management': <FinancialManagementContent />,
    'Referrals and Reward': <ManagementContent activeSubmenu="Referrals and Reward" />,
    'Coupon Management': <ManagementContent activeSubmenu="Coupon Management" />,
    'Promotions': <PromotionsContent />,
    'Support': <SupportContent />,
    'Support Center': <SupportContent activeSubmenu="Support Center" />,
    'Disputes & Report': <SupportContent activeSubmenu="Disputes & Report" />,
    'Subscription Manager': <SubscriptionContent />,
    'Settings & Controls': <SettingsContent />,
    'Content Moderation': <ContentModerationContent />,
    'Messages Oversight': <MessagesContent />,
    'Audit Logs': <AuditLogsContent />,
    'Profile': <ProfileContent />,
  };

  return contentMap[activeMenu] || contentMap['Dashboard'];
}
