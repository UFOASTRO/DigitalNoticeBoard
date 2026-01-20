import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useCall } from '../context/CallContext';
import type { CallParticipant } from '../hooks/useCallLogic';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Maximize2, Minimize2, Users, ExternalLink
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cnLocal(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const VideoDock = () => {
  const { 
    isActive, 
    peers, 
    localStream, 
    isMuted, 
    isVideoOff, 
    toggleAudio, 
    toggleVideo, 
    endCall 
  } = useCall();

  const [isExpanded, setIsExpanded] = useState(true);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);
  const myVideoRef = useRef<HTMLVideoElement | null>(null);

  // Callback ref to ensure video plays immediately upon mounting
  const setLocalVideoRef = useCallback((element: HTMLVideoElement | null) => {
      myVideoRef.current = element;
      if (element && localStream) {
          console.log("Setting local stream to video element", localStream.id);
          element.srcObject = localStream;
          element.onloadedmetadata = () => {
              element.play().catch(e => console.error("Local video play error:", e));
          };
      }
  }, [localStream]);

  // PiP Toggle
  const togglePiP = useCallback(async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    if (!window.documentPictureInPicture) {
      alert("Document Picture-in-Picture is not supported in this browser.");
      return;
    }

    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 600,
        height: 450,
      });
      
      // Copy styles
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules]
            .map((rule) => rule.cssText)
            .join("");
          const style = document.createElement("style");
          style.textContent = cssRules;
          pipWin.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.type = styleSheet.type;
          link.media = styleSheet.media.mediaText;
          link.href = styleSheet.href || "";
          pipWin.document.head.appendChild(link);
        }
      });
      
      // Add Tailwind CDN as backup if local styles fail
      const script = document.createElement('script');
      script.src = "https://cdn.tailwindcss.com";
      pipWin.document.head.appendChild(script);

      // Listen for close
      pipWin.addEventListener("pagehide", () => {
        setPipWindow(null);
      });

      setPipWindow(pipWin);
    } catch (err) {
      console.error("Failed to open PiP window:", err);
    }
  }, [pipWindow]);

  if (!isActive) return null;

  // Render Content (Shared between Main and PiP)
  const renderContent = () => (
    <div className={cnLocal("flex flex-col h-full bg-slate-900/90 text-white", pipWindow ? "min-h-screen" : "")}>
        {/* Header (Only show in Dock mode or if needed) */}
        {!pipWindow && (
            <div 
                onPointerDown={(e) => dragControls.start(e)}
                className="h-8 w-full bg-black/20 flex items-center justify-between px-3 cursor-move active:cursor-grabbing hover:bg-black/30 transition-colors"
            >
                <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                   <Users size={14} />
                   <span>{peers.length + 1} Active</span>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={togglePiP}
                        className="p-1 hover:text-white text-white/70"
                        title="Pop out"
                    >
                        <ExternalLink size={14} />
                    </button>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:text-white text-white/70"
                    >
                        {isExpanded ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
                    </button>
                </div>
            </div>
        )}

        {/* Content Body */}
        {(isExpanded || pipWindow) ? (
            <div className="flex flex-col flex-1 overflow-hidden relative">
                {/* Video Grid */}
                <div className="flex-1 p-4 grid gap-4 overflow-y-auto" style={{
                    gridTemplateColumns: (peers.length + 1) <= 1 ? '1fr' : (peers.length + 1) <= 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))'
                }}>
                    {/* Local User (Self View) */}
                    <div className="relative bg-black/40 rounded-xl overflow-hidden aspect-video group border border-white/5 shadow-lg ring-1 ring-white/10">
                        <video
                            ref={setLocalVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <span className="text-white font-medium text-sm">You (Me)</span>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                             {isMuted && <div className="p-1 bg-red-500/80 rounded-full"><MicOff size={12} className="text-white"/></div>}
                             {isVideoOff && <div className="p-1 bg-red-500/80 rounded-full"><VideoOff size={12} className="text-white"/></div>}
                        </div>
                    </div>

                    {/* Remote Peers */}
                    {peers.map((peer) => (
                        <RemoteVideo key={peer.peerId} peer={peer} />
                    ))}
                    
                    {/* Placeholder if somehow empty (shouldn't happen with self view) */}
                    {peers.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-white/50 h-full min-h-[200px] bg-black/20 rounded-xl border border-white/5 border-dashed hidden">
                             {/* Hidden because Self View is always there now */}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="h-16 flex items-center justify-center gap-4 bg-black/40 backdrop-blur-md shrink-0">
                    <ControlButton 
                        active={!isMuted}
                        onClick={toggleAudio}
                        icon={isMuted ? MicOff : Mic}
                        color={isMuted ? 'bg-red-500/80 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'}
                    />
                    <ControlButton 
                        active={!isVideoOff}
                        onClick={toggleVideo}
                        icon={isVideoOff ? VideoOff : Video}
                        color={isVideoOff ? 'bg-red-500/80 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'}
                    />
                    <div className="w-px h-8 bg-white/10 mx-2" />
                    <button 
                        className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                        onClick={() => {
                            if (pipWindow) pipWindow.close();
                            endCall();
                        }}
                    >
                        <PhoneOff size={20} />
                    </button>
                </div>
            </div>
        ) : (
             /* Collapsed Header Only */
             <div className="p-3 flex items-center gap-3">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold border-2 border-white/20">
                        You
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]"></div>
                </div>
                
                <div className="flex -space-x-2">
                    {peers.slice(0, 3).map((p) => (
                        <div key={p.peerId} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-white/10 flex items-center justify-center text-xs text-white uppercase"
                             title={p.user.name}
                        >
                            {p.user.name[0]}
                        </div>
                    ))}
                     {peers.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-white/10 flex items-center justify-center text-xs text-white">
                            +{peers.length - 3}
                        </div>
                    )}
                </div>
                
                <button 
                     className="ml-auto p-2 rounded-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white transition-colors"
                     onClick={endCall}
                >
                    <PhoneOff size={16} />
                </button>
             </div>
        )}
    </div>
  );

  // If PiP is active, render into that window
  if (pipWindow) {
    return createPortal(
      renderContent(),
      pipWindow.document.body
    );
  }

  // Otherwise, render floating dock
  return (
    <div 
      ref={constraintsRef} 
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
    >
      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        initial={{ x: window.innerWidth - 620, y: 20, opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cnLocal(
          "pointer-events-auto absolute bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl overflow-hidden transition-[width,height] duration-300",
          isExpanded ? "w-[600px] h-[450px]" : "w-auto h-auto"
        )}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

const RemoteVideo = ({ peer }: { peer: CallParticipant }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && peer.stream) {
            videoRef.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    return (
        <div className="relative bg-black/40 rounded-xl overflow-hidden aspect-video group border border-white/5">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <span className="text-white font-medium text-sm">{peer.user.name}</span>
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
                {peer.isMuted && <div className="p-1 bg-red-500/80 rounded-full"><MicOff size={12} className="text-white"/></div>}
                {peer.isVideoOff && <div className="p-1 bg-red-500/80 rounded-full"><VideoOff size={12} className="text-white"/></div>}
            </div>
        </div>
    );
};

const ControlButton = ({ onClick, icon: Icon, color }: any) => (
    <button
        onClick={onClick}
        className={cnLocal(
            "p-3 rounded-full text-white transition-all shadow-lg hover:scale-105 active:scale-95",
            color
        )}
    >
        <Icon size={20} />
    </button>
);

// Add types for Document Picture-in-Picture API
declare global {
  interface Window {
    documentPictureInPicture: {
      requestWindow(options: { width: number; height: number }): Promise<Window>;
      window: Window;
      onenter: ((this: Window, ev: Event) => any) | null;
    };
  }
}

export default VideoDock;
