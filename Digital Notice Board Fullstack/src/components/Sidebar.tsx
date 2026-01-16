import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useCluster } from '../hooks/useCluster';
import { useMessages } from '../hooks/useMessages';
import { X, MessageSquare, Trash2, Send, Share2, LayoutGrid, Image as ImageIcon, Loader2 } from 'lucide-react';
import { InviteModal } from './InviteModal';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const MessageList = ({ pinId }: { pinId: string | null }) => {
  const { messages, loading, sendMessage, scrollRef } = useMessages(pinId);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
        if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
        await sendMessage(input);
        setInput('');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `${pinId || 'general'}/${fileName}`;

    setIsUploading(true);
    try {
        // 1. Upload
        const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file);

        if (uploadError) {
             alert('Upload failed: ' + uploadError.message);
             console.error(uploadError);
             return;
        }

        // 2. Get URL
        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);

        // 3. Send Message
        await sendMessage('', publicUrl);
    } catch (err) {
        console.error('Upload error:', err);
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Image Viewer Overlay */}
      <AnimatePresence>
        {selectedImage && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={() => setSelectedImage(null)}
            >
                <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
                <motion.img 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    src={selectedImage} 
                    alt="Full size" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()} 
                />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {loading && messages.length === 0 && <p className="text-center text-xs text-slate-400">Loading messages...</p>}
        
        {messages.length === 0 && !loading && (
             <div className="text-center mt-10 opacity-50">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <MessageSquare size={20} />
                </div>
                <p className="text-sm text-slate-500 font-medium">No messages yet</p>
                <p className="text-xs text-slate-400">Start the conversation!</p>
             </div>
        )}

        {messages.map((msg: any) => {
            const isMe = currentUserId === msg.user_id;
            return (
                <div key={msg.id} className={clsx("flex flex-col gap-1 max-w-[85%]", isMe ? "self-end items-end" : "self-start items-start")}>
                    {!isMe && (
                        <span className="text-[10px] font-bold text-slate-500 ml-1">
                            {msg.profiles?.full_name || msg.profiles?.email?.split('@')[0] || 'Unknown'}
                        </span>
                    )}
                    
                    <div 
                        className={clsx(
                            "p-3 rounded-2xl text-sm shadow-sm border",
                            isMe 
                                ? "bg-slate-900 text-white border-slate-900 rounded-tr-sm" 
                                : "bg-white text-slate-700 border-slate-200 rounded-tl-sm"
                        )}
                    >
                        {msg.image_url && (
                            <div 
                                className="mb-2 rounded-lg overflow-hidden max-w-[200px] max-h-[160px] border border-black/10 cursor-zoom-in group"
                                onClick={() => setSelectedImage(msg.image_url)}
                            >
                                <img 
                                    src={msg.image_url} 
                                    alt="Attachment" 
                                    className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-300" 
                                    loading="lazy" 
                                />
                            </div>
                        )}
                        {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                    </div>
                    
                    <span className="text-[10px] text-slate-300 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-3 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
            />
            
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                title="Upload Image"
            >
                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
            </button>

            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={pinId ? "Reply to thread..." : "Type a message..."}
                className="flex-1 pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm"
            />
            
            <button 
                type="submit"
                disabled={!input.trim() && !isUploading}
                className="absolute right-2 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-slate-900/20"
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
  const [pinTitle, setPinTitle] = useState<string | null>(null);

  useEffect(() => {
    if (activePinId) {
        // Fetch pin title
        supabase
            .from('pins')
            .select('content')
            .eq('id', activePinId)
            .single()
            .then(({ data }) => {
                if (data && data.content) {
                    setPinTitle((data.content as any).title || 'Untitled Note');
                }
            });
    } else {
        setPinTitle(null);
    }
  }, [activePinId]);

  const handleClose = () => {
    setActivePin(null);
  };

  if (!activePinId) {
    return (
      <div className="flex flex-col h-full bg-slate-50/50 relative border-l border-slate-200">
        <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors" title="Back to Dashboard">
                <LayoutGrid size={18} />
            </button>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {cluster?.name || 'General Chat'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                    {cluster?.is_public ? 'Public Board' : 'Private Board'}
                </span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        {isOwner && (
            <div className="px-4 py-2 bg-white border-b border-slate-50 flex justify-between items-center gap-2">
              <button 
                onClick={() => setShowInviteModal(true)}
                className="flex-1 text-xs text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 font-medium px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <Share2 size={12} />
                Share
              </button>

              <button 
                onClick={deleteCluster}
                className="text-xs text-red-600 hover:text-red-700 flex items-center justify-center gap-1.5 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={12} />
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
    <div className="flex flex-col h-full bg-white relative border-l border-slate-200 shadow-xl">
      <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-2 text-slate-800 font-medium text-sm overflow-hidden">
             <MessageSquare size={16} className="text-blue-500 flex-shrink-0"/>
             <span className="truncate" title={pinTitle || 'Thread'}>{pinTitle || 'Thread'}</span>
        </div>
        <button onClick={handleClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
          <X size={18} />
        </button>
      </div>

      <MessageList pinId={activePinId} />
    </div>
  );
};
