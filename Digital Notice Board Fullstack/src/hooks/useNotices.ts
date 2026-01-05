import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Notice, Coordinates } from '../types';

export const useNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notices')
      .select('*');

    if (error) {
      console.error('Error fetching notices:', error);
    } else if (data) {
      // Map DB snake_case to Frontend camelCase
      const mappedNotices: Notice[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        position: { x: item.position_x, y: item.position_y },
        rotation: item.rotation,
        paperType: item.paper_type,
        paperColor: item.paper_color,
        pinColor: item.pin_color,
        createdAt: item.created_at,
        expiryDate: item.expiry_date
      }));
      setNotices(mappedNotices);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotices();

    // Real-time subscription
    const channel = supabase
      .channel('public:notices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, (payload) => {
        console.log('Real-time change:', payload);
        // Simplest strategy: refetch all. Optimized: handle INSERT/UPDATE/DELETE locally.
        // For drag performance, we optimize the local state optimistically, so this might conflict.
        // We'll stick to refetch for now or simple merging.
        fetchNotices(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addNotice = async (notice: Omit<Notice, 'id' | 'createdAt'>) => {
    // Optimistic update could go here
    const { error } = await supabase.from('notices').insert({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      position_x: notice.position.x,
      position_y: notice.position.y,
      rotation: notice.rotation,
      paper_type: notice.paperType,
      paper_color: notice.paperColor,
      pin_color: notice.pinColor,
    });

    if (error) console.error('Error adding notice:', error);
  };

  const updateNoticePosition = async (id: string, position: Coordinates) => {
    // Optimistic Update
    setNotices(prev => prev.map(n => n.id === id ? { ...n, position } : n));

    const { error } = await supabase
      .from('notices')
      .update({ position_x: position.x, position_y: position.y })
      .eq('id', id);

    if (error) {
      console.error('Error moving notice:', error);
      // Revert if needed
    }
  };

  return {
    notices,
    loading,
    addNotice,
    updateNoticePosition
  };
};
