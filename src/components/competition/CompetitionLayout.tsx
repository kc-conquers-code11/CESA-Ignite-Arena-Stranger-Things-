import { useCompetitionStore } from '@/store/competitionStore';
import { CompetitionHeader } from './CompetitionHeader';
import { CompetitionTimeline } from './CompetitionTimeline';
import { AnimatedBackground } from './AnimatedBackground';
import { RulesPage } from './RulesPage';
import { MCQRound } from './MCQRound';
import { FlowchartRound } from './FlowchartRound';
import { CodingRound } from './CodingRound';
import { CompletionPage } from './CompletionPage';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const CompetitionLayout = () => {
const { currentRound, incrementTabSwitch,disqualify,
  tabSwitchCount } = useCompetitionStore();
const blurLock = useRef(false);


  const renderRound = () => {
    switch (currentRound) {
      case 'rules':
        return <RulesPage />;
      case 'mcq':
        return <MCQRound />;
      case 'flowchart':
        return <FlowchartRound />;
      case 'coding':
        return <CodingRound />;
      case 'completed':
        return <CompletionPage />;
      default:
        return <RulesPage />;
    }
  };
//ye use effect ayush ne daala h
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      disqualify(); // single source of truth
    }
  };

  const handleBlur = () => {
    if (blurLock.current) return;

    blurLock.current = true;
    disqualify();

    setTimeout(() => {
      blurLock.current = false;
    }, 1000);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleBlur);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleBlur);
  };
}, []);



  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <CompetitionHeader />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-[280px,1fr] gap-6 h-full">
            {/* Sidebar - Timeline */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <CompetitionTimeline />
              </div>
            </div>
            
            {/* Main Content Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRound}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[calc(100vh-8rem)]"
              >
                {renderRound()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
