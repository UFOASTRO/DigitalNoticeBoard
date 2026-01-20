import React from 'react';
import { motion } from 'framer-motion';
import type { Pin } from '../types';
import clsx from 'clsx';
import { CalendarPlus, Edit2, Eye } from 'lucide-react';

interface PaperNoteProps {
  pin: Pin;
  onDragEnd?: (id: string, newX: number, newY: number) => void;
  onEdit?: (pin: Pin) => void;
  onMarkRead?: (id: string) => void;
  currentUserId?: string;
  disableDrag?: boolean;
}

export const PaperNote: React.FC<PaperNoteProps> = ({ pin, onDragEnd, onEdit, onMarkRead, currentUserId, disableDrag = false }) => {
  const { 
    id, 
    content, 
    x,
    y,
    read_by = [],
    created_by,
    updated_at,
    created_at
  } = pin;
  
  const {
      title,
      body,
      category,
      paperType = 'plain',
      paperColor,
      pinColor = 'red'
  } = content;

  const isOwner = currentUserId && created_by === currentUserId;
  const isRead = currentUserId && read_by.includes(currentUserId);

  // Map paper types to clean CSS classes
  const textureClass = {
    plain: 'bg-white',
    lined: 'paper-lined bg-white',
    grid: 'paper-grid bg-white',
    dot: 'bg-white',
  }[paperType] || 'bg-white';

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Create Google Calendar Link
    // Format: https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&details={body}
    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const params = new URLSearchParams({
        text: title || 'New Note',
        details: body || '',
    });
    window.open(`${baseUrl}&${params.toString()}`, '_blank');
  };

  const dragProps = disableDrag ? {} : {
    drag: true,
    dragMomentum: false,
    onDragEnd: (_: any, info: any) => {
        if (onDragEnd) {
          onDragEnd(id, x + info.offset.x, y + info.offset.y);
        }
    }
  };

  return (
    <motion.div
      {...dragProps}
      // Stop propagation to prevent panning the canvas while dragging a note
      onPointerDown={(e) => !disableDrag && e.stopPropagation()} 
      initial={disableDrag ? undefined : { x, y }}
      animate={disableDrag ? undefined : { x, y }}
      whileHover={{ scale: 1.01, zIndex: 10, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      whileDrag={disableDrag ? undefined : { scale: 1.02, zIndex: 50, cursor: 'grabbing', boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)" }}
      className={clsx(
        "relative w-72 min-h-[12rem] p-6 flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 paper-shadow cursor-grab transition-colors group",
        "text-slate-800 dark:text-slate-200",
        textureClass,
        disableDrag ? "h-full" : "absolute"
      )}
      style={{ 
        backgroundColor: paperColor && paperColor !== '#FDFBF7' ? paperColor : undefined 
      }}
    >
      {/* Category Label */}
      {category && category !== 'General' && (
          <div className="absolute -top-3 left-4 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-white shadow-sm z-10">
              {category}
          </div>
      )}

      {/* Unread Indicator */}
      {/* {!isRead && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white z-20 shadow-sm" title="Unread" />
      )} */}

      {/* Minimal Pin / Indicator */}
      <div 
        className="absolute top-3 right-3 w-3 h-3 rounded-full opacity-80"
        style={{ backgroundColor: pinColor }}
      />

      {/* Title */}
      {title && (
          <h3 className="text-lg font-semibold mb-3 leading-tight tracking-tight text-slate-900 pr-4">
            {title}
          </h3>
      )}

      {/* Content */}
      <div className="flex-1 text-sm leading-6 text-slate-600 font-normal whitespace-pre-wrap">
        {body || 'No content'}
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100/50 flex flex-col gap-2">
         <div className="flex justify-between items-center text-[10px] text-slate-400">
             <span>
                {created_at ? new Date(created_at).toLocaleDateString() : 'Just now'}
                {updated_at && <span className="ml-1 italic opacity-75">(Edited)</span>}
             </span>
         </div>

         {/* Actions Toolbar - Visible on Hover or valid states */}
         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Add to Calendar */}
            <button 
                onClick={handleAddToCalendar}
                className="p-1.5 rounded-full hover:bg-black/5 text-slate-500 hover:text-blue-600 transition-colors"
                title="Add to Google Calendar"
            >
                <CalendarPlus size={14} />
            </button>

            {/* Edit (Owner Only) */}
            {isOwner && onEdit && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(pin); }}
                    className="p-1.5 rounded-full hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-colors"
                    title="Edit Note"
                >
                    <Edit2 size={14} />
                </button>
            )}

            {/* Mark as Read */}
            {onMarkRead && !isRead && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onMarkRead(id); }}
                    className="p-1.5 rounded-full hover:bg-black/5 text-slate-500 hover:text-green-600 transition-colors"
                    title="Mark as Read"
                 >
                    <Eye size={14} />
                 </button>
            )}
            {/* Already Read Indicator (Visual only, maybe disabled button) */}
            {isRead && (
                 <div className="p-1.5 text-green-600/50" title="Read">
                    <CheckIcon />
                 </div>
            )}
         </div>
      </div>
    </motion.div>
  );
};

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);