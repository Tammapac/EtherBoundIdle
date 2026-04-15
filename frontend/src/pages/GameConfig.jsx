import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, ChevronDown, ChevronRight, Save, RotateCcw,
  TrendingUp, Swords, Coins, Package, Users, Star, Leaf,
  Shield, Calendar, Zap, Loader2, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PixelButton from "@/components/game/PixelButton";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

const SECTION_META = [
  { key: "PROGRESSION",        label: "Progression",       icon: TrendingUp, color: "text-green-400" },
  { key: "COMBAT",             label: "Combat",             icon: Swords,     color: "text-red-400" },
  { key: "ECONOMY",            label: "Economy",            icon: Coins,      color: "text-yellow-400" },
  { key: "LOOT",               label: "Loot",               icon: Package,    color: "text-purple-400" },
  { key: "UPGRADES",           label: "Upgrades",           icon: Zap,        color: "text-cyan-400" },
  { key: "GUILDS",             label: "Guilds",             icon: Users,      color: "text-blue-400" },
  { key: "PARTIES",            label: "Parties",            icon: Shield,     color: "text-orange-400" },
  { key: "DAILY_LOGIN",        label: "Daily Login",        icon: Calendar,   color: "text-pink-400" },
  { key: "LIFE_SKILLS",        label: "Life Skills",        icon: Leaf,       color: "text-emerald-400" },
  { key: "RARITY_MULTIPLIERS", label: "Rarity Multipliers", icon: Star,       color: "text-amber-400" },
  { key: "SELL_PRICES",        label: "Sell Prices",        icon: Coins,      color: "text-lime-400" },
];

// ── Field renderer (recursive) ────────────────────────────────────────────────
function ConfigField({ label, value, onChange }) {
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center justify-between py-2 border-b border-border/40">
        <span className="text-sm font-mono text-muted-foreground">{label}</span>
        <button
          onClick={() => onChange(!value)}
          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
            value
              ? "bg-green-500/20 text-green-400 border border-green-500/40"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          {value ? "TRUE" : "FALSE"}
        </button>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="py-2 border-b border-border/40">
        <span className="text-sm font-mono text-muted-foreground block mb-1">{label}</span>
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <Input
              key={i}
              type="number"
              value={v}
              onChange={(e) => {
                const arr = [...value];
                arr[i] = parseFloat(e.target.value) || 0;
                onChange(arr);
              }}
              className="w-16 h-7 text-xs text-center bg-muted/50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <div className="py-2 border-b border-border/40">
        <span className="text-sm font-mono text-muted-foreground block mb-1">{label}</span>
        <div className="ml-3 border-l border-border/40 pl-3 space-y-0">
          {Object.entries(value).map(([k, v]) => (
            <ConfigField
              key={k}
              label={k}
              value={v}
              onChange={(nv) => onChange({ ...value, [k]: nv })}
            />
          ))}
        </div>
      </div>
    );
  }

  const isPercent = label.includes("CHANCE") || label.includes("RATE") || label.includes("GROWTH") || label.includes("MULT") || label.includes("THRESHOLD") || label.includes("BONUS") || label.includes("REDUCTION");
  const step = (typeof value === "number" && value < 1 && value > 0) ? 0.001 : 1;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 gap-4">
      <span className="text-sm font-mono text-muted-foreground flex-1 truncate" title={label}>
        {label}
      </span>
      <Input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-28 h-7 text-xs text-right bg-muted/50 shrink-0"
      />
    </div>
  );
}

// ── Collapsible section ────────────────────────────────────────────────────────
function ConfigSection({ meta, values, onChange }) {
  const [open, setOpen] = useState(false);
  const Icon = meta.icon;

  if (!values) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${meta.color}`} />
          <span className="font-semibold text-sm">{meta.label}</span>
          <span className="text-xs text-muted-foreground">({Object.keys(values).length} params)</span>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border space-y-0">
              {Object.entries(values).map(([key, val]) => (
                <ConfigField
                  key={key}
                  label={key}
                  value={val}
                  onChange={(nv) => onChange({ ...values, [key]: nv })}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GameConfig() {
  const [config, setConfig] = useState(null);
  const [configId, setConfigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // "saved" | "error"
  const [changed, setChanged] = useState(false);
  const [originalConfig, setOriginalConfig] = useState(null);

  // ── Load config from backend ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke('gameConfigManager', {});
        if (res?.success) {
          setConfig(JSON.parse(JSON.stringify(res.config)));
          setOriginalConfig(JSON.parse(JSON.stringify(res.config)));
          setConfigId(res.id);
        }
      } catch (e) {
        console.error("Failed to load config:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (sectionKey, newValues) => {
    setConfig(prev => ({ ...prev, [sectionKey]: newValues }));
    setChanged(true);
    setStatus(null);
  };

  const handleReset = () => {
    setConfig(JSON.parse(JSON.stringify(originalConfig)));
    setChanged(false);
    setStatus(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await base44.functions.invoke('gameConfigManager', {
        _method: 'POST',
        config,
        id: configId,
      });
      if (res?.success) {
        setConfigId(res.id);
        setOriginalConfig(JSON.parse(JSON.stringify(config)));
        setChanged(false);
        setStatus("saved");
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus("error");
      }
    } catch (e) {
      console.error("Save failed:", e);
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-orbitron text-xl font-bold">Game Configuration</h2>
            <p className="text-xs text-muted-foreground">Alle Spielparameter zentral bearbeiten · Gespeichert in der Datenbank</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "saved" && (
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Gespeichert
            </span>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1 text-destructive text-xs">
              <AlertCircle className="w-3.5 h-3.5" /> Fehler
            </span>
          )}
          <PixelButton variant="cancel" label="RESET" onClick={handleReset} disabled={!changed} />
          <PixelButton
            variant="ok"
            label={saving ? "SAVING..." : changed ? "SAVE *" : "SAVED"}
            onClick={handleSave}
            disabled={saving || !changed}
          />
        </div>
      </div>

      {/* Info */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-xs text-primary/80">
        ℹ️ Änderungen werden direkt in der Datenbank gespeichert und beim nächsten Laden automatisch geladen.
        Die Werte sind die Grundlage für alle Backend-Funktionen im Spiel.
      </div>

      {/* Sections */}
      {config && (
        <div className="space-y-3">
          {SECTION_META.map(meta => (
            <ConfigSection
              key={meta.key}
              meta={meta}
              values={config[meta.key]}
              onChange={(nv) => handleChange(meta.key, nv)}
            />
          ))}
        </div>
      )}

      {/* Sticky save bar */}
      <AnimatePresence>
        {changed && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-card border border-primary/50 rounded-xl px-5 py-3 flex items-center gap-4 shadow-2xl">
              <span className="text-sm text-muted-foreground">Ungespeicherte Änderungen</span>
              <PixelButton variant="cancel" label="DISCARD" onClick={handleReset} />
              <PixelButton variant="ok" label={saving ? "SAVING..." : "SAVE"} onClick={handleSave} disabled={saving} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}