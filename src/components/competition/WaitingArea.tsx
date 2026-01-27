import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Clock, RefreshCw, Radio } from 'lucide-react'; // Added icons
import { useCompetitionStore } from '@/store/competitionStore';
import { supabase } from '@/lib/supabaseClient';

export const WaitingArea = () => {
  const { email, userId, syncSession } = useCompetitionStore();
  const [checking, setChecking] = useState(false);

  // ✅ MANUAL REFRESH LOGIC (Fail-Safe)
  const handleManualRefresh = async () => {
    if (!userId) return;
    setChecking(true);
    
    try {
        // Fetch fresh data directly from DB
        const { data } = await supabase
            .from('exam_sessions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (data) {
            console.log("Manual Refresh Sync:", data);
            syncSession(data); // Force store update
        }
    } catch (e) {
        console.error("Refresh failed", e);
    }
    
    // Minimum spinner time for UX
    setTimeout(() => setChecking(false), 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 p-4 relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] animate-pulse pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
      >
        <ShieldCheck className="w-12 h-12 text-green-500" />
      </motion.div>

      <div className="space-y-4 max-w-lg relative z-10">
        <h2 className="text-3xl font-display font-bold text-white">Rules Accepted</h2>
        <p className="text-slate-400">
          Welcome, <span className="text-white font-bold">{email || 'Candidate'}</span>. 
          You are now in the secure waiting lobby.
        </p>
        
        <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-lg flex items-center gap-4 text-left backdrop-blur-sm">
            <div className="p-3 bg-indigo-500/10 rounded-full">
                <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
                <p className="text-indigo-300 font-bold text-sm tracking-wide">WAITING FOR SERVER</p>
                <p className="text-xs text-indigo-400/70 mt-1">The exam will start automatically when the Admin initiates Round 1.</p>
            </div>
        </div>
      </div>

      {/* Status & Controls */}
      <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-green-500" />
            <span className="animate-pulse">Synchronizing with CESA Server...</span>
          </div>

          {/* ✅ MANUAL REFRESH BUTTON */}
          <button 
            onClick={handleManualRefresh}
            disabled={checking}
            className="flex items-center gap-2 px-5 py-2 mx-auto bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full transition-all text-xs font-bold text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Status..." : "Stuck? Click to Refresh"}
          </button>
      </div>
    </div>
  );
};