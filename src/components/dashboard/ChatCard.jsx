import React from 'react';

/**
 * ChatCard Component - Reusable Activity/Chat Summary Card
 * 
 * Features:
 * - Display activity items with avatar initials
 * - Category badges
 * - Priority indicators with color coding
 * - Timestamp information
 * - Responsive layout
 * 
 * @component
 * @example
 * const activities = [
 *   {
 *     id: 1,
 *     initials: 'TO',
 *     name: 'Tom Hilfiger',
 *     action: 'Completed booking payment',
 *     time: '1 hour ago',
 *     category: 'Finance',
 *     priority: 'High',
 *     priorityColor: 'red'
 *   }
 * ]
 * 
 * <ChatCard title="Activity Summary" activities={activities} />
 */
export default function ChatCard({ 
  title = "Activity Summary", 
  activities = [],
  showPriority = true,
  maxItems = null
}) {
  // Filter to max items if specified
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  // Priority color mapping
  const priorityColors = {
    High: { bg: 'bg-rose-50 text-rose-700 border-rose-200/60', dot: 'bg-rose-500' },
    Medium: { bg: 'bg-amber-50 text-amber-700 border-amber-200/60', dot: 'bg-amber-500' },
    Low: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500' },
  };

  const getPriorityColor = (priority) => {
    return priorityColors[priority] || priorityColors.Low;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5 sm:p-6">
        <h3 className="text-slate-900 text-base font-bold font-aeonik tracking-tight">{title}</h3>
        <p className="text-slate-400 text-xs font-medium mt-3">No recent activities to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
        <h3 className="text-slate-900 text-base font-bold font-aeonik tracking-tight">{title}</h3>
        {showPriority && (
          <span className="text-slate-400 text-xs font-bold font-aeonik uppercase tracking-wider">Priority</span>
        )}
      </div>

      {/* Activity Items */}
      <div className="divide-y divide-slate-100">
        {displayedActivities.map((activity, index) => {
          const priorityColor = getPriorityColor(activity.priority);

          return (
            <div
              key={activity.id || index}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
            >
              {/* Left Section - User Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Avatar */}
                <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl flex items-center justify-center text-white text-xs font-bold font-aeonik flex-shrink-0 shadow-xs">
                  {activity.initials}
                </div>

                {/* Activity Details */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-aeonik font-bold text-slate-900 text-xs truncate">
                      {activity.name}
                    </span>
                    <span className="font-aeonik font-normal text-slate-500 text-xs truncate">
                      {activity.action}
                    </span>
                  </div>

                  <span className="font-aeonik font-medium text-slate-400 text-[10px] mt-0.5">
                    {activity.time}
                  </span>
                </div>
              </div>

              {/* Right Section - Category & Priority */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Category Badge */}
                {activity.category && (
                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg font-aeonik text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                    {activity.category}
                  </span>
                )}

                {/* Priority Indicator */}
                {showPriority && activity.priority && (
                  <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1.5 ${priorityColor.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${priorityColor.dot}`} />
                    <span>{activity.priority}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ChatCard Variants and Usage Examples
 */

// Simple Chat Card - Without priority
export function SimpleChat({ activities = [], title = "Recent Activities" }) {
  return <ChatCard title={title} activities={activities} showPriority={false} />;
}

// Limited Chat Card - Shows only first N items
export function LimitedChat({ activities = [], title = "Latest Activities", limit = 5 }) {
  return <ChatCard title={title} activities={activities} maxItems={limit} />;
}

// Sample data generator for testing
export const generateSampleActivities = (count = 5) => {
  const firstNames = ['Tom', 'Sarah', 'John', 'Michael', 'Emma', 'David', 'Lisa', 'James'];
  const lastNames = ['Hilfiger', 'Anderson', 'Doe', 'Johnson', 'Martinez', 'Smith', 'Brown', 'Davis'];
  const actions = [
    'Completed booking payment',
    'Updated profile information',
    'New listing approved',
    'Disputed transaction',
    'KYC verification completed',
    'Cancelled booking',
  ];
  const categories = ['Finance', 'Promotions', 'Disputes', 'Listings', 'Users', 'Support'];
  const priorities = ['High', 'Medium', 'Low'];
  const timeAgo = ['1 hour ago', '2 hours ago', '3 hours ago', '4 hours ago', '5 hours ago'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    initials: firstNames[i % firstNames.length][0] + lastNames[i % lastNames.length][0],
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    action: actions[i % actions.length],
    time: timeAgo[i % timeAgo.length],
    category: categories[i % categories.length],
    priority: priorities[i % priorities.length],
  }));
};
