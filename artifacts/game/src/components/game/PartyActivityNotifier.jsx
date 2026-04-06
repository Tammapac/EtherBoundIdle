import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Users, Map, Skull, X } from "lucide-react";

export default function PartyActivityNotifier({ character, partyId, onJoinDungeon, onJoinZone }) {
  const [notifications, setNotifications] = useState([]);
  const [seenZones, setSeenZones] = useState(new Set());

  const seenIdsRef = React.useRef(new Set());

  useEffect(() => {
    if (!partyId || !character?.id) return;

    const poll = async () => {
      try {
        // Fetch recent party activities (last 2 minutes)
        const activities = await base44.entities.PartyActivity.filter({ party_id: partyId }, "-created_date", 20);
        if (!activities?.length) return;

        for (const data of activities) {
          if (!data || data.character_id === character.id) continue;
          const id = data.id;
          if (seenIdsRef.current.has(id)) continue;
          seenIdsRef.current.add(id);

          // Skip old activities (older than 2 minutes)
          if (data.created_at) {
            const age = Date.now() - new Date(data.created_at).getTime();
            if (age > 120000) continue;
          }

          // Skip battle actions — PartyBattlePanel handles those
          if (data.payload?.battle_action) continue;

          // Handle zone travel notifications (show once per zone per player)
          if (data.activity_type === 'enter_zone') {
            const zoneKey = `${data.character_id}_${data.payload?.zone}`;
            if (seenZones.has(zoneKey)) continue;
            setSeenZones(prev => new Set(prev).add(zoneKey));
            setNotifications(prev => {
              const notif = { id, ...data };
              setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 8000);
              return [...prev, notif];
            });
            continue;
          }

          // Handle dungeon entry and other activity types
          setNotifications(prev => {
            const notif = { id, ...data };
            setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 30000);
            return [...prev, notif];
          });
        }
      } catch {}
    };

    poll(); // Initial fetch
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [partyId, character?.id]);

  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <div className="fixed top-20 right-3 z-50 space-y-2 max-w-64">
      <AnimatePresence>
        {notifications.map(notif => {
          const isBattleAction = notif.payload?.battle_action;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className={`rounded-xl p-3 shadow-lg border ${
                isBattleAction
                  ? "bg-destructive/10 border-destructive/30"
                  : "bg-card border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  {isBattleAction ? (
                    <Skull className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  ) : notif.activity_type === 'enter_dungeon' ? (
                    <Skull className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  ) : (
                    <Map className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${
                    isBattleAction ? "text-destructive" : "text-primary"
                  }`}>
                    {isBattleAction ? "Combat" : notif.activity_type === 'enter_dungeon' ? 'Dungeon' : 'Zone Travel'}
                  </span>
                </div>
                <button onClick={() => dismiss(notif.id)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className={`text-xs mb-2 ${isBattleAction ? "text-foreground" : "text-muted-foreground"}`}>
                {isBattleAction ? (
                  <>
                    <span className="font-medium">{notif.character_name}</span> {notif.payload.zone_name}
                    {notif.payload.is_crit && <span className="text-yellow-400 font-bold"> 💥 CRIT</span>}
                  </>
                ) : notif.activity_type === 'enter_dungeon' ? (
                  <>
                    <span className="text-foreground font-medium">{notif.character_name}</span> entered {notif.payload?.dungeon_name || 'a dungeon'}
                  </>
                ) : (
                  <>
                    <span className="text-foreground font-medium">{notif.character_name}</span> traveled to {notif.payload?.zone_name || notif.payload?.zone || 'a zone'}
                  </>
                )}
              </p>
              {!isBattleAction && (
                <div className="flex gap-1.5">
                  {notif.activity_type === 'enter_dungeon' && onJoinDungeon && (
                    <Button
                      size="sm"
                      className="flex-1 h-6 text-xs bg-destructive/80 hover:bg-destructive"
                      onClick={() => { onJoinDungeon(notif.payload?.session_id); dismiss(notif.id); }}
                    >
                      Join Dungeon
                    </Button>
                  )}
                  {notif.activity_type === 'enter_zone' && onJoinZone && (
                    <Button
                      size="sm"
                      className="flex-1 h-6 text-xs"
                      onClick={() => { onJoinZone(notif.payload?.zone); dismiss(notif.id); }}
                    >
                      Follow
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => dismiss(notif.id)}
                  >
                    Ignore
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}