import React, { useState, useRef, useEffect } from "react";
import {
    Plus,
    Check,
    Clock,
    GripVertical,
    Trash2,
    Calendar,
    AlertCircle,
    ListFilter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface Todo {
    id: string;
    title: string;
    completed: boolean;
    order: number;
    retainUntil?: string | null;
    createdAt: string;
}

interface TodoListCardProps {
    todos: Todo[];
    className?: string;
    onAdd: (title: string) => void;
    onToggle: (id: string, completed: boolean) => void;
    onDelete: (id: string) => void;
    onReorder: (ids: string[]) => void;
    onUpdateRetention: (id: string, days: number | null) => void;
}

const PRESET_COLORS = [
    'bg-rose-500',   // Urgent
    'bg-amber-500',  // Work
    'bg-emerald-500', // Personal
    'bg-blue-500',   // Health
    'bg-violet-500', // Learning
];

const getTaskColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PRESET_COLORS[Math.abs(hash) % PRESET_COLORS.length];
};

const TaskItem = ({
    task,
    index,
    onToggle,
    onDelete,
    onExtend,
    onDragStart,
    onDragEnter,
    onDragEnd
}: {
    task: Todo;
    index: number;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onExtend: (id: string) => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragEnter: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
}) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isHovered, setIsHovered] = useState(false);

    const created = new Date(task.createdAt).getTime();
    const expires = task.retainUntil ? new Date(task.retainUntil).getTime() : created + ONE_DAY_MS;
    const extensionLevel = Math.max(0, Math.round((expires - (created + ONE_DAY_MS)) / ONE_DAY_MS));

    useEffect(() => {
        const updateTime = () => {
            const now = Date.now();
            const diff = expires - now;

            if (task.completed) {
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
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [expires, task.completed]);

    const isExpired = !task.completed && Date.now() > expires;

    return (
        <div
            draggable={!task.completed}
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnter={(e) => onDragEnter(e, index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "group relative flex items-center gap-3 p-3 mb-2 rounded-lg border shadow-sm transition-all duration-300 ease-out",
                "bg-secondary/20 border-border hover:border-primary/20",
                isHovered ? "translate-x-1 shadow-md" : "",
                task.completed ? "opacity-60" : "opacity-100",
                !task.completed ? "cursor-grab active:cursor-grabbing" : ""
            )}
        >
            {/* Color Indicator Strip */}
            <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${getTaskColor(task.id)} opacity-80`} />

            {/* Drag Handle */}
            {!task.completed && (
                <div className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-1">
                    <GripVertical size={14} />
                </div>
            )}

            {/* Checkbox */}
            <button
                onClick={() => onToggle(task.id)}
                className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    task.completed
                        ? "bg-primary border-primary scale-100"
                        : "border-muted-foreground/40 hover:border-primary bg-transparent scale-90 hover:scale-100"
                )}
            >
                {task.completed && <Check size={12} className="text-primary-foreground" />}
            </button>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center overflow-hidden py-0.5">
                <span className={cn(
                    "text-sm font-medium transition-all duration-300 truncate",
                    task.completed ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                    {task.title}
                </span>

                {/* Meta Info */}
                <div className="flex items-center gap-3 mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    <span className={cn("flex items-center gap-1", isExpired ? "text-destructive" : "")}>
                        {isExpired ? <AlertCircle size={10} /> : <Clock size={10} />}
                        {timeLeft}
                    </span>

                    {/* Extension Dots */}
                    {!task.completed && !isExpired && (
                        <div className="flex gap-0.5">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className={cn("w-1 h-1 rounded-full", i < extensionLevel ? "bg-primary" : "bg-muted-foreground/30")}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {/* Extend Button */}
                {!task.completed && !isExpired && (
                    <button
                        onClick={() => onExtend(task.id)}
                        title={extensionLevel >= 3 ? "Reset to Day 1" : "Extend +1 Day"}
                        className={cn(
                            "p-1.5 rounded-md transition-colors duration-200",
                            extensionLevel > 0
                                ? "text-primary bg-primary/10 hover:bg-primary/20"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        )}
                    >
                        <Calendar size={14} />
                    </button>
                )}

                {/* Delete Button */}
                <button
                    onClick={() => onDelete(task.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

export function TodoListCard({
    todos,
    className,
    onAdd,
    onToggle,
    onDelete,
    onReorder,
    onUpdateRetention
}: TodoListCardProps) {
    const [newTask, setNewTask] = useState("");
    const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active');

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.trim()) {
            onAdd(newTask.trim());
            setNewTask("");
        }
    };

    const handleExtension = (task: Todo) => {
        const created = new Date(task.createdAt).getTime();
        const expires = task.retainUntil ? new Date(task.retainUntil).getTime() : created + ONE_DAY_MS;
        const currentLevel = Math.max(0, Math.round((expires - (created + ONE_DAY_MS)) / ONE_DAY_MS));
        const nextLevel = currentLevel >= 3 ? 0 : currentLevel + 1;
        const extraDays = nextLevel;
        onUpdateRetention(task.id, extraDays === 0 ? null : extraDays);
    };

    const sortedTodos = [...todos].sort((a, b) => a.order - b.order);

    const filteredTodos = sortedTodos.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'active') return !t.completed;
        if (filter === 'done') return t.completed;
        return true;
    });

    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        if (dragItem.current === dragOverItem.current) return;

        const _todos = [...filteredTodos];
        const draggedItemContent = _todos[dragItem.current];
        _todos.splice(dragItem.current, 1);
        _todos.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        const newFilteredIds = _todos.map(t => t.id);
        const otherIds = todos.filter(t => !newFilteredIds.includes(t.id)).map(t => t.id);

        onReorder([...newFilteredIds, ...otherIds]);
    };

    const totalTasks = todos.length;
    const completedCount = todos.filter(t => t.completed).length;
    const progress = totalTasks === 0 ? 0 : (completedCount / totalTasks) * 100;

    return (
        <Card className={cn("relative flex flex-col h-full overflow-hidden border bg-card shadow-xl rounded-xl", className)}>
            {/* Header Section */}
            <div className="p-6 pb-2 shrink-0">
                <div className="flex justify-between items-end mb-4 gap-4">
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            Focus
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium tracking-wide">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Dropdown Filter */}
                        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                            <SelectTrigger className="w-[85px] h-7 text-[10px] bg-secondary/30 border-border focus:ring-0 gap-1 px-2">
                                <ListFilter className="w-3 h-3 opacity-70" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="active" className="text-xs">Active</SelectItem>
                                <SelectItem value="done" className="text-xs">Done</SelectItem>
                                <SelectItem value="all" className="text-xs">All</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Input Area */}
                <form onSubmit={handleAddTask} className="relative group z-20 mb-2">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full bg-secondary/20 text-foreground text-sm p-3 pr-12 rounded-lg border border-border focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-muted-foreground/60"
                    />
                    <button
                        type="submit"
                        disabled={!newTask.trim()}
                        className="absolute right-1.5 top-1.5 p-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-0 disabled:scale-75 duration-200"
                    >
                        <Plus size={16} />
                    </button>
                </form>

                {/* Progress Bar (Compact) */}
                {totalTasks > 0 && (
                    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Task List - Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
                {filteredTodos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 min-h-[150px]">
                        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                            <Check size={20} />
                        </div>
                        <p className="text-xs">No tasks found</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredTodos.map((task, index) => (
                            <TaskItem
                                key={task.id}
                                index={index}
                                task={task}
                                onToggle={(id) => onToggle(id, !task.completed)}
                                onDelete={onDelete}
                                onExtend={() => handleExtension(task)}
                                onDragStart={handleDragStart}
                                onDragEnter={handleDragEnter}
                                onDragEnd={handleDragEnd}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Gradient Fade */}
            <div className="h-6 bg-gradient-to-t from-background/80 to-transparent pointer-events-none -mt-6 z-10" />
        </Card>
    );
}
