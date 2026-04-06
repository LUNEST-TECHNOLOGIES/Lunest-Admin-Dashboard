import React, { useState, useRef, useEffect } from 'react';
import { MdExpandMore, MdCheckCircle } from 'react-icons/md';

const ListingFiltersDropdown = ({ activeFilters, hostOptions = ['All'], onApplyFilters, onClose }) => {
  // Map uppercase backend status back to TitleCase for the UI if needed
  const denormalize = (val) => {
    if (!val) return null;
    if (val === 'All') return 'All';
    return val.charAt(0) + val.slice(1).toLowerCase();
  };

  const [filters, setFilters] = useState({
    status: denormalize(activeFilters?.status),
    type: denormalize(activeFilters?.type),
    plan: denormalize(activeFilters?.plan),
    hostName: activeFilters?.hostName || null,
  });

  const [openDropdown, setOpenDropdown] = useState(null);

  const statusOptions = ['All', 'Available', 'Booked', 'Pending', 'Paused', 'Rejected', 'Suspended'];
  const typeOptions = ['All', 'Rent', 'Sale'];
  const planOptions = ['All', 'Free', 'Premium', 'Plus', 'Professional'];

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: filters[filterType] === value ? null : value
    };
    setFilters(newFilters);
    onApplyFilters(newFilters);
    setOpenDropdown(null);
  };

  const handleReset = () => {
    const resetFilters = { status: null, type: null, plan: null, hostName: null };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  return (
    <div
      ref={dropdownRef}
      className="w-full bg-white rounded-[10px] border border-zinc-400 z-50 p-4 sm:p-5"
    >
      {/* Filter Options Container */}
      <div className="flex flex-wrap gap-6 justify-start items-start">
        {/* Status Filter */}
        <div className="flex-1 min-w-[220px] h-auto inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
          <div className="self-stretch h-20 px-5 py-[3px] rounded-[20px] outline outline-2 outline-offset-[-2px] outline-zinc-300 inline-flex justify-between items-center cursor-pointer  transition-shadow" onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}>
            <div className="w-80 flex justify-between items-center">
              <div className="flex justify-start items-center gap-5">
                <img 
                  src="/assets/icons/filter-icon/Component 51.svg" 
                  alt="status" 
                  className="w-6 h-6"
                />
                <div className="text-neutral-600 text-xl font-medium font-aeonik">Status</div>
              </div>
              <MdExpandMore className={`w-5 h-5 text-neutral-600 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {openDropdown === 'status' && (
            <div className="self-stretch h-auto px-3 py-2 rounded-[15px] outline outline-2 outline-offset-[-2px] outline-zinc-300 flex flex-col justify-start items-start gap-1">
              {statusOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('status', option)}
                  className={`w-full p-2 rounded-[12px] inline-flex justify-between items-center text-neutral-600 text-sm font-medium font-aeonik hover:bg-indigo-50 transition-colors ${
                    filters.status === option ? 'bg-indigo-100' : ''
                  }`}
                >
                  {option}
                  {filters.status === option && <MdCheckCircle className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex-1 min-w-[220px] h-auto inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
          <div className="self-stretch h-20 px-5 py-[3px] rounded-[20px] outline outline-2 outline-offset-[-2px] outline-zinc-300 inline-flex justify-between items-center cursor-pointer  transition-shadow" onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}>
            <div className="w-80 flex justify-between items-center">
              <div className="flex justify-start items-center gap-5">
                <img 
                  src="/assets/icons/filter-icon/Component 51.svg" 
                  alt="type" 
                  className="w-6 h-6"
                />
                <div className="text-neutral-600 text-xl font-medium font-aeonik">Type</div>
              </div>
              <MdExpandMore className={`w-5 h-5 text-neutral-600 transition-transform ${openDropdown === 'type' ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {openDropdown === 'type' && (
            <div className="self-stretch h-auto px-3 py-2 rounded-[15px] outline outline-2 outline-offset-[-2px] outline-zinc-300 flex flex-col justify-start items-start gap-1">
              {typeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('type', option)}
                  className={`w-full p-2 rounded-[12px] inline-flex justify-between items-center text-neutral-600 text-sm font-medium font-aeonik hover:bg-indigo-50 transition-colors ${
                    filters.type === option ? 'bg-indigo-100' : ''
                  }`}
                >
                  {option}
                  {filters.type === option && <MdCheckCircle className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Plan Filter */}
        <div className="flex-1 min-w-[220px] h-auto inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
          <div className="self-stretch h-20 px-5 py-[3px] rounded-[20px] outline outline-2 outline-offset-[-2px] outline-zinc-300 inline-flex justify-between items-center cursor-pointer transition-shadow" onClick={() => setOpenDropdown(openDropdown === 'plan' ? null : 'plan')}>
            <div className="w-80 flex justify-between items-center">
              <div className="flex justify-start items-center gap-5">
                <img 
                  src="/assets/icons/filter-icon/Component 51.svg" 
                  alt="plan" 
                  className="w-6 h-6"
                />
                <div className="text-neutral-600 text-xl font-medium font-aeonik">Plan</div>
              </div>
              <MdExpandMore className={`w-5 h-5 text-neutral-600 transition-transform ${openDropdown === 'plan' ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {openDropdown === 'plan' && (
            <div className="self-stretch h-auto px-3 py-2 rounded-[15px] outline outline-2 outline-offset-[-2px] outline-zinc-300 flex flex-col justify-start items-start gap-1">
              {planOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('plan', option)}
                  className={`w-full p-2 rounded-[12px] inline-flex justify-between items-center text-neutral-600 text-sm font-medium font-aeonik hover:bg-indigo-50 transition-colors ${
                    filters.plan === option ? 'bg-indigo-100' : ''
                  }`}
                >
                  {option}
                  {filters.plan === option && <MdCheckCircle className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Host Filter */}
        <div className="flex-1 min-w-[220px] h-auto inline-flex flex-col justify-start items-start gap-2.5 overflow-hidden">
          <div className="self-stretch h-20 px-5 py-[3px] rounded-[20px] outline outline-2 outline-offset-[-2px] outline-zinc-300 inline-flex justify-between items-center cursor-pointer transition-shadow" onClick={() => setOpenDropdown(openDropdown === 'host' ? null : 'host')}>
            <div className="w-80 flex justify-between items-center">
              <div className="flex justify-start items-center gap-5">
                <img 
                  src="/assets/icons/filter-icon/Component 51.svg" 
                  alt="host" 
                  className="w-6 h-6"
                />
                <div className="text-neutral-600 text-xl font-medium font-aeonik">Host</div>
              </div>
              <MdExpandMore className={`w-5 h-5 text-neutral-600 transition-transform ${openDropdown === 'host' ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {openDropdown === 'host' && (
            <div className="self-stretch max-h-60 overflow-y-auto px-3 py-2 rounded-[15px] outline outline-2 outline-offset-[-2px] outline-zinc-300 flex flex-col justify-start items-start gap-1 custom-scrollbar">
              {hostOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('hostName', option)}
                  className={`w-full p-2 rounded-[12px] inline-flex justify-between items-center text-neutral-600 text-sm font-medium font-aeonik hover:bg-indigo-50 transition-colors ${
                    filters.hostName === option ? 'bg-indigo-100' : ''
                  }`}
                >
                  <span className="truncate pr-2">{option}</span>
                  {filters.hostName === option && <MdCheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <div className="mt-4 pt-4 border-t border-zinc-300 flex justify-end">
        <button
          onClick={handleReset}
          className="px-6 py-2 rounded-3xl border-2 border-red-600 text-red-600 font-semibold font-aeonik text-sm hover:bg-red-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ListingFiltersDropdown;
