import { motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export default function ConfirmModal({ open, title = "Confirm", description = "", confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onClose, backdropBlur = true, overlayClosable = true, escapeClosable = true }) {
  if (!open) return null;

  useBodyScrollLock(true);

  useEffect(() => {
    if (escapeClosable) return; // only add listener when escape should be disabled
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [escapeClosable]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 ${backdropBlur ? 'backdrop-blur-sm' : ''} p-4`}
      onClick={overlayClosable ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.98 }}
        className="bg-white w-full max-w-md rounded shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#41436A] p-4 flex items-center justify-between">
          <h3 className="text-white text-lg font-light">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded">
            <X className="w-4 h-4 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6">
          {description ? <p className="text-sm text-gray-600 mb-4 font-light whitespace-pre-line break-words">{description}</p> : null}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-sm text-[#41436A] hover:bg-gray-50 transition font-light"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                if (typeof onConfirm === "function") onConfirm();
              }}
              className="px-4 py-2 bg-[#984063] text-white rounded text-sm transition font-light"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}