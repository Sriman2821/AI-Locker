import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Edit2, Trash2, Save, ChevronDown, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { base44 } from "@/api/productionClient";
import ConfirmModal from "@/Components/ui/ConfirmModal";
import AddCategoryModal from "@/Components/ailocker/AddCategoryModal";
import AddToolModal from "@/Components/ailocker/AddToolModal";
import EditCategoryModal from "@/Components/ailocker/EditCategoryModal";
import EditToolModal from "@/Components/ailocker/EditToolModal";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export default function ManageToolsModal({ onClose }) {
    useBodyScrollLock(true);
    const queryClient = useQueryClient();
    const [caps, setCaps] = useState({ add: true, edit: true, delete: true });

    // Local form state
    const [categorySearch, setCategorySearch] = useState("");
    const [toolSearch, setToolSearch] = useState("");
    const [toolCategoryFilter, setToolCategoryFilter] = useState("");

    // Control visibility of modals
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showAddToolModal, setShowAddToolModal] = useState(false);

    // Editing state
    const [editCategoryModalData, setEditCategoryModalData] = useState(null);
    const [editToolModalData, setEditToolModalData] = useState(null);

    // confirmation state for deletions (category or tool)
    const [confirmAction, setConfirmAction] = useState(null);

    // Fetch categories and tools
    const { data: categories = [] } = useQuery({
        queryKey: ["toolCategories"],
        queryFn: () => base44.entities.ToolCategory.list(),
        select: (data) => (Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : []),
    });

    const { data: tools = [] } = useQuery({
        queryKey: ["tools"],
        queryFn: () => base44.entities.Tool.list(),
        select: (data) => (Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : []),
    });

    // Mutations for categories
    const deleteCategory = useMutation({
        mutationFn: (id) => base44.entities.ToolCategory.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["toolCategories"]);
        },
    });

    // Mutations for tools
    const deleteTool = useMutation({
        mutationFn: (id) => base44.entities.Tool.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["tools"]);
        },
    });

    // helpers

    // Load current user's tool capabilities (global permissions)
    React.useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const me = await base44.auth.me();
                const perms = me?.permissions;
                if (!cancelled) {
                    if (perms && typeof perms === 'object') {
                        // Global permissions
                        setCaps({ add: !!perms.add, edit: !!perms.edit, delete: !!perms.delete });
                    } else {
                        // No granular perms => full access
                        setCaps({ add: true, edit: true, delete: true });
                    }
                }
            } catch {
                if (!cancelled) setCaps({ add: true, edit: true, delete: true });
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);









    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="bg-background w-[1100px] h-[720px] overflow-hidden flex flex-col rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-3 bg-[#41436A] text-white">
                        <div>
                            <h3 className="text-lg font-medium">Manage Categories & Tools</h3>
                            <p className="text-sm text-white/80">Create, edit, and delete categories and tools</p>
                        </div>
                        <button onClick={onClose} className="p-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8 overflow-auto flex-1">
                        <Tabs defaultValue="categories" className="w-full">
                            <TabsList className="h-12 items-center justify-center text-muted-foreground grid grid-cols-2 gap-2 mb-3 bg-gray-100 p-1 rounded">
                                <TabsTrigger value="categories" className="data-[state=active]:bg-[#41436A] data-[state=active]:text-white">Categories</TabsTrigger>
                                <TabsTrigger value="tools" className="data-[state=active]:bg-[#41436A] data-[state=active]:text-white">Tools</TabsTrigger>
                            </TabsList>

                            <TabsContent value="categories" className="space-y-2">
                                {/* Categories List - Grid Format */}
                                <div>
                                    <div className="flex items-start justify-between mb-4 gap-4">
                                        <h4 className="text-base font-medium text-gray-700">Categories</h4>
                                        <div className="w-full md:w-96 ml-auto flex flex-row items-center gap-4">
                                            {caps.add && (
                                                <Button onClick={() => setShowAddCategoryModal(true)} className="h-8 px-3 bg-[#984063] hover:bg-[#984063] text-white inline-flex items-center gap-3 whitespace-nowrap rounded transform active:translate-y-0 active:scale-100">
                                                    <span className="text-sm">+ Add Category</span>
                                                </Button>
                                            )}
                                            <div className="flex-1 relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
                                                <Input id="cat-search" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="Search categories" className="w-full h-8 pl-10" />
                                            </div>
                                        </div>
                                    </div>

                                    {categories.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No categories yet</div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                                {categories
                                                    .filter(cat => {
                                                        if (!categorySearch) return true;
                                                        return String(cat.name || "").toLowerCase().includes(String(categorySearch).toLowerCase());
                                                    })
                                                    .map((cat) => (
                                                        <div key={cat._id} className="border rounded p-2 flex flex-col gap-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="font-medium truncate">{cat.name}</span>
                                                                <div className="flex items-center gap-1">
                                                                    {caps.edit && (
                                                                        <Button
                                                                            variant="outline"
                                                                            className="p-1 border border-gray-300 text-gray-500 hover:bg-gray-100 h-7 w-7"
                                                                            onClick={() => setEditCategoryModalData(cat)}
                                                                        >
                                                                            <Edit2 className="w-3 h-3" />
                                                                        </Button>
                                                                    )}
                                                                    {caps.delete && (
                                                                        <Button
                                                                            variant="outline"
                                                                            className="p-1 border border-gray-300 text-gray-500 hover:bg-gray-100 h-7 w-7"
                                                                            onClick={() => setConfirmAction({ type: 'delete-category', id: cat._id, name: cat.name })}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                </div>
                            </TabsContent>

                            <TabsContent value="tools" className="space-y-2">
                                {/* Tools List - Grid Format */}
                                <div>
                                    <div className="flex items-center justify-between mb-2 gap-3">
                                        <h4 className="text-base font-medium text-gray-700">Tools</h4>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600 whitespace-nowrap">Show tools by</span>
                                                <div className="relative">
                                                    <select
                                                        value={toolCategoryFilter}
                                                        onChange={(e) => setToolCategoryFilter(e.target.value)}
                                                        className="border h-8 rounded-md px-3 appearance-none pr-8 text-sm text-gray-700"
                                                    >
                                                        <option value="">All categories</option>
                                                        {categories.map((c) => (
                                                            <option key={c._id} value={c._id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                                </div>
                                            </div>
                                            {caps.add && (
                                                <Button onClick={() => setShowAddToolModal(true)} className="h-8 px-3 bg-[#984063] hover:bg-[#984063] text-white inline-flex items-center gap-3 whitespace-nowrap rounded transform active:translate-y-0 active:scale-100">
                                                    <span className="text-sm">+ Add Tool</span>
                                                </Button>
                                            )}
                                            <div className="relative w-64">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
                                                <Input id="tool-search" value={toolSearch} onChange={(e) => setToolSearch(e.target.value)} placeholder="Search tools" className="w-full h-8 pl-10" />
                                            </div>
                                        </div>
                                    </div>
                                    {tools.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No tools yet</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                {tools
                                                    .filter(tool => {
                                                        if (toolCategoryFilter) {
                                                            const tCat = tool.category_id?._id || tool.category_id;
                                                            if (tCat !== toolCategoryFilter) return false;
                                                        }
                                                        // Search filter
                                                        if (toolSearch) {
                                                            const q = String(toolSearch).toLowerCase();
                                                            const name = String(tool.name || "").toLowerCase();
                                                            const url = String(tool.url || "").toLowerCase();
                                                            if (!name.includes(q) && !url.includes(q)) return false;
                                                        }
                                                        return true;
                                                    })
                                                    .map((tool) => {
                                                        const categoryName = categories.find(c => c._id === (tool.category_id?._id || tool.category_id))?.name || "Uncategorized";
                                                        return (
                                                        <div key={tool._id} className="border rounded p-2 flex flex-col gap-2">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium truncate">{tool.name}</div>
                                                                    <div className="text-xs text-gray-600 truncate"><span className="font-medium">URL:</span> {tool.url}</div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                                                                        {categoryName}
                                                                    </span>
                                                                    {caps.edit && (
                                                                        <Button
                                                                            variant="outline"
                                                                            className="p-1 border border-gray-300 text-gray-500 hover:bg-gray-100 h-7 w-7"
                                                                            onClick={() => setEditToolModalData(tool)}
                                                                        >
                                                                            <Edit2 className="w-3 h-3" />
                                                                        </Button>
                                                                    )}
                                                                    {caps.delete && (
                                                                        <Button
                                                                            variant="outline"
                                                                            className="p-1 border border-gray-300 text-gray-500 hover:bg-gray-100 h-7 w-7"
                                                                            onClick={() => setConfirmAction({ type: 'delete-tool', id: tool._id, name: tool.name })}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </motion.div>
            </motion.div>

            {/* Confirm modal used for both category and tool deletes */}
            <ConfirmModal
                open={!!confirmAction}
                title={confirmAction?.type === 'delete-category' ? 'Delete category' : 'Delete tool'}
                description={
                    confirmAction
                        ? `Delete "${confirmAction.name}"? This action cannot be undone.`
                        : ''
                }
                backdropBlur={confirmAction?.type !== 'delete-category'}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onClose={() => setConfirmAction(null)}
                onConfirm={() => {
                    if (!confirmAction) return;
                    const { type, id } = confirmAction;
                    if (type === 'delete-category') {
                        deleteCategory.mutate(id, {
                            onSuccess: () => {
                                setConfirmAction(null);
                            },
                        });
                    } else if (type === 'delete-tool') {
                        deleteTool.mutate(id, {
                            onSuccess: () => {
                                setConfirmAction(null);
                            },
                        });
                    } else {
                        setConfirmAction(null);
                    }
                }}
            />

            {/* Add Category Modal */}
            {showAddCategoryModal && (
                <AddCategoryModal onClose={() => setShowAddCategoryModal(false)} />
            )}

            {/* Edit Category Modal */}
            {editCategoryModalData && (
                <EditCategoryModal
                    category={editCategoryModalData}
                    onClose={() => setEditCategoryModalData(null)}
                />
            )}

            {/* Add Tool Modal */}
            {showAddToolModal && (
                <AddToolModal onClose={() => setShowAddToolModal(false)} />
            )}

            {/* Edit Tool Modal */}
            {editToolModalData && (
                <EditToolModal
                    tool={editToolModalData}
                    categories={categories}
                    onClose={() => setEditToolModalData(null)}
                />
            )}
        </>
    );
}