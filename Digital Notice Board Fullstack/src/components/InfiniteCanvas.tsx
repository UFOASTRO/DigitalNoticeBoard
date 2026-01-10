import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cursor as CursorType } from '../hooks/usePresence';
import { MousePointer2 } from 'lucide-react';

interface InfiniteCanvasProps {
  children?: React.ReactNode;
  cursors?: CursorType[];
  onCursorMove?: (x: number, y: number) => void;
}

interface Position {
  x: number;
  y: number;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ children, cursors = [], onCursorMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas State
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Interaction State
  const lastPosition = useRef<Position>({ x: 0, y: 0 });
  const lastDist = useRef<number | null>(null); // For pinch zoom

  // Constants
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Check if the target is a canvas layer (background)
    // We use data-canvas-bg to identify elements that should trigger a canvas pan
    const target = e.target as HTMLElement;
    
    if (target.dataset.canvasBg === "true" || target === containerRef.current) {
      e.preventDefault(); // Prevent text selection etc
      setIsDragging(true);
      lastPosition.current = { x: e.clientX, y: e.clientY };
      containerRef.current?.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Broadcast cursor position (transformed to canvas space)
    if (onCursorMove) {
       // Canvas space = (Screen - Offset) / Scale
       // We use e.clientX/Y relative to the container if possible, but clientX is global.
       // Ideally we subtract the container's top/left, but if full screen it's 0.
       const canvasX = (e.clientX - offset.x) / scale;
       const canvasY = (e.clientY - offset.y) / scale;
       onCursorMove(canvasX, canvasY);
    }

    if (!isDragging) return;
    
    // Calculate delta
    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;

    // Update offset
    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    // Update last pos
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    lastDist.current = null; // Reset pinch
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  // Wheel Zoom (Desktop)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if(e.ctrlKey) { 
        // Pinch on trackpad usually sends Ctrl+Wheel
    }

    // Determine scale factor
    const scaleFactor = 1.05; // Smoother zoom
    const direction = e.deltaY > 0 ? -1 : 1;
    let newScale = scale * (direction > 0 ? scaleFactor : 1 / scaleFactor);

    // Clamp Scale
    newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

    // Calculate mouse position relative to container
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards pointer math:
    const newOffset = {
      x: mouseX - (mouseX - offset.x) * (newScale / scale),
      y: mouseY - (mouseY - offset.y) * (newScale / scale)
    };

    setScale(newScale);
    setOffset(newOffset);
  };

  // Prevent default browser zoom behavior
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    return () => {
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-slate-50 touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      data-canvas-bg="true"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* The Infinite Grid Layer - now separate from content transform */}
      <div 
        className="absolute inset-0 w-full h-full dot-grid-bg pointer-events-none"
        style={{
            backgroundPosition: `${offset.x}px ${offset.y}px`,
            backgroundSize: `${24 * scale}px ${24 * scale}px`
        }}
      />

      {/* Content Container - Transformed */}
      <motion.div
        className="absolute inset-0 w-full h-full origin-top-left pointer-events-none"
        style={{
          x: offset.x,
          y: offset.y,
          scale: scale,
        }}
      >
        <div className="relative w-full h-full">
            {children}
            
            {/* Live Cursors Layer */}
            {cursors.map(cursor => (
              <div
                key={cursor.userId}
                className="absolute top-0 left-0 flex flex-col items-start pointer-events-none z-50 transition-all duration-75 ease-linear"
                style={{
                  transform: `translate(${cursor.x}px, ${cursor.y}px) scale(${1/scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <MousePointer2 
                  size={20} 
                  fill={cursor.color} 
                  color={cursor.color}
                  className="drop-shadow-sm"
                />
                <span 
                  className="ml-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.name}
                </span>
              </div>
            ))}
        </div>
      </motion.div>

      {/* HUD / Controls */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur shadow-sm p-2 rounded-lg text-xs text-slate-500 font-mono pointer-events-auto border border-slate-200">
           Zoom: {Math.round(scale * 100)}%
        </div>
        <div className="bg-stone-700  backdrop-blur shadow-sm p-2 rounded-lg text-xs text-slate-500 font-mono pointer-events-auto border border-slate-200">
           X: {Math.round(offset.x)} Y: {Math.round(offset.y)}
        </div>
      </div>
    </div>
  );
};