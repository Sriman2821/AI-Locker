import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminControls({ activeTab }) {
  // Floating admin controls have been moved into page headers where appropriate.
  // Keep this component minimal for any future floating controls.
  const [unused, setUnused] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-8 right-8 flex flex-col gap-3"
      >
        {/* Floating controls removed — management moved into page headers */}
      </motion.div>

      <AnimatePresence>
        {/* No floating modals here; page-level modals handle admin actions. */}
      </AnimatePresence>
    </>
  );
}