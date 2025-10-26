import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

export function StatsCard({ title, value, icon: Icon, trend }: StatsCardProps) {
  // Determine icon color based on card type
  const getIconHoverColor = () => {
    if (title.toLowerCase().includes('streak')) return 'group-hover:text-orange-500';
    if (title.toLowerCase().includes('problems')) return 'group-hover:text-green-500';
    if (title.toLowerCase().includes('topic')) return 'group-hover:text-blue-500';
    if (title.toLowerCase().includes('snippet')) return 'group-hover:text-purple-500';
    return 'group-hover:text-primary';
  };

  return (
    <Card data-testid={`card-stats-${title.toLowerCase().replace(/\s+/g, '-')}`} className="group transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className={`h-4 w-4 text-muted-foreground transition-colors duration-300 ${getIconHoverColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}
