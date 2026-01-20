import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Share2, Settings, ArrowLeft } from 'lucide-react';
import { useCluster } from '../hooks/useCluster';
import { useUserClusters } from '../hooks/useUserClusters';
import { usePresence } from '../hooks/usePresence';
import { InviteModal } from './InviteModal';
import { ClusterSettingsModal } from './dashboard/ClusterSettingsModal';

export const ClusterNavbar = () => {
  const navigate = useNavigate();
  const { cluster, isOwner } = useCluster();
  const { clusters: myClusters } = useUserClusters();
  const { othersCursors, currentUser } = usePresence(); 
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!cluster) return null;

  const handleSwitch = (id: string) => {
      navigate(`/app/${id}`);
      setShowDropdown(false);
  };

  // Avatar stack: currentUser + others
  // We use a Set to ensure uniqueness if needed, but here just display
  const onlineCount = othersCursors.length + 1;
  const avatars = [
      { name: currentUser?.name || 'Me', color: currentUser?.color || '#000' },
      ...othersCursors.map(c => ({ name: c.name, color: c.color }))
  ].slice(0, 4); // Show max 4 bubbles

  return (
    <>
      <nav className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-20 shrink-0 transition-colors relative shadow-sm">
        {/* LEFT: Project Info */}
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/dashboard')} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                title="Back to Dashboard"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="relative">
                <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 -ml-2 rounded-lg transition-colors text-left"
                >
                    <div>
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white leading-none text-base">
                            {cluster.name}
                            <ChevronDown size={16} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''} text-slate-400`} />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            Last edited {cluster.updated_at ? new Date(cluster.updated_at).toLocaleDateString() : 'Just now'}
                        </div>
                    </div>
                </button>

                {/* Cluster Switcher Dropdown */}
                {showDropdown && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-xl rounded-xl py-2 z-20 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Switch Cluster</div>
                            <div className="max-h-64 overflow-y-auto">
                                {myClusters.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSwitch(c.id)}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between group ${c.id === cluster.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
                                    >
                                        <div className="truncate font-medium">{c.name}</div>
                                        {c.id === cluster.id && <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                                    </button>
                                ))}
                            </div>
                            <div className="border-t dark:border-slate-700 my-1 pt-1" />
                             <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full text-left px-4 py-3 text-sm text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                            >
                                + View All / Create New
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3 sm:gap-6">
            {/* Avatar Stack */}
            <div className="flex items-center -space-x-3 mr-2">
                {avatars.map((u, i) => (
                    <div 
                        key={i} 
                        className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-black/5 cursor-help transition-transform hover:scale-110 hover:z-10 relative"
                        style={{ backgroundColor: u.color }}
                        title={u.name}
                    >
                        {u.name[0]?.toUpperCase()}
                    </div>
                ))}
                {onlineCount > 4 && (
                    <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300 shadow-sm z-10">
                        +{onlineCount - 4}
                    </div>
                )}
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

            {/* Share CTA */}
            <button 
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
            >
                <Share2 size={16} />
                <span className="hidden sm:inline">Share</span>
            </button>

            {/* Settings */}
            {isOwner && (
                <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                    title="Cluster Settings"
                >
                    <Settings size={22} />
                </button>
            )}
        </div>
      </nav>

      {/* Modals */}
      {showInvite && <InviteModal cluster={cluster} onClose={() => setShowInvite(false)} />}
      {showSettings && <ClusterSettingsModal cluster={cluster} onClose={() => setShowSettings(false)} onUpdate={() => window.location.reload()} />}
    </>
  );
};
