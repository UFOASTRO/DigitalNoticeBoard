import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Lock, Globe, ArrowRight } from 'lucide-react';
import type { UserCluster } from '../../hooks/useUserClusters';

interface ClusterCardProps {
  cluster: UserCluster;
  onManage: () => void;
}

export const ClusterCard: React.FC<ClusterCardProps> = ({ cluster, onManage }) => {
  const navigate = useNavigate();
  const isAdmin = cluster.role === 'admin'; 
  // In types.ts role is 'admin' | 'viewer' | 'editor'. Owner usually gets 'admin'.

  return (
    <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow duration-200 group relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {cluster.name}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1 min-h-[2.5em]">
            {cluster.description || 'No description provided.'}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={(e) => { e.stopPropagation(); onManage(); }}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Cluster Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6">
        {cluster.is_public && (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
            <Globe className="w-3 h-3" /> Public
          </span>
        )}
        {cluster.is_locked && (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
            <Lock className="w-3 h-3" /> Locked
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          Joined {new Date(cluster.joined_at).toLocaleDateString()}
        </span>
      </div>

      <button 
        onClick={() => navigate(`/app/${cluster.id}`)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-700 font-medium rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200"
      >
        Enter Cluster
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
