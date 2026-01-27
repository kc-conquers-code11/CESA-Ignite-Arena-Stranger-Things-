import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient'; 
import { Lock, LogOut, User } from 'lucide-react';
import StrangerHero from './StrangerHero'; 
import { RulesPage } from './competition/RulesPage';

// --- SUB-COMPONENTS ---
const LockedRules = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 border border-zinc-800 bg-zinc-900/50 rounded-2xl p-8 backdrop-blur-sm">
            <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                <Lock className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-st font-bold text-white tracking-wide">RESTRICTED ACCESS</h3>
                <p className="text-zinc-400 max-w-md mx-auto">
                    The competition protocols are classified. You must identify yourself to access the Upside Down rules.
                </p>
            </div>
            <button onClick={() => navigate('/login')} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg tracking-wider transition-all shadow-lg hover:shadow-red-900/50">
                LOGIN TO UNLOCK
            </button>
        </div>
    );
};

const AboutContent = () => (
  <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-4xl font-st text-red-600 mb-6">About CESA CSI</h2>
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl backdrop-blur-md">
        <p className="text-gray-300 text-lg leading-relaxed mb-4">We are the CESA & CSI chapter. We organize events that push the boundaries of technology.</p>
    </div>
  </div>
);

const HelpContent = () => (
  <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-4xl font-st text-red-600 mb-6">Need Help?</h2>
    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl backdrop-blur-md">
        <p className="text-gray-300 text-lg mb-4">Contact the nearest invigilator.</p>
    </div>
  </div>
);

// --- MAIN PAGE ---
const HomePage = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'about' | 'help'>('rules');
  const [session, setSession] = useState<any>(null);
  const [showIntro, setShowIntro] = useState(false); // Start false to prevent flash
  const [loading, setLoading] = useState(true); // Start true to show nothing while checking
  const navigate = useNavigate();
  
  const ADMIN_EMAILS = ["admin1@strangertech.in", "kc@strangertech.in"];

  //  HELPER: Force Full Screen (F11 Mode)
  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log("Fullscreen request denied or not interaction-based:", err);
      });
    }
  };

  //  HELPER: Handle Transition from Intro to Main Site
  const handleIntroFinish = () => {
    // 1. Force Scroll to Top (Fixes "scrolled to anim" issue)
    window.scrollTo(0, 0);
    
    // 2. Try to Enter Full Screen
    enterFullScreen();
    
    // 3. Hide Intro (Unmount StrangerHero)
    setShowIntro(false);
  };

  useEffect(() => {
    // 1. Initial Session Check
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
            // Logged in: NO Intro, check Admin
            setShowIntro(false);
            if (session.user.email && ADMIN_EMAILS.includes(session.user.email)) {
                navigate('/admin');
            }
        } else {
            // Not Logged in: SHOW Intro
            setShowIntro(true);
        }
        setLoading(false); // Ready to render
    };

    checkUser();
    
    // 2. Realtime Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          setShowIntro(false);
          if (session.user.email && ADMIN_EMAILS.includes(session.user.email)) {
              navigate('/admin');
          }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowIntro(true); // Logout hone pe wapas animation dikha sakte ho
    navigate('/login');
  };

  // Prevent flash of content or animation while checking auth
  if (loading) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      
      {/* CONDITIONAL RENDER: Intro OR Content */}
      {showIntro ? (
          //  Pass the Robust Handler here
          <StrangerHero onComplete={handleIntroFinish} />
      ) : (
          <div className="min-h-screen bg-black text-white pb-20 animate-in fade-in duration-1000">
            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-red-900/30 px-6 py-4">
                <div className="container mx-auto flex flex-wrap justify-between items-center">
                <div className="text-2xl font-st font-black text-red-600 tracking-wider">Stranger Tech</div>
                <ul className="flex items-center space-x-2 md:space-x-6 text-sm font-medium">
                    {['rules', 'about', 'help'].map((tab) => (
                    <li key={tab}>
                        <button onClick={() => setActiveTab(tab as any)} className={`px-3 py-2 rounded-md transition-all capitalize ${activeTab === tab ? 'text-red-500 bg-red-950/30 border border-red-900/50' : 'text-zinc-400 hover:text-red-400'}`}>
                        {tab === 'rules' && !session && <Lock className="w-3 h-3 inline mr-1 mb-0.5" />} {tab}
                        </button>
                    </li>
                    ))}
                </ul>
                <div className="ml-4">
                    {session ? (
                        <div className="flex items-center gap-4">
                            <span className="hidden md:block text-zinc-400 text-sm">{session.user.email}</span>
                            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 border border-zinc-700 hover:border-red-600 rounded text-sm transition-colors">
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => navigate('/login')} className="px-5 py-2 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 text-white font-bold rounded-md shadow-lg">LOGIN / SIGNUP</button>
                    )}
                </div>
                </div>
            </nav>

            {/* CONTENT */}
            <main className="container mx-auto px-6 py-12 md:py-20 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'rules' && (session ? <RulesPage /> : <LockedRules />)}
                        {activeTab === 'about' && <AboutContent />}
                        {activeTab === 'help' && <HelpContent />}
                    </motion.div>
                </AnimatePresence>
            </main>
          </div>
      )}
      <div className="fixed bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-red-900/10 to-transparent pointer-events-none z-0" />
    </div>
  );
};

export default HomePage;