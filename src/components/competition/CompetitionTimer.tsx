import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Shield } from 'lucide-react';
import { useCompetitionStore } from '@/store/competitionStore';
import { cn } from '@/lib/utils';

interface CompetitionTimerProps {
  totalSeconds: number;
  onTimeUp?: () => void;
  isActive?: boolean;
  className?: string;
}

export const CompetitionTimer = ({
  totalSeconds,
  onTimeUp,
  isActive = true,
  className,
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
    <div className={cn("space-y-2", className)}>
      {/* Timer Display - Compact horizontal layout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <Clock className="w-4 h-4" />
          <span>Time Remaining</span>
        </div>

        <motion.div
          className={cn(
            "font-mono text-lg font-bold tracking-wider",
            isCritical && "text-red-500 animate-pulse",
            isLow && !isCritical && "text-yellow-500",
            !isLow && "text-green-500"
          )}
          animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.div>
      </div>

      {/* Progress bar - More prominent */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors duration-300",
            isCritical ? "bg-red-500" : isLow ? "bg-yellow-500" : "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
          )}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Status indicators - Compact inline display */}
      <div className="flex items-center gap-4 text-xs">
        {/* Current Round */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Round:</span>
          <span className="font-semibold text-blue-400 capitalize">
            {currentRound === 'mcq' ? 'MCQ' :
              currentRound === 'flowchart' ? 'Flowchart' :
                currentRound === 'coding' ? 'Coding' : currentRound}
          </span>
        </div>

        {/* Tab Switch Warning */}
        {tabSwitchCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-xs bg-red-950/30 px-2 py-1 rounded border border-red-900/50"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Switches: {tabSwitchCount}/3</span>
          </motion.div>
        )}

        {/* Security Status */}
        <div className="flex items-center gap-1.5 text-green-500">
          <Shield className="w-3 h-3" />
          <span>Proctored</span>
        </div>
      </div>
    </div>
  );
};
