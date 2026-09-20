import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Send,
  UserX,
  FileText,
  User,
  Clock
} from 'lucide-react';
import {
  getScreenedMessages,
  overrideMessageStatus,
  getModerationReports,
  resolveModerationReport,
  sendSupportNotice,
  broadcastNotice
} from '../../../../services/adminService';

export default function ModerationCenter() {
  const [activeTab, setActiveTab] = useState('screened_messages'); // 'screened_messages' | 'reports' | 'support_notice'

  // Screened messages state
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageStatusFilter, setMessageStatusFilter] = useState('ALL');
  const [messageSearch, setMessageSearch] = useState('');
  const [processingMsgId, setProcessingMsgId] = useState(null);

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING');
  const [resolvingReportId, setResolvingReportId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Support notice state
  const [noticeMode, setNoticeMode] = useState('conversation'); // 'conversation' | 'broadcast'
  const [targetConvId, setTargetConvId] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [injectIntoConversations, setInjectIntoConversations] = useState(false);
  const [sendingNotice, setSendingNotice] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'screened_messages') {
      fetchScreenedMessages();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, messageStatusFilter, reportStatusFilter]);

  const fetchScreenedMessages = async () => {
    try {
      setMessagesLoading(true);
      const params = {};
      if (messageStatusFilter !== 'ALL') {
        params.status = messageStatusFilter;
      }
      const res = await getScreenedMessages(params);
      const data = res.body?.messages || res.body || [];
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch screened messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const params = { status: reportStatusFilter };
      const res = await getModerationReports(params);
      const data = res.body?.reports || res.body || [];
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch moderation reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleOverrideStatus = async (messageId, status) => {
    try {
      setProcessingMsgId(messageId);
      const res = await overrideMessageStatus(messageId, status, `Admin override to ${status}`);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, status } : m))
        );
      }
    } catch (err) {
      alert(`Failed to update message: ${err.message || 'Unknown error'}`);
    } finally {
      setProcessingMsgId(null);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      setResolvingReportId(reportId);
      const res = await resolveModerationReport(reportId, action, resolutionNotes || `Action: ${action}`);
      if (res.success) {
        alert(`Report successfully resolved with action: ${action}`);
        setResolutionNotes('');
        fetchReports();
      }
    } catch (err) {
      alert(`Failed to resolve report: ${err.message || 'Unknown error'}`);
    } finally {
      setResolvingReportId(null);
    }
  };

  const handleSendSupportNotice = async (e) => {
    e.preventDefault();
    if (!noticeContent.trim()) return;

    try {
      setSendingNotice(true);
      setNoticeSuccess('');

      if (noticeMode === 'conversation') {
        if (!targetConvId.trim()) return;
        const res = await sendSupportNotice(targetConvId.trim(), noticeContent.trim());
        if (res.success) {
          setNoticeSuccess('Official LUNEST Support Notice successfully sent to the conversation thread.');
          setNoticeContent('');
        }
      } else {
        const res = await broadcastNotice(noticeContent.trim(), noticeTitle.trim() || undefined, injectIntoConversations);
        if (res.success) {
          const body = res.body || {};
          setNoticeSuccess(
            `Broadcast sent to ${body.totalUsersReached || 0} users` +
            (injectIntoConversations ? ` and ${body.conversationsNotified || 0} active conversations` : '') +
            '.'
          );
          setNoticeContent('');
          setNoticeTitle('');
        }
      }
    } catch (err) {
      alert(`Failed to send notice: ${err.message || 'Unknown error'}`);
    } finally {
      setSendingNotice(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (!messageSearch.trim()) return true;
    const q = messageSearch.toLowerCase();
    const content = (m.content || '').toLowerCase();
    const sender = (m.sender?.fullName || '').toLowerCase();
    const email = (m.sender?.emailAddress || '').toLowerCase();
    return content.includes(q) || sender.includes(q) || email.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-indigo-600" />
            LUNEST Trust & Moderation Oversight
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time screening of guest-host messaging, off-platform payment detection, and complaint resolution.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('screened_messages')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'screened_messages'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Screened Messages
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Safety Reports
          </button>
          <button
            onClick={() => setActiveTab('support_notice')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'support_notice'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Send Support Notice
          </button>
        </div>
      </div>

      {/* ── TAB 1: SCREENED & BLOCKED MESSAGES ── */}
      {activeTab === 'screened_messages' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search message text, sender name, or email..."
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                className="w-full text-sm outline-none text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                {['ALL', 'BLOCKED', 'FLAGGED', 'PENDING_REVIEW', 'DELIVERED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setMessageStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      messageStatusFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchScreenedMessages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                title="Refresh queue"
              >
                <RefreshCw className={`w-4 h-4 ${messagesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Messages Queue Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {messagesLoading && messages.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-600" />
                <span>Loading screened messages...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <span className="font-semibold text-slate-700">No screened messages found</span>
                <span className="text-xs text-slate-500 mt-1">All messages are complying with safety policies or filter returned empty.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Sender</th>
                      <th className="px-5 py-3">Message Content</th>
                      <th className="px-5 py-3">Triggered Policy</th>
                      <th className="px-5 py-3">Time</th>
                      <th className="px-5 py-3 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMessages.map((msg) => {
                      const isBlocked = msg.status === 'BLOCKED';
                      const isPending = msg.status === 'PENDING_REVIEW';
                      const isFlagged = msg.status === 'FLAGGED';

                      return (
                        <tr key={msg._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                isBlocked
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : isFlagged
                                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {msg.status}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{msg.sender?.fullName || 'User'}</div>
                            <div className="text-xs text-slate-500">{msg.sender?.emailAddress || 'No email'}</div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {msg.senderType}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 max-w-md">
                            <div className="text-slate-800 font-mono text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 break-words">
                              {msg.content}
                            </div>
                            {msg.blockedReason && (
                              <div className="text-[11px] text-red-600 mt-1 font-medium">
                                ⚠️ Reason: {msg.blockedReason}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {msg.moderationDetails?.triggeredRules?.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {msg.moderationDetails.triggeredRules.map((rule, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-red-50 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-red-100"
                                  >
                                    {rule}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Standard</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                            {new Date(msg.createdAt).toLocaleString()}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2">
                            {msg.status !== 'DELIVERED' && (
                              <button
                                onClick={() => handleOverrideStatus(msg._id, 'DELIVERED')}
                                disabled={processingMsgId === msg._id}
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                              >
                                Release
                              </button>
                            )}

                            {msg.status !== 'BLOCKED' && (
                              <button
                                onClick={() => handleOverrideStatus(msg._id, 'BLOCKED')}
                                disabled={processingMsgId === msg._id}
                                className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                              >
                                Block
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: SAFETY REPORTS ── */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Filter Status:</span>
              {['ALL', 'PENDING', 'ACTION_TAKEN', 'DISMISSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setReportStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    reportStatusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={fetchReports}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
            >
              <RefreshCw className={`w-4 h-4 ${reportsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportsLoading && reports.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span className="font-semibold text-slate-700">No Safety Reports in Queue</span>
              </div>
            ) : (
              reports.map((rep) => (
                <div key={rep._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                        {rep.reason}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        rep.status === 'PENDING' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div><strong>Reporter:</strong> {rep.reporter?.fullName} ({rep.reporter?.emailAddress})</div>
                    <div><strong>Reported User:</strong> {rep.reportedUser?.fullName} ({rep.reportedUser?.emailAddress})</div>
                    {rep.reportedUser?.messagingBlocked && (
                      <span className="inline-block text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                        User Messaging Currently Blocked
                      </span>
                    )}
                  </div>

                  {rep.explanation && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                      <strong>Complaint:</strong> {rep.explanation}
                    </div>
                  )}

                  {rep.status === 'PENDING' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <input
                        type="text"
                        placeholder="Resolution notes (optional)..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleResolveReport(rep._id, 'USER_WARNED')}
                          disabled={resolvingReportId === rep._id}
                          className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                        >
                          Issue Warning
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep._id, 'MESSAGING_RESTRICTED')}
                          disabled={resolvingReportId === rep._id}
                          className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
                        >
                          Restrict Messaging
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep._id, 'DISMISSED')}
                          disabled={resolvingReportId === rep._id}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: SEND OFFICIAL SUPPORT NOTICE ── */}
      {activeTab === 'support_notice' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Dispatch Official LUNEST Support Notice
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Send an official notice to a specific conversation or broadcast to every LUNEST user.
          </p>

          {/* Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mb-5 w-fit">
            <button
              type="button"
              onClick={() => { setNoticeMode('conversation'); setNoticeSuccess(''); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                noticeMode === 'conversation'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Conversation
            </button>
            <button
              type="button"
              onClick={() => { setNoticeMode('broadcast'); setNoticeSuccess(''); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                noticeMode === 'broadcast'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Broadcast to All Users
            </button>
          </div>

          {noticeSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
              ✅ {noticeSuccess}
            </div>
          )}

          <form onSubmit={handleSendSupportNotice} className="space-y-4">
            {noticeMode === 'conversation' ? (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Conversation ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6ab022b6acebbd930b7ed898"
                  value={targetConvId}
                  onChange={(e) => setTargetConvId(e.target.value)}
                  required
                  className="w-full text-sm p-2.5 border border-slate-200 rounded-lg outline-none font-mono"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Notice Title (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Platform Maintenance, Policy Update..."
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-lg outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Defaults to "Official LUNEST Notice" if left blank.</p>
                </div>

                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    id="injectConvs"
                    checked={injectIntoConversations}
                    onChange={(e) => setInjectIntoConversations(e.target.checked)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <label htmlFor="injectConvs" className="text-xs text-slate-700 cursor-pointer">
                    <span className="font-bold">Also inject into all active conversations</span>
                    <br />
                    <span className="text-slate-500">The notice will appear as a LUNEST Support message inside every active guest-host conversation thread.</span>
                  </label>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Notice Content
              </label>
              <textarea
                placeholder="Type your official safety notice or resolution message..."
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                rows={4}
                required
                className="w-full text-sm p-2.5 border border-slate-200 rounded-lg outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={
                sendingNotice ||
                !noticeContent.trim() ||
                (noticeMode === 'conversation' && !targetConvId.trim())
              }
              className={`px-5 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 ${
                noticeMode === 'broadcast'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              {sendingNotice
                ? 'Dispatching...'
                : noticeMode === 'broadcast'
                  ? 'Broadcast to All Users'
                  : 'Send to Conversation'
              }
            </button>

            {noticeMode === 'broadcast' && (
              <p className="text-[11px] text-amber-600 font-medium">
                ⚠️ This will send a notification to every active LUNEST user. Use with care.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
