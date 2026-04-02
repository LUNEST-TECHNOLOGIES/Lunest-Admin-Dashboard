import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { resolveImageUrl } from '../../../../utils/imageUtils';


const getInitialImages = (listing) => {
  if (Array.isArray(listing?.propertyImages) && listing.propertyImages.length > 0) {
    return listing.propertyImages;
  }
  if (Array.isArray(listing?.images) && listing.images.length > 0) {
    return listing.images;
  }
  return [];
};

const EditListing = ({ listing, onClose, onSave, isLoading = false }) => {
  const [title, setTitle] = useState(listing?.title || '');
  const [description, setDescription] = useState(listing?.description || '');
  const [plan, setPlan] = useState(listing?.plan || 'Standard');
  const [images, setImages] = useState(getInitialImages(listing));

  // Remove image by index
  const handleRemoveImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave({
      listingId: listing?.id,
      title: title.trim(),
      description: description.trim(),
      plan,
      propertyImages: images,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      <div className="w-full max-w-[652px] bg-white rounded-[20px] border border-black shadow-lg overflow-hidden relative flex flex-col justify-between p-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="w-6 h-6 absolute top-6 right-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        >
          <MdClose className="w-5 h-5 text-black" />
        </button>

        {/* Header Content */}
        <div className="flex flex-col justify-center items-center gap-7 mt-2 mb-6">
          <h2 className="text-black text-lg font-bold font-aeonik">Edit Listing</h2>
          <div className="text-center">
            <p className="text-slate-900 text-base font-medium font-aeonik">
              ID: {listing?.id || 'LST001'}
            </p>
          </div>
        </div>


        {/* Form Fields */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-semibold font-aeonik">Listing Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              placeholder="Enter listing title..."
              className="p-3 border-0.5 border-neutral-500 rounded-[10px] text-slate-900 text-sm font-normal font-inter placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-semibold font-aeonik">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Enter listing description..."
              className="h-24 p-4 border-0.5 border-neutral-500 rounded-[10px] text-slate-900 text-sm font-normal font-inter placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Images */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-semibold font-aeonik">Property Images</label>
            {images.length === 0 && (
              <div className="text-xs text-gray-400">No images uploaded for this listing.</div>
            )}
            <div className="flex gap-2 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={resolveImageUrl(img)}
                    alt={`Property ${idx + 1}`}
                    className="w-20 h-20 rounded border object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(idx)}
                    disabled={isLoading}
                    title="Remove image"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            {/* TODO: Add upload input here if needed */}
          </div>

          {/* Plan */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-sm font-semibold font-aeonik">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              disabled={isLoading}
              className="p-3 border-0.5 border-neutral-500 rounded-[10px] text-slate-900 text-sm font-normal font-inter focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Professional">Professional</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-60 flex gap-4 justify-center mx-auto mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-3 rounded-3xl border-2 border-red-600 inline-flex justify-center items-center gap-1 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-red-600 text-base font-bold font-aeonik leading-4">Cancel</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-3 bg-slate-900 rounded-3xl inline-flex justify-center items-center gap-1 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-white text-base font-bold font-aeonik leading-4">Saving...</span>
              </>
            ) : (
              <span className="text-white text-base font-bold font-aeonik leading-4">Save</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditListing;
