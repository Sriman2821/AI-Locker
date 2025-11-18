import { useState, useEffect } from "react";
import { base44 } from "@/api/productionClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export default function TopicModal({ topic, onClose, onCreated }) {
  useBodyScrollLock(true);
   const [formData, setFormData] = useState({
     title: topic?.title || "",
     description: topic?.description || "",
     order: topic?.order || 0,
   });

  // helper to reset form to original topic values
  const resetForm = () => {
    setFormData({
      title: topic?.title || "",
      description: topic?.description || "",
      order: topic?.order || 0,
    });
    setErrors({});
  };
   const [errors, setErrors] = useState({});

   const queryClient = useQueryClient();

   const mutation = useMutation({
     mutationFn: (data) =>
       topic
         ? base44.entities.Topic.update(topic.id, data)
         : base44.entities.Topic.create(data),
     onSuccess: (data) => {
       queryClient.invalidateQueries(["topics"]);
       // If this was a create (no `topic` prop), notify parent with the created topic
       if (!topic && typeof onCreated === "function") {
         try { onCreated(data); } catch (e) { /* ignore */ }
       }
       onClose();
     },
   });

   const validateForm = () => {
     const newErrors = {};
     const title = (formData.title || "").trim();

     if (!title) {
       newErrors.title = "Title is required";
     } else if (title.length < 2) {
       newErrors.title = "Title must be at least 2 characters";
     }

     setErrors(newErrors);

     if (Object.keys(newErrors).length > 0) {
       // focus first invalid field
       setTimeout(() => {
         const el = document.getElementById("title");
         if (el && typeof el.focus === "function") el.focus();
       }, 0);
       return false;
     }

     return true;
   };

   const handleSubmit = (e) => {
     e.preventDefault();
     if (validateForm()) {
       mutation.mutate(formData);
     }
   };

   // Prevent closing modal with Escape key; only the X button will close it
   useEffect(() => {
     const onKey = (e) => {
       if (e.key === "Escape") {
         // swallow Escape so parent/other handlers don't close the modal
         e.stopPropagation();
         e.preventDefault();
       }
     };
     document.addEventListener("keydown", onKey, true);
     return () => document.removeEventListener("keydown", onKey, true);
   }, []);

   return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-2"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-lg transform -translate-y-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#41436A] p-3 flex items-center justify-between">
          <h2 className="text-lg font-light text-white">
            {topic ? "Edit Topic" : "New Topic"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div>
            <Label htmlFor="title" className="text-sm font-light text-[#41436A]">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.title;
                  return copy;
                });
              }}
              placeholder="Topic title"
              className="mt-1 border-gray-300 rounded-sm"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div className="mb-16">
            <Label htmlFor="description" className="text-sm font-light text-[#41436A]">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Topic description"
              rows={4}
              className="mt-2 border-gray-300 rounded-sm pb-4 mb-6"
            />
          </div>

          {/* Divider moved out so we can control its vertical position independently */}
          <div className="border-t border-gray-200 mt-20" />

          <div className="flex gap-2 justify-end pt-1 pb-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors text-sm font-light rounded-[2px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 bg-[#984063] text-white transition-colors text-sm font-light rounded-[2px]"
            >
              {mutation.isPending ? "Saving..." : topic ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}