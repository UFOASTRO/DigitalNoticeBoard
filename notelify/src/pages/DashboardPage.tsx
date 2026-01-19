import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useUserClusters, type UserCluster } from '../hooks/useUserClusters';
import { ClusterCard } from '../components/dashboard/ClusterCard';
import { UpdatesFeed } from '../components/dashboard/UpdatesFeed';
import { PublicClusters } from '../components/dashboard/PublicClusters';
import { ClusterSettingsModal } from '../components/dashboard/ClusterSettingsModal';
import { GeneralSettingsModal } from '../components/dashboard/GeneralSettingsModal';
import { Plus, LayoutGrid, LogOut, Globe, Settings } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { clusters, loading, refreshClusters } = useUserClusters();
  
  const [activeView, setActiveView] = useState<'my-clusters' | 'public'>('my-clusters');
  const [editingCluster, setEditingCluster] = useState<UserCluster | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create Form State
  const [newClusterName, setNewClusterName] = useState('');
  const [newClusterDesc, setNewClusterDesc] = useState('');
  const [newClusterPublic, setNewClusterPublic] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClusterName.trim() || !user) return;

    const { error } = await supabase
      .from('clusters')
      .insert({
        name: newClusterName.trim(),
        description: newClusterDesc.trim(),
        is_public: newClusterPublic,
        owner_id: user.id
      })
      .select()
      .single();

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setNewClusterName('');
      setNewClusterDesc('');
      setNewClusterPublic(false);
      setIsCreating(false);
      refreshClusters();
    }
  };

  if (!user) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center dark:text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 fixed inset-y-0 left-0 hidden md:flex flex-col z-10 transition-colors">
        <div className="p-6 border-b dark:border-gray-700">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Notelify</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveView('my-clusters')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeView === 'my-clusters' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
          >
            <LayoutGrid className="w-5 h-5" />
            My Clusters
          </button>
          <button 
            onClick={() => setActiveView('public')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeView === 'public' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
          >
            <Globe className="w-5 h-5" />
             Public Clusters
          </button>
        </nav>

        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
               {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.user_metadata?.full_name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium mb-3 pl-1"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium pl-1"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 min-w-0 transition-colors">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {activeView === 'my-clusters' ? 'My Clusters' : 'Explore'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {activeView === 'my-clusters' ? 'Manage and access your digital notice boards.' : 'Join public communities.'}
            </p>
          </div>
          
          {activeView === 'my-clusters' && (
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Cluster
            </button>
          )}
        </header>

        {activeView === 'my-clusters' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {isCreating && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-4 transition-colors">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">Create New Cluster</h3>
                  <form onSubmit={handleCreateCluster} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cluster Name</label>
                      <input 
                        type="text" 
                        value={newClusterName}
                        onChange={(e) => setNewClusterName(e.target.value)}
                        placeholder="e.g., Marketing Team Board"
                        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea 
                        value={newClusterDesc}
                        onChange={(e) => setNewClusterDesc(e.target.value)}
                        placeholder="What is this cluster for?"
                        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                       <div>
                         <span className="font-medium text-gray-900 dark:text-gray-200 text-sm">Public Cluster</span>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Anyone can find and request to join this cluster.</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={newClusterPublic} onChange={(e) => setNewClusterPublic(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                        Create Cluster
                      </button>
                      <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {loading ? (
                <p className="dark:text-gray-400">Loading clusters...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clusters.map(cluster => (
                    <ClusterCard 
                      key={cluster.id} 
                      cluster={cluster} 
                      onManage={() => setEditingCluster(cluster)}
                    />
                  ))}
                  {clusters.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't joined any clusters yet.</p>
                      <button onClick={() => setIsCreating(true)} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                        Create one now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar - Updates */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 sticky top-8 transition-colors">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                  {/* <Activity className="w-5 h-5 text-orange-500" /> */}
                  Recent Activity
                </h3>
                <UpdatesFeed />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <PublicClusters />
          </div>
        )}
      </main>

      {/* Modals */}
      {showSettings && (
        <GeneralSettingsModal onClose={() => setShowSettings(false)} />
      )}
      {editingCluster && (
        <ClusterSettingsModal 
          cluster={editingCluster} 
          onClose={() => setEditingCluster(null)}
          onUpdate={() => {
            setEditingCluster(null);
            refreshClusters();
          }}
        />
      )}
    </div>
  );
}; 
