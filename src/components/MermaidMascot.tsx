import React from 'react';
import mascotImg from '../assets/images/tide_mermaid_mascot_1788448305633.jpg';

interface MermaidMascotProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showTagline?: boolean;
}

export const MermaidMascot: React.FC<MermaidMascotProps> = ({
  size = 'md',
  className = '',
  showTagline = false,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    hero: 'w-36 h-36 sm:w-44 sm:h-44',
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Art Nouveau decorative aura with sea green, purple, and pink light */}
      <div className="relative group">
        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-teal-400 via-purple-400 to-pink-300 opacity-60 blur-md group-hover:opacity-90 transition duration-700" />
        
        {/* Ornate circular rim */}
        <div className={`relative ${sizeClasses[size]} rounded-full p-[2.5px] bg-gradient-to-b from-teal-200 via-purple-300 to-pink-200 shadow-xl overflow-hidden ring-1 ring-white/20`}>
          <img
            src={mascotImg}
            alt="Tide Art Nouveau Mermaid Mascot"
            className="w-full h-full object-cover rounded-full transform group-hover:scale-105 transition duration-500"
            onError={(e) => {
              // Graceful fallback to SVG if image fails
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.classList.add('bg-slate-900');
              }
            }}
          />
        </div>

        {/* Small sparkling scale badge accent */}
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-400 border border-white" />
        </span>
      </div>

      {showTagline && (
        <div className="mt-3 text-center">
          <div className="text-xs uppercase tracking-widest text-teal-700 font-semibold">
            Oceanic Muse
          </div>
          <div className="text-sm font-display italic text-slate-600">
            Art Nouveau Mermaid of Flow & Balance
          </div>
        </div>
      )}
    </div>
  );
};
