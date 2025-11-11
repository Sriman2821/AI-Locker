import { useState } from "react";
import { base44 } from "@/api/productionClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";

export default function TopicModal({ topic, onClose }) {
  const [formData, setFormData] = useState({
    title: topic?.title || "",
    description: topic?.description || "",
    order: topic?.order || 0,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) =>
      topic
        ? base44.entities.Topic.update(topic.id, data)
        : base44.entities.Topic.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["topics"]);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

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
        className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#41436A] p-8 flex items-center justify-between">
          <h2 className="text-2xl font-light text-white">
            {topic ? "Edit Topic" : "New Topic"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <Label htmlFor="title" className="text-sm font-light text-[#41436A]">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Topic title"
              required
              className="mt-2 border-gray-300 rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-light text-[#41436A]">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Topic description"
              rows={4}
              className="mt-2 border-gray-300 rounded-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors text-sm font-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 bg-[#984063] text-white hover:bg-[#F64668] transition-colors text-sm font-light"
            >
              {mutation.isPending ? "Saving..." : topic ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}