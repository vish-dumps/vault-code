import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Trophy, 
  Users, 
  Zap, 
  ChevronRight, 
  Star, 
  CheckCircle, 
  Terminal, 
  Cpu, 
  Shield, 
  Flame, 
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

// --- Custom Kody Mascot Component (SVG) ---
const Kody = ({ className = "w-32 h-32", expression = "happy", animate = true }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={`${className} ${animate ? 'animate-kody-float' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="fireGradient" x1="100" y1="180" x2="100" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF4500" /> 
          <stop offset="50%" stopColor="#FF7A5C" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main Flame Body */}
      <path 
        d="M100,185 C60,185 30,150 30,110 C30,70 60,80 70,40 C80,10 100,5 100,5 C100,5 120,10 130,40 C140,80 170,70 170,110 C170,150 140,185 100,185 Z" 
        fill="url(#fireGradient)" 
        filter="url(#glow)"
      />
      
      {/* Inner Flame Highlight */}
      <path 
        d="M100,165 C80,165 65,140 65,115 C65,90 85,100 85,70 C85,60 100,40 100,40 C100,40 115,60 115,70 C115,100 135,90 135,115 C135,140 120,165 100,165 Z" 
        fill="#FFD27F" 
        opacity="0.6"
      />

      {/* Eyes */}
      <g transform={expression === 'wink' ? 'translate(0, 5)' : ''}>
        <ellipse cx="75" cy="110" rx="12" ry="15" fill="#4A1C17" />
        <circle cx="78" cy="106" r="4" fill="white" />
        
        {expression === 'wink' ? (
           <path d="M113,110 L137,110" stroke="#4A1C17" strokeWidth="4" strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx="125" cy="110" rx="12" ry="15" fill="#4A1C17" />
            <circle cx="128" cy="106" r="4" fill="white" />
          </>
        )}
      </g>

      {/* Mouth */}
      <path 
        d="M85,135 Q100,150 115,135" 
        fill="none" 
        stroke="#4A1C17" 
        strokeWidth="4" 
        strokeLinecap="round"
      />
      
      {/* Arms (Optional cute stick arms) */}
      <path d="M40,120 Q20,110 30,90" stroke="#FF7A5C" strokeWidth="8" strokeLinecap="round" fill="none" className={animate ? "animate-wave" : ""} />
      <path d="M160,120 Q180,110 170,90" stroke="#FF7A5C" strokeWidth="8" strokeLinecap="round" fill="none" />
    </svg>
  );
};

// --- Reusable Components ---

const Section = ({ children, className = "", id = "" }) => (
  <section id={id} className={`py-20 px-6 relative overflow-hidden ${className}`}>
    {children}
  </section>
);

const Button = ({ children, variant = "primary", className = "", icon: Icon }) => {
  const baseStyle = "px-8 py-4 rounded-full font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-cyan-400 to-blue-600 text-white hover:shadow-cyan-500/50",
    secondary: "bg-gray-800 text-cyan-400 border border-cyan-500/30 hover:bg-gray-700 hover:border-cyan-400",
    accent: "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-orange-500/50"
  };
  
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
      {Icon && <Icon size={20} />}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-900/40 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:border-cyan-500/30 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

// --- Main App Component ---

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [xp, setXp] = useState(1240);
  const [level, setLevel] = useState("Apprentice");
  const [streak, setStreak] = useState(14);
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll listener for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulated XP counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setXp(prev => (prev < 2000 ? prev + 5 : 1240));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#041426] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Inline Styles for Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes wave {
          0%, 100% { d: path("M40,120 Q20,110 30,90"); }
          50% { d: path("M40,120 Q10,100 20,80"); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 210, 255, 0.2); }
          50% { box-shadow: 0 0 40px rgba(0, 210, 255, 0.4); }
        }
        .animate-kody-float { animation: float 6s ease-in-out infinite; }
        .animate-wave { animation: wave 2s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s infinite; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #041426; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>

      {/* --- Navigation --- */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#041426]/90 backdrop-blur-md py-4 border-b border-white/5' : 'py-6 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <div className="relative">
              <Kody className="w-10 h-10" animate={false} />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              CodeVault
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How it Works</a>
            <a href="#gamification" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#community" className="hover:text-cyan-400 transition-colors">Community</a>
            <Button variant="primary" className="!px-6 !py-2 !text-sm">Get Extension</Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#041426] border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
            <a href="#how-it-works" className="text-gray-300 py-2" onClick={() => setMenuOpen(false)}>How it Works</a>
            <a href="#gamification" className="text-gray-300 py-2" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#community" className="text-gray-300 py-2" onClick={() => setMenuOpen(false)}>Community</a>
            <Button variant="primary" className="w-full justify-center">Get Extension</Button>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <Section className="min-h-screen flex items-center justify-center pt-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f2e4a] via-[#041426] to-[#041426]">
        {/* Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center z-10">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              v2.0 is live!
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Track. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Compete.</span> <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Grow.</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              CodeVault automatically saves your solved problems, tracks your XP, and turns your coding journey into a game. The ultimate companion for LeetCode & Codeforces.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="primary" icon={ArrowRight}>Get Started Free</Button>
              <Button variant="secondary" icon={Zap}>Install Extension</Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 pt-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#041426] flex items-center justify-center text-xs">
                    <Users size={12} />
                  </div>
                ))}
              </div>
              <p>Trusted by 10,000+ developers</p>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative group perspective-1000">
            {/* Kody Float */}
            <div className="absolute -top-20 -right-10 z-20 hidden lg:block">
              <div className="relative">
                 <Kody className="w-48 h-48 drop-shadow-2xl" />
                 <div className="absolute -bottom-4 right-0 bg-white text-black text-xs font-bold px-3 py-1 rounded-t-xl rounded-br-xl shadow-lg transform rotate-6 animate-bounce">
                    I'll save that for you! 🔥
                 </div>
              </div>
            </div>

            {/* Dashboard Mockup */}
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl transform lg:rotate-y-12 lg:group-hover:rotate-y-0 transition-all duration-700 ease-out">
              <div className="h-8 bg-gray-800 flex items-center px-4 gap-2 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-4 text-xs text-gray-500 font-mono">dashboard.codevault.app</div>
              </div>
              <div className="p-6 bg-[#0B1120] grid grid-cols-3 gap-4">
                {/* Mockup Content */}
                <div className="col-span-2 space-y-4">
                  <div className="bg-gray-800/50 h-32 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-400">Activity Graph</span>
                      <span className="text-xs text-green-400">+12% this week</span>
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {[40, 60, 30, 80, 50, 90, 70, 40, 60, 85].map((h, i) => (
                        <div key={i} style={{height: `${h}%`}} className="flex-1 bg-cyan-500/20 rounded-t-sm hover:bg-cyan-400 transition-colors"></div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 h-24 rounded-lg p-4 border border-gray-700">
                       <div className="text-xs text-gray-400 mb-1">Solved</div>
                       <div className="text-2xl font-bold text-white">428</div>
                    </div>
                    <div className="bg-gray-800/50 h-24 rounded-lg p-4 border border-gray-700">
                       <div className="text-xs text-gray-400 mb-1">Current Streak</div>
                       <div className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                         {streak} <Flame size={20} className="animate-pulse" />
                       </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 space-y-4">
                   <div className="bg-gray-800/50 h-full rounded-lg border border-gray-700 p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-600 mb-2 flex items-center justify-center text-2xl">👑</div>
                      <div className="text-sm font-bold">Level 5</div>
                      <div className="text-xs text-gray-400">Master Coder</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* --- How It Works --- */}
      <Section id="how-it-works" className="bg-[#061b33]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How CodeVault Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Seamless integration with your favorite platforms. No manual entry required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/20 via-cyan-500/50 to-cyan-500/20 z-0"></div>

            {[
              { 
                icon: Terminal, 
                title: "1. Solve Problems", 
                desc: "Code on LeetCode, Codeforces, or HackerRank as you normally would.",
                color: "text-blue-400"
              },
              { 
                icon: Cpu, 
                title: "2. Auto-Detect", 
                desc: "Our extension automatically detects successful submissions and captures your code.",
                color: "text-cyan-400"
              },
              { 
                icon: Trophy, 
                title: "3. Level Up", 
                desc: "Earn XP, unlock badges, and analyze your growth in your personal Vault.",
                color: "text-orange-400"
              }
            ].map((step, index) => (
              <div key={index} className="relative z-10 group">
                <div className="bg-[#041426] p-8 rounded-2xl border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 h-full flex flex-col items-center text-center shadow-lg group-hover:-translate-y-2">
                  <div className={`w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6 shadow-inner ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon size={36} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                  
                  {index === 1 && (
                    <div className="absolute -top-10 -right-4 hidden lg:block transform rotate-12">
                      <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Zero friction!
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* --- Gamified Progress Section --- */}
      <Section id="gamification" className="bg-[#041426]">
        <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-3xl rounded-full"></div>
            
            <Card className="relative bg-black/40 border-gray-700 p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Weekly Progress</h3>
                  <p className="text-gray-400 text-sm">Keep the streak alive!</p>
                </div>
                <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">
                  <Flame className="text-orange-500 fill-orange-500 animate-pulse" />
                  <span className="font-bold text-orange-500">{streak} Day Streak</span>
                </div>
              </div>

              {/* XP Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2 font-bold">
                  <span className="text-cyan-400">Level 12: Code Ninja</span>
                  <span className="text-gray-400">{xp} / 2000 XP</span>
                </div>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000 ease-out relative"
                    style={{ width: `${(xp / 2000) * 100}%` }}
                  >
                    <div className="absolute top-0 right-0 h-full w-1 bg-white/50 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { icon: Shield, color: "text-yellow-400", bg: "bg-yellow-400/10" },
                  { icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10" },
                  { icon: Star, color: "text-blue-400", bg: "bg-blue-400/10" },
                  { icon: Trophy, color: "text-gray-600", bg: "bg-gray-800" }, // Locked
                ].map((badge, i) => (
                  <div key={i} className={`aspect-square rounded-xl ${badge.bg} flex items-center justify-center border border-white/5`}>
                    <badge.icon className={badge.color} size={28} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <h2 className="text-4xl font-bold">
              Turn Your <span className="text-orange-500">Grind</span> <br/>
              Into a <span className="text-cyan-400">Game</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Why should coding be boring? CodeVault introduces RPG elements to your daily practice. 
              Earn XP for every problem solved, maintain streaks, and unlock unique badges as you master new algorithms.
            </p>
            
            <ul className="space-y-4 mt-6">
              {[
                "Visual XP bars for instant feedback",
                "League system: Apprentice to Grandmaster",
                "Daily challenges and streak protection"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <CheckCircle size={14} className="text-cyan-400" />
                  </div>
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* --- Community Section --- */}
      <Section id="community" className="bg-[#061b33]">
        <div className="container mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">You're Never Coding Alone</h2>
          <p className="text-gray-400">Join a circle, compete with friends, and grow together.</p>
        </div>

        <div className="container mx-auto max-w-4xl">
           <div className="relative bg-[#041426] rounded-2xl p-8 border border-gray-700 shadow-2xl">
              {/* Decorative Header */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-6 mb-6">
                 <div className="flex items-center gap-3">
                   <Users className="text-violet-400" />
                   <span className="font-bold">Algorithm Squad</span>
                   <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">5 Online</span>
                 </div>
                 <Button variant="secondary" className="!py-1 !px-4 !text-xs">Invite Friend</Button>
              </div>

              {/* Friends List */}
              <div className="space-y-4">
                 {[
                   { name: "SarahDev", rank: "Level 15", status: "Solving Two Sum...", img: "bg-pink-500" },
                   { name: "AlgoKing", rank: "Level 22", status: "Online", img: "bg-blue-500" },
                   { name: "Pythonista", rank: "Level 8", status: "Last seen 2m ago", img: "bg-green-500" },
                 ].map((friend, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full ${friend.img} flex items-center justify-center font-bold text-white shadow-lg`}>
                            {friend.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{friend.name}</div>
                            <div className="text-xs text-gray-500">{friend.rank}</div>
                          </div>
                       </div>
                       <div className="text-xs font-mono text-cyan-500/80">{friend.status}</div>
                    </div>
                 ))}
              </div>

              {/* Kody Overlay */}
              <div className="absolute -bottom-10 -right-10 hidden md:block">
                 <Kody className="w-32 h-32" expression="wink" />
                 <div className="absolute top-0 -left-32 bg-white text-black text-sm p-3 rounded-xl rounded-br-none shadow-lg">
                    Invite friends for 2x XP! 🚀
                 </div>
              </div>
           </div>
        </div>
      </Section>

      {/* --- Extension Demo Section --- */}
      <Section className="bg-[#041426] py-32">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
           <div className="space-y-6">
              <div className="text-cyan-400 font-bold tracking-widest text-sm uppercase">Seamless Integration</div>
              <h2 className="text-4xl font-bold">No Manual Logs. Just Code.</h2>
              <p className="text-gray-400 text-lg">
                CodeVault sits quietly in your browser. When you hit "Submit" on LeetCode, we verify the success and instantly archive your solution, complexity analysis, and notes.
              </p>
              <div className="flex gap-4 pt-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 w-full text-center hover:border-green-500/50 transition-colors">
                  <div className="text-green-400 font-bold text-xl mb-1">LeetCode</div>
                  <div className="text-xs text-gray-500">Fully Supported</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 w-full text-center hover:border-red-500/50 transition-colors">
                  <div className="text-red-400 font-bold text-xl mb-1">Codeforces</div>
                  <div className="text-xs text-gray-500">Beta Support</div>
                </div>
              </div>
           </div>

           {/* Browser Mockup */}
           <div className="relative">
              <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                {/* Browser Toolbar */}
                <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-black">
                   <div className="flex gap-1.5">
                     <div className="w-3 h-3 rounded-full bg-red-500"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500"></div>
                   </div>
                   <div className="bg-[#1e1e1e] flex-1 ml-4 rounded px-3 py-1 text-xs text-gray-400 font-mono text-center">
                     leetcode.com/problems/two-sum
                   </div>
                </div>
                {/* Content */}
                <div className="p-6 font-mono text-xs relative min-h-[300px]">
                   <span className="text-purple-400">class</span> <span className="text-yellow-400">Solution</span> {'{'} <br/>
                   &nbsp;&nbsp;<span className="text-purple-400">def</span> <span className="text-blue-400">twoSum</span>(self, nums, target): <br/>
                   &nbsp;&nbsp;&nbsp;&nbsp;prevMap = {'{}'} <br/>
                   &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">for</span> i, n <span className="text-purple-400">in</span> <span className="text-blue-400">enumerate</span>(nums): <br/>
                   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;diff = target - n <br/>
                   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">if</span> diff <span className="text-purple-400">in</span> prevMap: <br/>
                   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> [prevMap[diff], i] <br/>
                   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;prevMap[n] = i
                   <br/> {'}'}

                   {/* Success Popup */}
                   <div className="absolute top-10 right-10 bg-[#041426] border border-cyan-500/50 p-4 rounded-lg shadow-[0_0_30px_rgba(0,210,255,0.3)] animate-pulse-glow max-w-[200px]">
                      <div className="flex items-start gap-3">
                         <Kody className="w-10 h-10" animate={false} />
                         <div>
                           <div className="text-green-400 font-bold mb-1">Accepted!</div>
                           <div className="text-gray-300 text-[10px]">Saved to Vault. +50 XP gained.</div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </Section>

      {/* --- Testimonials --- */}
      <Section className="bg-[#061b33]">
         <div className="container mx-auto">
            <h2 className="text-center text-4xl font-bold mb-12">Developers Love CodeVault</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Alex Chen", role: "Software Engineer @ Google", text: "CodeVault turned my interview prep from a chore into a daily habit. The gamification is addictive!", stars: 5 },
                { name: "Maria Garcia", role: "CS Student", text: "Finally, a way to track my progress across different platforms in one place. Kody is super cute too!", stars: 5 },
                { name: "David Kim", role: "Frontend Dev", text: "It's like Strava for programmers. seeing my streak grow keeps me coming back every day.", stars: 4 },
              ].map((review, i) => (
                <Card key={i} className="hover:-translate-y-2">
                   <div className="flex gap-1 mb-4">
                     {[...Array(5)].map((_, si) => (
                       <Star key={si} size={16} className={`${si < review.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                     ))}
                   </div>
                   <p className="text-gray-300 mb-6 italic">"{review.text}"</p>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600"></div>
                      <div>
                        <div className="font-bold text-sm">{review.name}</div>
                        <div className="text-xs text-gray-500">{review.role}</div>
                      </div>
                   </div>
                </Card>
              ))}
            </div>
         </div>
      </Section>

      {/* --- CTA Section --- */}
      <Section className="bg-gradient-to-b from-[#041426] to-[#0f2e4a] text-center pt-20 pb-32">
        <div className="container mx-auto max-w-3xl relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-cyan-500/10 blur-[100px] rounded-full -z-10"></div>
           
           <h2 className="text-5xl md:text-6xl font-bold mb-8">Ready to Level Up?</h2>
           <p className="text-xl text-gray-400 mb-10">
             Join thousands of developers tracking their journey to mastery.
             Free forever for students.
           </p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button variant="accent" className="!text-lg !px-10 !py-5" icon={ChevronRight}>Start Your Adventure</Button>
              <div className="text-gray-500 text-sm">Or <a href="#" className="text-cyan-400 underline underline-offset-4">download the extension</a> directly</div>
           </div>

           <div className="mt-16 flex justify-center">
             <div className="relative">
                <Kody className="w-40 h-40" />
                <div className="absolute -right-24 top-10 transform rotate-12">
                   <div className="bg-white text-black font-handwriting px-4 py-2 rounded-lg shadow-xl font-bold">
                      Let's Code! 🚀
                   </div>
                   <div className="w-0 h-0 border-l-[10px] border-l-transparent border-t-[15px] border-t-white border-r-[10px] border-r-transparent absolute -left-2 top-4 -rotate-90"></div>
                </div>
             </div>
           </div>
        </div>
      </Section>

      {/* --- Footer --- */}
      <footer className="border-t border-white/5 py-12 bg-[#041426]">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 font-bold text-xl">
              <Kody className="w-8 h-8" animate={false} />
              <span className="text-gray-300">CodeVault</span>
           </div>
           
           <div className="text-gray-500 text-sm">
             © 2024 CodeVault. Built by coders, for coders.
           </div>

           <div className="flex gap-6 text-gray-400">
             <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
             <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
             <a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a>
             <a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a>
           </div>
        </div>
      </footer>
    </div>
  );
}