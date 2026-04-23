import React, { useState, useEffect } from 'react';
import { MdSearch, MdArrowBack, MdArrowForward, MdMoreVert, MdCheckCircle } from 'react-icons/md';
import { getKYCSubmissions, approveKYC, rejectKYC } from '../../../../services/adminService';
import ApproveKYCModal from './ApproveKYCModal';
import RejectKYCModal from './RejectKYCModal';
import RequestResubmissionModal from './RequestResubmissionModal';
import KYCResultModal from './KYCResultModal';

const KYCVerification = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showSelectMode, setShowSelectMode] = useState(false);
  const [kycData, setKycData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResubmissionModal, setShowResubmissionModal] = useState(false);
  const [selectedKYCRecord, setSelectedKYCRecord] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultConfig, setResultConfig] = useState({ type: 'success', title: '', message: '' });

  // Fetch KYC data from backend
  useEffect(() => {
    fetchKYCData();
  }, []);

  const fetchKYCData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getKYCSubmissions();
      console.log('KYC/Users response:', response);
      
      // Transform backend user data to KYC format
      const backendUsers = response.body || response.data || [];
      const transformedKYC = backendUsers.map((user, index) => ({
        id: user._id || user.id || index + 1,
        kycId: `KYC${(user._id || '').slice(-3).toUpperCase() || String(index + 1).padStart(3, '0')}`,
        name: user.fullName || 'Unknown User',
        email: user.emailAddress || user.email || 'N/A',
        walletId: user.userID || `LNT${String(index + 1).padStart(7, '0')}`, // Use userID (LNT format)
        role: mapUserRole(user.userType),
        documents: user.kycDocuments || ['NIN', 'Utility Bill'], // Default docs if not specified
        submitted: formatDate(user.kycSubmittedAt || user.createdAt),
        status: mapKYCStatus(user.verified, user.kycStatus),
        reviewer: user.kycReviewer || 'Pending Assignment',
        userId: user._id,
        rawVerified: user.verified,
      }));
      
      setKycData(transformedKYC);
    } catch (err) {
      console.error('Error fetching KYC data:', err);
      setError('Failed to load KYC data. Please try again.');
      setKycData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const mapUserRole = (userType) => {
    const roleMap = {
      'GUEST': 'Guests',
      'HOST': 'Host',
      'ADMIN': 'Admin',
    };
    return roleMap[userType] || 'Guests';
  };

  const mapKYCStatus = (verified, kycStatus) => {
    // Map backend status to display format
    if (kycStatus) {
      const statusMap = {
        'NONE': 'Pending',
        'PENDING': 'Pending',
        'APPROVED': 'Approved',
        'VERIFIED': 'Approved',
        'REJECTED': 'Rejected',
        'RESUBMISSION': 'Resubmission',
      };
      return statusMap[kycStatus] || kycStatus;
    }
    // Fallback to verified flag
    if (verified === true) return 'Approved';
    if (verified === false) return 'Pending';
    return 'Pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Resubmission':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const handleSelectAll = () => {
    let newSelected;
    if (selectedRows.size === paginatedKYC.length) {
      newSelected = new Set();
    } else {
      newSelected = new Set(paginatedKYC.map(k => k.id));
    }
    setSelectedRows(newSelected);
  };

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle KYC actions
  const handleApproveKYC = async (userId) => {
    try {
      await approveKYC(userId);
      await fetchKYCData();
      setOpenMenuId(null);
      setResultConfig({
        type: 'success',
        title: 'KYC Approved',
        message: 'The user has been successfully verified and notified.'
      });
      setShowResultModal(true);
    } catch (err) {
      console.error('Error approving KYC:', err);
      setResultConfig({
        type: 'error',
        title: 'Approval Failed',
        message: err.message || 'There was an error approving this KYC verification.'
      });
      setShowResultModal(true);
    }
  };

  const handleRejectKYC = async (userId, reason) => {
    try {
      await rejectKYC(userId, reason);
      await fetchKYCData();
      setOpenMenuId(null);
      setResultConfig({
        type: 'success',
        title: 'KYC Rejected',
        message: 'Verification has been rejected and the user has been notified.'
      });
      setShowResultModal(true);
    } catch (err) {
      console.error('Error rejecting KYC:', err);
      setResultConfig({
        type: 'error',
        title: 'Rejection Failed',
        message: err.message || 'There was an error rejecting this KYC verification.'
      });
      setShowResultModal(true);
    }
  };

  const handleRequestResubmission = async (userId, data) => {
    try {
      // For now, we'll mark it as needing resubmission using reject with specific reason
      await rejectKYC(userId, `Resubmission requested: ${data.documents.join(', ')}. Notes: ${data.notes}`);
      await fetchKYCData();
    } catch (err) {
      console.error('Error requesting resubmission:', err);
    }
  };

  // Modal handlers
  const openApproveModal = (kyc) => {
    setSelectedKYCRecord(kyc);
    setShowApproveModal(true);
    setOpenMenuId(null);
  };

  const openRejectModal = (kyc) => {
    setSelectedKYCRecord(kyc);
    setShowRejectModal(true);
    setOpenMenuId(null);
  };

  const openResubmissionModal = (kyc) => {
    setSelectedKYCRecord(kyc);
    setShowResubmissionModal(true);
    setOpenMenuId(null);
  };

  const filteredKYC = kycData.filter(kyc => {
    // Filter by tab (status)
    let statusMatch = true;
    if (activeTab === 'pending') {
      statusMatch = kyc.status === 'Pending';
    } else if (activeTab === 'approved') {
      statusMatch = kyc.status === 'Approved';
    } else if (activeTab === 'rejected') {
      statusMatch = kyc.status === 'Rejected';
    } else if (activeTab === 'resubmissions') {
      statusMatch = kyc.status === 'Resubmission';
    }
    // Tab 'all' shows all KYC records

    // Filter by search query
    const searchMatch =
      kyc.kycId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kyc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kyc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kyc.walletId.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredKYC.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedKYC = filteredKYC.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="w-full max-w-[1428px] h-auto relative bg-white rounded-lg flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-aeonik">Loading KYC data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1428px] h-auto relative bg-white rounded-lg">
      {/* Header - Tabs */}
      <div className="w-full p-2.5 bg-gray-50 rounded-[10px] inline-flex justify-start items-start gap-5 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'resubmissions', label: 'Resubmissions' },
          { id: 'all', label: 'All KYC Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-3 py-2.5 rounded-[10px] flex justify-center items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900'
                : 'hover:bg-gray-100'
            }`}
          >
            <span
              className={`text-sm font-medium font-aeonik leading-4 ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-zinc-700'
              }`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="w-full p-2.5 bg-white rounded-[10px] outline outline-[0.40px] outline-zinc-400 flex flex-col justify-start items-center gap-2.5 mt-5">
        {/* Search and Filter Bar */}
        <div className="w-full inline-flex justify-between items-center px-7 py-3">
          {/* Search Input */}
          <div className="w-96 h-10 px-4 py-2 bg-gray-50 rounded-[30px] flex justify-start items-center gap-2.5">
            <MdSearch className="w-5 h-5 text-slate-900" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Enter User ID or Submission Ref..."
              className="flex-1 bg-transparent text-slate-400 text-sm font-medium font-inter placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Select Button */}
          <button 
            onClick={() => {
              setShowSelectMode(!showSelectMode);
              if (showSelectMode) {
                setSelectedRows(new Set());
              }
            }}
            className={`px-7 py-2 rounded-3xl flex justify-center items-center gap-1 transition-colors cursor-pointer ${
              showSelectMode
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-indigo-50 text-slate-900 hover:bg-indigo-100'
            }`}
          >
            {selectedRows.size > 0 && <MdCheckCircle className="w-4 h-4 text-white" />}
            <div className={`w-5 h-5 p-0.5 rounded text-white text-[8px] font-medium flex items-center justify-center flex-shrink-0 ${selectedRows.size > 0 ? 'bg-orange-600' : 'bg-gray-400'}`}>{selectedRows.size}</div>
            <span className={`text-[10px] font-semibold font-aeonik leading-4 ${showSelectMode ? 'text-white' : 'text-slate-900'}`}>{selectedRows.size > 0 ? 'Selected' : 'Select'}</span>
          </button>
        </div>

        {/* Table Header */}
        <div className="w-full px-7 py-3.5 bg-sky-100 border-b-[0.40px] border-zinc-400 inline-flex justify-between items-center gap-3">
          {showSelectMode && (
            <div 
              className="w-6 h-6 flex-shrink-0 flex items-center justify-center cursor-pointer border-2 border-zinc-300 rounded"
              onClick={handleSelectAll}
            >
              {selectedRows.size === paginatedKYC.length && selectedRows.size > 0 && <MdCheckCircle className="w-5 h-5 text-indigo-600" />}
            </div>
          )}
          <div className="w-36 opacity-90 text-neutral-800 text-base font-bold font-aeonik flex-shrink-0">KYC ID</div>
          <div className="w-36 opacity-90 text-neutral-800 text-base font-bold font-aeonik flex-shrink-0">User Details</div>
          <div className="w-36 opacity-90 text-neutral-800 text-base font-bold font-aeonik flex-shrink-0">Role</div>
          <div className="w-36 opacity-90 text-neutral-800 text-base font-bold font-aeonik flex-shrink-0">Documents</div>
          <div className="w-36 opacity-90 text-neutral-800 text-base font-bold font-aeonik flex-shrink-0">Submitted</div>
          <div className="w-36 opacity-90 text-neutral-800 text-base font-bold font-aeonik flex-shrink-0">Status</div>
          <div className="w-36 opacity-90 text-neutral-800 text-base font-bold font-aeonik flex-shrink-0">Reviewer</div>
          <div className="w-12 opacity-90 text-neutral-800 text-base font-bold font-aeonik flex-shrink-0">Actions</div>
        </div>

        {/* Table Rows */}
        <div className="w-full flex flex-col">
          {paginatedKYC.map((kyc) => (
            <div
              key={kyc.id}
              className="w-full px-7 py-3.5 border-b-[0.40px] border-stone-300 inline-flex justify-between items-center hover:bg-gray-50 transition-colors gap-3"
            >
              {/* Checkbox */}
              {showSelectMode && (
                <div 
                  className="w-6 h-6 flex-shrink-0 flex items-center justify-center cursor-pointer border-2 border-zinc-300 rounded"
                  onClick={() => handleSelectRow(kyc.id)}
                >
                  {selectedRows.has(kyc.id) && <MdCheckCircle className="w-5 h-5 text-indigo-600" />}
                </div>
              )}

              {/* KYC ID */}
              <div className="w-36 opacity-90 text-neutral-800 text-sm font-medium font-aeonik flex-shrink-0">
                {kyc.kycId}
              </div>

              {/* User Details */}
              <div className="w-36 inline-flex flex-col justify-center items-start gap-2.5 flex-shrink-0">
                <div className="opacity-90 text-black text-base font-semibold font-aeonik line-clamp-1">
                  {kyc.name}
                </div>
                <div className="opacity-90 text-neutral-800 text-sm font-medium font-aeonik line-clamp-1">
                  {kyc.email}
                </div>
                <div className="opacity-90 text-neutral-800 text-sm font-medium font-aeonik line-clamp-1">
                  ID: {kyc.walletId}
                </div>
              </div>

              {/* Role */}
              <div className="w-36 h-6 relative flex-shrink-0">
                <div className="px-4 py-[5px] rounded-[20px] outline outline-1 outline-offset-[-1px] outline-black inline-flex justify-center items-center">
                  <span className="text-black text-xs font-medium font-inter">{kyc.role}</span>
                </div>
              </div>

              {/* Documents */}
              <div className="w-36 flex justify-start items-start gap-2.5 flex-wrap content-start flex-shrink-0">
                {kyc.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="px-4 py-[5px] bg-neutral-100 rounded-[20px] outline outline-1 outline-offset-[-1px] outline-stone-500 flex justify-center items-center"
                  >
                    <span className="text-zinc-800 text-xs font-medium font-aeonik">{doc}</span>
                  </div>
                ))}
              </div>

              {/* Submitted */}
              <div className="w-36 opacity-90 text-neutral-800 text-sm font-medium font-aeonik whitespace-nowrap flex-shrink-0">
                {kyc.submitted}
              </div>

              {/* Status */}
              <div className="w-36 h-6 relative flex-shrink-0">
                <div className={`px-4 py-[5px] rounded-[20px] inline-flex justify-center items-center ${getStatusColor(kyc.status)}`}>
                  <span className="text-xs font-medium font-inter">{kyc.status}</span>
                </div>
              </div>

              {/* Reviewer */}
              <div className="w-36 opacity-90 text-neutral-800 text-sm font-medium font-aeonik underline cursor-pointer hover:text-slate-700 flex-shrink-0">
                {kyc.reviewer}
              </div>

              {/* Actions */}
              <div className="w-36 flex justify-start items-center gap-2 flex-shrink-0">
                {kyc.status === 'Pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openApproveModal(kyc)}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors border border-green-200 cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(kyc)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === kyc.id ? null : kyc.id)}
                        className="p-1 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <MdMoreVert className="w-4 h-4 text-slate-900" />
                      </button>
                      
                      {openMenuId === kyc.id && (
                        <div className="absolute top-8 right-0 bg-white rounded-lg shadow-xl z-50 w-32 py-1">
                          <button
                            onClick={() => { setOpenMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === kyc.id ? null : kyc.id)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Options
                      <MdMoreVert className="w-3 h-3" />
                    </button>
                    
                    {openMenuId === kyc.id && (
                      <div className="absolute top-8 right-0 bg-white rounded-lg shadow-xl z-50 w-40 py-1">
                        <button
                          onClick={() => { setOpenMenuId(null); }}
                          className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                        >
                          Full Details
                        </button>
                        {kyc.status !== 'Approved' && (
                          <button
                            onClick={() => openApproveModal(kyc)}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-green-600 hover:bg-green-50 transition-colors border-b border-slate-100"
                          >
                            Approve KYC
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {paginatedKYC.length === 0 && (
          <div className="w-full py-12 flex flex-col justify-center items-center gap-4">
            <p className="text-neutral-500 text-base font-medium font-aeonik">No KYC records found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="w-full mt-5 px-7 py-4 inline-flex justify-between items-center">
        <div className="text-sm text-neutral-600 font-medium">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredKYC.length)} of {filteredKYC.length} records
        </div>
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 text-neutral-600 text-sm font-semibold hover:text-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <MdArrowBack className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-neutral-600 text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 text-neutral-600 text-sm font-semibold hover:text-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Next
            <MdArrowForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KYC Modals */}
      <ApproveKYCModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedKYCRecord(null);
        }}
        kycRecord={selectedKYCRecord}
        onApprove={handleApproveKYC}
      />

      <RejectKYCModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedKYCRecord(null);
        }}
        kycRecord={selectedKYCRecord}
        onReject={handleRejectKYC}
      />

      <RequestResubmissionModal
        isOpen={showResubmissionModal}
        onClose={() => {
          setShowResubmissionModal(false);
          setSelectedKYCRecord(null);
        }}
        kycRecord={selectedKYCRecord}
        onRequestResubmission={handleRequestResubmission}
      />

      <KYCResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        type={resultConfig.type}
        title={resultConfig.title}
        message={resultConfig.message}
      />
    </div>
  );
};

export default KYCVerification;
