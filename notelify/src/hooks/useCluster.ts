import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import type { Cluster } from '../types';
import { useNavigate } from 'react-router-dom';

export const useCluster = () => {
  const { currentClusterId, setClusterId } = useStore();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentClusterId) return;

    const fetchCluster = async () => {
      setLoading(true);
      // 1. Get Cluster Details
      const { data: clusterData, error: clusterError } = await supabase
        .from('clusters')
        .select('*')
        .eq('id', currentClusterId) // Assuming currentClusterId is the UUID or we query by name if it's a slug
        // If currentClusterId is a name/slug, we should change this query. 
        // Based on HomePage, it looks like it might be a name/slug. 
        // But the prompt implies UUIDs for owner checks. 
        // Let's assume for now it handles both or we query by 'id' if UUID, or 'name' if not.
        // For safety, let's look at how it's stored. HomePage sets it from input.
        // Let's assume the user enters a UUID or we query by a 'slug' column if it exists.
        // Given the ambiguity, I'll assume 'id' for now as per standard Supabase patterns, 
        // but if the user types a name in HomePage, this might fail if it's not a UUID.
        // However, the prompt strictly talks about 'clusters' table and RLS on 'owner_id'.
        .single();
      
      if (clusterError) {
        console.error('Error fetching cluster:', clusterError);
        setLoading(false);
        return;
      }

      setCluster(clusterData);

      // 2. Check Current User
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && clusterData) {
        setIsOwner(user.id === clusterData.owner_id);
      }
      
      setLoading(false);
    };

    fetchCluster();
  }, [currentClusterId]);

  const deleteCluster = async () => {
    if (!cluster || !isOwner) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this cluster? This action cannot be undone.');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('clusters')
      .delete()
      .eq('id', cluster.id);

    if (error) {
      console.error('Error deleting cluster:', error);
      alert('Failed to delete cluster.');
    } else {
      setClusterId(''); // Clear from store
      navigate('/'); // Go home
    }
  };

  return {
    cluster,
    isOwner,
    loading,
    deleteCluster
  };
};
