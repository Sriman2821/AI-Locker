import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Box } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function ToolsTab({ isAdmin, searchQuery }) {
  const [selectedCategories, setSelectedCategories] = useState(new Set());

  const { data: categories = [] } = useQuery({
    queryKey: ["toolCategories"],
    queryFn: () => base44.entities.ToolCategory.list("order"),
  });

  const { data: allTools = [] } = useQuery({
    queryKey: ["tools"],
    queryFn: () => base44.entities.Tool.list("order"),
  });

  const filteredData = useMemo(() => {
    let cats = categories;
    let tools = allTools;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tools = allTools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.url?.toLowerCase().includes(query)
      );
      const toolCategoryIds = new Set(tools.map((t) => t.category_id));
      cats = categories.filter((cat) => toolCategoryIds.has(cat.id));
    }

    return { categories: cats, tools };
  }, [categories, allTools, searchQuery]);

  const visibleCategories = filteredData.categories.filter((cat) =>
    selectedCategories.size === 0 ? cat.is_visible : selectedCategories.has(cat.id)
  );

  const handleSelectAll = () => {
    setSelectedCategories(new Set(filteredData.categories.map((c) => c.id)));
  };

  const handleClearAll = () => {
    setSelectedCategories(new Set());
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getCategoryTools = (categoryId) => {
    return filteredData.tools.filter((tool) => tool.category_id === categoryId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light text-[#41436A]">Tools</h2>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-4 py-1 text-xs border border-[#984063] text-[#984063] hover:bg-[#984063] hover:text-white transition-all font-light"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-1 text-xs border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-light"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {filteredData.categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedCategories.has(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <span className="text-xs font-light text-[#41436A]">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {visibleCategories.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="mb-4 font-light">No categories to display</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibleCategories.map((category) => {
              const tools = getCategoryTools(category.id);
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-gray-200 overflow-hidden hover:border-[#F64668] transition-all"
                >
                  <div className="bg-[#41436A] p-5 border-b border-[#41436A]/20">
                    <h3 className="text-base font-light text-white">
                      {category.name}
                    </h3>
                  </div>

                  <div className="p-6">
                    {tools.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm font-light">
                        No tools
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {tools.map((tool) => (
                          <a
                            key={tool.id}
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-10 h-10 bg-[#FE9677]/20 flex items-center justify-center group-hover:bg-[#FE9677] transition-all">
                              <Box className="w-5 h-5 text-[#984063] group-hover:text-white" strokeWidth={1.5} />
                            </div>
                            <span className="text-xs text-[#41436A] text-center font-light">
                              {tool.name}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}