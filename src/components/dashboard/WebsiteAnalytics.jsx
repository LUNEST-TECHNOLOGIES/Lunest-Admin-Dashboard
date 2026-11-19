import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

const number = value => Number(value || 0).toLocaleString();
const date = value => value ? new Date(value).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }) : '—';

const analyticsClient = new QueryClient();

export default function WebsiteAnalytics() {
  return <QueryClientProvider client={analyticsClient}><WebsiteAnalyticsPanel /></QueryClientProvider>;
}

function WebsiteAnalyticsPanel() {
  const [days, setDays] = useState(7);
  const [showIps, setShowIps] = useState(false);
  const [visible, setVisible] = useState(document.visibilityState === 'visible');
  useEffect(() => {
    const changed = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);
  const query = useQuery({
    queryKey: ['website-analytics', days],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get('/admin/analytics/website', { params: { days }, signal });
      if (!response.data?.success || !response.data?.data) throw new Error('Website statistics are unavailable.');
      return response.data.data;
    },
    refetchInterval: visible ? 60000 : false,
    retry: 1,
  });
  const stats = query.data;
  return (
    <section className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6" aria-label="Website statistics">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-gray-900">Website statistics</h2><p className="text-sm text-gray-500">LUNEST web app traffic · refreshes every minute</p></div>
        <div className="flex items-center gap-2">
          <label htmlFor="website-range" className="text-sm">Period</label>
          <select id="website-range" value={days} onChange={event => setDays(Number(event.target.value))} className="rounded-lg border border-gray-300 p-2 text-sm">
            <option value={1}>Last 24 hours</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option>
          </select>
          <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50">{query.isFetching ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>
      {query.isPending && <p role="status" className="text-sm text-gray-500">Loading website statistics…</p>}
      {query.isError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not load current website statistics. {stats ? 'The last successful results remain below.' : 'Try Refresh to retry.'}</p>}
      {stats && <>
        <p className="text-xs text-gray-500">Updated {date(query.dataUpdatedAt)} (Lagos time)</p>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {[
            ['Visits', number(stats.visits), 'Tab sessions'],
            ['Page views', number(stats.pageViews), 'Pages opened in these sessions'],
            ['Unique IP visitors', number(stats.uniqueIpVisitors), 'Approximate visitors'],
            ['Active visitors', number(stats.activeVisitors), 'Seen in the last 5 minutes'],
            ['Single-page sessions', `${(Number(stats.bounceRate || 0) * 100).toFixed(1)}%`, 'Sessions with one page view'],
          ].map(([label, value, detail]) => <div key={label} className="rounded-xl bg-gray-50 p-3"><p className="text-sm text-gray-600">{label}</p><p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></div>)}
        </div>
        {stats.visits === 0 && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">No visits recorded for this period. Collection starts with the updated web app; historical traffic is not included.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-x-auto"><h3 className="mb-2 font-medium">Daily visits</h3><table className="w-full text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-2">Date (Lagos)</th><th className="p-2">Visits</th><th className="p-2">Page views</th></tr></thead><tbody>{(stats.daily || []).map(row => <tr key={row._id} className="border-b border-gray-100"><td className="p-2">{row._id}</td><td className="p-2">{number(row.visits)}</td><td className="p-2">{number(row.pageViews)}</td></tr>)}</tbody></table></div>
          <div className="overflow-x-auto"><h3 className="mb-2 font-medium">Referrer websites</h3><table className="w-full text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-2">Source</th><th className="p-2">Visits</th></tr></thead><tbody>{(stats.referrers || []).map(row => <tr key={row._id || 'direct'} className="border-b border-gray-100"><td className="break-all p-2">{row._id || 'Direct / unknown'}</td><td className="p-2">{number(row.visits)}</td></tr>)}</tbody></table></div>
        </div>
        <details className="rounded-lg border border-gray-200 p-3"><summary className="cursor-pointer text-sm font-medium">Last visited pages by session</summary><ul className="mt-2 space-y-1 text-sm">{(stats.lastPages || []).map(row => <li key={row._id || '/'} className="flex justify-between gap-3"><span className="break-all">{row._id || '/'}</span><span>{number(row.sessions)}</span></li>)}</ul></details>
        <div>
          <button type="button" onClick={() => setShowIps(value => !value)} aria-expanded={showIps} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">{showIps ? 'Hide recent IP addresses' : 'Show recent IP addresses'}</button>
          {showIps && <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="p-2">IP address</th><th className="p-2">Sessions</th><th className="p-2">Last seen (Lagos)</th></tr></thead><tbody>{(stats.recentIps || []).map(row => <tr key={row._id} className="border-b border-gray-100"><td className="p-2 font-mono">{row._id}</td><td className="p-2">{number(row.sessions)}</td><td className="p-2">{date(row.lastSeen)}</td></tr>)}</tbody></table></div>}
        </div>
        <p className="text-xs leading-relaxed text-gray-500">IP counts estimate visitors; shared connections and changing IPs affect totals. These are not authenticated account counts. Visits and page views cover sessions started in this period. Active visitors cover the last 5 minutes. Records are retained for {stats.retentionDays || 30} days since last activity. Marketing sites appear only after tracking is connected.</p>
      </>}
    </section>
  );
}
