import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/productionClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
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
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import ConfirmModal from "@/Components/ui/ConfirmModal";

export default function AddSourceCodeModal({ onClose, repo = null }) {
  useBodyScrollLock(true);
   const [formData, setFormData] = useState({
     name: repo?.name || "",
     platform: repo?.platform || "github",
     url: repo?.url || "",
     description: repo?.description || "",
     tags: Array.isArray(repo?.tags) ? repo.tags.join(", ") : "",
   });
   const [errors, setErrors] = useState({});

   const queryClient = useQueryClient();

   const mutation = useMutation({
     mutationFn: (data) => {
       const submitData = {
         ...data,
         tags: data.tags
           .split(",")
           .map((t) => t.trim())
           .filter((t) => t),
       };
       return repo
         ? base44.entities.SourceCode.update(repo.id, submitData)
         : base44.entities.SourceCode.create(submitData);
     },
     onSuccess: () => {
       queryClient.invalidateQueries(["sourcecode"]);
       onClose();
     },
   });

  // Prevent closing via Escape key; only the X button should close this modal
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

  // Track initial snapshot & dirty state to prompt on close
  const initialSnapshotRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    // initialize snapshot from repo when modal opens
    initialSnapshotRef.current = JSON.stringify({
      name: repo?.name || "",
      platform: repo?.platform || "github",
      url: repo?.url || "",
      description: repo?.description || "",
      tags: Array.isArray(repo?.tags) ? (repo.tags || []).join(", ") : (repo?.tags || ""),
    });
    setIsDirty(false);
  }, [repo]);

  useEffect(() => {
    try {
      const current = JSON.stringify({
        name: formData.name || "",
        platform: formData.platform || "github",
        url: formData.url || "",
        description: formData.description || "",
        tags: formData.tags || "",
      });
      setIsDirty(initialSnapshotRef.current !== current);
    } catch (e) {
      setIsDirty(false);
    }
  }, [formData]);

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

   const validateForm = () => {
     const newErrors = {};

     // Name validation
     if (!formData.name.trim()) {
       newErrors.name = "Repository name is required";
     } else if (formData.name.trim().length < 2) {
       newErrors.name = "Repository name must be at least 2 characters";
     } else if (formData.name.trim().length > 100) {
       newErrors.name = "Repository name must be less than 100 characters";
     }

     // URL validation
     if (!formData.url.trim()) {
       newErrors.url = "Repository URL is required";
     } else if (!isValidUrl(formData.url)) {
       newErrors.url = "Please enter a valid URL";
     } else if (!isValidPlatformUrl(formData.url, formData.platform)) {
       newErrors.url = `URL doesn't match the selected ${formData.platform} platform`;
     }

     // Description validation (optional but with length limits if provided)
     if (formData.description && formData.description.length > 500) {
       newErrors.description = "Description must be less than 500 characters";
     }

     // Tags validation
     if (formData.tags.trim()) {
       const tagList = formData.tags
         .split(",")
         .map(tag => tag.trim())
         .filter(tag => tag.length > 0);

       if (tagList.length > 10) {
         newErrors.tags = "Maximum 10 tags allowed";
       } else {
         // Check for duplicate tags
         const uniqueTags = new Set(tagList.map(tag => tag.toLowerCase()));
         if (uniqueTags.size !== tagList.length) {
           newErrors.tags = "Duplicate tags are not allowed";
         }

         // Check individual tag length
         const invalidTags = tagList.filter(tag => tag.length > 30);
         if (invalidTags.length > 0) {
           newErrors.tags = "Each tag must be less than 30 characters";
         }

         // Check for invalid characters in tags
         const invalidTagChars = tagList.some(tag => /[^a-zA-Z0-9\s\-_]/.test(tag));
         if (invalidTagChars) {
           newErrors.tags = "Tags can only contain letters, numbers, spaces, hyphens, and underscores";
         }
       }
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

   const isValidPlatformUrl = (url, platform) => {
     const urlLower = url.toLowerCase();
     switch (platform) {
       case "github":
         return urlLower.includes("github.com");
       case "gitlab":
         return urlLower.includes("gitlab.com");
       case "bitbucket":
         return urlLower.includes("bitbucket.org");
       case "other":
         return true; // Allow any valid URL for other platforms
       default:
         return true;
     }
   };

   const handleSubmit = (e) => {
     e.preventDefault();
     if (validateForm()) {
       mutation.mutate(formData);
     }
   };

  // Reset the form to the original repo values (do not close the modal)
  const resetForm = () => {
    setFormData({
      name: repo?.name || "",
      platform: repo?.platform || "github",
      url: repo?.url || "",
      description: repo?.description || "",
      tags: Array.isArray(repo?.tags) ? repo.tags.join(", ") : "",
    });
    setErrors({});
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-3 sm:p-4"
      onClick={() => {}} // Prevent closing by clicking outside
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white max-w-4xl w-full max-h-[95vh] overflow-y-auto rounded-lg sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
          <div className="sticky top-0 bg-[#41436A] p-3 sm:p-4 flex items-center justify-between">
          <h2 className="text-2xl font-light text-white">
            {repo && repo.id ? "Edit Repository" : "Add Repository"}
          </h2>
          <button
            onClick={requestCloseModal}
            className="p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-8 space-y-3 sm:space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:flex-[3]">
              <Label htmlFor="name" className="text-sm font-light text-[#41436A]">Repository Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => {
                  const nameErrors = {};
                  if (!formData.name.trim()) {
                    nameErrors.name = "Repository name is required";
                  } else if (formData.name.trim().length < 2) {
                    nameErrors.name = "Repository name must be at least 2 characters";
                  } else if (formData.name.trim().length > 100) {
                    nameErrors.name = "Repository name must be less than 100 characters";
                  }
                  setErrors(prev => ({ ...prev, ...nameErrors }));
                }}
                placeholder="my-project"
                className="mt-2 border-gray-300 rounded-none focus:border-[#41436A] focus:ring-2 focus:ring-[#41436A]/20"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="md:flex-[2.2]">
              <Label htmlFor="platform" className="text-sm font-light text-[#41436A]">Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => {
                  setFormData({ ...formData, platform: value });
                  // Re-validate URL when platform changes
                  if (formData.url.trim()) {
                    const urlErrors = {};
                    if (!isValidPlatformUrl(formData.url, value)) {
                      urlErrors.url = `URL doesn't match the selected ${value} platform`;
                    } else {
                      urlErrors.url = undefined;
                    }
                    setErrors(prev => ({ ...prev, ...urlErrors }));
                  }
                }}
              >
                <SelectTrigger className="mt-2 border-gray-300 rounded-none focus:border-[#41436A] focus:ring-2 focus:ring-[#41436A]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="gitlab">GitLab</SelectItem>
                  <SelectItem value="bitbucket">Bitbucket</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="url" className="text-sm font-light text-[#41436A]">Repository URL</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              onBlur={() => {
                const urlErrors = {};
                if (!formData.url.trim()) {
                  urlErrors.url = "Repository URL is required";
                } else if (!isValidUrl(formData.url)) {
                  urlErrors.url = "Please enter a valid URL";
                } else if (!isValidPlatformUrl(formData.url, formData.platform)) {
                  urlErrors.url = `URL doesn't match the selected ${formData.platform} platform`;
                }
                setErrors(prev => ({ ...prev, ...urlErrors }));
              }}
              placeholder="https://github.com/username/repo"
              className="mt-2 border-gray-300 rounded-none focus:border-[#41436A] focus:ring-2 focus:ring-[#41436A]/20"
            />
            {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-light text-[#41436A]">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              onBlur={() => {
                const descErrors = {};
                if (formData.description && formData.description.length > 500) {
                  descErrors.description = "Description must be less than 500 characters";
                }
                setErrors(prev => ({ ...prev, ...descErrors }));
              }}
              placeholder="Brief description"
              rows={3}
              className="mt-2 border-gray-300 rounded-none focus:border-[#41436A] focus:ring-2 focus:ring-[#41436A]/20"
            />
            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <Label htmlFor="tags" className="text-sm font-light text-[#41436A]">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              onBlur={() => {
                const tagErrors = {};
                if (formData.tags.trim()) {
                  const tagList = formData.tags
                    .split(",")
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);

                  if (tagList.length > 10) {
                    tagErrors.tags = "Maximum 10 tags allowed";
                  } else {
                    // Check for duplicate tags
                    const uniqueTags = new Set(tagList.map(tag => tag.toLowerCase()));
                    if (uniqueTags.size !== tagList.length) {
                      tagErrors.tags = "Duplicate tags are not allowed";
                    }

                    // Check individual tag length
                    const invalidTags = tagList.filter(tag => tag.length > 30);
                    if (invalidTags.length > 0) {
                      tagErrors.tags = "Each tag must be less than 30 characters";
                    }

                    // Check for invalid characters in tags
                    const invalidTagChars = tagList.some(tag => /[^a-zA-Z0-9\s\-_]/.test(tag));
                    if (invalidTagChars) {
                      tagErrors.tags = "Tags can only contain letters, numbers, spaces, hyphens, and underscores";
                    }
                  }
                }
                setErrors(prev => ({ ...prev, ...tagErrors }));
              }}
              placeholder="React, TypeScript, API"
              className="mt-2 border-gray-300 rounded-none focus:border-[#41436A] focus:ring-2 focus:ring-[#41436A]/20"
            />
            <p className="text-xs text-gray-500 mt-2 font-light">
              Separate tags with commas
            </p>
            {errors.tags && <p className="text-sm text-red-500 mt-1">{errors.tags}</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-3 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={requestCloseModal}
              className="px-5 py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors text-sm font-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 bg-[#984063] text-white transition-colors text-sm font-light"
            >
              {mutation.isPending
                ? (repo && repo.id ? "Saving..." : "Adding...")
                : (repo && repo.id ? "Save Changes" : "Add Repository")}
            </button>
          </div>
          <ConfirmModal
            open={!!confirmAction}
            title={confirmAction?.title}
            description={confirmAction?.description}
            confirmLabel={confirmAction?.type === "save-and-exit" ? "Save & Exit" : "Remove"}
            cancelLabel="Cancel"
            backdropBlur={confirmAction?.type === "save-and-exit" ? false : true}
            onClose={() => setConfirmAction(null)}
            onConfirm={() => {
              if (confirmAction?.type === "save-and-exit") {
                if (validateForm()) {
                  mutation.mutate(formData);
                }
              }
              setConfirmAction(null);
            }}
          />
        </form>
      </motion.div>
    </motion.div>
  );
}