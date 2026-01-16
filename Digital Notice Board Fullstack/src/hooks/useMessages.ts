import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';
import { useStore } from '../store/useStore';

export const useMessages = (pinId: string | null) => {
  const { currentClusterId } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentClusterId) return;

    const fetchMessages = async () => {
      setLoading(true);
      let query = supabase
        .from('messages')
        .select(`
            *,
            profiles (
                full_name,
                email
            )
        `)
        .eq('cluster_id', currentClusterId)
        .order('created_at', { ascending: true });

      if (pinId) {
        query = query.eq('pin_id', pinId);
      } else {
        query = query.is('pin_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        setMessages(data as any[]); // Types might need adjustment for the joined 'profiles'
      }
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`cluster:${currentClusterId}:messages:${pinId || 'general'}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `cluster_id=eq.${currentClusterId}`
        }, 
        async (payload) => {
          const newMessage = payload.new as Message;
          // Filter locally to avoid wrong thread updates if the filter string in subscription isn't precise enough
          // (Supabase realtime filters are limited)
          if ((!pinId && !newMessage.pin_id) || (pinId && newMessage.pin_id === pinId)) {
             // Fetch profile for the new message
             const { data: userProfile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', newMessage.user_id)
                .single();

             const messageWithProfile = { ...newMessage, profiles: userProfile };
             setMessages(prev => [...prev, messageWithProfile as any]);
             scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentClusterId, pinId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
  };

  const sendMessage = async (content: string, imageUrl?: string) => {
    if ((!content.trim() && !imageUrl) || !currentClusterId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('messages').insert({
      cluster_id: currentClusterId,
      user_id: user.id,
      pin_id: pinId, // null for general, uuid for thread
      content: content.trim(),
      image_url: imageUrl
    });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    scrollRef
  };
};
