import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserPlus, UserMinus, Star, StarOff, Ban, Check, X, Search, Wifi, WifiOff, MessageCircle, ArrowLeftRight, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CLASSES } from "@/lib/gameData";

const STATUS_COLOR = {
  online: "bg-green-500",
  idle: "bg-yellow-500",
  in_combat: "bg-red-500",
  offline: "bg-gray-500",
};

const STATUS_LABEL = {
  online: "Online",
  idle: "Idle",
  in_combat: "In Combat",
  offline: "Offline",
};

export default function FriendPanel({ character, onWhisper }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const qc = useQueryClient();

  const { data: friends = [] } = useQuery({
    queryKey: ["friends", character.id],
    queryFn: () => base44.entities.Friendship.filter({ character_id: character.id }),
    refetchInterval: 30000,
  });

  const { data: presences = [] } = useQuery({
    queryKey: ["presences"],
    queryFn: () => base44.entities.Presence.list("-last_seen", 100),
    refetchInterval: 30000,
  });

  const { data: incomingRequests = [] } = useQuery({
    queryKey: ["friend_requests_in", character.id],
    queryFn: () => base44.entities.FriendRequest.filter({ to_character_id: character.id, status: "pending" }),
    refetchInterval: 15000,
  });

  const { data: outgoingRequests = [] } = useQuery({
    queryKey: ["friend_requests_out", character.id],
    queryFn: () => base44.entities.FriendRequest.filter({ from_character_id: character.id, status: "pending" }),
    refetchInterval: 15000,
  });

  // Real-time subscription for friend requests
  useEffect(() => {
    const unsub = base44.entities.FriendRequest.subscribe((event) => {
      if (event.type === "create" || event.type === "update") {
        qc.invalidateQueries({ queryKey: ["friend_requests_in", character.id] });
        qc.invalidateQueries({ queryKey: ["friend_requests_out", character.id] });
      }
    });
    return unsub;
  }, [character.id, qc]);

  // Real-time subscription for friendships
  useEffect(() => {
    const unsub = base44.entities.Friendship.subscribe((event) => {
      qc.invalidateQueries({ queryKey: ["friends", character.id] });
    });
    return unsub;
  }, [character.id, qc]);

  // Fetch live character data for all friends to get up-to-date names/levels/classes
  const friendIds = friends.map(f => f.friend_id).filter(Boolean);
  const { data: friendChars = [] } = useQuery({
    queryKey: ["friendChars", ...friendIds],
    queryFn: async () => {
      if (friendIds.length === 0) return [];
      const results = await Promise.all(
        friendIds.map(id => base44.entities.Character.get(id).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: friendIds.length > 0,
    refetchInterval: 60000,
  });
  const friendCharMap = Object.fromEntries(friendChars.map(c => [c.id, c]));

  const presenceMap = Object.fromEntries(presences.map(p => [p.character_id, p]));

  // Enrich friends with live character data
  const enrichedFriends = friends.map(f => {
    const liveChar = friendCharMap[f.friend_id];
    return {
      ...f,
      friend_name: liveChar?.name || f.friend_name || "Unknown",
      friend_class: liveChar?.class || f.friend_class || "warrior",
      friend_level: liveChar?.level || f.friend_level || "?",
    };
  });

  const activeFriends = enrichedFriends.filter(f => !f.is_blocked);
  const sorted = [...activeFriends].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    const aOnline = presenceMap[a.friend_id]?.status !== "offline" && presenceMap[a.friend_id];
    const bOnline = presenceMap[b.friend_id]?.status !== "offline" && presenceMap[b.friend_id];
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return 0;
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (targetChar) => {
      const already = friends.find(f => f.friend_id === targetChar.id);
      if (already) throw new Error("Already friends");
      const pending = outgoingRequests.find(r => r.to_character_id === targetChar.id);
      if (pending) throw new Error("Request already sent");
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friend_requests_out", character.id] }),
  });

  const acceptMutation = useMutation({
    mutationFn: async (req) => {
      await base44.entities.FriendRequest.update(req.id, { status: "accepted" });
      // Create both sides of friendship
      await Promise.all([
        base44.entities.Friendship.create({
          character_id: character.id,
          friend_id: req.from_character_id,
          friend_name: req.from_name,
          friend_class: req.from_class,
          friend_level: req.from_level,
        }),
        base44.entities.Friendship.create({
          character_id: req.from_character_id,
          friend_id: character.id,
          friend_name: character.name,
          friend_class: character.class,
          friend_level: character.level,
        }),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend_requests_in", character.id] });
      qc.invalidateQueries({ queryKey: ["friends", character.id] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (req) => base44.entities.FriendRequest.update(req.id, { status: "declined" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friend_requests_in", character.id] }),
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendship) => {
      await base44.entities.Friendship.delete(friendship.id);
      // Also remove reverse
      const reverse = await base44.entities.Friendship.filter({ character_id: friendship.friend_id, friend_id: character.id });
      if (reverse[0]) await base44.entities.Friendship.delete(reverse[0].id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends", character.id] }),
  });

  const toggleFavMutation = useMutation({
    mutationFn: (f) => base44.entities.Friendship.update(f.id, { is_favorite: !f.is_favorite }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends", character.id] }),
  });

  const blockMutation = useMutation({
    mutationFn: (f) => base44.entities.Friendship.update(f.id, { is_blocked: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends", character.id] }),
  });

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const results = await base44.entities.Character.filter({ name: search.trim() });
    setSearchResults(results.filter(c => c.id !== character.id));
    setSearching(false);
  };

  return (
    <div className="space-y-4 mt-4">
      <Tabs defaultValue="list">
        <TabsList className="bg-muted">
          <TabsTrigger value="list" className="text-xs">Friends ({sorted.length})</TabsTrigger>
          <TabsTrigger value="requests" className="text-xs relative">
            Requests
            {incomingRequests.length > 0 && (
              <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-destructive">{incomingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="add" className="text-xs">Add Friend</TabsTrigger>
          <TabsTrigger value="blocked" className="text-xs">Blocked</TabsTrigger>
        </TabsList>

        {/* Friend List */}
        <TabsContent value="list" className="space-y-2 mt-3">
          {sorted.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No friends yet. Add some!</p>}
          {sorted.map(f => {
            const presence = presenceMap[f.friend_id];
            const status = presence?.status || "offline";
            const cls = CLASSES[f.friend_class];
            return (
              <div key={f.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <span className={`text-sm font-bold ${cls?.color}`}>{(f.friend_name || "?")[0]}</span>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${STATUS_COLOR[status]}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">{f.friend_name || "Unknown"}</p>
                      {f.is_favorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lv.{f.friend_level || "?"} {cls?.name || "Unknown"} · <span className="capitalize">{STATUS_LABEL[status]}</span>
                      {presence?.current_zone && status !== "offline" && ` · ${presence.current_zone.replace(/_/g, " ")}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onWhisper?.(f.friend_name)} title="Whisper">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                    window.dispatchEvent(new CustomEvent("eb-trade", { detail: { friendId: f.friend_id, friendName: f.friend_name } }));
                  }} title="Trade">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                    try {
                      const result = await base44.functions.invoke("manageParty", { action: "invite", characterId: character.id, targetCharacterId: f.friend_id });
                      toast({ title: "Party Invite", description: result?.message || `Invited ${f.friend_name} to your party.` });
                    } catch (err) {
                      toast({ title: "Party Invite Failed", description: err.message || "Could not send invite.", variant: "destructive" });
                    }
                  }} title="Party Invite">
                    <Users className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleFavMutation.mutate(f)} title="Toggle Favorite">
                    {f.is_favorite ? <StarOff className="w-3.5 h-3.5 text-yellow-400" /> : <Star className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFriendMutation.mutate(f)} title="Remove Friend">
                    <UserMinus className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => blockMutation.mutate(f)} title="Block">
                    <Ban className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Incoming Requests */}
        <TabsContent value="requests" className="space-y-2 mt-3">
          {incomingRequests.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No pending requests.</p>}
          {incomingRequests.map(req => (
            <div key={req.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{req.from_name}</p>
                <p className="text-xs text-muted-foreground">Lv.{req.from_level} {CLASSES[req.from_class]?.name}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 gap-1" onClick={() => acceptMutation.mutate(req)}>
                  <Check className="w-3.5 h-3.5" /> Accept
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => declineMutation.mutate(req)}>
                  <X className="w-3.5 h-3.5" /> Decline
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Add Friend */}
        <TabsContent value="add" className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search player name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="h-9 text-sm"
            />
            <Button size="sm" onClick={handleSearch} disabled={searching}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {searchResults.map(c => {
            const alreadyFriend = friends.some(f => f.friend_id === c.id);
            const requested = outgoingRequests.some(r => r.to_character_id === c.id);
            return (
              <div key={c.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">Lv.{c.level} {CLASSES[c.class]?.name}</p>
                </div>
                <Button
                  size="sm"
                  disabled={alreadyFriend || requested || sendRequestMutation.isPending}
                  onClick={() => sendRequestMutation.mutate(c)}
                  className="gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {alreadyFriend ? "Friends" : requested ? "Sent" : "Add"}
                </Button>
              </div>
            );
          })}
          {searchResults.length === 0 && search && !searching && (
            <p className="text-center text-muted-foreground text-sm py-4">No players found.</p>
          )}
        </TabsContent>

        {/* Blocked */}
        <TabsContent value="blocked" className="space-y-2 mt-3">
          {enrichedFriends.filter(f => f.is_blocked).length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No blocked players.</p>
          )}
          {enrichedFriends.filter(f => f.is_blocked).map(f => (
            <div key={f.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
              <p className="text-sm">{f.friend_name || "Unknown"}</p>
              <Button variant="outline" size="sm" onClick={() => base44.entities.Friendship.update(f.id, { is_blocked: false }).then(() => qc.invalidateQueries({ queryKey: ["friends", character.id] }))}>
                Unblock
              </Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}