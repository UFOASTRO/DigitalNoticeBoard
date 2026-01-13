import React, { useState, useEffect } from 'react';
import { Cluster, ClusterMember, ClusterInvite } from '../../types';
import { supabase } from '../../lib/supabase';
import { X, Lock, Unlock, Globe, Trash2, Users, Link as LinkIcon, Activity } from 'lucide-react';

interface ClusterSettingsModalProps {
  cluster: Cluster;
  onClose: () => void;
  onUpdate: () => void;
}

export const ClusterSettingsModal: React.FC<ClusterSettingsModalProps> = ({ cluster, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'invites'>('general');
  const [name, setName] = useState(cluster.name);
  const [description, setDescription] = useState(cluster.description || '');
  const [isPublic, setIsPublic] = useState(cluster.is_public || false);
  const [isLocked, setIsLocked] = useState(cluster.is_locked || false);
  
  const [members, setMembers] = useState<(ClusterMember & { profile: any })[]>([]);
  const [invites, setInvites] = useState<ClusterInvite[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch Members
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('cluster_members')
      .select('*, profile:profiles(*)')
      .eq('cluster_id', cluster.id);
    if (data) setMembers(data);
  };

  // Fetch Invites
  const fetchInvites = async () => {
    const { data } = await supabase
      .from('cluster_invites')
      .select('*')
      .eq('cluster_id', cluster.id);
    if (data) setInvites(data);
  };

  // Subscribe to Presence
  useEffect(() => {
    if (activeTab === 'members') {
      const channel = supabase.channel(`cluster:${cluster.id}:presence`)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          setOnlineUsers(new Set(Object.keys(state)));
        })
        .subscribe();
        
      fetchMembers();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeTab, cluster.id]);

  useEffect(() => {
    if (activeTab === 'invites') fetchInvites();
  }, [activeTab, cluster.id]);

  const handleSaveGeneral = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('clusters')
      .update({ 
        name, 
        description, 
        is_public: isPublic, 
        is_locked: isLocked 
      })
      .eq('id', cluster.id);
      
    setLoading(false);
    if (!error) {
      onUpdate();
      alert('Cluster updated!');
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (!confirm('Revoke this invite link?')) return;
    const { error } = await supabase.from('cluster_invites').delete().eq('id', id);
    if (!error) fetchInvites();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Manage Cluster: {cluster.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium ${activeTab === 'general' ? 'bg-white border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 font-medium ${activeTab === 'members' ? 'bg-white border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Members
          </button>
          <button 
            onClick={() => setActiveTab('invites')}
            className={`px-6 py-3 font-medium ${activeTab === 'invites' ? 'bg-white border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Invites
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cluster Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                  placeholder="What is this cluster for?"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Public Cluster</div>
                    <div className="text-sm text-gray-500">Allow anyone to find and view this cluster</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  {isLocked ? <Lock className="w-5 h-5 text-red-600" /> : <Unlock className="w-5 h-5 text-green-600" />}
                  <div>
                    <div className="font-medium">Lock Cluster</div>
                    <div className="text-sm text-gray-500">Prevent new members from joining</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleSaveGeneral} 
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Members ({members.length})</h3>
              </div>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                        {member.profile?.email?.[0].toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.profile?.full_name || member.profile?.email}
                          {onlineUsers.has(member.user_id) && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              Live
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Active Invites</h3>
              </div>
              <div className="space-y-2">
                {invites.length === 0 ? <p className="text-gray-500 italic">No active invites.</p> : invites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="overflow-hidden">
                      <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded w-fit mb-1">{invite.token}</div>
                      <div className="text-xs text-gray-500">
                        Expires: {new Date(invite.expires_at).toLocaleDateString()} | Uses: {invite.uses_count}/{invite.max_uses || '∞'}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Revoke Invite"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
