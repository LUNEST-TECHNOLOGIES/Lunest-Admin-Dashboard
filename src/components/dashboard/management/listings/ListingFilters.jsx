import React, { useState } from 'react';
import { MdOutlineKeyboardArrowDown } from 'react-icons/md';

const ListingFilters = ({ filters, setFilters }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const filterOptions = {
    status: [
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Expired', value: 'expired' },
      { label: 'Flagged', value: 'flagged' }
    ],
    type: [
      { label: 'For Rent', value: 'forrent' },
      { label: 'For Sale', value: 'forsale' }
    ],
    plan: [
      { label: 'Free', value: 'free' },
      { label: 'Premium', value: 'premium' },
      { label: 'Plus', value: 'plus' },
      { label: 'Professional', value: 'professional' }
    ]
  };

  const filterLabels = {
    status: 'Status',
    type: 'Type',
    plan: 'Plan'
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      {Object.keys(filterOptions).map((filterKey) => (
        <div key={filterKey} className="relative flex-1 sm:flex-none w-full sm:w-72">
          <button
            onClick={() => setOpenDropdown(openDropdown === filterKey ? null : filterKey)}
            className="w-full h-12 sm:h-16 px-4 sm:px-7 py-2 sm:py-3 rounded-[20px] border-2 border-zinc-300 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer bg-white"
          >
            <div className="flex items-center gap-3 sm:gap-5">
              <img 
                src="/assets/icons/listing table/Component 32.svg" 
                alt="filter" 
                className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
              />
              <span className="text-neutral-600 text-xs sm:text-lg font-medium font-aeonik">
                {filterLabels[filterKey]}
              </span>
            </div>
            <MdOutlineKeyboardArrowDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-600 transition-transform flex-shrink-0 ${
                openDropdown === filterKey ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {openDropdown === filterKey && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              {filterOptions[filterKey].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilters({ ...filters, [filterKey]: option.value });
                    setOpenDropdown(null);
                  }}
                  className="w-full px-4 sm:px-5 py-2 sm:py-3 text-left hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-b-0 font-aeonik text-xs sm:text-sm text-neutral-700"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ListingFilters;
