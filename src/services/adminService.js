import apiClient from '../api/client';

// ============================================
// AUTHENTICATION
// ============================================

export const loginUser = async(emailAddress, password) => {
    const response = await apiClient.post('/users/login', {
        emailAddress,
        password,
    });
    return response.data;
};

export const forgotPassword = async(emailAddress) => {
    const response = await apiClient.post('/users/forgot-password', { emailAddress });
    return response.data;
};

export const verifyResetCode = async(emailAddress, code) => {
    const response = await apiClient.post('/users/verify-reset-code', { emailAddress, code });
    return response.data;
};

export const resetPassword = async(token, newPassword) => {
    const response = await apiClient.post('/users/reset-password', { token, newPassword });
    return response.data;
};

export const refreshToken = async(refreshToken) => {
    const response = await apiClient.post('/users/refresh', { refreshToken });
    return response.data;
};

export const logoutUser = async() => {
    const response = await apiClient.post('/users/logout');
    localStorage.removeItem('authToken');
    return response.data;
};

export const getCurrentUser = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error decoding token:', e);
        return null;
    }
};

// ============================================
// ADMIN MANAGEMENT
// ============================================

export const getAdmins = async() => {
    const response = await apiClient.get('/admin/all');
    return response.data;
};

export const createAdmin = async(data) => {
    const response = await apiClient.post('/admin/create', data);
    return response.data;
};

export const updateAdmin = async(adminId, data) => {
    const response = await apiClient.patch('/admin/' + adminId, data);
    return response.data;
};

export const deleteAdmin = async(adminId) => {
    const response = await apiClient.delete('/admin/' + adminId);
    return response.data;
};

// ============================================
// USERS MANAGEMENT
// ============================================

export const getUsers = async(filters = {}) => {
    const response = await apiClient.post('/users/all', filters);
    return response.data;
};

export const getUserById = async(userId) => {
    const response = await apiClient.get('/users/' + userId);
    return response.data;
};

export const updateUser = async(userId, data) => {
    const response = await apiClient.patch('/users/' + userId, data);
    return response.data;
};

export const banUser = async(userId, reason) => {
    const response = await apiClient.patch('/users/' + userId, {
        active: false,
        banReason: reason
    });
    return response.data;
};

export const unbanUser = async(userId) => {
    const response = await apiClient.patch('/users/' + userId, {
        active: true,
        banReason: null
    });
    return response.data;
};

/**
 * Toggle user account status (activate/deactivate)
 * @param {string} userId - The user's MongoDB ID
 * @param {boolean} active - Whether to activate (true) or deactivate (false) the account
 * @param {string} reason - Reason for deactivation (required when deactivating)
 */
export const toggleUserStatus = async(userId, active, reason = '') => {
    console.log('toggleUserStatus called:', { userId, active, reason });
    console.log('API URL:', `/users/${userId}/toggle-status`);

    const response = await apiClient.post(`/users/${userId}/toggle-status`, {
        active,
        reason
    });
    return response.data;
};

// Host Application Actions
export const approveHostApplication = async(userId) => {
    const response = await apiClient.post('/users/' + userId + '/approve-host');
    return response.data;
};

export const rejectHostApplication = async(userId, reason) => {
    const response = await apiClient.post('/users/' + userId + '/reject-host', { reason });
    return response.data;
};

export const getHostApplication = async(userId) => {
    const response = await apiClient.get('/users/' + userId + '/host-application');
    return response.data;
};

// ============================================
// LISTINGS MANAGEMENT
// ============================================

