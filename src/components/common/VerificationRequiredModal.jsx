import React from 'react';
import { MdClose, MdSecurity, MdArrowForward, MdCheckCircle } from 'react-icons/md';

/**
 * VerificationRequiredModal (Web/Admin Version)
 * A premium, glassmorphism-inspired modal for identity verification requirements.
 */
const VerificationRequiredModal = ({ isOpen, onClose, onVerify }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
        {/* Header Visual */}
        <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative">
          <div className="absolute top-4 right-4">
            <button 
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            >
              <MdClose size={20} />
            </button>
          </div>
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-blue-600">
            <MdSecurity size={48} />
          </div>
        </div>

        {/* Body */}
        <div className="p-8 text-center pt-10">
          <h3 className="text-2xl font-bold font-aeonik text-slate-900 mb-3">
            Identity Verification Required
          </h3>
          <p className="text-slate-600 font-inter mb-8 leading-relaxed text-sm">
            To maintain the safety and integrity of the Lunest community, 
            we require all hosts to verify their identity before submitting listings.
          </p>

          {/* Value Props */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl text-left border border-slate-100">
              <MdCheckCircle className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-slate-700 text-xs font-medium font-inter">Verified host badge on your listings</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl text-left border border-slate-100">
              <MdCheckCircle className="text-green-500 flex-shrink-0" size={20} />
              <span className="text-slate-700 text-xs font-medium font-inter">Access to instant rental payouts</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onVerify}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold font-aeonik flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
            >
              Verify My Identity
              <MdArrowForward size={20} />
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-slate-500 hover:text-slate-700 font-semibold font-aeonik transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>

        {/* Footer Accent */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      </div>
    </div>
  );
};

export default VerificationRequiredModal;
