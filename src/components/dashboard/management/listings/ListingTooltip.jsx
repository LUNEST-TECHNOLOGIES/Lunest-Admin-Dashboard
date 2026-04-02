import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';

const ListingTooltip = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full px-4 sm:px-7 py-3 sm:py-4 bg-indigo-50/30 rounded-[20px] border-2 border-blue-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
      {/* Tooltip Content */}
      <div className="flex justify-between items-start gap-2 sm:gap-4 flex-1 w-full">
        {/* Icon */}
        <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5">
          <div className="w-full h-full bg-red-500 rounded"></div>
        </div>

        {/* Text Content */}
        <div className="inline-flex flex-col justify-start items-start gap-1 sm:gap-2.5 flex-1 min-w-0">
          <h3 className="text-indigo-900 text-sm sm:text-xl font-medium font-aeonik">Tooltip:</h3>
          <p className="text-slate-400 text-xs sm:text-base font-normal font-aeonik line-clamp-2 sm:line-clamp-none">
            Boosted listings are promoted properties paid for by hosts. Expired listings can be reactivated.
          </p>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="w-7 h-7 sm:w-8 sm:h-8 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-blue-600 rounded-3xl flex justify-center items-center flex-shrink-0 hover:bg-blue-700 transition-colors cursor-pointer"
        aria-label="Close tooltip"
      >
        <MdClose className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </button>
    </div>
  );
};

export default ListingTooltip;
