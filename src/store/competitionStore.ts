import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';

// --- TYPES ---
export type RoundStatus = 'locked' | 'active' | 'completed';
export type Round = 'rules' | 'waiting' | 'mcq' | 'flowchart' | 'coding' | 'completed';
export type CompetitionStatus = 'active' | 'frozen' | 'disqualified';

interface CompetitionState {
  // Local UI State
  competitionStatus: CompetitionStatus;
  currentRound: Round;
  roundStatus: Record<Round, RoundStatus>;
  
  // User Data
  userId: string | null;
  email: string | null;
  
  // Security
  tabSwitchCount: number;
  
  // --- ACTIONS ---
  initializeUser: (userId: string, email: string) => Promise<void>;
  acceptRules: () => Promise<void>;
  startRound1: () => void;
  
  // ✅ NEW: Realtime Sync Action
  syncSession: (data: any) => void;

  // Security Actions
  logTabSwitch: () => Promise<void>;
  freezeCompetition: () => Promise<void>;
  unfreezeCompetition: () => void;
  disqualifyUser: () => Promise<void>;
  
  // Reset
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
  userId: null,
  email: null,
};

export const useCompetitionStore = create<CompetitionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 1. LOGIN & INIT SESSION
      initializeUser: async (userId, email) => {
        set({ userId, email });
        
        // Fetch latest state from DB (Source of Truth)
        const { data } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (data) {
          // Restore exact state from DB
          set({ 
            competitionStatus: data.status,
            currentRound: data.current_round_slug as Round,
            tabSwitchCount: data.tab_switches || 0,
            // Update round status map based on current round
            roundStatus: {
                ...get().roundStatus,
                [data.current_round_slug]: 'active'
            }
          });
        } else {
          // New User: Create session
          await supabase.from('exam_sessions').insert({
            user_id: userId,
            email: email,
            status: 'active',
            current_round_slug: 'rules'
          });
        }
      },

      // ✅ SAFE SYNC: Updates local state when Admin changes DB
      syncSession: (data) => {
        console.log("⚡ Syncing Session State:", data);
        set({
            competitionStatus: data.status,
            currentRound: data.current_round_slug as Round,
            tabSwitchCount: data.tab_switches
        });
      },

      // 2. RULES ACCEPTED -> GO TO WAITING ROOM
      acceptRules: async () => {
        const { userId } = get();
        set({ 
          currentRound: 'waiting',
          roundStatus: { ...get().roundStatus, rules: 'completed', waiting: 'active' }
        });

        if (userId) {
          await supabase.from('exam_sessions')
            .update({ current_round_slug: 'waiting' })
            .eq('user_id', userId);
            
          await supabase.from('activity_logs').insert({
            user_id: userId,
            action_type: 'RULES_ACCEPTED',
            details: { timestamp: new Date().toISOString() }
          });
        }
      },

      // 3. ADMIN STARTS EXAM (Used for local fallback)
      startRound1: () => {
        set({ 
          currentRound: 'mcq',
          roundStatus: { ...get().roundStatus, waiting: 'completed', mcq: 'active' }
        });
      },

      // 4. SECURITY: TAB SWITCH LOGGING
      logTabSwitch: async () => {
        const { tabSwitchCount, userId, competitionStatus } = get();
        // If already DQ or Frozen locally, don't spam DB
        if (competitionStatus !== 'active') return;

        const newCount = tabSwitchCount + 1;
        set({ tabSwitchCount: newCount });

        // Local Freeze Logic (Immediate Feedback)
        if (newCount >= 2) {
           set({ competitionStatus: 'frozen' });
        }

        if (userId) {
          await supabase.from('activity_logs').insert({
            user_id: userId,
            action_type: 'TAB_SWITCH',
            severity: 'warning',
            details: { count: newCount, timestamp: new Date().toISOString() }
          });
          
          await supabase.from('exam_sessions')
            .update({ 
                tab_switches: newCount,
                status: newCount >= 2 ? 'frozen' : 'active' 
            })
            .eq('user_id', userId);
        }
      },

      freezeCompetition: async () => {
        set({ competitionStatus: 'frozen' });
        const { userId } = get();
        if (userId) {
            await supabase.from('exam_sessions').update({ status: 'frozen' }).eq('user_id', userId);
        }
      },

      unfreezeCompetition: () => {
        set({ competitionStatus: 'active' });
      },

      disqualifyUser: async () => {
        set({ competitionStatus: 'disqualified', currentRound: 'completed' });
        const { userId } = get();
        if (userId) {
            await supabase.from('exam_sessions').update({ status: 'disqualified', is_disqualified: true }).eq('user_id', userId);
            await supabase.from('activity_logs').insert({
                user_id: userId,
                action_type: 'DISQUALIFIED',
                severity: 'critical',
                details: { reason: 'Cheat Detection' }
            });
        }
      },

      resetCompetition: () => set(initialState),
    }),
    { name: 'cesa-storage' }
  )
);