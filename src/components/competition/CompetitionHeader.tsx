import { motion } from 'framer-motion';
import { Code2, Zap, Users, ShieldCheck } from 'lucide-react';

export const CompetitionHeader = () => {
  return (
    <header className="glass-strong border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Code2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none gradient-text">
              CESA CodeArena
            </h1>
            <p className="text-xs text-muted-foreground">National Technical Competition</p>
          </div>
        </motion.div>

        {/* Status Indicators */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex items-center gap-6"
        >
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-muted-foreground">Live</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>127 Online</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-success">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure</span>
          </div>
        </motion.div>
      </div>
    </header>
  );
};
