import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Code2, Wrench } from 'lucide-react';
import ShieldUser from '@/Components/ui/ShieldUser';
import { useAuth } from '../contexts/AuthContext';
import LearningTab from '@/Components/ailocker/LearningTab';
import ToolsTab from '@/Components/ailocker/ToolsTab';
import SourceCodeTab from '@/Components/ailocker/SourceCodeTab';
import AdminControls from '@/Components/ailocker/AdminControls';
import AccessManagementModal from '@/Components/ailocker/AccessManagementModal';

function AILocker() {
  console.log('AILocker: Component rendering');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Persist selected tab so a full page refresh doesn't reset to "learning"
  const initialTab = (() => {
    try {
      return localStorage.getItem('ai_locker_active_tab') || 'learning';
    } catch {
      return 'learning';
    }
  })();
  const [activeTab, _setActiveTab] = useState(initialTab);

  const setActiveTab = (tab) => {
    _setActiveTab(tab);
    try { localStorage.setItem('ai_locker_active_tab', tab); } catch {}
  };
  // page-level search inputs are handled inside each tab for better UX
  const [showAccessManagement, setShowAccessManagement] = useState(false);
  
  console.log('AILocker: User state:', user);

  // Keep localStorage in sync if other parts of the app modify active tab in future
  useEffect(() => {
    try { localStorage.setItem('ai_locker_active_tab', activeTab); } catch {}
  }, [activeTab]);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';

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
      <nav className="flex-shrink-0 bg-[#41436A] border-b border-[#41436A]/20 overflow-x-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-3 sm:py-6 gap-4 min-w-max sm:min-w-0">
          <div className="flex items-center gap-4 sm:gap-8 lg:gap-12 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-light text-white tracking-wide whitespace-nowrap">AI Locker</h1>
            
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative px-3 sm:px-6 py-2 font-light transition-all duration-200
                      flex items-center gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm
                      ${
                        activeTab === tab.id
                          ? "text-white"
                          : "text-white/50 hover:text-white/80"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    <span className="hidden sm:inline">{tab.label}</span>
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

          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            {/* User Name Display */}
            {user && (
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-light">
                  {user.full_name || user.name || 'User'}
                </p>
                <p className="text-white/70 text-xs">
                  {user.role || 'member'}
                </p>
              </div>
            )}

            {/* Access Management - Admin Only */}
            {isAdmin && (
              <button
                onClick={() => setShowAccessManagement(true)}
                className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                title="Access Management"
              >
                <ShieldUser className="w-6 sm:w-7 h-6 sm:h-7" strokeWidth={2} />
              </button>
            )}

            {/* Logout Button */}
            {user && (
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex-shrink-0 p-1.5 sm:p-2 bg-[#F64668] text-white rounded hover:bg-[#FE9677] transition-colors"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
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
            {activeTab === "learning" && <LearningTab isAdmin={isAdmin} />}
            {activeTab === "tools" && <ToolsTab isAdmin={isAdmin} />}
            {activeTab === "sourcecode" && <SourceCodeTab isAdmin={isAdmin} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Admin Controls */}
      {isLoggedIn && isAdmin && <AdminControls activeTab={activeTab} />}

      {/* Access Management Modal */}
      <AnimatePresence>
        {showAccessManagement && (
          <AccessManagementModal onClose={() => setShowAccessManagement(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AILocker;