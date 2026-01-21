import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCall } from '../context/CallContext';

interface ActiveCallIndicatorProps {
    clusterId: string;
}

export const ActiveCallIndicator: React.FC<ActiveCallIndicatorProps> = ({ clusterId }) => {
    const { isActive, joinCall } = useCall();
    const [activeCallId, setActiveCallId] = useState<string | null>(null);

    // Check for existing active call in this cluster
    useEffect(() => {
        if (!clusterId) return;
        
        // Simple UUID regex check
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(clusterId)) return;

        const checkActiveCall = async () => {
            const { data, error } = await supabase
                .from('calls')
                .select('id, status')
                .eq('cluster_id', clusterId)
                .eq('status', 'active')
                .order('started_at', { ascending: false })
                .limit(1)
                .single();

            if (data && !error) {
                setActiveCallId(data.id);
                // Optional: Fetch participant count
                // const { count } = await supabase.from('call_participants').select('*', { count: 'exact' }).eq('call_id', data.id);
                // setParticipantCount(count || 0);
            } else {
                setActiveCallId(null);
            }
        };

        checkActiveCall();

        // Subscribe to changes
        const channel = supabase
            .channel(`calls:${clusterId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'calls', filter: `cluster_id=eq.${clusterId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
                        setActiveCallId(payload.new.id);
                    } else if (payload.eventType === 'UPDATE') {
                        if (payload.new.status === 'ended') {
                             // If the currently tracked call ended
                             if (payload.new.id === activeCallId) setActiveCallId(null);
                        } else if (payload.new.status === 'active') {
                             setActiveCallId(payload.new.id);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clusterId, activeCallId]);

    // If I am already in a call, and it is THIS call, don't show the indicator (I'm in it).
    // Note: isActive is global. If I'm in *another* call, we might still show this? 
    // For simplicity, if I am active, I don't see the "Join" prompt for the *same* cluster.
    if (isActive) return null; 
    if (!activeCallId) return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
            <button 
                onClick={() => joinCall(clusterId, activeCallId)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg transition-transform hover:scale-105 font-medium border border-green-400/20"
            >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                Join Active Call
            </button>
        </div>
    );
};
