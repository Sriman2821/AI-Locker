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
import DescriptionModal from './DescriptionModal';

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
  const [topicCaps, setTopicCaps] = useState({ add: !!isAdmin, edit: !!isAdmin, delete: !!isAdmin });
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [descriptionModalText, setDescriptionModalText] = useState("");
  const [descriptionModalTitle, setDescriptionModalTitle] = useState("Description");

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

  // Load current user's capabilities (global permissions)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAdmin) {
        if (!cancelled) {
          setMaterialCaps({ add: false, edit: false, delete: false });
          setTopicCaps({ add: false, edit: false, delete: false });
        }
        return;
      }
      try {
        const me = await base44.auth.me();
        const perms = me?.permissions;
        if (!cancelled) {
          if (perms && typeof perms === 'object') {
            // Global permissions: add, edit, delete
            const caps = {
              add: !!perms.add,
              edit: !!perms.edit,
              delete: !!perms.delete,
            };
            setMaterialCaps(caps);
            setTopicCaps(caps);
          } else {
            // No granular perms configured => full access for admins
            setMaterialCaps({ add: true, edit: true, delete: true });
            setTopicCaps({ add: true, edit: true, delete: true });
          }
        }
      } catch {
        if (!cancelled) {
          setMaterialCaps({ add: !!isAdmin, edit: !!isAdmin, delete: !!isAdmin });
          setTopicCaps({ add: !!isAdmin, edit: !!isAdmin, delete: !!isAdmin });
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
    <div className="h-full flex flex-col md:flex-row">
      {/* Left Panel - Topics */}
  <div className="w-full md:w-[22%] lg:w-[19%] border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="flex-shrink-0 p-4 sm:p-8 lg:p-5 border-b border-gray-200 bg-white min-h-[68px] sm:min-h-[96px] overflow-visible">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base lg:text-3xl font-light text-[#41436A]">Topics</h2>
            {isAdmin && topicCaps.add && (
              <div title="Add topic">
                <button
                  onClick={() => {
                    setEditingTopic(null);
                    setShowTopicModal(true);
                  }}
                  className="w-8 h-8 sm:w-8 sm:h-8 border text-white bg-[#984063] transition-all flex items-center justify-center"
                  title=""
                >
                  <Plus className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} title="" />
                </button>
              </div>
            )}
          </div>
          
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="mb-3">
            <div className="flex items-center gap-2 w-full">
              <Input
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Search topics..."
                className="h-8 px-3 border-gray-300 rounded-none text-xs sm:text-sm w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
              <button
                onClick={() => { /* noop - topicSearch updates filter live */ }}
                className="px-3 h-8 bg-[#41436A] text-white rounded flex items-center justify-center"
              >
                <Search className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {filteredTopics.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-4 font-light text-sm sm:text-base">No topics found</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredTopics.map((topic) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`
                    group relative p-3 sm:p-3 cursor-pointer transition-all
                    ${
                      selectedTopic?.id === topic.id
                        ? "bg-white border-l-2 border-[#41436A]"
                        : "hover:bg-white"
                    }
                  `}
                  onClick={() => setSelectedTopic(topic)}
                >
                    <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 title={topic.title} className="font-normal text-base sm:text-lg text-[#41436A] mb-1 truncate">{topic.title}</h3>
                      {topic.description && (
                        <div className="mt-0.5">
                          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 font-light">
                            {topic.description}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDescriptionModalTitle(topic.title);
                              setDescriptionModalText(topic.description);
                              setShowDescriptionModal(true);
                            }}
                            className="mt-1 text-[11px] sm:text-xs text-[#984063] hover:underline"
                          >
                            More
                          </button>
                        </div>
                      )}
                    </div>
                    {isAdmin === true && (topicCaps.edit || topicCaps.delete) && (
                      <div
                        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {topicCaps.edit && (
                          <button
                            onClick={() => {
                              setEditingTopic(topic);
                              setShowTopicModal(true);
                            }}
                            className="p-1 sm:p-2 border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                          </button>
                        )}
                        {topicCaps.delete && (
                          <button
                            onClick={() => {
                              setConfirmAction({
                                type: "delete-topic",
                                id: topic.id,
                                title: "Delete topic",
                                description: `Delete "${topic.title}"? This will remove all materials under this topic.`,
                              });
                            }}
                            className="p-1 sm:p-2 border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                          </button>
                        )}
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
            <div className="flex-shrink-0 p-4 sm:p-8 lg:p-6 border-b border-gray-200 bg-white min-h-[68px] sm:min-h-[96px]">
              <div className="flex items-center justify-between gap-4 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-light text-[#41436A] mb-0">
                    {selectedTopic.title}
                  </h2>
                  {selectedTopic.description && (
                    <div className="mt-1">
                      <p className="text-xs sm:text-sm text-gray-500 font-light line-clamp-3">{selectedTopic.description}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDescriptionModalTitle(selectedTopic.title);
                          setDescriptionModalText(selectedTopic.description);
                          setShowDescriptionModal(true);
                        }}
                        className="mt-1 text-[11px] sm:text-xs text-[#984063] hover:underline"
                      >
                        More
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-96">
                  {isAdmin && materialCaps.add && (
                    <button
                      onClick={() => {
                        setEditingMaterial(null);
                        setShowMaterialModal(true);
                      }}
                      className="h-8 px-3 bg-[#984063] text-white inline-flex items-center gap-3 whitespace-nowrap rounded flex-shrink-0 mr-2"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={1.5} />
                      <span className="text-sm">Add Material</span>
                    </button>
                  )}
                  <Input
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Search materials..."
                    className="h-8 px-3 border-gray-300 rounded-none text-sm w-full"
                  />
                  <button
                    onClick={() => { /* noop - materialSearch filters live */ }}
                    className="px-2 sm:px-3 h-8 bg-[#41436A] text-white rounded flex-shrink-0 flex items-center justify-center"
                  >
                    <Search className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-9">
              {filteredMaterials.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <p className="mb-4 font-light text-sm sm:text-base">No materials found</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 items-stretch">
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
            onCreated={(newTopic) => {
              // when a new topic is created, select it and close the modal
              setSelectedTopic(newTopic);
              setShowTopicModal(false);
              setEditingTopic(null);
            }}
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
        backdropBlur={confirmAction?.type !== "delete-material"}
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
      <DescriptionModal
        open={showDescriptionModal}
        text={descriptionModalText}
        title={descriptionModalTitle}
        onClose={() => setShowDescriptionModal(false)}
      />
    </div>
  );
}