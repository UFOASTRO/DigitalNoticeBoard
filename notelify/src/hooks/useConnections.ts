import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Connection } from '../types';
import { useStore } from '../store/useStore';

export const useConnections = () => {
  const { currentClusterId } = useStore();
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    if (!currentClusterId) return;

    const fetchConnections = async () => {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('cluster_id', currentClusterId);

      if (error) {
        console.error('Error fetching connections:', error);
      } else if (data) {
        setConnections(data as Connection[]);
      }
    };

    fetchConnections();

    const channel = supabase
      .channel(`cluster:${currentClusterId}:connections`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'connections',
          filter: `cluster_id=eq.${currentClusterId}` 
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConnections(prev => [...prev, payload.new as Connection]);
          } else if (payload.eventType === 'DELETE') {
            setConnections(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentClusterId]);

  const addConnection = async (fromPin: string, toPin: string) => {
    if (!currentClusterId) return;

    // Check if exists
    const exists = connections.some(c => 
       (c.from_pin === fromPin && c.to_pin === toPin) || 
       (c.from_pin === toPin && c.to_pin === fromPin)
    );
    if (exists) return;

    const { error } = await supabase.from('connections').insert({
      cluster_id: currentClusterId,
      from_pin: fromPin,
      to_pin: toPin
    });

    if (error) console.error('Error adding connection:', error);
  };

  return {
    connections,
    addConnection
  };
};
