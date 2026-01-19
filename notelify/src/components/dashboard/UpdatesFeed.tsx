import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecentUpdates } from '../../hooks/useRecentUpdates';

export const UpdatesFeed: React.FC = () => {
  const { updates, loading } = useRecentUpdates();
  const navigate = useNavigate();

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>)}
    </div>;
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No recent activity across your clusters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {updates.map((update) => (
        <div 
          key={update.id}
          onClick={() => navigate(`/app/${update.cluster_id}`)}
          className="py-3 border-b h-full last:border-0 border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 px-3 -mx-3 rounded-lg transition-colors"
        >
          <div className="flex justify-between items-start mb-1 gap-2">
             <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate flex-1">
               {update.type === 'sticky' ? (update.content.title || 'Untitled Note') : 'New Image'}
             </span>
             <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
               {new Date(update.created_at || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
             </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
             <span>{update.cluster_name}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
