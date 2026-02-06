import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useCompetitionStore } from '@/store/competitionStore';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface RoundTransitionProps {
  completedRound: string;
  nextRoundName: string;
  nextRoundSlug: 'flowchart' | 'coding';
}

export const RoundTransition = ({ completedRound, nextRoundName, nextRoundSlug }: RoundTransitionProps) => {
  const { userId, syncSession, completeRound } = useCompetitionStore();
  const [checking, setChecking] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Check if the next round has already been started by admin
  const checkNextRoundStatus = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('current_round_slug')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error checking round status:', error);
        return;
      }

      if (data && data.current_round_slug === nextRoundSlug) {
        // The admin has already started the next round!
        console.log(`✅ Admin has started ${nextRoundName}! Navigating...`);
        toast.success(`${nextRoundName} has started! Entering now...`);
        
        // Fetch full session data and sync
        const { data: fullSession } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fullSession) {
          syncSession(fullSession);
        }
      }
    } catch (err) {
      console.error('Failed to check round status:', err);
    }
  };

  // Initial check on mount
  useEffect(() => {
    checkNextRoundStatus();
  }, []);

  // Polling mechanism - check every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPollCount(prev => prev + 1);
      checkNextRoundStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, nextRoundSlug, syncSession]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`round-transition-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exam_sessions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log("⚡ Realtime Update during transition:", payload.new);
          if (payload.new.current_round_slug === nextRoundSlug) {
            toast.success(`${nextRoundName} has started! Entering now...`);
            syncSession(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, nextRoundSlug, syncSession, nextRoundName]);

  // Manual refresh button
  const handleManualRefresh = async () => {
    setChecking(true);
    await checkNextRoundStatus();
    setTimeout(() => setChecking(false), 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 p-4 relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] animate-pulse pointer-events-none" />

      {/* Success Icon */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>

      {/* Main Message */}
      <div className="space-y-4 max-w-lg relative z-10">
        <h2 className="text-3xl font-display font-bold text-white">
          {completedRound} Completed!
        </h2>
        <p className="text-slate-400">
          Great work! Your submission has been recorded.
        </p>
        
        {/* Waiting Status */}
        <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-lg flex items-center gap-4 text-left backdrop-blur-sm">
          <div className="p-3 bg-blue-500/10 rounded-full">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-blue-300 font-bold text-sm tracking-wide">
              WAITING FOR {nextRoundName.toUpperCase()}
            </p>
            <p className="text-xs text-blue-400/70 mt-1">
              The next round will start automatically when the admin begins it.
            </p>
          </div>
        </div>
      </div>

      {/* Status & Controls */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-green-500" />
          <span className="animate-pulse">
            Checking for {nextRoundName} start... ({pollCount * 3}s)
          </span>
        </div>

        {/* Manual Refresh Button */}
        <button 
          onClick={handleManualRefresh}
          disabled={checking}
          className="flex items-center gap-2 px-5 py-2 mx-auto bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full transition-all text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking..." : "Refresh Status"}
        </button>

        <p className="text-xs text-zinc-600 mt-4">
          Tip: Keep this tab active. You'll be automatically moved to {nextRoundName} when it starts.
        </p>
      </div>
    </div>
  );
};
