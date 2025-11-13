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
    const [categoryForm, setCategoryForm] = useState({ name: "" });
    const [toolForm, setToolForm] = useState({ category_id: "", name: "", url: "" });

    // Error states
    const [categoryError, setCategoryError] = useState("");
    const [toolErrors, setToolErrors] = useState({});

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
            setCategoryForm({ name: "" });
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
            setToolForm({ category_id: "", name: "", url: "" });
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

    const validateToolForm = () => {
        const newErrors = {};
        if (!toolForm.name.trim()) {
            newErrors.name = "Tool name is required";
        }
        if (!toolForm.url.trim()) {
            newErrors.url = "Tool URL is required";
        } else if (!isValidUrl(toolForm.url)) {
            newErrors.url = "Please enter a valid URL";
        }
        if (!toolForm.category_id) {
            newErrors.category_id = "Please select a category";
        }
        setToolErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleCreateTool = () => {
        if (validateToolForm()) {
            createTool.mutate(toolForm);
        }
    };

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
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="bg-background w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-3 bg-[#41436A] text-white">
                        <div>
                            <h3 className="text-lg font-medium">Manage Tools & Categories</h3>
                            <p className="text-sm text-white/80">Create, edit, and delete categories and tools</p>
                        </div>
                        <button onClick={onClose} className="p-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-3 overflow-auto flex-1">
                        <Tabs defaultValue="categories" className="w-full">
                            <TabsList className="grid grid-cols-2 gap-2 mb-3 bg-gray-100 p-1 rounded">
                                <TabsTrigger value="categories" className="data-[state=active]:bg-[#41436A] data-[state=active]:text-white">Categories</TabsTrigger>
                                <TabsTrigger value="tools" className="data-[state=active]:bg-[#41436A] data-[state=active]:text-white">Tools</TabsTrigger>
                            </TabsList>

                            <TabsContent value="categories" className="space-y-2">
                                {/* Create Category */}
                                {caps.add && (
                                    <div className="bg-white p-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label htmlFor="cat-name">Name</Label>
                                                    <Input id="cat-name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                                                    {categoryError && <div className="text-sm text-red-500 mt-1">{categoryError}</div>}
                                            </div>
                                            <div className="flex items-end justify-end">
                                                <Button onClick={handleCreateCategory} className="bg-[#41436A] text-white hover:bg-[#41436A] hover:text-white" disabled={createCategory.isLoading}>
                                                    <Plus className="w-4 h-4 mr-2" /> {createCategory.isLoading ? 'Saving...' : 'Add Category'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Categories List - Table Format */}
                                <div>
                                    <h4 className="text-base font-medium text-gray-700 mb-1">Categories</h4>
                                    <div className="bg-white border rounded overflow-hidden">
                                    {categories.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No categories yet</div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left p-2 font-medium text-gray-700">Name</th>
                                                    <th className="text-right p-2 font-medium text-gray-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categories.map((cat) => (
                                                    <tr key={cat._id} className="border-b last:border-b-0 hover:bg-gray-50">
                                                        <td className="p-2">
                                                            {editingCategoryId === cat._id ? (
                                                                <Input
                                                                    value={editCategoryValues[cat._id]?.name ?? ""}
                                                                    onChange={(e) => setEditCategoryValues((s) => ({ ...s, [cat._id]: { name: e.target.value } }))}
                                                                    className="h-8 text-sm"
                                                                />
                                                            ) : (
                                                                <span className="font-medium">{cat.name}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="flex items-center justify-end gap-1">
                                                                {editingCategoryId === cat._id ? (
                                                                    <>
                                                                        <Button
                                                                            onClick={() => {
                                                                                const payload = {
                                                                                    name: editCategoryValues[cat._id]?.name ?? cat.name,
                                                                                };
                                                                                updateCategory.mutate({ id: cat._id, data: payload });
                                                                            }}
                                                                            className="h-7 px-2"
                                                                        >
                                                                            <Save className="w-3 h-3" />
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
                                                                            className="h-7 px-2 text-xs"
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {caps.edit && (
                                                                            <Button
                                                                                variant="outline"
                                                                                className="p-1 border border-gray-300 text-gray-500 hover:bg-gray-100 h-7 w-7"
                                                                                onClick={() => {
                                                                                    setEditCategoryValues((s) => ({ ...s, [cat._id]: { name: cat.name } }));
                                                                                    setEditingCategoryId(cat._id);
                                                                                }}
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
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="tools" className="space-y-2">
                                {/* Create Tool */}
                                {caps.add && (
                                <div className="bg-white p-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div>
                                            <Label>Category</Label>
                                            <select value={toolForm.category_id} onChange={(e) => setToolForm({ ...toolForm, category_id: e.target.value })} className="w-full border p-2">
                                                <option value="">Select category</option>
                                                {categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                                            </select>
                                            {toolErrors.category_id && <p className="text-sm text-red-500 mt-1">{toolErrors.category_id}</p>}
                                        </div>
                                        <div>
                                            <Label>Name</Label>
                                            <Input value={toolForm.name} onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })} />
                                            {toolErrors.name && <p className="text-sm text-red-500 mt-1">{toolErrors.name}</p>}
                                        </div>
                                        <div>
                                            <Label>URL</Label>
                                            <Input value={toolForm.url} onChange={(e) => setToolForm({ ...toolForm, url: e.target.value })} />
                                            {toolErrors.url && <p className="text-sm text-red-500 mt-1">{toolErrors.url}</p>}
                                        </div>
                                        <div className="flex items-end justify-end">
                                            <Button onClick={handleCreateTool} className="bg-[#41436A] text-white hover:bg-[#41436A] hover:text-white" disabled={createTool.isLoading}><Plus className="w-4 h-4 mr-2"/>{createTool.isLoading ? 'Saving...' : 'Add Tool'}</Button>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* Tools List - Table Format */}
                                <div>
                                    <h4 className="text-base font-medium text-gray-700 mb-1">Tools</h4>
                                    <div className="bg-white border rounded overflow-hidden">
                                    {tools.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No tools yet</div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left p-2 font-medium text-gray-700">Name</th>
                                                    <th className="text-left p-2 font-medium text-gray-700">URL</th>
                                                    <th className="text-right p-2 font-medium text-gray-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tools
                                                    .filter(tool => {
                                                        if (!toolForm.category_id) return true;
                                                        const toolCategoryId = tool.category_id?._id || tool.category_id;
                                                        return toolCategoryId === toolForm.category_id;
                                                    })
                                                    .map((tool) => (
                                                        <tr key={tool._id} className="border-b last:border-b-0 hover:bg-gray-50">
                                                            <td className="p-2">
                                                                {editingToolId === tool._id ? (
                                                                    <Input
                                                                        value={editToolValues[tool._id]?.name ?? ''}
                                                                        onChange={(e) => setEditToolValues((s) => ({ ...s, [tool._id]: { ...(s[tool._id] || {}), name: e.target.value } }))}
                                                                        className="h-8 text-sm"
                                                                    />
                                                                ) : (
                                                                    <span className="font-medium">{tool.name}</span>
                                                                )}
                                                            </td>
                                                            <td className="p-2">
                                                                {editingToolId === tool._id ? (
                                                                    <Input
                                                                        value={editToolValues[tool._id]?.url ?? ''}
                                                                        onChange={(e) => setEditToolValues((s) => ({ ...s, [tool._id]: { ...(s[tool._id] || {}), url: e.target.value } }))}
                                                                        className="h-8 text-sm"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-600 truncate block max-w-md">{tool.url}</span>
                                                                )}
                                                            </td>
                                                            <td className="p-2">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    {editingToolId === tool._id ? (
                                                                        <>
                                                                            {caps.edit && <Button
                                                                                onClick={() => {
                                                                                    const payload = {
                                                                                        name: editToolValues[tool._id]?.name ?? tool.name,
                                                                                        url: editToolValues[tool._id]?.url ?? tool.url,
                                                                                    };
                                                                                    updateTool.mutate({ id: tool._id, data: payload });
                                                                                }}
                                                                                className="h-7 px-2"
                                                                            >
                                                                                <Save className="w-3 h-3" />
                                                                            </Button>}
                                                                            {caps.edit && <Button
                                                                                variant="outline"
                                                                                onClick={() => {
                                                                                    setEditingToolId(null);
                                                                                    setEditToolValues((s) => { const copy = { ...s }; delete copy[tool._id]; return copy; });
                                                                                }}
                                                                                className="h-7 px-2 text-xs"
                                                                            >
                                                                                Cancel
                                                                            </Button>}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {caps.edit && <Button
                                                                                variant="outline"
                                                                                className="p-1 border border-gray-300 text-gray-500 hover:bg-gray-100 h-7 w-7"
                                                                                onClick={() => {
                                                                                    setEditToolValues((s) => ({ ...s, [tool._id]: { name: tool.name, url: tool.url } }));
                                                                                    setEditingToolId(tool._id);
                                                                                }}
                                                                            >
                                                                                <Edit2 className="w-3 h-3" />
                                                                            </Button>}
                                                                            {caps.delete && <Button
                                                                                variant="outline"
                                                                                className="p-1 border border-gray-300 text-gray-500 hover:bg-gray-100 h-7 w-7"
                                                                                onClick={() => setConfirmAction({ type: 'delete-tool', id: tool._id, name: tool.name })}
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
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