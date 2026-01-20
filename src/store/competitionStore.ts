import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RoundStatus = 'locked' | 'active' | 'completed';
export type Round = 'rules' | 'mcq' | 'flowchart' | 'coding' | 'completed';

interface MCQAnswer {
  questionId: string;
  selectedOptions: number[];
  timeSpent: number;
}

interface FlowchartData {
  nodes: any[];
  edges: any[];
  submittedAt?: Date;
}

interface CodeSubmission {
  language: string;
  code: string;
  submittedAt: Date;
  verdict?: 'pending' | 'accepted' | 'wrong_answer' | 'tle' | 'compilation_error';
}

interface CompetitionState {
  isDisqualified: boolean;

  // User Info
  participantId: string | null;
  participantName: string | null;
  
  // Current State
  currentRound: Round;
  
  // Round Status
  roundStatus: Record<Round, RoundStatus>;
  
  // MCQ State
  mcqAnswers: MCQAnswer[];
  mcqStartTime: number | null;
  mcqTimeRemaining: number;
  tabSwitchCount: number;
  
  // Flowchart State
  flowchartData: FlowchartData | null;
  flowchartStartTime: number | null;
  
  // Coding State
  codeSubmissions: CodeSubmission[];
  codingStartTime: number | null;
  currentCode: string;
  currentLanguage: string;
  
  // Actions
  setParticipant: (id: string, name: string) => void;
  setCurrentRound: (round: Round) => void;
  completeRound: (round: Round) => void;
  
  // MCQ Actions
  setMCQAnswer: (answer: MCQAnswer) => void;
  startMCQ: () => void;
  decrementMCQTime: () => void;
  incrementTabSwitch: () => void;
  disqualify: () => void;
  

  
  // Flowchart Actions
  saveFlowchart: (data: FlowchartData) => void;
  startFlowchart: () => void;
  
  // Coding Actions
  setCurrentCode: (code: string) => void;
  setCurrentLanguage: (lang: string) => void;
  submitCode: (submission: CodeSubmission) => void;
  startCoding: () => void;
  
  // Reset
  resetCompetition: () => void;
}

const initialState = {
  isDisqualified: false,
  participantId: null,
  participantName: null,
  currentRound: 'rules' as Round,
  roundStatus: {
    rules: 'active' as RoundStatus,
    mcq: 'locked' as RoundStatus,
    flowchart: 'locked' as RoundStatus,
    coding: 'locked' as RoundStatus,
    completed: 'locked' as RoundStatus,
  },
  mcqAnswers: [],
  mcqStartTime: null,
  mcqTimeRemaining: 30 * 60, // 30 minutes
  tabSwitchCount: 0,
  flowchartData: null,
  flowchartStartTime: null,
  codeSubmissions: [],
  codingStartTime: null,
  currentCode: '',
  currentLanguage: 'python',
};

export const useCompetitionStore = create<CompetitionState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setParticipant: (id, name) => set({ participantId: id, participantName: name }),
      
      setCurrentRound: (round) => set({ currentRound: round }),
      
      completeRound: (round) => {
        const { roundStatus } = get();
        const newStatus = { ...roundStatus };
        newStatus[round] = 'completed';
        
        // Unlock next round
        const roundOrder: Round[] = ['rules', 'mcq', 'flowchart', 'coding', 'completed'];
        const currentIndex = roundOrder.indexOf(round);
        if (currentIndex < roundOrder.length - 1) {
          newStatus[roundOrder[currentIndex + 1]] = 'active';
        }
        
        set({
          roundStatus: newStatus,
          currentRound: currentIndex < roundOrder.length - 1 ? roundOrder[currentIndex + 1] : 'completed',
        });
      },
      
      // MCQ Actions
      setMCQAnswer: (answer) => set((state) => ({
        mcqAnswers: [
          ...state.mcqAnswers.filter(a => a.questionId !== answer.questionId),
          answer
        ]
      })),
      
      startMCQ: () => set({ mcqStartTime: Date.now() }),
      
      decrementMCQTime: () => set((state) => ({
        mcqTimeRemaining: Math.max(0, state.mcqTimeRemaining - 1)
      })),
      
      /*incrementTabSwitch: () => set((state) => ({
      tabSwitchCount: state.tabSwitchCount + 1
      })),*/

      //ayush code below, ek switch pe disqualify
   incrementTabSwitch: () =>
  set((state) => ({
    tabSwitchCount: state.tabSwitchCount + 1,
  })),

disqualify: () =>
  set((state) => ({
    isDisqualified: true,
    currentRound: 'completed',
    roundStatus: {
      ...state.roundStatus,
      mcq: 'completed',
      flowchart: 'completed',
      coding: 'completed',
      completed: 'active',
    },
  })),






      
      // Flowchart Actions
      saveFlowchart: (data) => set({ flowchartData: data }),
      
      startFlowchart: () => set({ flowchartStartTime: Date.now() }),
      
      // Coding Actions
      setCurrentCode: (code) => set({ currentCode: code }),
      
      setCurrentLanguage: (lang) => set({ currentLanguage: lang }),
      
      submitCode: (submission) => set((state) => ({
        codeSubmissions: [...state.codeSubmissions, submission]
      })),
      
      startCoding: () => set({ codingStartTime: Date.now() }),
      
      resetCompetition: () => set(initialState),
    }),
    {
      name: 'cesa-competition-storage',
    }
  )
);
