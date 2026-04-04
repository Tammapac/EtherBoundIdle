import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, Pickaxe, Droplet, Leaf } from "lucide-react";

const ACTIVITY_ICONS = {
  online: "🟢",
  idle: "🟡",
  in_combat: <Zap className="w-3 h-3 text-red-400" />,
  mining: <Pickaxe className="w-3 h-3 text-orange-400" />,
  fishing: <Droplet className="w-3 h-3 text-blue-400" />,
  herbalism: <Leaf className="w-3 h-3 text-green-400" />,
  offline: "⚫",
};

const ACTIVITY_LABELS = {
  online: "Online",
  idle: "Idle",
  in_combat: "In Combat",
  mining: "Mining",
  fishing: "Fishing",
  herbalism: "Herbalism",
  offline: "Offline",
};

const CLASS_COLORS = {
  warrior: "text-red-400",
  mage: "text-blue-400",
  ranger: "text-green-400",
  rogue: "text-purple-400",
};

export default function PartyActivityDisplay({ partyMembers, currentZone }) {
  const [presenceData, setPresenceData] = useState({});

  // Poll presence updates for all party members
  useEffect(() => {
    if (!partyMembers?.length) return;

    const memberIds = partyMembers.map(m => m.character_id);
    const memberSet = new Set(memberIds);

    const fetchPresence = () => {
      base44.entities.Presence.list("-last_seen", 100)
        .then(presences => {
          const map = {};
          presences.forEach(p => {
            if (memberSet.has(p.character_id)) {
              map[p.character_id] = p;
            }
          });
          setPresenceData(map);
        })
        .catch(() => {});
    };

    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [partyMembers?.length]);

  if (!partyMembers?.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-primary" /> PARTY ACTIVITY
        {partyMembers.filter(m => {
          const presence = presenceData[m.character_id];
          const isSameZone = presence?.current_zone === currentZone;
          return presence?.status !== "offline" && isSameZone;
        }).length > 0 && (
          <span className="ml-auto text-primary">+{Math.max(0, partyMembers.filter(m => presenceData[m.character_id]?.current_zone === currentZone).length - 1) * 5}% Bonus</span>
        )}
      </p>

      <div className="space-y-1.5">
        {partyMembers.map(member => {
          const presence = presenceData[member.character_id];
          const status = presence?.status || "offline";
          const zone = presence?.current_zone || "unknown";
          const isSameZone = zone === currentZone;
          const icon = ACTIVITY_ICONS[status] || ACTIVITY_ICONS.online;
          const label = ACTIVITY_LABELS[status] || "Unknown";

          return (
            <div
              key={member.character_id}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                isSameZone ? "bg-primary/10 border border-primary/20" : "bg-muted/30 border border-border"
              }`}
            >
              <span>{typeof icon === "string" ? icon : icon}</span>
              <span className={`font-semibold flex-1 ${CLASS_COLORS[member.class] || "text-foreground"}`}>
                {member.name}
              </span>
              <span className="text-muted-foreground">
                {isSameZone ? `${label}` : `${label} (${zone})`}
              </span>
              {isSameZone && status !== "offline" && (
                <Badge variant="outline" className="h-4 text-[9px] px-1 text-primary border-primary/50">
                  Same Zone
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}