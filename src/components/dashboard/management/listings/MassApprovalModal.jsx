import React from 'react';
import { MdClose } from 'react-icons/md';

const MassApprovalModal = ({ selectedListings, onClose, onApprove, actionType }) => {
  const isApproval = actionType === 'approve';
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      <div className="w-full max-w-[652px] bg-white rounded-[20px] border border-black shadow-lg overflow-hidden relative flex flex-col justify-between p-6 max-h-[80vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-6 h-6 absolute top-6 right-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors z-10"
        >
          <MdClose className="w-5 h-5 text-black" />
        </button>

        {/* Content */}
        <div className="flex flex-col justify-center items-center gap-7 mt-2">
          <h2 className="text-black text-lg font-bold font-aeonik">
            {isApproval ? 'Approve Listings' : 'Reject Listings'}
          </h2>
          <div className="text-center w-full">
            <p className="text-slate-900 text-base font-medium font-aeonik mb-4">
              {isApproval ? 'Approve' : 'Reject'} {selectedListings.length} selected listing{selectedListings.length !== 1 ? 's' : ''}?
            </p>
            
            {/* List of selected listings */}
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto text-left">
              {selectedListings.map((listing) => (
                <div key={listing.id} className="py-2 border-b border-gray-200 last:border-b-0">
                  <p className="text-sm font-semibold text-slate-900 font-aeonik">{listing.title}</p>
                  <p className="text-xs text-slate-500 font-aeonik">ID: {listing.id} - Host: {listing.hostName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-60 flex gap-4 justify-center mx-auto mt-6">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-3xl border-2 border-red-600 inline-flex justify-center items-center gap-1 hover:bg-red-50 transition-colors"
          >
            <span className="text-red-600 text-base font-bold font-aeonik leading-4">Cancel</span>
          </button>
          <button
            onClick={onApprove}
            className="px-5 py-3 bg-slate-900 rounded-3xl inline-flex justify-center items-center gap-1 hover:bg-slate-800 transition-colors"
          >
            <span className="text-white text-base font-bold font-aeonik leading-4">
              {isApproval ? 'Approve All' : 'Reject All'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MassApprovalModal;
