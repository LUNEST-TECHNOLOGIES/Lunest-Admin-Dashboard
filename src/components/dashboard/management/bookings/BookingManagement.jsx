import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MdSearch, MdArrowBack, MdArrowForward, MdTune } from 'react-icons/md';
import BookingActionButton from './BookingActionButton';
import { getBookings } from '../../../../services/adminService';

// Helper functions moved outside component to prevent re-renders
const formatCurrency = (price, currency = 'NGN') => {
  if (!price) return '₦0';
  const symbol = currency === 'USD' ? '$' : currency === 'GHC' ? '₵' : '₦';
  return `${symbol}${price.toLocaleString()}`;
};

const openAddressInMaps = (address) => {
  if (!address) return;
  const encodedAddress = encodeURIComponent(address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  window.open(mapsUrl, '_blank', 'noopener,noreferrer');
};

const formatAddress = (listing) => {
  if (!listing) return 'N/A';
  const addressParts = [
    listing.address?.streetAddress,
    listing.address?.city,
    listing.address?.state,
    listing.address?.country
  ].filter(Boolean);
  return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
};

const formatDateRange = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 'N/A';
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) {
    return `${startDate.getDate()} - ${endDate.getDate()}, ${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }
  return `${diffDays} days`;
};

const mapBookingStatus = (status) => {
  const statusMap = {
    'CONFIRMED': 'Confirmed',
    'RESERVED': 'Reserved',
    'PENDING': 'Pending',
    'CANCELLED': 'Canceled',
    'COMPLETED': 'Completed',
    'ONGOING': 'Active',
    'EXPIRED': 'Expired',
    'REFUND_REQUESTED': 'Refund Requested',
    'REFUNDED': 'Refunded',
  };
  return statusMap[status] || status || 'Pending';
};

const getStatusBg = (status) => {
  const bgMap = {
    'CONFIRMED': 'bg-blue-200/40',
    'RESERVED': 'bg-blue-200/40',
    'PENDING': 'bg-amber-400/30',
    'CANCELLED': 'bg-red-300/30',
    'COMPLETED': 'bg-green-200',
    'ONGOING': 'bg-indigo-100',
    'REFUND_REQUESTED': 'bg-purple-100',
    'REFUNDED': 'bg-stone-200',
  };
  return bgMap[status] || 'bg-gray-200/40';
};

const getStatusText = (status) => {
  const textMap = {
    'CONFIRMED': 'text-blue-800',
    'RESERVED': 'text-blue-800',
    'PENDING': 'text-orange-600',
    'CANCELLED': 'text-red-600',
    'COMPLETED': 'text-green-700',
    'ONGOING': 'text-indigo-800',
  };
  return textMap[status] || 'text-gray-800';
};

const BookingManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const tabs = ['all', 'confirmed', 'active', 'complete', 'canceled', 'refund'];
  const tabLabels = {
    all: 'All Booking',
    confirmed: 'Confirmed',
    active: 'Active (Ongoing)',
    complete: 'Complete',
    canceled: 'Canceled',
    refund: 'Refunded'
  };

  const fetchBookings = useCallback(async (isBackground = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    if (!isBackground && bookings.length === 0) {
      setIsInitialLoad(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await getBookings();
      const backendBookings = response.body || response.data || [];
      const transformedBookings = backendBookings.map((booking, index) => ({
        id: booking.referenceCode || booking._id?.toString().slice(-6).toUpperCase() || `BK${index + 1}`,
        bookingId: booking._id,
        hostName: booking.listing?.host?.fullName || 'Unknown Host',
        guestName: booking.bookedBy?.fullName || 'Unknown Guest',
        amount: formatCurrency(booking.totalAmount?.price, booking.totalAmount?.currency),
        dateRange: formatDateRange(booking.checkIn, booking.checkOut),
        status: mapBookingStatus(booking.status),
        statusBg: getStatusBg(booking.status),
        statusText: getStatusText(booking.status),
        rawStatus: booking.status,
        listing: booking.listing,
        guests: booking.guests,
        createdAt: booking.createdAt,
        fullAddress: formatAddress(booking.listing),
        isAddressClickable: formatAddress(booking.listing) !== 'Address not available',
        cautionFeeRaw: booking.pricingBreakdown?.securityDeposit || 0,
        currency: booking.totalAmount?.currency || 'NGN',
        cautionFeeStatus: (booking.securityDepositStatus || 'HELD').toUpperCase(),
        disputeRaised: !!booking.disputeRaised,
        referenceCode: booking.referenceCode,
        securityDepositResolution: booking.securityDepositResolution || null,
        cancelReason: booking.cancelReason || '',
        cancelNote: booking.cancelNote || '',
        extensionsCount: Array.isArray(booking.extensions) ? booking.extensions.length : 0
      }));
      setBookings(transformedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      if (!isBackground) setBookings([]);
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [bookings.length]); 

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'confirmed') return booking.status === 'Confirmed';
    if (activeTab === 'active') return booking.status === 'Active';
    if (activeTab === 'complete') return booking.status === 'Completed';
    if (activeTab === 'canceled') return booking.status === 'Canceled';
    if (activeTab === 'refund') return booking.status === 'Refunded' || booking.status === 'Refund Requested';
    return true;
  }).filter(booking => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.id.toLowerCase().includes(query) ||
      booking.hostName.toLowerCase().includes(query) ||
      booking.guestName.toLowerCase().includes(query)
    );
  });

  const itemsPerPage = 7;
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIdx, startIdx + itemsPerPage);

  if (isInitialLoad && bookings.length === 0) {
    return (
      <div className="w-full h-auto min-h-screen px-6 py-6 bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-aeonik">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-inter relative">
      <div className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 inline-flex flex-wrap gap-2 mb-6 transition-all">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col relative overflow-visible">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center relative">
          {/* Subtle Refresh Indicator */}
          {isRefreshing && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 animate-pulse z-10"></div>
          )}
          <div className="relative w-full md:max-w-md">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search booking ID, traveler, or host…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-inter placeholder-slate-400"
            />
          </div>
          <button className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex justify-center items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer font-bold text-xs shadow-sm">
            <MdTune className="w-4 h-4" />
            <span className="hidden sm:inline">Advanced Search</span>
          </button>
        </div>

        {/* Table Content with Horizontal Scroll */}
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="min-w-[1100px]">
            {/* Table Header */}
            <div className="w-full px-6 py-4 bg-indigo-50/50 border-b border-slate-100 grid grid-cols-[115px_1.8fr_1fr_1fr_1.4fr_1fr_1fr_40px] items-center gap-8">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Booking ID</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Stakeholders</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Amount</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stay Period</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Address / Destination</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Caution Fee</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</div>
              <div className="text-right"></div>
            </div>

            <div className="w-full flex flex-col pb-24">
              {paginatedBookings.length > 0 ? (
                paginatedBookings.map((booking, idx) => {
                  const isLastItems = idx >= paginatedBookings.length - 2 && idx >= 3;
                  return (
                    <div key={idx} className="relative w-full px-6 py-5 border-b border-slate-100 grid grid-cols-[115px_1.8fr_1fr_1fr_1.4fr_1fr_1fr_40px] items-center hover:bg-slate-50/80 hover:z-50 transition-all gap-8 group">
                      {/* Booking ID */}
                      <div className="pl-2">
                        <div className="text-slate-900 text-xs font-black tracking-tight uppercase select-all">{booking.id}</div>
                        <div className="text-slate-400 text-[9px] font-bold mt-0.5 uppercase tracking-tighter">Reference</div>
                      </div>

                      <div className="pl-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 text-sm font-bold truncate">{booking.guestName}</span>
                          <span className="px-1 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded">GUEST</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-slate-500 text-xs font-medium truncate">{booking.hostName}</span>
                          <span className="px-1 py-0.5 bg-indigo-50 text-indigo-400 text-[8px] font-black uppercase rounded">HOST</span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-center">
                        <div className="text-slate-900 text-sm font-black tabular-nums">{booking.amount}</div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Value</div>
                      </div>

                      {/* Dates */}
                      <div className="text-center">
                        <div className="text-slate-700 text-xs font-bold tracking-tight">{booking.dateRange}</div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Period</div>
                      </div>

                      {/* Address */}
                      <div className="pl-2">
                        {booking.isAddressClickable ? (
                          <button
                            onClick={() => openAddressInMaps(booking.fullAddress)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold text-left line-clamp-1 transition-all flex items-center gap-1 group cursor-pointer"
                          >
                            <span className="truncate">{booking.fullAddress}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium line-clamp-1 italic">{booking.fullAddress}</span>
                        )}
                        <div className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">Location</div>
                      </div>

                      {/* Caution Status Badge */}
                      <div className="flex justify-center">
                        <div className={`px-3 py-1 rounded-full border flex justify-center items-center whitespace-nowrap ${
                          booking.cautionFeeStatus?.includes('RELEASED') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          booking.disputeRaised ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <span className="text-[10px] font-black uppercase tracking-wider">{booking.cautionFeeStatus?.replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className={`px-3 py-1 rounded-full border flex justify-center items-center whitespace-nowrap ${
                          booking.rawStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          booking.rawStatus === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          booking.rawStatus === 'ONGOING' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <span className="text-[10px] font-black uppercase tracking-wider">{booking.status}</span>
                        </div>
                        {booking.extensionsCount > 0 && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-full border border-indigo-200">
                            +{booking.extensionsCount} Extension(s) (2% Fee)
                          </span>
                        )}
                        {booking.rawStatus === 'CANCELLED' && booking.cancelReason && (
                          <span 
                            className="text-[9px] text-red-500 font-medium text-center line-clamp-1 max-w-[120px]" 
                            title={`${booking.cancelReason}${booking.cancelNote ? ': ' + booking.cancelNote : ''}`}
                          >
                            Reason: {booking.cancelReason}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end pr-2">
                        <BookingActionButton booking={booking} refresh={fetchBookings} isLastItems={isLastItems} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full py-20 text-center">
                  <div className="text-slate-300 font-black text-lg uppercase tracking-widest mb-2">Null Data</div>
                  <p className="text-slate-400 text-sm font-bold">No synchronization records match your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between font-inter bg-slate-50/50">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            Showing {startIdx + 1} - {Math.min(startIdx + itemsPerPage, filteredBookings.length)} of {filteredBookings.length}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                currentPage === 1 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 bg-white hover:bg-slate-50 shadow-sm'
              }`}
            >
              <MdArrowBack className="w-4 h-4" /> Prev
            </button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mx-2">Page {currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                currentPage === totalPages ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 bg-white hover:bg-slate-50 shadow-sm'
              }`}
            >
              Next <MdArrowForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;
