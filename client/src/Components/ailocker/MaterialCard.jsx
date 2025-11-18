import { base44 } from "@/api/productionClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import ConfirmModal from "@/Components/ui/ConfirmModal";
import ViewMaterialModal from "./ViewMaterialModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import {
  Link,
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  Presentation,
  User,
  Hash,
  Calendar,
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
  const descRef = useRef(null);
  const [showMoreBtn, setShowMoreBtn] = useState(false);
  const filesBtnRef = useRef(null);
  const linksBtnRef = useRef(null);
  const filesDropdownRef = useRef(null);
  const linksDropdownRef = useRef(null);
  const [showViewModal, setShowViewModal] = useState(false);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleDocClick = (e) => {
      const target = e.target;

      if (showFilesDropdown) {
        const outsideFiles = filesDropdownRef.current && !filesDropdownRef.current.contains(target) && filesBtnRef.current && !filesBtnRef.current.contains(target);
        if (outsideFiles) setShowFilesDropdown(false);
      }

      if (showLinksDropdown) {
        const outsideLinks = linksDropdownRef.current && !linksDropdownRef.current.contains(target) && linksBtnRef.current && !linksBtnRef.current.contains(target);
        if (outsideLinks) setShowLinksDropdown(false);
      }
    };

    if (showFilesDropdown || showLinksDropdown) {
      document.addEventListener('mousedown', handleDocClick);
      return () => document.removeEventListener('mousedown', handleDocClick);
    }
  }, [showFilesDropdown, showLinksDropdown]);

  // Detect if the truncated description is overflowing so we can show "more"
  useEffect(() => {
    const el = descRef.current;
    if (!el) {
      setShowMoreBtn(false);
      return;
    }
    const checkOverflow = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 1;
      setShowMoreBtn(hasOverflow);
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [material.description]);

  return (
    <div
      className={`
        group relative bg-white border border-gray-200
        hover:border-[#41436A] transition-all duration-200
        h-full flex flex-col
      `}
    >
      {/* Header section with title - matching Source Code card style */}
      <div className="bg-[#41436A] p-3 sm:p-2 border-b border-[#41436A]/20 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 title={material.title} className="text-base sm:text-lg font-light text-white truncate">
            {material.title}
          </h3>
        </div>
      </div>

  <div className={`p-3 sm:p-5 flex-1 flex flex-col justify-between overflow-hidden min-h-0`}>
        <div className="flex-1 min-h-0 mb-2">
          {material.description && (
            <div className="relative mb-3">
              <p ref={descRef} className="text-sm text-gray-600 line-clamp-3 font-light pr-12">
                {material.description}
              </p>
              {showMoreBtn && (
                <>
                  <div className="pointer-events-none absolute right-0 bottom-0 h-6 w-24">
                    <div className="h-full w-full bg-gradient-to-l from-white to-transparent" />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute right-0 bottom-0 text-xs text-[#984063] font-medium bg-white px-1"
                        aria-label="Show full description"
                      >
                        more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="left" align="center" className="w-80 max-h-60 overflow-y-auto">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 font-light">{material.description}</p>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          )}

          <div className="space-y-0.5 text-xs text-gray-500 font-light">
          {material.assigned_user && (
            <div className="flex items-center gap-2">
              <span title="Author" className="flex-shrink-0">
                <User className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              </span>
              <span title="Author" className="truncate">{material.assigned_user}</span>
            </div>
          )}
          {material.session_number && (
            <div className="flex items-center gap-2">
              <span title="Session" className="flex-shrink-0">
                <Hash className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              </span>
              <span title="Session">{material.session_number}</span>
            </div>
          )}
          {material.date_presented && (
            <div className="flex items-center gap-2">
              <span title="Session date" className="flex-shrink-0">
                <Calendar className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
              </span>
              <span title="Session date">{format(new Date(material.date_presented), "dd-MMM-yyyy")}</span>
            </div>
          )}
        </div>

        </div>

  <div className="flex items-center gap-2 pt-2 sm:pt-4 border-t border-gray-100">
            {/* Left controls: files and links buttons */}
            <div className="flex items-center gap-2">
              {material.files && material.files.length > 0 && (
                <div className="relative group">
                    <button
                      className="px-1 sm:px-1 py-1 h-7 border border-gray-300 text-[#41436A] flex items-center gap-0.5 text-xs font-light hover:bg-gray-100 transition-colors"
                    ref={filesBtnRef}
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
                    <div ref={filesDropdownRef} className="absolute bottom-full mb-1 bg-white border border-gray-300 shadow-lg z-50 max-h-64 overflow-y-auto w-72" style={{ left: '10px' }}>
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
                          className="px-1 sm:px-1 py-1 h-7 border border-gray-300 text-[#41436A] flex items-center gap-0.5 text-xs font-light hover:bg-gray-100 transition-colors"
                        ref={linksBtnRef}
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
                        <div ref={linksDropdownRef} className="absolute bottom-full mb-1 bg-white border border-gray-300 shadow-lg z-50 max-h-40 overflow-y-auto w-48 sm:w-56 md:w-64 text-xs" style={{ left: '-50px' }}>
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
                        className="px-1 sm:px-1 py-1 h-7 border border-gray-300 text-[#41436A] flex items-center gap-0.5 text-xs font-light hover:bg-gray-100 transition-colors"
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
            <div className="ml-auto flex-shrink-0" />

          {/* Right slot: gated by permissions */}
          {(isAdmin && (canEdit || canDelete)) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {canEdit && (
                <button
                  onClick={onEdit}
                    className="px-1 sm:px-2 py-1 h-7 border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  title="Edit"
                >
                  <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                </button>
              )}
              {canDelete && (
                  <button
                  onClick={() => setShowConfirm(true)}
                    className="px-1 sm:px-2 py-1 h-7 border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center"
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
            description="Delete this material? This action cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            backdropBlur={false}
            onClose={() => setShowConfirm(false)}
            onConfirm={() => {
              deleteMutation.mutate(material.id);
              setShowConfirm(false);
            }}
          />
        <ViewMaterialModal open={showViewModal} onClose={() => setShowViewModal(false)} material={material} />
        </div>
      </div>
    </div>
  );
}