import { useState } from 'react';
import { Plus } from 'lucide-react';
import { InfiniteCanvas } from '../components/InfiniteCanvas';
import { PaperNote } from '../components/PaperNote';
import { NewNoticeModal } from '../components/NewNoticeModal';
import { usePins } from '../hooks/usePins';
import { useConnections } from '../hooks/useConnections';
import { useStore } from '../store/useStore';
import { usePresence } from '../hooks/usePresence';

export const CanvasPage = () => {
  const { currentClusterId, setActivePin } = useStore();
  const { pins, updatePinPosition, addPin, loading } = usePins();
  const { connections, addConnection } = useConnections();
  const { othersCursors, updateMyCursor } = usePresence();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Connection linking state
  const [connectingPinId, setConnectingPinId] = useState<string | null>(null);

  const handleSaveNotice = (data: any) => {
    addPin({
      type: 'sticky',
      content: {
        title: data.title,
        body: data.content,
        paperType: 'plain',
        paperColor: data.paperColor,
        pinColor: data.pinColor,
      },
      x: window.innerWidth / 2 - 150,
      y: window.innerHeight / 2 - 100
    });
  };

  const handlePinClick = (pinId: string, e: React.MouseEvent) => {
    // If holding Shift, try to connect
    if (e.shiftKey) {
       e.stopPropagation();
       if (connectingPinId === null) {
          setConnectingPinId(pinId);
       } else {
          if (connectingPinId !== pinId) {
             addConnection(connectingPinId, pinId);
          }
          setConnectingPinId(null);
       }
       return;
    }

    setActivePin(pinId);
    setConnectingPinId(null);
  };

  // Helper to find pin coordinates
  const getPinCenter = (id: string) => {
     const pin = pins.find(p => p.id === id);
     if (!pin) return { x: 0, y: 0 };
     // Assuming pin width ~288px (w-72) and height variable but let's aim for center top or center
     // PaperNote is w-72 (288px). Let's offset by half width.
     return { x: pin.x + 144, y: pin.y + 100 };
  };

  return (
    <div className="w-full h-full relative" onClick={() => setConnectingPinId(null)}>
      <InfiniteCanvas 
        cursors={othersCursors} 
        onCursorMove={updateMyCursor}
      >
        {/* Connections Layer (Below Pins) */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
           {connections.map(conn => {
              const start = getPinCenter(conn.from_pin);
              const end = getPinCenter(conn.to_pin);
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              // Create a smooth S-curve
              const pathData = `M ${start.x} ${start.y} C ${start.x + dx * 0.5} ${start.y}, ${end.x - dx * 0.5} ${end.y}, ${end.x} ${end.y}`;

              return (
                 <path 
                   key={conn.id}
                   d={pathData}
                   fill="none"
                   stroke="#94a3b8"
                   strokeWidth="3"
                   strokeLinecap="round"
                   className="opacity-60 hover:opacity-100 transition-opacity duration-200"
                 />
              );
           })}
           {/* Temporary line while connecting */}
           {connectingPinId && (
               // This would require mouse tracking to draw line to cursor. 
               // For MVP, we just highlight the selected pin.
               <></>
           )}
        </svg>

        {pins.map(pin => (
          <div 
            key={pin.id} 
            onClick={(e) => {
                e.stopPropagation();
                handlePinClick(pin.id, e);
            }}
            className={`${connectingPinId === pin.id ? 'ring-4 ring-blue-500 rounded-xl' : ''} transition-all duration-200 pointer-events-auto`}
          >
            <PaperNote 
              pin={pin} 
              onDragEnd={updatePinPosition}
            />
          </div>
        ))}
        {loading && pins.length === 0 && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="bg-white/80 px-4 py-2 rounded-full shadow-sm text-sm text-slate-500 backdrop-blur">
               Loading Board...
             </span>
           </div>
        )}
      </InfiniteCanvas>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
        >
          <Plus size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-medium">
            Add Note
          </span>
        </button>
      </div>
      
      {/* Help Tip */}
      <div className="fixed bottom-8 right-8 text-xs text-slate-400 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-slate-100 hidden md:block">
         Shift + Click two notes to connect them
      </div>

      <NewNoticeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNotice}
      />
    </div>
  );
};
