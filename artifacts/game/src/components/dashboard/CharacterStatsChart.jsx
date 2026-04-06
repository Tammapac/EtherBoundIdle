import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calculateFinalStats } from "@/lib/statSystem";

export default function CharacterStatsChart({ character }) {
  if (!character) return null;

  const { data: equippedItems = [] } = useQuery({
    queryKey: ["equippedItems", character.id],
    queryFn: () => base44.entities.Item.filter({ owner_id: character.id, equipped: true }),
    enabled: !!character.id,
  });
  const { base, total } = calculateFinalStats(character, equippedItems);

  const data = [
    { name: "STR", base: base.strength, total: total.strength },
    { name: "DEX", base: base.dexterity, total: total.dexterity },
    { name: "INT", base: base.intelligence, total: total.intelligence },
    { name: "VIT", base: base.vitality, total: total.vitality },
    { name: "LUK", base: base.luck, total: total.luck },
  ];

  const colors = {
    base: "hsl(var(--muted))",
    total: "hsl(var(--primary))",
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
        <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend />
        <Bar dataKey="base" fill={colors.base} name="Base" />
        <Bar dataKey="total" fill={colors.total} name="With Gear" />
      </BarChart>
    </ResponsiveContainer>
  );
}