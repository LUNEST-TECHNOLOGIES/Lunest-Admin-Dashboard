import React from 'react';
import { WarningIcon, InfoIcon, SuccessIcon, AlertIcons, PlusIcon } from '../AllIcons';

/**
 * AlertCard Component - Display alert/notification items
 * 
 * Features:
 * - Color-coded alerts with borders
 * - Icon indicators
 * - Title and description
 * - Badge with count
 * - Multiple color variants
 * 
 * @component
 * @example
 * <AlertCard
 *   icon={<AlertIcon />}
 *   title="Withdrawal Failed"
 *   description="Bank validation error"
 *   count={2}
 *   variant="orange"
 * />
 */
export default function AlertCard({
  icon,
  title,
  description,
  count,
  variant = 'orange',
  onClick,
}) {
  // Enhanced Color variants
  const variants = {
    orange: {
      bg: 'bg-gradient-to-r from-amber-50/60 to-white',
      border: 'border-amber-200/80 hover:border-amber-300',
      iconBg: 'bg-amber-500 text-white',
      badge: 'bg-amber-500 text-white shadow-xs',
      dot: 'bg-amber-400',
    },
    blue: {
      bg: 'bg-gradient-to-r from-indigo-50/60 to-white',
      border: 'border-indigo-200/80 hover:border-indigo-300',
      iconBg: 'bg-indigo-600 text-white',
      badge: 'bg-indigo-600 text-white shadow-xs',
      dot: 'bg-indigo-400',
    },
    green: {
      bg: 'bg-gradient-to-r from-emerald-50/60 to-white',
      border: 'border-emerald-200/80 hover:border-emerald-300',
      iconBg: 'bg-emerald-600 text-white',
      badge: 'bg-emerald-600 text-white shadow-xs',
      dot: 'bg-emerald-400',
    },
    red: {
      bg: 'bg-gradient-to-r from-rose-50/60 to-white',
      border: 'border-rose-200/80 hover:border-rose-300',
      iconBg: 'bg-rose-600 text-white',
      badge: 'bg-rose-600 text-white shadow-xs',
      dot: 'bg-rose-400',
    },
  };

  const colorVariant = variants[variant] || variants.orange;

  return (
    <div
      className={`p-3.5 sm:p-4 ${colorVariant.bg} border ${colorVariant.border} rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 gap-3.5 group`}
      onClick={onClick}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon Squircle */}
        <div className={`w-8 h-8 ${colorVariant.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
          {icon || <span className="w-2 h-2 rounded-full bg-white" />}
        </div>

        {/* Text Content */}
        <div className="min-w-0">
          <p className="font-aeonik font-bold text-xs sm:text-sm text-slate-900 truncate">
            {title}
          </p>
          <p className="font-aeonik font-medium text-slate-400 text-[11px] sm:text-xs truncate">
            {description}
          </p>
        </div>
      </div>

      {/* Badge */}
      {count !== undefined && (
        <div className={`${colorVariant.badge} px-2.5 py-0.5 rounded-full text-xs font-aeonik font-bold flex-shrink-0 flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colorVariant.dot} animate-pulse`} />
          <span>{count}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Alert Card Variants
 */

// Alert List - Multiple alerts
export function AlertList({ alerts = [] }) {
  return (
    <div className="space-y-2.5">
      {alerts.map((alert, index) => (
        <AlertCard
          key={alert.id || index}
          title={alert.title}
          description={alert.description}
          count={alert.count}
          variant={alert.variant}
          onClick={alert.onClick}
          icon={alert.icon}
        />
      ))}
    </div>
  );
}

// Alert Container - With tabs
export function AlertContainer({ tabs = [], activeTab = 0, onTabChange, onAddCategory, alerts = [] }) {
  const [localActiveTab, setLocalActiveTab] = React.useState(activeTab);

  const handleTabChange = (index) => {
    setLocalActiveTab(index);
    onTabChange?.(index);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5 sm:p-6 space-y-4">
      {/* Tab Navigation */}
      {tabs.length > 0 && (
        <div className="bg-slate-50/80 rounded-xl p-1.5 flex gap-2 border border-slate-100 overflow-x-auto items-center">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabChange(index)}
              className={`px-3 py-1.5 text-xs font-aeonik font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                localActiveTab === index
                  ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
          
          {/* Add New Category Button */}
          {onAddCategory && (
            <div className="flex items-center gap-1.5 ml-auto pr-2">
              <button
                onClick={onAddCategory}
                className="p-1 rounded-lg transition text-indigo-600 hover:bg-indigo-50 cursor-pointer flex items-center gap-1 text-xs font-bold font-aeonik"
                title="Add new category"
              >
                <PlusIcon />
                <span>Add category</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Alert Items */}
      <AlertList alerts={alerts} />
    </div>
  );
}

// Sample alert data generator
export const generateSampleAlerts = () => [
  {
    id: 1,
    title: 'Withdrawal Failed',
    description: 'Bank validation error',
    count: 2,
    variant: 'orange',
    icon: <WarningIcon />,
  },
  {
    id: 2,
    title: 'Payment Processing',
    description: 'Bank validation in progress',
    count: 2,
    variant: 'blue',
    icon: <InfoIcon />,
  },
  {
    id: 3,
    title: 'Payment Successful',
    description: 'Transaction completed',
    count: 2,
    variant: 'green',
    icon: <SuccessIcon />,
  },
];
