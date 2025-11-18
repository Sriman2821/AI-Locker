import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/productionClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, Image as ImageIcon, Video, FileText, FileSpreadsheet, Presentation, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import ConfirmModal from "@/Components/ui/ConfirmModal";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export default function MaterialModal({ material, topicId, onClose }) {
  useBodyScrollLock(true);
  const [formData, setFormData] = useState({
    topic_id: material?.topic_id || topicId,
    title: material?.title || "",
    description: material?.description || "",
    type: material?.type || (material?.files?.length ? "file" : "link"),
    // legacy single fields retained but not used in UI
    url: "",
    file_url: "",
    file_name: "",
    // new multi-fields
    links: material?.links?.length ? material.links : (material?.url ? [{ url: material.url, name: material.url }] : []),
    files: material?.files?.length ? material.files : (material?.file_url ? [{ url: material.file_url, name: material.file_name || "File", type: "file" }] : []),
    assigned_user: material?.assigned_user || "",
    session_number: material?.session_number || "",
    date_presented: material?.date_presented || "",
    order: material?.order || 0,
  });
  const [uploading, setUploading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const initialSnapshotRef = useRef(null);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) =>
      material
        ? base44.entities.Material.update(material.id, data)
        : base44.entities.Material.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", topicId] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      // Update the saved snapshot so the form is no longer considered dirty
      try {
        // Use the same normalization as buildPayload (ignore empty links/files)
        initialSnapshotRef.current = JSON.stringify({
          title: formData.title || "",
          description: formData.description || "",
          assigned_user: formData.assigned_user || "",
          session_number: formData.session_number || "",
          date_presented: formData.date_presented || "",
          links: (formData.links || []).filter(l => l && l.url && String(l.url).trim()).map(l => ({ url: l.url || "", name: l.name || "" })),
          files: (formData.files || []).filter(f => f && f.url).map(f => ({ url: f.url || "", name: f.name || "", type: f.type || "" })),
        });
      } catch (e) {
        // ignore snapshot update errors
      }
      setIsDirty(false);
      onClose();
    },
  });

  // Capture initial snapshot once
  useEffect(() => {
    if (initialSnapshotRef.current == null) {
      initialSnapshotRef.current = JSON.stringify({
        title: material?.title || "",
        description: material?.description || "",
        assigned_user: material?.assigned_user || "",
        session_number: material?.session_number || "",
        date_presented: material?.date_presented || "",
        links: (material?.links || (material?.url ? [{ url: material.url, name: material.url }] : [])).map(l => ({ url: l.url || "", name: l.name || "" })),
        files: (material?.files || (material?.file_url ? [{ url: material.file_url, name: material.file_name || "File", type: "" }] : [])).map(f => ({ url: f.url || "", name: f.name || "", type: f.type || "" })),
      });
    }
  }, [material]);

  // helper to reset form to original material values (do not close modal)
  const resetForm = () => {
    setFormData({
      topic_id: material?.topic_id || topicId,
      title: material?.title || "",
      description: material?.description || "",
      type: material?.type || (material?.files?.length ? "file" : "link"),
      url: "",
      file_url: "",
      file_name: "",
      links: material?.links?.length ? material.links : (material?.url ? [{ url: material.url, name: material.url }] : []),
      files: material?.files?.length ? material.files : (material?.file_url ? [{ url: material.file_url, name: material.file_name || "File", type: "file" }] : []),
      assigned_user: material?.assigned_user || "",
      session_number: material?.session_number || "",
      date_presented: material?.date_presented || "",
      order: material?.order || 0,
    });
    setErrors({});
    // update snapshot so the form is considered not dirty after reset
    try {
      initialSnapshotRef.current = JSON.stringify({
        title: material?.title || "",
        description: material?.description || "",
        assigned_user: material?.assigned_user || "",
        session_number: material?.session_number || "",
        date_presented: material?.date_presented || "",
        links: (material?.links || (material?.url ? [{ url: material.url, name: material.url }] : [])).map(l => ({ url: l.url || "", name: l.name || "" })),
        files: (material?.files || (material?.file_url ? [{ url: material.file_url, name: material.file_name || "File", type: "" }] : [])).map(f => ({ url: f.url || "", name: f.name || "", type: f.type || "" })),
      });
    } catch (e) {
      // ignore
    }
    setIsDirty(false);
  };

  // Prevent closing modal with Escape key; only the X button will close it
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  // Track dirty state whenever form data changes
  useEffect(() => {
    const current = JSON.stringify({
      title: formData.title,
      description: formData.description,
      assigned_user: formData.assigned_user,
      session_number: formData.session_number,
      date_presented: formData.date_presented,
      // treat empty links (no url) as not a real change
      links: (formData.links || []).filter(l => l && l.url && String(l.url).trim()).map(l => ({ url: l.url || "", name: l.name || "" })),
      files: (formData.files || []).filter(f => f && f.url).map(f => ({ url: f.url || "", name: f.name || "", type: f.type || "" })),
    });
    setIsDirty(initialSnapshotRef.current !== current);
  }, [formData]);

  const buildPayload = () => {
    const normalizedType = (formData.files?.length ? "file" : (formData.links?.length ? "link" : formData.type || "link"));
    return {
      topic_id: formData.topic_id,
      title: formData.title,
      description: formData.description,
      type: normalizedType,
      url: "",
      file_url: "",
      assigned_user: formData.assigned_user,
      session_number: formData.session_number,
      date_presented: formData.date_presented,
      order: formData.order,
      links: (formData.links || []).filter(l => l && l.url),
      files: (formData.files || []).filter(f => f && f.url),
    };
  };

  const requestCloseModal = () => {
    if (isDirty) {
      setConfirmAction({
        type: "save-and-exit",
        title: "Unsaved changes",
        description: "You have unsaved changes. Save and exit?",
      });
      return;
    }
    onClose();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxSizeMb = 10;
    const tooLarge = files.find(f => f.size > maxSizeMb * 1024 * 1024);
    if (tooLarge) {
      alert(`One or more files exceed the ${maxSizeMb}MB limit.`);
      return;
    }

    setUploading(true);
    try {
      // Use production upload endpoint to send multiple files
      const uploadedResponse = await base44.integrations.Core.UploadFiles({ files });
      const uploaded = (Array.isArray(uploadedResponse) ? uploadedResponse : []).map((u, i) => ({
        url: u.file_url,
        name: u.file_name || files[i]?.name || "File",
        type: "",
      }));
      setFormData((prev) => ({
        ...prev,
        files: [...(prev.files || []), ...uploaded],
        type: "file",
      }));
    } catch (error) {
      alert(error?.message || "Failed to upload file(s)");
    }
    setUploading(false);
    // reset input value to allow re-uploading the same file names
    e.target.value = "";
  };

  const handleRemoveUploadedFile = (index) => {
    setFormData((prev) => {
      const next = [...(prev.files || [])];
      next.splice(index, 1);
      return { ...prev, files: next, type: next.length ? "file" : (prev.links?.length ? "link" : prev.type) };
    });
  };

  const requestRemoveUploadedFile = (index) => {
    setConfirmAction({
      type: "remove-file",
      index,
      title: "Remove file",
      description: "Are you sure you want to remove this file from the material?",
    });
  };

  const addEmptyLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...(prev.links || []), { url: "" }],
      type: prev.files?.length ? "file" : "link",
    }));
  };

  const updateLink = (index, key, value) => {
    setFormData((prev) => {
      const next = [...(prev.links || [])];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, links: next };
    });
  };

  const removeLink = (index) => {
    setFormData((prev) => {
      const next = [...(prev.links || [])];
      next.splice(index, 1);
      return { ...prev, links: next, type: prev.files?.length ? "file" : (next.length ? "link" : prev.type) };
    });
  };

  const requestRemoveLink = (index) => {
    setConfirmAction({
      type: "remove-link",
      index,
      title: "Remove link",
      description: "Are you sure you want to remove this link from the material?",
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    // Validate links URLs
    const invalidLinks = (formData.links || []).filter(link => link.url && !isValidUrl(link.url));
    if (invalidLinks.length > 0) {
      newErrors.links = "Please enter valid URLs for all links";
    }
    // Check file types
    const untypedFile = (formData.files || []).find(f => !f.type);
    if (untypedFile) {
      newErrors.files = "Please choose a file type for each uploaded file";
    }
    setErrors(newErrors);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = buildPayload();
      mutation.mutate(payload);
    }
  };

  // Ensure Update button always attempts to save current edits
  const handleUpdate = () => {
    // run validation and save regardless of dirty state
    if (validateForm()) {
      const payload = buildPayload();
      mutation.mutate(payload);
    }
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case "image":
        return ImageIcon;
      case "video":
        return Video;
      case "sheet":
        return FileSpreadsheet;
      case "slide":
        return Presentation;
      case "doc":
      case "file":
      default:
        return FileText;
    }
  };

  const updateFileType = (index, newType) => {
    setFormData((prev) => {
      const next = [...(prev.files || [])];
      next[index] = { ...(next[index] || {}), type: newType || "file" };
      return { ...prev, files: next };
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-3 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white max-w-4xl w-full max-h-[95vh] overflow-y-auto rounded-lg sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#41436A] p-3 sm:p-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-light text-white">
            {material ? "Edit Material" : "Add Material"}
          </h2>
          <button
            onClick={requestCloseModal}
            className="p-1.5 sm:p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 sm:w-5 h-4 sm:h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-8 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="col-span-full">
              <Label htmlFor="title" className="text-xs sm:text-sm font-light text-[#41436A]">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Material title"
                required
                className="mt-1 border-gray-300 rounded-none focus:border-[#41436A] text-sm"
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div className="col-span-full">
              <Label htmlFor="description" className="text-xs sm:text-sm font-light text-[#41436A]">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Material description"
                rows={2}
                className="mt-1 border-gray-300 rounded-none focus:border-[#41436A] text-sm"
              />
            </div>

            

            <div className="sm:col-span-1">
              <Label htmlFor="assigned_user" className="text-xs sm:text-sm font-light text-[#41436A]">Author</Label>
              <Input
                id="assigned_user"
                value={formData.assigned_user}
                onChange={(e) =>
                  setFormData({ ...formData, assigned_user: e.target.value })
                }
                placeholder="Author name"
                className="mt-1 border-gray-300 rounded-none focus:border-[#41436A] text-sm w-full"
              />
            </div>

            <div className="sm:col-span-1">
              <Label htmlFor="session_number" className="text-xs sm:text-sm font-light text-[#41436A]">Session Number</Label>
              <Input
                id="session_number"
                type="number"
                value={formData.session_number}
                onChange={(e) =>
                  setFormData({ ...formData, session_number: parseInt(e.target.value) })
                }
                placeholder="1"
                className="mt-1 border-gray-300 rounded-none focus:border-[#41436A] text-sm w-full"
              />
            </div>

            <div className="sm:col-span-1">
              <Label htmlFor="date_presented" className="text-xs sm:text-sm font-light text-[#41436A]">Date Presented</Label>
              <Input
                id="date_presented"
                type="date"
                value={formData.date_presented}
                onChange={(e) =>
                  setFormData({ ...formData, date_presented: e.target.value })
                }
                className="mt-1 border-gray-300 rounded-none focus:border-[#41436A] text-sm w-full"
              />
            </div>

              <div className="col-span-full">
              <Label className="text-xs sm:text-sm font-light text-[#41436A]">Links</Label>
              <div className="mt-1 space-y-2">
                {(formData.links || []).map((lnk, idx) => (
                  <div key={idx} className="relative">
                    <div className="relative">
                      <Input
                        placeholder="https://example.com"
                        value={lnk.url || ""}
                        onChange={(e) => updateLink(idx, "url", e.target.value)}
                        className="w-full pr-9 border-gray-300 rounded-none focus:border-[#41436A]"
                        aria-label={`Link ${idx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => requestRemoveLink(idx)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-[#41436A] hover:text-[#984063] flex items-center justify-center p-1"
                        title="Remove link"
                        aria-label={`Remove link ${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4 text-[#984063]" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEmptyLink}
                  className="px-2 py-1 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors text-xs font-light"
                >
                  Add link
                </button>
                {errors.links && <p className="text-sm text-red-500 mt-1">{errors.links}</p>}
              </div>
            </div>

            <div className="col-span-full">
              <Label className="text-sm font-light text-[#41436A]">Upload Files</Label>
              <div className="mt-1">
                <div className="flex flex-col">
                  <div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-transparent bg-[#984063] hover:bg-[#7e3b54] cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-white flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-sm text-white font-light">
                        {uploading ? "Uploading..." : "Choose file(s)"}
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {/* Uploaded filenames are shown in the Files list below; no standalone field here */}
                </div>
                {errors.files && <p className="text-sm text-red-500 mt-1">{errors.files}</p>}
                {(formData.files?.length > 0) && (
                  <div className="mt-1 border border-dashed border-gray-300">
                    {formData.files.map((f, idx) => {
                      const Icon = getFileTypeIcon(f.type || "file");
                      return (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center px-3 py-1 bg-gray-50 border-b last:border-b-0">
                          <div className="col-span-6 flex items-center gap-2 min-w-0">
                            <Icon className="w-4 h-4 text-[#984063] shrink-0" strokeWidth={1.5} />
                            <span className="text-xs text-[#41436A] font-light truncate">
                              {f.name || `File ${idx + 1}`}
                            </span>
                          </div>
                          <div className="col-span-4">
                            <Label className="sr-only">Type</Label>
                            <Select
                              value={f.type || undefined}
                              onValueChange={(value) => updateFileType(idx, value)}
                            >
                              <SelectTrigger className="border-gray-300 rounded-none h-7">
                                <SelectValue placeholder="File type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="image">
                                  <div className="flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3 text-[#984063]" strokeWidth={1.5} />
                                    <span>Image</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="video">
                                  <div className="flex items-center gap-2">
                                    <Video className="w-3 h-3 text-[#984063]" strokeWidth={1.5} />
                                    <span>Video</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="doc">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-[#984063]" strokeWidth={1.5} />
                                    <span>Document</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="sheet">
                                  <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="w-3 h-3 text-[#984063]" strokeWidth={1.5} />
                                    <span>Spreadsheet</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="slide">
                                  <div className="flex items-center gap-2">
                                    <Presentation className="w-3 h-3 text-[#984063]" strokeWidth={1.5} />
                                    <span>Presentation</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => requestRemoveUploadedFile(idx)}
                              className="text-xs text-[#41436A] hover:text-[#984063] flex items-center justify-center"
                              title="Remove file"
                              aria-label="Remove file"
                            >
                              <Trash2 className="w-4 h-4 text-[#984063]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <ConfirmModal
            open={!!confirmAction}
            title={confirmAction?.title}
            description={confirmAction?.description}
            confirmLabel={confirmAction?.type === "save-and-exit" ? "Save & Exit" : "Remove"}
            cancelLabel="Cancel"
            backdropBlur={!(confirmAction?.type === "save-and-exit") && confirmAction?.type !== "remove-link" && confirmAction?.type !== "remove-file"}
            onClose={() => setConfirmAction(null)}
            onConfirm={() => {
              if (confirmAction?.type === "remove-link") {
                removeLink(confirmAction.index);
              } else if (confirmAction?.type === "remove-file") {
                handleRemoveUploadedFile(confirmAction.index);
              } else if (confirmAction?.type === "save-and-exit") {
                const payload = buildPayload();
                mutation.mutate(payload);
              }
              setConfirmAction(null);
            }}
          />

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-3 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 sm:px-5 py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors text-xs sm:text-sm font-light"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={mutation.isPending || uploading}
              className="px-5 py-2 bg-[#984063] text-white transition-colors text-sm font-light"
            >
              {mutation.isPending ? "Saving..." : material ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}