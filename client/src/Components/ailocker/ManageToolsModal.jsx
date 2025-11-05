import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Edit2, Trash2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ManageToolsModal({ onClose }) {
  const [categoryForm, setCategoryForm] = useState({ name: "", order: 0 });
  const [toolForm, setToolForm] = useState({
    category_id: "",
    name: "",
    icon_name: "",
    url: "",
    order: 0,
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTool, setEditingTool] = useState(null);

  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["toolCategories"],
    queryFn: () => base44.entities.ToolCategory.list("order"),
  });

  const { data: tools = [] } = useQuery({
    queryKey: ["tools"],
    queryFn: () => base44.entities.Tool.list("order"),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.ToolCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["toolCategories"]);
      setCategoryForm({ name: "", order: 0 });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ToolCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["toolCategories"]);
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.ToolCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["toolCategories"]);
    },
  });

  const createToolMutation = useMutation({
    mutationFn: (data) => base44.entities.Tool.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tools"]);
      setToolForm({ category_id: "", name: "", icon_name: "", url: "", order: 0 });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tool.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tools"]);
      setEditingTool(null);
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: (id) => base44.entities.Tool.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["tools"]);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#41436A]/20 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#41436A] p-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-light text-white mb-1">Manage Tools & Categories</h2>
            <p className="text-white/70 text-sm font-light">
              Add, edit, and organize your tools
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 h-auto">
              <TabsTrigger 
                value="categories" 
                className="data-[state=active]:bg-[#984063] data-[state=active]:text-white font-light py-2"
              >
                Categories
              </TabsTrigger>
              <TabsTrigger 
                value="tools"
                className="data-[state=active]:bg-[#984063] data-[state=active]:text-white font-light py-2"
              >
                Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-6">
              {/* Add Category Form */}
              <div className="bg-gray-50 p-6 border border-gray-200">
                <h3 className="text-base font-normal text-[#41436A] mb-4">Add New Category</h3>
                <div className="flex gap-4">
                  <Input
                    placeholder="Category name"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    className="flex-1 border-gray-300 rounded-none focus:border-[#F64668]"
                  />
                  <Input
                    type="number"
                    placeholder="Order"
                    value={categoryForm.order}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        order: parseInt(e.target.value),
                      })
                    }
                    className="w-24 border-gray-300 rounded-none focus:border-[#F64668]"
                  />
                  <button
                    onClick={() => createCategoryMutation.mutate(categoryForm)}
                    disabled={!categoryForm.name}
                    className="px-5 py-2 bg-[#984063] text-white hover:bg-[#F64668] disabled:opacity-50 disabled:hover:bg-[#984063] transition-colors text-sm font-light flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                    Add
                  </button>
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="font-light">No categories yet</p>
                  </div>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-4 p-5 bg-white border border-gray-200 hover:border-[#F64668] transition-all"
                    >
                      {editingCategory?.id === category.id ? (
                        <>
                          <Input
                            value={editingCategory.name}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                name: e.target.value,
                              })
                            }
                            className="flex-1 border-gray-300 rounded-none focus:border-[#F64668]"
                          />
                          <Input
                            type="number"
                            value={editingCategory.order}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                order: parseInt(e.target.value),
                              })
                            }
                            className="w-24 border-gray-300 rounded-none focus:border-[#F64668]"
                          />
                          <button
                            onClick={() =>
                              updateCategoryMutation.mutate({
                                id: category.id,
                                data: editingCategory,
                              })
                            }
                            className="px-3 py-2 bg-[#984063] text-white hover:bg-[#F64668] transition-colors"
                          >
                            <Save className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="px-3 py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors"
                          >
                            <X className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 font-normal text-[#41436A]">{category.name}</span>
                          <span className="text-sm text-gray-500 font-light">
                            Order: {category.order}
                          </span>
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="px-3 py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this category?")) {
                                deleteCategoryMutation.mutate(category.id);
                              }
                            }}
                            className="px-3 py-2 border border-gray-300 text-[#F64668] hover:bg-gray-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              {/* Add Tool Form */}
              <div className="bg-gray-50 p-6 border border-gray-200">
                <h3 className="text-base font-normal text-[#41436A] mb-4">Add New Tool</h3>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={toolForm.category_id}
                    onChange={(e) =>
                      setToolForm({ ...toolForm, category_id: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 focus:border-[#F64668] focus:outline-none text-sm font-light text-[#41436A]"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Tool name"
                    value={toolForm.name}
                    onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                    className="border-gray-300 rounded-none focus:border-[#F64668]"
                  />
                  <Input
                    placeholder="Icon name (e.g., Wrench)"
                    value={toolForm.icon_name}
                    onChange={(e) =>
                      setToolForm({ ...toolForm, icon_name: e.target.value })
                    }
                    className="border-gray-300 rounded-none focus:border-[#F64668]"
                  />
                  <Input
                    placeholder="URL"
                    value={toolForm.url}
                    onChange={(e) => setToolForm({ ...toolForm, url: e.target.value })}
                    className="border-gray-300 rounded-none focus:border-[#F64668]"
                  />
                  <Input
                    type="number"
                    placeholder="Order"
                    value={toolForm.order}
                    onChange={(e) =>
                      setToolForm({ ...toolForm, order: parseInt(e.target.value) })
                    }
                    className="border-gray-300 rounded-none focus:border-[#F64668]"
                  />
                  <button
                    onClick={() => createToolMutation.mutate(toolForm)}
                    disabled={!toolForm.name || !toolForm.category_id || !toolForm.url}
                    className="px-5 py-2 bg-[#984063] text-white hover:bg-[#F64668] disabled:opacity-50 disabled:hover:bg-[#984063] transition-colors text-sm font-light flex items-center gap-2 justify-center"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                    Add Tool
                  </button>
                </div>
              </div>

              {/* Tools List */}
              <div className="space-y-3">
                {tools.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="font-light">No tools yet</p>
                  </div>
                ) : (
                  tools.map((tool) => {
                    const category = categories.find((c) => c.id === tool.category_id);
                    return (
                      <div
                        key={tool.id}
                        className="flex items-center gap-4 p-5 bg-white border border-gray-200 hover:border-[#F64668] transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-normal text-[#41436A]">{tool.name}</span>
                            {tool.icon_name && (
                              <span className="px-2 py-0.5 bg-[#FE9677]/20 text-[#984063] text-xs font-light">
                                {tool.icon_name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 font-light">
                            <span>{category?.name || "No category"}</span>
                            <a
                              href={tool.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[#F64668] transition-colors truncate"
                            >
                              {tool.url}
                            </a>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-light">
                          Order: {tool.order}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm("Delete this tool?")) {
                              deleteToolMutation.mutate(tool.id);
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 text-[#F64668] hover:bg-gray-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </motion.div>
  );
}