import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Github, Gitlab, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function SourceCodeTab({ isAdmin, searchQuery }) {
  const { data: repos = [] } = useQuery({
    queryKey: ["sourcecode"],
    queryFn: () => base44.entities.SourceCode.list("-created_date"),
  });

  const filteredRepos = useMemo(() => {
    if (!searchQuery) return repos;
    const query = searchQuery.toLowerCase();
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [repos, searchQuery]);

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
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-12">
        <h2 className="text-3xl font-light text-[#41436A] mb-2">Source Code</h2>
        <p className="text-gray-500 font-light">
          Repositories and source code links
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-12">
        {filteredRepos.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="mb-4 font-light">No repositories found</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
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
                    <div className="h-full bg-white border border-gray-200 overflow-hidden hover:border-[#F64668] transition-all">
                      <div className="bg-[#41436A] p-6 border-b border-[#41436A]/20 flex items-center gap-3">
                        <Icon className="w-5 h-5 text-[#FE9677]" strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-light text-white truncate">
                            {repo.name}
                          </h3>
                          <p className="text-xs text-white/70 capitalize font-light">
                            {repo.platform}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/50 group-hover:text-[#FE9677] transition-colors" strokeWidth={1.5} />
                      </div>

                      <div className="p-6">
                        {repo.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 font-light">
                            {repo.description}
                          </p>
                        )}

                        {repo.tags && repo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {repo.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-[#FE9677]/20 text-[#984063] text-xs font-light"
                              >
                                {tag}
                              </span>
                            ))}
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
    </div>
  );
}