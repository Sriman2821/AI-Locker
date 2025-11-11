import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link2,
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  Presentation,
  GripVertical,
  Edit2,
  Trash2,
  ExternalLink,
  User,
  Calendar,
  Hash,
} from "lucide-react";
import { format } from "date-fns";

export default function MaterialCard({
  material,
  isAdmin,
  dragHandleProps,
  isDragging,
  onEdit,
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Material.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["materials"]);
    },
  });

  const getTypeIcon = () => {
    switch (material.type) {
      case "link":
        return Link2;
      case "file":
        return FileText;
      case "image":
        return ImageIcon;
      case "video":
        return Video;
      case "sheet":
        return FileSpreadsheet;
      case "slide":
        return Presentation;
      case "doc":
        return FileText;
      default:
        return FileText;
    }
  };

  const Icon = getTypeIcon();
  const materialUrl = material.url || material.file_url;

  return (
    <div
      className={`
        group relative bg-white border border-gray-200 overflow-hidden
        hover:border-[#F64668] transition-all duration-200
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      {isAdmin && (
        <div
          {...dragHandleProps}
          className="absolute top-3 left-3 z-10 p-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <Icon className="w-5 h-5 text-[#984063] flex-shrink-0 mt-1" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-normal text-[#41436A] mb-2 line-clamp-2">
              {material.title}
            </h3>
            {material.description && (
              <p className="text-sm text-gray-500 line-clamp-2 font-light">
                {material.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4 text-xs text-gray-500 font-light">
          {material.assigned_user && (
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" strokeWidth={1.5} />
              <span>{material.assigned_user}</span>
            </div>
          )}
          {material.session_number && (
            <div className="flex items-center gap-2">
              <Hash className="w-3 h-3" strokeWidth={1.5} />
              <span>Session {material.session_number}</span>
            </div>
          )}
          {material.date_presented && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" strokeWidth={1.5} />
              <span>{format(new Date(material.date_presented), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-100">
          {materialUrl && (
            <a
              href={materialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-[#984063] text-white hover:bg-[#F64668] transition-colors flex items-center justify-center gap-2 text-xs font-light"
            >
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
              Open
            </a>
          )}
          {isAdmin && (
            <>
              <button
                onClick={onEdit}
                className="px-3 py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="w-3 h-3" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this material?")) {
                    deleteMutation.mutate(material.id);
                  }
                }}
                className="px-3 py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}