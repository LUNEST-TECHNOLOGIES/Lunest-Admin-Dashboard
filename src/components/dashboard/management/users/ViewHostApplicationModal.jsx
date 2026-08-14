import React, { useState, useEffect } from 'react';
import { MdClose, MdHome, MdLocationOn, MdPerson, MdEmail, MdCalendarToday, MdDescription, MdImage, MdBadge } from 'react-icons/md';
import { getHostApplication } from '../../../../services/adminService';
import { resolveImageUrl, normalizeArray } from '../../../../utils/imageUtils';

const ViewHostApplicationModal = ({ isOpen, onClose, user, onApprove, onReject }) => {
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchApplicationData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHostApplication(user.id);
      const appData = response.body || response.data || response;
      setApplicationData(appData);
    } catch (err) {
      console.error('Error fetching host application:', err);
      setError('Failed to load application data');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchApplicationData();
    }
  }, [isOpen, user?.id, fetchApplicationData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Host Application Details</h2>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-slate-500 text-sm font-medium">Review application for verification</p>
               <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(applicationData?.applicationStatus || 'PENDING')}`}>
                 {applicationData?.applicationStatus || 'PENDING'}
               </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer border border-slate-100 shadow-sm"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Applicant Quick Overview */}
        <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center p-0.5 overflow-hidden shadow-sm">
                {user?.avatar ? (
                    <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                    <MdPerson className="w-7 h-7 text-slate-200" />
                )}
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">{user?.name || applicationData?.fullName}</p>
              <p className="text-xs text-slate-500 font-medium">{user?.email || applicationData?.email}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KYC NIN (Masked)</p>
             <p className="text-sm font-black text-indigo-600 tracking-tight">
               {applicationData?.applicationData?.maskedNin || applicationData?.maskedNin || 'NOT PROVIDED'}
             </p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
               KYC: {applicationData?.applicationData?.kycStatus || applicationData?.kycStatus || 'UNKNOWN'}
             </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-slate-500 font-bold text-sm">Validating background data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-rose-600 font-bold">{error}</p>
              <button
                onClick={fetchApplicationData}
                className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Retry Request
              </button>
            </div>
          ) : (
            <>
              {/* Applicant Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/50 pb-3 mb-4">
                      <MdPerson className="w-4 h-4 text-indigo-500" />
                      Legal Identification
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                        <p className="text-slate-900 font-bold text-sm">{applicationData?.fullName || user?.name || 'N/A'}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Contact</p>
                          <p className="text-slate-900 font-bold text-sm tracking-tight">
                            {applicationData?.applicationData?.phone || applicationData?.phone || user?.phone || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Biological Gender</p>
                          <p className="text-slate-900 font-bold text-sm capitalize">
                            {(applicationData?.gender || applicationData?.applicationData?.gender || user?.gender)?.toLowerCase() || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(applicationData?.applicationData?.propertyLocation || applicationData?.propertyLocation) && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/50 pb-3">
                      <MdLocationOn className="w-4 h-4 text-indigo-500" />
                      Property Deployment
                    </h3>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Proposed Location</p>
                      <p className="text-slate-900 font-bold text-sm">
                        {applicationData?.applicationData?.propertyLocation || applicationData?.propertyLocation}
                      </p>
                    </div>
                  </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 h-full">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/50 pb-3 mb-4">
                    <MdHome className="w-4 h-4 text-indigo-500" />
                    Portfolio details
                  </h3>
                  
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Interest Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                           const types = normalizeArray(applicationData?.applicationData?.propertyTypes || applicationData?.propertyTypes);
                           return types.length > 0 ? (
                             types.map((type, idx) => (
                               <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                                 {type}
                               </span>
                             ))
                           ) : (
                             <span className="text-slate-400 font-bold text-xs italic">No types specified</span>
                           );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                       {(() => {
                           const appData = applicationData?.applicationData || {};
                           const hostRole = appData.hostRole || 'landlord';
                           const companyName = appData.companyName;
                           const propertyCount = appData.numberOfProperties;
                           const occupied = appData.propertyOccupied ?? applicationData?.propertyOccupied;
                           
                           const getRoleLabel = (role) => {
                             if (role === 'landlord') return 'Landlord';
                             if (role === 'manager') return 'Property Manager';
                             if (role === 'realtor') return 'Developer / Realtor';
                             return 'Host';
                           };

                           return (
                             <>
                               <div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Host Identity</p>
                                 <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-indigo-50 text-indigo-700 border-indigo-100`}>
                                    {getRoleLabel(hostRole)}
                                 </span>
                               </div>
                               <div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio Size</p>
                                 <span className="text-slate-900 font-bold text-xs">
                                    {propertyCount || '1+'} Properties
                                 </span>
                               </div>
                               {companyName && (
                                 <div className="col-span-2">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Affiliated Company</p>
                                   <p className="text-slate-900 font-bold text-sm tracking-tight">{companyName}</p>
                                 </div>
                               )}
                               <div className="col-span-2 pt-1">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Occupancy Status</p>
                                 <span className="text-slate-900 font-bold text-xs flex items-center gap-1">
                                    {occupied ? 'Currently Occupied' : 'Vacant / Ready to Host'}
                                 </span>
                               </div>
                             </>
                           );
                       })()}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Application Submitted</p>
                      <p className="text-slate-900 font-bold text-xs">{formatDate(applicationData?.applicationDate || applicationData?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Images */}
              <div className="space-y-6">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Verification Evidence</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* ID Document */}
                   {(() => {
                      const idImg = applicationData?.applicationData?.validIdImage || applicationData?.validIdImage;
                      if (!idImg) return null;
                      return (
                        <div className="group space-y-3">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valid Identity Document</p>
                           <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                              <img 
                                src={resolveImageUrl(idImg)} 
                                alt="Valid ID" 
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                onClick={() => setPreviewImage(resolveImageUrl(idImg))}
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                                 <span className="text-white text-[10px] font-bold uppercase tracking-widest">ID Card Preview</span>
                                 <button className="text-white text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded backdrop-blur-sm transition-all">Expand</button>
                              </div>
                           </div>
                        </div>
                      );
                   })()}

                   {/* Landlord ID Document */}
                   {(() => {
                      const landlordId = applicationData?.applicationData?.landlordIdImage || applicationData?.landlordIdImage;
                      if (!landlordId) return null;
                      return (
                        <div className="group space-y-3">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Landlord Valid ID</p>
                           <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                              <img
                                src={resolveImageUrl(landlordId)}
                                alt="Landlord valid ID"
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                onClick={() => setPreviewImage(resolveImageUrl(landlordId))}
                              />
                           </div>
                        </div>
                      );
                   })()}

                   {/* Authorization Letter */}
                   {(() => {
                      const authLetter = applicationData?.applicationData?.authorizationLetter || applicationData?.authorizationLetter;
                      if (!authLetter) return null;
                      return (
                        <div className="group space-y-3">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Authorization Letter</p>
                           <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                              <img 
                                src={resolveImageUrl(authLetter)} 
                                alt="Authorization Letter" 
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                onClick={() => setPreviewImage(resolveImageUrl(authLetter))}
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                                 <span className="text-white text-[10px] font-bold uppercase tracking-widest">Letter Preview</span>
                                 <button className="text-white text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded backdrop-blur-sm transition-all">Expand</button>
                              </div>
                           </div>
                        </div>
                      );
                   })()}
                </div>

                {/* Property Images Grid */}
                {(() => {
                  const images = normalizeArray(applicationData?.applicationData?.propertyImages || applicationData?.propertyImages);
                  return images.length > 0 ? (
                    <div className="space-y-4 pt-4">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Portfolio Images ({images.length})</p>
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {images.map((img, idx) => (
                             <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm group">
                                <img 
                                  src={resolveImageUrl(img)} 
                                  alt={`Prop ${idx}`} 
                                  className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500"
                                  onClick={() => setPreviewImage(resolveImageUrl(img))}
                                />
                             </div>
                          ))}
                       </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Rejection Reason */}
              {applicationData?.rejectionReason && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 mt-4">
                  <h3 className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MdDescription className="w-4 h-4" />
                    Rejection Feedback
                  </h3>
                  <p className="text-rose-600 text-sm font-bold tracking-tight bg-white/40 p-3 rounded-lg border border-rose-200/30">
                    {applicationData.rejectionReason}
                  </p>
                </div>
              )}

              {/* Empty Data Placeholder */}
              {!applicationData?.applicationData && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center border-dashed border-slate-300">
                  <MdDescription className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold text-sm">Application details missing</p>
                  <p className="text-slate-400 text-[11px] mt-1 max-w-[300px] mx-auto">
                    This applicant joined before full application form validation was standardized.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {applicationData?.applicationStatus === 'PENDING' && (
              <>
                <button
                  onClick={onApprove}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 flex items-center gap-2 cursor-pointer"
                >
                  Confirm Approval
                </button>
                <button
                  onClick={onReject}
                  className="px-6 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all cursor-pointer"
                >
                  Decline Application
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 cursor-pointer"
          >
            Finished Review
          </button>
        </div>

        {/* Image Preview Overlay */}
        {previewImage && (
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/95 p-4 animate-in fade-in duration-300 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <button 
              className="absolute top-8 right-8 text-white bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all border border-white/10 z-[10001] cursor-pointer"
              onClick={() => setPreviewImage(null)}
            >
              <MdClose className="w-8 h-8" />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-[95%] max-h-[95%] object-contain rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewHostApplicationModal;
