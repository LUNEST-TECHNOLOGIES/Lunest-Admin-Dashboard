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
  onClick,
  active = false,
  className = ''
}) {
  // Enhanced Background & Gradient mapping
  const colorStyles = {
    violet: { bg: 'bg-gradient-to-br from-violet-50 to-purple-50/60 border-violet-100/80 text-violet-600', ring: 'ring-violet-500/10' },
    indigo: { bg: 'bg-gradient-to-br from-indigo-50 to-blue-50/60 border-indigo-100/80 text-indigo-600', ring: 'ring-indigo-500/10' },
    blue: { bg: 'bg-gradient-to-br from-blue-50 to-cyan-50/60 border-blue-100/80 text-blue-600', ring: 'ring-blue-500/10' },
    green: { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50/60 border-emerald-100/80 text-emerald-600', ring: 'ring-emerald-500/10' },
    orange: { bg: 'bg-gradient-to-br from-amber-50 to-orange-50/60 border-amber-100/80 text-amber-600', ring: 'ring-amber-500/10' },
    red: { bg: 'bg-gradient-to-br from-rose-50 to-red-50/60 border-rose-100/80 text-rose-600', ring: 'ring-rose-500/10' },
    amber: { bg: 'bg-gradient-to-br from-amber-50 to-yellow-50/60 border-amber-100/80 text-amber-600', ring: 'ring-amber-500/10' },
    slate: { bg: 'bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200/80 text-slate-600', ring: 'ring-slate-500/10' },
  };

  const currentStyle = colorStyles[bgColor] || colorStyles.indigo;

  // Exact full formatted value for tooltip
  const fullFormattedValue = typeof value === 'number' 
    ? (isCurrency 
        ? `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : value.toLocaleString('en-NG'))
    : String(value ?? '0');

  // Compact abbreviation: Billions (B), Millions (M), Thousands (K) to 2DP in Naira
  const formatDisplayValue = (val) => {
    if (typeof val !== 'number') return String(val ?? '0');
    if (!isCurrency) return val.toLocaleString('en-NG');

    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';

    if (absVal >= 1_000_000_000) {
      const formatted = (absVal / 1_000_000_000).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${sign}₦${formatted}B`;
    }
    if (absVal >= 1_000_000) {
      const formatted = (absVal / 1_000_000).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${sign}₦${formatted}M`;
    }
    if (absVal >= 1_000) {
      const formatted = (absVal / 1_000).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${sign}₦${formatted}K`;
    }
    return `${sign}₦${absVal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const displayValue = formatDisplayValue(value);

  // Compact, sleek font sizing so numbers never crowd or clip
  const getFontSizeClass = (str) => {
    const len = str?.length || 0;
    if (len > 14) return 'text-xs sm:text-sm lg:text-base';
    if (len > 10) return 'text-sm sm:text-base lg:text-lg';
    return 'text-base sm:text-lg lg:text-xl';
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 sm:gap-3.5 overflow-hidden ${
        active 
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-gradient-to-b from-white to-slate-50/50' 
          : 'border-slate-100/90 shadow-xs hover:shadow-lg hover:shadow-slate-900/[0.03] hover:border-slate-200'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Subtle top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Modern Squircle Icon Container */}
      {icon && (
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border ${currentStyle.bg} flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105 ring-1 ${currentStyle.ring}`}>
          <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center">
            {icon}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-aeonik font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 mb-0.5 truncate" title={label}>
          {label}
        </p>
        <h3 
          title={fullFormattedValue}
          className={`font-aeonik font-black text-slate-900 tracking-tight leading-tight my-0.5 ${getFontSizeClass(displayValue)} ${isCurrency ? 'font-mono' : ''} truncate`}
        >
          {displayValue}
        </h3>
        
        {showGrowth && (growth || description) && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {growth && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                growth.startsWith('+') 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                  : growth.startsWith('-') 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/60' 
                  : 'bg-blue-50 text-blue-700 border border-blue-200/60'
              }`}>
                <span className={`w-1 h-1 rounded-full ${growth.startsWith('+') ? 'bg-emerald-500' : growth.startsWith('-') ? 'bg-rose-500' : 'bg-blue-500'}`} />
                {growth}
              </span>
            )}
            {description && (
              <span className="font-aeonik font-medium text-[11px] text-slate-400 truncate">
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
export function CompactStatsCard(props) {
  return <StatsCard {...props} showGrowth={false} />;
}

export function LargeStatsCard(props) {
  return <StatsCard {...props} />;
}
