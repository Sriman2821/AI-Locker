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
        group relative bg-white border border-gray-200 overflow-visible
        hover:border-[#F64668] transition-all duration-200
        h-auto sm:h-80 flex flex-col
      `}
    >

  <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between overflow-hidden">
        <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-normal text-[#41436A] mb-1 sm:mb-2 line-clamp-2">
              {material.title}
            </h3>
            {material.description && (
              <p className="text-xs sm:text-sm text-gray-500 font-light whitespace-pre-wrap max-h-24 sm:max-h-40 overflow-y-auto pr-1">
                {material.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-xs text-gray-500 font-light">
          {material.assigned_user && (
            <div className="flex items-center gap-2">
              <span className="truncate">{material.assigned_user}</span>
            </div>
          )}
          {material.session_number && (
            <div className="flex items-center gap-2">
              <span>Session {material.session_number}</span>
            </div>
          )}
          {material.date_presented && (
            <div className="flex items-center gap-2">
              <span className="text-xs">{format(new Date(material.date_presented), "MMM d")}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-2 sm:pt-4 border-t border-gray-100">
            {/* Left controls: files dropdown then small link button */}
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {material.files && material.files.length > 0 && (
                <div className="relative group">
                  <button
                    className="px-2 sm:px-3 py-1 sm:py-2 bg-[#984063] text-white hover:bg-[#F64668] transition-colors flex items-center justify-between gap-1 sm:gap-2 text-xs font-light"
                    onClick={() => {
                      setShowFilesDropdown(!showFilesDropdown);
                      if (!showFilesDropdown) setShowLinksDropdown(false);
                    }}
                  >
                    <span className="flex items-center gap-1 sm:gap-2">
                      <FileText className="w-3 sm:w-4 h-3 sm:h-4 text-white" strokeWidth={1.5} />
                      <span>({material.files.length})</span>
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showFilesDropdown ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                  </button>

                  {showFilesDropdown && (
                    <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-300 shadow-lg z-50 max-h-64 overflow-y-auto w-72">
                      {material.files.map((file, index) => {
                        const isGenericFile = (file.type || 'file') === 'file';
                        return (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={file.name || `File ${index + 1}`}
                            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-xs font-light text-[#41436A] group/item transition-colors"
                          >
                            {(() => {
                              const FileIcon = getFileTypeIcon(file.type || "file");
                              return <FileIcon className="w-3 sm:w-4 h-3 sm:h-4 text-[#984063] flex-shrink-0" strokeWidth={1.5} />;
                            })()}
                            <span className="flex-1 truncate text-xs hover:underline">{file.name || `File ${index + 1}`}</span>
                            <ExternalLink className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-gray-400 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity" strokeWidth={1.5} />
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
                        className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-2 text-xs font-light"
                        onClick={() => {
                          setShowLinksDropdown(!showLinksDropdown);
                          if (!showLinksDropdown) setShowFilesDropdown(false);
                        }}
                      >
                        <Link className="w-3 sm:w-4 h-3 sm:h-4 text-[#2B6CB0]" strokeWidth={1.5} />
                        <span>({links.length})</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showLinksDropdown ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                      </button>

                      {showLinksDropdown && (
                        <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-300 shadow-lg z-50 max-h-40 overflow-y-auto w-48 sm:w-56 md:w-64 text-xs">
                          {links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={link.url}
                              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-xs font-light text-[#41436A] group/item transition-colors"
                            >
                              <Link className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-[#2B6CB0] flex-shrink-0" strokeWidth={1.5} />
                              <span className="flex-1 truncate">{link.name || link.url}</span>
                              <ExternalLink className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-gray-400 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity" strokeWidth={1.5} />
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => window.open(links[0].url, "_blank", "noopener,noreferrer")}
                      className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-2 text-xs font-light"
                      title={links[0].url}
                    >
                      <Link className="w-3 h-3" strokeWidth={1.5} />
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
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="p-1 sm:p-2 border border-gray-300 text-[#41436A] hover:bg-gray-50 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                </button>
              )}
              {canDelete && (
                  <button
                  onClick={() => setShowConfirm(true)}
                  className="p-1 sm:p-2 border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
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