import { useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Sidebar } from '../components/Sidebar';

export const ClusterLayout = () => {
  const { clusterId } = useParams<{ clusterId: string }>();
  const { setClusterId, isSidebarOpen } = useStore();

  useEffect(() => {
    if (clusterId) setClusterId(clusterId);
  }, [clusterId, setClusterId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* MAIN CANVAS AREA */}
      <main className="flex-1 relative transition-all duration-300 h-full">
         <Outlet /> 
      </main>

      {/* RIGHT SIDEBAR (Context Aware) */}
      <aside 
        className={`
          border-l border-slate-200 bg-white shadow-xl z-10 transition-all duration-300 flex flex-col
          ${isSidebarOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}
        `}
      >
        <Sidebar />
      </aside>
    </div>
  );
};
