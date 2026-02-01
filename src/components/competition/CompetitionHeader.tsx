import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Users, ShieldCheck, LogOut, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useCompetitionStore } from '@/store/competitionStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const CompetitionHeader = () => {
  const navigate = useNavigate();
  const { email, userId } = useCompetitionStore();
  
  // Local State for Realtime Features
  const [onlineCount, setOnlineCount] = useState(1); // Khud ko mila ke 1
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);

  // 1. NETWORK STATUS MONITORING
  useEffect(() => {
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. SUPABASE PRESENCE (Realtime User Count)
  useEffect(() => {
    if (!userId) return;

    // Create a presence channel
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        // Count unique connections
        setOnlineCount(Object.keys(newState).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user: email,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, email]);

  // 3. LOGOUT HANDLER
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="bg-black/80 backdrop-blur-md border-b border-red-900/30 sticky top-0 z-50 shadow-lg shadow-red-900/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO & BRANDING */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-700 to-black border border-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-white tracking-wider">
              STRANGER <span className="text-red-600">TECH</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
               Upside Down CodeArena
            </p>
          </div>
        </motion.div>

        {/* RIGHT SIDE INDICATORS */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 md:gap-6"
        >
          {/* Realtime User Count */}
          <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="font-mono font-bold text-white">{onlineCount}</span>
            <span className="text-xs">Runners Online</span>
          </div>

          {/* Network Status */}
          <div className={cn(
            "hidden md:flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition-colors",
            isNetworkOnline 
                ? "text-green-400 border-green-900/50 bg-green-900/10" 
                : "text-red-500 border-red-900/50 bg-red-900/10 animate-pulse"
          )}>
            {isNetworkOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase">{isNetworkOnline ? 'Connected' : 'Offline'}</span>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4 pl-4 border-l border-zinc-800">
            <div className="hidden lg:block text-right">
                <p className="text-xs text-zinc-500 uppercase font-bold">Logged in as</p>
                <p className="text-sm text-white font-mono truncate max-w-[150px]">{email}</p>
            </div>
            
            <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="icon" 
                className="text-zinc-400 hover:text-red-500 hover:bg-red-950/30"
                title="Disconnect from Simulation"
            >
                <LogOut className="w-5 h-5" />
            </Button>
          </div>

        </motion.div>
      </div>
    </header>
  );
};