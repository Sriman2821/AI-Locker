import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Wrench, Code2, Search, X, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

import LearningTab from "../components/ailocker/LearningTab";
import ToolsTab from "../components/ailocker/ToolsTab";
import SourceCodeTab from "../components/ailocker/SourceCodeTab";
import AdminControls from "../components/ailocker/AdminControls";
import AccessManagementModal from "../components/ailocker/AccessManagementModal";

export default function AILocker() {
  const [activeTab, setActiveTab] = useState("learning");
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showAccessManagement, setShowAccessManagement] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const isLoggedIn = !!user;

  const tabs = [
    { id: "learning", label: "Learning", icon: BookOpen },
    { id: "tools", label: "Tools", icon: Wrench },
    { id: "sourcecode", label: "Source Code", icon: Code2 },
  ];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
      <style>{`
        :root {
          --color-primary: #41436A;
          --color-secondary: #984063;
          --color-accent: #F64668;
          --color-highlight: #FE9677;
        }
      `}</style>

      {/* Minimalist Top Navigation */}
      <nav className="flex-shrink-0 bg-[#41436A] border-b border-[#41436A]/20">
        <div className="flex items-center justify-between px-12 py-6">
          <div className="flex items-center gap-12">
            <h1 className="text-2xl font-light text-white tracking-wide">AI Locker</h1>
            
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative px-6 py-2 font-light transition-all duration-200
                      flex items-center gap-2
                      ${
                        activeTab === tab.id
                          ? "text-white"
                          : "text-white/50 hover:text-white/80"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FE9677]"
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative">
              {showSearch ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 300, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:border-[#FE9677] rounded-none h-9"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="text-white/50 hover:text-white"
                  >
                    <X className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </motion.div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <Search className="w-5 h-5" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Access Management */}
            {user && (
              <button
                onClick={() => setShowAccessManagement(true)}
                className="text-white/50 hover:text-white transition-colors"
                title="Access Management"
              >
                <Settings className="w-5 h-5" strokeWidth={1.5} />
              </button>
            )}

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FE9677] flex items-center justify-center">
                  <span className="text-[#41436A] text-xs font-light">
                    {user.full_name?.[0] || user.email[0].toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            {!user && (
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="text-sm text-white hover:text-[#FE9677] transition-colors font-light"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "learning" && <LearningTab isAdmin={isLoggedIn} searchQuery={searchQuery} />}
            {activeTab === "tools" && <ToolsTab isAdmin={isLoggedIn} searchQuery={searchQuery} />}
            {activeTab === "sourcecode" && <SourceCodeTab isAdmin={isLoggedIn} searchQuery={searchQuery} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Admin Controls */}
      {isLoggedIn && <AdminControls activeTab={activeTab} />}

      {/* Access Management Modal */}
      <AnimatePresence>
        {showAccessManagement && (
          <AccessManagementModal onClose={() => setShowAccessManagement(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}