import { useState } from "react";
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
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
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
    const { userId, newRole } = pendingChange;
    updateUserMutation.mutate(
      { userId, role: newRole },
      {
        onSuccess: () => {
          setRoleError("");
          setPendingChange(null);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#41436A]/20 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-lg sm:rounded-none flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#41436A] p-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-light text-white mb-1">Access Management</h2>
            <p className="text-white/70 text-sm font-light">
              Manage user roles and permissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          {roleError && (
            <div className="mb-3 text-sm text-red-600">
              {roleError}
            </div>
          )}

          {pendingChange && (
            <div className="mb-3 p-4 bg-yellow-50 border border-yellow-200 text-sm rounded">
              <div className="flex items-center justify-between gap-4">
                <div>
                  {pendingChange.newRole === 'admin' ? (
                    <>Are you sure you want to grant <span className="font-medium">admin</span> access to <span className="font-medium">{pendingChange.userName}</span>?</>
                  ) : (
                    <>Are you sure you want to revoke <span className="font-medium">admin</span> access from <span className="font-medium">{pendingChange.userName}</span>?</>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={confirmPendingChange}
                    className="px-3 py-1 bg-[#41436A] text-white rounded"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={cancelPendingChange}
                    className="px-3 py-1 border border-gray-300 rounded"
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
              placeholder="Search users by name or email..."
              className="pl-10 border-gray-300 rounded-none"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 font-light">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 font-light">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-5 bg-white border border-gray-200 hover:border-[#F64668] transition-all"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-[#FE9677]/20 flex items-center justify-center">
                    <span className="text-[#984063] text-sm font-light">
                      {(user.full_name || user.name || user.email)[0]?.toUpperCase()}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-normal text-[#41436A]">
                        {user.full_name || user.name || "No name"}
                      </h3>
                      {user.id === currentUser?.id && (
                        <span className="px-2 py-0.5 bg-[#FE9677]/20 text-[#984063] text-xs font-light">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-3 h-3 text-gray-400" strokeWidth={1.5} />
                      <p className="text-sm text-gray-500 font-light truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#984063]" strokeWidth={1.5} />
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => initiateRoleChange(user, newRole)}
                        disabled={user.id === currentUser?.id || !currentUser?.is_seed}
                      >
                        <SelectTrigger className="w-32 border-gray-300 rounded-none h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          {!user.is_seed && <SelectItem value="user">User</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Capabilities Editor (admins only) */}
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-[#41436A] font-normal mb-4">Admin capabilities</h3>
          <div className="space-y-3">
            {filteredUsers.filter(u => u.role === 'admin').map((user) => {
              const perms = user.permissions?.materials || {};
              const canEditPerms = currentUser?.is_seed && user.id !== currentUser?.id && !user.is_seed;
              return (
                <div key={`perms-${user.id}`} className="p-4 bg-white border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#41436A] font-light">
                      <span className="font-normal">{user.full_name || user.name || user.email}</span>
                      <span className="ml-2 text-gray-500">(materials)</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={!!perms.add}
                          disabled={!canEditPerms}
                          onChange={(e) => {
                            updatePermissionsMutation.mutate({
                              userId: user.id,
                              permissions: {
                                ...(user.permissions || {}),
                                materials: { ...perms, add: e.target.checked }
                              }
                            });
                          }}
                        />
                        Add
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={!!perms.edit}
                          disabled={!canEditPerms}
                          onChange={(e) => {
                            updatePermissionsMutation.mutate({
                              userId: user.id,
                              permissions: {
                                ...(user.permissions || {}),
                                materials: { ...perms, edit: e.target.checked }
                              }
                            });
                          }}
                        />
                        Edit
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={!!perms.delete}
                          disabled={!canEditPerms}
                          onChange={(e) => {
                            updatePermissionsMutation.mutate({
                              userId: user.id,
                              permissions: {
                                ...(user.permissions || {}),
                                materials: { ...perms, delete: e.target.checked }
                              }
                            });
                          }}
                        />
                        Delete
                      </label>
                    </div>
                  </div>
                  {!canEditPerms && (
                    <p className="text-xs text-gray-500 mt-2">
                      Only the seed admin can edit other admins' capabilities.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#984063] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="text-sm text-gray-600 font-light">
              <p className="font-normal text-[#41436A] mb-1">Role Permissions:</p>
              <ul className="space-y-1">
                <li>• <span className="font-normal">Admin:</span> Full access to create, edit, and delete content</li>
                <li>• <span className="font-normal">User:</span> Read-only access to view content</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}