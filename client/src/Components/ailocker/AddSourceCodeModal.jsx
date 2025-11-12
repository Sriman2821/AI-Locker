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
import ConfirmModal from "@/Components/ui/ConfirmModal";

export default function AddSourceCodeModal({ onClose, repo = null }) {
  const [formData, setFormData] = useState({
    name: repo?.name || "",
    platform: repo?.platform || "github",
    url: repo?.url || "",
    description: repo?.description || "",
    tags: Array.isArray(repo?.tags) ? repo.tags.join(", ") : "",
  });
  const [isDirty, setIsDirty] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const initialSnapshotRef = useRef(null);

  // Capture initial snapshot once
  useEffect(() => {
    if (initialSnapshotRef.current == null) {
      initialSnapshotRef.current = JSON.stringify({
        name: repo?.name || "",
        platform: repo?.platform || "github",
        url: repo?.url || "",
        description: repo?.description || "",
        tags: Array.isArray(repo?.tags) ? repo.tags.join(", ") : "",
      });
    }
  }, [repo]);

  // Track dirty state whenever form data changes
  useEffect(() => {
    const current = JSON.stringify(formData);
    setIsDirty(initialSnapshotRef.current !== current);
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
        onClick={requestCloseModal}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white max-w-4xl w-full max-h-[95vh] overflow-y-auto rounded-lg sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#41436A] p-8 flex items-center justify-between">
          <h2 className="text-2xl font-light text-white">
            {repo ? "Edit Repository" : "Add Repository"}
          </h2>
          <button
            onClick={requestCloseModal}
            className="p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <Label htmlFor="name" className="text-sm font-light text-[#41436A]">Repository Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my-project"
              required
              className="mt-2 border-gray-300 rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="platform" className="text-sm font-light text-[#41436A]">Platform</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData({ ...formData, platform: value })}
            >
              <SelectTrigger className="mt-2 border-gray-300 rounded-none">
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

          <div>
            <Label htmlFor="url" className="text-sm font-light text-[#41436A]">Repository URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://github.com/username/repo"
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
              placeholder="Brief description"
              rows={3}
              className="mt-2 border-gray-300 rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="tags" className="text-sm font-light text-[#41436A]">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="React, TypeScript, API"
              className="mt-2 border-gray-300 rounded-none"
            />
            <p className="text-xs text-gray-500 mt-2 font-light">
              Separate tags with commas
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
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
              className="px-5 py-2 bg-[#984063] text-white hover:bg-[#F64668] transition-colors text-sm font-light"
            >
              {mutation.isPending
                ? repo
                  ? "Saving..."
                  : "Adding..."
                : repo
                ? "Save Changes"
                : "Add Repository"}
            </button>
          </div>
        </form>
        <ConfirmModal
          open={!!confirmAction}
          title={confirmAction?.title}
          description={confirmAction?.description}
          confirmLabel={confirmAction?.type === 'save-and-exit' ? 'Save & Exit' : (confirmAction?.confirmLabel || 'Discard')}
          cancelLabel="Cancel"
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction?.type === 'save-and-exit') {
              // Save the repo (mutation's onSuccess will close)
              mutation.mutate(formData);
              setConfirmAction(null);
            } else {
              setConfirmAction(null);
            }
          }}
        />
      </motion.div>
    </motion.div>
  );
}