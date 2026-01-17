import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Shield } from 'lucide-react';
import { useCompetitionStore } from '@/store/competitionStore';
import { cn } from '@/lib/utils';

interface CompetitionTimerProps {
  totalSeconds: number;
  onTimeUp?: () => void;
  isActive?: boolean;
}

export const CompetitionTimer = ({
  totalSeconds,
  onTimeUp,
  isActive = true,
}: CompetitionTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  const { tabSwitchCount, currentRound } = useCompetitionStore();

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = (timeRemaining / totalSeconds) * 100;
  const isLow = timeRemaining < 300; // Less than 5 minutes
  const isCritical = timeRemaining < 60; // Less than 1 minute

  return (
    <div className="glass-strong rounded-xl p-6 space-y-4">
      {/* Timer Display */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
          <Clock className="w-4 h-4" />
          <span>Time Remaining</span>
        </div>
        
        <motion.div
          className={cn(
            "font-display text-5xl font-bold tracking-wider",
            isCritical && "text-destructive animate-pulse",
            isLow && !isCritical && "text-warning",
            !isLow && "gradient-text"
          )}
          animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors duration-300",
            isCritical ? "bg-destructive" : isLow ? "bg-warning" : "bg-gradient-to-r from-primary to-secondary"
          )}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Status indicators */}
      <div className="space-y-3 pt-2">
        {/* Current Round */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current Round</span>
          <span className="font-semibold text-primary capitalize">
            {currentRound === 'mcq' ? 'Aptitude MCQ' : 
             currentRound === 'flowchart' ? 'Flowchart Design' :
             currentRound === 'coding' ? 'DSA Coding' : currentRound}
          </span>
        </div>

        {/* Tab Switch Warning */}
        {tabSwitchCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between text-sm bg-destructive/10 p-2 rounded-lg border border-destructive/30"
          >
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>Tab Switches</span>
            </div>
            <span className="font-bold text-destructive">{tabSwitchCount}/3</span>
          </motion.div>
        )}

        {/* Security Status */}
        <div className="flex items-center gap-2 text-success text-sm">
          <Shield className="w-4 h-4" />
          <span>Proctoring Active</span>
        </div>
      </div>
    </div>
  );
};
