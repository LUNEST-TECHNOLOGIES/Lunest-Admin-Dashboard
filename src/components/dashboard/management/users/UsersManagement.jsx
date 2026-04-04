import React, { useState, useEffect } from 'react';
import { MdSearch, MdTune, MdArrowBack, MdArrowForward, MdMoreVert, MdPerson } from 'react-icons/md';
import { resolveImageUrl } from '../../../../utils/imageUtils';
import BanUserModal from './BanUserModal';
import FlagUserModal from './FlagUserModal';
import ApproveHostModal from './ApproveHostModal';
import RejectHostModal from './RejectHostModal';
import ViewHostApplicationModal from './ViewHostApplicationModal';
import DeactivateUserModal from './DeactivateUserModal';
import ViewUserModal from './ViewUserModal';
import { getUsers, banUser, unbanUser, approveHostApplication, rejectHostApplication } from '../../../../services/adminService';

const UsersManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showApproveHostModal, setShowApproveHostModal] = useState(false);
  const [showRejectHostModal, setShowRejectHostModal] = useState(false);
  const [showViewApplicationModal, setShowViewApplicationModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format currency with 2 decimal places
  const formatCurrency = (amount) => {
    if (!amount) return '₦0.00';
    // Remove ₦ and any formatting
    const numericAmount = parseFloat(amount.toString().replace(/[₦,]/g, ''));
    return `₦${numericAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers();
      console.log('Users response:', response);
      
      // Transform backend data to match UI format
      const backendUsers = response.body || response.data || [];
      const transformedUsers = backendUsers.map((user, index) => {
        // Ensure id is a string (MongoDB ObjectId to string)
        const userId = user._id ? user._id.toString() : (user.id ? user.id.toString() : null);
        console.log(`User ${user.fullName}: id=${userId}, _id=${user._id}, active=${user.active}`);
        
        return {
          id: userId,
          name: user.fullName || 'Unknown User',
          email: user.emailAddress || user.email || 'N/A',
          avatar: user.avatar || null,
          phone: user.phoneNumber || user.phone || 'N/A',
          walletId: user.userID || `LNT${String(index + 1).padStart(7, '0')}`, // User ID starts with LNT
          role: mapUserRole(user.userType),
          subscription: user.subscription || 'Free',
          bookings: user.bookingsCount || 0,
          walletBalance: user.walletBalance || 0,
          status: user.active !== false ? 'Active' : 'Banned', // Default to Active if undefined
          lastActivity: formatLastActivity(user.updatedAt || user.createdAt),
          rawUserType: user.userType,
          verified: user.verified,
          createdAt: user.createdAt,
          hostApplicationStatus: user.hostApplicationStatus || 'NONE',
          kycStatus: user.kycStatus || 'NONE',
          nin: user.nin || null,
        };
      });
      
      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      // Fall back to empty list
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const mapUserRole = (userType) => {
    const roleMap = {
      'GUEST': 'Guests',
      'HOST': 'Host',
      'ADMIN': 'Admin',
      'SUPERADMIN': 'Super Admin',
    };
    return roleMap[userType] || userType || 'Guests';
  };

  const formatLastActivity = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };
  const getSubscriptionColor = (subscription) => {
    switch (subscription) {
      case 'Basic':
        return 'outline-green-700 text-green-700';
      case 'Premium':
        return 'outline-orange-600 text-orange-600';
      case 'Free':
        return 'outline-black text-black';
      case 'N/A':
        return 'outline-neutral-500 text-neutral-500';
      default:
        return 'outline-black text-black';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Host':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Guests':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Admin':
      case 'Super Admin':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredUsers = users.filter(user => {
    // Filter by tab (role)
    let roleMatch = true;
    if (activeTab === 'hosts') {
      roleMatch = user.role === 'Host';
    } else if (activeTab === 'guests') {
      roleMatch = user.role === 'Guests';
    } else if (activeTab === 'pending-hosts') {
      roleMatch = user.hostApplicationStatus === 'PENDING';
    }
    // Tab 'all' shows all users

    // Filter by search query
    const searchMatch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.walletId.toLowerCase().includes(searchQuery.toLowerCase());

    return roleMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Handle ban user
  const handleBanUser = async (userId, reason) => {
    try {
      await banUser(userId, reason);
      await fetchUsers(); // Refresh list
    } catch (err) {
      console.error('Error banning user:', err);
    }
  };

  // Handle unban user
  const handleUnbanUser = async (userId) => {
    try {
      await unbanUser(userId);
      await fetchUsers(); // Refresh list
    } catch (err) {
      console.error('Error unbanning user:', err);
    }
  };

  // Handle approve host application
  const handleApproveHost = async (userId) => {
    try {
      await approveHostApplication(userId);
      await fetchUsers(); // Refresh list
    } catch (err) {
      console.error('Error approving host:', err);
      throw err;
    }
  };

  // Handle reject host application
  const handleRejectHost = async (userId, reason) => {
    try {
      await rejectHostApplication(userId, reason);
      await fetchUsers(); // Refresh list
    } catch (err) {
      console.error('Error rejecting host:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1428px] h-auto relative bg-white rounded-lg flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-aeonik">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-inter relative">
      {/* Header - Tabs */}
      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 inline-flex flex-wrap gap-2 mb-6 transition-all">
        {[
          { id: 'all', label: 'All Users' },
          { id: 'hosts', label: 'Hosts' },
          { id: 'guests', label: 'Guests' },
          { id: 'pending-hosts', label: 'Pending Hosts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
            {tab.id === 'pending-hosts' && (
              <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full ${
                activeTab === tab.id ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
              }`}>
                {users.filter(u => u.hostApplicationStatus === 'PENDING').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Container - Removed overflow-hidden to prevent clipping dropdowns */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col relative">
        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search user name, email, or ID…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-inter placeholder-slate-400"
            />
          </div>

          {/* Filter Button */}
          <button className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex justify-center items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer font-bold text-xs shadow-sm">
            <MdTune className="w-4 h-4" />
            <span className="hidden sm:inline">Priority Filters</span>
          </button>
        </div>

        {/* Table Content with Horizontal Scroll */}
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="min-w-[1200px]">
            {/* Table Header */}
            <div className="w-full px-6 py-4 bg-indigo-50/50 border-b border-slate-100 flex justify-between items-center gap-4">
              <div className="w-10 flex-shrink-0"></div>
              <div className="flex-1 min-w-[200px] text-xs font-bold text-slate-600 uppercase tracking-wider">User Details</div>
              <div className="w-24 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">Role</div>
              <div className="w-28 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">Subscription</div>
              <div className="w-20 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">Bookings</div>
              <div className="w-32 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">Wallet</div>
              <div className="w-24 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">Status</div>
              <div className="w-40 text-xs font-bold text-slate-600 uppercase tracking-wider">Last Activity</div>
              <div className="w-12 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="w-full flex flex-col pb-24">
              {paginatedUsers.map((user, index) => {
                const isLastItems = index >= paginatedUsers.length - 2 && index >= 3;
                return (
                <div
                  key={user.id}
                  className="relative w-full px-6 py-4 border-b border-slate-100 flex items-center hover:bg-slate-50/80 hover:z-50 transition-all gap-4 group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                    {user.avatar ? (
                      <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <MdPerson className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  {/* User Details */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className="text-slate-900 text-sm font-bold truncate">
                        {user.name}
                      </div>
                      {user.hostApplicationStatus === 'PENDING' && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] font-medium truncate max-w-[180px]" title={user.email}>
                      {user.email}
                    </div>
                    <div className="text-slate-400 text-[10px] font-medium mt-0.5">
                      ID: {user.walletId}
                    </div>
                  </div>

                  {/* Role */}
                  <div className="w-24 flex-shrink-0 flex justify-center">
                    <div className={`px-3 py-[5px] rounded-[20px] border flex justify-center items-center ${getRoleColor(user.role)}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{user.role}</span>
                    </div>
                  </div>

                  {/* Subscription */}
                  <div className="w-28 flex-shrink-0 flex justify-center">
                    <div className={`px-3 py-[5px] rounded-[20px] bg-slate-50 border border-slate-200 flex justify-center items-center ${user.subscription === 'Free' ? 'text-slate-400' : 'text-indigo-600'}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{user.subscription}</span>
                    </div>
                  </div>

                  {/* No. of Bookings */}
                  <div className="w-20 text-slate-700 text-xs font-bold flex-shrink-0 flex justify-center">
                    {user.bookings}
                  </div>

                  {/* Wallet Balance */}
                  <div className="w-32 text-slate-900 text-xs font-bold flex-shrink-0 flex justify-center tabular-nums">
                    {formatCurrency(user.walletBalance.toString())}
                  </div>

                  {/* Status */}
                  <div className="w-24 flex-shrink-0 flex justify-center">
                    <div className={`px-3 py-[5px] rounded-[20px] border flex justify-center items-center ${
                      user.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{user.status}</span>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="w-40 flex-shrink-0">
                    <div className="text-slate-500 text-[10px] font-medium truncate">
                      {user.lastActivity}
                    </div>
                  </div>

                  {/* Action Menu */}
                  <div className={`w-8 h-8 flex-shrink-0 relative ${openMenuId === user.id ? 'z-[60]' : 'z-50'}`}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                      className={`w-full h-full flex items-center justify-center rounded-lg border transition-all cursor-pointer shadow-sm ${
                        openMenuId === user.id 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <MdMoreVert className="w-5 h-5 text-current" />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === user.id && (
                      <div className={`absolute ${isLastItems ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 bg-white rounded-xl border border-slate-100 shadow-2xl shadow-slate-200/60 z-50 p-1.5 w-48 animate-in fade-in zoom-in duration-200`}>
                        <div className="flex flex-col gap-0.5">
                          {/* View User Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowViewUserModal(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-indigo-50 hover:text-indigo-700 transition-all group cursor-pointer"
                          >
                            <MdPerson className="w-4.5 h-4.5 text-indigo-600 transition-colors" />
                            <div className="text-xs font-bold">View User</div>
                          </button>

                          {/* Ban/Unban User Button */}
                          {user.status === 'Active' ? (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBanModal(true);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-rose-50 hover:text-rose-700 transition-all group cursor-pointer"
                            >
                              <img src="/assets/icons/action-menu/close-x.svg" alt="Ban" className="w-4.5 h-4.5 opacity-70 group-hover:opacity-100 transition-all" />
                              <div className="text-xs font-bold">Ban User</div>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to unban ${user.name}?`)) {
                                    handleUnbanUser(user.id);
                                }
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-emerald-50 hover:text-emerald-700 transition-all group cursor-pointer"
                            >
                              <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-xs font-bold">Unban User</div>
                            </button>
                          )}

                          {/* Flag User Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowFlagModal(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-slate-50 hover:text-slate-900 transition-all group cursor-pointer"
                          >
                            <img src="/assets/icons/action-menu/vuesax/linear/vuesax/linear/refresh-2.svg" alt="Flag" className="w-4.5 h-4.5 opacity-70 group-hover:opacity-100 transition-all" />
                            <div className="text-xs font-bold">Flag User</div>
                          </button>

                          <div className="my-1 border-t border-slate-50"></div>

                          {/* Host Application Button */}
                          {(user.role === 'Host' || user.hostApplicationStatus === 'PENDING') && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowViewApplicationModal(true);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-indigo-50 hover:text-indigo-700 transition-all group cursor-pointer"
                            >
                              <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <div className="text-xs font-bold">Host Application</div>
                            </button>
                          )}

                          {/* Approve Host Button */}
                          {user.hostApplicationStatus === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowApproveHostModal(true);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-emerald-50 hover:text-emerald-700 transition-all group cursor-pointer"
                            >
                              <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <div className="text-xs font-bold">Approve Host</div>
                            </button>
                          )}

                          {/* Reject Host Button */}
                          {user.hostApplicationStatus === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRejectHostModal(true);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 hover:bg-rose-50 hover:text-rose-700 transition-all group cursor-pointer"
                            >
                              <svg className="w-4.5 h-4.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <div className="text-xs font-bold">Reject Host</div>
                            </button>
                          )}

                          {/* Deactivate/Activate User Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeactivateModal(true);
                              setOpenMenuId(null);
                            }}
                            className={`w-full px-3 py-2 rounded-lg flex justify-start items-center gap-3 transition-all group cursor-pointer ${
                              user.status === 'Active' ? 'hover:bg-rose-50 hover:text-rose-700' : 'hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            {user.status === 'Active' ? (
                              <>
                                <svg className="w-4.5 h-4.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                <div className="text-xs font-bold">Deactivate User</div>
                              </>
                            ) : (
                              <>
                                <svg className="w-4.5 h-4.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-xs font-bold">Activate User</div>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {paginatedUsers.length === 0 && (
          <div className="w-full py-12 flex flex-col justify-center items-center gap-4">
            <p className="text-neutral-500 text-base font-medium font-aeonik">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="p-6 border-t border-slate-100 flex items-center justify-between font-inter">
        <div className="text-sm text-slate-500 font-medium">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              currentPage === 1 
                ? 'text-slate-300 border-slate-100 cursor-not-allowed' 
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <MdArrowBack className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              currentPage === totalPages
                ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <MdArrowForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ban User Modal */}
      {selectedUser && (
        <BanUserModal
          isOpen={showBanModal}
          onClose={() => setShowBanModal(false)}
          user={selectedUser}
        />
      )}

      {/* Flag User Modal */}
      {selectedUser && (
        <FlagUserModal
          isOpen={showFlagModal}
          onClose={() => setShowFlagModal(false)}
          user={selectedUser}
        />
      )}

      {/* Approve Host Modal */}
      {selectedUser && (
        <ApproveHostModal
          isOpen={showApproveHostModal}
          onClose={() => setShowApproveHostModal(false)}
          user={selectedUser}
          onApprove={handleApproveHost}
        />
      )}

      {/* Reject Host Modal */}
      {selectedUser && (
        <RejectHostModal
          isOpen={showRejectHostModal}
          onClose={() => setShowRejectHostModal(false)}
          user={selectedUser}
          onReject={handleRejectHost}
        />
      )}

      {/* View Host Application Modal */}
      {selectedUser && (
        <ViewHostApplicationModal
          isOpen={showViewApplicationModal}
          onClose={() => setShowViewApplicationModal(false)}
          user={selectedUser}
          onApprove={() => {
            setShowViewApplicationModal(false);
            setShowApproveHostModal(true);
          }}
          onReject={() => {
            setShowViewApplicationModal(false);
            setShowRejectHostModal(true);
          }}
        />
      )}

      {/* Deactivate/Activate User Modal */}
      {selectedUser && (
        <DeactivateUserModal
          isOpen={showDeactivateModal}
          onClose={() => setShowDeactivateModal(false)}
          user={selectedUser}
          onSuccess={fetchUsers}
        />
      )}

      {/* View User Modal */}
      {selectedUser && (
        <ViewUserModal
          isOpen={showViewUserModal}
          onClose={() => setShowViewUserModal(false)}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UsersManagement;
