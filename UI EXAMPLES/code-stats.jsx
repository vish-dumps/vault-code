import React from 'react';
import { Code2, BarChart2, Zap } from 'lucide-react';

const StatsWidget = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="relative w-80 bg-[#050a10] rounded-2xl p-4 shadow-2xl overflow-hidden font-sans select-none">
        
        {/* Content Wrapper (z-index higher than the fire sticker) */}
        <div className="flex flex-col gap-3 relative z-10">
          
          {/* Card 1: LeetCode */}
          <div className="bg-[#1a262d] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors duration-200">
            <div className="flex justify-between items-start mb-1">
              <span className="text-gray-400 text-sm font-medium tracking-wide">LeetCode Stats</span>
              {/* LeetCode-ish Icon */}
              <Code2 className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">128</div>
            <div className="text-[11px] text-gray-500 font-medium">
              <span className="text-gray-400">Easy:</span> 26 • <span className="text-gray-400">Medium:</span> 34 • <span className="text-gray-400">Hard:</span> 4
            </div>
          </div>

          {/* Card 2: Codeforces */}
          <div className="bg-[#16222b] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors duration-200">
            <div className="flex justify-between items-start mb-1">
              <span className="text-gray-400 text-sm font-medium tracking-wide">Codeforces Stats</span>
              {/* Chart Icon */}
              <BarChart2 className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">1189</div>
            <div className="text-[11px] text-gray-500 font-medium">
              <span className="text-gray-400">Rank:</span> Newbie • <span className="text-gray-400">Max:</span> 1189
            </div>
          </div>

        </div>

        {/* The Fire Sticker (SVG Illustration) */}
        {/* Positioned absolutely at the bottom left */}
        <div className="absolute -bottom-4 -left-4 w-32 h-32 z-20 pointer-events-none transform rotate-6">
           <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#FF9A3D', stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:'#FF6B2B', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#FF4D00', stopOpacity:1}} />
              </linearGradient>
            </defs>
            
            {/* Main Flame Body */}
            <path 
              d="M100,180 C60,180 30,150 30,110 C30,70 60,20 100,10 C140,20 170,70 170,110 C170,150 140,180 100,180 Z" 
              fill="url(#fireGrad)"
            />
            {/* Flame Tips / Details for cartoon look */}
            <path 
              d="M100,10 C90,40 50,60 50,110 C50,140 70,160 100,160 C130,160 150,140 150,110 C150,60 110,40 100,10" 
              fill="#FFC15E"
              opacity="0.8"
            />
             {/* Eyes (to match the cute character in your image) */}
             <ellipse cx="75" cy="115" rx="8" ry="10" fill="#3D1809" />
             <ellipse cx="125" cy="115" rx="8" ry="10" fill="#3D1809" />
             
             {/* Eyebrows */}
             <path d="M65,100 Q75,105 85,100" stroke="#3D1809" strokeWidth="3" fill="none" />
             <path d="M115,100 Q125,105 135,100" stroke="#3D1809" strokeWidth="3" fill="none" />

             {/* Little sparkles/stars */}
             <path d="M160,80 L165,70 L170,80 L180,85 L170,90 L165,100 L160,90 L150,85 Z" fill="#FFEAA7" />
             <path d="M180,50 L183,45 L186,50 L191,53 L186,56 L183,61 L180,56 L175,53 Z" fill="#FFEAA7" />

          </svg>
        </div>

        {/* Subtle Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-transparent to-transparent opacity-40 pointer-events-none z-10" />

      </div>
    </div>
  );
};

export default StatsWidget;