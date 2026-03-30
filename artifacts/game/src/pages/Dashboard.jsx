import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Target, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import CharacterStatsChart from "@/components/dashboard/CharacterStatsChart";
import LevelProgressChart from "@/components/dashboard/LevelProgressChart";
import CombatStatsChart from "@/components/dashboard/CombatStatsChart";
import SkillBreakdownChart from "@/components/dashboard/SkillBreakdownChart";
import GoldTransmutation from "@/components/game/GoldTransmutation";
import GemLabPanel from "@/components/game/GemLabPanel";
import { formatGold } from "@/lib/formatGold";

export default function Dashboard({ character, onCharacterUpdate }) {
  // Fetch fresh character data from server
  const { data: freshChar } = useQuery({
    queryKey: ["character-fresh", character?.id],
    queryFn: () => base44.entities.Character.get(character.id),
    enabled: !!character?.id,
    refetchInterval: 10000,
  });

  // Merge fresh data into character for display, and update parent
  useEffect(() => {
    if (freshChar?.id && onCharacterUpdate) {
      onCharacterUpdate(freshChar);
    }
  }, [freshChar?.total_kills, freshChar?.total_damage, freshChar?.gold, freshChar?.exp]);
  const [chartVisibility, setChartVisibility] = useState({
    stats: true,
    progress: true,
    combat: true,
    skills: true,
  });

  if (!character) return null;

  const toggleChart = (key) => {
    setChartVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Dashboard
        </h2>
        <p className="text-xs text-muted-foreground">
          {character.name} · Level {character.level}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Kills</p>
          <p className="font-bold text-lg text-primary">{(character.total_kills || 0).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Damage Dealt</p>
          <p className="font-bold text-lg text-orange-400">{(character.total_damage || 0).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Gold</p>
          <p className="font-bold text-lg text-accent">{formatGold(character.gold || 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">EXP to Next</p>
          <p className="font-bold text-lg text-secondary">{(character.exp_to_next - character.exp || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Chart Toggle Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={chartVisibility.stats ? "default" : "outline"}
          onClick={() => toggleChart("stats")}
          className="gap-1"
        >
          <Target className="w-3.5 h-3.5" /> Stats
        </Button>
        <Button
          size="sm"
          variant={chartVisibility.progress ? "default" : "outline"}
          onClick={() => toggleChart("progress")}
          className="gap-1"
        >
          <TrendingUp className="w-3.5 h-3.5" /> Progress
        </Button>
        <Button
          size="sm"
          variant={chartVisibility.combat ? "default" : "outline"}
          onClick={() => toggleChart("combat")}
          className="gap-1"
        >
          <Flame className="w-3.5 h-3.5" /> Combat
        </Button>
        <Button
          size="sm"
          variant={chartVisibility.skills ? "default" : "outline"}
          onClick={() => toggleChart("skills")}
          className="gap-1"
        >
          <BarChart3 className="w-3.5 h-3.5" /> Breakdown
        </Button>
      </div>

      {/* Passive Systems */}
      <div className="grid lg:grid-cols-2 gap-4">
        <GoldTransmutation character={character} onCharacterUpdate={onCharacterUpdate} />
        <div className="bg-card border border-border rounded-xl p-5">
          <GemLabPanel character={character} onCharacterUpdate={onCharacterUpdate} />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {chartVisibility.stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <h3 className="font-semibold mb-3 text-sm">Character Attributes</h3>
            <CharacterStatsChart character={character} />
          </motion.div>
        )}

        {chartVisibility.progress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <h3 className="font-semibold mb-3 text-sm">Progression</h3>
            <LevelProgressChart character={character} />
          </motion.div>
        )}

        {chartVisibility.combat && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <h3 className="font-semibold mb-3 text-sm">Combat Performance</h3>
            <CombatStatsChart character={character} />
          </motion.div>
        )}

        {chartVisibility.skills && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <h3 className="font-semibold mb-3 text-sm">Stat Breakdown</h3>
            <SkillBreakdownChart character={character} />
          </motion.div>
        )}
      </div>
    </div>
  );
}