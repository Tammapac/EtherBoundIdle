import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, Swords, Zap } from "lucide-react";

const CLASS_COLORS = {
  warrior: "text-red-400", mage: "text-blue-400",
  ranger: "text-green-400", rogue: "text-purple-400",
};
const CLASS_BG = {
  warrior: "bg-red-500/10 border-red-500/30", mage: "bg-blue-500/10 border-blue-500/30",
  ranger: "bg-green-500/10 border-green-500/30", rogue: "bg-purple-500/10 border-purple-500/30",
};

// Shows party members in battle with live level refresh + action feed
export default function PartyBattlePanel({ party, selfId, onPartyAction }) {
  const [liveMembers, setLiveMembers] = useState(party?.members || []);
  const [recentActions, setRecentActions] = useState([]);

  // Refresh member levels from DB every 15s
  useEffect(() => {
    if (!party?.members) return;
    setLiveMembers(party.members);

    const refresh = async () => {
      try {
        const ids = party.members.map(m => m.character_id);
        const res = await base44.functions.invoke("getPublicProfiles", { characterIds: ids });
        const profiles = res?.profiles || [];
        setLiveMembers(prev => prev.map(m => {
          const fresh = profiles.find(p => p.id === m.character_id);
          return fresh ? { ...m, level: fresh.level, name: fresh.name, class: fresh.class } : m;
        }));
      } catch {}
    };

    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [party?.id, party?.members?.length]);

  // Poll party activities for battle actions (replaces dummy subscribe)
  const seenBattleIdsRef = React.useRef(new Set());
  useEffect(() => {
    if (!party?.id) return;
    const poll = async () => {
      try {
        const activities = await base44.entities.PartyActivity.filter({ party_id: party.id });
        for (const d of activities || []) {
          if (!d || d.character_id === selfId) continue;
          if (seenBattleIdsRef.current.has(d.id)) continue;
          seenBattleIdsRef.current.add(d.id);
          // Skip old (>30s)
          if (d.created_at && Date.now() - new Date(d.created_at).getTime() > 30000) continue;
          if (d.payload?.battle_action) {
            const dmg = d.payload.damage || 0;
            const crit = d.payload.is_crit ? " 💥CRIT" : "";
            const skill = d.payload.skill_name && d.payload.skill_name !== "Basic Attack" ? ` [${d.payload.skill_name}]` : "";
            const enemy = d.payload.enemy_name ? ` on ${d.payload.enemy_name}` : "";
            const msg = `🗡️ ${d.character_name}${skill}${crit}: ${dmg} dmg${enemy}`;
            setRecentActions(prev => [msg, ...prev.slice(0, 4)]);
            onPartyAction?.(msg);
          }
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [party?.id, selfId]);

  if (!party || !liveMembers.length || liveMembers.length <= 1) return null;
  const others = liveMembers.filter(m => m.character_id !== selfId);
  if (others.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <Swords className="w-3.5 h-3.5 text-primary" /> PARTY IN BATTLE
        <span className="ml-auto text-primary">+{others.length * 5}% EXP & Gold</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {others.map(m => (
          <div
            key={m.character_id}
            className={`flex-1 min-w-[120px] border rounded-lg p-2 space-y-1 ${CLASS_BG[m.class] || "bg-muted/30 border-border"}`}
          >
            <div className="flex items-center gap-1.5">
              {m.character_id === party.leader_id && (
                <Crown className="w-2.5 h-2.5 text-accent flex-shrink-0" />
              )}
              <span className={`text-xs font-semibold truncate ${CLASS_COLORS[m.class] || "text-foreground"}`}>
                {m.name}
              </span>
              <Badge className="ml-auto text-[10px] h-4 px-1 bg-black/30 border-0 text-muted-foreground">
                Lv.{m.level}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Shield className="w-2.5 h-2.5" />
              <span className="capitalize">{m.class}</span>
              <span className="ml-auto text-green-400 flex items-center gap-0.5">
                <Zap className="w-2 h-2" /> Active
              </span>
            </div>
          </div>
        ))}
      </div>
      {recentActions.length > 0 && (
        <div className="border-t border-border pt-2 space-y-0.5">
          {recentActions.map((a, i) => (
            <p key={i} className={`text-[10px] ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>{a}</p>
          ))}
        </div>
      )}
    </div>
  );
}