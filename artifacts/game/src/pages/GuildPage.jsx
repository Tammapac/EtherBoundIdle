import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Shield, Plus, LogIn, Search, Trophy, Swords, Coins, Star } from "lucide-react";

import GuildHeader from "@/components/guild/GuildHeader";
import GuildMembers from "@/components/guild/GuildMembers";
import GuildPerks from "@/components/guild/GuildPerks";
import GuildBoss from "@/components/guild/GuildBoss";
import GuildShop from "@/components/guild/GuildShop";
import GuildBase from "@/components/guild/GuildBase";
import InlineChat from "@/components/game/InlineChat";
import { idleEngine } from "@/lib/idleEngine";
import { calculateFinalStats, rollDamage } from "@/lib/statSystem";
import { useToast } from "@/components/ui/use-toast";

// Each boss template has 3 raid tiers with increasing HP and token multipliers
const GUILD_BOSSES = [
  { name: "Ancient Golem", baseHp: 50000, tiers: [
    { level: 1, hpMult: 1, tokenMult: 1 },
    { level: 2, hpMult: 2, tokenMult: 1.5 },
    { level: 3, hpMult: 4, tokenMult: 2.5 },
  ]},
  { name: "Shadow Hydra", baseHp: 100000, tiers: [
    { level: 1, hpMult: 1, tokenMult: 1.5 },
    { level: 2, hpMult: 2.5, tokenMult: 2 },
    { level: 3, hpMult: 5, tokenMult: 3 },
  ]},
  { name: "Cosmic Titan", baseHp: 250000, tiers: [
    { level: 1, hpMult: 1, tokenMult: 2 },
    { level: 2, hpMult: 3, tokenMult: 3 },
    { level: 3, hpMult: 6, tokenMult: 5 },
  ]},
];

