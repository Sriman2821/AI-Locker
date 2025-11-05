import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";

import TopicModal from "./TopicModal";
import MaterialModal from "./MaterialModal";
import MaterialCard from "./MaterialCard";

export default function LearningTab({ isAdmin, searchQuery }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const queryClient = useQueryClient();

  const { data: topics = [] } = useQuery({
    queryKey: ["topics"],
    queryFn: () => base44.entities.Topic.list("order"),
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

  const updateMaterialOrderMutation = useMutation({
    mutationFn: ({ id, order }) => base44.entities.Material.update(id, { order }),
    onSuccess: () => {
      queryClient.invalidateQueries(["materials"]);
    },
  });

  const filteredTopics = useMemo(() => {
    if (!searchQuery) return topics;
    const query = searchQuery.toLowerCase();
    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.description?.toLowerCase().includes(query)
    );
  }, [topics, searchQuery]);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return materials;
    const query = searchQuery.toLowerCase();
    return materials.filter(
      (material) =>
        material.title.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query) ||
        material.assigned_user?.toLowerCase().includes(query)
    );
  }, [materials, searchQuery]);

  useEffect(() => {
    if (filteredTopics.length > 0 && !selectedTopic) {
      setSelectedTopic(filteredTopics[0]);
    }
  }, [filteredTopics]);

  const handleDragEnd = (result) => {
    if (!result.destination || !isAdmin) return;

    const items = Array.from(filteredMaterials);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    items.forEach((item, index) => {
      if (item.order !== index) {
        updateMaterialOrderMutation.mutate({ id: item.id, order: index });
      }
    });
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Topics */}
      <div className="w-1/4 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="flex-shrink-0 p-8 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light text-[#41436A]">Topics</h2>
            {isAdmin && (
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
                    {isAdmin && (
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
                            if (confirm("Delete this topic?")) {
                              deleteTopicMutation.mutate(topic.id);
                            }
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
              <h2 className="text-3xl font-light text-[#41436A] mb-3">
                {selectedTopic.title}
              </h2>
              {selectedTopic.description && (
                <p className="text-gray-500 font-light mb-6">{selectedTopic.description}</p>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingMaterial(null);
                    setShowMaterialModal(true);
                  }}
                  className="px-5 py-2 border border-[#984063] text-[#984063] hover:bg-[#984063] hover:text-white transition-all text-sm font-light"
                >
                  Add Material
                </button>
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
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="materials">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        {filteredMaterials.map((material, index) => (
                          <Draggable
                            key={material.id}
                            draggableId={material.id}
                            index={index}
                            isDragDisabled={!isAdmin}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <MaterialCard
                                  material={material}
                                  isAdmin={isAdmin}
                                  dragHandleProps={provided.dragHandleProps}
                                  isDragging={snapshot.isDragging}
                                  onEdit={() => {
                                    setEditingMaterial(material);
                                    setShowMaterialModal(true);
                                  }}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}