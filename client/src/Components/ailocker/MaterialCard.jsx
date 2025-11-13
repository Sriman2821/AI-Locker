import { base44 } from "@/api/productionClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ConfirmModal from "@/Components/ui/ConfirmModal";
import {
  Link,
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  Presentation,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";

export default function MaterialCard({
  material,
  isAdmin,
  canEdit,
  canDelete,
  onEdit,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFilesDropdown, setShowFilesDropdown] = useState(false);
  const [showLinksDropdown, setShowLinksDropdown] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Material.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["materials"]);
    },
  });

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case "link":
        return Link;
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
      case "file":
      default:
        return FileText;
    }
  };

  const links = (material.links && material.links.length) ? material.links : (material.url ? [{ url: material.url, name: material.url }] : []);

  return (
    <div
      className={`
        group relative bg-white border border-gray-200 overflow-hidden
        hover:border-[#41436A] transition-all duration-200
  h-auto sm:h-[17rem] flex flex-col
      `}
    >
      {/* Header section with title - matching Source Code card style */}
      <div className="bg-[#41436A] p-3 sm:p-4 border-b border-[#41436A]/20 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 title={material.title} className="text-base sm:text-lg font-light text-white truncate">
            {material.title}
          </h3>
        </div>
      </div>

  <div className="p-3 sm:p-3 flex-1 flex flex-col justify-between overflow-hidden">
        {material.description && (
          <p className="text-sm text-gray-600 mb-1 line-clamp-7 font-light">
            {material.description}
          </p>
        )}

        <div className="space-y-0.5 mb-2 text-xs text-gray-500 font-light">
          {material.assigned_user && (
            <div className="flex items-center gap-1">
              <span className="whitespace-nowrap">Author :</span>
              <span className="truncate">{material.assigned_user}</span>
            </div>
          )}
          {material.session_number && (
            <div className="flex items-center gap-1">
              <span className="whitespace-nowrap">Session :</span>
              <span>{material.session_number}</span>
            </div>
          )}
          {material.date_presented && (
            <div className="flex items-center gap-1">
              <span className="whitespace-nowrap">Session Date :</span>
              <span>{format(new Date(material.date_presented), "dd-MMM-yyyy")}</span>
            </div>
          )}
        </div>

  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-3 border-t border-gray-100">
            {/* Left controls: files and links buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {material.files && material.files.length > 0 && (
                <div className="relative group">
                    <button
                      className="px-1 sm:px-2 py-1 h-7 border border-gray-300 text-[#41436A] transition-all flex items-center gap-1 text-xs font-light"
                    onClick={() => {
                      setShowFilesDropdown(!showFilesDropdown);
                      if (!showFilesDropdown) setShowLinksDropdown(false);
                    }}
                  >
                    <FileText className="w-4 h-4 text-[#984063]" strokeWidth={1.5} />
                    <span>({material.files.length})</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showFilesDropdown ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                  </button>

                  {showFilesDropdown && (
                    <div className="absolute bottom-full mb-1 bg-white border border-gray-300 shadow-lg z-50 max-h-64 overflow-y-auto w-72" style={{ left: '10px' }}>
                      {material.files.map((file, index) => {
                        const isGenericFile = (file.type || 'file') === 'file';
                        return (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={file.name || `File ${index + 1}`}
                            className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-b-0 text-xs font-light text-[#41436A] hover:bg-gray-50 group/item transition-colors"
                          >
                            {(() => {
                              const FileIcon = getFileTypeIcon(file.type || "file");
                              return <FileIcon className="w-4 h-4 text-[#984063] flex-shrink-0" strokeWidth={1.5} />;
                            })()}
                            <span className="flex-1 truncate text-xs hover:underline">{file.name || `File ${index + 1}`}</span>
                            <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity" strokeWidth={1.5} />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {links && links.length > 0 && (
                <div className="relative group">
                  {links.length > 1 ? (
                    <>
                        <button
                          className="px-1 sm:px-2 py-1 h-7 border border-gray-300 text-[#41436A] transition-all flex items-center gap-1 text-xs font-light"
                        onClick={() => {
                          setShowLinksDropdown(!showLinksDropdown);
                          if (!showLinksDropdown) setShowFilesDropdown(false);
                        }}
                      >
                        <Link className="w-4 h-4 text-[#984063]" strokeWidth={1.5} />
                        <span>({links.length})</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showLinksDropdown ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                      </button>

                      {showLinksDropdown && (
                        <div className="absolute bottom-full mb-1 bg-white border border-gray-300 shadow-lg z-50 max-h-40 overflow-y-auto w-48 sm:w-56 md:w-64 text-xs" style={{ left: '-50px' }}>
                          {links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={link.url}
                                className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-b-0 text-xs font-light text-[#41436A] hover:bg-gray-50 group/item transition-colors"
                            >
                              <Link className="w-4 h-4 text-[#984063] flex-shrink-0" strokeWidth={1.5} />
                              <span className="flex-1 truncate">{link.name || link.url}</span>
                              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity" strokeWidth={1.5} />
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                        type="button"
                        onClick={() => window.open(links[0].url, "_blank", "noopener,noreferrer")}
                        className="px-1 sm:px-2 py-1 h-7 border border-gray-300 text-[#41436A] hover:border-[#41436A] transition-all flex items-center gap-1 text-xs font-light"
                        title={links[0].url}
                      >
                      <Link className="w-4 h-4 text-[#984063]" strokeWidth={1.5} />
                      <span>(1)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Spacer pushes edit/delete to the right */}
            <div className="flex-1 min-w-2" />

          {/* Right slot: gated by permissions */}
          {(isAdmin && (canEdit || canDelete)) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {canEdit && (
                <button
                  onClick={onEdit}
                    className="px-2 py-1 h-8 border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  title="Edit"
                >
                  <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                </button>
              )}
              {canDelete && (
                  <button
                  onClick={() => setShowConfirm(true)}
                    className="px-2 py-1 h-8 border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  title="Delete"
                >
                  <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}

          <ConfirmModal
            open={showConfirm}
            title="Delete material"
            description="Are you sure you want to delete this material? This action cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onClose={() => setShowConfirm(false)}
            onConfirm={() => {
              deleteMutation.mutate(material.id);
              setShowConfirm(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}