import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface OverallStatsProps {
  stats: any;
}

export default function OverallStats({ stats }: OverallStatsProps) {
  const statItems = [
    { label: "Kills", value: stats.kills || 0 },
    { label: "K/D Ratio", value: stats.kd || 0, highlight: "accent" },
    { label: "Wins", value: stats.wins || 0, highlight: "primary" },
    { label: "Win Rate", value: stats.winRate || "0%" },
    { label: "Top 10", value: stats.top10Rate || "0%" },
    { label: "Avg Damage", value: stats.avgDamage || 0 },
    { label: "Headshot %", value: stats.headshotRate || "0%" },
    { label: "Longest Kill", value: stats.longestKill || "0m" },
  ];

  return (
    <Card className="stat-card">
      <CardContent className="p-5">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          Overall Performance
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item, index) => (
            <div key={index} className="bg-background rounded p-3">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className={`text-xl font-bold ${item.highlight === "primary" ? "text-primary" : item.highlight === "accent" ? "text-accent" : ""}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
