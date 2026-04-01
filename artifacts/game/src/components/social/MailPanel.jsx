import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, Send, Coins, Inbox, Trash2, X } from "lucide-react";
import { format, addDays } from "date-fns";

export default function MailPanel({ character, onCharacterUpdate }) {
  const [composing, setComposing] = useState(false);
  const [toName, setToName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [goldAttach, setGoldAttach] = useState(0);
  const [selectedMail, setSelectedMail] = useState(null);
  const qc = useQueryClient();

  const { data: inbox = [] } = useQuery({
    queryKey: ["mail_inbox", character.id],
    queryFn: () => base44.entities.Mail.filter({ to_character_id: character.id }),
    refetchInterval: 30000,
  });

  const { data: sent = [] } = useQuery({
    queryKey: ["mail_sent", character.id],
    queryFn: () => base44.entities.Mail.filter({ from_character_id: character.id }),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!toName.trim() || !subject.trim()) return;
      // Find recipient character (cross-player search)
      const chars = await base44.functions.invoke("lookupPlayerByName", { name: toName.trim() });
      if (!chars || chars.length === 0) throw new Error("Player not found");
      const recipient = chars[0];
      if (goldAttach > 0 && goldAttach > (character.gold || 0)) throw new Error("Not enough gold");

      await base44.entities.Mail.create({
        from_character_id: character.id,
        from_name: character.name,
        to_character_id: recipient.id,
        to_name: recipient.name,
        subject: subject.trim(),
        body: body.trim(),
        gold_attachment: goldAttach || 0,
        is_read: false,
        expires_at: addDays(new Date(), 30).toISOString(),
      });

      if (goldAttach > 0) {
        const newGold = (character.gold || 0) - goldAttach;
        await base44.entities.Character.update(character.id, { gold: newGold });
        onCharacterUpdate({ ...character, gold: newGold });
      }

      setToName(""); setSubject(""); setBody(""); setGoldAttach(0); setComposing(false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mail_sent", character.id] }),
  });

  const readMutation = useMutation({
    mutationFn: (mail) => base44.entities.Mail.update(mail.id, { is_read: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mail_inbox", character.id] });
      qc.invalidateQueries({ queryKey: ["mail_unread", character.id] });
    },
  });

  const claimGoldMutation = useMutation({
    mutationFn: async (mail) => {
      if (!mail.gold_attachment || mail.is_claimed) return;
      const newGold = (character.gold || 0) + mail.gold_attachment;
      await Promise.all([
        base44.entities.Character.update(character.id, { gold: newGold }),
        base44.entities.Mail.update(mail.id, { is_claimed: true }),
      ]);
      onCharacterUpdate({ ...character, gold: newGold });
      setSelectedMail(m => m ? { ...m, is_claimed: true } : m);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mail_inbox", character.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Mail.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mail_inbox", character.id] });
      setSelectedMail(null);
    },
  });

  const openMail = (mail) => {
    setSelectedMail(mail);
    if (!mail.is_read) readMutation.mutate(mail);
  };

  if (selectedMail) {
    return (
      <div className="mt-4 bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedMail(null)}>← Back</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(selectedMail.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div>
          <h3 className="font-semibold text-lg">{selectedMail.subject}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            From: <span className="text-foreground font-medium">{selectedMail.from_name || "System"}</span>
            {selectedMail.created_date && ` · ${format(new Date(selectedMail.created_date), "MMM d, yyyy HH:mm")}`}
          </p>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMail.body}</p>
        {selectedMail.gold_attachment > 0 && (
          <div className="flex items-center justify-between bg-accent/10 border border-accent/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">{selectedMail.gold_attachment.toLocaleString()} Gold attached</span>
            </div>
            <Button
              size="sm"
              disabled={selectedMail.is_claimed}
              onClick={() => claimGoldMutation.mutate(selectedMail)}
              className="gap-1"
            >
              {selectedMail.is_claimed ? "Claimed" : "Claim"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (composing) {
    return (
      <div className="mt-4 bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">New Mail</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setComposing(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Input placeholder="Recipient name..." value={toName} onChange={e => setToName(e.target.value)} className="h-9 text-sm" />
        <Input placeholder="Subject..." value={subject} onChange={e => setSubject(e.target.value)} className="h-9 text-sm" />
        <Textarea placeholder="Message..." value={body} onChange={e => setBody(e.target.value)} className="min-h-[100px] text-sm" />
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-accent" />
          <Input
            type="number"
            placeholder="Attach gold (optional)"
            value={goldAttach || ""}
            onChange={e => setGoldAttach(Math.max(0, parseInt(e.target.value) || 0))}
            className="h-9 text-sm flex-1"
            min={0}
            max={character.gold || 0}
          />
          <span className="text-xs text-muted-foreground">/ {(character.gold || 0).toLocaleString()}</span>
        </div>
        {sendMutation.error && <p className="text-xs text-destructive">{sendMutation.error.message}</p>}
        <Button className="w-full gap-2" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || !toName || !subject}>
          <Send className="w-4 h-4" /> Send Mail
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <Button className="w-full gap-2" variant="outline" onClick={() => setComposing(true)}>
        <Mail className="w-4 h-4" /> Compose Mail
      </Button>

      <Tabs defaultValue="inbox">
        <TabsList className="bg-muted">
          <TabsTrigger value="inbox" className="text-xs flex items-center gap-1">
            <Inbox className="w-3.5 h-3.5" /> Inbox
            {inbox.filter(m => !m.is_read).length > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[10px] bg-primary">{inbox.filter(m => !m.is_read).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="text-xs flex items-center gap-1">
            <Send className="w-3.5 h-3.5" /> Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-2 mt-3">
          {inbox.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Inbox is empty.</p>}
          {[...inbox].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(mail => (
            <button key={mail.id} onClick={() => openMail(mail)}
              className={`w-full bg-card border rounded-lg p-3 text-left hover:bg-muted/50 transition-colors ${!mail.is_read ? "border-primary/40" : "border-border"}`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-sm ${!mail.is_read ? "font-bold" : "font-medium"}`}>{mail.subject}</p>
                {mail.gold_attachment > 0 && !mail.is_claimed && (
                  <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px]">
                    <Coins className="w-2.5 h-2.5 mr-1" />{mail.gold_attachment}g
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mail.from_name || "System"} · {mail.created_date && format(new Date(mail.created_date), "MMM d")}
              </p>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="sent" className="space-y-2 mt-3">
          {sent.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No sent mail.</p>}
          {[...sent].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(mail => (
            <button key={mail.id} onClick={() => setSelectedMail(mail)}
              className="w-full bg-card border border-border rounded-lg p-3 text-left hover:bg-muted/50 transition-colors"
            >
              <p className="text-sm font-medium">{mail.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                To: {mail.to_name} · {mail.created_date && format(new Date(mail.created_date), "MMM d")}
              </p>
            </button>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}