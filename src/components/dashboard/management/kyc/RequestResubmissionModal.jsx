import React, { useState } from 'react';
import { MdClose, MdRefresh, MdDescription } from 'react-icons/md';

const RequestResubmissionModal = ({ isOpen, onClose, kycRecord, onRequestResubmission }) => {
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const documentTypes = [
    { id: 'id_front', label: 'ID Card (Front)', description: 'Front side of government-issued ID' },
    { id: 'id_back', label: 'ID Card (Back)', description: 'Back side of government-issued ID' },
    { id: 'selfie', label: 'Selfie with ID', description: 'Photo holding ID next to face' },
    { id: 'proof_of_address', label: 'Proof of Address', description: 'Utility bill or bank statement' },
    { id: 'passport', label: 'Passport', description: 'Valid passport photo page' },
    { id: 'drivers_license', label: "Driver's License", description: 'Valid driver\'s license' }
  ];

  const commonIssues = [
    'Image is blurry or low quality',
    'Document is partially cut off',
    'Glare obscuring important information',
    'Document appears to be expired',
    'Information does not match profile'
  ];

  if (!isOpen) return null;

  const toggleDocument = (docId) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSubmit = async () => {
    if (selectedDocuments.length === 0) {
      return;
    }
    setLoading(true);
    try {
      await onRequestResubmission(kycRecord.userId || kycRecord.id, {
        documents: selectedDocuments,
        notes: additionalNotes
      });
      setSelectedDocuments([]);
      setAdditionalNotes('');
      onClose();
    } catch (error) {
      console.error('Error requesting resubmission:', error);
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
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MdClose className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <MdRefresh className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2 font-aeonik">
          Request Document Resubmission
        </h2>
        <p className="text-center text-gray-500 mb-4 text-sm">
          Select the documents that need to be resubmitted
        </p>

        {/* KYC Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
        </div>

        {/* Document Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documents to Resubmit <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {documentTypes.map((doc) => (
              <label
                key={doc.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedDocuments.includes(doc.id)
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(doc.id)}
                  onChange={() => toggleDocument(doc.id)}
                  className="mt-1 w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MdDescription className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 text-sm">{doc.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Common Issues */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Notes (click to add):
          </label>
          <div className="flex flex-wrap gap-2">
            {commonIssues.map((issue, index) => (
              <button
                key={index}
                onClick={() => setAdditionalNotes(prev => 
                  prev ? `${prev}\n- ${issue}` : `- ${issue}`
                )}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {issue}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes for User
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Provide specific instructions or feedback for the user..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-all"
            rows={3}
          />
        </div>

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
            onClick={handleSubmit}
            disabled={loading || selectedDocuments.length === 0}
            className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MdRefresh className="w-5 h-5" />
                Send Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestResubmissionModal;
