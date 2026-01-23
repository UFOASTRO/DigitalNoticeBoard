import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Pin, PinContent } from '../types';
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
      setPins((data as any[]).map(p => ({
        ...p,
        x: p.x ?? 0,
        y: p.y ?? 0
      })) as Pin[]);
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

  const addPin = useCallback(async (pin: Omit<Pin, 'id' | 'created_at' | 'created_by' | 'cluster_id'>) => {
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
  }, [currentClusterId]);

  const updatePinPosition = useCallback(async (id: string, x: number, y: number) => {
    // Optimistic
    setPins(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));

    const { error } = await supabase
      .from('pins')
      .update({ x, y })
      .eq('id', id);

    if (error) console.error('Error moving pin:', error);
  }, []);
  
  const deletePin = useCallback(async (id: string) => {
      // Optimistic
      setPins(prev => prev.filter(p => p.id !== id));
      
      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', id);
        
      if (error) console.error('Error deleting pin:', error);
  }, []);

  const updatePinContent = useCallback(async (id: string, newContent: PinContent) => {
      setPins(prev => prev.map(p => p.id === id ? { ...p, content: newContent, updated_at: new Date().toISOString() } : p));

      const { error } = await supabase
        .from('pins')
        .update({ 
            content: newContent,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) console.error('Error updating pin content:', error);
  }, []);

  const markPinAsRead = useCallback(async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // We need the latest pins to check if already read. 
      // Using a functional update to get latest state in setPins is good, 
      // but we need to check condition first.
      // To avoid adding 'pins' to dependency array (which would cause re-creation on every pin update),
      // we can check inside the setPins callback or just proceed optimistically.
      // However, we need to know IF we should update DB.
      // Compromise: We fetch single pin or just update blindly with array_append if unique?
      // Supabase doesn't support 'add to array if unique' easily in one go without potential dupes if we aren't careful,
      // but 'read_by' is a set effectively.
      // For now, let's include 'pins' in dependency, OR use a ref for pins.
      // Using ref is safer for stability.
      
      setPins(prev => {
         const pin = prev.find(p => p.id === id);
         if (!pin) return prev;
         
         const currentReadBy = pin.read_by || [];
         if (currentReadBy.includes(user.id)) return prev;

         const newReadBy = [...currentReadBy, user.id];
         
         // Trigger DB update side-effect here? No, better outside.
         // But we can't easily return values from inside setPins to outside.
         
         // Alternative: Just fire the DB update. If it's already there, no harm (idempotent-ish if we handle it right).
         // Actually, let's just use 'pins' in dependency for now. 
         // If this causes loop, we will refactor.
         return prev.map(p => p.id === id ? { ...p, read_by: newReadBy } : p);
      });

      // DB Update
      // We do this blindly to avoid 'pins' dependency in the callback
      const { data: currentPin } = await supabase.from('pins').select('read_by').eq('id', id).single();
      if (currentPin) {
          const currentReadBy = (currentPin.read_by as string[]) || [];
          if (!currentReadBy.includes(user.id)) {
               const newReadBy = [...currentReadBy, user.id];
               await supabase.from('pins').update({ read_by: newReadBy }).eq('id', id);
          }
      }
  }, []);

  return {
    pins,
    loading,
    addPin,
    updatePinPosition,
    updatePinContent,
    markPinAsRead,
    deletePin
  };
};
