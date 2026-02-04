import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flag, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitionStore } from '@/store/competitionStore';
import { CompetitionTimer } from './CompetitionTimer';
import { RoundTransition } from './RoundTransition';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface Question {
  id: string;
  title: string;
  description: string;
  options: string[];
  correct_answer: string;
}

export const MCQRound = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  
  //  NOW these functions exist in the store
  const { 
      completeRound, 
      incrementTabSwitch, // Alias for logTabSwitch
      startMCQ, 
      mcqStartTime, 
      disqualify // Alias for disqualifyUser
  } = useCompetitionStore();

  const currentQuestion = questions[currentIndex];

  // 0. Fetch questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('round_id', 'mcq')
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setQuestions(data);
        } else {
          toast.error('No MCQ questions found. Please contact admin.');
        }
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        toast.error('Failed to load questions');
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  // 1. Start timer on mount
  useEffect(() => {
    // If start time is missing, set it
    if (!mcqStartTime) {
      startMCQ();
    }
  }, [mcqStartTime, startMCQ]);

  // 2. Anti-Cheat: Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementTabSwitch();
        toast.warning('Tab switch detected! This has been logged.', {
            icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
            duration: 4000
        });
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        toast.error('Copying is disabled!');
    };

    const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();
        toast.error('Pasting is disabled!');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [incrementTabSwitch]);

  const handleSelectOption = (optionIndex: number) => {
    setAnswers((prev) => {
      const current = prev[currentQuestion.id] || [];

      if (currentQuestion.multiCorrect) {
        if (current.includes(optionIndex)) {
          return { ...prev, [currentQuestion.id]: current.filter(i => i !== optionIndex) };
        }
        return { ...prev, [currentQuestion.id]: [...current, optionIndex] };
      }
      return { ...prev, [currentQuestion.id]: [optionIndex] };
    });
  };

  const handleFlag = () => {
    setFlagged((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    // TODO: Send answers to Supabase here if needed
    
    setTimeout(() => {
      setSubmitted(true);
      setIsSubmitting(false);
    }, 1000);
  }, []);

  const handleTimeUp = useCallback(() => {
    toast.error("Time's up! Auto-submitting your answers...");
    handleSubmit();
  }, [handleSubmit]);

  // Show transition screen after submission
  if (submitted) {
    return <RoundTransition 
      completedRound="MCQ Round" 
      nextRoundName="Flowchart Round"
      nextRoundSlug="flowchart"
    />;
  }

  // Loading State
  if (loadingQuestions) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-zinc-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  // No Questions State
  if (questions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Questions Available</h3>
          <p className="text-zinc-400">Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const isCurrentAnswered = answers[currentQuestion.id]?.length > 0;
  const isCurrentFlagged = flagged.has(currentQuestion.id);

  return (
    <div className="grid lg:grid-cols-[1fr,300px] gap-6 h-full animate-in fade-in slide-in-from-bottom-4">
      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Question Card */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-red-900/30 text-red-400 font-display font-bold text-sm border border-red-900/50">
                Q{currentIndex + 1}/{questions.length}
              </span>
              {currentQuestion.multiCorrect && (
                <span className="px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-xs border border-blue-900/50">
                  Multi-select
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlag}
              className={cn(
                "gap-2 hover:bg-zinc-800",
                isCurrentFlagged && "text-yellow-500 bg-yellow-900/20"
              )}
            >
              <Flag className={cn("w-4 h-4", isCurrentFlagged && "fill-yellow-500")} />
              {isCurrentFlagged ? 'Flagged' : 'Flag'}
            </Button>
          </div>

          {/* Question Text */}
          <h2 className="text-xl font-semibold mb-2 leading-relaxed select-none text-zinc-100">
            {currentQuestion.title}
          </h2>
          {currentQuestion.description && (
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              {currentQuestion.description}
            </p>
          )}

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion.id]?.includes(index);

              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectOption(index)}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 text-left transition-all duration-200 flex items-center gap-4 select-none group",
                    isSelected
                      ? "border-red-600 bg-red-900/20"
                      : "border-zinc-700 hover:border-red-500/50 hover:bg-zinc-800"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                    isSelected ? "border-red-600 bg-red-600" : "border-zinc-600 group-hover:border-zinc-400"
                  )}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className={cn(
                    "font-medium text-zinc-300 group-hover:text-white transition-colors",
                    isSelected && "text-white"
                  )}>
                    {option}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="gap-2 border-zinc-700 hover:bg-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 gap-2 text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit All'}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-white"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Pass the mcqStartTime from store to the timer if needed, or timer can use its own relative logic */}
        <CompetitionTimer
          totalSeconds={30 * 60}
          onTimeUp={handleTimeUp}
        />

        {/* Progress Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <h3 className="text-sm font-semibold mb-3 text-zinc-400">Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Answered</span>
              <span className="font-bold text-red-500">{answeredCount}/{questions.length}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
           <h3 className="text-sm font-semibold mb-3 text-zinc-400">Navigator</h3>
           <div className="flex flex-wrap gap-2">
             {questions.map((q, index) => {
               const isAnswered = answers[q.id]?.length > 0;
               const isFlagged = flagged.has(q.id);
               const isCurrent = index === currentIndex;

               return (
                 <button
                   key={q.id}
                   onClick={() => setCurrentIndex(index)}
                   className={cn(
                     "w-8 h-8 rounded-lg font-bold text-xs transition-all duration-200 relative",
                     isCurrent && "ring-2 ring-red-500 bg-red-500/10 text-red-500",
                     isAnswered && !isCurrent && "bg-green-900/30 text-green-400 border border-green-900/50",
                     !isAnswered && !isCurrent && "bg-zinc-800 text-zinc-500 hover:bg-zinc-700",
                     isCurrent && isAnswered && "bg-green-500 text-black ring-green-500"
                   )}
                 >
                   {index + 1}
                   {isFlagged && (
                     <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full shadow-lg" />
                   )}
                 </button>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
};