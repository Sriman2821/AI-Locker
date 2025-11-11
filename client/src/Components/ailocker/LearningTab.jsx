import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/Components/ui/input";
import { base44 } from "@/api/productionClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import TopicModal from "./TopicModal";
import MaterialModal from "./MaterialModal";
import MaterialCard from "./MaterialCard";
import ConfirmModal from '@/Components/ui/ConfirmModal';

// Admin action permissions
const AdminActions = {
  ADD_TOPIC: 'ADD_TOPIC',
  EDIT_TOPIC: 'EDIT_TOPIC',
  DELETE_TOPIC: 'DELETE_TOPIC',
  ADD_MATERIAL: 'ADD_MATERIAL',
  EDIT_MATERIAL: 'EDIT_MATERIAL',
  DELETE_MATERIAL: 'DELETE_MATERIAL',
  DRAG_MATERIAL: 'DRAG_MATERIAL'
};

export default function LearningTab({ isAdmin }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [localMaterials, setLocalMaterials] = useState(null);
  const [materialCaps, setMaterialCaps] = useState({ add: !!isAdmin, edit: !!isAdmin, delete: !!isAdmin });

  const queryClient = useQueryClient();

  const { data: topics = [] } = useQuery({
    queryKey: ["topics"],
    queryFn: () => base44.entities.Topic.list("-updatedAt"),
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["materials", selectedTopic?.id],
    queryFn: () =>
      selectedTopic
        ? base44.entities.Material.filter({ topic_id: selectedTopic.id }, "order")
        : Promise.resolve([]),
    enabled: !!selectedTopic,
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id) => base44.entities.Topic.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["topics"]);
      if (selectedTopic) setSelectedTopic(null);
    },
  });

  // Order updates disabled (drag-drop removed)

  // Load current user's material capabilities
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAdmin) {
        if (!cancelled) setMaterialCaps({ add: false, edit: false, delete: false });
        return;
      }
      try {
        const me = await base44.auth.me();
        const perms = me?.permissions?.materials;
        if (!cancelled) {
          if (perms && typeof perms === 'object') {
            setMaterialCaps({
              add: !!perms.add,
              edit: !!perms.edit,
              delete: !!perms.delete,
            });
          } else {
            // No granular perms configured => full access for admins
            setMaterialCaps({ add: true, edit: true, delete: true });
          }
        }
      } catch {
        if (!cancelled) {
          setMaterialCaps({ add: !!isAdmin, edit: !!isAdmin, delete: !!isAdmin });
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const [topicSearch, setTopicSearch] = useState("");

  const filteredTopics = useMemo(() => {
    if (!topicSearch) return topics;
    const query = topicSearch.toLowerCase();
    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.description?.toLowerCase().includes(query)
    );
  }, [topics, topicSearch]);

  const [materialSearch, setMaterialSearch] = useState("");

  // Use locally ordered list if present (optimistic UI during drag)
  const sourceMaterials = materials;

  const filteredMaterials = useMemo(() => {
    if (!materialSearch) return sourceMaterials;
    const query = materialSearch.toLowerCase();
    return sourceMaterials.filter(
      (material) =>
        material.title.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query) ||
        material.assigned_user?.toLowerCase().includes(query)
    );
  }, [sourceMaterials, materialSearch]);

  useEffect(() => {
    if (filteredTopics.length > 0 && !selectedTopic) {
      setSelectedTopic(filteredTopics[0]);
    }
  }, [filteredTopics]);

  // Only show add/edit/delete controls for admin users
  const showAdminControls = isAdmin;

  // Drag-drop removed

  return (
    <div className="h-full flex">
      {/* Left Panel - Topics */}
  <div className="w-[18%] border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="flex-shrink-0 p-8 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light text-[#41436A]">Topics</h2>
            {isAdmin === true && (
              <button
                onClick={() => {
                  setEditingTopic(null);
                  setShowTopicModal(true);
                }}
                className="w-8 h-8 border border-[#41436A] text-[#41436A] hover:bg-[#41436A] hover:text-white hover:border-[#41436A] transition-all flex items-center justify-center"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <Input
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Search topics..."
                className="border-gray-300 rounded-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
              <button
                onClick={() => { /* noop - topicSearch updates filter live */ }}
                className="px-3 py-2 bg-[#41436A] text-white rounded"
                title="Search topics"
              >
                <Search className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredTopics.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-4 font-light">No topics found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTopics.map((topic) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`
                    group relative p-5 cursor-pointer transition-all
                    ${
                      selectedTopic?.id === topic.id
                        ? "bg-white border-l-2 border-[#F64668]"
                        : "hover:bg-white"
                    }
                  `}
                  onClick={() => setSelectedTopic(topic)}
                >
                    <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-normal text-[#41436A] mb-1">{topic.title}</h3>
                      {topic.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 font-light">
                          {topic.description}
                        </p>
                      )}
                    </div>
                    {isAdmin === true && (
                      <div
                        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingTopic(topic);
                            setShowTopicModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-[#F64668]"
                        >
                          <Edit2 className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmAction({
                              type: "delete-topic",
                              id: topic.id,
                              title: "Delete topic",
                              description: `Delete "${topic.title}"? This will remove all materials under this topic.`,
                            });
                          }}
                          className="p-1 text-gray-400 hover:text-[#F64668]"
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                       </div>
                     )}
                   </div>
                 </motion.div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Materials */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTopic ? (
          <>
            <div className="flex-shrink-0 p-12 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl font-light text-[#41436A] mb-3">
                    {selectedTopic.title}
                  </h2>
                  {selectedTopic.description && (
                    <p className="text-gray-500 font-light mb-6">{selectedTopic.description}</p>
                  )}
                </div>

                <div className="w-64">
                  <div className="flex items-center gap-2">
                    <Input
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      placeholder="Search materials..."
                      className="border-gray-300 rounded-none"
                    />
                    <button
                      onClick={() => { /* noop - materialSearch filters live */ }}
                      className="px-3 py-2 bg-[#41436A] text-white rounded"
                      title="Search materials"
                    >
                      <Search className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>

              {isAdmin && materialCaps.add && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setEditingMaterial(null);
                      setShowMaterialModal(true);
                    }}
                    className="px-5 py-2 border border-[#984063] text-[#984063] hover:bg-[#984063] hover:text-white transition-all text-sm font-light"
                  >
                    Add Material
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-12">
              {filteredMaterials.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <p className="mb-4 font-light">No materials found</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
                  {filteredMaterials.map((material) => (
                    <div key={String(material.id)} className="h-full">
                      <MaterialCard
                        material={material}
                        isAdmin={isAdmin}
                        canEdit={!!materialCaps.edit}
                        canDelete={!!materialCaps.delete}
                        onEdit={() => {
                          setEditingMaterial(material);
                          setShowMaterialModal(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="font-light">Select a topic</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showTopicModal && (
          <TopicModal
            topic={editingTopic}
            onClose={() => {
              setShowTopicModal(false);
              setEditingTopic(null);
            }}
          />
        )}
        {showMaterialModal && selectedTopic && (
          <MaterialModal
            material={editingMaterial}
            topicId={selectedTopic.id}
            onClose={() => {
              setShowMaterialModal(false);
              setEditingMaterial(null);
              // Clear local ordering after edits; refetch will refresh list
              setLocalMaterials(null);
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === "delete-topic") {
            deleteTopicMutation.mutate(confirmAction.id);
          } else if (confirmAction?.type === "delete-material") {
            // handled inside MaterialCard now - but keep pattern for future
          }
          setConfirmAction(null);
        }}
      />
    </div>
  );
}