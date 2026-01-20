import React, { createContext, useContext } from 'react';
import { useCallLogic } from '../hooks/useCallLogic';
import type { CallParticipant, IncomingCall } from '../hooks/useCallLogic';

interface CallContextType {
    isActive: boolean;
    incomingCall: IncomingCall | null;
    localStream: MediaStream | null;
    peers: CallParticipant[];
    error: string | null;
    isMuted: boolean;
    isVideoOff: boolean;
    
    startCall: (clusterId: string) => Promise<void>;
    joinCall: (clusterId: string, callId: string) => Promise<void>;
    declineCall: () => void;
    endCall: () => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error('useCall must be used within a CallProvider');
    return context;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const callLogic = useCallLogic();

    return (
        <CallContext.Provider value={callLogic}>
            {children}
        </CallContext.Provider>
    );
};