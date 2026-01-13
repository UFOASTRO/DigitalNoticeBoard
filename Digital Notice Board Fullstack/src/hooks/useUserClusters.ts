import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Cluster, ClusterMember } from '../types';

export interface UserCluster extends Cluster {
  role: 'admin' | 'viewer' | 'editor';
  joined_at: string;
}

export const useUserClusters = () => {
  const [clusters, setClusters] = useState<UserCluster[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClusters = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cluster_members')
      .select('role, joined_at, cluster:clusters(*)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user clusters:', error);
    } else if (data) {
      const formattedClusters = data.map((item: any) => ({
        ...item.cluster,
        role: item.role,
        joined_at: item.joined_at,
      }));
      setClusters(formattedClusters);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  return { clusters, loading, refreshClusters: fetchClusters };
};
