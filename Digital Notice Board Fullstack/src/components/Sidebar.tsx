import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useCluster } from '../hooks/useCluster';
import { useMessages } from '../hooks/useMessages';
import { X, MessageSquare, StickyNote, Trash2, Send, Share2, LayoutGrid } from 'lucide-react';
import { InviteModal } from './InviteModal';

const MessageList = ({ pinId }: { pinId: string | null }) => {
  const { messages, loading, sendMessage, scrollRef } = useMessages(pinId);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
        sendMessage(input);
        setInput('');
    }
  };

  return (
    <>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading && messages.length === 0 && <p className="text-center text-xs text-slate-400">Loading messages...</p>}
        
        {messages.length === 0 && !loading && (
             <div className="text-center mt-10 opacity-50">
                <p className="text-sm text-slate-400">No messages yet.</p>
                <p className="text-xs text-slate-300">Start the conversation!</p>
             </div>
        )}

        {messages.map((msg: any) => (
            <div key={msg.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-700">
                        {msg.profiles?.full_name || msg.profiles?.email?.split('@')[0] || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 text-sm text-slate-600 shadow-sm">
                    {msg.content}
                </div>
            </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="relative">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={pinId ? "Reply to thread..." : "Type a message..."}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm"
            />
            <button 
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <Send size={14} />
            </button>
        </form>
      </div>
    </>
  );
};

export const Sidebar = () => {
  const navigate = useNavigate();
  const { activePinId, setActivePin, toggleSidebar } = useStore();
  const { isOwner, deleteCluster, cluster } = useCluster();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleClose = () => {
    setActivePin(null);
  };

  if (!activePinId) {
    return (
      <div className="flex flex-col h-full bg-slate-50/50 relative">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/dashboard')} className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Back to Dashboard">
                <LayoutGrid size={20} />
            </button>
            <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <MessageSquare size={20} />
                <span className="truncate max-w-[150px]">{cluster?.name || 'General Chat'}</span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        
        {isOwner && (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <button 
                onClick={() => setShowInviteModal(true)}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium px-2 py-1 hover:bg-slate-200 rounded transition-colors"
              >
                <Share2 size={12} />
                Share Board
              </button>

              <button 
                onClick={deleteCluster}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium px-2 py-1 hover:bg-red-100 rounded transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
        )}

        {showInviteModal && cluster && (
            <InviteModal cluster={cluster} onClose={() => setShowInviteModal(false)} />
        )}

        <MessageList pinId={null} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-yellow-50/30">
      <div className="p-4 border-b border-yellow-100 flex items-center justify-between bg-yellow-50/80 backdrop-blur-sm">
        <button onClick={handleClose} className="p-1 hover:bg-yellow-100/50 rounded text-yellow-700 transition-colors">
          <X size={16} />
        </button>
      </div>

      <MessageList pinId={activePinId} />
    </div>
  );
};

