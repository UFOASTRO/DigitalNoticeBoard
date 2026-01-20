import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Sidebar } from '../components/Sidebar';
import { ClusterNavbar } from '../components/ClusterNavbar';

export const ClusterLayout = () => {
  const { clusterId } = useParams<{ clusterId: string }>();
  const { setClusterId, isSidebarOpen } = useStore();
  
  // Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clusterId) setClusterId(clusterId);
  }, [clusterId, setClusterId]);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        // Calculate new width from right edge of screen
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        // Clamp width (min 300px, max 800px or 80% of screen)
        if (newWidth > 300 && newWidth < window.innerWidth * 0.8) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* TOP NAVIGATION BAR */}
      <ClusterNavbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* MAIN CANVAS AREA */}
        <main className="flex-1 relative h-full transition-all duration-300">
           <Outlet /> 
        </main>

        {/* RIGHT SIDEBAR (Context Aware) */}
        <aside 
          ref={sidebarRef}
          className={`
            relative border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-10 flex flex-col transition-colors
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full opacity-0 overflow-hidden'}
          `}
          style={{
             width: isSidebarOpen ? sidebarWidth : 0,
             transition: isResizing ? 'none' : 'width 300ms ease, transform 300ms ease, opacity 300ms ease'
          }}
        >
          {/* Resize Handle */}
          <div
            className="absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-blue-400 active:bg-blue-600 z-50 transition-colors group"
            onMouseDown={startResizing}
          >
              {/* Visual Indicator on Hover */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-slate-300 dark:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity mx-auto right-0" />
          </div>

          {/* Prevent interaction with content while resizing to avoid selecting text */}
          <div className={`flex flex-col h-full ${isResizing ? 'pointer-events-none select-none' : ''}`}>
             <Sidebar />
          </div>
        </aside>
      </div>
    </div>
  );
};