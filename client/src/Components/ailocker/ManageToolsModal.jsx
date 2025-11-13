import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Edit2, Trash2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { base44 } from "@/api/productionClient";
import ConfirmModal from "@/Components/ui/ConfirmModal";

export default function ManageToolsModal({ onClose }) {
    const queryClient = useQueryClient();
    const [caps, setCaps] = useState({ add: true, edit: true, delete: true });

    // Local form state
    const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
    const [toolForm, setToolForm] = useState({ category_id: "", name: "", icon_name: "", url: "", description: "" });

    // Editing state
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingToolId, setEditingToolId] = useState(null);

    // Local edit buffers to avoid mutating query data directly
    const [editCategoryValues, setEditCategoryValues] = useState({});
    const [editToolValues, setEditToolValues] = useState({});

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
    const createCategory = useMutation({
        mutationFn: (data) => base44.entities.ToolCategory.create(data),
        onSuccess: () => {
            // Invalidate any queries whose key starts with 'toolCategories'
            queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === 'toolCategories' });
            setCategoryForm({ name: "", description: "" });
            // optional small success feedback
            try { window?.console?.log('Category created'); } catch (e) {}
        },
        onError: (err) => {
            console.error('Create category error', err);
            try { alert('Failed to create category: ' + (err?.message || err)); } catch (e) {}
        },
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, data }) => base44.entities.ToolCategory.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === 'toolCategories' });
            setEditingCategoryId(null);
        },
    });

    const deleteCategory = useMutation({
        mutationFn: (id) => base44.entities.ToolCategory.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["toolCategories"]);
        },
    });

    // Mutations for tools
    const createTool = useMutation({
        mutationFn: (data) => base44.entities.Tool.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === 'tools' });
            setToolForm({ category_id: "", name: "", icon_name: "", url: "", description: "" });
            try { window?.console?.log('Tool created'); } catch (e) {}
        },
        onError: (err) => {
            console.error('Create tool error', err);
            try { alert('Failed to create tool: ' + (err?.message || err)); } catch (e) {}
        },
    });

    const updateTool = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Tool.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === 'tools' });
            setEditingToolId(null);
        },
    });

    const deleteTool = useMutation({
        mutationFn: (id) => base44.entities.Tool.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["tools"]);
        },
    });

    // helpers
    const [categoryError, setCategoryError] = useState("");

    const handleCreateCategory = () => {
        // Trim and validate
        const name = (categoryForm.name || "").trim();
        if (!name) {
            setCategoryError("Please enter a category name");
            return;
        }
        setCategoryError("");
        // log for debugging so we can see what is being sent
        try { console.debug('[ManageToolsModal] createCategory payload', { ...categoryForm, name }); } catch (e) {}
        createCategory.mutate({ ...categoryForm, name });
    };

    const handleCreateTool = () => {
        if (!toolForm.name || !toolForm.url || !toolForm.category_id) return;
        createTool.mutate(toolForm);
    };

    // Load current user's tool capabilities
    React.useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const me = await base44.auth.me();
                const perms = me?.permissions?.tools;
                if (!cancelled) {
                    if (perms && typeof perms === 'object') {
                        setCaps({ add: !!perms.add, edit: !!perms.edit, delete: !!perms.delete });
                    } else {
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
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="bg-background w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 bg-[#41436A] text-white">
                        <div>
                            <h3 className="text-lg font-medium">Manage Tools & Categories</h3>
                            <p className="text-sm text-white/80">Create, edit, and delete categories and tools</p>
                        </div>
                        <button onClick={onClose} className="p-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 overflow-auto flex-1">
                        <Tabs defaultValue="categories" className="w-full">
                            <TabsList className="grid grid-cols-2 gap-2 mb-6 bg-gray-100 p-1 rounded">
                                <TabsTrigger value="categories">Categories</TabsTrigger>
                                <TabsTrigger value="tools">Tools</TabsTrigger>
                            </TabsList>

                            <TabsContent value="categories" className="space-y-6">
                                {/* Create Category */}
                                <div className="bg-white p-4 border rounded">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <Label htmlFor="cat-name">Name</Label>
                                                <Input id="cat-name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                                                {categoryError && <div className="text-sm text-red-500 mt-1">{categoryError}</div>}
                                        </div>
                                        <div>
                                            <Label htmlFor="cat-desc">Description</Label>
                                            <Input id="cat-desc" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button onClick={handleCreateCategory} className="bg-[#984063] text-white" disabled={createCategory.isLoading}>
                                                <Plus className="w-4 h-4 mr-2" /> {createCategory.isLoading ? 'Saving...' : 'Add Category'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Categories List */}
                                <div className="space-y-3">
                                    {categories.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No categories yet</div>
                                    ) : (
                                        categories.map((cat) => (
                                            <div key={cat._id} className="bg-white border p-3 rounded flex items-center gap-3">
                                                <div className="flex-1">
                                                                                                            {editingCategoryId === cat._id ? (
                                                                                                                <div className="space-y-2">
                                                                                                                    <Input
                                                                                                                        value={editCategoryValues[cat._id]?.name ?? ""}
                                                                                                                        onChange={(e) => setEditCategoryValues((s) => ({ ...s, [cat._id]: { ...(s[cat._id] || {}), name: e.target.value } }))}
                                                                                                                    />
                                                                                                                    <Input
                                                                                                                        value={editCategoryValues[cat._id]?.description ?? ""}
                                                                                                                        onChange={(e) => setEditCategoryValues((s) => ({ ...s, [cat._id]: { ...(s[cat._id] || {}), description: e.target.value } }))}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            ) : (
                                                                                    <div>
                                                                                        <div className="font-medium">{cat.name}</div>
                                                                                        {cat.description && <div className="text-sm text-gray-500">{cat.description}</div>}
                                                                                    </div>
                                                                                )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                                                                            {editingCategoryId === cat._id ? (
                                                                                                                <>
                                                                                                                    <Button
                                                                                                                        onClick={() => {
                                                                                                                            const payload = {
                                                                                                                                name: editCategoryValues[cat._id]?.name ?? cat.name,
                                                                                                                                description: editCategoryValues[cat._id]?.description ?? cat.description,
                                                                                                                            };
                                                                                                                            updateCategory.mutate({ id: cat._id, data: payload });
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        <Save className="w-4 h-4" />
                                                                                                                    </Button>
                                                                                                                    <Button
                                                                                                                        variant="outline"
                                                                                                                        onClick={() => {
                                                                                                                            setEditingCategoryId(null);
                                                                                                                            setEditCategoryValues((s) => {
                                                                                                                                const copy = { ...s };
                                                                                                                                delete copy[cat._id];
                                                                                                                                return copy;
                                                                                                                            });
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        Cancel
                                                                                                                    </Button>
                                                                                                                </>
                                                                                                            ) : (
                                                                                                                <>
                                                                                                                                                                                <Button
                                                                                                                                                                                    variant="outline"
                                                                                                                                                                                    className="p-1 sm:p-2 border border-gray-300 text-gray-500 hover:bg-gray-50"
                                                                                                                                                                                    onClick={() => {
                                                                                                                                                                                        // Initialize edit buffer from current values
                                                                                                                                                                                        setEditCategoryValues((s) => ({ ...s, [cat._id]: { name: cat.name, description: cat.description } }));
                                                                                                                                                                                        setEditingCategoryId(cat._id);
                                                                                                                                                                                    }}
                                                                                                                                                                                >
                                                                                                                                                                                    <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" />
                                                                                                                                                                                </Button>
                                                                                                                                                                                <Button
                                                                                                                                                                                    variant="outline"
                                                                                                                                                                                    className="p-1 sm:p-2 border border-gray-300 text-gray-500 hover:bg-gray-50"
                                                                                                                                                                                    onClick={() => setConfirmAction({ type: 'delete-category', id: cat._id, name: cat.name })}
                                                                                                                                                                                >
                                                                                                                                                                                    <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                                                                                                                                                                                </Button>
                                                                                                                </>
                                                                                                            )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="tools" className="space-y-6">
                                {/* Create Tool */}
                                <div className="bg-white p-4 border rounded">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <Label>Category</Label>
                                            <select value={toolForm.category_id} onChange={(e) => setToolForm({ ...toolForm, category_id: e.target.value })} className="w-full border p-2">
                                                <option value="">Select category</option>
                                                {categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Name</Label>
                                            <Input value={toolForm.name} onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>Icon name</Label>
                                            <Input value={toolForm.icon_name} onChange={(e) => setToolForm({ ...toolForm, icon_name: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>URL</Label>
                                            <Input value={toolForm.url} onChange={(e) => setToolForm({ ...toolForm, url: e.target.value })} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Description</Label>
                                            <Input value={toolForm.description} onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })} />
                                        </div>
                                        <div className="flex justify-end md:col-span-2">
                                            <Button onClick={handleCreateTool} className="bg-[#984063] text-white" disabled={createTool.isLoading}><Plus className="w-4 h-4 mr-2"/>{createTool.isLoading ? 'Saving...' : 'Add Tool'}</Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tools List */}
                                <div className="space-y-3">
                                    {tools.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No tools yet</div>
                                    ) : (
                                        tools
                                            .filter(tool => {
                                                if (!toolForm.category_id) return true; // Show all tools if no category selected
                                                const toolCategoryId = tool.category_id?._id || tool.category_id;
                                                return toolCategoryId === toolForm.category_id;
                                            })
                                            .map((tool) => (
                                            <div key={tool._id} className="bg-white border p-3 rounded flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    {editingToolId === tool._id ? (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <Input
                                                                value={editToolValues[tool._id]?.name ?? ''}
                                                                onChange={(e) => setEditToolValues((s) => ({ ...s, [tool._id]: { ...(s[tool._id] || {}), name: e.target.value } }))}
                                                            />
                                                            <Input
                                                                value={editToolValues[tool._id]?.url ?? ''}
                                                                onChange={(e) => setEditToolValues((s) => ({ ...s, [tool._id]: { ...(s[tool._id] || {}), url: e.target.value } }))}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-medium truncate">{tool.name}</div>
                                                            <div className="text-sm text-gray-500 truncate">{tool.url}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {editingToolId === tool._id ? (
                                                        <>
                                                            {caps.edit && <Button onClick={() => {
                                                                const payload = {
                                                                    name: editToolValues[tool._id]?.name ?? tool.name,
                                                                    url: editToolValues[tool._id]?.url ?? tool.url,
                                                                };
                                                                updateTool.mutate({ id: tool._id, data: payload });
                                                            }}>
                                                                <Save className="w-4 h-4" />
                                                            </Button>}
                                                            {caps.edit && <Button variant="outline" onClick={() => {
                                                                setEditingToolId(null);
                                                                setEditToolValues((s) => { const copy = { ...s }; delete copy[tool._id]; return copy; });
}}>Cancel</Button>}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {caps.edit && <Button
                                                                variant="outline"
                                                                className="p-1 sm:p-2 border border-gray-300 text-gray-500 hover:bg-gray-50"
                                                                onClick={() => {
                                                                    setEditToolValues((s) => ({ ...s, [tool._id]: { name: tool.name, url: tool.url } }));
                                                                    setEditingToolId(tool._id);
                                                                }}
                                                            >
                                                                <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" />
                                                            </Button>}
                                                            {caps.delete && <Button
                                                                variant="outline"
                                                                className="p-1 sm:p-2 border border-gray-300 text-gray-500 hover:bg-gray-50"
                                                                onClick={() => setConfirmAction({ type: 'delete-tool', id: tool._id, name: tool.name })}
                                                            >
                                                                <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                                                            </Button>}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
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
                        ? `Are you sure you want to delete "${confirmAction.name}"? This action cannot be undone.`
                        : ''
                }
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
        </>
    );
}