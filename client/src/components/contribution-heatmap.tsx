import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface ContributionHeatmapProps {
  data?: Array<{ date: string; count: number }>;
}

export function ContributionHeatmap({ data = [] }: ContributionHeatmapProps) {
  // Generate last 12 months of data
  const generateHeatmapData = () => {
    const weeks: Array<Array<{ date: Date; count: number }>> = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 12);
    
    // Start from the most recent Sunday
    const currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Generate 52 weeks
    for (let week = 0; week < 52; week++) {
      const weekData: Array<{ date: Date; count: number }> = [];
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - ((51 - week) * 7 + (6 - day)));
        
        // Random count for demo - replace with actual data
        const count = date > today ? -1 : Math.floor(Math.random() * 5);
        weekData.push({ date, count });
      }
      
      weeks.push(weekData);
    }
    
    return weeks;
  };
  
  const weeks = generateHeatmapData();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Get color based on contribution count
  const getColor = (count: number) => {
    if (count === -1) return 'bg-transparent'; // Future dates
    if (count === 0) return 'bg-muted/30';
    if (count === 1) return 'bg-green-200 dark:bg-green-900/40';
    if (count === 2) return 'bg-green-300 dark:bg-green-800/60';
    if (count === 3) return 'bg-green-400 dark:bg-green-700/80';
    return 'bg-green-500 dark:bg-green-600';
  };
  
  // Calculate total contributions
  const totalContributions = weeks.flat().reduce((sum, day) => sum + (day.count > 0 ? day.count : 0), 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
          Activity Heatmap
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalContributions} contributions in the last year
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Month labels */}
          <div className="flex gap-[2px] pl-6">
            {months.map((month, index) => (
              <div
                key={month}
                className="text-xs text-muted-foreground"
                style={{ width: `${100 / 12}%`, textAlign: 'left' }}
              >
                {index % 2 === 0 ? month : ''}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-[2px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] justify-around text-xs text-muted-foreground pr-1">
              <div>Mon</div>
              <div></div>
              <div>Wed</div>
              <div></div>
              <div>Fri</div>
              <div></div>
              <div></div>
            </div>
            
            {/* Weeks */}
            <div className="flex gap-[2px] flex-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px] flex-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`aspect-square rounded-sm ${getColor(day.count)} hover:ring-2 hover:ring-green-500 transition-all cursor-pointer`}
                      title={`${day.date.toLocaleDateString()}: ${day.count >= 0 ? day.count : 0} problems`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted/30" />
              <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
              <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800/60" />
              <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/80" />
              <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
