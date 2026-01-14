import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { InteractiveDemo } from '../components/landing/InteractiveDemo';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded-lg"></div>
              <span className="text-xl font-bold tracking-tight">Notelify</span>
            </div>
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all active:scale-95"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            v2.0 Now Available
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight leading-tight"
          >
            Organize your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">digital chaos.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            A limitless workspace for visual thinkers. Map out ideas, connect the dots, and collaborate with your team in real-time.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Start Brainstorming
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "#f8fafc" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white text-slate-700 border border-slate-200 text-lg font-semibold rounded-full"
            >
              Learn more
            </motion.button>
          </motion.div>
        </div>

        {/* Interactive Demo */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95, y: 40 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ delay: 0.6, duration: 0.8 }}
           className="mt-20 relative mx-auto max-w-5xl"
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-violet-500 opacity-20 blur-3xl rounded-full transform scale-75 animate-pulse"></div>
          
          {/* The Interactive Component */}
          <InteractiveDemo />
        </motion.div>
      </section>

      {/* Simplified Features Section */}
      <section id="features" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 lg:gap-24">
            <FeatureColumn 
              delay={0.2}
              title="Infinite Canvas"
              description="Break free from the boundaries of a document. Pan, zoom, and expand your workspace as your ideas grow. There are no edges here."
            />
            <FeatureColumn 
              delay={0.4}
              title="Real-time Sync"
              description="See your team's cursors fly across the screen. Edits happen instantly for everyone, making remote brainstorming feel like you're in the same room."
            />
            <FeatureColumn 
              delay={0.6}
              title="Cluster Organization"
              description="Keep related ideas together. Group notes, images, and drawings into Clusters to maintain context without losing the big picture."
            />
          </div>
        </div>
      </section>

      {/* Minimal CTA */}
      <section className="py-24 px-4 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            Ready to get started?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 mb-10 text-lg"
          >
            Join the workspace that adapts to how you think.
          </motion.p>
          <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => navigate('/login')}
             className="px-10 py-4 bg-white text-slate-900 text-lg font-bold rounded-full hover:bg-indigo-50 transition-colors"
          >
            Create Your Board
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-5 h-5 bg-slate-900 rounded-md"></div>
             <span className="font-bold text-slate-900">Notelify</span>
          </div>
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Notelify Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
             <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">Twitter</a>
             <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">GitHub</a>
             <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureColumn = ({ title, description, delay }: { title: string, description: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="space-y-4"
  >
    <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
    <p className="text-slate-600 leading-relaxed">
      {description}
    </p>
  </motion.div>
);