export const getListings = async(filters = {}) => {
    try {
        // Check if token exists first
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('⚠️ No auth token found in localStorage');
            throw new Error('❌ No auth token found - Please log in with admin credentials');
        }

        // Decode token to check payload
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
            try {
                const decoded = JSON.parse(atob(tokenParts[1]));
                console.log('🔓 Token decoded:', {
                    sub: decoded.sub,
                    userType: decoded.userType,
                    emailAddress: decoded.emailAddress,
                    type: decoded.type,
                    exp: decoded.exp
                });
            } catch (e) {
                console.error('Error decoding token:', e);
            }
        }

        console.log('📤 Requesting POST /admin/listings');
        console.log('🔑 Auth token present:', token.substring(0, 20) + '...');
        console.log('📋 Filters:', filters);

        // Try admin endpoint first, fall back to public endpoint if it fails
        let response;
        try {
            response = await apiClient.post('/admin/listings', filters);
        } catch (adminError) {
            console.warn('⚠️ Admin endpoint (POST /admin/listings) failed, using fallback endpoint...');
            // Corrected fallback: The backend route is /v1/listings (POST), not /v1/listings/listing
            response = await apiClient.post('/listings', filters);
        }

        // Verify response structure
        if (!response || !response.data) {
            throw new Error('Invalid response from server');
        }

        const listingCount = response.data && response.data.body ? response.data.body.length : 0;
        console.log('✅ Admin endpoint success');
        console.log('📊 Listings count:', listingCount);
        console.log('📊 Response structure:', {
            hasBody: !!response.data.body,
            isArray: Array.isArray(response.data.body),
            message: response.data.message
        });

        return response.data;
    } catch (error) {
        console.error('❌ Failed to fetch listings');
        console.error('Error message:', error.message);

        const errorStatus = error && error.response ? error.response.status : null;
        const errorData = error && error.response ? error.response.data : null;
        const errorMessage = errorData && errorData.message ? errorData.message : error.message;
        const errorUrl = error && error.config ? error.config.url : '/admin/listings';

        console.error('Error details:', {
            status: errorStatus,
            statusText: error && error.response ? error.response.statusText : null,
            message: errorMessage,
            url: errorUrl,
            endpoint: `POST /v1${errorUrl}`,
            data: errorData
        });

        // Specific error handling
        if (errorStatus === 401) {
            throw new Error('❌ UNAUTHORIZED (401) - Invalid or expired admin token. Log in again with admin credentials');
        } else if (errorStatus === 403) {
            throw new Error('❌ FORBIDDEN (403) - Your account does not have admin privileges');
        } else if (errorStatus === 404) {
            throw new Error(`❌ NOT FOUND (404) - Endpoint /admin/listings not available. Verify backend is running at ${apiClient.defaults.baseURL}`);
        } else if (error.code === 'ERR_NETWORK') {
            throw new Error(`❌ NETWORK ERROR - Cannot reach backend at ${apiClient.defaults.baseURL}. Is backend running?`);
        } else if (error.message.includes('No auth token')) {
            throw error; // Re-throw token check error
        } else {
            throw new Error(`❌ Failed to fetch listings: ${errorMessage}`);
        }
    }
};

export const getListing = async(listingId) => {
    const response = await apiClient.post('/listings/single', { id: listingId });
    return response.data;
};

export const getListingById = async(listingId) => {
    const response = await apiClient.get('/listings/' + listingId);
    return response.data;
};

export const updateListing = async(listingId, data) => {
    const response = await apiClient.patch('/listings/update/' + listingId, data);
    return response.data;
};

export const approveListing = async(listingId) => {
    const response = await apiClient.post('/listings/' + listingId + '/approve');
    return response.data;
};

export const rejectListing = async(listingId, reason) => {
    const response = await apiClient.post('/listings/' + listingId + '/reject', { reason });
    return response.data;
};

export const suspendListing = async(listingId, reason) => {
    const response = await apiClient.post('/listings/' + listingId + '/suspend', { reason });
    return response.data;
};

export const deleteListing = async(listingId) => {
    const response = await apiClient.delete('/listings/delete/' + listingId);
    return response.data;
};

// Mass actions for listings
export const massApproveListing = async(listingIds) => {
    const results = await Promise.all(
        listingIds.map(id => approveListing(id))
    );
    return results;
};

export const massRejectListing = async(listingIds, reason) => {
    const results = await Promise.all(
        listingIds.map(id => rejectListing(id, reason))
    );
    return results;
};

