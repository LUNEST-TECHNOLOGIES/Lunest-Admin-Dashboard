import React, { useState } from 'react';
import { 
    MdOutlineSearch, 
    MdOutlineFilterList, 
    MdOutlineMoreVert, 
    MdOutlineInfo, 
    MdOutlineKeyboardArrowLeft, 
    MdOutlineKeyboardArrowRight,
    MdOutlineNoteAdd,
    MdOutlineWarningAmber,
    MdOutlineCheckCircleOutline,
    MdOutlineMailOutline
} from 'react-icons/md';
import { useNotification } from '../../../ui/NotificationProvider';
import { getBookings, resolveCautionFee, updateBookingInternalNote } from '../../../../services/adminService';

const DisputesReports = () => {
    const notify = useNotification();
    const [activeTab, setActiveTab] = useState('Pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isPriorityFilterOpen, setIsPriorityFilterOpen] = useState(false);
    const [selectedPriority, setSelectedPriority] = useState('All');
    
    // Data State
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // Modal State
    const [escalateModalData, setEscalateModalData] = useState(null);
    const [escalateReason, setEscalateReason] = useState('');
    
    const [noteModalData, setNoteModalData] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [disputeNotes, setDisputeNotes] = useState({});

    const [resolveModalData, setResolveModalData] = useState(null);
    const [resolveReason, setResolveReason] = useState('');
    const [resolutionAction, setResolutionAction] = useState('RELEASE_TO_GUEST');
    const [isResolving, setIsResolving] = useState(false);

    const tabs = ['All Disputes', 'Pending', 'Resolved', 'User Reports', 'Property Reports'];

    // Fetch disputes from backend
    React.useEffect(() => {
        const fetchDisputes = async () => {
            try {
                setLoading(true);
                // Fetch bookings with disputed caution fee
                // Use $or to check both securityDepositResolution.status and booking status for backward compatibility
                let filters = {};
                if (activeTab === 'Pending') {
                    filters['$or'] = [
                        { 'securityDepositResolution.status': 'DISPUTED' },
                        { 'status': 'DISPUTED' },
                        { 'disputeRaised': true }
                    ];
                } else if (activeTab === 'Resolved') {
                    filters['$or'] = [
                        { 'securityDepositResolution.status': { $in: ['RELEASED_TO_GUEST', 'RELEASED_TO_HOST', 'RESOLVED_BY_ADMIN'] } },
                        { 'resolutionStatus': { $in: ['RESOLVED', 'RESOLVED_BY_ADMIN'] } }
                    ];
                } else if (activeTab === 'All Disputes') {
                    filters['$or'] = [
                        { 'securityDepositResolution.status': { $in: ['DISPUTED', 'RELEASED_TO_GUEST', 'RELEASED_TO_HOST', 'RESOLVED_BY_ADMIN'] } },
                        { 'status': 'DISPUTED' },
                        { 'resolutionStatus': { $in: ['RESOLVED', 'RESOLVED_BY_ADMIN'] } },
                        { 'disputeRaised': true }
                    ];
                }

                const response = await getBookings(filters);
                if (response.success) {
                    const notesMap = {};
                    const formattedDisputes = response.body.map(booking => {
                        if (booking.internalNote) {
                            notesMap[booking._id] = booking.internalNote;
                        }

                        const resolutionNote = booking.securityDepositResolution?.reason || booking.disputeReason;
                        // Fallback to booking.status if securityDepositResolution.status is not set
                        const resolutionStatus = booking.securityDepositResolution?.status || (booking.status === 'DISPUTED' ? 'DISPUTED' : null) || booking.resolutionStatus;
                        const resolutionDetail = resolutionStatus === 'RELEASED_TO_GUEST' 
                            ? 'Released to Guest' 
                            : resolutionStatus === 'RELEASED_TO_HOST' 
                                ? 'Released to Host' 
                                : resolutionStatus === 'RESOLVED_BY_ADMIN' 
                                    ? 'Resolved by Admin' 
                                    : '';
                        const resolutionDate = booking.securityDepositResolution?.resolvedAt 
                            ? new Date(booking.securityDepositResolution.resolvedAt).toLocaleDateString()
                            : booking.resolvedAt 
                                ? new Date(booking.resolvedAt).toLocaleDateString()
                                : booking.disputedAt 
                                    ? new Date(booking.disputedAt).toLocaleDateString()
                                    : new Date(booking.updatedAt).toLocaleDateString();
                        
                        // Combine for a richer description in the 'Resolved' tab
                        const fullDescription = resolutionDetail 
                            ? `Status: ${resolutionDetail}. Note: ${resolutionNote || 'No reason provided'}`
                            : (resolutionNote || 'Security deposit disputed by guest/host');

                        const displayStatus = (resolutionStatus === 'DISPUTED' || resolutionStatus === 'PENDING') ? 'Pending' : (resolutionDetail || 'In Progress');

                        return {
                            id: booking._id,
                            refCode: booking.referenceCode,
                            details: 'Caution Fee Dispute',
                            description: fullDescription,
                            disputeDate: resolutionDate,
                            resolutionNote: resolutionNote,
                            plaintiff: { 
                                name: booking.bookedBy?.fullName || 'N/A', 
                                email: booking.bookedBy?.emailAddress || 'N/A', 
                                id: booking.bookedBy?._id || booking.bookedBy 
                            },
                            defendant: { 
                                name: booking.listing?.host?.fullName || 'N/A', 
                                email: booking.listing?.host?.emailAddress || 'N/A', 
                                id: booking.listing?.host?._id || booking.listing?.host 
                            },
                            amount: `₦${(booking.pricingBreakdown?.securityDeposit || 0).toLocaleString()}`,
                            priority: 'High',
                            status: displayStatus,
                            bookingStatus: booking.status,
                            assignedTo: 'Admin',
                            raw: booking
                        };
                    });
                    setDisputes(formattedDisputes);
                    setDisputeNotes(notesMap);
                }
            } catch (error) {
                console.error('Failed to fetch disputes:', error);
                notify.error('Error', 'Failed to fetch disputes from backend');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'Pending' || activeTab === 'All Disputes' || activeTab === 'Resolved') {
            fetchDisputes();
        } else {
            setDisputes([]); // Other tabs not yet implemented in backend
            setLoading(false);
        }
    }, [activeTab, refreshTrigger]);

    const handleResolve = async () => {
        if (!resolveModalData) return;
        
        try {
            setIsResolving(true);
            const response = await resolveCautionFee(resolveModalData.refCode, resolutionAction, resolveReason);
            if (response.success) {
                notify.success('Resolved', `Dispute ${resolveModalData.refCode || resolveModalData.id} resolved successfully.`);
                setRefreshTrigger(prev => prev + 1);
                setResolveModalData(null);
                setResolveReason('');
            } else {
                notify.error('Resolution Failed', response.message || 'Could not resolve dispute');
            }
        } catch (error) {
            console.error('Resolution error:', error);
            notify.error('Error', 'An error occurred while resolving the dispute');
        } finally {
            setIsResolving(false);
        }
    };

    const disputesData = disputes;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50';
            case 'Medium': return 'text-amber-600 bg-amber-50';
            case 'Low': return 'text-green-600 bg-green-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Progress': return 'text-amber-600';
            case 'Resolved':
            case 'Released to Guest':
            case 'Released to Host': return 'text-green-600';
            case 'Pending': return 'text-red-500';
            default: return 'text-slate-500';
        }
    };

    const filteredDisputes = disputesData.filter(dispute => {
        const matchesSearch = searchTerm === '' || 
            dispute.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispute.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispute.plaintiff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispute.defendant.name.toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchesPriority = selectedPriority === 'All' || dispute.priority === selectedPriority;
        
        return matchesSearch && matchesPriority;
    });

    return (
        <div className="space-y-6 font-aeonik">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Disputes & Reports</h1>
                    <p className="text-slate-500">Track and resolve user disputes and property reports.</p>
                </div>
            </div>

            {/* Add/View Note Modal Overlay */}
            {noteModalData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden font-aeonik">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white relative">
                            <h2 className="text-xl font-bold text-slate-900 mx-auto w-full text-center">
                                {disputeNotes[noteModalData.id] ? 'View/Edit Note' : 'Add Note'}
                            </h2>
                            <button 
                                onClick={() => { setNoteModalData(null); setNoteText(''); }}
                                className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-8 mt-2">
                            <div className="text-center pb-2">
                                <p className="font-medium text-indigo-950 text-lg">
                                    Dispute ID: {noteModalData.id}
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-900 block">Note Details:</label>
                                <textarea 
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Type your internal note here..."
                                    className="w-full h-32 p-4 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400 font-inter shadow-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="p-8 pt-4 pb-8 flex items-center gap-6 justify-between mt-2 max-w-sm mx-auto">
                            <button 
                                onClick={() => { setNoteModalData(null); setNoteText(''); }}
                                className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-full text-base hover:bg-slate-50 transition-colors w-[145px] text-center cursor-pointer"
                            >
                                Close
                            </button>
                            <button 
                                onClick={async () => { 
                                    try {
                                        const response = await updateBookingInternalNote(noteModalData.refCode, noteText);
                                        if (response.success) {
                                            setDisputeNotes(prev => ({ ...prev, [noteModalData.id]: noteText }));
                                            notify.success('Note Saved', `Note for ${noteModalData.refCode} has been saved.`);
                                            setNoteModalData(null); 
                                            setNoteText('');
                                            setOpenMenuId(null);
                                        } else {
                                            notify.error('Save Failed', response.message || 'Could not save note');
                                        }
                                    } catch (error) {
                                        console.error('Save Note Error:', error);
                                        notify.error('Error', 'Failed to save note to backend');
                                    }
                                }}
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-full text-base hover:bg-indigo-700 transition-colors shadow-md w-[145px] text-center cursor-pointer"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Escalate Modal Overlay */}
            {escalateModalData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden font-aeonik">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white relative">
                            <h2 className="text-xl font-bold text-slate-900 mx-auto w-full text-center">Escalate Dispute</h2>
                            <button 
                                onClick={() => { setEscalateModalData(null); setEscalateReason(''); }}
                                className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-8 mt-2">
                            <div className="text-center pb-2">
                                <p className="font-medium text-indigo-950 text-lg">
                                    Dispute ID: {escalateModalData.id} - {escalateModalData.details}
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-900 block">Reason:</label>
                                <textarea 
                                    value={escalateReason}
                                    onChange={(e) => setEscalateReason(e.target.value)}
                                    placeholder="Give a reason here..."
                                    className="w-full h-28 p-4 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400 font-inter shadow-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="p-8 pt-4 pb-8 flex items-center gap-6 justify-between mt-2 max-w-sm mx-auto">
                            <button 
                                onClick={() => { setEscalateModalData(null); setEscalateReason(''); }}
                                className="px-6 py-3 border border-red-500 text-red-600 font-bold rounded-full text-base hover:bg-red-50 transition-colors w-[145px] text-center cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { 
                                    notify.success('Escalated', `Dispute ${escalateModalData.id} escalated successfully.`);
                                    setEscalateModalData(null); 
                                    setEscalateReason(''); 
                                    setOpenMenuId(null);
                                }}
                                className="px-6 py-3 bg-indigo-950 text-white font-bold rounded-full text-base hover:bg-slate-900 transition-colors shadow-md w-[145px] text-center cursor-pointer"
                            >
                                Escalate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Modal Overlay */}
            {resolveModalData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden font-aeonik">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white relative">
                            <h2 className="text-xl font-bold text-slate-900 mx-auto w-full text-center">Resolve Dispute</h2>
                            <button 
                                onClick={() => { setResolveModalData(null); setResolveReason(''); }}
                                className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-8 mt-2">
                            <div className="text-center pb-2">
                                <p className="font-medium text-indigo-950 text-lg">
                                    Dispute ID: {resolveModalData.id} - {resolveModalData.details}
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-900 block">Resolution Action:</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setResolutionAction('RELEASE_TO_GUEST')}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm ${
                                            resolutionAction === 'RELEASE_TO_GUEST'
                                                ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                        }`}
                                    >
                                        Refund to Guest
                                    </button>
                                    <button
                                        onClick={() => setResolutionAction('RELEASE_TO_HOST')}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm ${
                                            resolutionAction === 'RELEASE_TO_HOST'
                                                ? 'bg-red-50 border-red-600 text-red-700'
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                        }`}
                                    >
                                        Release to Host
                                    </button>
                                </div>
                                
                                <label className="text-sm font-bold text-slate-900 block">Resolution Notes / Reason:</label>
                                <textarea 
                                    value={resolveReason}
                                    onChange={(e) => setResolveReason(e.target.value)}
                                    placeholder="Explain the decision here..."
                                    className="w-full h-28 p-4 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400 font-inter shadow-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="p-8 pt-4 pb-8 flex items-center gap-6 justify-between mt-2 max-w-sm mx-auto">
                            <button 
                                onClick={() => { setResolveModalData(null); setResolveReason(''); }}
                                className="px-6 py-3 border border-red-500 text-red-600 font-bold rounded-full text-base hover:bg-red-50 transition-colors w-[145px] text-center cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleResolve}
                                disabled={isResolving || !resolveReason}
                                className={`px-6 py-3 bg-indigo-950 text-white font-bold rounded-full text-base hover:bg-slate-900 transition-colors shadow-md w-[145px] text-center cursor-pointer ${
                                    (isResolving || !resolveReason) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isResolving ? 'Processing...' : 'Close Dispute'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 relative overflow-visible">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 border-b border-slate-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                                activeTab === tab
                                    ? 'bg-indigo-950 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-white hover:text-indigo-900 border border-transparent hover:border-slate-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md">
                        <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Enter campaign name or user ID"
                            className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/30 border border-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button 
                            onClick={() => setIsPriorityFilterOpen(!isPriorityFilterOpen)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                                selectedPriority !== 'All' 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
                            }`}
                        >
                            <MdOutlineFilterList className="w-5 h-5" />
                            {selectedPriority !== 'All' ? `Priority: ${selectedPriority}` : 'Priority'}
                        </button>
                        
                        {/* Priority Filter Dropdown */}
                        {isPriorityFilterOpen && (
                            <div className="absolute right-0 top-12 z-50 w-48 bg-white border-2 border-slate-200 rounded-xl shadow-lg overflow-hidden py-2">
                                {['All', 'High', 'Medium', 'Low'].map((priority) => (
                                    <button
                                        key={priority}
                                        onClick={() => {
                                            setSelectedPriority(priority);
                                            setIsPriorityFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors cursor-pointer ${
                                            selectedPriority === priority 
                                            ? 'bg-slate-50 text-indigo-600' 
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        {priority === 'All' ? 'All Priorities' : priority}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-visible">
                    <table className="w-full text-left">
                        <thead className="bg-indigo-50/50 text-slate-900">
                            <tr>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Dispute Details</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Plaintiff</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Defendant</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-center">Priority</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Booking Status</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider">Assigned to</th>
                                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                             {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                            <span>Loading disputes from backend...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDisputes.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No disputes found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredDisputes.map((dispute, idx) => (
                                    <tr 
                                        key={idx} 
                                        className={`hover:bg-slate-50/80 transition-colors ${openMenuId === dispute.id ? 'relative z-50' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="space-y-1 min-w-[200px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center">
                                                        <MdOutlineInfo className="w-3.5 h-3.5 text-slate-400" />
                                                    </div>
                                                    <span className="font-bold text-slate-900">{dispute.details}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed break-words">
                                                    {dispute.description}
                                                </p>
                                                <div className="flex flex-col gap-0.5 mt-1.5 pt-1.5 border-t border-slate-50">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ref: {dispute.refCode}</p>
                                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Date: {dispute.disputeDate}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-900">{dispute.plaintiff.name}</span>
                                                <span className="text-xs text-slate-500">{dispute.plaintiff.email}</span>
                                                <span className="text-xs text-slate-500 font-medium mt-0.5">ID: {dispute.plaintiff.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-900">{dispute.defendant.name}</span>
                                                <span className="text-xs text-slate-500">{dispute.defendant.email}</span>
                                                <span className="text-xs text-slate-500 font-medium mt-0.5">ID: {dispute.defendant.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-900">{dispute.amount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${getPriorityColor(dispute.priority)}`}>
                                                <div className={`w-2 h-2 rounded-full ${dispute.priority === 'High' ? 'bg-red-600' : dispute.priority === 'Medium' ? 'bg-amber-600' : 'bg-green-600'}`} />
                                                <span className="text-xs font-bold uppercase">{dispute.priority}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                                {dispute.bookingStatus}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold ${getStatusColor(dispute.status)}`}>
                                                {dispute.status}
                                            </span>
                                        </td>
                                        <td 
                                            onClick={() => notify.success('Assignment', `Assigned to ${dispute.assignedTo}`)}
                                            className="px-6 py-4 font-medium text-slate-600 underline underline-offset-4 cursor-pointer hover:text-indigo-600 transition-colors"
                                        >
                                            {dispute.assignedTo}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button 
                                                onClick={() => setOpenMenuId(openMenuId === dispute.id ? null : dispute.id)}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                                            >
                                                <MdOutlineMoreVert className="w-5 h-5" />
                                            </button>
                                            
                                            {/* Dropdown Menu */}
                                            {openMenuId === dispute.id && (
                                                <div className="absolute right-8 top-10 z-[100] w-48 bg-white rounded-xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden py-1 animate-in fade-in zoom-in duration-100">
                                                    <button 
                                                        onClick={() => { 
                                                            setNoteText(disputeNotes[dispute.id] || '');
                                                            setNoteModalData(dispute); 
                                                            setOpenMenuId(null); 
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
                                                    >
                                                        <MdOutlineNoteAdd className="w-4 h-4" />
                                                        {(dispute.resolutionNote || disputeNotes[dispute.id]) && 
                                                         (dispute.status?.includes('RELEASED')) 
                                                         ? 'View Note' : 'Add Note'}
                                                    </button>
                                                    {dispute.status === 'Pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => { setEscalateModalData(dispute); setOpenMenuId(null); }}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors cursor-pointer"
                                                            >
                                                                <MdOutlineWarningAmber className="w-4 h-4 text-amber-500" />
                                                                Escalate
                                                            </button>
                                                            <button 
                                                                onClick={() => { setResolveModalData(dispute); setOpenMenuId(null); }}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-green-600 transition-colors cursor-pointer border-b border-slate-100 pb-3 mb-1"
                                                            >
                                                                <MdOutlineCheckCircleOutline className="w-4 h-4 text-green-500" />
                                                                Resolve Case
                                                            </button>
                                                        </>
                                                    )}
                                                    <button 
                                                        onClick={() => { notify.info('Contact', 'Contacting parties...'); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
                                                    >
                                                        <MdOutlineMailOutline className="w-4 h-4" />
                                                        Contact
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                            {/* Extra space at bottom to prevent clipping */}
                            {filteredDisputes.length > 0 && <tr className="h-40"><td colSpan="9"></td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                    <button className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                        <MdOutlineKeyboardArrowLeft className="w-5 h-5" />
                        Previous
                    </button>
                    <button className="flex items-center gap-3 px-6 py-2 bg-indigo-950 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-all shadow-md cursor-pointer">
                        Next
                        <MdOutlineKeyboardArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisputesReports;
