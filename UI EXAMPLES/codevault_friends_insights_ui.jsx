import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flame, Users, Zap, ArrowUpRight, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Friends Insights — modern, animated, gradient-heavy UI for CodeVault
export default function FriendsInsights() {
  // placeholder data
  const friends = [
    { id: 1, name: 'Aryan Khan', xpWeek: 120, streak: 6, focus: { DP: 40, Graphs: 30, Greedy: 20, Other: 10 } },
    { id: 2, name: 'Maya Rao', xpWeek: 95, streak: 3, focus: { DP: 15, Graphs: 25, Greedy: 30, Other: 30 } },
    { id: 3, name: 'Sam Lee', xpWeek: 73, streak: 2, focus: { DP: 10, Graphs: 10, Greedy: 50, Other: 30 } },
  ]

  const totalMomentum = [30, 45, 60, 80, 95, 120, 150] // last 7 days XP

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#041426] via-[#062033] to-[#071a12] text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-indigo-400">Friends & Insights</h1>
            <p className="text-slate-300 mt-1">Track friends' progress, streaks, and team momentum — keep the squad motivated.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-[#7f00ff] to-[#00d2ff] px-4 py-2 rounded-lg">Invite Friends</Button>
            <Button className="px-4 py-2 border border-white/10 bg-black/20">Create Challenge</Button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-black/40 to-white/2 border border-white/6 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-tr from-[#ff7ae5]/20 to-[#00d2ff]/10">
                  <Trophy className="text-amber-300" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">This Week's Top</div>
                  <div className="text-xl font-bold">{friends[0].name}</div>
                </div>
                <div className="ml-auto text-emerald-300 font-semibold">+{friends[0].xpWeek} XP</div>
              </div>

              <div className="mt-5">
                <div className="text-sm text-slate-400 mb-2">Team XP Momentum</div>
                <MomentumSparkline values={totalMomentum} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black/40 to-white/2 border border-white/6 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-tr from-[#ffb86b]/20 to-[#ff7a7a]/10">
                  <Flame className="text-orange-300" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Top Streak</div>
                  <div className="text-xl font-bold">{friends[0].name} — {friends[0].streak} days</div>
                </div>
                <div className="ml-auto text-pink-300 font-semibold">Keep it up!</div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {friends.map(f => (
                  <StreakCard key={f.id} friend={f} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black/40 to-white/2 border border-white/6 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-tr from-[#8be9fd]/20 to-[#6fffb5]/10">
                  <Users className="text-blue-300" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Shared Solves</div>
                  <div className="text-xl font-bold">You & Aryan</div>
                </div>
                <div className="ml-auto text-cyan-300 font-semibold">3 problems</div>
              </div>

              <div className="mt-4">
                <div className="flex gap-2 flex-wrap">
                  <Tag label="Graph - 1843A" />
                  <Tag label="DP - 1705B" />
                  <Tag label="Greedy - 1600A" />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button className="px-4 py-2 bg-gradient-to-r from-[#ff7ae5] to-[#00d2ff]">Open shared list</Button>
                <Button className="px-4 py-2 border border-white/8 bg-black/20">Challenge Aryan</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard + Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card className="col-span-2 bg-black/40 border border-white/6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">XP Leaderboard</h3>
                  <p className="text-sm text-slate-400">Weekly XP across your friends</p>
                </div>
                <div className="text-sm text-slate-400">View: Weekly ▾</div>
              </div>

              <div className="space-y-3">
                {friends.map((f, i) => (
                  <motion.div key={f.id} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: i*0.08 }} className="p-3 rounded-lg bg-gradient-to-r from-white/2 to-black/10 flex items-center">
                    <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#7f00ff]/30 to-[#00d2ff]/10 flex items-center justify-center font-semibold">{i+1}</div>
                    <div className="ml-4">
                      <div className="font-semibold">{f.name}</div>
                      <div className="text-sm text-slate-400">Solved this week: {Math.round(f.xpWeek/30)} problems</div>
                    </div>
                    <div className="ml-auto w-2/5">
                      <ProgressBar value={Math.min(f.xpWeek, 150)} max={150} />
                    </div>
                    <div className="ml-4 text-emerald-300 font-semibold">{f.xpWeek} XP</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border border-white/6">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold mb-2">Problem Type Breakdown</h3>
              <p className="text-sm text-slate-400 mb-4">See what areas your friends are focusing on.</p>

              <div className="space-y-4">
                {friends.map(f => (
                  <div key={f.id} className="flex items-center gap-3">
                    <div className="w-9 text-sm font-semibold">{f.name.split(' ')[0]}</div>
                    <MiniDonut data={f.focus} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Challenges / CTA / Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card className="col-span-2 bg-gradient-to-br from-black/40 to-white/2 border border-white/6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">Challenge of the Week</h3>
                  <p className="text-sm text-slate-400">Graph Gauntlet — Solve 3 graph problems by Sunday</p>
                </div>
                <div className="text-sm text-slate-400">Progress: 40%</div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="w-3/4">
                  <ProgressBar value={40} max={100} colorFrom="#ff7ae5" colorTo="#00d2ff"/>
                </div>
                <div className="w-1/4 text-right">
                  <Button className="px-4 py-2 bg-gradient-to-r from-[#ff7ae5] to-[#00d2ff]">Join Challenge</Button>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Recent Friend Activity</h4>
                <div className="space-y-3">
                  <ActivityItem verb="solved" who="Maya Rao" what="DP - 1705B" xp={80} />
                  <ActivityItem verb="streak" who="Aryan Khan" what="6 days" xp={0} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border border-white/6">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold">Quick Actions</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Button className="px-4 py-3 bg-gradient-to-r from-[#7f00ff] to-[#00d2ff]">Start Collab Room</Button>
                <Button className="px-4 py-3 border border-white/8 bg-black/20">Message Group</Button>
                <Button className="px-4 py-3 border border-white/8 bg-black/20">Compare Streaks</Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* small utilities & styles */}
      <style jsx>{`
        .sparkline path{ stroke: url(#g); stroke-width: 3; fill: transparent; stroke-linecap: round }
        .progress-bg{ background: linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02)); border-radius: 9999px }
      `}</style>
    </div>
  )
}

function StreakCard({ friend }){
  return (
    <div className="p-3 rounded-lg bg-gradient-to-tr from-white/2 to-black/10 flex items-center gap-3">
      <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#ffb86b]/30 to-[#ff7a7a]/10 flex items-center justify-center"> 
        <Flame className="text-orange-300" />
      </div>
      <div>
        <div className="font-semibold">{friend.name}</div>
        <div className="text-sm text-slate-400">{friend.streak} day streak</div>
      </div>
      <div className="ml-auto font-semibold text-emerald-300">{friend.xpWeek} XP</div>
    </div>
  )
}

function Tag({ label }){
  return <div className="px-3 py-1 rounded-full bg-black/20 border border-white/6 text-sm text-slate-200">{label}</div>
}

function ProgressBar({ value=50, max=150, colorFrom='#7f00ff', colorTo='#00d2ff'}){
  const pct = Math.round((value/max)*100)
  return (
    <div className="w-full">
      <div className="progress-bg h-3 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9999, background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }} />
      </div>
      <div className="text-xs text-slate-400 mt-1">{pct}% of weekly goal</div>
    </div>
  )
}

function MomentumSparkline({ values }){
  const w = 240, h = 60
  const max = Math.max(...values)
  const points = values.map((v, i) => `${(i/(values.length-1))*w},${h - (v/max)*h}`).join(' ')
  return (
    <svg width={w} height={h} className="sparkline">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="#ff7ae5" />
          <stop offset="100%" stopColor="#00d2ff" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function MiniDonut({ data }){
  const entries = Object.entries(data)
  const total = entries.reduce((s,[,v])=>s+v,0)
  let acc = 0
  const radius = 18
  const circ = 2*Math.PI*radius
  return (
    <svg width={120} height={48} viewBox="0 0 120 48">
      <g transform="translate(10,24)">
        {entries.map(([k,v],i)=>{
          const len = circ*(v/total)
          const dash = `${len} ${circ-len}`
          const rotate = (acc/total)*360
          acc += v
          const colors = ['#7f00ff','#00d2ff','#ff7ae5','#ffd166']
          return <circle key={k} r={radius} cx={0} cy={0} fill="transparent" stroke={colors[i%colors.length]} strokeWidth={6} strokeDasharray={dash} transform={`rotate(${rotate})`} strokeLinecap="round" />
        })}
      </g>
    </svg>
  )
}

function ActivityItem({ verb, who, what, xp }){
  return (
    <div className="p-3 rounded-lg bg-gradient-to-r from-white/2 to-black/10 flex items-center gap-4">
      <div className="p-2 rounded-md bg-black/20 border border-white/6"><MessageSquare /></div>
      <div>
        <div className="font-semibold">{who} {verb} <span className="text-cyan-300">{what}</span></div>
        <div className="text-sm text-slate-400">{xp>0 ? `+${xp} XP` : 'Activity'}</div>
      </div>
    </div>
  )
}
