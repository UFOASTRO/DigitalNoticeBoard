import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MousePointer2, Plus, Link as LinkIcon } from 'lucide-react';

export const InteractiveDemo = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 6);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-[500px] bg-slate-50 rounded-xl overflow-hidden relative shadow-2xl border border-slate-200">
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      
      {/* UI Controls Mockup */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg z-20 border border-slate-100">
        <motion.div 
          animate={{ scale: step === 0 ? 1.2 : 1 }}
          className={`p-2 rounded-lg ${step === 0 ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}
        >
          <Plus size={20} />
        </motion.div>
        <div className="w-px bg-slate-200 mx-2"></div>
        <motion.div 
          animate={{ scale: step === 4 ? 1.2 : 1 }}
          className={`p-2 rounded-lg ${step === 4 ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}
        >
          <LinkIcon size={20} />
        </motion.div>
      </div>

      {/* Note 1 - User's Note */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: step >= 1 ? 1 : 0, 
          opacity: step >= 1 ? 1 : 0,
          x: step >= 2 ? 50 : 0,
          y: step >= 2 ? -20 : 0
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="absolute top-1/3 left-1/3 w-48 h-48 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-4 z-10"
      >
        <div className="w-full h-full flex flex-col gap-2">
          <div className="h-4 w-3/4 bg-yellow-200/50 rounded animate-pulse"></div>
          <div className="h-2 w-full bg-yellow-100 rounded"></div>
          <div className="h-2 w-5/6 bg-yellow-100 rounded"></div>
        </div>
      </motion.div>

      {/* Note 2 - Collaborator's Note */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: step >= 3 ? 1 : 0, 
          opacity: step >= 3 ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="absolute top-1/2 right-1/3 w-48 h-48 bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-4 z-10"
      >
        <div className="w-full h-full flex flex-col gap-2">
          <div className="h-4 w-1/2 bg-blue-200/50 rounded animate-pulse"></div>
          <div className="h-20 w-full bg-blue-100/30 rounded mt-2"></div>
        </div>
      </motion.div>

      {/* Connection Line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <motion.path
          d="M 280 200 C 350 200, 450 300, 520 300"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="3"
          strokeDasharray="10 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: step >= 5 ? 1 : 0, 
            opacity: step >= 5 ? 1 : 0 
          }}
          transition={{ duration: 0.8 }}
        />
      </svg>

      {/* User Cursor */}
      <motion.div
        animate={{
          x: step === 0 ? 340 : step === 1 ? 250 : step === 2 ? 300 : step === 5 ? 400 : 350,
          y: step === 0 ? 430 : step === 1 ? 180 : step === 2 ? 160 : step === 5 ? 250 : 300,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 150 }}
        className="absolute top-0 left-0 z-30 pointer-events-none"
      >
        <MousePointer2 className="text-indigo-600 fill-indigo-600/20 w-6 h-6 transform -rotate-12" />
        <div className="ml-4 px-2 py-1 bg-indigo-600 text-white text-xs rounded-full whitespace-nowrap">
          You
        </div>
      </motion.div>

      {/* Collaborator Cursor */}
      <motion.div
        initial={{ x: 800, y: 100, opacity: 0 }}
        animate={{
          x: step >= 3 ? 550 : 800,
          y: step >= 3 ? 280 : 100,
          opacity: step >= 3 ? 1 : 0
        }}
        transition={{ type: "spring", damping: 25, stiffness: 150 }}
        className="absolute top-0 left-0 z-30 pointer-events-none"
      >
        <MousePointer2 className="text-pink-500 fill-pink-500/20 w-6 h-6 transform -rotate-12" />
        <div className="ml-4 px-2 py-1 bg-pink-500 text-white text-xs rounded-full whitespace-nowrap">
          Sarah
        </div>
      </motion.div>

      <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-mono">
        Step {step + 1} / 6: {
          ['Create Note', 'Place Note', 'Move Note', 'Collaborator Joins', 'Connect Ideas', 'Sync Complete'][step]
        }
      </div>
    </div>
  );
};
