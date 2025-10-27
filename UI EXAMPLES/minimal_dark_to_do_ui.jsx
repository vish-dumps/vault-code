import React, { useState } from 'react'
import { Plus, CheckCircle, Circle } from 'lucide-react'

export default function MinimalTodo() {
  const [tasks, setTasks] = useState([])
  const [input, setInput] = useState('')

  const addTask = () => {
    if (!input.trim()) return
    setTasks([...tasks, { id: Date.now(), text: input.trim(), done: false }])
    setInput('')
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, done: !task.done } : task))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center text-slate-200 p-6 font-inter">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md p-6 rounded-2xl ring-1 ring-white/10 shadow-xl">
        <h1 className="text-2xl font-semibold mb-6 text-center">Today's Focus</h1>

        <div className="flex items-center mb-5 gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button onClick={addTask} className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        <ul className="space-y-3">
          {tasks.length === 0 && <p className="text-slate-500 text-center text-sm">No tasks yet. Start your day strong 💪</p>}

          {tasks.map(task => (
            <li key={task.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 transition-all hover:bg-white/10">
              <button onClick={() => toggleTask(task.id)} className="flex items-center gap-3">
                {task.done ? <CheckCircle className="text-emerald-400 w-5 h-5" /> : <Circle className="text-slate-500 w-5 h-5" />}
                <span className={`${task.done ? 'line-through text-slate-500' : ''}`}>{task.text}</span>
              </button>
              <button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-pink-400 transition-all">✕</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
