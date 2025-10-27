import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Activity, Flame, Target, Calendar as CalendarIcon, Award, TrendingUp } from 'lucide-react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function GraphShowcase() {
  const dailyData = [
    { day: 'Mon', problems: 3 },
    { day: 'Tue', problems: 5 },
    { day: 'Wed', problems: 4 },
    { day: 'Thu', problems: 6 },
    { day: 'Fri', problems: 8 },
    { day: 'Sat', problems: 7 },
    { day: 'Sun', problems: 9 }
  ]

  const topicData = [
    { name: 'Graphs', value: 20 },
    { name: 'DP', value: 25 },
    { name: 'Math', value: 15 },
    { name: 'Greedy', value: 10 },
    { name: 'Strings', value: 30 }
  ]

  const COLORS = ['#a5b4fc', '#c4b5fd', '#f9a8d4', '#67e8f9', '#fde68a']
  const streakDates = [
    new Date(2025, 9, 24),
    new Date(2025, 9, 25),
    new Date(2025, 9, 26),
    new Date(2025, 9, 27)
  ]

  const tileClassName = ({ date }) => {
    const isStreak = streakDates.some(d => d.toDateString() === date.toDateString())
    return isStreak
      ? 'bg-gradient-to-br from-indigo-300 to-pink-300 text-slate-900 font-semibold rounded-full shadow-md'
      : 'hover:bg-slate-700/30 transition-colors duration-200 rounded-full'
  }

  const currentStreak = 6
  const maxStreak = 12
  const activeDaysLast30 = 22
  const daysSinceLast = 1

  const streakFactor = maxStreak > 0 ? (currentStreak / maxStreak) * 100 : 0
  const activityFrequency = (activeDaysLast30 / 30) * 100
  const recencyFactor = Math.max(0, 100 - (daysSinceLast * 10))
  const consistencyScore = Math.round((streakFactor * 0.4) + (activityFrequency * 0.4) + (recencyFactor * 0.2))

  return (
    <div className="min-h-screen bg-[#0b0f14] text-slate-200 font-inter p-6 flex flex-col gap-10">
      <div className="text-3xl font-bold flex items-center gap-3">
        <Activity className="text-indigo-400" />
        Premium Graph & Insights Showcase
      </div>

      <div className="bg-white/5 p-6 rounded-2xl ring-1 ring-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-lg flex items-center gap-2"><Flame className="text-pink-400"/> Daily Progress</div>
          <div className="text-slate-400 text-sm">Problems solved per day</div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyData}>
            <XAxis dataKey="day" stroke="#475569" />
            <YAxis stroke="#475569" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}/>
            <Line type="monotone" dataKey="problems" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#a5b4fc' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/5 p-6 rounded-2xl ring-1 ring-white/10 grid grid-cols-2 gap-10 items-center">
        <div>
          <div className="font-semibold text-lg flex items-center gap-2"><Target className="text-cyan-300"/> Topic Breakdown</div>
          <div className="text-slate-400 text-sm mb-4">Distribution of problems across topics</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={topicData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {topicData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="text-sm space-y-2">
          {topicData.map((t, i) => (
            <li key={i} className="flex justify-between bg-white/5 p-3 rounded-md">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}}></span>{t.name}</span>
              <span>{t.value}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white/5 p-6 rounded-2xl ring-1 ring-white/10 grid grid-cols-2 gap-10 items-center">
        <div>
          <div className="font-semibold text-lg mb-2 flex items-center gap-2"><TrendingUp className="text-emerald-300"/> Consistency Score</div>
          <div className="text-slate-400 text-sm mb-4">Your overall coding focus & engagement</div>
          <div className="relative w-40 h-40 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-300 to-pink-300 opacity-20" />
            <div className="flex items-center justify-center w-full h-full rounded-full border-[10px] border-indigo-300/40 text-3xl font-bold text-indigo-300">{consistencyScore}%</div>
          </div>
        </div>
        <div>
          <div className="font-semibold text-lg mb-2 flex items-center gap-2"><Award className="text-yellow-300"/> Achievements</div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
              <span className="text-xl">🔥</span> 7-Day Streak Maintained
            </li>
            <li className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
              <span className="text-xl">💪</span> Solved 100 Problems Total
            </li>
            <li className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
              <span className="text-xl">⚡</span> Completed All Easy Problems This Week
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white/5 p-6 rounded-2xl ring-1 ring-white/10">
        <div className="font-semibold text-lg mb-2 flex items-center gap-2"><CalendarIcon className="text-yellow-300"/> Streak Tracker</div>
        <div className="text-slate-400 text-sm mb-4">Track your daily coding streaks visually</div>
        <div className="rounded-xl overflow-hidden max-w-md mx-auto backdrop-blur-sm">
          <Calendar
            className="!bg-[#0b0f14] !text-slate-200 !border-none [&_.react-calendar__tile]:!text-slate-300 [&_.react-calendar__tile--now]:!bg-indigo-400/30 [&_.react-calendar__tile--active]:!bg-indigo-300 !rounded-xl [&_.react-calendar__navigation]:!text-slate-400 [&_.react-calendar__month-view__weekdays]:!text-slate-500"
            tileClassName={tileClassName}
          />
        </div>
      </div>
    </div>
  )
}
