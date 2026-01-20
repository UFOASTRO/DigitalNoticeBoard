import { useState } from 'react';
import { X, Copy, Check, Share2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Cluster } from '../types';

interface InviteModalProps {
  cluster: Cluster;
  onClose: () => void;
}

export const InviteModal = ({ cluster, onClose }: InviteModalProps) => {
  const [permission, setPermission] = useState<'editor' | 'viewer'>('viewer');
  const [expiry, setExpiry] = useState<string>('24h');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const expiresAt = new Date();
      switch (expiry) {
        case '24h': expiresAt.setHours(expiresAt.getHours() + 24); break;
        case '48h': expiresAt.setHours(expiresAt.getHours() + 48); break;
        case '7d': expiresAt.setDate(expiresAt.getDate() + 7); break;
        default: expiresAt.setHours(expiresAt.getHours() + 24);
      }

      const { data, error } = await supabase
        .from('cluster_invites')
        .insert({
          cluster_id: cluster.id,
          permission_level: permission,
          created_by: cluster.owner_id,
          expires_at: expiresAt.toISOString()
        })
        .select('token')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/invite/${data.token}`;
      setGeneratedLink(link);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      alert('Error generating invite: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
            <Share2 size={18} />
            Share "{cluster.name}"
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!generatedLink ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Permission</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPermission('viewer')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        permission === 'viewer' 
                          ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600' 
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      Viewer
                    </button>
                    <button
                      onClick={() => setPermission('editor')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        permission === 'editor' 
                          ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600' 
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      Editor
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    {permission === 'viewer' 
                      ? 'Can view and send messages only.' 
                      : 'Full access to create and edit pins.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expires In</label>
                  <select 
                    value={expiry} 
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-indigo-500/30 bg-white dark:bg-slate-700 dark:text-white"
                  >
                    <option value="24h">24 Hours</option>
                    <option value="48h">2 Days</option>
                    <option value="7d">7 Days</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Generate Invite Link'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm flex items-start gap-2 border border-green-100 dark:border-green-800">
                <Check size={16} className="mt-0.5 shrink-0" />
                Invite link generated successfully!
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Copy Link</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={generatedLink} 
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 select-all"
                  />
                  <button 
                    onClick={handleCopy}
                    className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={18} className="text-green-600 dark:text-green-400" /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setGeneratedLink(null)}
                className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Generate another link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
