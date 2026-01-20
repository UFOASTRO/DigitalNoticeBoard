import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Peer from 'peerjs';

// Define types since we might not have @types/peerjs
export interface WebRTCStream {
  id: string; // peerId
  stream: MediaStream;
  user: {
    id: string;
    name: string;
    color: string;
  };
  isMuted: boolean;
  isVideoOff: boolean;
}

interface PeerPresenceState {
  peerId: string;
  user: {
    id: string;
    name: string;
    color: string;
  };
  mic: boolean;
  camera: boolean;
}

export const useWebRTC = (clusterId: string | null) => {
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, WebRTCStream>>(new Map());
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  
  // Controls
  const [isMuted, setIsMuted] = useState(true); // Start muted to prevent feedback
  const [isVideoOff, setIsVideoOff] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const myStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, WebRTCStream>>(new Map());
  const callsRef = useRef<Map<string, any>>(new Map()); // Keep track of active calls
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 1. Initialize Local Stream
  const initializeStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      // Mute local audio track by default locally to prevent echo, 
      // but we actually want to send audio. 
      // The `muted` prop on the video element handles local echo.
      // But we initialized state `isMuted` = true, so let's sync tracks.
      stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      stream.getVideoTracks().forEach(track => track.enabled = !isVideoOff);

      myStreamRef.current = stream;
      setMyStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      return null;
    }
  }, []);

  // 2. Toggle Controls
  const toggleAudio = () => {
    if (myStreamRef.current) {
      const newState = !isMuted;
      myStreamRef.current.getAudioTracks().forEach(track => track.enabled = !newState);
      setIsMuted(newState);
      updatePresenceState({ mic: !newState });
    }
  };

  const toggleVideo = () => {
    if (myStreamRef.current) {
      const newState = !isVideoOff;
      myStreamRef.current.getVideoTracks().forEach(track => track.enabled = !newState);
      setIsVideoOff(newState);
      updatePresenceState({ camera: !newState });
    }
  };

  // Helper to update our presence in Supabase
  const updatePresenceState = async (updates: Partial<PeerPresenceState>) => {
    if (!channelRef.current || !myPeerId) return;
    
    // We need to re-track with the new state
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    await channelRef.current.track({
      peerId: myPeerId,
      user: {
        id: user.data.user.id,
        name: user.data.user.email?.split('@')[0] || 'User',
        color: '#3B82F6', // Default or dynamic
      },
      mic: !isMuted, // Current state
      camera: !isVideoOff, // Current state
      ...updates
    });
  };

  // 3. Initialize PeerJS & Join Room
  useEffect(() => {
    if (!clusterId) return;

    let peerInstance: Peer;

    const setup = async () => {
      const stream = await initializeStream();
      if (!stream) return;

      // Create Peer
      peerInstance = new Peer(undefined as any, {
        // config if needed, default is peerjs cloud
      });

      peerInstance.on('open', (id) => {
        setMyPeerId(id);
        peerRef.current = peerInstance;
        joinSupabaseRoom(id, stream);
      });

      peerInstance.on('call', (call) => {
        console.log('Incoming call from:', call.peer);
        call.answer(stream);
        
        call.on('stream', (remoteStream) => {
          addPeerStream(call.peer, remoteStream);
        });
        
        call.on('close', () => {
          removePeerStream(call.peer);
        });

        callsRef.current.set(call.peer, call);
      });
    };

    setup();

    return () => {
      // Cleanup
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerInstance) peerInstance.destroy();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      setPeers(new Map());
      setIsJoined(false);
    };
  }, [clusterId]);

  const joinSupabaseRoom = async (peerId: string, stream: MediaStream) => {
    if (!clusterId) return;

    const { data: { user } } = await supabase.auth.getUser();
    const userInfo = {
      id: user?.id || 'anon',
      name: user?.email?.split('@')[0] || 'Guest',
      color: '#10B981' // Todo: use consistent color function
    };

    const channel = supabase.channel(`room:${clusterId}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        // Check for new users to call
        Object.values(state).flat().forEach((presence: any) => {
          if (presence.peerId && presence.peerId !== peerId) {
             // If we haven't called them and they are here, call them?
             // To avoid double calling, we can use a convention:
             // e.g., Sort IDs and only Lower ID calls Higher ID, or just rely on "User B calls User A" logic.
             // "User B sees presence: Initiates a PeerJS call to User A"
             // This implies if I AM User B (newer), I call everyone else?
             // But presence sync happens for everyone.
             // A simple way: If I don't have a call with them, call them.
             // PeerJS handles duplicate connections gracefully usually, but better to check.
             
             if (!callsRef.current.has(presence.peerId)) {
               connectToNewUser(presence.peerId, stream);
             }
             
             // Also update their metadata (mute status etc) if we have them
             if (peersRef.current.has(presence.peerId)) {
                 const current = peersRef.current.get(presence.peerId)!;
                 if (current.isMuted !== !presence.mic || current.isVideoOff !== !presence.camera) {
                     setPeers(prev => {
                         const newMap = new Map(prev);
                         newMap.set(presence.peerId, {
                             ...current,
                             user: presence.user,
                             isMuted: !presence.mic,
                             isVideoOff: !presence.camera
                         });
                         return newMap;
                     });
                     peersRef.current = peersRef.current; // sync ref
                 }
             }
          }
        });
        
        // Handle users leaving
        const activePeerIds = new Set(
            Object.values(state).flat().map((p: any) => p.peerId)
        );
        
        peersRef.current.forEach((_, key) => {
            if (!activePeerIds.has(key)) {
                removePeerStream(key);
            }
        });

      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
          // New user joined, we (existing users) might just wait for them to call us?
          // Or we call them.
          // Let's stick to "Joiner calls existing".
          // If *I* am the joiner, 'sync' handles it (I see everyone).
          // If *Someone else* joins, I see 'join'.
          // If the rule is "Newer calls Older", I don't need to do anything here except wait for their call.
          // But to be robust, let's just ensure connection.
          newPresences.forEach((p: any) => {
             if (p.peerId !== peerId && !callsRef.current.has(p.peerId)) {
                 connectToNewUser(p.peerId, stream);
             }
          });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          leftPresences.forEach((p: any) => {
              removePeerStream(p.peerId);
          });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            peerId,
            user: userInfo,
            mic: !isMuted,
            camera: !isVideoOff
          });
          setIsJoined(true);
        }
      });
  };

  const connectToNewUser = (remotePeerId: string, stream: MediaStream) => {
    if (!peerRef.current) return;
    
    // Check if we are already connected or connecting
    if (callsRef.current.has(remotePeerId)) return;

    console.log('Calling peer:', remotePeerId);
    const call = peerRef.current.call(remotePeerId, stream);
    
    call.on('stream', (remoteStream) => {
      addPeerStream(remotePeerId, remoteStream);
    });
    
    call.on('close', () => {
      removePeerStream(remotePeerId);
    });

    callsRef.current.set(remotePeerId, call);
  };

  const addPeerStream = (id: string, stream: MediaStream) => {
      // We might need to fetch user info from presence state if we want to show names
      // For now we use defaults or update later via presence sync
      setPeers(prev => {
          const newMap = new Map(prev);
          newMap.set(id, {
              id,
              stream,
              user: { id: '?', name: 'User', color: '#999' },
              isMuted: false,
              isVideoOff: false
          });
          peersRef.current = newMap;
          return newMap;
      });
  };

  const removePeerStream = (id: string) => {
    if (callsRef.current.has(id)) {
        callsRef.current.get(id).close();
        callsRef.current.delete(id);
    }
    setPeers(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        peersRef.current = newMap;
        return newMap;
    });
  };

  return {
    myStream,
    peers: Array.from(peers.values()),
    isJoined,
    controls: {
        isMuted,
        toggleAudio,
        isVideoOff,
        toggleVideo,
        leave: () => {
            // Manual leave logic if needed
        }
    }
  };
};
