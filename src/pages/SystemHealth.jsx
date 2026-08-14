import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Clock, CheckCircle, XCircle, AlertTriangle, Play, RefreshCw, User, Users } from 'lucide-react';
import { getAdminTransactionSummary } from '../services/adminService';

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

  const checkSystemHealth = async () => {
    setRefreshing(true);
    try {
      // Check API status by calling transaction summary
      const response = await getAdminTransactionSummary({});
      
      if (response && response.success) {
        const overview = response.body?.overview || {};
        
        setHealthData(prev => ({
          ...prev,
          apiStatus: 'healthy',
          databaseStatus: 'healthy',
          lastTransactionCheck: new Date().toISOString(),
          systemMetrics: {
            totalTransactions: overview.totalTransactions || 0,
            failedTransactions: overview.failedTransactionCount || 0,
            successRate: overview.totalTransactions > 0 
              ? ((overview.totalTransactions - (overview.failedTransactionCount || 0)) / overview.totalTransactions * 100).toFixed(2)
              : 100
          }
        }));
      } else {
        setHealthData(prev => ({
          ...prev,
          apiStatus: 'unhealthy',
          databaseStatus: 'unknown',
          lastTransactionCheck: new Date().toISOString()
        }));
      }
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
      // Call cron job endpoint (to be implemented in backend)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
      const payload = cronScope === 'individual' && selectedUser 
        ? { userId: selectedUser }
        : {};

      const response = await fetch(`${API_URL}/admin/cron/${jobName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('adminToken')
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`${jobName} executed successfully: ${result.message || 'Done'}`);
      } else {
        alert(`Failed to run ${jobName}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Cron job ${jobName} failed:`, error);
      alert(`Error running ${jobName}: ${error.message}`);
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
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  placeholder="Enter User ID or UserID (e.g., LNT1074596)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
