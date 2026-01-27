import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, ScrollText, Loader2, RefreshCw } from 'lucide-react';
import { useCompetitionStore } from '@/store/competitionStore';
import { supabase } from '@/lib/supabaseClient';
import { WaitingArea } from './WaitingArea';

export const RulesPage = () => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false); // For Accept Button
  const [verifying, setVerifying] = useState(true); // Initial Check
  const { acceptRules, currentRound, userId, syncSession } = useCompetitionStore();
  const [rules, setRules] = useState<any[]>([]); 

  // 1. SELF-CORRECTION CHECK (With Safety Timeout)
  useEffect(() => {
    let isMounted = true;

    const checkRealStatus = async () => {
        // Agar user ID hi nahi hai, toh verify kya karenge? Skip.
        if (!userId) {
            if(isMounted) setVerifying(false);
            return;
        }

        try {
            // DB se latest status maango
            const { data, error } = await supabase
                .from('exam_sessions')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            if (data && isMounted) {
                // Agar DB mein round 'rules' nahi hai, toh user ko forward karo
                if (data.current_round_slug !== 'rules') {
                    console.log("🚀 Auto-Redirecting to:", data.current_round_slug);
                    syncSession(data); // State update
                    return; // Component re-render hoga aur redirect ho jayega
                }
            }
        } catch (err) {
            console.error("Verification Check Failed:", err);
            // Error aaya toh bhi hum user ko rokenge nahi, Rules dikha denge
        } finally {
            if (isMounted) setVerifying(false); // Loader hatao (Compulsory)
        }
    };

    checkRealStatus();

    // Safety Timeout: Agar 5 sec tak DB se jawab na aaye, toh loader hata do
    const safetyTimer = setTimeout(() => {
        if (isMounted && verifying) {
            console.warn("⚠️ Verification Timeout - Showing Rules Forcefully");
            setVerifying(false);
        }
    }, 5000);

    return () => { 
        isMounted = false; 
        clearTimeout(safetyTimer);
    };
  }, [userId, syncSession]);

  // 2. FETCH RULES
  useEffect(() => {
    const fetchRules = async () => {
        const { data } = await supabase.from('competition_rules').select('*');
        if (data && data.length > 0) {
            setRules(data);
        } else {
            setRules([
                { title: "Zero Tolerance Cheating", description: "AI usage, screen sharing, or external help is strictly prohibited." },
                { title: "Active Monitoring", description: "Tab switching and window focus events are logged instantly." },
                { title: "Time Constraints", description: "Each round has a strict timer. No extensions provided." },
                { title: "Submission Protocol", description: "Code must be compiled and submitted before the timer hits zero." }
            ]);
        }
    };
    fetchRules();
  }, []);

  const handleAccept = async () => {
      setLoading(true);
      await acceptRules();
      setLoading(false);
  };

  //  REDIRECT LOGIC
  if (currentRound === 'waiting') return <WaitingArea />;
  
  //  LOADING SCREEN (Only shows for max 5 seconds now)
  if (verifying) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-zinc-500">
        <Loader2 className="animate-spin text-red-600 w-10 h-10" />
        <p className="animate-pulse text-sm font-mono">Verifying User Session...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 text-white animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold font-display text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] tracking-wide">
            PROTOCOL VERIFICATION
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
            You are about to enter the Upside Down. Strict adherence to the following protocols is mandatory for survival.
        </p>
      </div>

      {/* RULES GRID */}
      <div className="grid md:grid-cols-2 gap-4">
        {rules.map((rule, i) => (
            <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/60 border border-zinc-800 hover:border-red-900/50 p-5 rounded-xl flex gap-4 transition-colors group backdrop-blur-sm"
            >
                <div className="bg-red-900/10 border border-red-900/20 p-3 rounded-lg h-fit group-hover:bg-red-900/20 transition-colors">
                    {i === 0 ? <Shield className="w-5 h-5 text-red-500" /> : <ScrollText className="w-5 h-5 text-red-500" />}
                </div>
                <div>
                    <h3 className="font-bold text-zinc-200 group-hover:text-white transition-colors mb-1">{rule.title}</h3>
                    <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors leading-relaxed">{rule.description}</p>
                </div>
            </motion.div>
        ))}
      </div>

      {/* WARNING BOX */}
      <div className="bg-red-950/20 border border-red-500/30 p-5 rounded-xl flex gap-4 items-center shadow-[0_0_20px_rgba(220,38,38,0.05)]">
        <div className="p-2 bg-red-500/10 rounded-full shrink-0">
            <AlertTriangle className="text-red-500 w-6 h-6 animate-pulse" />
        </div>
        <p className="text-red-200 text-sm font-medium">
            <strong>WARNING:</strong> This environment is strictly proctored. Your IP address, tab switches, and mouse interactions are being monitored in real-time. Violations result in immediate disqualification.
        </p>
      </div>

      {/* ACTION AREA */}
      <div className="flex flex-col items-center gap-8 mt-8 pt-8 border-t border-zinc-800">
        <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-zinc-900/50 transition-colors cursor-pointer" onClick={() => setAccepted(!accepted)}>
            <Checkbox 
                id="terms" 
                checked={accepted} 
                onCheckedChange={(c) => setAccepted(c === true)} 
                className="border-zinc-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 w-5 h-5"
            />
            <label htmlFor="terms" className="text-sm md:text-base text-zinc-300 cursor-pointer select-none font-medium">
                I accept the protocols and consent to monitoring.
            </label>
        </div>

        <Button 
            disabled={!accepted || loading} 
            onClick={handleAccept}
            className="w-full md:w-72 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-14 text-lg rounded-xl shadow-lg shadow-red-900/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
            {loading ? "Verifying..." : "ENTER WAITING AREA"}
        </Button>
      </div>
    </div>
  );
};