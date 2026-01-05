import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Pin, PinContent } from '../types';
import { useStore } from '../store/useStore';

export const usePins = () => {
  const { currentClusterId } = useStore();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPins = useCallback(async () => {
    if (!currentClusterId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .eq('cluster_id', currentClusterId);

    if (error) {
      console.error('Error fetching pins:', error);
    } else if (data) {
      setPins(data as Pin[]);
    }
    setLoading(false);
  }, [currentClusterId]);

  useEffect(() => {
    fetchPins();

    if (!currentClusterId) return;

    const channel = supabase
      .channel(`cluster:${currentClusterId}:pins`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pins',
          filter: `cluster_id=eq.${currentClusterId}` 
        }, 
        (payload) => {
          console.log('Real-time pin update:', payload);
          // Simple strategy: refetch or merge.
          // Merging is smoother for drag operations.
          if (payload.eventType === 'INSERT') {
             setPins(prev => [...prev, payload.new as Pin]);
          } else if (payload.eventType === 'DELETE') {
             setPins(prev => prev.filter(p => p.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
             setPins(prev => prev.map(p => p.id === payload.new.id ? (payload.new as Pin) : p));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentClusterId, fetchPins]);

  const addPin = async (pin: Omit<Pin, 'id' | 'created_at' | 'created_by' | 'cluster_id'>) => {
    if (!currentClusterId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic update could happen here
    const { error } = await supabase.from('pins').insert({
      cluster_id: currentClusterId,
      type: pin.type,
      content: pin.content,
      x: pin.x,
      y: pin.y,
      created_by: user.id
    });

    if (error) console.error('Error adding pin:', error);
  };

  const updatePinPosition = async (id: string, x: number, y: number) => {
    // Optimistic
    setPins(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));

    const { error } = await supabase
      .from('pins')
      .update({ x, y })
      .eq('id', id);

    if (error) console.error('Error moving pin:', error);
  };
  
  const deletePin = async (id: string) => {
      // Optimistic
      setPins(prev => prev.filter(p => p.id !== id));
      
      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', id);
        
      if (error) console.error('Error deleting pin:', error);
  };

  return {
    pins,
    loading,
    addPin,
    updatePinPosition,
    deletePin
  };
};