// ============================================
// BOOKINGS MANAGEMENT
// ============================================

export const getBookings = async(filters = {}) => {
    const response = await apiClient.post('/bookings', filters);
    return response.data;
};

export const getBooking = async(bookingId) => {
    const response = await apiClient.post('/bookings/single', { id: bookingId });
    return response.data;
};

export const updateBooking = async(bookingId, data) => {
    const response = await apiClient.patch('/bookings/' + bookingId, data);
    return response.data;
};

export const cancelBooking = async(bookingId, reason) => {
    const response = await apiClient.patch('/bookings/' + bookingId, {
        status: 'CANCELLED',
        cancellationReason: reason
    });
    return response.data;
};

export const approveRefund = async(bookingId, amount) => {
    const response = await apiClient.patch('/bookings/' + bookingId, {
        refundApproved: true,
        refundAmount: amount,
        status: 'CANCELLED'
    });
    return response.data;
};

export const resolveCautionFee = async(bookingRef, action, reason, claimAmount = 0) => {
    const response = await apiClient.post(`/bookings/reference/${bookingRef}/resolve-caution`, {
        action,
        reason,
        claimAmount
    });
    return response.data;
};

export const updateBookingInternalNote = async(bookingRef, note) => {
    const response = await apiClient.patch(`/bookings/reference/${bookingRef}/internal-note`, {
        note
    });
    return response.data;
};

export const resolveDispute = async(bookingId, guestRefundAmount, hostPayoutAmount, reason, targetStatus = 'CANCELLED') => {
    const response = await apiClient.post(`/bookings/${bookingId}/resolve-dispute`, {
        guestRefundAmount,
        hostPayoutAmount,
        reason,
        targetStatus
    });
    return response.data;
};

// ============================================
// KYC VERIFICATION
// ============================================

export const getKYCSubmissions = async(filters = {}) => {
    const response = await apiClient.post('/users/all', filters);
    return response.data;
};

export const approveKYC = async(userId) => {
    const response = await apiClient.patch('/users/' + userId, {
        verified: true,
        kycStatus: 'APPROVED'
    });
    return response.data;
};

export const rejectKYC = async(userId, reason) => {
    const response = await apiClient.patch('/users/' + userId, {
        verified: false,
        kycStatus: 'REJECTED',
        kycRejectionReason: reason
    });
    return response.data;
};

// ============================================
// TRANSACTIONS
// ============================================

export const getTransactions = async(filters = {}) => {
    // Backend requires at least one criteria. If filters is empty, send a dummy criteria 
    // that matches everything (e.g., status exists).
    // Note: We avoid _id because the backend checks mongoose.Types.ObjectId.isValid(_id)
    // which fails if we pass an operator object like { $exists: true }
    const criteria = Object.keys(filters).length === 0 
        ? { status: { $exists: true } } 
        : filters;
        
    const response = await apiClient.post('/transactions/transaction', criteria);
    return response.data;
};

// ============================================
// ADMIN TRANSACTIONS (New Refactored)
// ============================================

export const getAdminTransactions = async(params = {}) => {
    const response = await apiClient.get('/admin/transactions', { params });
    return response.data;
};

export const getAdminTransactionSummary = async(params = {}) => {
    const response = await apiClient.get('/admin/transactions/summary', { params });
    return response.data;
};

export const exportAdminTransactions = async(params = {}) => {
    const response = await apiClient.get('/admin/transactions/export', { 
        params,
        responseType: 'blob' 
    });
    return response.data;
};

export const getTransaction = async(transactionId) => {
    const response = await apiClient.post('/transactions/transaction/single', { id: transactionId });
    return response.data;
};

export const manualVerifyTransaction = async(reference) => {
    const response = await apiClient.post('/admin/transactions/manual-verify', { reference });
    return response.data;
};

export const verifyWithdrawalStatus = async(reference) => {
    const response = await apiClient.post(`/admin/transactions/verify-withdrawal/${reference}`);
    return response.data;
};

