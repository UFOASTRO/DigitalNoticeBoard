import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Pin } from '../types';

export interface RecentUpdate extends Pin {
  cluster_name?: string;
}

export const useRecentUpdates = () => {
  const [updates, setUpdates] = useState<RecentUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Get user's cluster IDs
    const { data: memberData, error: memberError } = await supabase
      .from('cluster_members')
      .select('cluster_id')
      .eq('user_id', user.id);

    if (memberError || !memberData) {
      console.error('Error fetching member clusters:', memberError);
      setLoading(false);
      return;
    }

    const clusterIds = memberData.map((m: any) => m.cluster_id);

    if (clusterIds.length === 0) {
      setUpdates([]);
      setLoading(false);
      return;
    }

    // 2. Fetch recent pins from these clusters
    const { data: pinsData, error: pinsError } = await supabase
      .from('pins')
      .select('*, cluster:clusters(name)')
      .in('cluster_id', clusterIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (pinsError) {
      console.error('Error fetching recent updates:', pinsError);
    } else if (pinsData) {
      const formattedUpdates = pinsData.map((pin: any) => ({
        ...pin,
        cluster_name: pin.cluster?.name || 'Unknown Cluster',
      }));
      setUpdates(formattedUpdates);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  return { updates, loading, refreshUpdates: fetchUpdates };
};
