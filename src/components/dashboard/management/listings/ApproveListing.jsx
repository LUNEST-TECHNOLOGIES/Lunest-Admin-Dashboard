import React from 'react';
import { MdClose } from 'react-icons/md';

const ApproveListing = ({ listing, onClose, onApprove, isLoading = false }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      <div className="w-full max-w-[652px] h-48 bg-white rounded-[20px] border border-black shadow-lg overflow-hidden relative flex flex-col justify-between p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="w-6 h-6 absolute top-6 right-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        >
          <MdClose className="w-5 h-5 text-black" />
        </button>

        {/* Content */}
        <div className="flex flex-col justify-center items-center gap-7 mt-2">
          <h2 className="text-black text-lg font-bold font-aeonik">Approve Listing</h2>
          <div className="text-center">
            <p className="text-slate-900 text-base font-medium font-aeonik">
              ID: {listing?.id || 'LST001'} - {listing?.title || 'Modern Apartment in Manhattan'} - User: {listing?.hostName || 'John Doe'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-60 flex gap-4 justify-center mx-auto">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-3 rounded-3xl border-2 border-red-600 inline-flex justify-center items-center gap-1 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-red-600 text-base font-bold font-aeonik leading-4">Cancel</span>
          </button>
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="px-5 py-3 bg-slate-900 rounded-3xl inline-flex justify-center items-center gap-1 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-white text-base font-bold font-aeonik leading-4">Processing...</span>
              </>
            ) : (
              <span className="text-white text-base font-bold font-aeonik leading-4">Approve</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveListing;
