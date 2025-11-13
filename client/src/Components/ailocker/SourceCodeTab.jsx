import { useEffect, useMemo, useState } from "react";
import { Input } from "@/Components/ui/input";
import { Search } from "lucide-react";
import { base44 } from "@/api/productionClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Gitlab, ExternalLink, Edit2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/Components/ui/badge";
import AddSourceCodeModal from "./AddSourceCodeModal";
import ConfirmModal from "@/Components/ui/ConfirmModal";

export default function SourceCodeTab({ isAdmin }) {
  const [editingRepo, setEditingRepo] = useState(null);
  const [search, setSearch] = useState("");
  const [confirmRepoDelete, setConfirmRepoDelete] = useState(null);
  const [caps, setCaps] = useState({ add: !!isAdmin, edit: !!isAdmin, delete: !!isAdmin });
  const queryClient = useQueryClient();
  const { data: repos = [] } = useQuery({
    queryKey: ["sourcecode"],
    queryFn: () => base44.entities.SourceCode.list("-created_date"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SourceCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["sourcecode"]);
    },
  });

  const filteredRepos = useMemo(() => {
    if (!search) return repos;
    const query = search.toLowerCase();
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [repos, search]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAdmin) {
        if (!cancelled) setCaps({ add: false, edit: false, delete: false });
        return;
      }
      try {
        const me = await base44.auth.me();
        const perms = me?.permissions;
        if (!cancelled) {
          if (perms && typeof perms === 'object') {
            // Global permissions
            setCaps({
              add: !!perms.add,
              edit: !!perms.edit,
              delete: !!perms.delete,
            });
          } else {
            // No granular perms => full access for admins
            setCaps({ add: true, edit: true, delete: true });
          }
        }
      } catch {
        if (!cancelled) setCaps({ add: !!isAdmin, edit: !!isAdmin, delete: !!isAdmin });
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case "github":
        return Github;
      case "gitlab":
        return Gitlab;
      default:
        return ExternalLink;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 sm:p-8 lg:p-8 overflow-x-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-light text-[#41436A] mb-1 sm:mb-2">Source Code</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-light">Repositories and source code links</p>
          </div>

          <div className="w-full sm:w-64 flex-shrink-0">
            <div className="flex items-center gap-2 justify-end">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories..."
                className="h-8 px-3 border-gray-300 rounded-none text-xs sm:text-sm w-full"
              />
              <button
                onClick={() => { /* noop - filtering is live */ }}
                className="px-2 sm:px-3 h-8 bg-[#41436A] text-white rounded flex-shrink-0 flex items-center justify-center"
                title="Search repos"
              >
                <Search className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-12">
        {filteredRepos.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="mb-4 font-light text-sm sm:text-base">No repositories found</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
            {filteredRepos.map((repo, index) => {
              const Icon = getPlatformIcon(repo.platform);

              return (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full group"
                  >
                    <div className="h-full bg-white border border-gray-200 overflow-hidden hover:border-[#41436A] transition-all relative">
                      <div className="bg-[#41436A] p-3 sm:p-4 border-b border-[#41436A]/20 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#FE9677]" strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-light text-white truncate">
                            {repo.name}
                          </h3>
                          <p className="text-[11px] text-white/70 capitalize font-light">
                            {repo.platform}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-[#FE9677] transition-colors" strokeWidth={1.5} />
                      </div>

                      <div className="p-4">
                        {repo.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2 font-light">
                            {repo.description}
                          </p>
                        )}

                        {repo.tags && repo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {repo.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-[#FE9677]/20 text-[#984063] text-sm font-light rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {isAdmin && (caps.edit || caps.delete) && (
                          <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                            {caps.edit && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingRepo(repo);
                                }}
                                className="p-1 border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                                title="Edit repository"
                              >
                                <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                              </button>
                            )}
                            {caps.delete && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (deleteMutation.isPending) return;
                                  setConfirmRepoDelete(repo);
                                }}
                                className="p-1 border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                                title="Delete repository"
                              >
                                <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </a>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmRepoDelete}
        title="Delete repository"
        description="Are you sure you want to delete this repository? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onClose={() => setConfirmRepoDelete(null)}
        onConfirm={() => {
          if (confirmRepoDelete) {
            deleteMutation.mutate(confirmRepoDelete.id || confirmRepoDelete._id || confirmRepoDelete.id);
          }
          setConfirmRepoDelete(null);
        }}
      />

      <AnimatePresence>
        {editingRepo && (
          <AddSourceCodeModal
            repo={editingRepo}
            onClose={() => setEditingRepo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}