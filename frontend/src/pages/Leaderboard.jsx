import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Trophy, Medal, Swords, Coins, Crown, Lock, Trash2, Edit, Backpack, Check, X, UserPlus
} from "lucide-react";
import { CLASSES } from "@/lib/gameData";
import { getItemSprite, getItemIcon } from "@/lib/itemIcons";
import RoleBadge from "@/components/game/RoleBadge";

import { useEffect } from "react";
import { RARITY_CONFIG } from "@/lib/gameData";
import { SLOT_LABELS } from "@/lib/equipmentSystem";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

export default function Leaderboard({ character }) {
  const [selectedChar, setSelectedChar] = useState(null);
  const [selectedCharItems, setSelectedCharItems] = useState([]);
  const [editStats, setEditStats] = useState(null);
  const [tempStats, setTempStats] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState({});
  const queryClient = useQueryClient();
  const pollInterval = useSmartPolling(POLL_INTERVALS.BACKGROUND);

  // Fetch equipped items when a character is selected
  useEffect(() => {
    if (!selectedChar?.id) { setSelectedCharItems([]); return; }
    base44.entities.Item.filter({ owner_id: selectedChar.id, equipped: true })
      .then(items => setSelectedCharItems(items))
      .catch(() => setSelectedCharItems([]));
  }, [selectedChar?.id]);

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (targetChar) => {
      await base44.entities.FriendRequest.create({
        from_character_id: character.id,
        from_name: character.name,
        from_class: character.class,
        from_level: character.level,
        to_character_id: targetChar.id,
        to_name: targetChar.name,
        status: "pending",
      });
    },
    onSuccess: (_, targetChar) => {
      setFriendRequestSent(prev => ({ ...prev, [targetChar.id]: true }));
    },
  });

  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // Use dedicated leaderboard endpoint (Character.list only returns own chars)
      const res = await base44.functions.invoke("getLeaderboard", { type: "level" });
      return res?.leaderboard || [];
    },
    staleTime: 120000,
  });

  const { data: playerRoles = {} } = useQuery({
    queryKey: ["playerRolesMap"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getPlayerRoles", {});
      return res || {};
    },
    staleTime: 120000,
  });

  useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await base44.functions.invoke("getCurrentUser", {});
      setCurrentUser(response);
      return response;
    },
  });

  const managePlayerMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke("managePlayer", data),
    onSuccess: (response) => {
      if (response) {
        setSelectedChar(prev => prev ? { ...prev, ...response } : null);
      }
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  const updateStatsMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke("managePlayer", data),
    onSuccess: (response) => {
      if (response) {
        setSelectedChar(prev => prev ? { ...prev, ...response } : null);
      }
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setEditStats(null);
      setTempStats({});
    },
  });

  const byLevel = [...characters].sort((a, b) => (b.level || 1) - (a.level || 1));
  const byKills = [...characters].sort((a, b) => (b.total_kills || 0) - (a.total_kills || 0));
  const byGold = [...characters].sort((a, b) => (b.gold || 0) - (a.gold || 0));

  const renderList = (list, valueKey, valueLabel, icon) => (
    <div className="space-y-2 mt-3">
      {list.slice(0, 20).map((char, idx) => {
        const cls = CLASSES[char.class];
        const charRole = playerRoles[char.created_by]?.role;
        const medals = [
          <Crown key="g" className="w-5 h-5 text-yellow-400" />,
          <Medal key="s" className="w-5 h-5 text-gray-300" />,
          <Medal key="b" className="w-5 h-5 text-orange-400" />,
        ];
        return (
          <motion.div
            key={char.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => setSelectedChar(char)}
            className={`bg-card border rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer hover:bg-muted/50 ${
              idx < 3 ? "border-primary/30" : "border-border"
            }`}
          >
            <div className="w-8 text-center">
              {idx < 3 ? medals[idx] : <span className="text-sm text-muted-foreground font-medium">#{idx + 1}</span>}
            </div>
            <img src={`/sprites/class_${char.class || "warrior"}.png`} alt={char.class} className="w-8 h-8" style={{ imageRendering: "pixelated" }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">{char.name}</span>
                {char.title && <Badge variant="outline" className="text-[10px] text-accent border-accent/30">{char.title}</Badge>}
                <RoleBadge role={charRole} />
                <Badge variant="outline" className={`text-xs ${cls?.color || ""}`}>
                  {cls?.name || char.class}
                </Badge>
                {char.is_banned && <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">BANNED</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">Level {char.level}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">{(char[valueKey] || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{valueLabel}</p>
            </div>
          </motion.div>
        );
      })}
      {isLoading && Array(5).fill(0).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-3 animate-pulse h-16" />
      ))}
      {!isLoading && list.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">No players yet.</p>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent" /> Leaderboard
      </h2>

      <Tabs defaultValue="level">
        <TabsList>
          <TabsTrigger value="level">Level</TabsTrigger>
          <TabsTrigger value="kills">Kills</TabsTrigger>
          <TabsTrigger value="gold">Gold</TabsTrigger>
        </TabsList>
        <TabsContent value="level">
          {renderList(byLevel, "level", "Level", Trophy)}
        </TabsContent>
        <TabsContent value="kills">
          {renderList(byKills, "total_kills", "Kills", Swords)}
        </TabsContent>
        <TabsContent value="gold">
          {renderList(byGold, "gold", "Gold", Coins)}
        </TabsContent>
      </Tabs>

      {/* Character Detail Modal — public profile for all, admin tools for superadmin */}
      <AnimatePresence>
        {selectedChar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelectedChar(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card border-2 border-border rounded-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{selectedChar.name}</h3>
                <div className="flex gap-1">
                  {selectedChar.is_banned && <Badge className="bg-destructive/20 text-destructive border-destructive/30">BANNED</Badge>}
                  {selectedChar.is_muted && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">MUTED</Badge>}
                  {selectedChar.deleted_from_leaderboard && <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">NO RANK</Badge>}
                </div>
              </div>

              {/* Character Info — visible to all */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="font-semibold">{selectedChar.level}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="font-semibold capitalize">{selectedChar.class}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">HP</p>
                  <p className="font-semibold">{selectedChar.hp}/{selectedChar.max_hp}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gold</p>
                  <p className="font-semibold">{(selectedChar.gold || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kills</p>
                  <p className="font-semibold">{(selectedChar.total_kills || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Damage</p>
                  <p className="font-semibold">{(selectedChar.total_damage || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Stats — visible to all */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg grid grid-cols-3 gap-3 text-sm">
                {["strength", "dexterity", "intelligence", "vitality", "luck"].map(stat => (
                  <div key={stat}>
                    <p className="text-xs text-muted-foreground capitalize">{stat}</p>
                    <p className="font-semibold">{selectedChar[stat] || 0}</p>
                  </div>
                ))}
              </div>

              {/* Friend Request Button — for non-self characters */}
              {character && selectedChar.id !== character.id && (
                <div className="mb-4">
                  <PixelButton
                    variant="ok"
                    label={friendRequestSent[selectedChar.id] ? "REQUEST SENT" : "SEND FRIEND REQUEST"}
                    disabled={friendRequestSent[selectedChar.id] || sendFriendRequestMutation.isPending}
                    onClick={() => sendFriendRequestMutation.mutate(selectedChar)}
                  />
                </div>
              )}

              {/* Equipment — visible to all */}
              {selectedCharItems.length > 0 && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Equipped Items</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {selectedCharItems.map(item => {
                      const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
                      const slotLabel = SLOT_LABELS[item.slot] || item.slot || "";
                      return (
                        <div key={item.id} className={`flex items-center gap-1.5 p-1.5 rounded ${rarity?.bg || "bg-muted/30"} ${rarity?.border || "border-border"} border`}>
                          {getItemSprite(item) ? (
                            <img src={getItemSprite(item)} alt="" className="w-8 h-8 sprite-outline" style={{ imageRendering: "pixelated" }} />
                          ) : (
                            <span className="text-sm">{item.icon || "⚔️"}</span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-medium truncate ${rarity?.color || "text-foreground"}`}>{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{slotLabel}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin Tools — superadmin only */}
              {currentUser?.role !== "superadmin" ? null : editStats ? (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg space-y-3">
                  <p className="text-sm font-semibold">Edit Stats</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["level", "gold", "gems", "hp", "max_hp"].map(stat => (
                      <div key={stat}>
                        <label className="text-xs text-muted-foreground capitalize">{stat}</label>
                        <Input
                          type="number"
                          value={tempStats[stat] ?? selectedChar[stat]}
                          onChange={(e) => setTempStats({ ...tempStats, [stat]: parseInt(e.target.value) })}
                          className="text-xs bg-muted/50 h-7"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <PixelButton
                      variant="ok"
                      label="SAVE"
                      onClick={() => {
                        updateStatsMutation.mutate({
                          action: "update_stats",
                          target_character_id: selectedChar.id,
                          data: tempStats,
                        });
                      }}
                      disabled={updateStatsMutation.isPending}
                    />
                    <PixelButton
                      variant="cancel"
                      label="CANCEL"
                      onClick={() => { setEditStats(null); setTempStats({}); }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Admin Actions — superadmin only */}
              {currentUser?.role === "superadmin" && (
              <div className="space-y-2 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => setEditStats(!editStats)}
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Stats
                </Button>

                <details className="group">
                  <summary className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted cursor-pointer">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Backpack className="w-3.5 h-3.5" /> Equipment ({selectedCharItems.length} items)
                    </span>
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-2 max-h-60 overflow-y-auto space-y-1 text-xs">
                    {selectedCharItems.length > 0 ? selectedCharItems.map(item => {
                      const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
                      const slotLabel = SLOT_LABELS[item.slot] || item.slot || "?";
                      return (
                        <div key={item.id} className={`p-2 rounded flex items-center gap-2 ${rarity?.bg || "bg-muted/50"} border ${rarity?.border || "border-border"}`}>
                          <span className="text-sm flex-shrink-0">{item.icon || "⚔️"}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${rarity?.color || "text-foreground"}`}>{item.name}</p>
                            <p className="text-muted-foreground">{slotLabel} {item.level ? `Lv.${item.level}` : ""}</p>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="p-2 text-center text-muted-foreground">No equipment data</p>
                    )}
                  </div>
                </details>

                <Button
                  variant={selectedChar.is_banned ? "outline" : "destructive"}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => managePlayerMutation.mutate({
                    action: selectedChar.is_banned ? "unban" : "ban",
                    target_character_id: selectedChar.id,
                  })}
                  disabled={managePlayerMutation.isPending}
                >
                  <Lock className="w-3.5 h-3.5" /> {selectedChar.is_banned ? "Unban" : "Ban Player"}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => managePlayerMutation.mutate({
                    action: "delete",
                    target_character_id: selectedChar.id,
                  })}
                  disabled={managePlayerMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Character
                </Button>
              </div>
              )}

              <PixelButton variant="cancel" label="CLOSE" onClick={() => setSelectedChar(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}