export const finalizeWithdrawal = async(transferCode, otp, reference) => {
    const response = await apiClient.post('/admin/transactions/withdraw/finalize', { 
        transfer_code: transferCode, 
        otp,
        reference
    });
    return response.data;
};

export const resendWithdrawalOTP = async(reference) => {
    const response = await apiClient.post('/admin/transactions/withdraw/resend-otp', { 
        reference 
    });
    return response.data;
};

// ============================================
// COUPONS
// ============================================

export const getCoupons = async() => {
    const response = await apiClient.post('/coupons');
    return response.data;
};

export const createCoupon = async(data) => {
    const response = await apiClient.post('/coupons/coupon', data);
    return response.data;
};

export const deleteCoupon = async(couponId) => {
    const response = await apiClient.delete('/coupons/' + couponId);
    return response.data;
};

// ============================================
// WALLET
// ============================================

export const getWallets = async() => {
    const response = await apiClient.get('/wallets');
    return response.data;
};

export const getWallet = async(userId) => {
    const response = await apiClient.post('/wallets/wallet', { userId });
    return response.data;
};

export const manualWalletAdjustment = async(data) => {
    const response = await apiClient.post('/admin/wallets/adjustment', data);
    return response.data;
};

// ============================================
// ADMIN NOTIFICATIONS (for dashboard)
// ============================================

export const getAdminNotifications = async(filters = {}) => {
    const response = await apiClient.post('/admin/notifications', filters);
    return response.data;
};

export const markNotificationRead = async(notificationId) => {
    const response = await apiClient.patch('/admin/notifications/' + notificationId + '/read');
    return response.data;
};

export const markAllNotificationsRead = async() => {
    const response = await apiClient.patch('/admin/notifications/read-all');
    return response.data;
};

// ============================================
// AUDIT LOGS
// ============================================

export const getAuditLogs = async(filters = {}) => {
    try {
        const response = await apiClient.post('/admin/notifications', {
            ...filters,
            limit: filters.limit || 50
        });

        if (response.data && response.data.body && response.data.body.notifications) {
            return {
                body: response.data.body.notifications.map(n => ({
                    id: n._id,
                    type: n.type,
                    action: n.title,
                    description: n.message,
                    priority: n.priority,
                    timestamp: n.createdAt,
                    user: (n.relatedUser && n.relatedUser.fullName) || 'System',
                    userEmail: (n.relatedUser && n.relatedUser.emailAddress) || '',
                    category: getAuditCategory(n.type),
                    status: n.read ? 'reviewed' : 'pending'
                })),
                totalCount: response.data.body.totalCount || 0,
                unreadCount: response.data.body.unreadCount || 0,
                pagination: response.data.body.pagination || {
                    page: filters.page || 1,
                    limit: filters.limit || 50,
                    total: response.data.body.totalCount || 0,
                    pages: Math.ceil((response.data.body.totalCount || 0) / (filters.limit || 50))
                }
            };
        }
        return { body: [], totalCount: 0 };
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return { body: [] };
    }
};

// Map notification types to audit categories
const getAuditCategory = (type) => {
    const categoryMap = {
        'USER_REGISTERED': 'User Management',
        'HOST_APPLICATION': 'User Management',
        'NEW_LISTING': 'Listings',
        'NEW_BOOKING': 'Bookings',
        'BOOKING_CANCELLED': 'Bookings',
        'BOOKING_COMPLETED': 'Bookings',
        'CHECKOUT_CONFIRMED': 'Bookings',
        'KYC_SUBMITTED': 'Verification',
        'PAYOUT_REQUEST': 'Finance',
        'DISPUTE_OPENED': 'Disputes',
        'LISTING_REPORTED': 'Content Moderation',
        'USER_REPORTED': 'Content Moderation',
        'WITHDRAWAL_REQUEST': 'Finance',
        'CAUTION_FEE_RESOLVED': 'Finance',
        'WALLET_ADJUSTED': 'Finance',
        'PAYMENT_PROCESSED': 'Finance',
        'COUPON_REDEEMED': 'Finance',
        'LUNA_AGENT_ACTIVITY': 'System / AI Agent'
    };
    return categoryMap[type] || 'System';
};


