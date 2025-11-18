import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { base44 } from "@/api/productionClient";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export default function AddCategoryModal({ onClose }) {
    useBodyScrollLock(true);
    const queryClient = useQueryClient();
    const [categoryForm, setCategoryForm] = useState({ name: "" });
    const [categoryError, setCategoryError] = useState("");

    const createCategory = useMutation({
        mutationFn: (data) => base44.entities.ToolCategory.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === 'toolCategories' });
            setCategoryForm({ name: "" });
            setCategoryError("");
        },
        onError: (err) => {
            console.error('Create category error', err);
            setCategoryError(err?.message || 'Failed to create category');
        },
    });

    const handleCreateCategory = () => {
        const name = (categoryForm.name || "").trim();
        if (!name) {
            setCategoryError("Please enter a category name");
            return;
        }
        setCategoryError("");
        createCategory.mutate({ ...categoryForm, name });
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
                className="bg-background w-full max-w-md overflow-hidden flex flex-col rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-3 bg-[#41436A] text-white">
                    <div>
                        <h3 className="text-lg font-medium">Add Category</h3>
                    </div>
                    <button onClick={onClose} className="p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="category-name" className="mb-2">Category Name</Label>
                            <Input
                                id="category-name"
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateCategory();
                                    }
                                }}
                                className="w-full h-10 mt-1"
                                placeholder="Enter category name"
                                autoFocus
                            />
                            {categoryError && <p className="text-sm text-red-500 mt-2">{categoryError}</p>}
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="h-9 px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateCategory}
                                className="h-9 px-4 bg-[#984063] hover:bg-[#984063] text-white"
                                disabled={createCategory.isLoading}
                            >
                                {createCategory.isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
