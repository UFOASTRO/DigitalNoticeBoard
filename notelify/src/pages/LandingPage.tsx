import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { InteractiveDemo } from '../components/landing/InteractiveDemo';
import { 
  Zap, 
  Users, 
  Share2, 
  Layout, 
  MessageSquare, 
  Shield, 
  Star,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden relative">
      {/* Modern Grid Background */}
      <div className="grid-wrapper">
        <div className="grid-background"></div>
      </div>

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
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
              <span className="text-xl font-bold tracking-tight">Notelify</span>
            </div>
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-900/10"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            v1.0 Now Available
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
              className="px-8 py-4 bg-white text-slate-700 border border-slate-200 text-lg font-semibold rounded-full shadow-sm"
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

      {/* Modern Grid Features Section */}
      <section id="features" className="py-24 bg-white/50 backdrop-blur-sm border-y border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to build</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Powerful features designed for modern teams who need to move fast and break things (visually).</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             <GridFeature 
               icon={<Layout className="w-6 h-6 text-white" />}
               color="bg-indigo-500"
               title="Infinite Canvas"
               desc="Never run out of space. Pan and zoom infinitely."
             />
             <GridFeature 
               icon={<Zap className="w-6 h-6 text-white" />}
               color="bg-amber-500"
               title="Real-time Sync"
               desc="Changes reflect instantly across all connected devices."
             />
             <GridFeature 
               icon={<Users className="w-6 h-6 text-white" />}
               color="bg-emerald-500"
               title="Multiplayer"
               desc="See cursors and collaborate with up to 50 people."
             />
             <GridFeature 
               icon={<Share2 className="w-6 h-6 text-white" />}
               color="bg-blue-500"
               title="Easy Sharing"
               desc="Share your board with a simple public link."
             />
             <GridFeature 
               icon={<MessageSquare className="w-6 h-6 text-white" />}
               color="bg-pink-500"
               title="Comments"
               desc="Leave feedback directly on notes and clusters."
             />
             <GridFeature 
               icon={<Shield className="w-6 h-6 text-white" />}
               color="bg-slate-800"
               title="Secure"
               desc="Enterprise-grade security for your data."
             />
          </div>
        </div>
      </section>

      {/* User Reviews Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-slate-900 mb-4">Loved by thinkers</h2>
             <p className="text-slate-500">Join thousands of teams utilizing Notelify.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <ReviewCard 
               name="Sarah Jenkins"
               role="Product Designer"
               content="Finally, a whiteboard tool that doesn't feel clunky. It's fast, beautiful, and just works."
               stars={5}
            />
            <ReviewCard 
               name="David Chen"
               role="Engineering Lead"
               content="The real-time collaboration is seamless. We use it for every sprint planning session now."
               stars={5}
            />
            <ReviewCard 
               name="Elena Rodriguez"
               role="Startup Founder"
               content="Notelify helped us map out our entire MVP in one afternoon. Absolute game changer."
               stars={5}
            />
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-24 bg-white border-y border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-end mb-12">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Meet the builders</h2>
                <p className="text-slate-500">
                  We are a small team of passionate developers and designers building the tools we always wanted to use.
                </p>
              </div>
              <button className="hidden md:block text-indigo-600 font-semibold hover:text-indigo-700">View Careers &rarr;</button>
           </div>

           <div className="grid md:grid-cols-4 gap-8">
              <TeamMember name="Alex Rivers" role="Founder & CEO" color="bg-indigo-100" />
              <TeamMember name="Sam Lee" role="CTO" color="bg-blue-100" />
              <TeamMember name="Jordan Smith" role="Head of Design" color="bg-pink-100" />
              <TeamMember name="Casey West" role="Lead Engineer" color="bg-emerald-100" />
           </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 max-w-3xl mx-auto px-4 relative z-10">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
           <FaqItem 
             question="Is Notelify free to use?"
             answer="Yes! We offer a generous free tier that includes unlimited personal boards. You only pay for advanced team features."
           />
           <FaqItem 
             question="Can I export my boards?"
             answer="Absolutely. You can export your boards as PDF, PNG, or JSON data at any time."
           />
           <FaqItem 
             question="How secure is my data?"
             answer="We use industry-standard encryption for data in transit and at rest. Your ideas are safe with us."
           />
           <FaqItem 
             question="Does it work on tablet?"
             answer="Notelify is fully responsive and works great on iPads and Android tablets with full touch support."
           />
        </div>
      </section>

      {/* Minimal CTA */}
      <section className="py-24 px-4 bg-slate-900 text-white text-center relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-3xl mx-auto relative">
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
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-6 h-6 bg-slate-900 rounded-md"></div>
                 <span className="font-bold text-slate-900 text-lg">Notelify</span>
               </div>
               <p className="text-slate-500 text-sm leading-relaxed">
                 The digital whiteboard platform designed for remote teams to ideate, brainstorm, and plan together.
               </p>
            </div>
            
            <div>
               <h4 className="font-bold text-slate-900 mb-4">Product</h4>
               <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-indigo-600">Features</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Integrations</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Pricing</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Changelog</a></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
               <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-indigo-600">Documentation</a></li>
                  <li><a href="#" className="hover:text-indigo-600">API Reference</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Community</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Help Center</a></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-slate-900 mb-4">Company</h4>
               <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-indigo-600">About</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Careers</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Legal</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Contact</a></li>
               </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
             <div>© {new Date().getFullYear()} Notelify Inc. All rights reserved.</div>
             <div className="flex gap-6">
                <a href="#" className="hover:text-slate-600 transition-colors">Twitter</a>
                <a href="#" className="hover:text-slate-600 transition-colors">GitHub</a>
                <a href="#" className="hover:text-slate-600 transition-colors">Discord</a>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Subcomponents ---

const GridFeature = ({ icon, title, desc, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
  >
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10`}>
      {icon}
    </div>
    <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

const ReviewCard = ({ name, role, content, stars }: any) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
    <div className="flex gap-1 mb-4">
      {[...Array(stars)].map((_, i) => (
        <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
    <p className="text-slate-700 italic mb-6">"{content}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
         {name.split(' ').map((n:string) => n[0]).join('')}
      </div>
      <div>
         <div className="font-bold text-slate-900 text-sm">{name}</div>
         <div className="text-slate-400 text-xs">{role}</div>
      </div>
    </div>
  </div>
);

const TeamMember = ({ name, role, color }: any) => (
  <div className="text-center group">
    <div className={`w-32 h-32 ${color} rounded-full mx-auto mb-4 overflow-hidden relative group-hover:scale-105 transition-transform duration-300`}>
       {/* Placeholder avatar */}
       <div className="absolute inset-0 flex items-center justify-center text-slate-400 opacity-50 font-bold text-2xl">
          {name[0]}
       </div>
    </div>
    <h3 className="font-bold text-slate-900">{name}</h3>
    <p className="text-slate-500 text-sm">{role}</p>
  </div>
);

const FaqItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
      >
        {question}
        <ChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40' : 'max-h-0'}`}>
         <div className="p-4 pt-0 text-slate-500 text-sm leading-relaxed border-t border-slate-50">
           {answer}
         </div>
      </div>
    </div>
  );
};