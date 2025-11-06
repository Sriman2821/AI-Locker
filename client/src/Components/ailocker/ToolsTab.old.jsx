import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/productionClient";
import ToolCategoryCard from "./ToolCategoryCard";

export default function ToolsTab({ isAdmin, searchQuery }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["toolCategories"],
    queryFn: () => base44.entities.ToolCategory.list(),
  });

  const { data: tools = [], isLoading: loadingTools } = useQuery({
    queryKey: ["tools", selectedCategory],
    queryFn: () => base44.entities.Tool.list(selectedCategory),
  });

  const filteredCategories = categories.filter((cat) => 
    cat.is_visible && (!searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredTools = tools.filter((tool) =>
    !searchQuery || 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.url?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const toolsByCategory = filteredCategories.reduce((acc, category) => {
    acc[category._id] = filteredTools.filter(
      (tool) => tool.category_id === category._id
    );
    return acc;
  }, {});

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
          <h2 className="text-2xl font-semibold text-foreground">Tools</h2>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => {/* Implement manage tools modal */}}
            >
              Manage Tools
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <ToolCategoryCard
              key={category._id}
              category={category}
              tools={toolsByCategory[category._id] || []}
            />
          ))}
        </div>
      </div>
    </div>
          ))}
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