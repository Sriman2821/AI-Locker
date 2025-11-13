import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/productionClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Mail, Shield, User as UserIcon, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

export default function AccessManagementModal({ onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const [roleError, setRoleError] = useState("");
  const [pendingChange, setPendingChange] = useState(null);
  const [pendingPermissions, setPendingPermissions] = useState({}); // Track permission changes before save
  const [showWarning, setShowWarning] = useState(false);
  const [newAdminReminder, setNewAdminReminder] = useState(null); // Track newly promoted admin
  const permsRef = useRef(null);
  const [highlightPermissions, setHighlightPermissions] = useState(false);
  const [highlightColor, setHighlightColor] = useState(null); // 'blue' | 'red' | null


  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("-created_date"),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, role }) =>
      base44.entities.User.update(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }) => 
      base44.entities.User.update(userId, { permissions }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["users"]);
      setPendingPermissions({}); // Clear pending changes after successful save
      setRoleError(''); // Clear global error after successful save
      setHighlightPermissions(false);
      setHighlightColor(null);
      // Clear reminder if we just saved permissions for the newly promoted admin
      if (newAdminReminder?.userId === variables.userId) {
        setNewAdminReminder(null);
      }
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name || user.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initiate role change flow. For any role change (promotion or demotion)
  // we show an in-app confirmation UI so the confirmation message comes from
  // the website instead of the browser confirm().
  const initiateRoleChange = (user, newRole) => {
    if (user.role === newRole) return;
  setPendingChange({ userId: user.id, newRole, userName: user.full_name || user.name || user.email });
    setRoleError("");
  };

  const confirmPendingChange = () => {
    if (!pendingChange) return;
    const { userId, newRole, userName } = pendingChange;
    updateUserMutation.mutate(
      { userId, role: newRole },
      {
        onSuccess: () => {
          setRoleError("");
          setPendingChange(null);
          // Show reminder when promoting to admin (treat all as new admin promotion)
          if (newRole === 'admin') {
            // Initialize permissions as all unchecked for newly promoted admin
            const emptyPerms = { add: false, edit: false, delete: false };
            // Do NOT persist immediately — show unchecked boxes in UI and require
            // the seed admin to click "Save Changes" to persist permissions.
            setPendingPermissions(prev => ({ ...prev, [userId]: emptyPerms }));
            setNewAdminReminder({ userId, userName });
            // Highlight the permissions area in blue to indicate newly promoted admin
            setHighlightPermissions(true);
            setHighlightColor('blue');
          } else if (newRole === 'user') {
            // Clear permissions when demoting to user and remove any pending changes
            updatePermissionsMutation.mutate({ userId, permissions: null });
            setPendingPermissions(prev => {
              const copy = { ...prev };
              delete copy[userId];
              return copy;
            });
            // If the demoted user was the one we were reminding about, clear it
            if (newAdminReminder?.userId === userId) setNewAdminReminder(null);
          }
        },
        onError: (err) => {
          const msg = err?.message || (err?.response?.data?.message) || 'Failed to update user role';
          setRoleError(msg);
          setPendingChange(null);
        }
      }
    );
  };

  const cancelPendingChange = () => setPendingChange(null);

  // Helper to check if there's a newly promoted admin without permissions
  const hasUnsavedNewAdmin = () => {
    if (!newAdminReminder) return false;
    const newAdmin = users.find(u => u.id === newAdminReminder.userId);
    if (!newAdmin) return false;
    
    // Check if there are pending permissions with at least one enabled
    const pending = pendingPermissions[newAdmin.id];
    if (!pending) return true; // No pending permissions set yet
    // Check if at least one permission is true
    return !(pending.add || pending.edit || pending.delete);
  };

  // Helper to check if any admin has no permissions
  const hasAdminWithoutPermissions = () => {
    const admins = users.filter(u => u.role === 'admin' && !u.is_seed);
    for (const admin of admins) {
      const perms = pendingPermissions[admin.id] !== undefined ? pendingPermissions[admin.id] : (admin.permissions || {});
      if (!perms.add && !perms.edit && !perms.delete) {
        return true;
      }
    }
    return false;
  };

  const handleClose = () => {
    // If a newly promoted admin exists without permissions, show the global error and prevent closing
    if (hasUnsavedNewAdmin()) {
      setRoleError('Every admin must have at least one permission. Please configure permissions before closing.');
      // Change highlight to red and scroll into view to indicate blocking error
      setHighlightPermissions(true);
      setHighlightColor('red');
      if (permsRef.current) permsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { setHighlightPermissions(false); setHighlightColor(null); }, 2500);
      return; // Prevent close
    }

    // Prevent closing if any existing admin has no permissions
    if (hasAdminWithoutPermissions()) {
      setRoleError('Every admin must have at least one permission. Please configure permissions before closing.');
      // Change highlight to red and scroll into view to indicate blocking error
      setHighlightPermissions(true);
      setHighlightColor('red');
      if (permsRef.current) permsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { setHighlightPermissions(false); setHighlightColor(null); }, 2500);
      return; // Prevent close
    }

    // If there are pending permission edits (not the new-admin case), ask whether to save
    if (Object.keys(pendingPermissions).length > 0) {
      setShowWarning(true);
      return; // Prevent closing until decision is made
    }

    // Clear any previous role error and allow close
    setRoleError('');
    onClose();
  };

  const confirmClose = () => {
    setPendingPermissions({});
    setNewAdminReminder(null);
    setHighlightPermissions(false);
    setHighlightColor(null);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#41436A]/20 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Always call handleClose which will show warning if needed
        handleClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#41436A] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-light text-white">Access Management</h2>
          <button
            onClick={handleClose}
            disabled={hasUnsavedNewAdmin() || hasAdminWithoutPermissions()}
            className={`p-1.5 transition-colors rounded ${
              hasUnsavedNewAdmin() || hasAdminWithoutPermissions()
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          {pendingChange && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 text-xs rounded">
              <div className="flex items-center justify-between gap-4">
                <span>
                  {pendingChange.newRole === 'admin' ? (
                    <>Grant admin access to <strong>{pendingChange.userName}</strong>?</>
                  ) : (
                    <>Revoke admin access from <strong>{pendingChange.userName}</strong>?</>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={confirmPendingChange}
                    className="px-2 py-1 text-xs bg-[#41436A] text-white rounded transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={cancelPendingChange}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10 border-gray-300 h-9 text-sm"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400 font-light">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400 font-light">No users found</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-[#41436A]">User</th>
                    <th className="text-left py-2 px-3 font-medium text-[#41436A]">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-[#41436A]">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#FE9677]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#984063] text-[10px] font-medium">
                              {(user.full_name || user.name || user.email)[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#41436A]">
                              {user.full_name || user.name || "No name"}
                            </span>
                            {user.id === currentUser?.id && (
                              <span className="px-1.5 py-0.5 bg-[#FE9677]/20 text-[#984063] text-[9px] font-medium">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{user.email}</td>
                      <td className="py-2 px-3">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => initiateRoleChange(user, newRole)}
                          disabled={user.id === currentUser?.id || !currentUser?.is_seed}
                        >
                          <SelectTrigger className="w-20 border-gray-300 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            {!user.is_seed && <SelectItem value="user">User</SelectItem>}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Capabilities Editor (admins only) */}
        <div ref={permsRef} className={`p-4 border-t ${highlightColor === 'red' ? 'border-red-300' : 'border-gray-200'} bg-gray-50 ${highlightPermissions ? (highlightColor === 'blue' ? 'ring-2 ring-blue-400/50 rounded-md' : 'ring-2 ring-red-400/50 rounded-md') : ''}`}>
          <h3 className="text-sm font-medium text-[#41436A] mb-3">Admin Permissions</h3>
          
          {roleError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-300 text-xs rounded">
              <span className="text-red-800 font-medium">
                {roleError}
              </span>
            </div>
          )}
          
          {newAdminReminder && !showWarning && !roleError && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 text-xs rounded">
              <span className="text-blue-800">
                <strong>{newAdminReminder.userName}</strong> has been promoted to admin. Please set their permissions below and click "Save Changes".
              </span>
            </div>
          )}
          
          {showWarning && !hasUnsavedNewAdmin() && !roleError && (
            <div className="mb-3 p-3 bg-orange-50 border border-orange-200 text-xs rounded">
              <div className="flex items-center justify-between gap-4">
                <span className="text-orange-800">
                  You have unsaved permission changes. Do you want to save before closing?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      // Save all pending permissions
                      for (const [userId, permissions] of Object.entries(pendingPermissions)) {
                        await updatePermissionsMutation.mutateAsync({ userId, permissions });
                      }
                      // Close after save completes
                      onClose();
                    }}
                    disabled={updatePermissionsMutation.isLoading}
                    className="px-2 py-1 text-xs bg-[#41436A] text-white rounded transition-colors disabled:opacity-50"
                  >
                    {updatePermissionsMutation.isLoading ? 'Saving...' : 'Save & Exit'}
                  </button>
                  <button
                    onClick={() => setShowWarning(false)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}          <div className="space-y-2">
            {filteredUsers.filter(u => u.role === 'admin').map((user) => {
              const perms = pendingPermissions[user.id] !== undefined ? pendingPermissions[user.id] : (user.permissions || {});
              const canEditPerms = currentUser?.is_seed && user.id !== currentUser?.id && !user.is_seed;
              const hasFullAccess = !user.permissions && !user.is_seed; // null permissions = full access
              const hasChanges = pendingPermissions[user.id] !== undefined;
              const hasNoPermissions = !user.is_seed && (!perms.add && !perms.edit && !perms.delete);

              const isHighlightedAdmin = highlightPermissions && highlightColor === 'blue' && newAdminReminder?.userId === user.id;
              const isErrorHighlightedAdmin = highlightPermissions && highlightColor === 'red' && hasNoPermissions;
              const cardClass = isErrorHighlightedAdmin
                ? 'border-red-400 border-2 bg-red-50'
                : isHighlightedAdmin
                ? 'border-blue-400 border-2 bg-blue-50'
                : hasNoPermissions
                ? 'border-red-400 border-2 bg-red-50'
                : 'border-gray-200';

              return (
                <div key={`perms-${user.id}`} className={`p-3 bg-white border relative ${cardClass}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs text-[#41436A]">
                      <span className="font-medium">{user.full_name || user.name || user.email}</span>
                      {user.is_seed && (
                        <span className="ml-2 text-[#984063]">(Seed Admin)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.is_seed || !!perms.add}
                            disabled={!canEditPerms || user.is_seed}
                            onChange={(e) => {
                              const newPerms = {
                                add: e.target.checked,
                                edit: perms.edit !== undefined ? perms.edit : false,
                                delete: perms.delete !== undefined ? perms.delete : false
                              };
                              setPendingPermissions(prev => ({
                                ...prev,
                                [user.id]: newPerms
                              }));
                              // Check if all permissions are now false
                              if (!newPerms.add && !newPerms.edit && !newPerms.delete) {
                                setRoleError('Every admin must have at least one permission. Please configure permissions before closing.');
                              } else {
                                setRoleError('');
                                setHighlightPermissions(false);
                                setHighlightColor(null);
                              }
                            }}
                            className="w-3.5 h-3.5"
                          />
                          <span>Add</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.is_seed || !!perms.edit}
                            disabled={!canEditPerms || user.is_seed}
                            onChange={(e) => {
                              const newPerms = {
                                add: perms.add !== undefined ? perms.add : false,
                                edit: e.target.checked,
                                delete: perms.delete !== undefined ? perms.delete : false
                              };
                              setPendingPermissions(prev => ({
                                ...prev,
                                [user.id]: newPerms
                              }));
                              // Check if all permissions are now false
                              if (!newPerms.add && !newPerms.edit && !newPerms.delete) {
                                setRoleError('Every admin must have at least one permission. Please configure permissions before closing.');
                              } else {
                                setRoleError('');
                                setHighlightPermissions(false);
                                setHighlightColor(null);
                              }
                            }}
                            className="w-3.5 h-3.5"
                          />
                          <span>Edit</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.is_seed || !!perms.delete}
                            disabled={!canEditPerms || user.is_seed}
                            onChange={(e) => {
                              const newPerms = {
                                add: perms.add !== undefined ? perms.add : false,
                                edit: perms.edit !== undefined ? perms.edit : false,
                                delete: e.target.checked
                              };
                              setPendingPermissions(prev => ({
                                ...prev,
                                [user.id]: newPerms
                              }));
                              // Check if all permissions are now false
                              if (!newPerms.add && !newPerms.edit && !newPerms.delete) {
                                setRoleError('Every admin must have at least one permission. Please configure permissions before closing.');
                              } else {
                                setRoleError('');
                                setHighlightPermissions(false);
                                setHighlightColor(null);
                              }
                            }}
                            className="w-3.5 h-3.5"
                          />
                          <span>Delete</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* Per-admin inline error removed — global error shown above the admin list */}
                  {!canEditPerms && !user.is_seed && (
                    <p className="text-[10px] text-gray-500 mt-2">
                      Only seed admin can edit permissions
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Save Button */}
          {Object.keys(pendingPermissions).length > 0 && (
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setPendingPermissions({});
                  // Don't clear newAdminReminder here - they still need to set permissions
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Validate: ensure all admins have at least one permission
                  for (const [userId, permissions] of Object.entries(pendingPermissions)) {
                    if (!permissions.add && !permissions.edit && !permissions.delete) {
                      setRoleError('Every admin must have at least one permission. Please configure permissions before closing.');
                      return;
                    }
                  }
                  
                  setRoleError(''); // Clear any previous errors
                  Object.entries(pendingPermissions).forEach(([userId, permissions]) => {
                    updatePermissionsMutation.mutate({ userId, permissions });
                  });
                }}
                disabled={updatePermissionsMutation.isLoading}
                className="px-4 py-2 text-sm bg-[#41436A] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatePermissionsMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}