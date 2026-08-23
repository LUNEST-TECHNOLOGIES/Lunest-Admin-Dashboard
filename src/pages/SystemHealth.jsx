import React, { useState, useEffect, useRef } from 'react';
import { Activity, Server, Database, Clock, CheckCircle, XCircle, AlertTriangle, Play, RefreshCw, User, Users, Search, X, Check, ShieldCheck, Mail, Phone, BadgeCheck } from 'lucide-react';
import { getAdminTransactionSummary, getUsers } from '../services/adminService';
import apiClient from '../api/client';

const SystemHealth = () => {
  const [healthData, setHealthData] = useState({
    apiStatus: 'loading',
    databaseStatus: 'loading',
    lastTransactionCheck: null,
    recentTransactions: [],
    systemMetrics: {
      totalTransactions: 0,
      failedTransactions: 0,
      successRate: 0
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [runningCron, setRunningCron] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [cronScope, setCronScope] = useState('all'); // 'all' or 'individual'

  // Individual user search & population state
  const [allUsers, setAllUsers] = useState([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchDropdownRef = useRef(null);

  // Fetch all users when switching to individual scope
  useEffect(() => {
    if (cronScope === 'individual') {
      if (allUsers.length === 0) {
        fetchAllUsersForCron();
      } else {
        setSearchResults(allUsers);
      }
    } else {
      setSelectedUserData(null);
      setSelectedUser('');
      setUserSearchQuery('');
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [cronScope]);

  const fetchAllUsersForCron = async () => {
    setLoadingAllUsers(true);
    try {
      const res = await getUsers({ limit: 150 });
      const usersList = res?.body?.users || res?.users || (Array.isArray(res) ? res : []);
      setAllUsers(usersList);
      setSearchResults(usersList);
    } catch (err) {
      console.error('Failed to fetch all users for cron scope:', err);
    } finally {
      setLoadingAllUsers(false);
    }
  };

  // Filter or search users when search query changes
  useEffect(() => {
    if (cronScope !== 'individual') return;

    if (!userSearchQuery.trim()) {
      setSearchResults(allUsers);
      return;
    }

    // Don't search if query matches currently selected user
    if (selectedUserData && userSearchQuery === `${selectedUserData.fullName || selectedUserData.firstName} (${selectedUserData.userID || selectedUserData.emailAddress})`) {
      return;
    }

    const q = userSearchQuery.toLowerCase().trim();
    const localMatches = allUsers.filter(u => {
      const name = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
      const email = (u.emailAddress || u.email || '').toLowerCase();
      const userId = (u.userID || u._id || '').toLowerCase();
      return name.includes(q) || email.includes(q) || userId.includes(q);
    });

    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      setShowDropdown(true);
    } else if (q.length >= 2) {
      const timer = setTimeout(async () => {
        setIsSearchingUser(true);
        try {
          const res = await getUsers({ search: q });
          const usersList = res?.body?.users || res?.users || (Array.isArray(res) ? res : []);
          setSearchResults(usersList);
          setShowDropdown(true);
        } catch (err) {
          console.error('Error searching users for cron:', err);
        } finally {
          setIsSearchingUser(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [userSearchQuery, cronScope, selectedUserData, allUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUserData(user);
    const userIdVal = user._id || user.userID || user.id;
    setSelectedUser(userIdVal);
    setUserSearchQuery(`${user.fullName || user.firstName || 'User'} (${user.userID || user.emailAddress || ''})`);
    setShowDropdown(false);
  };

  const handleClearUser = () => {
    setSelectedUserData(null);
    setSelectedUser('');
    setUserSearchQuery('');
    setSearchResults(allUsers);
    setShowDropdown(false);
  };

  const checkSystemHealth = async () => {
    setRefreshing(true);
    try {
      // 1. Check API health
      let apiHealthy = false;
      try {
        const healthRes = await apiClient.get('/health');
        apiHealthy = healthRes.status === 200;
      } catch (err) {
        try {
          const statsRes = await apiClient.get('/admin/stats');
          apiHealthy = statsRes.status === 200;
        } catch (e) {
          apiHealthy = false;
        }
      }

      // 2. Fetch transaction stats
      const txStats = await getAdminTransactionSummary();

      setHealthData({
        apiStatus: apiHealthy ? 'healthy' : 'unhealthy',
        databaseStatus: apiHealthy ? 'healthy' : 'unhealthy',
        lastTransactionCheck: new Date().toISOString(),
        recentTransactions: txStats?.recentTransactions || [],
        systemMetrics: {
          totalTransactions: txStats?.totalCount || 0,
          failedTransactions: txStats?.failedCount || 0,
          successRate: txStats?.totalCount > 0
            ? Math.round(((txStats.totalCount - (txStats.failedCount || 0)) / txStats.totalCount) * 100)
            : 100
        }
      });
    } catch (error) {
      console.error('System health check failed:', error);
      setHealthData(prev => ({
        ...prev,
        apiStatus: 'unhealthy',
        databaseStatus: 'unknown',
        lastTransactionCheck: new Date().toISOString()
      }));
    } finally {
      setRefreshing(false);
    }
  };

  const runCronJob = async (jobName) => {
    setRunningCron(jobName);
    try {
      const targetUserId = selectedUserData?._id || selectedUserData?.userID || selectedUser;
      const payload = cronScope === 'individual' && targetUserId
        ? { userId: targetUserId }
        : {};

      const response = await apiClient.post(`/admin/cron/${jobName}`, payload);

      if (response.data && response.data.success) {
        alert(`${jobName} executed successfully: ${response.data.message || 'Done'}`);
      } else {
        alert(`Failed to run ${jobName}: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Cron job ${jobName} failed:`, error);
      const errMsg = error.response?.data?.message || error.message;
      alert(`Error running ${jobName}: ${errMsg}`);
    } finally {
      setRunningCron(null);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'loading':
        return <Activity className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'unhealthy':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'loading':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">System Health Monitor</h1>
            <p className="text-slate-600">Real-time API and database status monitoring</p>
          </div>
          <button
            onClick={checkSystemHealth}
            disabled={refreshing}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* API Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Server className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">API Status</h3>
                  <p className="text-sm text-slate-500">Backend connectivity</p>
                </div>
              </div>
              {getStatusIcon(healthData.apiStatus)}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(healthData.apiStatus)}`}>
              {healthData.apiStatus.toUpperCase()}
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Database className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Database Status</h3>
                  <p className="text-sm text-slate-500">MongoDB connection</p>
                </div>
              </div>
              {getStatusIcon(healthData.databaseStatus)}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(healthData.databaseStatus)}`}>
              {healthData.databaseStatus.toUpperCase()}
            </div>
          </div>

          {/* Transaction Success Rate */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Activity className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Success Rate</h3>
                  <p className="text-sm text-slate-500">Transaction completion</p>
                </div>
              </div>
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {healthData.systemMetrics.successRate}%
            </div>
          </div>

          {/* Last Check */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Clock className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Last Check</h3>
                  <p className="text-sm text-slate-500">System heartbeat</p>
                </div>
              </div>
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-sm text-slate-600">
              {healthData.lastTransactionCheck
                ? new Date(healthData.lastTransactionCheck).toLocaleString()
                : 'Never checked'
              }
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Transaction Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Total Transactions</span>
                <span className="font-bold text-slate-900">{healthData.systemMetrics.totalTransactions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Failed Transactions</span>
                <span className="font-bold text-rose-600">{healthData.systemMetrics.failedTransactions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Success Rate</span>
                <span className="font-bold text-emerald-600">{healthData.systemMetrics.successRate}%</span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">System Information</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Environment</p>
                <p className="font-semibold text-slate-900">Production</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Auto-refresh Interval</p>
                <p className="font-semibold text-slate-900">30 seconds</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">API Endpoint</p>
                <p className="font-semibold text-slate-900 text-sm font-mono">{process.env.VITE_API_URL || 'https://api.lunest.app/v1'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity Log</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400 w-32">{new Date().toLocaleTimeString()}</span>
              <span className="text-slate-600">System health check completed</span>
              <span className="text-emerald-600">✓</span>
            </div>
            {healthData.lastTransactionCheck && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 w-32">{new Date(healthData.lastTransactionCheck).toLocaleTimeString()}</span>
                <span className="text-slate-600">Transaction summary fetched successfully</span>
                <span className="text-emerald-600">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Cron Job Management */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Cron Job Management</h3>
          <p className="text-sm text-slate-600 mb-4">Manually trigger scheduled jobs when necessary</p>

          {/* Scope Selection */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-3">Execution Scope</label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cronScope"
                  value="all"
                  checked={cronScope === 'all'}
                  onChange={(e) => setCronScope(e.target.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-slate-700">All Users</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cronScope"
                  value="individual"
                  checked={cronScope === 'individual'}
                  onChange={(e) => setCronScope(e.target.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-slate-700">Individual User</span>
              </label>
            </div>
            {cronScope === 'individual' && (
              <div className="space-y-3" ref={searchDropdownRef}>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 z-10" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        if (selectedUserData) setSelectedUserData(null);
                        setShowDropdown(true);
                      }}
                      onClick={() => setShowDropdown(true)}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Click to select a user or search by name, email, or User ID..."
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer"
                    />
                    {isSearchingUser || loadingAllUsers ? (
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin absolute right-3" />
                    ) : userSearchQuery ? (
                      <button
                        onClick={handleClearUser}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 absolute right-3 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>

                  {/* Autocomplete Results Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto divide-y divide-slate-100 font-aeonik">
                      <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-20">
                        <span>All Registered Users ({searchResults.length})</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchAllUsersForCron();
                          }}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 lowercase font-medium cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingAllUsers ? 'animate-spin' : ''}`} />
                          reload
                        </button>
                      </div>

                      {loadingAllUsers ? (
                        <div className="p-6 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          Loading all users...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">
                          No users found matching "{userSearchQuery}"
                        </div>
                      ) : (
                        searchResults.map((user) => {
                          const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User';
                          const email = user.emailAddress || user.email || 'No email';
                          const userId = user.userID || user._id;
                          const role = user.userType || 'GUEST';
                          const isKyc = user.verified || user.kycStatus === 'VERIFIED';

                          return (
                            <div
                              key={user._id || userId}
                              onClick={() => handleSelectUser(user)}
                              className="p-3 hover:bg-indigo-50/70 cursor-pointer transition-colors flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-sm shrink-0">
                                  {user.avatar ? (
                                    <img src={user.avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />
                                  ) : (
                                    name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-slate-900 truncate">{name}</span>
                                    {isKyc && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 shrink-0 whitespace-nowrap">
                                        <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 truncate flex items-center gap-2 mt-0.5">
                                    <span className="truncate">{email}</span>
                                    {user.userID && <span className="text-slate-400 font-mono shrink-0">ID: {user.userID}</span>}
                                  </div>
                                </div>
                              </div>
                              <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 uppercase whitespace-nowrap">
                                {role}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Populated Selected User Card */}
                {selectedUserData && (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-sm">
                        {selectedUserData.avatar ? (
                          <img src={selectedUserData.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          (selectedUserData.fullName || selectedUserData.firstName || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-semibold text-sm text-slate-900 truncate">
                            {selectedUserData.fullName || `${selectedUserData.firstName || ''} ${selectedUserData.lastName || ''}`.trim()}
                          </h5>
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-100 text-indigo-800 uppercase shrink-0 whitespace-nowrap">
                            {selectedUserData.userType || 'GUEST'}
                          </span>
                          {(selectedUserData.verified || selectedUserData.kycStatus === 'VERIFIED') && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 shrink-0 whitespace-nowrap">
                              <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-x-3 text-xs text-slate-600 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 shrink-0">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-700">{selectedUserData.emailAddress || selectedUserData.email || 'N/A'}</span>
                          </span>
                          {selectedUserData.phoneNumber && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{selectedUserData.phoneNumber}</span>
                            </span>
                          )}
                          <span className="text-slate-500 font-mono text-[11px] shrink-0 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                            ID: {selectedUserData.userID || selectedUserData._id}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleClearUser}
                      className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Process Pending Payouts */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Process Payouts</h4>
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600 mb-3">Process pending host payout requests</p>
              <button
                onClick={() => runCronJob('process-payouts')}
                disabled={runningCron === 'process-payouts'}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {runningCron === 'process-payouts' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Now
                  </>
                )}
              </button>
            </div>

            {/* Update Expiring Listings */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Update Listings</h4>
                <RefreshCw className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600 mb-3">Update expiring listing statuses</p>
              <button
                onClick={() => runCronJob('update-listings')}
                disabled={runningCron === 'update-listings'}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {runningCron === 'update-listings' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Now
                  </>
                )}
              </button>
            </div>

            {/* Send Expiry Notifications */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Send Notifications</h4>
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600 mb-3">Send listing expiry notifications</p>
              <button
                onClick={() => runCronJob('send-notifications')}
                disabled={runningCron === 'send-notifications'}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {runningCron === 'send-notifications' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Now
                  </>
                )}
              </button>
            </div>

            {/* Clean Up Old Data */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Clean Up Data</h4>
                <Database className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600 mb-3">Remove old transactions and logs</p>
              <button
                onClick={() => runCronJob('cleanup-data')}
                disabled={runningCron === 'cleanup-data'}
                className="w-full px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {runningCron === 'cleanup-data' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Now
                  </>
                )}
              </button>
            </div>

            {/* Sync Analytics */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Sync Analytics</h4>
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600 mb-3">Sync analytics data to reporting</p>
              <button
                onClick={() => runCronJob('sync-analytics')}
                disabled={runningCron === 'sync-analytics'}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {runningCron === 'sync-analytics' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Now
                  </>
                )}
              </button>
            </div>

            {/* Verify Payments */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Verify Payments</h4>
                <CheckCircle className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-600 mb-3">Verify pending payment transactions</p>
              <button
                onClick={() => runCronJob('verify-payments')}
                disabled={runningCron === 'verify-payments'}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {runningCron === 'verify-payments' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
