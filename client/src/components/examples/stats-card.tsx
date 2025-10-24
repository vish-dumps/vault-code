import { StatsCard } from "../stats-card";
import { CheckCircle, Flame, TrendingUp } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatsCard
        title="Problems Solved"
        value={156}
        icon={CheckCircle}
        trend="+12 this week"
      />
      <StatsCard
        title="Current Streak"
        value="23 days"
        icon={Flame}
      />
      <StatsCard
        title="Top Topic"
        value="Dynamic Programming"
        icon={TrendingUp}
        trend="42 problems"
      />
    </div>
  );
}
