import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/productionClient";
import ToolCategoryCard from "./ToolCategoryCard";

export default function ToolsTab({ isAdmin, searchQuery }) {
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const queryClient = useQueryClient();
  const [hasError, setHasError] = useState(false);

  // (inline create controls removed) 

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["toolCategories"],
    queryFn: () => base44.entities.ToolCategory.list(),
  });

  const { data: tools = [], isLoading: loadingTools } = useQuery({
    queryKey: ["tools"],
    queryFn: () => base44.entities.Tool.list(),
  });
  const filteredCategories = categories.filter(
    (cat) => cat.is_visible && (!searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // visible categories based on selected pills (if none selected, show all)
  const visibleCategories = selectedCategories.size
    ? filteredCategories.filter((c) => selectedCategories.has(c._id))
    : filteredCategories;

  const filteredTools = tools.filter(
    (tool) => {
      // First check if the tool matches search query
      const matchesSearch = !searchQuery || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.url?.toLowerCase().includes(searchQuery.toLowerCase());

      // Then check if its category is selected (when categories are selected)
      const toolCategoryId = tool.category_id?._id ?? tool.category_id;
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(toolCategoryId);

      return matchesSearch && matchesCategory;
    }
  );

  // Build a map of tools by category in a single pass (avoid O(n*m) filter calls)
  const toolsByCategory = {};
  filteredTools.forEach((tool) => {
    const catId = tool.category_id?._id ?? tool.category_id;
    if (!toolsByCategory[catId]) toolsByCategory[catId] = [];
    toolsByCategory[catId].push(tool);
  });

  if (loadingCategories || loadingTools) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-normal text-foreground"
          >
            Tools
          </motion.h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ids = new Set(filteredCategories.map((c) => c._id));
                setSelectedCategories(ids);
              }}
            >
              Select All
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategories(new Set())}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Category pills */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 flex-wrap"
        >
          {filteredCategories.map((cat) => {
            const checked = selectedCategories.has(cat._id);
            return (
              <motion.label
                key={cat._id}
                layout
                className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm transition-colors ${
                  checked ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setSelectedCategories((s) => {
                      const copy = new Set(s);
                      if (copy.has(cat._id)) copy.delete(cat._id);
                      else copy.add(cat._id);
                      return copy;
                    });
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>{cat.name}</span>
              </motion.label>
            );
          })}
        </motion.div>
      </div>

      <div className="p-8 space-y-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          {visibleCategories.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleCategories.map((category) => {
                const tools = toolsByCategory[category._id] || [];
                return (
                  <motion.div 
                    key={category._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-1 bg-white rounded-lg border h-64 overflow-hidden flex flex-col"
                  >
                    {/* Header strip */}
                    <div className="bg-[#3B3A5A] text-white px-6 py-4">
                      <h2 className="text-lg font-normal">{category.name}</h2>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-1">
                      {tools.length > 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-3 gap-8 items-start"
                        >
                          {tools.map((tool) => (
                            <motion.div key={tool._id} layout className="col-span-1 flex justify-center">
                              <ToolCategoryCard tool={tool} />
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="text-sm">No tools in this category</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-gray-500"
            >
              <p className="text-lg">No tools found for the selected categories.</p>
              <p className="text-sm mt-2">Try selecting different categories or clearing the search.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}