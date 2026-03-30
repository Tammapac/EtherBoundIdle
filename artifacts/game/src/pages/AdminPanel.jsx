import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Shield, AlertCircle, Check, X, ChevronRight, Backpack, Lock, Volume2, Trash2, Edit, Globe, RefreshCw, Swords, LogOut } from "lucide-react";
import { ROLES } from "@/lib/roleSystem";
import { useAuth } from "@/lib/AuthContext";


export default function AdminPanel() {
  const { user: authUser } = useAuth();
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [confirmRole, setConfirmRole] = useState(null);
  const [editStats, setEditStats] = useState(null);
  const [tempStats, setTempStats] = useState({});
  const [deleteConfirmChar, setDeleteConfirmChar] = useState(null);
  const [deleteConfirmGuild, setDeleteConfirmGuild] = useState(null);
  const [banDuration, setBanDuration] = useState("permanent");
  const [muteDuration, setMuteDuration] = useState("24");
  const queryClient = useQueryClient();

  const [currentUser, setCurrentUser] = useState(null);
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";

  React.useEffect(() => {
    if (!authUser) return;
    const fetchRole = async () => {
      try {
        const roleData = await base44.functions.invoke("getCurrentUser", {});
        setCurrentUser({
          id: authUser.id,
          email: authUser.email,
          username: authUser.full_name || authUser.email?.split('@')[0],
          role: roleData?.role || authUser.role || 'user',
        });
      } catch {
        setCurrentUser({
          id: authUser.id,
          email: authUser.email,
          username: authUser.full_name || authUser.email?.split('@')[0],
          role: authUser.role || 'user',
        });
      }
    };
    fetchRole();
  }, [authUser]);

  // Fetch all users for management via backend function (service role)
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAllUsers", {});
      return Array.isArray(res) ? res : res?.users || [];
    },
    enabled: isAdmin,
  });

  // Fetch all characters via backend function (service role)
  const { data: allCharacters = [] } = useQuery({
    queryKey: ["allCharacters"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAllCharacters", {});
      return Array.isArray(res) ? res : res?.characters || [];
    },
    enabled: isAdmin,
  });

  // Fetch items for selected character
  const { data: selectedCharItems = [] } = useQuery({
    queryKey: ["charItems", selectedCharacter?.id],
    queryFn: async () => {
      if (!selectedCharacter?.id) return [];
      return base44.entities.Item.filter({ owner_id: selectedCharacter.id });
    },
    enabled: !!selectedCharacter?.id,
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke("updateUserRole", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      setConfirmRole(null);
      setSelectedUser(null);
    },
  });

  const managePlayerMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke("managePlayer", data),
    onSuccess: (response) => {
      if (response?.data) {
        setSelectedCharacter(prev => prev ? { ...prev, ...response } : null);
      }
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
    },
  });

  const { data: allGuilds = [] } = useQuery({
    queryKey: ["allGuilds"],
    queryFn: async () => {
      const res = await base44.entities.Guild.list();
      return res || [];
    },
    enabled: isAdmin,
  });

  const deleteGuildMutation = useMutation({
    mutationFn: (guildId) => base44.functions.invoke("managePlayer", { action: "delete_guild", guild_id: guildId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGuilds"] });
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
      setDeleteConfirmGuild(null);
    },
  });

  const { data: serverPlayers = [], refetch: refetchServerPlayers, isFetching: fetchingServerPlayers } = useQuery({
    queryKey: ["serverPlayers"],
    queryFn: () => base44.entities.Character.list("-level", 100),
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const updateStatsMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke("managePlayer", data),
    onSuccess: (response) => {
      if (response) {
        setSelectedCharacter(prev => prev ? { ...prev, ...response } : null);
      }
      queryClient.invalidateQueries({ queryKey: ["allCharacters"] });
      setEditStats(null);
      setTempStats({});
    },
  });

  // Filter users by email search (Base44 User has full_name, not username)
  const filteredUsers = allUsers.filter(u =>
    u.email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  // Filter characters by name search
  const filteredCharacters = allCharacters.filter(c =>
    c.name.toLowerCase().includes(searchEmail.toLowerCase())
  );

  if (!currentUser) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="font-orbitron text-2xl font-bold">Admin Panel</h1>
        <Badge className="ml-auto">{currentUser.role.toUpperCase()}</Badge>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="manage" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Manage</TabsTrigger>
          <TabsTrigger value="guilds" className="gap-1.5"><Swords className="w-3.5 h-3.5" /> Guilds ({allGuilds.length})</TabsTrigger>
          <TabsTrigger value="server-players" className="gap-1.5"><Globe className="w-3.5 h-3.5" /> Server Players ({serverPlayers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6 mt-4">
          {/* Search */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Search</label>
            <Input
              placeholder="Search users by email/username or characters by name..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Users List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="font-semibold">Users ({filteredUsers.length})</h2>
              </div>

              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{user.full_name || user.email?.split('@')[0]}</p>
                            <Badge className={`${ROLES[user.role]?.color || "text-gray-400"}`}>
                              {ROLES[user.role]?.label || "Player"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Characters List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Backpack className="w-4 h-4 text-primary" />
                <h2 className="font-semibold">Characters ({filteredCharacters.length})</h2>
              </div>

              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {filteredCharacters.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No characters found</div>
                ) : (
                  filteredCharacters.map((char) => (
                    <div
                      key={char.id}
                      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedCharacter(char)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{char.name}</p>
                            <Badge variant="outline">Lv.{char.level}</Badge>
                            {char.is_banned && <Badge className="bg-destructive/20 text-destructive border-destructive/30">BANNED</Badge>}
                            {char.is_muted && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">MUTED</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{char.class}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="guilds" className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Swords className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">All Guilds ({allGuilds.length})</h2>
            </div>
            {allGuilds.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No guilds exist yet.</div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {allGuilds.map((guild) => {
                  const members = allCharacters.filter(c => c.guild_id === guild.id);
                  return (
                    <div key={guild.id} className="p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{guild.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Level {guild.level || 1} · {members.length} members · {guild.tokens || 0} tokens
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {currentUser.role === 'superadmin' && (
                            deleteConfirmGuild === guild.id ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-1 h-7 text-xs"
                                  onClick={() => deleteGuildMutation.mutate(guild.id)}
                                  disabled={deleteGuildMutation.isPending}
                                >
                                  <Check className="w-3 h-3" /> Confirm
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDeleteConfirmGuild(null)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1 h-7 text-xs"
                                onClick={() => setDeleteConfirmGuild(guild.id)}
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                      {members.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {members.map(m => (
                            <div key={m.id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-1.5">
                              <span className="font-medium">{m.name} <span className="text-xs text-muted-foreground">Lv.{m.level}</span></span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs gap-1 text-orange-400 hover:text-orange-300"
                                  onClick={() => managePlayerMutation.mutate({ action: 'kick', target_character_id: m.id })}
                                  disabled={managePlayerMutation.isPending}
                                >
                                  <LogOut className="w-3 h-3" /> Kick
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="server-players" className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-primary" />
                <h2 className="font-semibold">All Server Players ({serverPlayers.length})</h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => refetchServerPlayers()}
                disabled={fetchingServerPlayers}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingServerPlayers ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            {serverPlayers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No players synced to server yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                <div className="grid grid-cols-6 gap-2 p-3 text-xs font-semibold text-muted-foreground bg-muted/30 sticky top-0">
                  <span>Name</span>
                  <span>Class</span>
                  <span>Level</span>
                  <span>Gold</span>
                  <span>Gems</span>
                  <span>Last Sync</span>
                </div>
                {serverPlayers.map((p) => (
                  <div key={p.id} className="grid grid-cols-6 gap-2 p-3 text-sm hover:bg-muted/20 transition-colors">
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="capitalize text-muted-foreground">{p.class || '-'}</span>
                    <span><Badge variant="outline" className="text-xs">Lv.{p.level}</Badge></span>
                    <span className="text-yellow-400">{(p.gold || 0).toLocaleString()}</span>
                    <span className="text-purple-400">{(p.gems || 0).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.updated_at ? new Date(p.updated_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border-2 border-border rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-4">{selectedUser.full_name || selectedUser.email?.split('@')[0]}</h3>

              <div className="mb-6 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-mono">{selectedUser.email}</p>
                <p className="text-xs text-muted-foreground mt-2 mb-1">Current Role</p>
                <div className="flex items-center gap-2">
                  <Badge className={ROLES[selectedUser.role]?.color || "text-gray-400"}>
                    {ROLES[selectedUser.role]?.label || "Player"}
                  </Badge>
                </div>
              </div>

              {/* Role Assignment */}
              {currentUser.id !== selectedUser.id && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">ASSIGN ROLE</p>
                  <div className="space-y-2">
                    {Object.values(ROLES).map((roleConfig) => {
                      const canAssign =
                        (currentUser.role === "superadmin") ||
                        (currentUser.role === "admin" && roleConfig.value !== "admin" && roleConfig.value !== "superadmin");
                      
                      return (
                        <button
                          key={roleConfig.value}
                          disabled={!canAssign || confirmRole === roleConfig.value}
                          onClick={() => setConfirmRole(roleConfig.value)}
                          className={`w-full p-2 rounded-lg border text-sm font-medium transition-all ${
                            canAssign
                              ? "border-border bg-muted/50 hover:bg-muted cursor-pointer"
                              : "border-border/50 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          {roleConfig.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Confirmation */}
              {confirmRole && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg"
                >
                  <p className="text-sm font-medium mb-3">
                    Change {selectedUser.full_name || selectedUser.email?.split('@')[0]} to <strong>{ROLES[confirmRole]?.label}</strong>?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => {
                        updateRoleMutation.mutate({
                          target_user_id: selectedUser.id,
                          new_role: confirmRole,
                        });
                      }}
                      disabled={updateRoleMutation.isPending}
                    >
                      <Check className="w-3 h-3" /> Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => setConfirmRole(null)}
                    >
                      <X className="w-3 h-3" /> Cancel
                    </Button>
                  </div>
                </motion.div>
              )}

              <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Detail Modal */}
      <AnimatePresence>
        {selectedCharacter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelectedCharacter(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border-2 border-border rounded-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{selectedCharacter.name}</h3>
                <div className="flex gap-1">
                  {selectedCharacter.is_banned && <Badge className="bg-destructive/20 text-destructive border-destructive/30">BANNED</Badge>}
                  {selectedCharacter.is_muted && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">MUTED</Badge>}
                  {selectedCharacter.deleted_from_leaderboard && <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">NO RANK</Badge>}
                </div>
              </div>

              {/* Character Info */}
              <div className="mb-6 p-3 bg-muted/50 rounded-lg grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="font-semibold">{selectedCharacter.level}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="font-semibold capitalize">{selectedCharacter.class}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gold</p>
                  <p className="font-semibold">{selectedCharacter.gold?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gems</p>
                  <p className="font-semibold">{selectedCharacter.gems}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kills</p>
                  <p className="font-semibold">{selectedCharacter.total_kills}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">HP</p>
                  <p className="font-semibold">{selectedCharacter.hp}/{selectedCharacter.max_hp}</p>
                </div>
              </div>

              {/* Edit Stats */}
              {editStats === selectedCharacter.id ? (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg space-y-3">
                  <p className="text-sm font-semibold">Edit Stats</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["level", "gold", "gems", "hp", "max_hp"].map(stat => (
                      <div key={stat}>
                        <label className="text-xs text-muted-foreground capitalize">{stat}</label>
                        <Input
                          type="number"
                          value={tempStats[stat] ?? selectedCharacter[stat]}
                          onChange={(e) => setTempStats({ ...tempStats, [stat]: Number(e.target.value) })}
                          className="text-xs bg-muted/50 h-7"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => {
                        updateStatsMutation.mutate({
                          action: "update_stats",
                          target_character_id: selectedCharacter.id,
                          data: tempStats,
                        });
                      }}
                      disabled={updateStatsMutation.isPending}
                    >
                      <Check className="w-3 h-3" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => { setEditStats(null); setTempStats({}); }}
                    >
                      <X className="w-3 h-3" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="space-y-2 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => setEditStats(editStats === selectedCharacter.id ? null : selectedCharacter.id)}
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Stats
                </Button>

                {/* Inventory */}
                <details className="group">
                  <summary className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted cursor-pointer">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Backpack className="w-3.5 h-3.5" /> Inventory ({selectedCharItems.length} items)
                    </span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
                    {selectedCharItems.length === 0 ? (
                      <p className="p-2 text-center text-xs text-muted-foreground">No items found</p>
                    ) : (
                      <>
                        {selectedCharItems.filter(i => i.equipped).length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-1 px-1">Equipped</p>
                            {selectedCharItems.filter(i => i.equipped).map(item => {
                              const rarityColors = {
                                common: "text-gray-400 border-gray-500/30",
                                uncommon: "text-green-400 border-green-500/30",
                                rare: "text-blue-400 border-blue-500/30",
                                epic: "text-purple-400 border-purple-500/30",
                                legendary: "text-yellow-400 border-yellow-500/30",
                                mythic: "text-red-400 border-red-500/30",
                                shiny: "text-yellow-300 border-yellow-400/30",
                                set: "text-cyan-300 border-cyan-400/30",
                              };
                              const rc = rarityColors[item.rarity] || rarityColors.common;
                              return (
                                <div key={item.id} className={`flex items-center justify-between p-1.5 rounded border bg-muted/30 text-xs mb-1 ${rc}`}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`font-semibold truncate ${rc.split(" ")[0]}`}>{item.name}</span>
                                    <Badge variant="outline" className="text-[9px] h-4">{item.type}</Badge>
                                  </div>
                                  <span className="text-[10px] capitalize text-muted-foreground">{item.rarity}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {selectedCharItems.filter(i => !i.equipped).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1 px-1">Unequipped</p>
                            {selectedCharItems.filter(i => !i.equipped).map(item => {
                              const rarityColors = {
                                common: "text-gray-400 border-gray-500/30",
                                uncommon: "text-green-400 border-green-500/30",
                                rare: "text-blue-400 border-blue-500/30",
                                epic: "text-purple-400 border-purple-500/30",
                                legendary: "text-yellow-400 border-yellow-500/30",
                                mythic: "text-red-400 border-red-500/30",
                                shiny: "text-yellow-300 border-yellow-400/30",
                                set: "text-cyan-300 border-cyan-400/30",
                              };
                              const rc = rarityColors[item.rarity] || rarityColors.common;
                              return (
                                <div key={item.id} className={`flex items-center justify-between p-1.5 rounded border bg-muted/20 text-xs mb-1 ${rc}`}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`truncate ${rc.split(" ")[0]}`}>{item.name}</span>
                                    <Badge variant="outline" className="text-[9px] h-4">{item.type}</Badge>
                                  </div>
                                  <span className="text-[10px] capitalize text-muted-foreground">{item.rarity}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </details>

                {selectedCharacter.is_banned ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => managePlayerMutation.mutate({
                      action: "unban",
                      target_character_id: selectedCharacter.id,
                    })}
                    disabled={managePlayerMutation.isPending}
                  >
                    <Lock className="w-3.5 h-3.5" /> Unban Player
                  </Button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      className="h-8 rounded-md border border-border bg-muted/50 px-2 text-xs flex-shrink-0"
                    >
                      <option value="1">1 hour</option>
                      <option value="24">24 hours</option>
                      <option value="168">7 days</option>
                      <option value="720">30 days</option>
                      <option value="permanent">Permanent</option>
                    </select>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 justify-start gap-2"
                      onClick={() => managePlayerMutation.mutate({
                        action: "ban",
                        target_character_id: selectedCharacter.id,
                        data: { hours: banDuration === "permanent" ? null : parseInt(banDuration) },
                      })}
                      disabled={managePlayerMutation.isPending}
                    >
                      <Lock className="w-3.5 h-3.5" /> Ban Player
                    </Button>
                  </div>
                )}

                {selectedCharacter.is_muted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => managePlayerMutation.mutate({
                      action: "unmute",
                      target_character_id: selectedCharacter.id,
                    })}
                    disabled={managePlayerMutation.isPending}
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Unmute Player
                  </Button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <select
                      value={muteDuration}
                      onChange={(e) => setMuteDuration(e.target.value)}
                      className="h-8 rounded-md border border-border bg-muted/50 px-2 text-xs flex-shrink-0"
                    >
                      <option value="1">1 hour</option>
                      <option value="6">6 hours</option>
                      <option value="24">24 hours</option>
                      <option value="168">7 days</option>
                      <option value="permanent">Permanent</option>
                    </select>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-start gap-2"
                      onClick={() => managePlayerMutation.mutate({
                        action: "mute",
                        target_character_id: selectedCharacter.id,
                        data: { hours: muteDuration === "permanent" ? null : parseInt(muteDuration) },
                      })}
                      disabled={managePlayerMutation.isPending}
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Mute Player
                    </Button>
                  </div>
                )}

                <Button
                  variant={selectedCharacter.deleted_from_leaderboard ? "outline" : "secondary"}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => managePlayerMutation.mutate({
                    action: selectedCharacter.deleted_from_leaderboard ? "restore_leaderboard" : "delete_from_leaderboard",
                    target_character_id: selectedCharacter.id,
                  })}
                  disabled={managePlayerMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" /> {selectedCharacter.deleted_from_leaderboard ? "Restore Ranking" : "Remove from Ranking"}
                </Button>

                <div className="border-t border-border pt-2">
                  {deleteConfirmChar === selectedCharacter.id ? (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <p className="text-xs text-destructive font-semibold mb-2">⚠️ Charakter unwiderruflich löschen?</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 gap-1"
                          onClick={() => {
                            managePlayerMutation.mutate(
                              { action: "delete", target_character_id: selectedCharacter.id },
                              { onSuccess: () => { setSelectedCharacter(null); setDeleteConfirmChar(null); queryClient.invalidateQueries({ queryKey: ["allCharacters"] }); } }
                            );
                          }}
                          disabled={managePlayerMutation.isPending}
                        >
                          <Check className="w-3 h-3" /> Ja, löschen
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setDeleteConfirmChar(null)}>
                          <X className="w-3 h-3" /> Abbrechen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => setDeleteConfirmChar(selectedCharacter.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Charakter löschen
                    </Button>
                  )}
                </div>
              </div>

              <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedCharacter(null)}>
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}