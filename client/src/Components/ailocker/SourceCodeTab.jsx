import { useEffect, useMemo, useState, useRef } from "react";
import { Input } from "@/Components/ui/input";
import { Search } from "lucide-react";
import { base44 } from "@/api/productionClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Gitlab, ExternalLink, Edit2, Trash2, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/Components/ui/badge";
import AddSourceCodeModal from "./AddSourceCodeModal";
import ConfirmModal from "@/Components/ui/ConfirmModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";

// Separate component for each repository card to avoid hooks inside map
function RepoCard({ repo, index, isAdmin, caps, setEditingRepo, setConfirmRepoDelete, getPlatformIcon }) {
  const Icon = getPlatformIcon(repo.platform);
  const [showMore, setShowMore] = useState(false);
  const descRef = useRef(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const checkOverflow = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 1;
      setShowMore(hasOverflow);
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [repo.description]);

  return (
    <motion.div
      key={repo.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="h-full bg-white border border-gray-200 overflow-hidden hover:border-[#41436A] transition-all relative flex flex-col">
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="bg-[#41436A] p-3 sm:p-2 border-b border-[#41436A]/20 flex items-center gap-2">
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
        </a>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            {repo.description && (
              <div className="relative mb-2">
                <p ref={descRef} className="text-sm text-gray-600 line-clamp-3 font-light pr-12">
                  {repo.description}
                </p>
                {showMore && (
                  <>
                    <div className="pointer-events-none absolute right-0 bottom-0 h-6 w-24">
                      <div className="h-full w-full bg-gradient-to-l from-white to-transparent" />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 bottom-0 text-xs text-[#984063] font-medium bg-white px-1"
                          aria-label="Show full description"
                        >
                          more
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="top" align="center" alignOffset={-24} className="w-80 max-h-60 overflow-y-auto">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 font-light">{repo.description}</p>
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-2">
            {repo.tags && repo.tags.length > 0 && (
              <div className="flex flex-nowrap gap-2 overflow-hidden">
                {repo.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#FE9677]/20 text-[#984063] text-sm font-light rounded flex-shrink-0"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

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
    </motion.div>
  );
}

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
      <div className="flex-shrink-0 p-4 sm:p-8 lg:p-6 border-b border-gray-200 bg-white min-h-[68px] sm:min-h-[96px]">
        <div className="flex items-center justify-between gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-light text-[#41436A] mb-0">Source Code</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-light mt-1 line-clamp-2">Repositories and source code links</p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-[28rem]">
            {caps.add && (
              <button
                type="button"
                onClick={() => setEditingRepo({})}
                className="h-8 px-3 bg-[#984063] text-white inline-flex items-center gap-3 whitespace-nowrap rounded flex-shrink-0 mr-2"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={1.5} />
                <span className="text-sm">Add Repository</span>
              </button>
            )}

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories..."
              className="h-8 px-3 border-gray-300 rounded-none text-sm flex-1"
            />
            <button
              onClick={() => { /* noop - filtering is live */ }}
              className="px-2 sm:px-3 h-8 bg-[#41436A] text-white rounded flex-shrink-0 flex items-center justify-center"
            >
              <Search className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
            </button>
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
            {filteredRepos.map((repo, index) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                index={index}
                isAdmin={isAdmin}
                caps={caps}
                setEditingRepo={setEditingRepo}
                setConfirmRepoDelete={setConfirmRepoDelete}
                getPlatformIcon={getPlatformIcon}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmRepoDelete}
        title="Delete repository"
        description="Are you sure you want to delete this repository? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        overlayClosable={false}
        escapeClosable={false}
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