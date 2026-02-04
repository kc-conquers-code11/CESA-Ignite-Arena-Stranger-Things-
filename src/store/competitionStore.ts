import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';

export type RoundStatus = 'locked' | 'active' | 'completed';
export type Round = 'rules' | 'waiting' | 'mcq' | 'flowchart' | 'coding' | 'completed';
export type CompetitionStatus = 'active' | 'frozen' | 'disqualified';

interface CompetitionState {
  // State
  competitionStatus: CompetitionStatus;
  currentRound: Round;
  roundStatus: Record<Round, RoundStatus>;
  userId: string | null;
  email: string | null;
  tabSwitchCount: number;
  mcqStartTime: number | null;
  flowchartStartTime: number | null;

  // Actions
  initializeUser: (userId: string, email: string) => Promise<void>;
  acceptRules: () => Promise<void>;
  syncSession: (data: any) => void;
  startRound1: () => void;
  startMCQ: () => void;
  startFlowchart: () => void;
  completeRound: (round: Round) => Promise<void>;
  logTabSwitch: () => Promise<void>;
  incrementTabSwitch: () => Promise<void>;
  freezeCompetition: () => Promise<void>;
  unfreezeCompetition: () => void;
  disqualifyUser: () => Promise<void>;
  disqualify: () => Promise<void>;
  resetCompetition: () => void;
}

const initialState = {
  competitionStatus: 'active' as CompetitionStatus,
  currentRound: 'rules' as Round,
  roundStatus: {
    rules: 'active',
    waiting: 'locked',
    mcq: 'locked',
    flowchart: 'locked',
    coding: 'locked',
    completed: 'locked',
  } as Record<Round, RoundStatus>,
  tabSwitchCount: 0,
  mcqStartTime: null,
  flowchartStartTime: null,
  userId: null,
  email: null,
};

