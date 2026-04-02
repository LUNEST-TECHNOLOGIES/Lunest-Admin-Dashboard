import React, { useState } from 'react';
import { MdClose, MdCheckCircle } from 'react-icons/md';

const ApproveKYCModal = ({ isOpen, onClose, kycRecord, onApprove }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(kycRecord.userId || kycRecord.id);
      onClose();
    } catch (error) {
      console.error('Error approving KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MdClose className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <MdCheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2 font-aeonik">
          Approve KYC Verification
        </h2>

        {/* KYC Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {kycRecord?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{kycRecord?.name}</p>
              <p className="text-sm text-gray-500">{kycRecord?.email}</p>
              <p className="text-xs text-gray-400">KYC ID: {kycRecord?.kycId}</p>
            </div>
          </div>
          
          {/* Documents */}
          {kycRecord?.documents && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Submitted Documents:</p>
              <div className="flex flex-wrap gap-2">
                {kycRecord.documents.map((doc, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-700">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Message */}
        <p className="text-center text-gray-600 mb-6">
          Are you sure you want to approve this user's KYC verification? 
          This will mark the user as verified.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <MdCheckCircle className="w-5 h-5" />
                Approve KYC
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveKYCModal;
