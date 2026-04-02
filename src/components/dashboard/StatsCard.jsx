import React from 'react';

/**
 * StatsCard Component - Premium horizontal display for metrics
 * 
 * Features:
 * - Rounded-xl corners for a modern feel
 * - Horizontal layout (Icon on left, content on right)
 * - Rounded-lg icon container
 * - Dynamic value display with currency support (.2dp)
 * - Trend/Growth indicator the user liked
 * 
 * @component
 */
export default function StatsCard({
  icon,
  label,
  value,
  growth,
  description,
  bgColor = 'violet',
  iconColor = 'indigo',
  showGrowth = true,
  isCurrency = false,
}) {
  // Background color mapping
  const bgColorMap = {
    violet: 'bg-violet-50',
    indigo: 'bg-indigo-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
    red: 'bg-red-50',
    amber: 'bg-amber-50',
    slate: 'bg-slate-50',
  };

  // Icon color mapping
  const iconColorMap = {
    indigo: 'text-indigo-600',
    slate: 'text-slate-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 cursor-pointer">
      {/* Icon Container */}
      {icon && (
        <div className={`w-14 h-14 ${bgColorMap[bgColor] || 'bg-indigo-50'} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <div className={`w-7 h-7 ${iconColorMap[iconColor] || 'text-indigo-600'}`}>
            {icon}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-aeonik font-medium text-xs sm:text-sm text-slate-500 mb-0.5">
          {label}
        </p>
        <h3 className="font-aeonik font-bold text-base sm:text-lg lg:text-xl xl:text-2xl text-slate-900 tracking-tight break-words">
          {typeof value === 'number' 
            ? (isCurrency 
                ? `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : value.toLocaleString('en-NG'))
            : value}
        </h3>
        
        {showGrowth && (growth || description) && (
          <div className="flex items-center gap-1 mt-1">
            {growth && (
              <span className={`font-aeonik font-bold text-xs ${growth.startsWith('+') ? 'text-green-600' : growth.startsWith('-') ? 'text-red-600' : 'text-blue-600'}`}>
                {growth}
              </span>
            )}
            {description && (
              <span className="font-aeonik font-medium text-xs text-slate-400">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stat Card Variants preserved for compatibility
 */

// Compact Stats Card
export function CompactStatsCard(props) {
  return <StatsCard {...props} showGrowth={false} />;
}

// Large Stats Card
export function LargeStatsCard(props) {
  return <StatsCard {...props} />;
}
