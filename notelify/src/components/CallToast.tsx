import { AnimatePresence, motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCall } from '../context/CallContext';

export const CallToast = () => {
  const { incomingCall, joinCall, declineCall } = useCall();
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!incomingCall) return;
    
    // Navigate to the cluster first if not already there
    navigate(`/app/${incomingCall.clusterId}`);
    
    await joinCall(incomingCall.clusterId, incomingCall.id);
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          key="incoming-call-toast"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl border border-white/10 flex items-center gap-6"
        >
          <div className="flex items-center gap-3">
             <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-green-600 p-2 rounded-full">
                    <Phone size={20} className="animate-pulse" />
                </div>
             </div>
             <div>
                 <p className="text-sm font-semibold">Incoming Call...</p>
                 <p className="text-xs text-white/50">Cluster ID: {incomingCall.clusterId.slice(0, 8)}...</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
              <button 
                onClick={declineCall}
                className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                title="Decline"
              >
                  <PhoneOff size={20} />
              </button>
              <button 
                onClick={handleJoin}
                className="px-4 py-2 rounded-full bg-green-600 hover:bg-green-500 text-white font-medium text-sm flex items-center gap-2 transition-transform hover:scale-105"
              >
                  <Video size={16} />
                  Join Call
              </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
