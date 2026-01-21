import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Peer from 'peerjs';
import { useStore } from '../store/useStore';

export interface CallParticipant {
    peerId: string;
    user: {
        id: string;
        name: string;
        color: string;
    };
    stream?: MediaStream;
    isMuted: boolean;
    isVideoOff: boolean;
}

export interface IncomingCall {
    id: string;
    clusterId: string;
    hostId: string;
    timestamp: number;
}

export const useCallLogic = () => {
    // Global Store interaction for UI state if needed
    const { startCall: setStoreCallActive, endCall: setStoreCallInactive } = useStore();

    // State
    const [isActive, setIsActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<CallParticipant[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Refs
    const peerRef = useRef<Peer | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const callsRef = useRef<Map<string, any>>(new Map());
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const currentCallIdRef = useRef<string | null>(null);
    const heartbeatIntervalRef = useRef<any>(null);
    const ringingSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const isHostRef = useRef<boolean>(false);

    // ----------------------------------------------------------------
    // 1. Ringing Mechanism (Global Listener)
    // ----------------------------------------------------------------
    useEffect(() => {
        const setupRingingListener = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Subscribe to 'calls' table INSERTs
            ringingSubscriptionRef.current = supabase
                .channel('global_calls_listener')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'calls' },
                    (payload) => {
                        const newCall = payload.new;
                        // Ignore our own calls
                        if (newCall.host_id === user.id) return;
                        
                        // Only notify for active calls
                        if (newCall.status === 'active') {
                            setIncomingCall({
                                id: newCall.id,
                                clusterId: newCall.cluster_id,
                                hostId: newCall.host_id,
                                timestamp: Date.now()
                            });
                        }
                    }
                )
                .subscribe();
        };

        setupRingingListener();

        return () => {
            if (ringingSubscriptionRef.current) {
                supabase.removeChannel(ringingSubscriptionRef.current);
            }
        };
    }, []);

    // ----------------------------------------------------------------
    // 2. Media Management (Strict Privacy)
    // ----------------------------------------------------------------
    const initializeMedia = useCallback(async () => {
        try {
            console.log("Requesting media permissions...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            streamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (err: any) {
            console.error("Media Access Error:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Camera/Microphone permission denied.");
            } else if (err.name === 'NotFoundError') {
                setError("No camera or microphone found.");
            } else {
                setError("Failed to access media devices.");
            }
            throw err;
        }
    }, []);

    // ----------------------------------------------------------------
    // 3. Peer & Signaling Logic
    // ----------------------------------------------------------------
    const initializePeer = useCallback(async (stream: MediaStream, clusterId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Initialize PeerJS with STUN servers for better connectivity
        const peer = new Peer(undefined as any, {
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            }
        });

        peer.on('open', (myPeerId) => {
            console.log("My Peer ID:", myPeerId);
            peerRef.current = peer;
            joinSignalingChannel(clusterId, myPeerId, user);
        });

        peer.on('call', (call) => {
            console.log("Incoming WebRTC call from:", call.peer);
            call.answer(streamRef.current || stream);
            setupCallEvents(call);
        });

        peer.on('error', (err) => {
            console.error("PeerJS Error:", err);
            if (err.type === 'peer-unavailable') {
                // Peer disconnected
            }
        });
    }, []);

    const joinSignalingChannel = (clusterId: string, myPeerId: string, user: any) => {
        const channel = supabase.channel(`call:${clusterId}`);
        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                handlePresenceSync(state, myPeerId);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                // When a new user joins, if I am the "older" (lexicographically larger ID) peer, I call them.
                newPresences.forEach((p: any) => {
                     if (p.peerId !== myPeerId && !callsRef.current.has(p.peerId)) {
                         if (myPeerId > p.peerId) {
                             console.log(`[Join] I (${myPeerId}) am calling new peer (${p.peerId})`);
                             connectToPeer(p.peerId);
                         } else {
                             console.log(`[Join] I (${myPeerId}) am waiting for call from (${p.peerId})`);
                         }
                     }
                });
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                leftPresences.forEach((p: any) => {
                    removePeer(p.peerId);
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        peerId: myPeerId,
                        user: {
                            id: user.id,
                            name: user.email?.split('@')[0] || 'User',
                            color: '#3B82F6'
                        },
                        mic: !isMuted,
                        camera: !isVideoOff
                    });
                }
            });
    };

    const handlePresenceSync = (state: any, myPeerId: string) => {
        const allPresences = Object.values(state).flat() as any[];
        
        // 1. Update existing peers metadata
        setPeers(prev => {
            const newPeers = [...prev];
            let changed = false;
            
            allPresences.forEach(p => {
                if (p.peerId === myPeerId) return;
                
                const existingIdx = newPeers.findIndex(peer => peer.peerId === p.peerId);
                if (existingIdx >= 0) {
                    const current = newPeers[existingIdx];
                    if (current.isMuted !== !p.mic || current.isVideoOff !== !p.camera) {
                        newPeers[existingIdx] = {
                            ...current,
                            user: p.user,
                            isMuted: !p.mic,
                            isVideoOff: !p.camera
                        };
                        changed = true;
                    }
                }
            });
            return changed ? newPeers : prev;
        });

        // 2. Connect to peers we don't have a call with yet
        allPresences.forEach(p => {
            if (p.peerId !== myPeerId && !callsRef.current.has(p.peerId)) {
                if (myPeerId > p.peerId) {
                    console.log(`[Sync] I (${myPeerId}) am calling peer (${p.peerId})`);
                    connectToPeer(p.peerId);
                }
            }
        });
    };

    const connectToPeer = (remotePeerId: string) => {
        if (!peerRef.current || callsRef.current.has(remotePeerId)) return;
        const currentStream = streamRef.current;
        if (!currentStream) {
            console.warn("No local stream available to call peer:", remotePeerId);
            return;
        }

        console.log("Initiating call to:", remotePeerId);
        try {
            const call = peerRef.current.call(remotePeerId, currentStream);
            setupCallEvents(call);
        } catch (e) {
            console.error("Failed to call peer:", e);
        }
    };

    const setupCallEvents = (call: any) => {
        call.on('stream', (remoteStream: MediaStream) => {
            addPeer(call.peer, remoteStream);
        });
        call.on('close', () => {
            removePeer(call.peer);
        });
        call.on('error', (e: any) => {
            console.error("MediaConnection Error:", e);
            removePeer(call.peer);
        });
        callsRef.current.set(call.peer, call);
    };

    const addPeer = (peerId: string, stream: MediaStream) => {
        setPeers(prev => {
            if (prev.some(p => p.peerId === peerId)) return prev;
            return [...prev, {
                peerId,
                stream,
                user: { id: '?', name: 'Connecting...', color: '#999' }, 
                isMuted: false,
                isVideoOff: false
            }];
        });
    };

    const removePeer = (peerId: string) => {
        if (callsRef.current.has(peerId)) {
            try {
                callsRef.current.get(peerId).close();
            } catch (e) { /* ignore */ }
            callsRef.current.delete(peerId);
        }
        setPeers(prev => prev.filter(p => p.peerId !== peerId));
    };

    // ----------------------------------------------------------------
    // 4. Actions (Start, Join, End, Toggle)
    // ----------------------------------------------------------------
    const startHeartbeat = (callId: string) => {
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        
        // Define the ping function
        const ping = async () => {
             try {
                 const { data: { user }, error: authError } = await supabase.auth.getUser();
                 if (authError || !user) return;

                 if (isHostRef.current) {
                     // Host updates the main call row
                     await supabase
                        .from('calls')
                        .update({ updated_at: new Date().toISOString() })
                        .eq('id', callId);
                 } else {
                     // Participants update their own row in call_participants
                     await supabase
                        .from('call_participants')
                        .update({ last_ping: new Date().toISOString() })
                        .eq('call_id', callId)
                        .eq('user_id', user.id);
                 }
             } catch (err) {
                 // Suppress network errors during heartbeat to avoid console spam/crash
                 console.warn("Heartbeat ping failed:", err);
             }
        };

        // Initial ping
        ping();
        
        // Interval
        heartbeatIntervalRef.current = setInterval(ping, 30000); // 30s
    };

    const startCall = async (clusterId: string) => {
        try {
            setError(null);
            
            // 1. Check for existing active call first to prevent duplicates
            const { data: existingCall } = await supabase
                .from('calls')
                .select('id')
                .eq('cluster_id', clusterId)
                .eq('status', 'active')
                .maybeSingle();

            if (existingCall) {
                console.log("Found existing active call, joining instead of creating...");
                return joinCall(clusterId, existingCall.id);
            }

            const stream = await initializeMedia();
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication required");

            // 2. Create Call Entry
            const { data, error } = await supabase
                .from('calls')
                .insert({
                    cluster_id: clusterId,
                    host_id: user.id,
                    status: 'active',
                    type: 'video'
                })
                .select()
                .single();

            if (error) throw error;

            currentCallIdRef.current = data.id;
            isHostRef.current = true; // I am the host
            
            // Also add self to participants
            await supabase.from('call_participants').upsert({
                call_id: data.id,
                user_id: user.id,
                status: 'connected',
                joined_at: new Date().toISOString()
            }, { onConflict: 'call_id,user_id' });

            startHeartbeat(data.id);
            await initializePeer(stream, clusterId);
            
            setIsActive(true);
            setStoreCallActive();

        } catch (e: any) {
            console.error("Start Call Failed:", e);
            setError(e.message);
            cleanup();
        }
    };

    const joinCall = async (clusterId: string, callId: string) => {
        try {
            setError(null);
            setIncomingCall(null); // Clear ringing
            const stream = await initializeMedia();
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication required");

            currentCallIdRef.current = callId;
            isHostRef.current = false; // I am a guest

            // Add to participants
            const { error } = await supabase.from('call_participants').upsert({
                call_id: callId,
                user_id: user.id,
                status: 'connected',
                joined_at: new Date().toISOString()
            }, { onConflict: 'call_id,user_id' });
            
            if (error) console.error("Error joining participant table:", error);

            startHeartbeat(callId);
            await initializePeer(stream, clusterId);
            
            setIsActive(true);
            setStoreCallActive();

        } catch (e: any) {
            console.error("Join Call Failed:", e);
            setError(e.message);
            cleanup();
        }
    };

    const declineCall = () => {
        setIncomingCall(null);
    };

    const cleanup = useCallback(async () => {
        // Stop Local Stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
        }

        // Destroy Peer
        if (peerRef.current) {
            peerRef.current.destroy();
        }

        // Leave Supabase Channel
        if (channelRef.current) {
            await supabase.removeChannel(channelRef.current);
        }

        // Close all peer connections
        callsRef.current.forEach(call => call.close());
        callsRef.current.clear();

        const callId = currentCallIdRef.current;
        const isHost = isHostRef.current;

        // DB Cleanup
        if (callId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (isHost) {
                     // Host ends the call
                     await supabase
                        .from('calls')
                        .update({ status: 'ended' })
                        .eq('id', callId)
                        .eq('host_id', user.id); 
                } else {
                    // Participant leaves
                    await supabase
                        .from('call_participants')
                        .delete()
                        .eq('call_id', callId)
                        .eq('user_id', user.id);
                }
            }
        }

        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

        // Reset State
        setLocalStream(null);
        setPeers([]);
        setIsActive(false);
        setIsMuted(false);
        setIsVideoOff(false);
        setStoreCallInactive();
        
        peerRef.current = null;
        streamRef.current = null;
        channelRef.current = null;
        currentCallIdRef.current = null;
        isHostRef.current = false;
    }, [setStoreCallInactive]);

    const endCall = () => {
        cleanup();
    };

    // Cleanup on unmount to prevent race conditions
    useEffect(() => {
      return () => {
        cleanup();
      };
    }, [cleanup]);

    const toggleAudio = () => {
        if (streamRef.current) {
            const newState = !isMuted;
            streamRef.current.getAudioTracks().forEach(track => track.enabled = !newState);
            setIsMuted(newState);
            updatePresence(newState, isVideoOff);
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            const newState = !isVideoOff;
            streamRef.current.getVideoTracks().forEach(track => track.enabled = !newState);
            setIsVideoOff(newState);
            updatePresence(isMuted, newState);
        }
    };

    const updatePresence = async (muted: boolean, videoOff: boolean) => {
        if (channelRef.current && peerRef.current) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            await channelRef.current.track({
                peerId: peerRef.current.id,
                user: {
                    id: user.id,
                    name: user.email?.split('@')[0] || 'User',
                    color: '#3B82F6'
                },
                mic: !muted,
                camera: !videoOff
            });
        }
    };

    return {
        isActive,
        incomingCall,
        localStream,
        peers,
        error,
        isMuted,
        isVideoOff,
        startCall,
        joinCall,
        declineCall,
        endCall,
        toggleAudio,
        toggleVideo
    };
};
