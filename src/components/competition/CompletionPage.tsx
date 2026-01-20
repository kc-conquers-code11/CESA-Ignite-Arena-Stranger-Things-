import { motion } from 'framer-motion';
import { Trophy, Sparkles, CheckCircle2, Clock, Award, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitionStore } from '@/store/competitionStore';



export const CompletionPage = () => {
  const { participantName, resetCompetition, isDisqualified } = useCompetitionStore();
   //  DISQUALIFIED VIEW
  if (isDisqualified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center gap-4">
        <ShieldAlert className="w-16 h-16 text-red-600" />

        <h1 className="text-3xl font-bold text-red-600">
          You Have Been Disqualified
        </h1>

        <p className="text-gray-400 max-w-md">
          Tab switching or leaving the competition window is not allowed.
          Your attempt has been terminated.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center space-y-8"
    >
      {/* Animated Trophy */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="relative inline-block"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-warning via-warning/80 to-warning/60 flex items-center justify-center glow-secondary"
        >
          <Trophy className="w-16 h-16 text-warning-foreground" />
        </motion.div>
        
        {/* Sparkles */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-2 -left-2"
        >
          <Sparkles className="w-6 h-6 text-secondary" />
        </motion.div>
      </motion.div>

      {/* Congratulations Message */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          <span className="gradient-text">Competition Complete!</span>
        </h1>
        
        <p className="text-xl text-muted-foreground">
          Congratulations{participantName ? `, ${participantName}` : ''}! You have successfully completed all rounds.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="glass rounded-xl p-4 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
          <div className="text-2xl font-display font-bold text-success">3/3</div>
          <div className="text-xs text-muted-foreground">Rounds Completed</div>
        </div>
        
        <div className="glass rounded-xl p-4 space-y-2">
          <Clock className="w-8 h-8 text-primary mx-auto" />
          <div className="text-2xl font-display font-bold text-primary">--:--</div>
          <div className="text-xs text-muted-foreground">Total Time</div>
        </div>
        
        <div className="glass rounded-xl p-4 space-y-2">
          <Award className="w-8 h-8 text-warning mx-auto" />
          <div className="text-2xl font-display font-bold text-warning">--</div>
          <div className="text-xs text-muted-foreground">Final Rank</div>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="glass-strong rounded-xl p-6 text-left"
      >
        <h3 className="font-display font-bold mb-3">What happens next?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            Your submissions have been recorded and are being evaluated.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            Final results and rankings will be announced after all participants complete.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            You will receive a notification with your final score and certificate.
          </li>
        </ul>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          variant="outline"
          onClick={resetCompetition}
          className="gap-2"
        >
          Return to Home
        </Button>
      </motion.div>
    </motion.div>
  );
};
