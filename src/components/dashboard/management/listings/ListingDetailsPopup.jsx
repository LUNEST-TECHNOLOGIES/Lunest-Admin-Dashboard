import React, { useState, useEffect } from 'react';
import { MdClose, MdImage } from 'react-icons/md';
import { approveListing, rejectListing, getUserById, unlistListing, relistListing } from '../../../../services/adminService';
import { resolveImageUrl, normalizeArray } from '../../../../utils/imageUtils';
import ApproveListing from './ApproveListing';
import RejectListing from './RejectListing';
import UnlistListing from './UnlistListing';
import { useNotification } from '../../../ui/NotificationProvider';

const ListingDetailsPopup = ({ listing, onClose, onListingUpdated }) => {
  const notify = useNotification();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hostInfo, setHostInfo] = useState(null);
  const [loadingHost, setLoadingHost] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [showUnlistPopup, setShowUnlistPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [imageError, setImageError] = useState({});
  const [videoError, setVideoError] = useState({});


  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // Next image
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }
    
    if (isRightSwipe) {
       // Prev image
       setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
    }
  };

  useEffect(() => {
    // Try to use pre-loaded host info from listing first
    if (listing?.host) {
      setHostInfo(listing.host);
    } else if (listing?.hostId) {
      fetchHostInfo();
    }
  }, [listing?.hostId, listing?.host]);

  const fetchHostInfo = async () => {
    if (!listing.hostId) return;
    
    try {
      setLoadingHost(true);
      const response = await getUserById(listing.hostId);
      setHostInfo(response.body || response.data || {});
    } catch (error) {
      // Create a silent failure for 404s (orphaned listings)
      // Only log if it's NOT a 404
      if (error.response && error.response.status === 404) {
         console.warn(`Host info not found for ID: ${listing.hostId} (likely orphaned listing)`);
         setHostInfo({ fullName: 'Unknown (User Deleted)', email: 'N/A' });
      } else {
         console.error('Error fetching host info:', error);
         setHostInfo({});
      }
    } finally {
      setLoadingHost(false);
    }
  };

  // ... existing code ...
  const amenities = Array.isArray(listing?.amenities) ? listing.amenities : [];

  // Helper to format currency
  const formatPrice = (amount) => {
    // ... existing code ...
    if (amount === undefined || amount === null) return '0.00';
    return Number(amount).toLocaleString('en-NG', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Helper to get expiry date (12 months from creation)
  const getExpiryDate = () => {
    if (listing?.expDate) return listing.expDate;
    
    // Calculate 12 months from createdAt
    if (listing?.createdAt) {
      const created = new Date(listing.createdAt);
      created.setFullYear(created.getFullYear() + 1); // Add 1 year
      
      const now = new Date();
      if (now > created) {
         return (
             <span className="text-amber-600 font-bold flex items-center gap-1">
                 Verify & Update Listing
             </span>
         );
      }

      return created.toLocaleDateString();
    }
    
    return '12 Months'; // Fallback
  };

  // The admin list response can expose images at either level and S3 may
  // return objects rather than URL strings. Keep every valid candidate.
  const images = [
    listing?.rawData?.propertyImages,
    listing?.rawData?.images,
    listing?.propertyImages,
    listing?.images,
  ]
    .flatMap(normalizeArray)
    .map(resolveImageUrl)
    .filter(Boolean)
    .filter((image, index, array) => array.indexOf(image) === index);

  // Enhanced video handling - extract URLs from various object formats
  const extractVideoUrl = (video) => {
    if (!video) return null;
    
    console.log('[Video Extraction] Input video data:', video);
    
    if (typeof video === 'string') {
      // Skip blob URLs - they're temporary and won't work
      if (video.startsWith('blob:')) {
        console.warn('[Video Extraction] Skipping blob URL:', video);
        return null;
      }
      const resolved = resolveImageUrl(video);
      console.log('[Video Extraction] Resolved string URL:', video, '->', resolved);
      return resolved;
    }
    
    // Handle video objects with different field names
    const url = video.url || video.uri || video.src || video.location || video.key || video.Key || video.filename;
    
    if (!url) {
      console.warn('[Video Extraction] No URL field found in video object:', video);
      return null;
    }
    
    // Skip blob URLs in objects too
    if (url.startsWith('blob:')) {
      console.warn('[Video Extraction] Skipping blob URL in object:', url);
      return null;
    }
    
    const resolved = resolveImageUrl(url);
    console.log('[Video Extraction] Resolved object URL:', url, '->', resolved);
    return resolved;
  };

  const videos = normalizeArray(
    listing?.rawData?.propertyVideos && listing.rawData.propertyVideos.length > 0 
      ? listing.rawData.propertyVideos 
      : listing?.videos && listing.videos.length > 0 
      ? listing.videos 
      : listing?.propertyVideos && listing.propertyVideos.length > 0
      ? listing.propertyVideos
      : []
  ).map(extractVideoUrl).filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      {/* Full Screen Image Modal */}
      {showFullScreen && (
        <div 
          className="fixed inset-0 bg-black/95 z-[10000] flex flex-col items-center justify-center p-4"
          onClick={() => setShowFullScreen(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button 
            className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setShowFullScreen(false)}
          >
            <MdClose className="w-8 h-8" />
          </button>
          <img
            src={images[currentImageIndex]}
            alt={`Full screen view ${currentImageIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
             {images.map((_, idx) => (
               <button
                 key={idx}
                 onClick={(e) => {
                   e.stopPropagation();
                   setCurrentImageIndex(idx);
                 }}
                 className={`w-3 h-3 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/30 hover:bg-white/50'}`}
               />
             ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-[652px] bg-white rounded-[20px] border border-black shadow-lg overflow-hidden">
        {/* Header */}
        <div className="w-full h-20 bg-white rounded-t-[20px] flex justify-between items-center px-8 py-6 border-b border-neutral-200">
          <h2 className="text-black text-lg font-bold font-aeonik">Listing Details</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
          >
            <MdClose className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="w-full max-h-[534px] overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            {/* Title */}
            <div className="pb-5 border-b border-neutral-200">
              <h3 className="text-black text-base font-semibold font-aeonik">
                {listing?.title || 'Untitled Listing'}
              </h3>
            </div>

            {/* Info Row */}
            <div className="flex flex-wrap gap-4 pb-5 border-b border-neutral-200 text-sm font-aeonik">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-black">ID:</span>
                <span className="font-medium text-black">{listing?.id || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-black">Plan:</span>
                <span className="font-medium text-black">{listing?.planTier || 'Free'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-black">Created:</span>
                <span className="font-medium text-black">
                  {listing?.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-black">Expires:</span>
                <span className="font-medium text-black">{getExpiryDate()}</span>
              </div>
            </div>

            {/* Property Details & Host Information */}
            <div className="grid grid-cols-2 gap-4 pb-5 border-b border-neutral-200">
              {/* Property Details */}
              <div>
                <h4 className="text-black text-base font-semibold font-aeonik mb-3">Property Details</h4>
              <div className="space-y-2 text-sm font-aeonik">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Location:</span>
                  <span className="text-xs text-black">{listing?.location || listing?.rawData?.propertyLocation?.fullAddress || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-black">Type:</span>
                  <span className="text-xs text-black">{listing?.propertyType || listing?.rawData?.rentalPurpose || listing?.rawData?.propertyType || listing?.rawData?.propertyCategory || 'Not specified'}</span>
                  {listing?.rawData?.instantBooking && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">Instant</span>
                  )}
                  {listing?.rawData?.availableNow && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">Available</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Bedrooms:</span>
                  <span className="text-xs text-black">{listing?.bedrooms || listing?.rawData?.bedrooms || '0'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Bathrooms:</span>
                  <span className="text-xs text-black">{listing?.bathrooms || listing?.rawData?.bathrooms || '0'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Guests:</span>
                  <span className="text-xs text-black">{listing?.guests || listing?.rawData?.guests || '1'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Price:</span>
                  <span>
                    <span className="text-sm font-semibold text-black">
                      {listing?.currency || listing?.rawData?.propertyPrice?.currency || '₦'}
                      {formatPrice(listing?.price || listing?.rawData?.propertyPrice?.price)}
                    </span>
                    <span className="text-xs text-black">
                      /{listing?.pricingPeriod || listing?.rawData?.pricingPeriod || listing?.rawData?.propertyPrice?.pricingPeriod || 'night'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Caution Fee:</span>
                  <span className="text-xs text-black">
                    {listing?.currency || listing?.rawData?.propertyPrice?.currency || '₦'}
                    {formatPrice(
                      // Check securityDeposit first (as per user request "it is store as security deposit")
                      (listing?.securityDeposit || listing?.rawData?.securityDeposit || listing?.rawData?.propertyPrice?.securityDeposit) ||
                      (listing?.cautionFee || listing?.rawData?.cautionFee || listing?.rawData?.propertyPrice?.cautionFee) ||
                      0
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Service Charge:</span>
                  <span className="text-xs text-black">
                    {listing?.currency || listing?.rawData?.propertyPrice?.currency || '₦'}
                    {formatPrice(
                      (listing?.serviceCharge || listing?.rawData?.serviceCharge || listing?.rawData?.propertyPrice?.serviceCharge) ||
                      (listing?.cleaningFee || listing?.rawData?.cleaningFee || listing?.rawData?.propertyPrice?.cleaningFee) ||
                      0
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Expires:</span>
                  <span className="text-xs text-black">{getExpiryDate()}</span>
                </div>
              </div>
            </div>

            {/* Advanced Space Details */}
            {(listing?.rawData?.sittingRooms > 0 || listing?.rawData?.lounges > 0 || listing?.rawData?.workspaces > 0 || listing?.rawData?.totalSquareFootage || listing?.rawData?.rentalPurpose) && (
              <div className="pb-5 border-b border-neutral-200">
                <h4 className="text-black text-base font-semibold font-aeonik mb-3">Space Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm font-aeonik">
                  <div className="space-y-2">
                    {listing?.rawData?.sittingRooms > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-black">Sitting Rooms:</span>
                        <span className="text-xs text-black">{listing.rawData.sittingRooms}</span>
                      </div>
                    )}
                    {listing?.rawData?.lounges > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-black">Lounges:</span>
                        <span className="text-xs text-black">{listing.rawData.lounges}</span>
                      </div>
                    )}
                    {listing?.rawData?.workspaces > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-black">Workspaces:</span>
                        <span className="text-xs text-black">{listing.rawData.workspaces}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {listing?.rawData?.totalSquareFootage && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-black">Total Area:</span>
                        <span className="text-xs text-black">{listing.rawData.totalSquareFootage}</span>
                      </div>
                    )}
                    {listing?.rawData?.rentalPurpose && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-black">Category:</span>
                        <span className="text-xs text-black">{listing.rawData.rentalPurpose}</span>
                      </div>
                    )}
                    {listing?.rawData?.usageType && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-black">Usage:</span>
                        <span className="text-xs text-black">{listing.rawData.usageType}</span>
                      </div>
                    )}
                  </div>
                </div>
                {listing?.rawData?.roomSizes && listing.rawData.roomSizes.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-black text-xs">Room Sizes:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {listing.rawData.roomSizes.map((size, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-100 text-[10px] rounded border border-slate-200">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documentation & Agreements */}
            {(listing?.rawData?.agreementUrl || listing?.rawData?.agreementAt) && (
              <div className="pb-5 border-b border-neutral-200">
                <h4 className="text-black text-base font-semibold font-aeonik mb-3">Documentation</h4>
                <div className="space-y-2 text-sm font-aeonik">
                  {listing?.rawData?.agreementAt && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-black">Agreement Signed:</span>
                      <span className="text-xs text-black">{new Date(listing.rawData.agreementAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {listing?.rawData?.agreementUrl && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-black">Agreement Doc:</span>
                      <a 
                        href={listing.rawData.agreementUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                      >
                        View Legal Agreement
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Host Information */}
            <div>
              <h4 className="text-black text-base font-semibold font-aeonik mb-3">Host Information</h4>
              <div className="space-y-2 text-sm font-aeonik">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Host:</span>
                  <span className="text-xs text-black">{hostInfo?.fullName || listing?.hostName || listing?.host?.fullName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Email:</span>
                  <span className="text-xs text-black">{hostInfo?.emailAddress || hostInfo?.email || listing?.hostEmail || 'Not available'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">Status:</span>
                  <span className={`text-xs font-medium ${(hostInfo?.active || listing?.hostActive) ? 'text-green-600' : 'text-red-600'}`}>
                    {(hostInfo?.active || listing?.hostActive) ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-black">User Type:</span>
                  <span className="text-xs text-black">{hostInfo?.userType || 'Host'}</span>
                </div>
              </div>
            </div>
          </div>

            {/* Description */}
            <div className="pb-5 border-b border-neutral-200">
              <h4 className="text-black text-base font-semibold font-aeonik mb-3">Description</h4>
              <p className="text-black text-sm font-aeonik">
                {listing?.description || listing?.rawData?.description || 'No description provided'}
              </p>
            </div>

            {/* Amenities */}
            <div className="pb-5 border-b border-neutral-200">
              <h4 className="text-black text-base font-semibold font-aeonik mb-3">Amenities</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {listing.amenities && listing.amenities.length > 0 ? (
                  listing.amenities
                    // Remove filter(a => !String(a).startsWith('custom_')) so custom amenities are shown
                    .map((amenity, index) => {
                      let displayValue = '';
                      if (typeof amenity === 'string') {
                        displayValue = amenity;
                      } else if (typeof amenity === 'object' && amenity !== null) {
                        displayValue = amenity.label || amenity.name || JSON.stringify(amenity);
                      }
                      
                      return (
                        <div
                          key={index}
                          className="px-3.5 py-2 bg-violet-100/70 rounded-lg border-2 border-indigo-500 flex items-center gap-2"
                        >
                          <span className="text-slate-900 text-xs font-medium">
                            {displayValue}
                          </span>
                          <div className="w-3 h-3 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <span className="text-sm text-gray-500">No amenities listed</span>
                )}
              </div>
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div>
                <h4 className="text-black text-base font-semibold font-aeonik mb-3">Images</h4>
                
                {/* Main Image Display */}
                <div 
                  className="w-full h-[300px] mb-4 bg-neutral-100 rounded-[10px] overflow-hidden border border-neutral-200 cursor-zoom-in group relative"
                  onClick={() => !imageError[currentImageIndex] && setShowFullScreen(true)}
                >
                  {imageError[currentImageIndex] ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <MdImage className="w-12 h-12 mb-2" />
                      <span className="text-sm">Image failed to load</span>
                    </div>
                  ) : (
                    <img
                      src={images[currentImageIndex]}
                      alt={`Listing ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={() => {
                        console.error('[Image Load Error] Failed to load image:', images[currentImageIndex]);
                        setImageError(prev => ({ ...prev, [currentImageIndex]: true }));
                      }}
                      onLoad={() => setImageError(prev => ({ ...prev, [currentImageIndex]: false }))}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">Click to view full screen</span>
                  </div>
                </div>

                <div>
                  <div className="text-right text-black text-xs font-medium mb-2">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-24 h-24 rounded-[10px] border-4 flex-shrink-0 cursor-pointer transition-all overflow-hidden ${
                          index === currentImageIndex ? 'border-indigo-400' : 'border-neutral-300'
                        }`}
                      >
                        {imageError[index] ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            <MdImage className="w-6 h-6" />
                          </div>
                        ) : (
                          <img
                            src={image}
                            alt={`Listing ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={() => {
                              console.error('[Thumbnail Load Error] Failed to load thumbnail:', image);
                              setImageError(prev => ({ ...prev, [index]: true }));
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="pb-5">
                <h4 className="text-black text-base font-semibold font-aeonik mb-3">Videos</h4>
                <div className="flex flex-col gap-4">
                    {videos.map((videoUrl, index) => (
                      <div key={index} className="relative">
                        {videoError[index] ? (
                          <div className="w-full h-[300px] bg-black rounded-[10px] flex flex-col items-center justify-center text-gray-400">
                            <MdImage className="w-12 h-12 mb-2" />
                            <span className="text-sm">Video failed to load</span>
                            <span className="text-xs text-gray-500 mt-1">{videoUrl}</span>
                          </div>
                        ) : (
                          <video
                            src={videoUrl}
                            controls
                            className="w-full h-[300px] bg-black rounded-[10px] overflow-hidden"
                            onError={() => {
                              console.error('[Video Load Error] Failed to load video:', videoUrl);
                              setVideoError(prev => ({ ...prev, [index]: true }));
                            }}
                          />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Admin Action Buttons */}
            {listing?.status === 'Pending' ? (
              <div className="mt-8 pt-8 border-t border-neutral-200 flex flex-col gap-3">
                <h4 className="text-black text-base font-semibold font-aeonik">Admin Actions</h4>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowApprovePopup(true)}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-[10px] font-aeonik font-bold text-base hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectPopup(true)}
                    disabled={isLoading}
                    className="flex-1 py-3 border-2 border-red-600 text-red-600 rounded-[10px] font-aeonik font-bold text-base hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
                <p className="text-xs text-gray-500 font-aeonik text-center">
                  Hosts will receive an email notification upon approval or rejection.
                </p>
              </div>
            ) : (
              <div className="mt-8 pt-8 border-t border-neutral-200 flex flex-col gap-3">
                <h4 className="text-black text-base font-semibold font-aeonik">Listing Management</h4>
                <div className="flex gap-4">
                  {listing?.status === 'Unlisted' || listing?.status === 'UNLISTED' ? (
                    <button
                      onClick={() => setShowUnlistPopup(true)}
                      disabled={isLoading}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-[10px] font-aeonik font-bold text-base hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Relist Property
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowUnlistPopup(true)}
                      disabled={isLoading}
                      className="flex-1 py-3 border-2 border-amber-600 text-amber-700 bg-amber-50 rounded-[10px] font-aeonik font-bold text-base hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Unlist Property
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-aeonik text-center">
                  Unlisted properties remain in the database and admin dashboard, but are hidden from guest explore and searches.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Confirmation Modals */}
      {showApprovePopup && (
        <ApproveListing 
          listing={listing}
          isLoading={isLoading}
          onClose={() => setShowApprovePopup(false)}
          onApprove={async () => {
            try {
              setIsLoading(true);
              await approveListing(listing?.id);
              notify.success(
                'Listing Approved!',
                `ID: ${listing?.id} - ${listing?.title} has been approved successfully. Email sent to host.`
              );
              setShowApprovePopup(false);
              if (onListingUpdated) onListingUpdated();
              onClose(); // Close the details popup too
            } catch (error) {
              console.error('Error approving listing:', error);
              notify.error(
                'Approval Failed',
                error.response?.data?.message || error.message || 'Failed to approve listing'
              );
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}

      {showRejectPopup && (
        <RejectListing 
          listing={listing}
          isLoading={isLoading}
          onClose={() => setShowRejectPopup(false)}
          onReject={async (data) => {
            try {
              setIsLoading(true);
              await rejectListing(listing?.id, data.reason);
              notify.success(
                'Listing Rejected',
                `Listing ${listing?.id} rejected. Reason: "${data.reason}". Email notification has been dispatched to the host.`
              );
              setShowRejectPopup(false);
              if (onListingUpdated) onListingUpdated();
              onClose(); // Close the details popup too
            } catch (error) {
              console.error('Error rejecting listing:', error);
              notify.error(
                'Rejection Failed',
                error.response?.data?.message || error.message || 'Failed to reject listing'
              );
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}

      {showUnlistPopup && (
        <UnlistListing
          listing={listing}
          isRelist={listing?.status === 'UNLISTED' || listing?.status === 'Unlisted'}
          isLoading={isLoading}
          onClose={() => setShowUnlistPopup(false)}
          onConfirm={async (reason) => {
            const isRelist = listing?.status === 'UNLISTED' || listing?.status === 'Unlisted';
            const targetId = listing?._id || listing?.id || listing?.rawData?._id;
            try {
              setIsLoading(true);
              if (isRelist) {
                await relistListing(targetId);
                notify.success(
                  'Listing Relisted!',
                  `ID: ${listing?.id || targetId} - ${listing?.title || 'Property'} has been successfully relisted.`
                );
              } else {
                await unlistListing(targetId, reason || 'Unlisted by admin');
                notify.success(
                  'Listing Unlisted!',
                  `ID: ${listing?.id || targetId} - ${listing?.title || 'Property'} has been successfully unlisted.`
                );
              }
              setShowUnlistPopup(false);
              if (onListingUpdated) onListingUpdated();
              onClose(); // Close the details popup too
            } catch (error) {
              console.error('Error modifying listing status:', error);
              notify.error(
                isRelist ? 'Relist Failed' : 'Unlist Failed',
                error.response?.data?.message || error.message || 'Failed to update listing status'
              );
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default ListingDetailsPopup;
