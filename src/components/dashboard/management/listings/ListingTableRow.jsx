import React from 'react';
import { MdCheckCircle } from 'react-icons/md';
import ActionMenu from '../shared/ActionMenu';

const ListingTableRow = ({ listing, isSelected, onSelect, showSelectMode, onListingUpdated, isLastItem }) => {
  // Safeguard against missing listing
  if (!listing) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Booked':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Rejected':
      case 'Suspended':
      case 'Expired':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Paused':
      case 'Draft':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="relative w-full px-6 py-4 border-b border-slate-100 flex items-center hover:bg-slate-50/80 hover:z-50 transition-all gap-6 group">
      {/* Checkbox */}
      {showSelectMode && (
        <div 
          className="w-6 h-6 flex-shrink-0 flex items-center justify-center cursor-pointer border-2 border-slate-200 rounded-lg bg-slate-50 hover:border-indigo-400 transition-all"
          onClick={() => onSelect(listing.id)}
        >
          {isSelected && <MdCheckCircle className="w-5 h-5 text-indigo-600" />}
        </div>
      )}

      {/* Listing Details */}
      <div className="w-48 flex-shrink-0">
        <div className="text-slate-900 text-sm font-bold font-aeonik line-clamp-1">
          {listing?.title || 'Untitled'}
        </div>
        <div className="text-slate-500 text-xs font-medium font-aeonik line-clamp-1">
          {listing?.propertyType || 'N/A'}
        </div>
        {listing?.location && (
          <div className="text-slate-400 text-[10px] font-medium font-aeonik line-clamp-1 mt-0.5">
            {listing.location}
          </div>
        )}
      </div>

      {/* Host Name */}
      <div className="w-48 flex-shrink-0">
        <div className="text-slate-900 text-sm font-bold font-aeonik line-clamp-1">
          {listing?.hostName || 'Unknown'}
        </div>
        <div className="text-slate-400 text-[10px] font-medium font-aeonik mt-0.5">
          {listing?.hostUserId && listing.hostUserId !== 'N/A' ? `-UserID: ${listing.hostUserId}` : 'No ID'}
        </div>
      </div>

      {/* Submitted Date */}
      <div className="w-28 flex-shrink-0">
        <div className="text-slate-500 text-[11px] font-bold font-aeonik">
          {listing?.createdAt ? (
            <>
              <div>{new Date(listing.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">{new Date(listing.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
            </>
          ) : 'N/A'}
        </div>
      </div>

      {/* Status */}
      <div className="w-24 flex-shrink-0 flex justify-center">
        <div className={`px-3 py-[5px] rounded-[20px] border flex justify-center items-center ${getStatusColor(listing?.status)}`}>
          <span className="text-[10px] font-bold font-aeonik uppercase tracking-wider">{listing?.status || 'N/A'}</span>
        </div>
      </div>

      {/* Plan */}
      <div className="w-16 flex-shrink-0 flex justify-center">
        <div className="px-3 py-[5px] rounded-[20px] bg-slate-50 border border-slate-200 text-slate-900 flex justify-center items-center">
          <span className="text-[10px] font-bold font-aeonik uppercase tracking-wider">{listing?.planTier || 'Free'}</span>
        </div>
      </div>

      {/* Boosted */}
      <div className="w-16 text-slate-700 text-sm font-bold font-aeonik flex-shrink-0 flex justify-center">
        <span className={listing?.boosted === 'Yes' ? 'text-indigo-600' : 'text-slate-400 opacity-60'}>
          {String(listing?.boosted || 'No')}
        </span>
      </div>

      {/* Expiry Date */}
      <div className="w-28 flex-shrink-0">
        <div className="text-slate-600 text-xs font-bold font-aeonik whitespace-nowrap overflow-hidden text-ellipsis">
          {listing?.expDate || 'N/A'}
        </div>
      </div>

      {/* Actions */}
      <div className="w-14 flex-shrink-0 flex justify-end">
        <ActionMenu listing={listing} onListingUpdated={onListingUpdated} isLastItem={isLastItem} />
      </div>
    </div>
  );
};

export default ListingTableRow;
