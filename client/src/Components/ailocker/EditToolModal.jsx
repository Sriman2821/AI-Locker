import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { base44 } from "@/api/productionClient";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export default function EditToolModal({ tool, categories, onClose }) {
    useBodyScrollLock(true);
    const queryClient = useQueryClient();
    const [toolForm, setToolForm] = useState({
        category_id: tool.category_id?._id || tool.category_id || "",
        name: tool.name || "",
        url: tool.url || ""
    });
    const [toolErrors, setToolErrors] = useState({});

    const updateTool = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Tool.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === 'tools' });
            onClose();
        },
        onError: (err) => {
            console.error('Update tool error', err);
            setToolErrors({ general: err?.message || 'Failed to update tool' });
        },
    });

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

    const handleUpdateTool = () => {
        if (validateToolForm()) {
            updateTool.mutate({ id: tool._id, data: toolForm });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 p-4"
        >
            <motion.div
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                className="bg-background w-full max-w-lg overflow-hidden flex flex-col rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-3 bg-[#41436A] text-white">
                    <div>
                        <h3 className="text-lg font-medium">Edit Tool</h3>                    </div>
                    <button onClick={onClose} className="p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-tool-category" className="mb-2">Category</Label>
                            <div className="relative">
                                <select
                                    id="edit-tool-category"
                                    value={toolForm.category_id}
                                    onChange={(e) => setToolForm({ ...toolForm, category_id: e.target.value })}
                                    className="w-full border h-10 rounded-md px-3 appearance-none pr-10 mt-1 text-sm"
                                >
                                    <option value="">Select category</option>
                                    {categories.map((c) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            {toolErrors.category_id && <p className="text-sm text-red-500 mt-1">{toolErrors.category_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="edit-tool-name" className="mb-2">Tool Name</Label>
                            <Input
                                id="edit-tool-name"
                                value={toolForm.name}
                                onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                                className="w-full h-10 mt-1"
                                placeholder="Enter tool name"
                            />
                            {toolErrors.name && <p className="text-sm text-red-500 mt-1">{toolErrors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="edit-tool-url" className="mb-2">Tool URL</Label>
                            <Input
                                id="edit-tool-url"
                                value={toolForm.url}
                                onChange={(e) => setToolForm({ ...toolForm, url: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleUpdateTool();
                                    }
                                }}
                                className="w-full h-10 mt-1"
                                placeholder="https://example.com"
                            />
                            {toolErrors.url && <p className="text-sm text-red-500 mt-1">{toolErrors.url}</p>}
                        </div>

                        {toolErrors.general && <p className="text-sm text-red-500">{toolErrors.general}</p>}

                        <div className="flex items-center gap-2 justify-end pt-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="h-9 px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateTool}
                                className="h-9 px-4 bg-[#984063] hover:bg-[#984063] text-white"
                                disabled={updateTool.isLoading}
                            >
                                {updateTool.isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
