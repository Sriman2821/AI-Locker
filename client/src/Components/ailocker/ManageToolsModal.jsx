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
    // dirty state and snapshot to detect unsaved changes in forms/edit buffers
    const [isDirty, setIsDirty] = useState(false);
    const initialSnapshotRef = React.useRef(null);
    const [caps, setCaps] = useState({ add: true, edit: true, delete: true });

    // Local form state
    const [categoryForm, setCategoryForm] = useState({ name: "" });
    const [toolForm, setToolForm] = useState({ category_id: "", name: "", url: "" });

    // Editing state
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingToolId, setEditingToolId] = useState(null);

    // Local edit buffers to avoid mutating query data directly
    const [editCategoryValues, setEditCategoryValues] = useState({});
    const [editToolValues, setEditToolValues] = useState({});

    // confirmation state for deletions (category or tool)
    const [confirmAction, setConfirmAction] = useState(null);
    
    // Track if we're in save-and-exit mode
    const [isSaveAndExiting, setIsSaveAndExiting] = useState(false);

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
            setCategoryForm({ name: "" });
            // optional small success feedback
            try { window?.console?.log('Category created'); } catch (e) {}
            // If save-and-exit, close after a brief delay to let other mutations finish
            if (isSaveAndExiting) {
                setTimeout(() => {
                    setIsSaveAndExiting(false);
                    onClose();
                }, 100);
            }
        },
        onError: (err) => {
            console.error('Create category error', err);
            try { alert('Failed to create category: ' + (err?.message || err)); } catch (e) {}
            if (isSaveAndExiting) {
                setIsSaveAndExiting(false);
            }
        },
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, data }) => base44.entities.ToolCategory.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === 'toolCategories' });
            setEditingCategoryId(null);
            // If save-and-exit, close after mutations complete
            if (isSaveAndExiting) {
                setTimeout(() => {
                    setIsSaveAndExiting(false);
                    onClose();
                }, 100);
            }
        },
        onError: (err) => {
            console.error('Update category error', err);
            if (isSaveAndExiting) {
                setIsSaveAndExiting(false);
            }
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
            setToolForm((prev) => ({ ...prev, name: "", url: "" }));
            try { window?.console?.log('Tool created'); } catch (e) {}
            // If save-and-exit, close after a brief delay
            if (isSaveAndExiting) {
                setTimeout(() => {
                    setIsSaveAndExiting(false);
                    onClose();
                }, 100);
            }
        },
        onError: (err) => {
            console.error('Create tool error', err);
            try { alert('Failed to create tool: ' + (err?.message || err)); } catch (e) {}
            if (isSaveAndExiting) {
                setIsSaveAndExiting(false);
            }
        },
    });

    const updateTool = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Tool.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === 'tools' });
            setEditingToolId(null);
            // If save-and-exit, close after mutations complete
            if (isSaveAndExiting) {
                setTimeout(() => {
                    setIsSaveAndExiting(false);
                    onClose();
                }, 100);
            }
        },
        onError: (err) => {
            console.error('Update tool error', err);
            if (isSaveAndExiting) {
                setIsSaveAndExiting(false);
            }
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
    const [toolError, setToolError] = useState("");

    // capture initial snapshot once
    React.useEffect(() => {
        if (initialSnapshotRef.current == null) {
            initialSnapshotRef.current = JSON.stringify({
                categoryForm,
                toolForm,
                editingCategoryId,
                editingToolId,
                editCategoryValues,
                editToolValues,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // track dirty when relevant local state changes
    React.useEffect(() => {
        try {
            const current = JSON.stringify({ categoryForm, toolForm, editingCategoryId, editingToolId, editCategoryValues, editToolValues });
            setIsDirty(initialSnapshotRef.current !== current);
        } catch (e) {
            setIsDirty(false);
        }
    }, [categoryForm, toolForm, editingCategoryId, editingToolId, editCategoryValues, editToolValues]);

    // When editing inline, listen for clicks outside the editing row and auto-close if no real changes
    React.useEffect(() => {
        const onDocMouseDown = (e) => {
            // handle tool inline edit
            if (editingToolId) {
                const el = document.querySelector(`[data-edit-id="${editingToolId}"]`);
                if (el && !el.contains(e.target)) {
                    const editedName = (editToolValues[editingToolId]?.name ?? "").trim();
                    const editedUrl = (editToolValues[editingToolId]?.url ?? "").trim();
                    const originalTool = tools.find(t => t._id === editingToolId);
                    if (editedName === (originalTool?.name || "") && editedUrl === (originalTool?.url || "")) {
                        setEditingToolId(null);
                        setEditToolValues((s) => { const copy = { ...s }; delete copy[editingToolId]; return copy; });
                    }
                }
            }

            // handle category inline edit
            if (editingCategoryId) {
                const el = document.querySelector(`[data-edit-cat-id="${editingCategoryId}"]`);
                if (el && !el.contains(e.target)) {
                    const editedName = (editCategoryValues[editingCategoryId]?.name ?? "").trim();
                    const originalCat = categories.find(c => c._id === editingCategoryId);
                    if (editedName === (originalCat?.name || "")) {
                        setEditingCategoryId(null);
                        setEditCategoryValues((s) => { const copy = { ...s }; delete copy[editingCategoryId]; return copy; });
                    }
                }
            }
        };

        if (editingToolId || editingCategoryId) {
            document.addEventListener('mousedown', onDocMouseDown, true);
        }
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown, true);
        };
    }, [editingToolId, editingCategoryId, editToolValues, editCategoryValues, tools, categories]);

    const requestCloseModal = () => {
        // Check if there are actual unsaved changes (excluding just selecting a category in tools section)
        const hasCategoryName = (categoryForm.name || "").trim() !== "";
        const hasToolName = (toolForm.name || "").trim() !== "";
        const hasToolUrl = (toolForm.url || "").trim() !== "";

        // Check if inline edits have actual changes (compare with original data)
        let hasRealInlineEdits = false;
        
        // Check category inline edits
        if (editingCategoryId && editCategoryValues[editingCategoryId]) {
            const editedName = (editCategoryValues[editingCategoryId].name ?? "").trim();
            const originalCategory = categories.find(c => c._id === editingCategoryId);
            if (editedName !== (originalCategory?.name || "")) {
                hasRealInlineEdits = true;
            }
        }

        // Check tool inline edits
        if (editingToolId && editToolValues[editingToolId]) {
            const editedName = (editToolValues[editingToolId].name ?? "").trim();
            const editedUrl = (editToolValues[editingToolId].url ?? "").trim();
            const originalTool = tools.find(t => t._id === editingToolId);
            if (editedName !== (originalTool?.name || "") || editedUrl !== (originalTool?.url || "")) {
                hasRealInlineEdits = true;
            }
        }

        const hasMeaningfulChanges = hasCategoryName || hasToolName || hasToolUrl || hasRealInlineEdits;

        if (isDirty && hasMeaningfulChanges) {
            setConfirmAction({ type: 'save-and-exit', title: 'Unsaved changes', description: 'You have unsaved changes. Save and exit?' });
            return;
        }
        onClose();
    };

    const handleEditCategoryBlur = (category) => {
        // Auto-close edit mode if no changes were made
        const editedName = (editCategoryValues[category._id]?.name ?? "").trim();
        if (editedName === (category.name || "")) {
            setEditingCategoryId(null);
            setEditCategoryValues((s) => { const copy = { ...s }; delete copy[category._id]; return copy; });
        }
    };

    const handleEditToolBlur = (tool) => {
        // Auto-close edit mode if no changes were made
        const editedName = (editToolValues[tool._id]?.name ?? "").trim();
        const editedUrl = (editToolValues[tool._id]?.url ?? "").trim();
        if (editedName === (tool.name || "") && editedUrl === (tool.url || "")) {
            setEditingToolId(null);
            setEditToolValues((s) => { const copy = { ...s }; delete copy[tool._id]; return copy; });
        }
    };

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
        // Trim and validate
        const name = (toolForm.name || "").trim();
        const url = (toolForm.url || "").trim();
        const category_id = (toolForm.category_id || "").trim();

        if (!name || !url || !category_id) {
            let errors = [];
            if (!name) errors.push("Please enter a tool name");
            if (!url) errors.push("Please enter a tool URL");
            if (!category_id) errors.push("Please select a category");
            setToolError(errors.join(" and "));
            return;
        }
        setToolError("");
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
                onClick={requestCloseModal}
            >
                <motion.div
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="bg-background max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col rounded-lg sm:rounded-none"
                    onClick={(e) => e.stopPropagation()}
                >
                            <div className="flex items-center justify-between p-4 bg-[#41436A] text-white">
                        <div>
                            <h3 className="text-xl font-medium">Manage Tools & Categories</h3>
                            <p className="text-base text-white/80">Create, edit, and delete categories and tools</p>
                        </div>
                        <button onClick={requestCloseModal} className="p-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 overflow-auto flex-1">
                        <Tabs defaultValue="categories" className="w-full">
                            <TabsList className="grid grid-cols-2 gap-2 mb-4 bg-gray-100 p-1 rounded">
                                <TabsTrigger value="categories">Categories</TabsTrigger>
                                <TabsTrigger value="tools">Tools</TabsTrigger>
                            </TabsList>

                            <TabsContent value="categories" className="space-y-4">
                                {/* Create Category */}
                                <div className="bg-white ">
                                    <div className="grid grid-cols-1 gap-2">
                                        <div>
                                            <Label htmlFor="cat-name" className="text-base">Name</Label>
                                                <Input id="cat-name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                                                {categoryError && <div className="text-sm text-red-500 mt-1">{categoryError}</div>}
                                        </div>
                                        <div className="flex justify-end">
                                            <Button onClick={handleCreateCategory} className="bg-[#984063] text-white hover:bg-[#984063]" disabled={createCategory.isLoading}>
                                                <Plus className="w-4 h-4 mr-2" /> {createCategory.isLoading ? 'Saving...' : 'Add Category'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Categories List */}
                                <h3 className="text-base font-medium text-gray-700 mt-2">Categories</h3>
                                <div className="space-y-1">
                                    {categories.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No categories yet</div>
                                        ) : (
                                        categories.map((cat) => (
                                            <div key={cat._id} data-edit-cat-id={cat._id} className="bg-white border p-3 rounded flex items-center gap-3">
                                                <div className="flex-1">
                                                                                                            {editingCategoryId === cat._id ? (
                                                                                                                <div className="space-y-2">
                                                                                                                    <Input
                                                                                                                        value={editCategoryValues[cat._id]?.name ?? ""}
                                                                                                                        onChange={(e) => setEditCategoryValues((s) => ({ ...s, [cat._id]: { ...(s[cat._id] || {}), name: e.target.value } }))}
                                                                                                                        onBlur={() => handleEditCategoryBlur(cat)}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            ) : (
                                                                                    <div>
                                                                                        <div className="font-medium">{cat.name}</div>
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
                                                                                                                                                                                    className="p-1 sm:p-2 border border-gray-300 text-gray-500"
                                                                                                                                                                                    onClick={() => {
                                                                                                                                                                                        // Initialize edit buffer from current values
                                                                                                                                                                                        setEditCategoryValues((s) => ({ ...s, [cat._id]: { name: cat.name } }));
                                                                                                                                                                                        setEditingCategoryId(cat._id);
                                                                                                                                                                                    }}
                                                                                                                                                                                >
                                                                                                                                                                                    <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" />
                                                                                                                                                                                </Button>
                                                                                                                                                                                <Button
                                                                                                                                                                                    variant="outline"
                                                                                                                                                                                    className="p-1 sm:p-2 border border-gray-300 text-gray-500"
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

                            <TabsContent value="tools" className="space-y-4">
                                {/* Create Tool */}
                                <div className="bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-base">Category</Label>
                                            <select value={toolForm.category_id} onChange={(e) => setToolForm({ ...toolForm, category_id: e.target.value })} className="w-full border p-2">
                                                <option value="">Select category</option>
                                                {categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="text-base">Name</Label>
                                            <Input value={toolForm.name} onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label className="text-base">URL</Label>
                                            <Input value={toolForm.url} onChange={(e) => setToolForm({ ...toolForm, url: e.target.value })} />
                                        </div>
                                        <div className="flex justify-end md:col-span-2">
                                            <Button onClick={handleCreateTool} className="bg-[#984063] text-white hover:bg-[#984063]" disabled={createTool.isLoading}><Plus className="w-4 h-4 mr-2"/>{createTool.isLoading ? 'Saving...' : 'Add Tool'}</Button>
                                        </div>
                                            {toolError && <div className="text-sm text-red-500 col-span-full">{toolError}</div>}
                                    </div>
                                </div>

                                {/* Tools List */}
                                <h3 className="text-base font-medium text-gray-700 mt-2">Tools</h3>
                                <div className="space-y-1">
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
                                            <div key={tool._id} data-edit-id={tool._id} className="bg-white border p-3 rounded flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    {editingToolId === tool._id ? (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <Input
                                                                value={editToolValues[tool._id]?.name ?? ''}
                                                                onChange={(e) => setEditToolValues((s) => ({ ...s, [tool._id]: { ...(s[tool._id] || {}), name: e.target.value } }))}
                                                                onBlur={() => handleEditToolBlur(tool)}
                                                            />
                                                            <Input
                                                                value={editToolValues[tool._id]?.url ?? ''}
                                                                onChange={(e) => setEditToolValues((s) => ({ ...s, [tool._id]: { ...(s[tool._id] || {}), url: e.target.value } }))}
                                                                onBlur={() => handleEditToolBlur(tool)}
                                                            />
                                                        </div>
                                                    ) : (
                                                            <div>
                                                            <div className="text-base font-medium truncate">{tool.name}</div>
                                                            <div className="text-base text-gray-500 truncate">{tool.url}</div>
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
                                                                className="p-1 sm:p-2 border border-gray-300 text-gray-500"
                                                                onClick={() => {
                                                                    setEditToolValues((s) => ({ ...s, [tool._id]: { name: tool.name, url: tool.url } }));
                                                                    setEditingToolId(tool._id);
                                                                }}
                                                            >
                                                                <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" />
                                                            </Button>}
                                                            {caps.delete && <Button
                                                                variant="outline"
                                                                className="p-1 sm:p-2 border border-gray-300 text-gray-500"
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
                title={
                    confirmAction?.type === 'delete-category'
                        ? 'Delete category'
                        : confirmAction?.type === 'delete-tool'
                        ? 'Delete tool'
                        : confirmAction?.title || 'Confirm'
                }
                description={
                    confirmAction
                        ? (confirmAction.type === 'delete-category' || confirmAction.type === 'delete-tool')
                            ? `Are you sure you want to delete "${confirmAction.name}"? This action cannot be undone.`
                            : confirmAction.description || ''
                        : ''
                }
                confirmLabel={confirmAction?.type === 'delete-category' || confirmAction?.type === 'delete-tool' ? 'Delete' : confirmAction?.type === 'save-and-exit' ? 'Save & Exit' : (confirmAction?.confirmLabel || 'Confirm')}
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
                    } else if (type === 'save-and-exit') {
                        setConfirmAction(null);
                        setIsSaveAndExiting(true);

                        // Save inline category edit
                        if (editingCategoryId && editCategoryValues[editingCategoryId]) {
                            const payload = { name: (editCategoryValues[editingCategoryId].name ?? '').trim() };
                            updateCategory.mutate({ id: editingCategoryId, data: payload });
                        }

                        // Save inline tool edit
                        if (editingToolId && editToolValues[editingToolId]) {
                            const payload = {
                                name: (editToolValues[editingToolId].name ?? '').trim(),
                                url: (editToolValues[editingToolId].url ?? '').trim(),
                            };
                            updateTool.mutate({ id: editingToolId, data: payload });
                        }

                        // Create category if filled
                        const catName = (categoryForm.name || '').trim();
                        if (catName) {
                            createCategory.mutate({ ...categoryForm, name: catName });
                        }

                        // Create tool if filled
                        const toolName = (toolForm.name || '').trim();
                        const toolUrl = (toolForm.url || '').trim();
                        const toolCat = (toolForm.category_id || '').trim();
                        if (toolName && toolUrl && toolCat) {
                            createTool.mutate(toolForm);
                        }

                        // If nothing pending, close immediately
                        if (!editingCategoryId && !editingToolId && !catName && !(toolName && toolUrl && toolCat)) {
                            setIsSaveAndExiting(false);
                            onClose();
                        }
                    } else {
                        setConfirmAction(null);
                    }
                }}
            />
        </>
    );
}