import { motion } from 'framer-motion';
import { Check, Lock, Play, FileText, GitBranch, Code } from 'lucide-react';
import { useCompetitionStore, Round, RoundStatus } from '@/store/competitionStore';
import { cn } from '@/lib/utils';

interface TimelineStep {
  id: Round;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: TimelineStep[] = [
  {
    id: 'rules',
    title: 'Competition Rules',
    description: 'Read and accept the rules',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'mcq',
    title: 'Round 1: Aptitude',
    description: 'Multiple choice questions',
    icon: <Check className="w-5 h-5" />,
  },
  {
    id: 'flowchart',
    title: 'Round 2: Flowchart',
    description: 'Design flowchart solutions',
    icon: <GitBranch className="w-5 h-5" />,
  },
  {
    id: 'coding',
    title: 'Round 3: Coding',
    description: 'Solve DSA challenges',
    icon: <Code className="w-5 h-5" />,
  },
];

const getStatusIcon = (status: RoundStatus) => {
  switch (status) {
    case 'completed':
      return <Check className="w-4 h-4" />;
    case 'locked':
      return <Lock className="w-4 h-4" />;
    case 'active':
      return <Play className="w-4 h-4" />;
  }
};

export const CompetitionTimeline = () => {
  const { roundStatus, currentRound } = useCompetitionStore();

  return (
    <div className="glass-strong rounded-xl p-6 h-fit">
      <h2 className="font-display text-lg font-bold gradient-text mb-6">
        Competition Progress
      </h2>
      
      <div className="space-y-1">
        {steps.map((step, index) => {
          const status = roundStatus[step.id];
          const isActive = currentRound === step.id;
          const isCompleted = status === 'completed';
          const isLocked = status === 'locked';
          
          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-5 top-12 w-0.5 h-8 transition-colors duration-500",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-start gap-4 p-3 rounded-lg transition-all duration-300",
                  isActive && "bg-primary/10 glow-primary",
                  isCompleted && "bg-success/5",
                  isLocked && "opacity-50"
                )}
              >
                {/* Status indicator */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    isActive && "border-primary bg-primary/20 text-primary animate-pulse-glow",
                    isCompleted && "border-success bg-success/20 text-success",
                    isLocked && "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? getStatusIcon('completed') : step.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-semibold text-sm transition-colors",
                        isActive && "text-primary text-glow-primary",
                        isCompleted && "text-success",
                        isLocked && "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </h3>
                    
                    {/* Status badge */}
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        isActive && "status-active",
                        isCompleted && "bg-success/20 text-success",
                        isLocked && "status-locked"
                      )}
                    >
                      {isActive ? 'Active' : isCompleted ? 'Done' : 'Locked'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