export const useCompetitionStore = create<CompetitionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      initializeUser: async (userId, email) => {
        set({ userId, email });
        const { data } = await supabase.from('exam_sessions').select('*').eq('user_id', userId).single();
        if (data) {
          // Build proper roundStatus based on current round
          const currentRoundSlug = data.current_round_slug as Round;
          const roundOrder: Round[] = ['rules', 'waiting', 'mcq', 'flowchart', 'coding', 'completed'];
          const currentIndex = roundOrder.indexOf(currentRoundSlug);
          
          const newRoundStatus: Record<Round, RoundStatus> = {
            rules: 'locked',
            waiting: 'locked',
            mcq: 'locked',
            flowchart: 'locked',
            coding: 'locked',
            completed: 'locked',
          };
          
          // Mark all rounds before current as completed
          for (let i = 0; i < currentIndex; i++) {
            newRoundStatus[roundOrder[i]] = 'completed';
          }
          
          // Mark current round as active
          newRoundStatus[currentRoundSlug] = 'active';
          
          set({
            competitionStatus: data.status,
            currentRound: currentRoundSlug,
            tabSwitchCount: data.tab_switches || 0,
            roundStatus: newRoundStatus
          });
        } else {
          await supabase.from('exam_sessions').insert({ user_id: userId, email: email, status: 'active', current_round_slug: 'rules' });
        }
      },

      syncSession: (data) => {
        console.log("⚡ Session Sync:", data);
        
        // Build proper roundStatus based on current round
        const currentRoundSlug = data.current_round_slug as Round;
        const roundOrder: Round[] = ['rules', 'waiting', 'mcq', 'flowchart', 'coding', 'completed'];
        const currentIndex = roundOrder.indexOf(currentRoundSlug);
        
        const newRoundStatus: Record<Round, RoundStatus> = {
          rules: 'locked',
          waiting: 'locked',
          mcq: 'locked',
          flowchart: 'locked',
          coding: 'locked',
          completed: 'locked',
        };
        
        // Mark all rounds before current as completed
        for (let i = 0; i < currentIndex; i++) {
          newRoundStatus[roundOrder[i]] = 'completed';
        }
        
        // Mark current round as active
        newRoundStatus[currentRoundSlug] = 'active';
        
        set({ 
          competitionStatus: data.status, 
          currentRound: currentRoundSlug, 
          tabSwitchCount: data.tab_switches,
          roundStatus: newRoundStatus
        });
      },

      acceptRules: async () => {
        const { userId } = get();
        set({ 
          currentRound: 'waiting', 
          roundStatus: { 
            rules: 'completed', 
            waiting: 'active', 
            mcq: 'locked',
            flowchart: 'locked',
            coding: 'locked',
            completed: 'locked'
          } 
        });
        if (userId) await supabase.from('exam_sessions').update({ current_round_slug: 'waiting' }).eq('user_id', userId);
      },

      startMCQ: () => {
        if (!get().mcqStartTime) set({ mcqStartTime: Date.now() });
      },

      startFlowchart: () => {
        if (!get().flowchartStartTime) set({ flowchartStartTime: Date.now() });
      },

      startRound1: () => {
        set({ 
          currentRound: 'mcq', 
          roundStatus: { 
            rules: 'completed',
            waiting: 'completed', 
            mcq: 'active',
            flowchart: 'locked',
            coding: 'locked',
            completed: 'locked'
          } 
        });
        get().startMCQ();
      },

      completeRound: async (completedRound) => {
        const { userId } = get();
        let nextRound: Round = 'completed';
        const newRoundStatus: Record<Round, RoundStatus> = {
          rules: 'completed',
          waiting: 'completed',
          mcq: 'locked',
          flowchart: 'locked',
          coding: 'locked',
          completed: 'locked',
        };

        if (completedRound === 'mcq') {
          nextRound = 'flowchart';
          newRoundStatus.mcq = 'completed';
          newRoundStatus.flowchart = 'active';
        } else if (completedRound === 'flowchart') {
          nextRound = 'coding';
          newRoundStatus.mcq = 'completed';
          newRoundStatus.flowchart = 'completed';
          newRoundStatus.coding = 'active';
        } else if (completedRound === 'coding') {
          nextRound = 'completed';
          newRoundStatus.mcq = 'completed';
          newRoundStatus.flowchart = 'completed';
          newRoundStatus.coding = 'completed';
          newRoundStatus.completed = 'active';
        }

        set({ currentRound: nextRound, roundStatus: newRoundStatus });
        if (userId) await supabase.from('exam_sessions').update({ current_round_slug: nextRound }).eq('user_id', userId);
      },

      logTabSwitch: async () => {
        const { tabSwitchCount, userId, competitionStatus } = get();
        if (competitionStatus !== 'active') return;
        const newCount = tabSwitchCount + 1;
        set({ tabSwitchCount: newCount });
        if (newCount >= 2) set({ competitionStatus: 'frozen' });
        if (userId) await supabase.from('exam_sessions').update({ tab_switches: newCount, status: newCount >= 2 ? 'frozen' : 'active' }).eq('user_id', userId);
      },

      incrementTabSwitch: async () => get().logTabSwitch(),

      freezeCompetition: async () => {
        set({ competitionStatus: 'frozen' });
        const { userId } = get();
        if (userId) await supabase.from('exam_sessions').update({ status: 'frozen' }).eq('user_id', userId);
      },

      unfreezeCompetition: () => {
        set({ competitionStatus: 'active' });
      },

      disqualifyUser: async () => {
        set({ competitionStatus: 'disqualified', currentRound: 'completed' });
        const { userId } = get();
        if (userId) await supabase.from('exam_sessions').update({ status: 'disqualified' }).eq('user_id', userId);
      },

      disqualify: async () => get().disqualifyUser(),
      resetCompetition: () => set(initialState),
    }),
    { name: 'cesa-storage' }
  )
);