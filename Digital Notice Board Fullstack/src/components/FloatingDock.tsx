import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  StickyNote, 
  Link, 
  LayoutGrid, 
  MousePointer2, 
  ChevronUp 
} from 'lucide-react';

interface FloatingDockProps {
  onAddNote: () => void;
  isConnectMode: boolean;
  onToggleConnect: () => void;
  onDashboard: () => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({ 
  onAddNote, 
  isConnectMode, 
  onToggleConnect,
  onDashboard
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      action: onDashboard,
      active: false
    },
    {
      id: 'pointer',
      label: 'Select',
      icon: MousePointer2,
      action: () => isConnectMode && onToggleConnect(), // Switch off connect mode
      active: !isConnectMode
    },
    {
      id: 'connect',
      label: 'Connect',
      icon: Link,
      action: onToggleConnect,
      active: isConnectMode
    },
    {
      id: 'note',
      label: 'Add Note',
      icon: StickyNote,
      action: onAddNote,
      active: false
    },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      
      {/* Expanded Menu (The Dock) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white/90 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-2 flex items-center gap-2 mb-2"
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  // Close on specific actions if desired, or keep open
                  if (item.id === 'dashboard') setIsOpen(false); 
                }}
                className={`
                  relative p-3 rounded-xl transition-all duration-200 group flex flex-col items-center gap-1 min-w-[64px]
                  ${item.active 
                    ? 'bg-slate-100 text-slate-900 shadow-inner' 
                    : 'hover:bg-slate-100/50 text-slate-500 hover:text-slate-900'
                  }
                `}
              >
                <item.icon size={24} strokeWidth={item.active ? 2.5 : 2} />
                <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white px-2 py-1 rounded transition-opacity whitespace-nowrap pointer-events-none">
                  {item.label}
                </span>
                
                {item.active && (
                   <motion.div 
                     layoutId="activeIndicator"
                     className="absolute -bottom-1 w-1 h-1 rounded-full bg-slate-900"
                   />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center gap-2 px-6 py-4 rounded-full shadow-xl shadow-slate-900/20 transition-all duration-300
          ${isOpen ? 'bg-white text-slate-900 ring-2 ring-slate-100' : 'bg-slate-900 text-white hover:scale-105 active:scale-95'}
        `}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <ChevronUp size={24} /> : <Plus size={24} />}
        </motion.div>
        <span className="font-medium text-sm">
          {isOpen ? 'Close Menu' : 'Actions'}
        </span>
      </button>
    </div>
  );
};
