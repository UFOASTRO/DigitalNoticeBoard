import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Cluster } from '../../types';
import { Search, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PublicClusters: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchPublic = async () => {
    setLoading(true);
    let query = supabase
      .from('clusters')
      .select('*')
      .eq('is_public', true)
      .limit(20);

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data } = await query;
    if (data) setClusters(data);
    setLoading(false);
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchPublic();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleJoin = async (clusterId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if already member
    const { data: existing } = await supabase
        .from('cluster_members')
        .select('*')
        .eq('cluster_id', clusterId)
        .eq('user_id', user.id)
        .single();
    
    if (existing) {
        navigate(`/app/${clusterId}`);
        return;
    }

    // Join
    const { error } = await supabase.from('cluster_members').insert({
        cluster_id: clusterId,
        user_id: user.id,
        role: 'viewer' // Default role
    });

    if (!error) {
        navigate(`/app/${clusterId}`);
    } else {
        alert('Failed to join cluster. It might be locked.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-6 transition-colors">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-bold dark:text-white">Discover Public Clusters</h2>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input 
          type="text" 
          placeholder="Search clusters..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
           <p className="text-center text-gray-500 dark:text-slate-400 py-4">Searching...</p>
        ) : clusters.length === 0 ? (
           <p className="text-center text-gray-500 dark:text-slate-400 py-4">No public clusters found.</p>
        ) : (
          clusters.map(cluster => (
            <div key={cluster.id} className="flex items-center justify-between p-3 border dark:border-slate-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{cluster.name}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">{cluster.description || 'No description'}</p>
              </div>
              <button 
                onClick={() => handleJoin(cluster.id)}
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                {cluster.is_locked ? <Lock className="w-3 h-3" /> : 'Join'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
