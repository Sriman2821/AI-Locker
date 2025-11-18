import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Code2, Wrench, User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  console.log('AILocker: User state:', user);

  // Keep localStorage in sync if other parts of the app modify active tab in future
  useEffect(() => {
    try { localStorage.setItem('ai_locker_active_tab', activeTab); } catch {}
  }, [activeTab]);

  useEffect(() => {
    if (!showUserDropdown) return;
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';

  const tabs = [
    { id: "learning", label: "Learning", icon: BookOpen },
    { id: "tools", label: "Categories & Tools", icon: Wrench },
    { id: "sourcecode", label: "Source Code", icon: Code2 },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      <style>{`
        :root {
          --color-primary: #41436A;
          --color-secondary: #984063;
          --color-accent: #41436A;
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
            {user && (
              <div className="relative z-50" ref={dropdownRef}>
                <div>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="text-white/70 hover:text-white transition-colors flex items-center gap-2"
                    title="User Menu"
                  >
                    <User className="w-5 h-5" strokeWidth={1.5} title="" />
                    <span className="text-sm font-light" title="">{user?.full_name || user?.name || 'User'}</span>
                    <ChevronDown className="w-4 h-4" strokeWidth={1.5} title="" />
                  </button>
                </div>

                {showUserDropdown && user && (
                  <div className="fixed top-16 right-2 sm:right-4 w-56 max-w-xs bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[9999]">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.full_name || user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.role || 'user'}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setShowAccessManagement(true);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 border-b border-gray-200"
                      >
                        <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                        <span>Access Management</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.5} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto relative">
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