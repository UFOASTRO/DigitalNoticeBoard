import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export interface Cursor {
  x: number;
  y: number;
  userId: string;
  name: string;
  color: string;
  lastUpdated: number;
}

const CURSOR_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const getColorForUser = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
};

export const usePresence = () => {
  const { currentClusterId } = useStore();
  const [othersCursors, setOthersCursors] = useState<Cursor[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastBroadcastRef = useRef<number>(0);
  const THROTTLE_MS = 20; // Broadcast at most every 20ms (50fps)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || 'Anonymous'
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!currentClusterId || !currentUser) return;

    const channel = supabase.channel(`cluster:${currentClusterId}:presence`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const cursors: Cursor[] = [];
        
        Object.keys(newState).forEach(key => {
          if (key === currentUser.id) return; // Skip self

          const presences = newState[key] as any[];
          if (presences && presences.length > 0) {
            // Get the latest presence state for this user
            const latest = presences[presences.length - 1];
            if (latest.x !== undefined && latest.y !== undefined) {
              cursors.push({
                userId: key,
                x: latest.x,
                y: latest.y,
                name: latest.name || 'User',
                color: getColorForUser(key),
                lastUpdated: Date.now()
              });
            }
          }
        });
        
        setOthersCursors(cursors);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Initial track
           await channel.track({
            online_at: new Date().toISOString(),
            name: currentUser.email.split('@')[0], // Simple name
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentClusterId, currentUser]);

  const updateMyCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !currentUser) return;

    const now = Date.now();
    if (now - lastBroadcastRef.current < THROTTLE_MS) return;

    lastBroadcastRef.current = now;

    channelRef.current.track({
      x,
      y,
      name: currentUser.email.split('@')[0],
      updated_at: now
    });
  }, [currentUser]);

  return {
    othersCursors,
    updateMyCursor,
    currentUser
  };
};
