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
  // Color variants
  const variants = {
    orange: {
      bg: 'bg-rose-50/30',
      border: 'border-orange-600',
      iconBg: 'bg-orange-500',
      badge: 'bg-orange-600',
    },
    blue: {
      bg: 'bg-indigo-50/30',
      border: 'border-blue-600',
      iconBg: 'bg-indigo-600',
      badge: 'bg-blue-600',
    },
    green: {
      bg: 'bg-lime-50/30',
      border: 'border-green-600',
      iconBg: 'bg-green-600',
      badge: 'bg-green-600',
    },
    red: {
      bg: 'bg-red-50/30',
      border: 'border-red-600',
      iconBg: 'bg-red-600',
      badge: 'bg-red-600',
    },
  };

  const colorVariant = variants[variant] || variants.orange;

  return (
    <div
      className={`p-4 ${colorVariant.bg} border-2 ${colorVariant.border} rounded-lg flex items-start justify-between cursor-pointer hover:shadow-md transition`}
      onClick={onClick}
    >
      {/* Left Section */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        {icon ? (
          <div className={`w-6 h-6 ${colorVariant.iconBg} rounded-lg flex-shrink-0 mt-1`}>
            {icon}
          </div>
        ) : (
          <div className={`w-6 h-6 ${colorVariant.iconBg} rounded-lg flex-shrink-0 mt-1`} />
        )}

        {/* Text Content */}
        <div>
          <p className="font-aeonik font-medium text-slate-900">
            {title}
          </p>
          <p className="font-aeonik font-normal text-slate-400 text-sm">
            {description}
          </p>
        </div>
      </div>

      {/* Badge */}
      {count !== undefined && (
        <div className={`${colorVariant.badge} text-white px-3 py-1 rounded-full text-sm font-aeonik font-medium flex-shrink-0`}>
          {count}
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
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <AlertCard
          key={alert.id || index}
          title={alert.title}
          description={alert.description}
          count={alert.count}
          variant={alert.variant}
          onClick={alert.onClick}
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
    <div className="bg-white rounded-lg shadow-md border border-stone-300 p-7 space-y-6">
      {/* Tab Navigation */}
      {tabs.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 flex gap-4 border border-gray-200 overflow-x-auto items-center">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabChange(index)}
              className={`px-3 py-2 text-sm font-aeonik font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
                localActiveTab === index
                  ? 'bg-white text-sky-900 shadow-sm'
                  : 'text-zinc-700 hover:bg-white'
              }`}
            >
              {tab}
            </button>
          ))}
          
          {/* Add New Category Button */}
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={onAddCategory}
              className="p-1.5 rounded-lg transition text-sky-600 hover:bg-sky-50 cursor-pointer"
              title="Add new category"
            >
              <PlusIcon />
            </button>
            <span className="text-xs font-medium text-slate-600 cursor-pointer" onClick={onAddCategory}>Add new category</span>
          </div>
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
