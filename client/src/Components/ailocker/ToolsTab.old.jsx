import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X } from "lucide-react";

/**
 * Props:
 * - categoryName: string
 * - tools: Array<{ id, name, icon?, url }>
 *
 * Example:
 * <ToolCategoryCard categoryName="Design Tools" tools={toolList} />
 */

export default function ToolCategoryCard({ categoryName, tools = [] }) {
  const [showModal, setShowModal] = useState(false);

  // Show first 6 tools by default
  const visibleTools = tools.slice(0, 6);
  const hasMoreTools = tools.length > 6;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 transition hover:shadow-lg">
      {/* Category Name */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {categoryName}
      </h2>

      {/* Tools Grid (first 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {visibleTools.map((tool) => (
          <a
            key={tool.id}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition group"
          >
            {tool.icon ? (
              <img
                src={tool.icon}
                alt={tool.name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm">
                {tool.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-800 font-medium group-hover:text-[#984063] transition">
              {tool.name}
            </span>
            <ExternalLink
              className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[#984063]"
              strokeWidth={1.5}
            />
          </a>
        ))}
      </div>

      {/* View All Button */}
      {hasMoreTools && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => setShowModal(true)}
            className="text-sm px-4 py-2 bg-[#984063] text-white rounded-full hover:bg-[#984063]/90 transition"
          >
            View All Tools
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Modal Content */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {categoryName}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Scrollable Grid */}
              <div className="overflow-y-auto pr-2 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {tools.map((tool) => (
                    <a
                      key={tool.id}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition group"
                    >
                      {tool.icon ? (
                        <img
                          src={tool.icon}
                          alt={tool.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm">
                          {tool.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-gray-800 font-medium group-hover:text-[#984063] transition">
                        {tool.name}
                      </span>
                      <ExternalLink
                        className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[#984063]"
                        strokeWidth={1.5}
                      />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
