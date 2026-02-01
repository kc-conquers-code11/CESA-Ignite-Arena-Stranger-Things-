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
          set({
            competitionStatus: data.status,
            currentRound: data.current_round_slug as Round,
            tabSwitchCount: data.tab_switches || 0,
            roundStatus: { ...get().roundStatus, [data.current_round_slug]: 'active' }
          });
        } else {
          await supabase.from('exam_sessions').insert({ user_id: userId, email: email, status: 'active', current_round_slug: 'rules' });
        }
      },

      syncSession: (data) => {
        console.log("⚡ Session Sync:", data);
        set({ competitionStatus: data.status, currentRound: data.current_round_slug as Round, tabSwitchCount: data.tab_switches });
      },

      acceptRules: async () => {
        const { userId } = get();
        set({ currentRound: 'waiting', roundStatus: { ...get().roundStatus, rules: 'completed', waiting: 'active' } });
        if (userId) await supabase.from('exam_sessions').update({ current_round_slug: 'waiting' }).eq('user_id', userId);
      },

      startMCQ: () => {
        if (!get().mcqStartTime) set({ mcqStartTime: Date.now() });
      },

      startFlowchart: () => {
        if (!get().flowchartStartTime) set({ flowchartStartTime: Date.now() });
      },

      startRound1: () => {
        set({ currentRound: 'mcq', roundStatus: { ...get().roundStatus, waiting: 'completed', mcq: 'active' } });
        get().startMCQ();
      },

      completeRound: async (completedRound) => {
        const { userId } = get();
        let nextRound: Round = 'completed';
        if (completedRound === 'mcq') nextRound = 'flowchart';
        else if (completedRound === 'flowchart') nextRound = 'coding';
        else if (completedRound === 'coding') nextRound = 'completed';

        set({ currentRound: nextRound, roundStatus: { ...get().roundStatus, [completedRound]: 'completed', [nextRound]: 'active' } });
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