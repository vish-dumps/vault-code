import React, { useState } from 'react';
import { 
  Users, 
  BarChart2, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Trophy, 
  Zap, 
  Activity, 
  LayoutDashboard, 
  Code, 
  CheckCircle, 
  Settings, 
  LogOut,
  Flame,
  ArrowUpRight,
  MessageSquare,
  Shield
} from 'lucide-react';

// --- Mock Data ---

const FRIENDS_DATA = [
  {
    id: 1,
    name: 'Ravi Gupta',
    handle: '@ravidra4949',
    rank: 'Apprentice',
    xp: 364,
    streak: 2,
    status: 'online',
    avatarColor: 'bg-indigo-500',
    tags: ['Mutual']
  },
  {
    id: 2,
    name: 'Aryan Khan',
    handle: '@vishwas124653',
    rank: 'Apprentice',
    xp: 283,
    streak: 0,
    status: 'offline',
    avatarColor: 'bg-blue-500',
    tags: ['Mutual']
  },
  {
    id: 3,
    name: 'Divya Shri',
    handle: '@vishwas57968',
    rank: 'Novice',
    xp: 120, // Adjusted for visual difference
    streak: 0,
    status: 'idle',
    avatarColor: 'bg-pink-500',
    tags: ['Mutual']
  }
];

const RECENT_ACTIVITY = [
  { id: 1, user: 'Aryan Khan', action: 'Connected with', target: 'Divya Shri', time: '23 days ago', type: 'connect' },
  { id: 2, user: 'Divya Shri', action: 'Connected with', target: 'Aryan Khan', time: '23 days ago', type: 'connect' },
  { id: 3, user: 'Ravi Gupta', action: 'Solved', target: 'Combination Sum', time: '27 days ago', type: 'solve' },
  { id: 4, user: 'Vishwas Soni', action: 'Reached', target: 'Level 5', time: '1 month ago', type: 'achievement' },
];

const SPRINT_DATA = [
  { name: 'Ravi', progress: 85, color: 'bg-emerald-400' },
  { name: 'Aryan', progress: 60, color: 'bg-blue-400' },
  { name: 'Divya', progress: 30, color: 'bg-purple-400' },
  { name: 'You', progress: 45, color: 'bg-gray-400' },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active }) => (
  <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${
    active 
      ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-400 border-l-2 border-teal-400' 
      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
  }`}>
    <Icon size={20} className={`${active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
    <span className="font-medium text-sm">{label}</span>
  </div>
);

const UserAvatar = ({ name, color, size = 'md', status }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-500',
    idle: 'bg-amber-500'
  };

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} ${color} rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-slate-800`}>
        {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      {status && (
        <div className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[status]} border-2 border-slate-900 rounded-full`}></div>
      )}
    </div>
  );
};

