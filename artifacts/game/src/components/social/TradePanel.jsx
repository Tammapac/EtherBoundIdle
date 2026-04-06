import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Plus, Minus, Check, X, Search, Coins, Package, Shield, Swords, AlertTriangle } from "lucide-react";
import { RARITY_CONFIG, CLASSES } from "@/lib/gameData";
import { addMinutes } from "date-fns";
import { useSmartPolling, POLL_INTERVALS } from "@/hooks/useSmartPolling";

const MIN_LEVEL_TO_TRADE = 5;

export default function TradePanel({ character, onCharacterUpdate, tradeTarget, onTradeTargetConsumed }) {
  const [view, setView] = useState("list"); // list | initiate | active
  const [targetSearch, setTargetSearch] = useState("");
  const [targetResults, setTargetResults] = useState([]);
  const [myGoldOffer, setMyGoldOffer] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTrade, setActiveTrade] = useState(null);
  const qc = useQueryClient();

  const pollInterval = useSmartPolling(POLL_INTERVALS.SOCIAL);
  const canTrade = (character.level || 1) >= MIN_LEVEL_TO_TRADE;

  const { data: myItems = [] } = useQuery({
    queryKey: ["items", character.id],
    queryFn: () => base44.entities.Item.filter({ owner_id: character.id }),
    enabled: !!character.id,
  });

  const { data: incomingTrades = [] } = useQuery({
    queryKey: ["trades_pending", character.id],
    queryFn: () => base44.entities.TradeSession.filter({ receiver_id: character.id, status: "pending" }),
    refetchInterval: pollInterval,
    staleTime: POLL_INTERVALS.SOCIAL,
  });

  const { data: myTrades = [] } = useQuery({
    queryKey: ["trades_active", character.id],
    queryFn: async () => {
      const [asInit, asRecv] = await Promise.all([
        base44.entities.TradeSession.filter({ initiator_id: character.id }),
        base44.entities.TradeSession.filter({ receiver_id: character.id }),
      ]);
      return [...asInit, ...asRecv].filter(t => ["pending", "active", "initiator_locked", "receiver_locked"].includes(t.status));
    },
    refetchInterval: pollInterval,
    staleTime: POLL_INTERVALS.SOCIAL,
  });

  // Poll active trade for real-time updates
  useEffect(() => {
    if (!activeTrade?.id) return;
    const poll = async () => {
      try {
        const res = await base44.entities.TradeSession.get(activeTrade.id);
        if (res) setActiveTrade(res);
      } catch {}
    };
    const interval = setInterval(poll, pollInterval || 15000);
    return () => clearInterval(interval);
  }, [activeTrade?.id, pollInterval]);

  // Auto-initiate trade when clicking trade button from friend list
  useEffect(() => {
    if (!tradeTarget?.friendId || !canTrade) return;
    const autoTrade = async () => {
      try {
        const target = await base44.entities.Character.get(tradeTarget.friendId);
        if (target && target.id !== character.id) {
          initiateTradeMutation.mutate(target);
        }
      } catch {}
      onTradeTargetConsumed?.();
    };
    autoTrade();
  }, [tradeTarget?.friendId]);

  const searchPlayer = async () => {
    if (!targetSearch.trim()) return;
    const res = await base44.functions.invoke("lookupPlayerByName", { name: targetSearch.trim() });
    setTargetResults((res || []).filter(c => c.id !== character.id));
  };

  const initiateTradeMutation = useMutation({
    mutationFn: async (target) => {
      const trade = await base44.entities.TradeSession.create({
        initiator_id: character.id,
        initiator_name: character.name,
        receiver_id: target.id,
        receiver_name: target.name,
        status: "pending",
        initiator_gold: 0,
        receiver_gold: 0,
        initiator_items: [],
        receiver_items: [],
        initiator_confirmed: false,
        receiver_confirmed: false,
        expires_at: addMinutes(new Date(), 10).toISOString(),
      });
      setActiveTrade(trade);
      setView("active");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades_active", character.id] }),
  });

  const acceptTradeMutation = useMutation({
    mutationFn: async (trade) => {
      const updated = await base44.entities.TradeSession.update(trade.id, { status: "active" });
      setActiveTrade(updated);
      setView("active");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades_pending", character.id] }),
  });

  const declineTradeMutation = useMutation({
    mutationFn: (trade) => base44.entities.TradeSession.update(trade.id, { status: "cancelled" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades_pending", character.id] }),
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ trade, itemIds, gold }) => {
      const isInit = trade.initiator_id === character.id;
      const itemSnapshots = myItems
        .filter(i => itemIds.includes(i.id))
        .map(i => ({ id: i.id, name: i.name, rarity: i.rarity, type: i.type, stats: i.stats, sell_price: i.sell_price }));
      const updates = isInit
        ? { initiator_items: itemSnapshots, initiator_gold: gold, initiator_confirmed: false, receiver_confirmed: false }
        : { receiver_items: itemSnapshots, receiver_gold: gold, initiator_confirmed: false, receiver_confirmed: false };
      const updated = await base44.entities.TradeSession.update(trade.id, updates);
      setActiveTrade(updated);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (trade) => {
      const isInit = trade.initiator_id === character.id;
      const updates = isInit
        ? { initiator_confirmed: true, status: trade.receiver_confirmed ? "receiver_locked" : "initiator_locked" }
        : { receiver_confirmed: true, status: trade.initiator_confirmed ? "initiator_locked" : "receiver_locked" };
      const updated = await base44.entities.TradeSession.update(trade.id, updates);
      setActiveTrade(updated);

      // If both confirmed, execute trade via backend
      if ((isInit && trade.receiver_confirmed) || (!isInit && trade.initiator_confirmed)) {
        const result = await base44.functions.invoke("completeTrade", { trade_id: trade.id });
        if (result?.success) {
          qc.invalidateQueries({ queryKey: ["items", character.id] });
          qc.invalidateQueries({ queryKey: ["equippedItems", character.id] });
          qc.invalidateQueries({ queryKey: ["trades_active", character.id] });
          setView("list");
          setActiveTrade(null);
          // Refresh character gold
          const chars = await base44.entities.Character.filter({ id: character.id });
          if (chars[0]) onCharacterUpdate(chars[0]);
        }
      }
    },
  });

  const cancelTradeMutation = useMutation({
    mutationFn: (trade) => base44.entities.TradeSession.update(trade.id, { status: "cancelled" }),
    onSuccess: () => {
      setActiveTrade(null);
      setView("list");
      qc.invalidateQueries({ queryKey: ["trades_active", character.id] });
    },
  });

  const toggleItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]
    );
  };

  if (!canTrade) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center py-12 gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-accent" />
        <p className="text-sm font-semibold">Reach Level {MIN_LEVEL_TO_TRADE} to unlock trading</p>
        <p className="text-xs text-muted-foreground">You are currently level {character.level}</p>
      </div>
    );
  }

  // Active trade view
  if (view === "active" && activeTrade) {
    const isInit = activeTrade.initiator_id === character.id;
    const myConfirmed = isInit ? activeTrade.initiator_confirmed : activeTrade.receiver_confirmed;
    const theirConfirmed = isInit ? activeTrade.receiver_confirmed : activeTrade.initiator_confirmed;
    const otherName = isInit ? activeTrade.receiver_name : activeTrade.initiator_name;
    const myOfferItems = isInit ? (activeTrade.initiator_items || []) : (activeTrade.receiver_items || []);
    const theirOfferItems = isInit ? (activeTrade.receiver_items || []) : (activeTrade.initiator_items || []);
    const myGold = isInit ? activeTrade.initiator_gold : activeTrade.receiver_gold;
    const theirGold = isInit ? activeTrade.receiver_gold : activeTrade.initiator_gold;
    const bothConfirmed = activeTrade.initiator_confirmed && activeTrade.receiver_confirmed;

    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" /> Trading with {otherName}
          </h3>
          <Button variant="destructive" size="sm" onClick={() => cancelTradeMutation.mutate(activeTrade)}>Cancel</Button>
        </div>

        {activeTrade.status === "pending" && !isInit && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm text-accent">
            Waiting for you to accept this trade request...
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* My offer */}
          <div className="bg-card border border-primary/30 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-primary">Your Offer</p>
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-accent" />
              <Input
                type="number"
                min={0}
                max={character.gold || 0}
                value={myGoldOffer}
                onChange={e => setMyGoldOffer(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-7 text-xs"
                disabled={myConfirmed}
              />
            </div>
            <div className="space-y-1">
              {myOfferItems.map(item => (
                <div key={item.id} className={`text-xs px-2 py-1 rounded ${RARITY_CONFIG[item.rarity]?.bg} ${RARITY_CONFIG[item.rarity]?.color}`}>
                  {item.name}
                </div>
              ))}
            </div>
            {!myConfirmed && (
              <Button size="sm" className="w-full text-xs h-7" variant="outline"
                onClick={() => updateOfferMutation.mutate({ trade: activeTrade, itemIds: selectedItems, gold: myGoldOffer })}>
                Update Offer
              </Button>
            )}
          </div>

          {/* Their offer */}
          <div className="bg-card border border-border rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">{otherName}'s Offer</p>
            <div className="flex items-center gap-2 text-xs text-accent">
              <Coins className="w-3.5 h-3.5" /> {theirGold}g
            </div>
            <div className="space-y-1">
              {theirOfferItems.map(item => (
                <div key={item.id} className={`text-xs px-2 py-1 rounded ${RARITY_CONFIG[item.rarity]?.bg} ${RARITY_CONFIG[item.rarity]?.color}`}>
                  {item.name}
                </div>
              ))}
            </div>
            <div className={`text-xs text-center py-1 rounded ${theirConfirmed ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
              {theirConfirmed ? "✓ Confirmed" : "Waiting..."}
            </div>
          </div>
        </div>

        {/* Item selector */}
        {!myConfirmed && (
          <div className="bg-card border border-border rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Select items to offer (unequipped only)</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {myItems.filter(i => !i.equipped).map(item => {
                const selected = selectedItems.includes(item.id);
                const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
                return (
                  <button key={item.id} onClick={() => toggleItem(item.id)}
                    className={`text-xs p-2 rounded border text-left transition-all ${selected ? `${rarity.border} ${rarity.bg}` : "border-border bg-muted/30 hover:bg-muted/60"}`}
                  >
                    <span className={rarity.color}>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {bothConfirmed ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center text-sm text-green-400">
            Both players confirmed! Completing trade...
          </div>
        ) : (
          <Button
            className="w-full gap-2"
            disabled={myConfirmed || confirmMutation.isPending}
            onClick={() => confirmMutation.mutate(activeTrade)}
          >
            <Check className="w-4 h-4" />
            {myConfirmed ? "Waiting for other player..." : "Confirm Trade"}
          </Button>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="mt-4 space-y-4">
      {/* Incoming requests */}
      {incomingTrades.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Incoming Trade Requests</p>
          {incomingTrades.map(trade => (
            <div key={trade.id} className="bg-card border border-accent/30 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{trade.initiator_name} wants to trade</p>
                <p className="text-xs text-muted-foreground">Level {character.level}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 gap-1" onClick={() => acceptTradeMutation.mutate(trade)}>
                  <Check className="w-3.5 h-3.5" /> Accept
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => declineTradeMutation.mutate(trade)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active trades */}
      {myTrades.filter(t => t.status !== "pending" || t.initiator_id === character.id).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Active Trades</p>
          {myTrades.map(trade => (
            <button key={trade.id} onClick={() => { setActiveTrade(trade); setView("active"); }}
              className="w-full bg-card border border-border rounded-lg p-3 text-left hover:bg-muted/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {trade.initiator_id === character.id ? trade.receiver_name : trade.initiator_name}
                </p>
                <Badge variant="outline" className="text-[10px] mt-1 capitalize">{trade.status.replace(/_/g, " ")}</Badge>
              </div>
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* Initiate new trade */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-primary" /> Initiate Trade
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Search player..."
            value={targetSearch}
            onChange={e => setTargetSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchPlayer()}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={searchPlayer}><Search className="w-4 h-4" /></Button>
        </div>
        {targetResults.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-2.5">
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">Lv.{c.level} {CLASSES[c.class]?.name}</p>
            </div>
            <Button size="sm" onClick={() => initiateTradeMutation.mutate(c)} disabled={initiateTradeMutation.isPending} className="gap-1">
              <ArrowLeftRight className="w-3.5 h-3.5" /> Trade
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}