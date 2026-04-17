import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useNotification } from '../../../ui/NotificationProvider';

const AddNoteModal = ({ booking, onClose, onAddNote }) => {
  const notify = useNotification();
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddNote = () => {
    if (note.trim().length === 0) {
      notify.warning(
        'Empty Note',
        'Please add a note before submitting.'
      );
      return;
    }

    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      onAddNote({
        bookingId: booking?.id,
        note: note.trim(),
      });

      notify.success(
        'Note Added!',
        `Booking ID: ${booking?.id} - Internal note has been added successfully.`
      );

      setNote('');
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  const handleCancel = () => {
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-8">
      <div className="w-[652px] h-96 relative bg-white rounded-[20px] outline outline-1 outline-offset-[-1px] outline-black overflow-hidden shadow-lg">
        
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="w-6 h-6 left-[610px] top-[21px] absolute overflow-hidden flex items-center justify-center hover:bg-gray-100 rounded transition-colors cursor-pointer"
        >
          <MdClose className="w-3.5 h-3.5 text-black" />
        </button>

        {/* Header Content */}
        <div className="left-[99.50px] top-[26px] absolute inline-flex flex-col justify-center items-center gap-2">
          <h2 className="text-black text-lg font-bold font-aeonik">
            {(booking?.securityDepositResolution?.reason || booking?.internalNote) ? 'View Note' : 'Add a Note'}
          </h2>
          <div className="flex flex-col items-center gap-1">
            <p className="w-[453px] text-center text-slate-900 text-base font-medium font-aeonik leading-5">
              Booking Ref: <span className="font-bold">{booking?.id || booking?.referenceCode || 'N/A'}</span>
            </p>
            {booking?.securityDepositResolution?.resolvedAt && (
              <p className="text-slate-500 text-xs font-aeonik">
                Resolved on: {new Date(booking.securityDepositResolution.resolvedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Note Input / View */}
        <div className="w-[602px] h-28 left-[24px] top-[143px] absolute">
          <label className="left-[1px] top-0 absolute text-black text-sm font-semibold font-aeonik">
            {booking?.securityDepositResolution?.reason ? 'Resolution Reason' : 'Internal Staff Note'}
          </label>
          <textarea
            value={note || booking?.securityDepositResolution?.reason || booking?.internalNote || ''}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Give a reason here..."
            readOnly={!!booking?.securityDepositResolution?.reason}
            className={`w-[602px] h-20 left-0 top-[31px] absolute rounded-[10px] border-[0.50px] border-neutral-500 p-4 text-sm font-normal font-inter focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none ${!!booking?.securityDepositResolution?.reason ? 'bg-slate-50 text-slate-600 border-slate-200' : 'text-neutral-500 placeholder-neutral-500'}`}
          />
        </div>

        {/* Action Buttons */}
        <div className="w-80 left-[159px] top-[298px] absolute inline-flex justify-center items-center gap-4">
          
          {/* Cancel/Close Button */}
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className={`px-8 py-3 rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${!!booking?.securityDepositResolution?.reason ? 'bg-slate-900 outline-slate-900 hover:bg-slate-800' : 'outline-red-600 hover:bg-red-50'}`}
          >
            <span className={`${!!booking?.securityDepositResolution?.reason ? 'text-white' : 'text-red-600'} text-base font-bold font-aeonik leading-4`}>
              {!!booking?.securityDepositResolution?.reason ? 'Close' : 'Cancel'}
            </span>
          </button>

          {/* Add/Update Note Button - Hidden if viewing fixed Resolution Reason */}
          {!booking?.securityDepositResolution?.reason && (
            <button
              onClick={handleAddNote}
              disabled={isProcessing}
              className="w-36 px-2.5 py-3 bg-slate-900 rounded-3xl flex justify-center items-center gap-1 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-white text-base font-bold font-aeonik leading-4">
                {isProcessing ? 'Adding...' : (booking?.internalNote ? 'Update Note' : 'Add Note')}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;
