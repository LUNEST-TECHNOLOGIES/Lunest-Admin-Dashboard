/**
 * Dashboard Components Index
 * 
 * Centralized export of all reusable dashboard components
 * Import usage: import { StatsCard, ChatCard, AlertCard, DataTable } from '../components/dashboard';
 */

export { default as StatsCard, CompactStatsCard, LargeStatsCard } from './StatsCard';
export { default as ChatCard, SimpleChat, LimitedChat, generateSampleActivities } from './ChatCard';
export { default as AlertCard, AlertList, AlertContainer, generateSampleAlerts } from './AlertCard';
export { default as DataTable, generateSampleTableData } from './DataTable';
