import React from 'react';
import type { PinColor } from '../types';

interface PushPinProps {
  color?: PinColor;
  className?: string;
}

const colors: Record<PinColor, { base: string; dark: string; light: string }> = {
  red: { base: '#ef4444', dark: '#991b1b', light: '#fca5a5' },
  blue: { base: '#3b82f6', dark: '#1e40af', light: '#93c5fd' },
  green: { base: '#22c55e', dark: '#15803d', light: '#86efac' },
  yellow: { base: '#eab308', dark: '#a16207', light: '#fde047' },
  purple: { base: '#a855f7', dark: '#6b21a8', light: '#d8b4fe' },
};

export const PushPin: React.FC<PushPinProps> = ({ color = 'red', className = '' }) => {
  const palette = colors[color];

  return (
    <div className={`relative w-6 h-8 group ${className} z-50 pointer-events-none`}>
      {/* 
        SHADOW:
        The shadow cast by the pin on the paper/wall. 
        It should be skewed and offset to suggest light coming from top-left.
      */}
      <div 
        className="absolute bottom-0 left-1/2 w-4 h-2 bg-black/30 rounded-[50%] blur-[1px] transform -translate-x-1/2 translate-y-1 skew-x-12"
      />

      {/* 
        PIN NEEDLE (Visible Part):
        The small metal part between the plastic head and the paper.
      */}
      <div className="absolute bottom-0 left-1/2 w-[2px] h-3 bg-slate-400 -translate-x-1/2" />

      {/* 
        PLASTIC HEAD:
        Composed of a top dome and a tapered bottom cylinder.
      */}
      <div className="absolute top-0 w-full h-full flex flex-col items-center filter drop-shadow-sm">
        
        {/* Top Dome */}
        <div 
          className="w-5 h-5 rounded-t-full rounded-b-lg relative"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${palette.light}, ${palette.base}, ${palette.dark})`,
            boxShadow: `inset -1px -1px 2px ${palette.dark}`
          }}
        >
          {/* Specular Highlight (The shiny reflection) */}
          <div className="absolute top-1 left-1.5 w-1.5 h-1.5 bg-white/60 rounded-full blur-[0.5px]" />
        </div>

        {/* Cylinder Neck */}
        <div 
          className="w-4 h-2 -mt-1 rounded-b-md"
          style={{
            background: `linear-gradient(to right, ${palette.dark}, ${palette.base}, ${palette.dark})`
          }}
        />
        
        {/* Metal Stop (where pin enters plastic) */}
        <div className="w-1.5 h-0.5 bg-slate-300 rounded-full mt-[1px]" />
      </div>

    </div>
  );
};