const RankBadge = ({ rank }) => {
  const colors = {
    Apprentice: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    Novice: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Master: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold border ${colors[rank] || colors.Novice}`}>
      {rank}
    </span>
  );
};

// --- Main Views ---

const FriendsList = () => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-100">Your Friends</h3>
          <p className="text-sm text-slate-400 mt-1">Total 3 • Mutual friends 3</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
          <Search size={18} className="text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="Search friends..." 
            className="bg-transparent border-none focus:outline-none text-sm text-slate-200 placeholder-slate-500 w-48"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FRIENDS_DATA.map((friend) => (
          <div key={friend.id} className="group bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:border-teal-500/30 rounded-2xl p-5 transition-all duration-300 hover:bg-slate-800/60 hover:shadow-xl hover:shadow-teal-900/10 flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
              <div className="flex space-x-4">
                <UserAvatar name={friend.name} color={friend.avatarColor} status={friend.status} />
                <div>
                  <h4 className="font-semibold text-slate-200 group-hover:text-teal-400 transition-colors">{friend.name}</h4>
                  <p className="text-xs text-slate-500 mb-2">{friend.handle}</p>
                  <RankBadge rank={friend.rank} />
                </div>
              </div>
              <button className="text-slate-500 hover:text-white transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/50 rounded-lg p-2 text-center border border-slate-700/30">
                <p className="text-slate-500 mb-1">Total XP</p>
                <p className="text-amber-400 font-bold text-lg">{friend.xp}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2 text-center border border-slate-700/30">
                <p className="text-slate-500 mb-1">Streak</p>
                <div className="flex items-center justify-center space-x-1">
                  <Flame size={14} className={friend.streak > 0 ? "text-orange-500" : "text-slate-600"} />
                  <p className={`font-bold text-lg ${friend.streak > 0 ? "text-slate-200" : "text-slate-600"}`}>
                    {friend.streak}
                  </p>
                </div>
              </div>
            </div>

            <button className="w-full mt-auto py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-xs font-semibold border border-teal-500/20 transition-all">
              View Profile
            </button>
          </div>
        ))}

        {/* Add Friend Card */}
        <div className="bg-slate-800/20 border border-dashed border-slate-700 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/40 hover:border-slate-500 transition-all h-48">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3 group-hover:text-white group-hover:bg-slate-700 transition-all">
            <UserPlus size={24} />
          </div>
          <h4 className="font-medium text-slate-300">Add New Friend</h4>
          <p className="text-xs text-slate-500 mt-1">Expand your coding circle</p>
        </div>
      </div>
    </div>
  );
};

const InsightsDashboard = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Weekly Rank</p>
              <h3 className="text-3xl font-bold text-white mt-1">#4</h3>
              <p className="text-xs text-indigo-300 mt-2 flex items-center">
                <ArrowUpRight size={12} className="mr-1" /> Top 15% of friends
              </p>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Trophy size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/20 to-slate-900 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Active Streak</p>
              <h3 className="text-3xl font-bold text-white mt-1">2 <span className="text-sm font-normal text-slate-500">days</span></h3>
              <p className="text-xs text-amber-500 mt-2 flex items-center">
                <Flame size={12} className="mr-1" fill="currentColor" /> Keep it burning!
              </p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
              <Zap size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total XP Gain</p>
              <h3 className="text-3xl font-bold text-white mt-1">+1,240</h3>
              <p className="text-xs text-emerald-400 mt-2">
                 This week
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Activity size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Momentum Chart */}
        <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-100 flex items-center">
              <BarChart2 size={18} className="mr-2 text-teal-400" />
              Team XP Momentum
            </h3>
            <select className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-teal-500">
              <option>This Week</option>
              <option>Last Week</option>
              <option>All Time</option>
            </select>
          </div>
          
          <div className="space-y-6">
            {SPRINT_DATA.map((item, index) => (
              <div key={index} className="relative">
                <div className="flex justify-between text-xs mb-2">
                  <span className={`font-medium ${item.name === 'You' ? 'text-white' : 'text-slate-400'}`}>{item.name}</span>
                  <span className="text-slate-500">{item.progress * 12} XP</span>
                </div>
                <div className="h-3 w-full bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.color} shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-1000 ease-out`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <span>Sprint ends in 3 days</span>
            <button className="text-teal-400 hover:text-teal-300 font-medium">View detailed analysis</button>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-100 mb-6 flex items-center">
            <Activity size={18} className="mr-2 text-blue-400" />
            Recent Activity
          </h3>
          
          <div className="space-y-6 relative">
             {/* Vertical Line */}
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-700/50"></div>

            {RECENT_ACTIVITY.map((activity, idx) => (
              <div key={activity.id} className="relative flex items-start pl-8">
                <div className={`absolute left-0 w-5 h-5 rounded-full border-2 border-slate-800 flex items-center justify-center z-10
                  ${activity.type === 'connect' ? 'bg-blue-500' : 
                    activity.type === 'solve' ? 'bg-emerald-500' : 'bg-amber-500'
                  }
                `}>
                  {activity.type === 'connect' && <UserPlus size={10} className="text-white" />}
                  {activity.type === 'solve' && <CheckCircle size={10} className="text-white" />}
                  {activity.type === 'achievement' && <Trophy size={10} className="text-white" />}
                </div>
                
                <div>
                  <p className="text-sm text-slate-300 leading-snug">
                    <span className="font-semibold text-white hover:underline cursor-pointer">{activity.user}</span> 
                    <span className="text-slate-500"> {activity.action} </span>
                    <span className="text-teal-400">{activity.target}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
            View all activity
          </button>
        </div>
      </div>
    </div>
  );
};

// --- App Shell ---

const App = () => {
  const [activeTab, setActiveTab] = useState('friends');

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-300 font-sans selection:bg-teal-500/30 selection:text-teal-200 overflow-hidden">
      
      {/* Sidebar - Simplified for context */}
      <aside className="w-64 border-r border-slate-800/60 bg-[#0B1120] flex flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-white font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Code size={20} className="text-white" />
            </div>
            <span>CodeVault</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem icon={MessageSquare} label="Questions" />
          <SidebarItem icon={CheckCircle} label="Solved" />
          <SidebarItem icon={Code} label="Snippets" />
          <SidebarItem icon={Trophy} label="Contests" />
          <SidebarItem icon={Users} label="Friends" active />
          <div className="pt-4 mt-4 border-t border-slate-800/60">
            <SidebarItem icon={Settings} label="Settings" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-slate-900 font-bold">
              VS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Vishwas Soni</p>
              <p className="text-xs text-slate-500 truncate">Apprentice</p>
            </div>
            <LogOut size={16} className="text-slate-500 hover:text-red-400 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none" />
        
        {/* Header Area */}
        <header className="px-8 py-6 z-10">
          <h1 className="text-2xl font-bold text-white tracking-tight">Friends & Connections</h1>
          <p className="text-slate-400 mt-1 text-sm max-w-2xl">
            Connect with other coders, collaborate on problems, and track each other's progress in real-time.
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-slate-800/40 p-1 rounded-xl w-full max-w-2xl mt-8 border border-slate-700/50 backdrop-blur-md">
            {['friends', 'requests', 'discover', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? 'bg-slate-700 text-white shadow-lg shadow-black/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 z-10 scrollbar-hide">
          <div className="max-w-6xl">
            {activeTab === 'friends' && <FriendsList />}
            {activeTab === 'insights' && <InsightsDashboard />}
            {(activeTab === 'requests' || activeTab === 'discover') && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
                <Shield size={48} className="mb-4 opacity-50" />
                <p>This section is currently under construction.</p>
                <button 
                  onClick={() => setActiveTab('friends')}
                  className="mt-4 text-teal-400 hover:underline text-sm"
                >
                  Go back to Friends
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Nav Helper (Visual only for this demo) */}
      <div className="md:hidden fixed bottom-0 w-full bg-slate-900/90 backdrop-blur border-t border-slate-800 flex justify-around p-4 z-50">
        <LayoutDashboard size={24} className="text-slate-500" />
        <Users size={24} className="text-teal-400" />
        <Settings size={24} className="text-slate-500" />
      </div>
    </div>
  );
};

export default App;