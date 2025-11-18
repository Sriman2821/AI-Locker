import { format } from "date-fns";
import { X, ExternalLink } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export default function ViewMaterialModal({ open, onClose, material }) {
  if (!open) return null;

  useBodyScrollLock(true);

  const links = (material.links && material.links.length) ? material.links : (material.url ? [{ url: material.url, name: material.url }] : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg">
        <div className="sticky top-0 bg-[#41436A] p-3 sm:p-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-light text-white">{material.title}</h2>
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/10 transition-colors">
            <X className="w-4 sm:w-5 h-4 sm:h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-3 text-sm text-gray-700">
          {material.description ? (
            <p className="whitespace-pre-wrap">{material.description}</p>
          ) : (
            <p className="text-gray-500">No description available.</p>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            {material.assigned_user && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Author:</span>
                <span>{material.assigned_user}</span>
              </div>
            )}
            {material.session_number && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Session:</span>
                <span>{material.session_number}</span>
              </div>
            )}
            {material.date_presented && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Session Date:</span>
                <span>{format(new Date(material.date_presented), "dd-MMM-yyyy")}</span>
              </div>
            )}
          </div>

          {material.files && material.files.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-sm font-medium text-[#41436A] mb-2">Files</h4>
              <div className="space-y-2">
                {material.files.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#41436A] hover:underline">
                    <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                    <span className="truncate">{f.name || `File ${i + 1}`}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {links && links.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-sm font-medium text-[#41436A] mb-2">Links</h4>
              <div className="space-y-2">
                {links.map((l, idx) => (
                  <a key={idx} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#41436A] hover:underline">
                    <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                    <span className="truncate">{l.name || l.url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
