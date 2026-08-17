import React, { useState, useEffect, useRef } from 'react';
import { MdSearch, MdTune, MdArrowBack, MdArrowForward, MdCheckCircle } from 'react-icons/md';
import ListingTable from './ListingTable';
import ListingTableRow from './ListingTableRow';
import ListingTooltip from './ListingTooltip';
import ListingFiltersDropdown from './ListingFiltersDropdown';
import MassApprovalModal from './MassApprovalModal';
import { getListings, massApproveListing, massRejectListing } from '../../../../services/adminService';
import apiClient from '../../../../api/client';

const ListingManagement = () => {
  console.log('🔍 ListingManagement component mounted');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('ACTIVE');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ status: null, type: null, plan: null, hostName: null });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showSelectMode, setShowSelectMode] = useState(false);
  const [massActionType, setMassActionType] = useState(null); // 'approve' or 'reject'
  const [showMassApprovalModal, setShowMassApprovalModal] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const itemsPerPage = 8;
  const MAX_RETRIES = 3;
  const hasFetched = useRef(false);

  // Status Tab Definitions
  const STATUS_TABS = [
    { id: 'ACTIVE', label: 'Active / Live' },
    { id: 'PENDING', label: 'Pending Review' },
    { id: 'DRAFT', label: 'Drafts' },
    { id: 'UNLISTED', label: 'Unlisted' },
    { id: 'BOOKED', label: 'Booked' },
    { id: 'PAUSED', label: 'Paused / Suspended' },
    { id: 'REJECTED', label: 'Rejected' },
    { id: 'ALL', label: 'All Listings' },
  ];

  // Calculate badge counts for tabs
  const tabCounts = React.useMemo(() => {
    const counts = {
      ACTIVE: 0,
      PENDING: 0,
      DRAFT: 0,
      UNLISTED: 0,
      BOOKED: 0,
      PAUSED: 0,
      REJECTED: 0,
      ALL: listings.length,
    };

    listings.forEach((l) => {
      const raw = (l.rawData?.status || l.status || '').toUpperCase();
      if (raw === 'PENDING') counts.PENDING++;
      if (['AVAILABLE', 'ACTIVE', 'LIVE'].includes(raw)) counts.ACTIVE++;
      if (raw === 'DRAFT') counts.DRAFT++;
      if (raw === 'UNLISTED') counts.UNLISTED++;
      if (raw === 'BOOKED') counts.BOOKED++;
      if (['PAUSED', 'SUSPENDED'].includes(raw)) counts.PAUSED++;
      if (raw === 'REJECTED') counts.REJECTED++;
    });

    // In default Active view, Active count includes Available + Live + Booked plus Pending on top
    counts.ACTIVE = counts.ACTIVE + counts.BOOKED + counts.PENDING;

    return counts;
  }, [listings]);

  // Filter & Sort listings by tab, search, and secondary filters
  const filteredListings = React.useMemo(() => {
    const searchTerms = searchQuery.toLowerCase().trim();

    const filtered = listings.filter((listing) => {
      if (!listing) return false;

      // 1. Search filter
      const matchesSearch =
        !searchTerms ||
        (listing.title || '').toLowerCase().includes(searchTerms) ||
        (listing.hostName || '').toLowerCase().includes(searchTerms) ||
        (listing.hostUserId || '').toLowerCase().includes(searchTerms) ||
        (listing.hostId || '').toLowerCase().includes(searchTerms) ||
        (listing.id || '').toLowerCase().includes(searchTerms);

      if (!matchesSearch) return false;

      // 2. Status Tab filter
      const rawStatus = (listing.rawData?.status || listing.status || '').toUpperCase();
      let matchesTab = true;

      if (selectedStatusTab === 'ACTIVE') {
        matchesTab = ['AVAILABLE', 'ACTIVE', 'LIVE', 'BOOKED', 'PENDING'].includes(rawStatus);
      } else if (selectedStatusTab === 'PENDING') {
        matchesTab = rawStatus === 'PENDING';
      } else if (selectedStatusTab === 'DRAFT') {
        matchesTab = rawStatus === 'DRAFT';
      } else if (selectedStatusTab === 'UNLISTED') {
        matchesTab = rawStatus === 'UNLISTED';
      } else if (selectedStatusTab === 'BOOKED') {
        matchesTab = rawStatus === 'BOOKED';
      } else if (selectedStatusTab === 'PAUSED') {
        matchesTab = ['PAUSED', 'SUSPENDED'].includes(rawStatus);
      } else if (selectedStatusTab === 'REJECTED') {
        matchesTab = rawStatus === 'REJECTED';
      } else if (selectedStatusTab === 'ALL') {
        matchesTab = true;
      }

      if (!matchesTab) return false;

      // 3. Secondary dropdown filters
      const matchesStatusDropdown =
        !activeFilters.status ||
        activeFilters.status === 'All' ||
        rawStatus === activeFilters.status.toUpperCase();

      const matchesType =
        !activeFilters.type ||
        activeFilters.type === 'All' ||
        (listing.intent && listing.intent.toLowerCase() === activeFilters.type.toLowerCase());

      const matchesPlan =
        !activeFilters.plan ||
        activeFilters.plan === 'All' ||
        listing.planTier === activeFilters.plan;

      const matchesHost =
        !activeFilters.hostName ||
        activeFilters.hostName === 'All' ||
        listing.hostName === activeFilters.hostName;

      return matchesStatusDropdown && matchesType && matchesPlan && matchesHost;
    });

    // Smart sorting:
    // When in 'ACTIVE' tab: Pending reviews always float to the top, then sorted by createdAt
    return filtered.sort((a, b) => {
      if (selectedStatusTab === 'ACTIVE') {
        const aRaw = (a.rawData?.status || a.status || '').toUpperCase();
        const bRaw = (b.rawData?.status || b.status || '').toUpperCase();
        const aIsPending = aRaw === 'PENDING';
        const bIsPending = bRaw === 'PENDING';

        if (aIsPending && !bIsPending) return -1;
        if (!aIsPending && bIsPending) return 1;
      }

      // Default: sort newest first
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [listings, searchQuery, selectedStatusTab, activeFilters]);

  // Fetch listings from backend
  useEffect(() => {
    try {
      if (!hasFetched.current) {
        hasFetched.current = true;
        fetchListings();
      }
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError(`Failed to load listings: ${err.message}`);
      setLoading(false);
    }
  }, []);

  const fetchListings = async (attemptNumber = 1) => {
    if (attemptNumber === 1) {
      setLoading(true);
      setError(null);
      setRetryCount(0);
    }
    
    try {
      console.log(`[ListingManagement] Fetching listings (attempt ${attemptNumber}/${MAX_RETRIES})...`);
      const response = await getListings();
      console.log('[ListingManagement] Listings response:', response);
      
      // Handle the response structure
      let backendListings = [];
      if (response && response.body) {
        // Response structure: { body: [...], message: "..." }
        backendListings = Array.isArray(response.body) ? response.body : [];
      } else if (response && Array.isArray(response)) {
        // Response is directly an array
        backendListings = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Response structure: { data: [...] }
        backendListings = response.data;
      }
      
      console.log(`📊 Backend listings array: ${backendListings.length} items received`);
      
      if (!Array.isArray(backendListings)) {
        console.warn('Unexpected response structure:', response);
        setError('Invalid response structure from server');
        setListings([]);
        return;
      }
      
      if (backendListings.length === 0) {
        console.warn('⚠️ No listings returned from backend');
        setError('No listings found. Your listings may be in PENDING status awaiting approval.');
        setListings([]);
        return;
      }
      
      // Transform backend data to match UI format
      try {
        const transformedListings = backendListings.map((listing, index) => {
          if (!listing) {
            console.warn('Null or undefined listing at index:', index);
            return null;
          }
          
          try {
            // Debug: Log host information for each listing
            if (index < 5) {
              console.log(`[ListingManagement] Listing ${index} host info:`, {
                listingId: listing._id,
                host: listing.host,
                hostId: listing.hostId,
                hostUserId: listing.host?.userID,
                hostName: listing.host?.fullName
              });
            }
            
            return {
              id: listing._id?.toString() || listing.id?.toString() || listing.id || `temp-${index}`,
              title: listing.propertyName || listing.propertyTitle || listing.title || 'Untitled Listing',
              hostName: listing.host?.fullName || listing.host?.name || listing.hostName || 'Unknown Host',
              hostId: listing.host?._id?.toString() || listing.hostId?.toString() || null,
              // Never manufacture an ID from the row index: it makes unrelated
              // listings appear to belong to the same user.
              hostUserId: listing.host?.userID || listing.hostUserId || 'N/A',
              hostEmail: listing.host?.emailAddress || listing.host?.email || listing.hostEmail || 'N/A',
              hostPhone: listing.host?.phoneNumber || listing.host?.phone || listing.hostPhone || 'N/A',
              hostActive: listing.host?.active || false,
              status: mapStatus(listing.status),
              statusColor: getStatusColor(listing.status),
              planTier: listing.planTier || 'Free',
              boosted: listing.boosted ? 'Yes' : 'No',
              expDate: listing.expiryDate ? formatDate(listing.expiryDate) : getStatusDate(listing.status, listing.createdAt),
              propertyType: listing.rentalPurpose || listing.propertyType || listing.propertyCategory || 'N/A',
              intent: listing.intent || 'N/A',
              description: listing.description || '',
              price: listing.propertyPrice?.price || listing.price || 0,
              currency: listing.propertyPrice?.currency || listing.currency || 'NGN',
              pricingPeriod: listing.pricingPeriod || listing.propertyPrice?.pricingPeriod || 'night',
              securityDeposit: listing.securityDeposit || listing.propertyPrice?.securityDeposit || 0,
              cleaningFee: listing.cleaningFee || listing.propertyPrice?.cleaningFee || 0,
              location: listing.propertyLocation?.fullAddress || listing.propertyLocation?.city || listing.address || listing.city || 'N/A',
              images: listing.propertyImages || [],
              amenities: listing.amenities || [],
              bedrooms: listing.bedrooms || 0,
              bathrooms: listing.bathrooms || 0,
              guests: listing.guests || 1,
              viewCount: listing.viewCount || 0,
              createdAt: listing.createdAt,
              // Raw backend object for details popup
              rawData: listing,
            };
          } catch (itemErr) {
            console.error('Error transforming listing at index', index, itemErr, 'Listing object:', listing);
            return null;
          }
        }).filter(Boolean); // Remove any null entries
        
        console.log('🎯 Transformed listings:', transformedListings.length, 'items');
        if (transformedListings.length === 0 && backendListings.length > 0) {
          console.warn('⚠️ All listings were filtered out during transformation!');
        }
        setListings(transformedListings);
      } catch (transformErr) {
        console.error('Error transforming listings:', transformErr);
        setError(`Failed to transform listing data: ${transformErr.message}`);
        setListings([]);
      }
    } catch (err) {
      console.error('[ListingManagement] Error fetching listings:', err);
      console.error('[ListingManagement] Error details:', {
        code: err.code,
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url
      });
      
      let errorMsg = err.response?.data?.message || err.response?.statusText || err.message || 'Unknown error';
      let finalError = `Failed to load listings: ${errorMsg}`;
      let shouldRetry = false;
      
      // Check specific error types
      if (err.response?.status === 401) {
        finalError = '❌ Unauthorized (401) - Invalid admin token. Log in again with admin credentials (admin@lunest.app)';
      } else if (err.response?.status === 403) {
        finalError = '❌ Forbidden (403) - Your account does not have admin privileges';
      } else if (err.response?.status === 404) {
        finalError = `❌ Not Found (404) - Backend endpoint /admin/listings unavailable. Verify backend is running at ${apiClient.defaults.baseURL}`;
      } else if (err.message && err.message.includes('No auth token')) {
        finalError = '❌ Missing Auth Token - Please log in first with admin@lunest.app';
      } else if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || !err.response) {
        finalError = `⚠️ Network Error - Backend unreachable at ${apiClient.defaults.baseURL}. Retrying...`;
        shouldRetry = true;
      }
      
      // Retry logic for network errors
      if (shouldRetry && attemptNumber < MAX_RETRIES) {
        setRetryCount(attemptNumber);
        console.log(`[ListingManagement] Retrying in ${1000 * attemptNumber}ms...`);
        setTimeout(() => {
          fetchListings(attemptNumber + 1);
        }, 1000 * attemptNumber);
        return;
      }
      
      setError(finalError);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for data transformation
  const mapStatus = (status) => {
    try {
      const statusMap = {
        'PENDING': 'Pending',
        'AVAILABLE': 'Available',
        'BOOKED': 'Booked',
        'PAUSED': 'Paused',
        'REJECTED': 'Rejected',
        'SUSPENDED': 'Suspended',
        'DRAFT': 'Draft',
        'UNLISTED': 'Unlisted',
      };
      return statusMap[status] || status || 'Pending';
    } catch (e) {
      console.error('Error in mapStatus:', e, 'status:', status);
      return 'Pending';
    }
  };

  const getStatusColor = (status) => {
    try {
      const colorMap = {
        'PENDING': 'amber',
        'AVAILABLE': 'emerald',
        'BOOKED': 'indigo',
        'PAUSED': 'slate',
        'REJECTED': 'rose',
        'SUSPENDED': 'red',
        'DRAFT': 'slate',
        'UNLISTED': 'amber',
      };
      return colorMap[status] || 'amber';
    } catch (e) {
      console.error('Error in getStatusColor:', e, 'status:', status);
      return 'orange';
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      console.error('Error in formatDate:', e, 'dateString:', dateString);
      return 'N/A';
    }
  };

  const getStatusDate = (status, createdAt) => {
    try {
      if (status === 'PENDING') return 'Under Review';
      return formatDate(createdAt);
    } catch (e) {
      console.error('Error in getStatusDate:', e, 'status:', status, 'createdAt:', createdAt);
      return 'N/A';
    }
  };



  // Handle filter changes from dropdown
  const handleApplyFilters = (newFilters) => {
    console.log('🎯 Applying filters:', newFilters);
    
    // Normalize status to uppercase for backend/raw matching if needed
    const normalizedFilters = { ...newFilters };
    if (normalizedFilters.status && normalizedFilters.status !== 'All') {
      normalizedFilters.status = normalizedFilters.status.toUpperCase();
    }
    
    setActiveFilters(normalizedFilters);
    setCurrentPage(1);
    setShowFiltersPopup(false);
  };

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, startIndex + itemsPerPage);

  const handleMassAction = async () => {
    const selectedIds = Array.from(selectedRows);
    console.log(`${massActionType === 'approve' ? 'Approving' : 'Rejecting'} listings:`, selectedIds);
    
    setIsProcessing(true);
    try {
      if (massActionType === 'approve') {
        await massApproveListing(selectedIds);
      } else {
        await massRejectListing(selectedIds, 'Rejected by admin');
      }
      
      // Refresh listings after action
      await fetchListings();
      
      // Clear selections and close modal
      setSelectedRows(new Set());
      setShowSelectMode(false);
      setShowMassApprovalModal(false);
      setMassActionType(null);
    } catch (err) {
      console.error('Error performing mass action:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-aeonik">Loading listings...</p>
        </div>
      </div>
    );
  }

  console.log('🔍 ListingManagement rendering with listings:', listings.length, 'error:', error);

  const renderContent = () => {
    try {
      return (
    <div className="p-6 bg-slate-50 min-h-screen font-aeonik relative">
      {/* Tooltip */}
      <ListingTooltip />

      {/* Main Content Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {/* Top Control Bar: Search & Action Buttons */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, host, User ID or Listing ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-inter placeholder-slate-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            {selectedRows.size > 0 && (
              <span className="text-sm text-indigo-700 font-bold px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                {selectedRows.size} selected
              </span>
            )}

            <button 
              disabled={selectedRows.size === 0}
              onClick={() => {
                setMassActionType('approve');
                setShowMassApprovalModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer text-xs font-bold whitespace-nowrap shadow-sm ${
                selectedRows.size > 0 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              Approve
            </button>
            
            <button 
              disabled={selectedRows.size === 0}
              onClick={() => {
                setMassActionType('reject');
                setShowMassApprovalModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer text-xs font-bold whitespace-nowrap shadow-sm ${
                selectedRows.size > 0 
                  ? 'bg-rose-600 text-white hover:bg-rose-700' 
                  : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              Reject
            </button>
            
            <button 
              onClick={() => {
                setShowSelectMode(!showSelectMode);
                if (showSelectMode) {
                  setSelectedRows(new Set());
                }
              }}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer text-xs font-bold whitespace-nowrap border shadow-sm ${
                showSelectMode
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {showSelectMode ? 'Cancel' : 'Select'}
            </button>
            
            <button 
              onClick={() => setShowFiltersPopup(!showFiltersPopup)}
              className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex justify-center items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer relative font-bold text-xs shadow-sm"
            >
              <MdTune className="w-4 h-4" />
              <span className="hidden sm:inline">More Filters</span>
              {(activeFilters.status || activeFilters.type || activeFilters.plan) && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></div>
              )}
            </button>
          </div>
        </div>

        {/* Smart Status Filter Tabs */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between overflow-x-auto scrollbar-hide gap-2">
          <div className="flex items-center gap-2 flex-nowrap">
            {STATUS_TABS.map((tab) => {
              const isActive = selectedStatusTab === tab.id;
              const count = tabCounts[tab.id] || 0;
              const isPendingTab = tab.id === 'PENDING';
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedStatusTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : isPendingTab && count > 0
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isPendingTab && count > 0
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {(activeFilters.type || activeFilters.plan || activeFilters.hostName) && (
            <button
              onClick={() => {
                setActiveFilters({ status: null, type: null, plan: null, hostName: null });
                setCurrentPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium whitespace-nowrap px-2 py-1 underline cursor-pointer flex-shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filters Popup */}
        {showFiltersPopup && (
          <div className="w-full px-7">
            <ListingFiltersDropdown
              activeFilters={activeFilters}
              hostOptions={['All', ...new Set(listings.map(l => l.hostName).filter(Boolean))].sort()}
              onApplyFilters={handleApplyFilters}
              onClose={() => setShowFiltersPopup(false)}
            />
          </div>
        )}

        {/* Table Content with Horizontal Scroll */}
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="min-w-[1000px]">
            {/* Table Header */}
            <div className="w-full px-6 py-4 bg-indigo-50/50 border-b border-slate-100 flex justify-start items-center gap-6">
              {showSelectMode && (
                <div className="w-6 h-6 flex-shrink-0"></div>
              )}
              <div className="w-44 text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0">Listing Details</div>
              <div className="w-48 text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0">Host</div>
              <div className="w-28 text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0">Submitted</div>
              <div className="w-24 text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0 text-center">Status</div>
              <div className="w-16 text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0 text-center">Plan</div>
              <div className="w-16 text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0 text-center">Boosted</div>
              <div className="w-16 text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0 text-center">Views</div>
              <div className="w-28 text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0">Exp. Date</div>
              <div className="w-14 text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="w-full flex flex-col pb-32">
              {paginatedListings.length > 0 ? (
                paginatedListings.map((listing, index) => (
                  <ListingTableRow
                    key={listing.id}
                    listing={listing}
                    isSelected={selectedRows.has(listing.id)}
                    isLastItem={index >= paginatedListings.length - 2 && index >= 3}
                    onSelect={(id) => {
                      const newSelected = new Set(selectedRows);
                      if (newSelected.has(id)) {
                        newSelected.delete(id);
                      } else {
                        newSelected.add(id);
                      }
                      setSelectedRows(newSelected);
                    }}
                    showSelectMode={showSelectMode}
                    onListingUpdated={fetchListings}
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
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between font-aeonik">
          {/* Previous Button */}
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className={`flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              currentPage === 1 
                ? 'text-slate-300 border-slate-100 cursor-not-allowed' 
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <MdArrowBack className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page Counter */}
          <span className="text-sm text-slate-500 font-medium">
            Page {currentPage} of {totalPages}
          </span>

          {/* Next Button */}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className={`flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              currentPage === totalPages
                ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <MdArrowForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mass Approval Modal */}
      {showMassApprovalModal && (
        <MassApprovalModal
          selectedListings={filteredListings.filter(listing => selectedRows.has(listing.id))}
          actionType={massActionType}
          onClose={() => {
            setShowMassApprovalModal(false);
            setMassActionType(null);
          }}
          onApprove={handleMassAction}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg mt-4">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          {retryCount > 0 && retryCount < MAX_RETRIES && (
            <p className="text-red-500 text-xs mt-1">Attempt {retryCount}/{MAX_RETRIES}</p>
          )}
          <button 
            onClick={() => fetchListings()}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Retry Now
          </button>
        </div>
      )}
    </div>
  );
    } catch (renderErr) {
      console.error('Error rendering ListingManagement:', renderErr);
      return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 font-aeonik mb-2">Rendering Error</h2>
            <p className="text-red-700 text-sm mb-4">{renderErr.message || 'An error occurred while rendering listings'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold font-aeonik"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
  };

  return renderContent();
};

export default ListingManagement;
