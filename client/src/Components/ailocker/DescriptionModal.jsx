import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function DescriptionModal({ open, onClose, text, title = 'Description' }) {
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 dark:bg-black/70 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-lg rounded-lg shadow-md overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-[#41436A] text-white">
            <h3 className="text-base font-light truncate pr-4">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 font-light">{text}</p>
          </div>
          <div className="px-4 py-3 flex justify-end bg-gray-50 border-t">
            <button onClick={onClose} className="px-4 py-2 text-sm font-light border border-gray-300 hover:bg-gray-100 text-[#41436A] rounded">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