export default function GuildPage({ character, onCharacterUpdate }) {
  const { toast } = useToast();
  const [guildName, setGuildName] = useState("");
  const [guildTag, setGuildTag] = useState("");
  const [guildDesc, setGuildDesc] = useState("");
  const [search, setSearch] = useState("");
  const [bossVictoryModal, setBossVictoryModal] = useState(null);
  const queryClient = useQueryClient();

  const { data: guilds = [] } = useQuery({
    queryKey: ["guilds"],
    queryFn: () => base44.entities.Guild.list("-member_count", 30),
    refetchInterval: 5000,
  });

  const myGuild = guilds.find(g => g.id === character?.guild_id);
  const myMemberEntry = myGuild?.members?.find(m => m.character_id === character?.id);
  const myRole = myMemberEntry?.role || (myGuild?.leader_id === character?.id ? "leader" : "member");

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["guilds"] });

  // Polling handles real-time updates via refetchInterval above

  const createMutation = useMutation({
    mutationFn: async () => {
      if ((character.gold || 0) < 500) throw new Error("Not enough gold (500 required)");
      const newGuild = await base44.entities.Guild.create({
        name: guildName.trim(),
        tag: guildTag.trim().toUpperCase().slice(0, 5),
        description: guildDesc.trim(),
        leader_id: character.id,
        leader_name: character.name,
        member_count: 1,
        max_members: 20,
        level: 1,
        exp: 0,
        exp_to_next: 1000,
        emblem: "shield",
        is_recruiting: true,
        is_public: true,
        guild_tokens: 0,
        buffs: { exp_bonus: 5, gold_bonus: 5, damage_bonus: 2, idle_bonus: 0 },
        perks: { exp_boost: 0, gold_boost: 0, damage_boost: 0, idle_boost: 0 },
        buildings: { forge: 0, academy: 0, treasury: 0 },
        boss_active: false,
        members: [{ character_id: character.id, name: character.name, role: "leader", joined_at: new Date().toISOString(), boss_damage_today: 0 }],
      });
      await base44.entities.Character.update(character.id, { gold: (character.gold || 0) - 500, guild_id: newGuild.id });
      onCharacterUpdate({ ...character, gold: (character.gold || 0) - 500, guild_id: newGuild.id });
      refetch();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (guild) => {
      const currentMembers = guild.members || [];
      if (currentMembers.length >= (guild.max_members || 20)) throw new Error("Guild is full");
      const alreadyMember = currentMembers.some(m => m.character_id === character.id);
      if (alreadyMember) throw new Error("Already a member");
      const newMembers = [...currentMembers, { character_id: character.id, name: character.name, role: "member", joined_at: new Date().toISOString(), boss_damage_today: 0 }];
      await base44.entities.Guild.update(guild.id, { member_count: newMembers.length, members: newMembers });
      await base44.entities.Character.update(character.id, { guild_id: guild.id });
      onCharacterUpdate({ ...character, guild_id: guild.id });
      refetch();
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const newMembers = (myGuild.members || []).filter(m => m.character_id !== character.id);
      await base44.entities.Guild.update(myGuild.id, { member_count: newMembers.length, members: newMembers });
      await base44.entities.Character.update(character.id, { guild_id: null });
      onCharacterUpdate({ ...character, guild_id: null });
      refetch();
    },
  });

  const kickMutation = useMutation({
    mutationFn: async (member) => {
      const newMembers = (myGuild.members || []).filter(m => m.character_id !== member.character_id);
      await base44.entities.Guild.update(myGuild.id, { member_count: newMembers.length, members: newMembers });
      refetch();
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ member, direction }) => {
      const order = ["member", "officer", "co-leader"];
      const idx = order.indexOf(member.role);
      const newRole = direction === "up" ? order[Math.min(idx + 1, order.length - 1)] : order[Math.max(idx - 1, 0)];
      const newMembers = (myGuild.members || []).map(m => m.character_id === member.character_id ? { ...m, role: newRole } : m);
      await base44.entities.Guild.update(myGuild.id, { members: newMembers });
      refetch();
    },
  });

  const perkMutation = useMutation({
    mutationFn: async ({ perk, currentLevel }) => {
      const cost = Math.floor(perk.baseCost * Math.pow(1.5, currentLevel));
      if ((myGuild.guild_tokens || 0) < cost) throw new Error("Not enough tokens");
      const newPerks = { ...(myGuild.perks || {}), [perk.key]: currentLevel + 1 };
      const buffDelta = { exp_boost: 5, gold_boost: 5, damage_boost: 3, idle_boost: 5 }[perk.key] || 0;
      const newBuffs = { ...(myGuild.buffs || {}) };
      newBuffs[perk.buffKey] = (newBuffs[perk.buffKey] || 0) + buffDelta;
      await base44.entities.Guild.update(myGuild.id, { perks: newPerks, buffs: newBuffs, guild_tokens: (myGuild.guild_tokens || 0) - cost });
      refetch();
    },
  });

  const buildingMutation = useMutation({
    mutationFn: async ({ building, currentLevel }) => {
      const cost = Math.floor(building.baseCost * Math.pow(1.5, currentLevel));
      if ((myGuild.guild_tokens || 0) < cost) throw new Error("Not enough tokens");
      const newBuildings = { ...(myGuild.buildings || {}), [building.key]: currentLevel + 1 };
      await base44.entities.Guild.update(myGuild.id, { buildings: newBuildings, guild_tokens: (myGuild.guild_tokens || 0) - cost });
      refetch();
    },
  });

  // Determine current raid level based on guild boss kill count
  const bossKills = myGuild?.boss_kills || 0;
  const raidLevel = bossKills + 1; // Each kill increments the raid level

  const activateBossMutation = useMutation({
    mutationFn: async () => {
      const bossIdx = Math.min((myGuild.level || 1) - 1, GUILD_BOSSES.length - 1);
      const bossTemplate = GUILD_BOSSES[bossIdx];
      // Cycle through tiers (0,1,2) based on kills, scaling HP further with total kills
      const tierIdx = Math.min(2, Math.floor(bossKills / 3));
      const tier = bossTemplate.tiers[tierIdx] || bossTemplate.tiers[0];
      const killScaling = 1 + bossKills * 0.15; // +15% HP per kill
      const hp = Math.floor(bossTemplate.baseHp * tier.hpMult * (1 + (myGuild.level - 1) * 0.5) * killScaling);
      const tokenMult = tier.tokenMult * (1 + bossKills * 0.1); // +10% tokens per kill
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await base44.entities.Guild.update(myGuild.id, {
        boss_active: true,
        boss_name: `${bossTemplate.name} (Raid Lv.${raidLevel})`,
        boss_hp: hp,
        boss_max_hp: hp,
        boss_expires_at: expires,
        boss_raid_tier: tierIdx,
        boss_token_mult: tokenMult,
      });
      refetch();
    },
  });

  const [bossCooldown, setBossCooldown] = useState(() => character?.guild_id ? idleEngine.getBossAttackStatus(character?.id) : null);

  useEffect(() => {
    if (!character?.id || !character?.guild_id) return;
    const unsub = idleEngine.on('guildBossStatus', (status) => {
      setBossCooldown(status);
    });
    return unsub;
  }, [character?.id, character?.guild_id]);

  const attackBossMutation = useMutation({
    mutationFn: async () => {
      const status = await idleEngine.validateGuildBossAttack(character.id);
      if (!status.ready) {
        setBossCooldown(status);
        throw new Error(`No attacks remaining. ${status.windowFormatted}`);
      }
      // Use actual character stats + equipment for damage calculation
      let equippedItems = [];
      try {
        const allItems = await base44.entities.Item.filter({ owner_id: character.id });
        equippedItems = (allItems || []).filter(i => i.equipped);
      } catch {}
      const { total } = calculateFinalStats(character, equippedItems);
      const { damage: rollResult } = rollDamage(total, character.class, null, character);
      const dmg = Math.floor(rollResult * (8 + Math.random() * 4)); // Scale up for boss fight
      const newHp = Math.max(0, (myGuild.boss_hp || 0) - dmg);
      const newMembers = (myGuild.members || []).map(m =>
        m.character_id === character.id ? { ...m, boss_damage_today: (m.boss_damage_today || 0) + dmg } : m
      );
      const updates = { boss_hp: newHp, members: newMembers };
      if (newHp <= 0) {
        updates.boss_active = false;
        const bossLevel = Math.min((myGuild.level || 1), 3);
        const tokenMult = myGuild.boss_token_mult || 1;
        const tokenReward = Math.floor((100 * bossLevel + Math.floor(dmg / 50)) * tokenMult);
        updates.guild_tokens = (myGuild.guild_tokens || 0) + tokenReward;
        updates.boss_kills = (myGuild.boss_kills || 0) + 1;
        updates.members = newMembers.map(m => ({ ...m, boss_damage_today: 0 }));
        const newExp = (myGuild.exp || 0) + 500;
        updates.exp = newExp;
        if (newExp >= (myGuild.exp_to_next || 1000)) {
          updates.level = (myGuild.level || 1) + 1;
          updates.exp = newExp - (myGuild.exp_to_next || 1000);
          updates.exp_to_next = Math.floor((myGuild.exp_to_next || 1000) * 1.5);
          updates.max_members = (myGuild.max_members || 20) + 5;
        }
        // Show victory popup with rewards
        setTimeout(() => {
          setBossVictoryModal({
            bossName: myGuild.boss_name || "Guild Boss",
            tokens: tokenReward,
            guildExp: 500,
            damage: dmg,
            nextLevel: (myGuild.boss_kills || 0) + 2,
          });
        }, 300);
      }
      await base44.entities.Guild.update(myGuild.id, updates);
      idleEngine.recordGuildBossAttack(character.id);
      refetch();
    },
  });

  const shopBuyMutation = useMutation({
    mutationFn: async (item) => {
      if ((myGuild.guild_tokens || 0) < item.cost) throw new Error("Not enough tokens");
      await base44.entities.Guild.update(myGuild.id, { guild_tokens: (myGuild.guild_tokens || 0) - item.cost });

      // Apply buff effect for scrolls/runes (duration-based items)
      if (item.durationMs && character?.id) {
        const BUFF_EFFECTS = {
          exp_scroll: { type: "exp_bonus", value: 50 },
          gold_scroll: { type: "gold_bonus", value: 50 },
          damage_rune: { type: "damage_bonus", value: 30 },
          defense_rune: { type: "defense_bonus", value: 30 },
        };
        const effect = BUFF_EFFECTS[item.id];
        if (effect) {
          const activeBuffs = character.active_buffs || [];
          const newBuff = {
            id: item.id,
            name: item.name,
            type: effect.type,
            value: effect.value,
            expires_at: new Date(Date.now() + item.durationMs).toISOString(),
          };
          // Replace existing buff of same type or add new
          const filtered = activeBuffs.filter(b => b.type !== effect.type);
          filtered.push(newBuff);
          await base44.entities.Character.update(character.id, { active_buffs: filtered });
          onCharacterUpdate({ ...character, active_buffs: filtered });
        }
      }
      refetch();
    },
  });

  const filteredGuilds = guilds.filter(g =>
    g.is_recruiting && g.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!character) return null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      {/* Boss Victory Modal */}
      <AnimatePresence>
        {bossVictoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={() => setBossVictoryModal(null)}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="bg-gradient-to-b from-amber-950/90 to-gray-950 border-2 border-amber-500/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-amber-500/20 text-center relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-amber-500 to-transparent" />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", damping: 10 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-amber-500/20 border-2 border-amber-500/40"
                >
                  <Trophy className="w-10 h-10 text-amber-400" />
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-orbitron font-bold text-2xl text-amber-300 mb-1"
                >
                  VICTORY!
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm text-amber-200/70 mb-5"
                >
                  {bossVictoryModal.bossName} has been slain!
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2 mb-6"
                >
                  <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-gray-300"><Swords className="w-4 h-4 text-red-400" /> Your Damage</span>
                    <span className="font-bold text-red-400 font-mono">{bossVictoryModal.damage.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-gray-300"><Coins className="w-4 h-4 text-amber-400" /> Guild Tokens</span>
                    <span className="font-bold text-amber-400 font-mono">+{bossVictoryModal.tokens.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-gray-300"><Star className="w-4 h-4 text-cyan-400" /> Guild EXP</span>
                    <span className="font-bold text-cyan-400 font-mono">+{bossVictoryModal.guildExp}</span>
                  </div>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-gray-500 mb-4"
                >
                  Next raid: Level {bossVictoryModal.nextLevel}
                </motion.p>
                <motion.button
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBossVictoryModal(null)}
                  className="px-8 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition-all"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" /> Guilds
      </h2>

      {myGuild ? (
        <div className="space-y-4">
          <GuildHeader guild={myGuild} myRole={myRole} onLeave={() => leaveMutation.mutate()} isLeaving={leaveMutation.isPending} />

          <Tabs defaultValue="members">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted">
              <TabsTrigger value="members" className="text-xs">Members</TabsTrigger>
              <TabsTrigger value="boss" className="text-xs">Guild Boss</TabsTrigger>
              <TabsTrigger value="perks" className="text-xs">Perks</TabsTrigger>
              <TabsTrigger value="base" className="text-xs">Guild Base</TabsTrigger>
              <TabsTrigger value="shop" className="text-xs">Shop</TabsTrigger>
              <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-3">
              <GuildMembers
                guild={myGuild}
                myRole={myRole}
                characterId={character.id}
                onKick={(m) => kickMutation.mutate(m)}
                onPromote={(m) => changeRoleMutation.mutate({ member: m, direction: "up" })}
                onDemote={(m) => changeRoleMutation.mutate({ member: m, direction: "down" })}
              />
            </TabsContent>

            <TabsContent value="boss" className="mt-3">
              <GuildBoss
                guild={myGuild}
                myMemberEntry={myMemberEntry}
                character={character}
                onAttack={() => attackBossMutation.mutate()}
                onActivate={() => activateBossMutation.mutate()}
                isAttacking={attackBossMutation.isPending}
                canActivate={["leader", "co-leader", "officer"].includes(myRole)}
                bossCooldown={bossCooldown}
              />
            </TabsContent>

            <TabsContent value="perks" className="mt-3">
              <GuildPerks
                guild={myGuild}
                myRole={myRole}
                onUpgrade={(perk, level) => perkMutation.mutate({ perk, currentLevel: level })}
                isUpgrading={perkMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="base" className="mt-3">
              <GuildBase
                guild={myGuild}
                myRole={myRole}
                onUpgrade={(building, level) => buildingMutation.mutate({ building, currentLevel: level })}
                isUpgrading={buildingMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="shop" className="mt-3">
              <GuildShop
                guild={myGuild}
                onBuy={(item) => shopBuyMutation.mutate(item)}
                isBuying={shopBuyMutation.isPending}
                characterId={character?.id}
              />
            </TabsContent>

            <TabsContent value="chat" className="mt-3">
              <InlineChat character={character} channel="guild" guildId={myGuild.id} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Tabs defaultValue="browse">
          <TabsList>
            <TabsTrigger value="browse">Browse Guilds</TabsTrigger>
            <TabsTrigger value="create">Create Guild</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search guilds..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {filteredGuilds.map(guild => (
              <motion.div key={guild.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{guild.name}</p>
                    {guild.tag && <span className="text-xs text-muted-foreground font-mono">[{guild.tag}]</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">Lv.{guild.level} • {guild.member_count}/{guild.max_members || 20} Members</p>
                  {guild.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{guild.description}</p>}
                </div>
                <Button
                  size="sm"
                  onClick={() => joinMutation.mutate(guild)}
                  disabled={joinMutation.isPending || (guild.members?.length || 0) >= (guild.max_members || 20)}
                  className="gap-1 flex-shrink-0"
                  title={(guild.members?.length || 0) >= (guild.max_members || 20) ? "Guild is full" : "Join guild"}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {(guild.members?.length || 0) >= (guild.max_members || 20) ? "Full" : "Join"}
                </Button>
              </motion.div>
            ))}
            {filteredGuilds.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">No guilds found. Create one!</p>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-3">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Guild Name *</label>
                  <Input placeholder="e.g. Shadow Legion" value={guildName} onChange={e => setGuildName(e.target.value)} maxLength={30} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tag (3–5 chars)</label>
                  <Input placeholder="SL" value={guildTag} onChange={e => setGuildTag(e.target.value.slice(0, 5))} maxLength={5} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <Textarea placeholder="Describe your guild..." value={guildDesc} onChange={e => setGuildDesc(e.target.value)} className="h-20" />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Creation Cost: <span className="text-accent font-semibold">500 Gold</span></span>
                <span>Your Gold: <span className="text-accent font-semibold">{character.gold || 0}</span></span>
              </div>
              {createMutation.isError && <p className="text-destructive text-sm">{createMutation.error?.message}</p>}
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!guildName.trim() || !guildTag.trim() || (character.gold || 0) < 500 || createMutation.isPending}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" /> Create Guild (500 Gold)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}