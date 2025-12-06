import React, { useState, useEffect, useMemo } from 'react';
import { 
  Info, 
  ChevronDown, 
  Zap, 
  Terminal, 
  Copy, 
  CheckCircle2,
  X 
} from 'lucide-react';

// --- Configuration & Constants ---

const THEME = {
  bg: 'bg-[#0d1117]',        // Main container background
  textMain: 'text-[#e6edf3]', // Main text color
  textMuted: 'text-[#7d8590]', // Muted text
  border: 'border-[#30363d]',  // Borders
  cellEmpty: 'bg-[#161b22]',   // Empty cell color
  // GitHub Dark Mode Green Scale
  colors: [
    'bg-[#161b22]', // Level 0 (Empty)
    'bg-[#0e4429]', // Level 1
    'bg-[#006d32]', // Level 2
    'bg-[#26a641]', // Level 3
    'bg-[#39d353]', // Level 4
  ]
};

const DAY_LABELS = ['Mon', 'Wed', 'Fri'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// --- Helper Functions ---

const getContributionLevel = (count) => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
};

// Generate last 365 days
const generateCalendarData = () => {
  const dates = [];
  const today = new Date();
  // Start from 365 days ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 365);

  // Normalize to start of week (Sunday) to align grid nicely
  // This prevents jagged start of the graph
  const dayOfWeek = startDate.getDay(); 
  startDate.setDate(startDate.getDate() - dayOfWeek);

  for (let i = 0; i <= 370; i++) { // Generate a bit more to fill grid
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
    if (date > today) break;
  }
  return dates;
};

// --- Components ---

