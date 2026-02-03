import { motion } from "framer-motion";
import { Trophy, LogOut, Star, CheckCircle, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

// NOTE: FlowchartRound aur CodingRound yahan se hata diye gaye hain.
// Kyunki ab hum unke Real Components (FlowchartRound.tsx aur CodingRound.tsx) use kar rahe hain.

// --- COMPLETION PAGE ---
export const CompletionPage = () => {
    const navigate = useNavigate();
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
        
        {/* Animated Trophy */}
        <motion.div 
            initial={{ scale: 0, rotate: -180 }} 
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative"
        >
            <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-yellow-500/50 mb-8 relative z-10 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-md" />
            </div>
            
            {/* Floating Stars */}
            <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-4"
            >
                <Star className="w-8 h-8 text-yellow-200 fill-yellow-200" />
            </motion.div>
            <motion.div 
                animate={{ y: [0, -15, 0] }} 
                transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
                className="absolute top-10 -left-6"
            >
                <PartyPopper className="w-6 h-6 text-orange-400" />
            </motion.div>
        </motion.div>

        {/* Text Content */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <h1 className="text-5xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-500 mb-4">
                MISSION ACCOMPLISHED
            </h1>
            
            <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                You have successfully navigated the Upside Down logic gates and survived the algorithmic challenges. 
                Your submission has been transmitted to Hawkins Lab for evaluation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-500/30 rounded-full text-green-400 text-sm font-bold">
                    <CheckCircle className="w-4 h-4" /> All Rounds Submitted
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-bold">
                    <CheckCircle className="w-4 h-4" /> Session Secured
                </div>
            </div>
        </motion.div>

        {/* Action Button */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
        >
            <Button 
                onClick={handleLogout} 
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-6 text-lg shadow-lg shadow-red-900/20"
            >
                <LogOut className="w-5 h-5 mr-2" /> DISCONNECT FROM SIMULATION
            </Button>
        </motion.div>

      </div>
    );
};