import { useState } from "react";
import { Input } from "@/Components/ui/input";
import { Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/Components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/productionClient";
import ToolCategoryCard from "./ToolCategoryCard";

export default function ToolsTab({ isAdmin }) {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const queryClient = useQueryClient();
  const [hasError, setHasError] = useState(false);

  // Admin permission checks
  const canManageTools = isAdmin;

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
    (cat) => cat.is_visible && (!search || cat.name.toLowerCase().includes(search.toLowerCase()))
  );

  // If the search matches a category name, include that category's id so tools
  // inside that category will still be shown even if their name/url doesn't
  // directly match the search text.
  const lowerSearch = search.toLowerCase();
  const matchedCategoryIds = new Set(
    categories
      .filter((cat) => search && cat.name.toLowerCase().includes(lowerSearch))
      .map((c) => c._id)
  );

  // visible categories based on selected pills (if none selected, show all)
  const visibleCategories = selectedCategories.size
    ? filteredCategories.filter((c) => selectedCategories.has(c._id))
    : filteredCategories;

  const filteredTools = tools.filter(
    (tool) => {
      // First check if the tool matches search query
      const matchesSearch = !search || 
        tool.name.toLowerCase().includes(lowerSearch) ||
        tool.url?.toLowerCase().includes(lowerSearch) ||
        // Also consider tools whose category name matches the search
        matchedCategoryIds.has(tool.category_id?._id ?? tool.category_id);

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
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3 sm:p-6 lg:p-8 overflow-x-auto">
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
          <div className="flex items-center justify-between gap-2 min-w-max md:min-w-0">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg sm:text-xl lg:text-2xl font-normal text-foreground"
            >
              Tools
            </motion.h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategories(new Set())}
                className="text-xs sm:text-sm"
              >
                Clear All
              </Button>
              <div className="flex items-center gap-1 sm:gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="border-gray-300 rounded-none text-xs sm:text-sm w-24 sm:w-48"
                />
                <button
                  onClick={() => { /* noop - filtering is live */ }}
                  className="px-2 sm:px-3 py-2 bg-[#41436A] text-white rounded flex-shrink-0"
                  title="Search tools"
                >
                  <Search className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Category pills */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 flex-wrap overflow-x-auto pb-2 sm:pb-0"
          >
            {filteredCategories.map((cat) => {
              const checked = selectedCategories.has(cat._id);
              return (
                <motion.label
                  key={cat._id}
                  layout
                  className={`flex items-center gap-2 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors whitespace-nowrap ${
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
                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>{cat.name}</span>
                </motion.label>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-12 overflow-y-auto flex-1">
        <AnimatePresence mode="wait">
          {visibleCategories.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {visibleCategories.map((category) => {
                  const tools = toolsByCategory[category._id] || [];
                  const hiddenCount = Math.max(0, tools.length - 6);
                  const isExpanded = expandedCategories.has(category._id);
                  const visibleTools = isExpanded ? tools : tools.slice(0, 6);
                  const remainingCount = isExpanded ? hiddenCount : Math.max(0, tools.length - visibleTools.length);
                  return (
                    <motion.div 
                      key={category._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-1 bg-white rounded-lg border flex flex-col min-h-[16rem]"
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
                          {visibleTools.map((tool) => (
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
                        {hiddenCount > 0 && (
                          <div className="mt-6 flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExpandedCategories((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(category._id)) {
                                    next.delete(category._id);
                                  } else {
                                    next.add(category._id);
                                  }
                                  return next;
                                });
                              }}
                            >
                              {isExpanded ? "Hide" : `+${hiddenCount} more`}
                            </Button>
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