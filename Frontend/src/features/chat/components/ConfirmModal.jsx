import React from "react";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#0c0d0d]/80 backdrop-blur-[3px] z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#191a1a] border border-[#2d3131] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon & Title Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 text-red-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-white tracking-tight">{title || "Delete Thread"}</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              {message || "Are you sure you want to delete this thread? This action is permanent and cannot be undone."}
            </p>
          </div>
        </div>

        {/* Action Buttons Tray */}
        <div className="flex items-center justify-end gap-2.5 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-[#131415] hover:bg-[#202222] border border-[#2d3131] transition text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-white bg-red-500/15 hover:bg-red-500 border border-red-500/25 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 transition duration-150 text-xs font-bold cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
