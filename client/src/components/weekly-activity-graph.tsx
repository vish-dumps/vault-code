import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface WeeklyActivityGraphProps {
  weekData: Array<{ day: string; problems: number }>;
  quote?: string;
}

export function WeeklyActivityGraph({ weekData, quote }: WeeklyActivityGraphProps) {
  
  return (
    <Card className="bg-white/5 ring-1 ring-white/10 h-full">
      <CardContent className="p-3 h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Flame className="text-pink-400 h-4 w-4"/> 
            Daily Progress
          </div>
          <div className="text-muted-foreground text-xs">Problems solved per day</div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weekData}>
            <defs>
              <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--muted-foreground))" 
              style={{ fontSize: '11px' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              style={{ fontSize: '11px' }}
              tickLine={false}
              axisLine={false}
              width={25}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line 
              type="monotone" 
              dataKey="problems" 
              stroke="#818cf8" 
              strokeWidth={2.5} 
              dot={{ r: 4, strokeWidth: 2, fill: '#a5b4fc' }}
              activeDot={{ r: 6 }}
              fill="url(#colorProblems)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
