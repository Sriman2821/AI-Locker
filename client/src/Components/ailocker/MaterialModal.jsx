import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MaterialModal({ material, topicId, onClose }) {
  const [formData, setFormData] = useState({
    topic_id: material?.topic_id || topicId,
    title: material?.title || "",
    description: material?.description || "",
    type: material?.type || "link",
    url: material?.url || "",
    file_url: material?.file_url || "",
    assigned_user: material?.assigned_user || "",
    session_number: material?.session_number || "",
    date_presented: material?.date_presented || "",
    order: material?.order || 0,
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) =>
      material
        ? base44.entities.Material.update(material.id, data)
        : base44.entities.Material.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["materials"]);
      onClose();
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url, url: "" });
    } catch (error) {
      alert("Failed to upload file");
    }
    setUploading(false);
  };

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
        className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#41436A] p-8 flex items-center justify-between">
          <h2 className="text-2xl font-light text-white">
            {material ? "Edit Material" : "Add Material"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <Label htmlFor="title" className="text-sm font-light text-[#41436A]">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Material title"
                required
                className="mt-2 border-gray-300 rounded-none focus:border-[#F64668]"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description" className="text-sm font-light text-[#41436A]">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Material description"
                rows={3}
                className="mt-2 border-gray-300 rounded-none focus:border-[#F64668]"
              />
            </div>

            <div>
              <Label htmlFor="type" className="text-sm font-light text-[#41436A]">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="mt-2 border-gray-300 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="doc">Document</SelectItem>
                  <SelectItem value="sheet">Spreadsheet</SelectItem>
                  <SelectItem value="slide">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_user" className="text-sm font-light text-[#41436A]">Assigned User</Label>
              <Input
                id="assigned_user"
                value={formData.assigned_user}
                onChange={(e) =>
                  setFormData({ ...formData, assigned_user: e.target.value })
                }
                placeholder="User name"
                className="mt-2 border-gray-300 rounded-none focus:border-[#F64668]"
              />
            </div>

            <div>
              <Label htmlFor="session_number" className="text-sm font-light text-[#41436A]">Session Number</Label>
              <Input
                id="session_number"
                type="number"
                value={formData.session_number}
                onChange={(e) =>
                  setFormData({ ...formData, session_number: parseInt(e.target.value) })
                }
                placeholder="1"
                className="mt-2 border-gray-300 rounded-none focus:border-[#F64668]"
              />
            </div>

            <div>
              <Label htmlFor="date_presented" className="text-sm font-light text-[#41436A]">Date Presented</Label>
              <Input
                id="date_presented"
                type="date"
                value={formData.date_presented}
                onChange={(e) =>
                  setFormData({ ...formData, date_presented: e.target.value })
                }
                className="mt-2 border-gray-300 rounded-none focus:border-[#F64668]"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="url" className="text-sm font-light text-[#41436A]">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                className="mt-2 border-gray-300 rounded-none focus:border-[#F64668]"
                disabled={!!formData.file_url}
              />
            </div>

            <div className="col-span-2">
              <Label className="text-sm font-light text-[#41436A]">Or Upload File</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:border-[#F64668] cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-[#984063]" strokeWidth={1.5} />
                  <span className="text-sm text-[#41436A] font-light">
                    {uploading
                      ? "Uploading..."
                      : formData.file_url
                      ? "File uploaded"
                      : "Choose file"}
                  </span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
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
              disabled={mutation.isPending || uploading}
              className="px-5 py-2 bg-[#984063] text-white hover:bg-[#F64668] transition-colors text-sm font-light"
            >
              {mutation.isPending ? "Saving..." : material ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}