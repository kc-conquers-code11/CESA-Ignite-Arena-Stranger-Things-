import { motion } from "framer-motion";
import { Code2, Workflow, Trophy, LogOut } from "lucide-react";
import { useCompetitionStore } from "@/store/competitionStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// --- FLOWCHART ROUND ---
export const FlowchartRound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
    <div className="w-20 h-20 bg-blue-900/20 rounded-full flex items-center justify-center border border-blue-500/30 mb-6">
      <Workflow className="w-10 h-10 text-blue-500" />
    </div>
    <h1 className="text-3xl font-bold text-white mb-2">Round 2: Flowchart Design</h1>
    <p className="text-zinc-400">This module is currently active. Integration in progress.</p>
  </div>
);

// --- CODING ROUND ---
export const CodingRound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
    <div className="w-20 h-20 bg-green-900/20 rounded-full flex items-center justify-center border border-green-500/30 mb-6">
      <Code2 className="w-10 h-10 text-green-500" />
    </div>
    <h1 className="text-3xl font-bold text-white mb-2">Round 3: Coding Challenge</h1>
    <p className="text-zinc-400">Prepare your IDE. The challenge begins soon.</p>
  </div>
);

// --- COMPLETION PAGE ---
export const CompletionPage = () => {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="w-24 h-24 bg-yellow-900/20 rounded-full flex items-center justify-center border border-yellow-500/30 mb-6"
        >
          <Trophy className="w-12 h-12 text-yellow-500" />
        </motion.div>
        <h1 className="text-4xl font-bold text-white mb-4">Competition Completed!</h1>
        <p className="text-zinc-400 max-w-md mb-8">
            You have successfully navigated the Upside Down. Your scores have been recorded. You may now exit the simulation.
        </p>
        <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">
            <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    );
};