// ============================================
// ACTIVITY SUMMARY (for dashboard)
// ============================================

export const getActivitySummary = async(limit = 10) => {
    try {
        const response = await apiClient.post('/admin/notifications', { limit });

        if (response.data && response.data.body && response.data.body.notifications) {
            return response.data.body.notifications.map(n => ({
                id: n._id,
                initials: getInitials((n.relatedUser && n.relatedUser.fullName) || 'SY'),
                name: (n.relatedUser && n.relatedUser.fullName) || 'System',
                action: n.message,
                time: formatTimeAgo(n.createdAt),
                category: getAuditCategory(n.type),
                priority: n.priority === 'high' ? 'High' : n.priority === 'medium' ? 'Medium' : 'Low',
                priorityColor: n.priority === 'high' ? 'red' : n.priority === 'medium' ? 'orange' : 'green'
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching activity summary:', error);
        return [];
    }
};

// Helper to get initials from name
const getInitials = (name) => {
    if (!name) return 'SY';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Helper to format time ago
const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + ' min ago';
    if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
    if (diffDays < 7) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
    return date.toLocaleDateString();
};


// ============================================
// USER NOTIFICATIONS
// ============================================

export const getNotifications = async() => {
    // Backend AdminRoute mounts getNotifications at /admin/notifications (POST)
    const response = await apiClient.post('/admin/notifications');
    return response.data;
};

export const deleteNotification = async(notifId) => {
    const response = await apiClient.delete('/notifications/' + notifId);
    return response.data;
};

// ============================================
// DASHBOARD STATS
// ============================================

export const getDashboardStats = async() => {
    try {
        const response = await apiClient.get('/admin/stats');
        if (response.data && response.data.body) {
            const stats = response.data.body;
            return {
                totalUsers: (stats.users && stats.users.total) || 0,
                totalGuests: (stats.users && stats.users.guests) || 0,
                totalHosts: (stats.users && stats.users.hosts) || 0,
                totalAdmins: (stats.users && stats.users.admins) || 0,
                totalListings: (stats.listings && stats.listings.total) || 0,
                activeListings: (stats.listings && stats.listings.active) || 0,
                pendingListings: (stats.listings && stats.listings.pending) || 0,
                totalBookings: (stats.bookings && stats.bookings.total) || 0,
                activeBookings: (stats.bookings && stats.bookings.active) || 0,
                pendingBookings: (stats.bookings && stats.bookings.pending) || 0,
                pendingKYC: stats.pendingKYC || 0,
                pendingHostApplications: stats.pendingHostApplications || 0,
                unreadNotifications: stats.unreadNotifications || 0,
                totalRevenue: stats.totalRevenue || 0,
                platformFees: stats.platformFees || 0,
                openDisputes: stats.openDisputes || 0,
            };
        }
        return getFallbackStats();
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return getFallbackStats();
    }
};

// Fallback stats function for when admin endpoint fails
const getFallbackStats = async() => {
    try {
        const [usersRes, listingsRes, bookingsRes] = await Promise.all([
            apiClient.post('/users/all', {}),
            apiClient.post('/listings/listing', {}),
            apiClient.post('/bookings', {})
        ]);

        const users = (usersRes.data && usersRes.data.body) || [];
        const listings = (listingsRes.data && listingsRes.data.body) || [];
        const bookings = (bookingsRes.data && bookingsRes.data.body) || [];

        return {
            totalUsers: users.length,
            totalGuests: users.filter(u => u.userType === 'GUEST').length,
            totalHosts: users.filter(u => u.userType === 'HOST').length,
            totalAdmins: users.filter(u => ['ADMIN', 'SUPERADMIN'].includes(u.userType)).length,
            totalListings: listings.length,
            activeListings: listings.filter(l => l.status === 'AVAILABLE').length,
            pendingListings: listings.filter(l => l.status === 'PENDING').length,
            totalBookings: bookings.length,
            activeBookings: bookings.filter(b => ['CONFIRMED', 'ONGOING'].includes(b.status)).length,
            pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
            pendingKYC: users.filter(u => !u.verified && u.active).length,
            unreadNotifications: 0,
        };
    } catch (error) {
        console.error('Error in fallback stats:', error);
        return {
            totalUsers: 0,
            totalGuests: 0,
            totalHosts: 0,
            totalAdmins: 0,
            totalListings: 0,
            activeListings: 0,
            pendingListings: 0,
            totalBookings: 0,
            activeBookings: 0,
            pendingBookings: 0,
            pendingKYC: 0,
            unreadNotifications: 0,
        };
    }
};

// ============================================
// REFERRAL & POINTS MANAGEMENT (Admin)
// ============================================

export const getReferralStats = async () => {
    const response = await apiClient.get('/admin/referrals/stats');
    return response.data;
};

export const getReferralTree = async (page = 1, limit = 20, search = '') => {
    const params = { page, limit };
    if (search) params.search = search;
    const response = await apiClient.get('/admin/referrals/tree', { params });
    return response.data;
};

export const getReferredUsers = async (referrerId) => {
    const response = await apiClient.get(`/admin/referrals/referred-users/${referrerId}`);
    return response.data;
};

export const getReferralLeaderboard = async (limit = 50, search = '') => {
    const params = { limit };
    if (search) params.search = search;
    const response = await apiClient.get('/admin/referrals/leaderboard', { params });
    return response.data;
};

export const getManualRewardLogs = async (page = 1, limit = 20) => {
    const response = await apiClient.get('/admin/referrals/manual-rewards', { params: { page, limit } });
    return response.data;
};

export const adminCreditPoints = async (userId, points, reason) => {
    const response = await apiClient.post('/admin/referrals/credit-points', { userId, points, reason });
    return response.data;
};

export const assignCustomReferralCode = async (identifier, customCode) => {
    const payload = (typeof identifier === 'string' && identifier.includes('@'))
        ? { emailAddress: identifier, customCode }
        : { userId: identifier, customCode };
    const response = await apiClient.post('/admin/referrals/custom-code', payload);
    return response.data;
};

export const getCreditBonusUsers = async (page = 1, limit = 20, search = '') => {
    const params = { page, limit };
    if (search) params.search = search;
    const response = await apiClient.get('/admin/referrals/credit-bonus', { params });
    return response.data;
};

export const getPromoImpact = async () => {
    const response = await apiClient.get('/admin/referrals/promo-impact');
    return response.data;
};

// ============================================
// COUPON MANAGEMENT (Admin)
// ============================================

export const getAdminCoupons = async (page = 1, limit = 20, search = '', filter = '') => {
    const params = { page, limit };
    if (search) params.search = search;
    if (filter) params.filter = filter;
    const response = await apiClient.get('/admin/referrals/coupons', { params });
    return response.data;
};

export const getCouponStats = async () => {
    const response = await apiClient.get('/admin/referrals/coupons/stats');
    return response.data;
};

export const adminCreateCoupon = async (data) => {
    const response = await apiClient.post('/admin/referrals/coupons', data);
    return response.data;
};

export const adminDeleteCoupon = async (couponId) => {
    const response = await apiClient.delete(`/admin/referrals/coupons/${couponId}`);
    return response.data;
};

// ============================================
// PROFILE & SECURITY MANAGEMENT
// ============================================

export const updateAdminProfile = async (data) => {
    const response = await apiClient.patch('/users/profile', data);
    return response.data;
};

export const updateAdminPassword = async (currentPassword, newPassword, confirmPassword) => {
    const response = await apiClient.post('/users/update-password', {
        currentPassword,
        newPassword,
        confirmPassword
    });
    return response.data;
};