const ActivityHeatmap = () => {
  const [data, setData] = useState({}); // { "YYYY-MM-DD": count }
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showWebhookPanel, setShowWebhookPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initial Data Seeding (Simulated)
  useEffect(() => {
    const initialData = {};
    const today = new Date();
    // Seed some random data for the demo
    for (let i = 0; i < 100; i++) {
      const randomDaysAgo = Math.floor(Math.random() * 365);
      const date = new Date(today);
      date.setDate(date.getDate() - randomDaysAgo);
      const key = date.toISOString().split('T')[0];
      initialData[key] = (initialData[key] || 0) + Math.floor(Math.random() * 5) + 1;
    }
    setData(initialData);
  }, []);

  // --- Derived State for Grid ---
  
  const calendarDates = useMemo(() => generateCalendarData(), []);
  
  // Group dates by week for column rendering
  const weeks = useMemo(() => {
    const weeksArr = [];
    let currentWeek = [];
    
    calendarDates.forEach((date) => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) weeksArr.push(currentWeek);
    return weeksArr;
  }, [calendarDates]);

  // Statistics
  const totalSubmissions = Object.values(data).reduce((a, b) => a + b, 0);
  const activeDays = Object.keys(data).length;
  
  // Max Streak Calculation
  const maxStreak = useMemo(() => {
    let max = 0;
    let current = 0;
    const sortedDates = Object.keys(data).sort();
    if (sortedDates.length === 0) return 0;

    let prevDate = new Date(sortedDates[0]);
    
    sortedDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      const diffTime = Math.abs(date - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays <= 1) { // Consecutive or same day
        current += 1;
      } else {
        current = 1;
      }
      if (current > max) max = current;
      prevDate = date;
    });
    return max;
  }, [data]);

  // --- Handlers ---

  const simulateExternalEvent = () => {
    const todayKey = new Date().toISOString().split('T')[0];
    setData(prev => ({
      ...prev,
      [todayKey]: (prev[todayKey] || 0) + 1
    }));
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText("https://api.yourapp.com/v1/hooks/task-complete");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Main Container */}
      <div className={`w-full max-w-4xl ${THEME.bg} rounded-md border ${THEME.border} p-4 shadow-xl`}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-medium ${THEME.textMain}`}>
              {totalSubmissions} submissions
            </span>
            <span className={`text-sm ${THEME.textMuted}`}>in the past one year</span>
            <Info size={14} className={THEME.textMuted} />
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div className={THEME.textMuted}>
              Total active days: <span className={THEME.textMain}>{activeDays}</span>
            </div>
            <div className={THEME.textMuted}>
              Max streak: <span className={THEME.textMain}>{maxStreak}</span>
            </div>
            
            {/* Year Dropdown */}
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#21262d] border ${THEME.border} ${THEME.textMain} text-xs font-medium hover:border-gray-500 transition-colors`}>
              Current <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Heatmap Grid Wrapper */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1 min-w-max">
            
            {/* Day Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col gap-1 pt-6 pr-2">
               {/* Spacer for month labels row */}
               <div className="h-0" /> 
               {/* 7 rows, specific labels only */}
               {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                 <div key={dayIndex} className="h-[10px] text-[9px] leading-[10px] text-[#7d8590] relative">
                   {dayIndex === 1 && 'Mon'}
                   {dayIndex === 3 && 'Wed'}
                   {dayIndex === 5 && 'Fri'}
                 </div>
               ))}
            </div>

            {/* The Grid Columns (Weeks) */}
            {weeks.map((week, weekIndex) => {
              // Determine if we should show a month label above this week
              const firstDay = week[0];
              const isNewMonth = firstDay.getDate() <= 7;
              const monthLabel = isNewMonth ? MONTH_LABELS[firstDay.getMonth()] : null;

              return (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {/* Month Label Row */}
                  <div className="h-[14px] text-[9px] text-[#7d8590] mb-1">
                    {monthLabel}
                  </div>
                  
                  {/* Days in this week */}
                  {week.map((date, dayIndex) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const count = data[dateKey] || 0;
                    const level = getContributionLevel(count);
                    
                    return (
                      <div 
                        key={dateKey}
                        onMouseEnter={() => setHoveredCell({ date: dateKey, count, x: weekIndex, y: dayIndex })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${count} submissions on ${date.toDateString()}`} // Native fallback
                        className={`
                          w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-colors duration-200
                          ${THEME.colors[level]}
                          border border-black/10
                          hover:ring-1 hover:ring-gray-400 hover:z-10
                        `}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer / Legend */}
        <div className="mt-4 flex items-center justify-between text-xs text-[#7d8590]">
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowWebhookPanel(!showWebhookPanel)}
                className="flex items-center gap-1 hover:text-blue-400 transition-colors"
              >
                <Zap size={12} /> Connect External Triggers
              </button>
           </div>
           
           <div className="flex items-center gap-1">
             <span>Less</span>
             {THEME.colors.map((color, i) => (
               <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${color} border border-black/10`} />
             ))}
             <span>More</span>
           </div>
        </div>
      </div>

      {/* --- External Trigger Configuration Panel (Collapsible) --- */}
      {showWebhookPanel && (
        <div className="w-full max-w-4xl mt-4 bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-3 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117]">
            <div className="flex items-center gap-2 text-[#e6edf3] font-semibold text-sm">
              <Terminal size={14} className="text-blue-400" />
              Configure External Events
            </div>
            <button onClick={() => setShowWebhookPanel(false)} className="text-[#7d8590] hover:text-white">
              <X size={14} />
            </button>
          </div>
          
          <div className="p-4 grid md:grid-cols-2 gap-6">
            
            {/* Left: Interactive Test */}
            <div>
              <h4 className="text-xs font-bold text-[#7d8590] uppercase tracking-wider mb-3">Manual Simulation</h4>
              <p className="text-xs text-[#7d8590] mb-3">
                Clicking the button below simulates an incoming webhook event for "Today". Watch the graph update.
              </p>
              <button 
                onClick={simulateExternalEvent}
                className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full justify-center shadow-lg shadow-green-900/20"
              >
                <Zap size={16} /> Simulate Task Completion
              </button>
              
              <div className="mt-4 p-3 bg-[#0d1117] rounded border border-[#30363d]">
                <div className="text-[10px] text-[#7d8590] font-mono">Last Event Payload:</div>
                <div className="text-xs text-green-400 font-mono mt-1">
                  {`{ "event": "task.completed", "timestamp": "${new Date().toISOString()}" }`}
                </div>
              </div>
            </div>

            {/* Right: Code Snippet */}
            <div>
              <h4 className="text-xs font-bold text-[#7d8590] uppercase tracking-wider mb-3">API Integration</h4>
              <div className="relative group">
                <div className="absolute top-2 right-2 flex gap-1">
                   <button 
                    onClick={copyWebhookUrl}
                    className="p-1.5 bg-[#30363d] rounded text-gray-300 hover:text-white transition-colors"
                    title="Copy URL"
                   >
                     {copied ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
                   </button>
                </div>
                <code className="block p-3 bg-[#0d1117] rounded border border-[#30363d] text-xs font-mono text-gray-300 whitespace-pre overflow-x-auto">
{`# Example: Send completion from Python
import requests

url = "https://api.yourapp.com/v1/hooks/task-complete"
payload = {
  "userId": "user_123",
  "taskId": "task_abc",
  "status": "done"
}

requests.post(url, json=payload)`}
                </code>
              </div>
              <p className="text-[10px] text-[#7d8590] mt-2">
                Use your unique API Key in the `Authorization` header.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ActivityHeatmap;