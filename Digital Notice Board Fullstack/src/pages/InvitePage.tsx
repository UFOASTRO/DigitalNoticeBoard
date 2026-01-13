import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, LogIn } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Verify token
    const verifyToken = async () => {
      if (!token) return;
      try {
        const { data, error } = await supabase.rpc('verify_invite_token', { invite_token: token });
        
        if (error) throw error;
        
        if (!data.valid) {
          setError(data.error || 'Invalid invite');
        } else {
          setInviteInfo(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();

    return () => subscription.unsubscribe();
  }, [token]);

  const handleJoin = async () => {
    if (!user) {
      // Redirect to login with return URL
      navigate(`/?returnTo=/invite/${token}`);
      return;
    }

    setJoining(true);
    try {
      const { data, error } = await supabase.rpc('accept_invite', { invite_token: token });
      
      if (error) throw error;
      
      if (data.success) {
        navigate(`/app/${data.cluster_id}`);
      }
    } catch (err: any) {
        // If error is "already a member" (constraint violation), we might just redirect
        if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
            // Check if we can just navigate
            if (inviteInfo?.cluster_id) {
                 navigate(`/app/${inviteInfo.cluster_id}`);
                 return;
            }
        }
      alert('Failed to join: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Invite Invalid</h2>
          <p className="text-slate-500">{error}</p>
          <button onClick={() => navigate('/')} className="text-slate-900 font-medium hover:underline">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6 relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg rotate-3">
          <CheckCircle2 size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">You've been invited!</h2>
          <p className="text-slate-500">
            To join the board <span className="font-semibold text-slate-900">"{inviteInfo?.cluster_name}"</span>
          </p>
          {inviteInfo?.cluster_description && (
            <p className="text-sm text-slate-600 px-4 italic">
              "{inviteInfo.cluster_description}"
            </p>
          )}
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-2">
            <div className="flex justify-between">
                <span className="text-slate-500">Access Level</span>
                <span className="font-medium capitalize text-slate-900">{inviteInfo?.role}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-slate-500">Expires</span>
                <span className="font-medium text-slate-900">
                    {new Date(inviteInfo?.expires_at).toLocaleDateString()}
                </span>
            </div>
        </div>

        <button 
          onClick={handleJoin}
          disabled={joining}
          className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 group"
        >
          {joining ? (
            <Loader2 className="animate-spin" />
          ) : user ? (
            <>Join Board <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
          ) : (
            <>Log in to Join <LogIn size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
};
