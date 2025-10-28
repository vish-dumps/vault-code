import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, CheckCircle2, Calendar, Code2 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#101820] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#1c1f25] bg-[#111a24]">
        <h1 className="text-2xl font-bold text-green-400">CodeVault</h1>
        <div className="flex items-center gap-3">
          <p className="text-gray-400 text-sm">Welcome, Vishwas 👋</p>
          <img src="https://cdn-icons-png.flaticon.com/512/847/847969.png" className="w-8 h-8 rounded-full" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex gap-8 px-8 py-6">
        {/* Left section - Learning Cards */}
        <div className="flex-1 grid grid-cols-3 gap-6">
          {[
            { title: "Today's Goal", icon: <Flame className="text-orange-400" />, value: "2/5 solved" },
            { title: "Streak", icon: <Flame className="text-red-400" />, value: "🔥 7 Days" },
            { title: "Snippets", icon: <Code2 className="text-blue-400" />, value: "12 saved" },
          ].map((card, i) => (
            <motion.div
              whileHover={{ scale: 1.05 }}
              key={i}
              className="bg-[#16222f] rounded-2xl p-6 flex flex-col justify-center items-start shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3 text-xl">{card.icon}<span className="font-semibold">{card.title}</span></div>
              <p className="text-gray-300 text-sm">{card.value}</p>
            </motion.div>
          ))}

          {/* Upcoming contests card */}
          <Card className="bg-[#16222f] rounded-2xl p-6 col-span-2 border-none">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg text-purple-300"><Calendar /> Upcoming Contests</h2>
            <div className="space-y-3">
              {[
                { name: "Codeforces Round #912", date: "Oct 25, 2025" },
                { name: "LeetCode Weekly 419", date: "Oct 27, 2025" },
              ].map((contest, i) => (
                <div key={i} className="flex justify-between items-center bg-[#1c2b3a] px-4 py-3 rounded-xl text-sm text-gray-300">
                  <span>{contest.name}</span>
                  <span className="text-gray-500">{contest.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right section - To Do */}
        <div className="w-80 bg-[#16222f] rounded-2xl p-6 flex flex-col">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-blue-300"><CheckCircle2 /> To-Do List</h2>
          <div className="flex mb-4">
            <input className="flex-1 bg-[#1c2b3a] rounded-xl px-3 py-2 text-sm text-white" placeholder="Add a task..." />
            <Button className="ml-2 bg-green-500 hover:bg-green-600 text-white rounded-xl">+</Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {["Solve a DP problem", "Revise Graphs", "Review CodeVault UI"].map((task, i) => (
              <motion.div
                whileHover={{ scale: 1.02 }}
                key={i}
                className="bg-[#1c2b3a] rounded-xl px-4 py-3 flex justify-between items-center text-sm text-gray-300"
              >
                <span>{task}</span>
                <CheckCircle2 size={18} className="text-gray-600 hover:text-green-400 cursor-pointer" />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Progress */}
      <footer className="px-8 py-4 border-t border-[#1c1f25] bg-[#111a24] flex justify-between items-center">
        <div className="text-sm text-gray-400">Keep your streak alive 🔥</div>
        <Button className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-5 py-2 text-sm">Start Coding</Button>
      </footer>
    </div>
  );
}
