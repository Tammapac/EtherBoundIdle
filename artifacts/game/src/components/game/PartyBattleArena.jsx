import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Crown, Zap } from "lucide-react";
import HealthBar from "@/components/game/HealthBar";
import { motion, AnimatePresence } from "framer-motion";

const CLASS_COLORS = {
  warrior: "text-red-400", mage: "text-blue-400",
  ranger: "text-green-400", rogue: "text-purple-400",
};
const CLASS_BG = {
  warrior: "bg-red-500/10 border-red-500/30",
  mage: "bg-blue-500/10 border-blue-500/30",
  ranger: "bg-green-500/10 border-green-500/30",
  rogue: "bg-purple-500/10 border-purple-500/30",
};

// Shows party members who are in the SAME zone as you, with live HP/MP bars
export default function PartyBattleArena({ party, selfId, selfZone }) {
  const [liveMembers, setLiveMembers] = useState([]);

  useEffect(() => {
    if (!party?.members) { setLiveMembers([]); return; }

    const fetchMembers = async () => {
      try {
        const others = party.members.filter(m => m.character_id !== selfId);
        const fetched = await Promise.all(
          others.map(m =>
            base44.entities.Character.filter({ id: m.character_id })
              .then(r => r[0] || null)
              .catch(() => null)
          )
        );
        // Only show members in same zone
        const sameZone = fetched.filter(c => c && c.current_region === selfZone);
        setLiveMembers(sameZone);
      } catch {}
    };

    fetchMembers();
    const interval = setInterval(fetchMembers, 30000);
    return () => clearInterval(interval);
  }, [party?.id, party?.members?.length, selfId, selfZone]);

  if (!liveMembers.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(liveMembers.length, 3)}, 1fr)` }}
      >
        {liveMembers.map(member => {
          const hp = member.hp ?? member.max_hp;
          const mp = member.mp ?? member.max_mp;
          const maxHp = member.max_hp || 100;
          const maxMp = member.max_mp || 50;
          const isLeader = party.leader_id === member.id;

          return (
            <div
              key={member.id}
              className={`border rounded-xl p-3 space-y-2 ${CLASS_BG[member.class] || "bg-muted/20 border-border"}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${CLASS_BG[member.class] || "bg-muted"}`}>
                  <img src={`/sprites/class_${member.class || "warrior"}.png`} alt={member.class} className="w-6 h-6" style={{ imageRendering: "pixelated" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {isLeader && <Crown className="w-2.5 h-2.5 text-accent flex-shrink-0" />}
                    <p className={`text-xs font-bold truncate ${CLASS_COLORS[member.class] || "text-foreground"}`}>
                      {member.name}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Lv.{member.level} {member.class}</p>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-green-400">
                  <Zap className="w-2.5 h-2.5" />
                  <span>Here</span>
                </div>
              </div>
              <div className="space-y-1">
                <HealthBar current={hp} max={maxHp} color="bg-red-500" label="HP" showText={false} height="h-1.5" />
                <HealthBar current={mp} max={maxMp} color="bg-blue-500" label="MP" showText={false} height="h-1.5" />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span className="text-red-400">{Math.ceil(hp)}/{maxHp} HP</span>
                <span className="text-blue-400">{Math.ceil(mp)}/{maxMp} MP</span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}