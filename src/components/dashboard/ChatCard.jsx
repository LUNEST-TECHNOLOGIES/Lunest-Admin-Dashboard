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
    High: { bg: 'bg-red-600', dot: 'bg-red-600' },
    Medium: { bg: 'bg-orange-600', dot: 'bg-orange-600' },
    Low: { bg: 'bg-green-600', dot: 'bg-green-600' },
  };

  const getPriorityColor = (priority) => {
    return priorityColors[priority] || priorityColors.Low;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-stone-300 p-7">
        <h3 className="text-indigo-900 text-lg font-bold font-aeonik">{title}</h3>
        <p className="text-slate-500 text-sm mt-4">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-stone-300 p-7">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-6 border-b border-neutral-200">
        <h3 className="text-indigo-900 text-lg font-bold font-aeonik">{title}</h3>
        {showPriority && (
          <span className="text-indigo-900 text-sm font-medium font-aeonik">Priority</span>
        )}
      </div>

      {/* Activity Items */}
      <div className="space-y-6">
        {displayedActivities.map((activity, index) => {
          const isLast = index === displayedActivities.length - 1;
          const priorityColor = getPriorityColor(activity.priority);

          return (
            <div
              key={activity.id || index}
              className={`flex items-center justify-between ${!isLast ? 'pb-6 border-b border-neutral-300' : ''}`}
            >
              {/* Left Section - User Info */}
              <div className="flex items-start gap-4 flex-1">
                {/* Avatar */}
                <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-bold font-aeonik flex-shrink-0">
                  {activity.initials}
                </div>

                {/* Activity Details */}
                <div className="flex flex-col">
                  {/* Name and Action */}
                  <div className="flex items-center gap-2">
                    <p className="font-aeonik font-medium text-black text-sm">
                      {activity.name}
                    </p>
                    <span className="font-aeonik font-normal text-black text-xs">
                      {activity.action}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <p className="font-aeonik font-normal text-neutral-500 text-xs mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>

              {/* Right Section - Category & Priority */}
              <div className="flex items-center gap-4">
                {/* Category Badge */}
                <div className="px-3 py-1 border border-black rounded-full font-aeonik text-xs font-medium">
                  {activity.category}
                </div>

                {/* Priority Indicator */}
                {showPriority && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded ${priorityColor.dot}`} />
                    <span className="font-aeonik text-xs font-medium">
                      {activity.priority}
                    </span>
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
