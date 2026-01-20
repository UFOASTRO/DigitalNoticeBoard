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
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; color: string } | null>(null);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const cursorsRef = useRef<Map<string, Cursor>>(new Map());
  const lastBroadcastRef = useRef<number>(0);
  
  // Increase update rate for smoother feel (60fps target approx 16ms)
  const THROTTLE_MS = 16; 

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const email = data.user.email || 'Anonymous';
        setCurrentUser({
          id: data.user.id,
          email: email,
          name: email.split('@')[0],
          color: getColorForUser(data.user.id)
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
      // 1. Handle Presence (Who is here)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const activeIds = new Set(Object.keys(newState));
        
        // Remove cursors of users who left
        const currentMap = cursorsRef.current;
        for (const [userId] of currentMap) {
            if (!activeIds.has(userId) && userId !== currentUser.id) {
                currentMap.delete(userId);
            }
        }

        // Initialize cursors for new users (if not exists)
        Object.keys(newState).forEach(key => {
          if (key === currentUser.id) return;
          if (!currentMap.has(key)) {
             const presences = newState[key] as any[];
             const info = presences[0]; // Get static info
             currentMap.set(key, {
                userId: key,
                x: 0, // Default until we get a broadcast
                y: 0,
                name: info?.name || 'User',
                color: getColorForUser(key),
                lastUpdated: Date.now()
             });
          }
        });

        // Update state
        setOthersCursors(Array.from(currentMap.values()));
      })
      .on('presence', { event: 'join' }, () => {
          // Optional: Handle immediate join logic if needed
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
           if (cursorsRef.current.has(key)) {
               cursorsRef.current.delete(key);
               setOthersCursors(Array.from(cursorsRef.current.values()));
           }
      })
      // 2. Handle Broadcast (Where are they - High Frequency)
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
          if (payload.userId === currentUser.id) return;

          const current = cursorsRef.current.get(payload.userId);
          if (current) {
             // Update position
             current.x = payload.x;
             current.y = payload.y;
             current.lastUpdated = Date.now();
             // Force update
             setOthersCursors(Array.from(cursorsRef.current.values()));
          } else {
             // Received move from unknown user (race condition with presence), add them temporarily
             cursorsRef.current.set(payload.userId, {
                userId: payload.userId,
                x: payload.x,
                y: payload.y,
                name: payload.name || 'Unknown',
                color: getColorForUser(payload.userId),
                lastUpdated: Date.now()
             });
             setOthersCursors(Array.from(cursorsRef.current.values()));
          }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
           await channel.track({
            online_at: new Date().toISOString(),
            name: currentUser.email.split('@')[0],
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

    // Send ephemeral message
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor-move',
      payload: {
        userId: currentUser.id,
        x,
        y,
        name: currentUser.email.split('@')[0]
      }
    });
  }, [currentUser]);

  return {
    othersCursors,
    updateMyCursor,
    currentUser
  };
};
