import React from 'react';
import ListingTableRow from './ListingTableRow';

const ListingTable = ({ listings = [], selectedRows, onSelectionChange, showSelectMode, loading = false }) => {
  return (
    <div className="w-full h-auto relative bg-white rounded-lg overflow-hidden">
      {/* Table Body */}
      <div className="w-full flex flex-col">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <ListingTableRow
              key={listing.id}
              listing={listing}
              isSelected={selectedRows.has(listing.id)}
              onSelect={(id) => {
                const newSelected = new Set(selectedRows);
                if (newSelected.has(id)) {
                  newSelected.delete(id);
                } else {
                  newSelected.add(id);
                }
                onSelectionChange?.(newSelected);
              }}
              showSelectMode={showSelectMode}
            />
          ))
        ) : (
          <div className="w-full h-32 flex items-center justify-center text-slate-400 font-aeonik">
            <p className="text-slate-600 font-aeonik">
              {loading ? 'Loading listings...' : 'No listings found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingTable;
