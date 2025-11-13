import { useState } from "react";
import { Plus, FolderCog } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ManageToolsModal from "./ManageToolsModal";
import AddSourceCodeModal from "./AddSourceCodeModal";

export default function AdminControls({ activeTab }) {
  const [showManageTools, setShowManageTools] = useState(false);
  const [showAddSourceCode, setShowAddSourceCode] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-8 right-8 flex flex-col gap-3"
      >
        {activeTab === "tools" && (
          <button
            onClick={() => setShowManageTools(true)}
            className="w-12 h-12 bg-[#41436A] text-white transition-all flex items-center justify-center"
            title="Manage Tools & Categories"
          >
            <FolderCog className="w-5 h-5" strokeWidth={1.5} />
          </button>
        )}

        {activeTab === "sourcecode" && (
          <button
            onClick={() => setShowAddSourceCode(true)}
            className="w-12 h-12 bg-[#41436A] text-white transition-all flex items-center justify-center"
            title="Add Repository"
          >
            <Plus className="w-5 h-5" strokeWidth={1.5} />
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {showManageTools && (
          <ManageToolsModal onClose={() => setShowManageTools(false)} />
        )}
        {showAddSourceCode && (
          <AddSourceCodeModal onClose={() => setShowAddSourceCode(false)} />
        )}
      </AnimatePresence>
    </>
  );
}