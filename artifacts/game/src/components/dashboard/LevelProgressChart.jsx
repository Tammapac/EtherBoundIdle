import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function LevelProgressChart({ character }) {
  if (!character) return null;

  // Simulate character progression history based on current level
  const generateProgressData = () => {
    const data = [];
    for (let i = 1; i <= character.level; i++) {
      const base = 100 * Math.pow(1.18, i - 1);
      const quadratic = i > 10 ? Math.pow(i - 10, 2) * 15 : 0;
      const expToLevel = Math.floor(base + quadratic);
      data.push({
        level: i,
        expRequired: expToLevel,
        accumulated: data.length > 0 ? data[data.length - 1].accumulated + expToLevel : expToLevel,
      });
    }
    return data;
  };

  const data = generateProgressData();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="level" stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
        <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value) => value.toLocaleString()}
        />
        <Line
          type="monotone"
          dataKey="expRequired"
          stroke="hsl(var(--secondary))"
          dot={false}
          strokeWidth={2}
          name="EXP Per Level"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}