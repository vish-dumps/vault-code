import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Check, 
  Clock, 
  GripVertical, 
  Trash2, 
  MoreHorizontal, 
  Calendar,
  AlertCircle
} from 'lucide-react';

// --- Utility Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const PRESET_COLORS = [
  'bg-rose-500',   // Urgent
  'bg-amber-500',  // Work
  'bg-emerald-500', // Personal
  'bg-blue-500',   // Health
  'bg-violet-500', // Learning
];

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// --- Components ---

const TaskItem = ({ 
  task, 
  index, 
  onToggle, 
  onDelete, 
  onExtend, 
  onDragStart, 
  onDragEnter, 
  onDragEnd 
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  // Calculate time left for display
  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const diff = task.expiresAt - now;

      if (task.status === 'done') {
        setTimeLeft('Completed');
        return;
      }

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m left`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [task.expiresAt, task.status]);

  const isExpired = task.status !== 'done' && Date.now() > task.expiresAt;

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative flex items-center gap-4 p-4 mb-3 rounded-xl 
        bg-[#161b22] border border-white/5 shadow-sm
        transition-all duration-300 ease-out
        ${isHovered ? 'translate-x-1 border-white/10 shadow-lg shadow-black/20' : ''}
        ${task.status === 'done' ? 'opacity-60' : 'opacity-100'}
        cursor-grab active:cursor-grabbing
      `}
    >
      {/* Color Indicator Strip */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${task.color} opacity-80`} />

      {/* Drag Handle */}
      <div className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-1">
        <GripVertical size={16} />
      </div>

      {/* Checkbox */}
      <button 
        onClick={() => onToggle(task.id)}
        className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
          ${task.status === 'done' 
            ? 'bg-blue-500 border-blue-500 scale-100' 
            : 'border-gray-600 hover:border-blue-400 bg-transparent scale-90 hover:scale-100'}
        `}
      >
        {task.status === 'done' && <Check size={14} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <span className={`
          text-sm font-medium transition-all duration-300
          ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200'}
        `}>
          {task.content}
        </span>
        
        {/* Meta Info */}
        <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-wider font-semibold text-gray-500">
          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : ''}`}>
             {isExpired ? <AlertCircle size={10} /> : <Clock size={10} />}
             {timeLeft}
          </span>
          
          {/* Extension Dots */}
          {task.status !== 'done' && !isExpired && (
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-1 rounded-full ${i < task.extensions ? 'bg-blue-500' : 'bg-gray-700'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Extend/Cycle Timer Button */}
        {task.status !== 'done' && !isExpired && (
          <button 
            onClick={() => onExtend(task.id)}
            title={task.extensions >= 3 ? "Reset to Day 1" : "Extend +1 Day"}
            className={`
              p-2 rounded-lg transition-colors duration-200
              ${task.extensions > 0 
                ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' // Active state
                : 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10'} // Inactive state
            `}
          >
            <Calendar size={16} />
          </button>
        )}
        
        {/* Delete Button */}
        <button 
          onClick={() => onDelete(task.id)}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const PremiumTodoList = () => {
  const [tasks, setTasks] = useState([
    { 
      id: '1', 
      content: "Review Q3 Design System", 
      status: 'active', 
      createdAt: Date.now(), 
      expiresAt: Date.now() + ONE_DAY_MS, 
      extensions: 0, 
      color: 'bg-blue-500' 
    },
    { 
      id: '2', 
      content: "Update Client Prototypes", 
      status: 'active', 
      createdAt: Date.now(), 
      expiresAt: Date.now() + (ONE_DAY_MS * 0.5), 
      extensions: 1, 
      color: 'bg-rose-500' 
    },
    { 
      id: '3', 
      content: "Team Sync @ 4PM", 
      status: 'done', 
      createdAt: Date.now() - ONE_DAY_MS, 
      expiresAt: Date.now(), 
      extensions: 0, 
      color: 'bg-emerald-500' 
    }
  ]);
  
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'done'
  const [newTask, setNewTask] = useState('');
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // --- Handlers ---

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task = {
      id: generateId(),
      content: newTask,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + ONE_DAY_MS,
      extensions: 0, 
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
    };

    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleStatus = (id) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, status: t.status === 'active' ? 'done' : 'active' } : t
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Logic to toggle/cycle extension
  const toggleExtension = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        if (t.extensions < 3) {
          // Extend by 1 day
          return {
            ...t,
            expiresAt: t.expiresAt + ONE_DAY_MS,
            extensions: t.extensions + 1
          };
        } else {
          // Reset to original (remove all added days)
          return {
            ...t,
            expiresAt: t.expiresAt - (t.extensions * ONE_DAY_MS),
            extensions: 0
          };
        }
      }
      return t;
    }));
  };

  // --- Drag & Drop Handlers ---

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    // Hide the ghost image slightly for cleaner look (optional)
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    const _tasks = [...tasks];
    const draggedItemContent = _tasks[dragItem.current];
    
    // Remove the item
    _tasks.splice(dragItem.current, 1);
    
    // Add it back at new position
    _tasks.splice(dragOverItem.current, 0, draggedItemContent);

    dragItem.current = null;
    dragOverItem.current = null;
    setTasks(_tasks);
  };

  // --- Filtering ---

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  // Calculate Progress
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progress = totalTasks === 0 ? 0 : (completedCount / totalTasks) * 100;

  return (
    <div className="min-h-screen bg-[#090e14] text-white font-sans flex items-center justify-center p-6">
      
      {/* App Container */}
      <div className="w-full max-w-md bg-[#0d1218] rounded-3xl shadow-2xl border border-white/5 overflow-hidden flex flex-col h-[700px]">
        
        {/* Header Section */}
        <div className="p-8 pb-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Focus
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            {/* Stats pill with Progress Bar */}
            <div className="bg-[#161b22] pl-3 pr-2 py-1.5 rounded-full border border-white/5 flex items-center gap-3 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                {tasks.filter(t => t.status === 'active').length} PENDING
              </span>
              <div className="w-10 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleAddTask} className="relative group z-20">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-[#161b22] text-gray-200 text-sm p-4 pr-12 rounded-xl border border-white/5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-gray-600"
            />
            <button 
              type="submit"
              disabled={!newTask.trim()}
              className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-0 disabled:scale-75 duration-200"
            >
              <Plus size={16} />
            </button>
          </form>
        </div>

        {/* Custom Tab Switcher */}
        <div className="px-8 mb-4">
          <div className="flex p-1 bg-[#161b22] rounded-xl border border-white/5 relative">
            {/* Animated Background Pill */}
            <div 
              className="absolute h-[calc(100%-8px)] top-1 bg-[#252f3d] rounded-lg transition-all duration-300 ease-out shadow-sm"
              style={{
                width: '32%',
                left: filter === 'all' ? '4px' : filter === 'active' ? '34%' : '66.5%'
              }}
            />
            
            {['all', 'active', 'done'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`
                  flex-1 py-2 text-xs font-semibold capitalize z-10 transition-colors duration-200
                  ${filter === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Task List - Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
          {filteredTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Check size={24} />
              </div>
              <p className="text-sm">No tasks found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTasks.map((task, index) => (
                <TaskItem 
                  key={task.id}
                  index={index}
                  task={task}
                  onToggle={toggleStatus}
                  onDelete={deleteTask}
                  onExtend={toggleExtension}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Gradient Fade */}
        <div className="h-8 bg-gradient-to-t from-[#0d1218] to-transparent pointer-events-none -mt-8 z-10" />
      </div>
    </div>
  );
};

export default PremiumTodoList;