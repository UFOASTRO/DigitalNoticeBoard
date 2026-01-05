import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export const HomePage = () => {
  const navigate = useNavigate();
  const [clusterName, setClusterName] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: email.split('@')[0] } // Simple default name
        }
      });
      if (error) setAuthError(error.message);
      else alert('Check your email for the confirmation link!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setAuthError(error.message);
    }
    setLoading(false);
  };

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clusterName.trim() && user) {
       // Ideally we check if it exists or create it, but for now navigate.
       // The RLS will block creation if we just try to insert without being logged in.
       // We'll navigate to the UUID if we knew it, but here we are typing a name?
       // The prompt schema uses UUIDs for clusters.
       // Typing "engineering-team" won't work if the ID is a UUID.
       // Let's assume for this step we Create a new cluster if it doesn't exist?
       // Or we need a list of My Clusters.
       
       // For MVP alignment with the schema (where ID is UUID):
       // We should probably CREATE a cluster here and redirect to its ID.
       
       const { data, error } = await supabase
         .from('clusters')
         .insert({
           name: clusterName,
           owner_id: user.id
         })
         .select()
         .single();
         
       if (error) {
         console.error(error);
         alert('Error creating cluster (or maybe you just want to join by ID?): ' + error.message);
         // If it failed, maybe they meant to join an existing ID?
         // Let's try navigating directly if it looks like a UUID
         if (clusterName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            navigate(`/app/${clusterName}`);
         }
       } else if (data) {
         navigate(`/app/${data.id}`);
       }
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Notelify</h1>
        
        {!user ? (
          <>
             <p className="text-slate-500 mb-6">{isSignUp ? 'Create an account' : 'Sign in'} to continue.</p>
             <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
              {authError && <p className="text-red-500 text-sm">{authError}</p>}
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-all active:scale-95"
              >
                {isSignUp ? 'Sign Up' : 'Log In'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-slate-600 hover:underline"
              >
                {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
               <p className="text-slate-500">Welcome, {user.email}</p>
               <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
            </div>

            <form onSubmit={handleEnter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Create New Cluster Name or Enter ID</label>
                <input 
                  type="text" 
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                  placeholder="e.g. My Project Board"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-all active:scale-95"
              >
                Create / Join
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
               <p className="text-xs text-slate-400 mb-2">Note: To join an existing board, paste its UUID.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};