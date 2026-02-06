import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, Loader2 } from 'lucide-react';
import { useCompetitionStore } from '@/store/competitionStore';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

// Components
import { CompetitionHeader } from './CompetitionHeader';
import { CompetitionTimeline } from './CompetitionTimeline';
import { AnimatedBackground } from './AnimatedBackground';
import { RulesPage } from './RulesPage';
import { WaitingArea } from './WaitingArea';
import { MCQRound } from './MCQRound';

// FIX: Import the REAL Components
import { FlowchartRound } from './FlowchartRound';
import { CodingRound } from './CodingRound';
import { CompletionPage } from './RoundPlaceholders';

export const CompetitionLayout = () => {
  // 1. GET DATA FROM STORE
  const {
    currentRound,
    competitionStatus,
    logTabSwitch,
    userId,
    syncSession
  } = useCompetitionStore();


  const [initializing, setInitializing] = useState(true);

  // Moved from bottom to prevent hook order errors
  const [timelineHover, setTimelineHover] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Derived state for layout
  const isSidebarExpanded = timelineHover || isPinned;


  // 1.5. INITIAL DB SYNC ON MOUNT
  useEffect(() => {
    const initialSync = async () => {
      if (!userId) {
        setInitializing(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (data) {
          console.log("🔄 Initial Sync:", data.status);
          syncSession(data);
        }
      } catch (err) {
        console.error("Sync failed:", err);
      } finally {
        setInitializing(false);
      }
    };

    initialSync();
  }, [userId, syncSession]);

  // ✅ 2. REALTIME LISTENER (INSTANT RESUME)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-session-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exam_sessions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log("⚡ Realtime Update:", payload.new.status);
          // Update store immediately to remove Frozen screen without reload
          syncSession(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, syncSession]);

  // 3. BACKUP POLLING (Network Fail-Safe)
  useEffect(() => {
    if (currentRound !== 'waiting' || !userId) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If DB says we moved past waiting, force update
      if (data && data.current_round_slug !== 'waiting') {
        syncSession(data);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentRound, userId, syncSession]);


  // 4. ANTI-CHEAT LOGIC
  useEffect(() => {
    const isSafeZone = currentRound === 'rules' || currentRound === 'waiting' || currentRound === 'completed';
    // Don't log if already frozen
    if (isSafeZone || competitionStatus !== 'active') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn(`[Anti-Cheat] Tab switch detected!`);
        if (logTabSwitch) logTabSwitch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentRound, competitionStatus, logTabSwitch]);

  // ✅ RENDER LOGIC
  const renderRound = () => {
    switch (currentRound) {
      case 'rules': return <RulesPage />;
      case 'waiting': return <WaitingArea />;
      case 'mcq': return <MCQRound />;
      case 'flowchart': return <FlowchartRound />; // ✅ Now correctly points to the Real Component
      case 'coding': return <CodingRound />;
      case 'completed': return <CompletionPage />;
      default: return <RulesPage />;
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
        <p className="animate-pulse font-mono text-sm">Synchronizing Session...</p>
      </div>
    );
  }

  // 5. FROZEN SCREEN (Realtime removal supported)
  if (competitionStatus === 'frozen') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden p-6 font-sans">
        <div className="absolute inset-0 bg-orange-500/10 z-0 animate-pulse" />
        <div className="z-10 text-center max-w-lg w-full p-8 bg-zinc-900/90 backdrop-blur-xl border border-orange-500/50 rounded-2xl shadow-2xl shadow-orange-500/20">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Competition Frozen</h1>
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg mb-6">
            <p className="text-orange-200 font-medium flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Suspicious Activity Detected
            </p>
          </div>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            We detected multiple tab switches. Your exam is <strong>temporarily locked</strong>.
            <br />Contact an invigilator to resume.
          </p>
          <div className="mt-6 text-xs text-zinc-600 font-mono animate-pulse">
            Waiting for Admin Signal...
          </div>
        </div>
      </div>
    );
  }

  // 6. DISQUALIFIED SCREEN
  if (competitionStatus === 'disqualified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-20 h-20 text-red-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-red-600 mb-4 font-display">DISQUALIFIED</h1>
          <p className="text-zinc-400">Your attempt has been terminated due to repeated violations.</p>
        </div>
      </div>
    );
  }

  // 7. NORMAL RENDER
  return (
    <div className="h-screen flex flex-col relative bg-black text-white selection:bg-indigo-500/30 overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedBackground />
      </div>

      {/* Header - Fixed Height */}
      <div className="relative z-10 shrink-0">
        <CompetitionHeader />
      </div>

      {/* Main Content Area - Fills remaining height */}
      <main className="relative z-10 flex-1 flex overflow-hidden m-4 gap-4 transition-all duration-500">

        {/* SIDEBAR - Using Framer Motion for smooth width transition */}
        <div className="hidden lg:block h-full shrink-0">
          <motion.div
            initial={false}
            animate={{
              width: currentRound === 'coding' ? (isSidebarExpanded ? 280 : 60) : 280
            }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }} // Bezier for smooth "apple-like" feel
            className="h-full relative"
          >
            {currentRound === 'coding' ? (
              // Coding Round Sidebar Logic (Rail vs Expanded)
              <div
                className="h-full flex flex-col"
                onMouseEnter={() => setTimelineHover(true)}
                onMouseLeave={() => setTimelineHover(false)}
              >
                <div className={cn(
                  "h-full bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-xl overflow-hidden relative transition-colors duration-300",
                  isSidebarExpanded ? "shadow-2xl border-indigo-500/20" : "hover:border-indigo-500/50"
                )}>
                  {/* PIN BUTTON */}
                  <div className={cn(
                    "absolute top-3 right-3 z-10 transition-opacity duration-300",
                    isSidebarExpanded ? "opacity-100 visible" : "opacity-0 invisible"
                  )}>
                    <button
                      onClick={() => setIsPinned(!isPinned)}
                      className={cn(
                        "p-1.5 rounded-md transition-all hover:bg-white/5",
                        isPinned ? "text-indigo-400 rotate-0" : "text-zinc-500 -rotate-45"
                      )}
                      title={isPinned ? "Unpin Timeline" : "Pin Timeline"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin"><line x1="12" x2="12" y1="17" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>
                    </button>
                  </div>

                  {/* CONTENT RENDER */}
                  {isSidebarExpanded ? (
                    <div className="h-full overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-300">
                      <CompetitionTimeline />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center cursor-pointer group">
                      <div className="writing-mode-vertical-rl text-xs font-mono text-zinc-500 group-hover:text-indigo-400 uppercase tracking-widest py-2 whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        Timeline
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Standard Expanded Sidebar
              <div className="h-full bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-xl p-4 overflow-hidden shadow-xl animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <CompetitionTimeline />
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* MAIN ROUND CONTENT - Fills remaining space */}
        <div className="flex-1 h-full min-w-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRound}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full w-full"
            >
              {currentRound === 'coding' ? <CodingRound isSidebarExpanded={isSidebarExpanded} /> : renderRound()}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
};