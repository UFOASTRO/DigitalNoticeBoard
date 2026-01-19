import { motion } from 'framer-motion';
import { Sparkles, ArrowUp } from 'lucide-react';

export const MagicInput = () => {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
    >
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
        <div className="relative flex items-center bg-opal-surface border border-opal-border rounded-full p-2 shadow-2xl backdrop-blur-xl">
          <div className="pl-4 pr-3">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <input 
            type="text" 
            placeholder="Describe your flow using natural language..."
            className="flex-1 bg-transparent text-white placeholder-white/40 text-lg px-2 py-2 focus:outline-none font-light tracking-wide"
          />
          <button className="p-3 bg-white hover:bg-purple-50 text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20">
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
