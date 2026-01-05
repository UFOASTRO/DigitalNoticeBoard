import React from 'react';
import { motion } from 'framer-motion';
import { Pin } from '../types';
import clsx from 'clsx';

interface PaperNoteProps {
  pin: Pin;
  onDragEnd?: (id: string, newX: number, newY: number) => void;
}

export const PaperNote: React.FC<PaperNoteProps> = ({ pin, onDragEnd }) => {
  const { 
    id, 
    content, 
    x,
    y
  } = pin;
  
  const {
      title,
      body,
      paperType = 'plain',
      paperColor,
      pinColor = 'red'
  } = content;

  // Map paper types to clean CSS classes
  const textureClass = {
    plain: 'bg-white',
    lined: 'paper-lined bg-white',
    grid: 'paper-grid bg-white',
    dot: 'bg-white',
  }[paperType] || 'bg-white';

  return (
    <motion.div
      drag
      dragMomentum={false}
      // Stop propagation to prevent panning the canvas while dragging a note
      onPointerDown={(e) => e.stopPropagation()} 
      initial={{ x, y }}
      animate={{ x, y }}
      whileHover={{ scale: 1.01, zIndex: 10, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      whileDrag={{ scale: 1.02, zIndex: 50, cursor: 'grabbing', boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)" }}
      onDragEnd={(_, info) => {
        if (onDragEnd) {
          onDragEnd(id, x + info.offset.x, y + info.offset.y);
        }
      }}
      className={clsx(
        "absolute w-72 min-h-[12rem] p-6 flex flex-col rounded-xl border border-slate-200 paper-shadow cursor-grab transition-colors",
        "text-slate-800",
        textureClass
      )}
      style={{ 
        backgroundColor: paperColor && paperColor !== '#FDFBF7' ? paperColor : undefined 
      }}
    >
      {/* Minimal Pin / Indicator */}
      <div 
        className="absolute top-3 right-3 w-3 h-3 rounded-full opacity-80"
        style={{ backgroundColor: pinColor }}
      />

      {/* Title */}
      {title && (
          <h3 className="text-lg font-semibold mb-3 leading-tight tracking-tight text-slate-900">
            {title}
          </h3>
      )}

      {/* Content */}
      <div className="flex-1 text-sm leading-6 text-slate-600 font-normal">
        {body || 'No content'}
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] text-slate-400">
            {pin.created_at ? new Date(pin.created_at).toLocaleDateString() : 'Just now'}
        </span>
      </div>
    </motion.div>
  );
};