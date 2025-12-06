import React from 'react';
import { Unplug } from 'lucide-react'; // A relevant icon

const NoAccountsWidget = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Main Container - Same style as the stats widget */}
      <div className="relative w-80 bg-[#050a10] rounded-2xl p-8 shadow-2xl overflow-hidden font-sans select-none text-center flex flex-col items-center justify-center min-h-[320px]">
        
        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          
          {/* Icon */}
          <div className="bg-[#1a262d] p-3 rounded-full border border-white/5">
            <Unplug className="w-6 h-6 text-blue-400" />
          </div>
          
          {/* Text */}
          <h3 className="text-xl font-bold text-white">Oops!</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            You don't have any<br />connected accounts.
          </p>
          
          {/* Connect Button */}
          <button className="mt-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/20 active:scale-95">
            Connect Now
          </button>
          
        </div>

        {/* The Fire Sticker (SVG Illustration) - Reused for consistency */}
        <div className="absolute -bottom-4 -left-4 w-32 h-32 z-20 pointer-events-none transform rotate-6">
           <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#FF9A3D', stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:'#FF6B2B', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#FF4D00', stopOpacity:1}} />
              </linearGradient>
            </defs>
            <path d="M100,180 C60,180 30,150 30,110 C30,70 60,20 100,10 C140,20 170,70 170,110 C170,150 140,180 100,180 Z" fill="url(#fireGrad)"/>
            <path d="M100,10 C90,40 50,60 50,110 C50,140 70,160 100,160 C130,160 150,140 150,110 C150,60 110,40 100,10" fill="#FFC15E" opacity="0.8"/>
             <ellipse cx="75" cy="115" rx="8" ry="10" fill="#3D1809" />
             <ellipse cx="125" cy="115" rx="8" ry="10" fill="#3D1809" />
             <path d="M65,100 Q75,105 85,100" stroke="#3D1809" strokeWidth="3" fill="none" />
             <path d="M115,100 Q125,105 135,100" stroke="#3D1809" strokeWidth="3" fill="none" />
             <path d="M160,80 L165,70 L170,80 L180,85 L170,90 L165,100 L160,90 L150,85 Z" fill="#FFEAA7" />
             <path d="M180,50 L183,45 L186,50 L191,53 L186,56 L183,61 L180,56 L175,53 Z" fill="#FFEAA7" />
          </svg>
        </div>

        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-transparent to-transparent opacity-40 pointer-events-none z-10" />

      </div>
    </div>
  );
};

export default NoAccountsWidget;