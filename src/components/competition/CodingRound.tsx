import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, RefreshCw, Terminal, CheckCircle2, XCircle, Clock, Code2, AlertCircle, Cpu, FileJson, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetitionTimer } from './CompetitionTimer';
import { useCompetitionStore } from '@/store/competitionStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- DATA ---
const languages = [
  { id: 'python', name: 'Python 3', extension: 'py' },
  { id: 'cpp', name: 'C++17', extension: 'cpp' },
  { id: 'c', name: 'C (GCC)', extension: 'c' },
  { id: 'java', name: 'Java 17', extension: 'java' },
  { id: 'javascript', name: 'JavaScript', extension: 'js' },
];

const problems = {
  'two-sum': {
    title: '1. Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    defaultCode: {
      python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your code here\n        pass`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`,
      c: `/**\n * Note: The returned array must be malloced, assume caller calls free().\n */\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    \n}`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};`
    }
  },
  'binary-search': {
    title: '2. Binary Search',
    difficulty: 'Easy',
    description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.`,
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1' },
    ],
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All the integers in nums are unique.', 'nums is sorted in ascending order.'],
    defaultCode: {
      python: `class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        # Write your code here\n        pass`,
      cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};`,
      c: `int search(int* nums, int numsSize, int target) {\n    \n}`,
      java: `class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    \n};`
    }
  }
};

type ProblemId = keyof typeof problems;

// --- COMPONENT ---
export const CodingRound = ({ isSidebarExpanded = false }: { isSidebarExpanded?: boolean }) => {
  const [activeProblemId, setActiveProblemId] = useState<ProblemId>('two-sum');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // We store the state for EACH problem id
  const [solutions, setSolutions] = useState<Record<ProblemId, {
    code: string;
    language: string;
    isLocked: boolean;
    runResult: any;
    consoleView: 'testcases' | 'result';
    activeTab: 'case1' | 'case2';
  }>>({
    'two-sum': {
      code: problems['two-sum'].defaultCode.python,
      language: 'python',
      isLocked: false,
      runResult: null,
      consoleView: 'testcases',
      activeTab: 'case1'
    },
    'binary-search': {
      code: problems['binary-search'].defaultCode.python,
      language: 'python',
      isLocked: false,
      runResult: null,
      consoleView: 'testcases',
      activeTab: 'case1'
    }
  });

  const { completeRound, email } = useCompetitionStore();

  const currentProblem = problems[activeProblemId];
  const activeSolution = solutions[activeProblemId];

  // Derived state for current view
  const code = activeSolution.code;
  const language = activeSolution.language;
  const isLocked = activeSolution.isLocked;
  const runResult = activeSolution.runResult;
  const consoleView = activeSolution.consoleView;
  const activeTab = activeSolution.activeTab;

  // -- UPDATER HELPERS --
  const updateSolution = (updates: Partial<typeof activeSolution>) => {
    setSolutions(prev => ({
      ...prev,
      [activeProblemId]: { ...prev[activeProblemId], ...updates }
    }));
  };

  const setActiveTab = (tab: 'case1' | 'case2') => updateSolution({ activeTab: tab });

  const setCode = (newCode: string) => updateSolution({ code: newCode });
  const setLanguage = (newLang: string) => {
    // If locked, we shouldn't be here (UI disabled), but safe guard
    if (isLocked) return;

    // When changing language, we set to default code for that language IF it was empty or default?
    // Or just reset to default for that language to avoid syntax errors?
    // Requirement: "user select C in 2sums -> writes code -> lock then that tab should lock on C... same is in binary search... switching... shouldn't clear"
    // So when Switching Tab (activeProblemId changes), we load save state.
    // But when active tab is SAME, and we change Language, we usually reset code to template.
    const defaultCode = currentProblem.defaultCode[newLang as keyof typeof currentProblem.defaultCode] || '';
    updateSolution({ language: newLang, code: defaultCode, runResult: null });
  };

  const setRunResult = (res: any) => updateSolution({ runResult: res });
  const setConsoleView = (view: 'testcases' | 'result') => updateSolution({ consoleView: view });

  // No useEffect for resetting anymore! State is derived from solutions[activeProblemId].

  const toggleLock = () => {
    const nextLocked = !isLocked;
    updateSolution({ isLocked: nextLocked });
    if (nextLocked) toast.success(`Locked ${currentProblem.title}`);
    else toast.info(`Unlocked ${currentProblem.title}`);
  };

  // --- SUBMISSION STATE ---
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitStats, setSubmitStats] = useState<{ score: number; details: string; outcomes: string[] } | null>(null);

  const executeResult = async (probId: ProblemId, isSubmission: boolean) => {
    const sol = solutions[probId];
    try {
      const response = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sol.code,
          language: sol.language,
          problemId: probId,
          teamName: email || 'Anonymous',
          isSubmission,
        }),
      });
      return await response.json();
    } catch (e) {
      return { status: 'Error', output: 'Network Error', results: [], score: 0 };
    }
  };

  const executeCode = async (isSubmission: boolean, skipConfirm: boolean = false) => {
    const loadingState = isSubmission ? setIsSubmitting : setIsRunning;
    loadingState(true);

    const toastId = isSubmission ? toast.loading("Evaluating Solution...") : null;

    try {
      // If just running, only run ACTIVE problem
      if (!isSubmission) {
        const data = await executeResult(activeProblemId, false);
        setRunResult(data);
        loadingState(false);
        return;
      }

      // SUBMISSION LOGIC (Both Problems)
      const p1 = await executeResult('two-sum', true);
      const p2 = await executeResult('binary-search', true);

      // Update local states so user sees results if they switch tabs
      setSolutions(prev => ({
        ...prev,
        'two-sum': { ...prev['two-sum'], runResult: p1 },
        'binary-search': { ...prev['binary-search'], runResult: p2 }
      }));

      const p1Score = parseFloat(p1.score || 0);
      const p2Score = parseFloat(p2.score || 0);
      const totalScore = (p1Score + p2Score) / 2;

      // If triggered by Time Up (skipConfirm), submit immediately
      if (skipConfirm) {
        toast.success(`Time's Up! Submitted with Score: ${totalScore}/100`, { id: toastId });
        await new Promise(resolve => setTimeout(resolve, 1000));
        completeRound('coding');
        return;
      }

      // Manual Submission - ALWAYS ASK CONFIRMATION (even if perfect)
      const details = `Two Sum: ${p1.status}, Binary Search: ${p2.status}`;
      const outcomes = [
        `Two Sum: ${p1.status} (${p1Score}pts)`,
        `Binary Search: ${p2.status} (${p2Score}pts)`
      ];

      setSubmitStats({ score: totalScore, details, outcomes });
      setShowSubmitConfirm(true);
      toast.dismiss(toastId);

    } catch (error) {
      console.error("Execution Error:", error);
      if (isSubmission) toast.error("Execution failed due to network error", { id: toastId });
    } finally {
      loadingState(false);
    }
  };

  const handleRun = () => executeCode(false);

  // Submit is only allowed if BOTH problems are locked
  const canSubmit = solutions['two-sum'].isLocked && solutions['binary-search'].isLocked;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("You must Lock code for BOTH problems before submitting.");
      return;
    }
    await executeCode(true, false);
  };

  const handleConfirmSubmit = () => {
    completeRound('coding');
    setShowSubmitConfirm(false);
  };

  // handleReset is now handled inline in AlertDialog

  const handleTimeUp = useCallback(() => {
    toast.error("Time Up! Locking and Submitting...");
    setSolutions(prev => ({
      ...prev,
      'two-sum': { ...prev['two-sum'], isLocked: true },
      'binary-search': { ...prev['binary-search'], isLocked: true }
    }));
    // Force submit current with skipConfirm = true
    executeCode(true, true);
  }, []);

  return (
    // MAIN CONTAINER: h-full to fit parent, no calc() needed
    <div className="flex gap-3 h-full w-full animate-in fade-in duration-500 overflow-hidden">

      {/* --- LEFT PANE: PROBLEM STATEMENT (Dynamic Width) --- */}
      <div className={cn(
        "flex flex-col bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden transition-all duration-500 ease-in-out",
        isSidebarExpanded ? "w-[40%]" : "w-[50%]"
      )}>
        {/* Header with Tabs for Problems */}
        <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 justify-between shrink-0">
          <Tabs value={activeProblemId} onValueChange={(v) => setActiveProblemId(v as ProblemId)} className="w-full">
            <TabsList className="bg-zinc-800/50">
              <TabsTrigger value="two-sum" className="text-xs">1. Two Sum</TabsTrigger>
              <TabsTrigger value="binary-search" className="text-xs">2. Binary Search</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold text-white truncate">{currentProblem.title}</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
            {currentProblem.difficulty}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-zinc-300 whitespace-pre-line leading-7">{currentProblem.description}</p>

            <h3 className="text-white font-bold mt-6 mb-3 flex items-center gap-2 text-sm">
              <Code2 className="w-4 h-4 text-blue-500" /> Examples
            </h3>
            <div className="space-y-4">
              {currentProblem.examples.map((ex, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono">
                  <div className="mb-1"><span className="text-zinc-500">Input:</span> <span className="text-zinc-300">{ex.input}</span></div>
                  <div className="mb-1"><span className="text-zinc-500">Output:</span> <span className="text-zinc-300">{ex.output}</span></div>
                  <div className="text-zinc-500 italic border-t border-zinc-800 pt-1 mt-1">{ex.explanation}</div>
                </div>
              ))}
            </div>

            <h3 className="text-white font-bold mt-6 mb-3 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-yellow-500" /> Constraints
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-xs font-mono">
              {currentProblem.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* --- RIGHT PANE: EDITOR + CONSOLE (60%) --- */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">

        {/* TOP: EDITOR AREA */}
        <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden relative">
          {/* Timer Bar - Prominent display at the top */}
          <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2 shrink-0">
            <CompetitionTimer totalSeconds={60 * 60} onTimeUp={handleTimeUp} />
          </div>

          {/* Toolbar */}
          <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-3 shrink-0">
            {/* Left Actions: Language + Reset + Lock */}
            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={setLanguage} disabled={isLocked}>
                <SelectTrigger className="w-[120px] h-7 bg-zinc-900 border-zinc-700 text-xs text-zinc-300 focus:ring-0 focus:ring-offset-0 disabled:opacity-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                  {languages.map(l => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* LOCK BUTTON */}
              <button
                onClick={toggleLock}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all border",
                  isLocked
                    ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                    : "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                )}
                title={isLocked ? "Unlock Code" : "Lock Code"}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {isLocked ? "Locked" : "Lock Code"}
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={isLocked}
                    title={isLocked ? "Unlock to Reset" : "Reset Code"}
                    className="text-zinc-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Code?</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                      This will revert your current code to the default template.
                      <strong className="block mt-2 text-red-400">All your changes will be lost.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      const defaultValue = currentProblem.defaultCode[language as keyof typeof currentProblem.defaultCode] || '';
                      // Use updateSolution directly for cleaner atomic update
                      updateSolution({ code: defaultValue, runResult: null, consoleView: 'testcases', activeTab: 'case1' });
                      toast.info("Code reset to default template");
                    }} className="bg-red-600 text-white hover:bg-red-700 border-red-600">
                      Yes, Reset Code
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* PARTIAL SUBMISSION CONFIRMATION DIALOG */}
              <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-yellow-500 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Confirm Submission
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400 space-y-3">
                      <p>You have evaluated your code. Here are the results:</p>

                      <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-1 font-mono text-xs">
                        {submitStats?.outcomes.map((o, i) => <div key={i}>{o}</div>)}
                        <div className="border-t border-zinc-800 mt-2 pt-2 font-bold text-white">Total Score: {submitStats?.score}/100</div>
                      </div>

                      <p>Are you ready to finalize this submission?</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white">
                      Keep Working
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmSubmit} className="bg-yellow-600 text-white hover:bg-yellow-700 border-yellow-600">
                      Yes, Submit Implementation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold select-none">
              {isLocked ? "READ-ONLY" : "EDIT MODE"}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              key={`${activeProblemId}-${language}`} // Force remount on problem change to prevent state bleeding
              height="100%"
              path={`${activeProblemId}.${language === 'cpp' ? 'cpp' : language}`} // Unique model path
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={(v) => !isLocked && setCode(v || '')}
              theme="vs-dark"
              options={{
                readOnly: isLocked, // READ ONLY WHEN LOCKED
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                cursorBlinking: 'smooth',
                lineNumbersMinChars: 3,
              }}
            />
          </div>
        </div>

        {/* BOTTOM: CONSOLE / TEST CASES */}
        <div className="h-[240px] bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col shrink-0">
          {/* Console Header */}
          <div className="h-9 border-b border-zinc-800 flex items-center justify-between px-2 bg-zinc-950/50">
            <div className="flex gap-1">
              <button
                onClick={() => setConsoleView('testcases')}
                className={cn("px-3 py-1 text-xs rounded-t-md font-medium transition-colors border-b-2", consoleView === 'testcases' ? "text-white border-blue-500 bg-zinc-800/50" : "text-zinc-500 border-transparent hover:text-zinc-300")}
              >
                <span className="flex items-center gap-2"><Terminal className="w-3 h-3" /> Test Cases</span>
              </button>
              <button
                onClick={() => setConsoleView('result')}
                className={cn("px-3 py-1 text-xs rounded-t-md font-medium transition-colors border-b-2", consoleView === 'result' ? "text-white border-green-500 bg-zinc-800/50" : "text-zinc-500 border-transparent hover:text-zinc-300")}
              >
                <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> Run Result</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleRun} disabled={isRunning || isSubmitting} className="h-6 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700">
                {isRunning ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />} Run
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || isRunning || !canSubmit} className={cn("h-6 text-xs border transition-all", canSubmit ? "bg-green-700 hover:bg-green-600 text-white border-green-600" : "bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed")}>
                {isSubmitting ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                {canSubmit ? "Submit" : "Lock Both to Submit"}
              </Button>
            </div>
          </div>

          {/* Console Body */}
          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar font-mono text-xs bg-zinc-900">
            {consoleView === 'testcases' ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('case1')}
                    className={cn(
                      "px-3 py-1 rounded border transition-colors flex items-center gap-2",
                      activeTab === 'case1' ? "bg-zinc-800 border-zinc-600 text-white" : "text-zinc-500 border-zinc-800 hover:bg-zinc-900"
                    )}>
                    {runResult?.results?.[0]?.status === 'Accepted' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    {runResult?.results?.[0]?.status === 'Wrong Answer' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    Case 1
                  </button>
                  <button onClick={() => setActiveTab('case2')}
                    className={cn(
                      "px-3 py-1 rounded border transition-colors flex items-center gap-2",
                      activeTab === 'case2' ? "bg-zinc-800 border-zinc-600 text-white" : "text-zinc-500 border-zinc-800 hover:bg-zinc-900"
                    )}>
                    {runResult?.results?.[1]?.status === 'Accepted' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    {runResult?.results?.[1]?.status === 'Wrong Answer' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    Case 2
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status if available */}
                  {runResult && (
                    <div className="mb-2">
                      {(() => {
                        const result = runResult.results?.[activeTab === 'case1' ? 0 : 1];
                        if (!result) return null;
                        if (result.status === 'Accepted') return <span className="text-green-500 font-bold">Accepted</span>;
                        if (result.status === 'Wrong Answer') return <span className="text-red-500 font-bold">Wrong Answer</span>;
                        return <span className="text-red-400 font-bold">Runtime Error</span>
                      })()}
                    </div>
                  )}

                  {/* Display Test Cases dynamically based on Problem */}
                  <div>
                    <div className="text-zinc-500 mb-1">Input:</div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300 font-mono">
                      {activeTab === 'case1' ? currentProblem.examples[0].input : currentProblem.examples[1].input}
                    </div>
                  </div>

                  <div>
                    <div className="text-zinc-500 mb-1">Expected Output:</div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300 font-mono">
                      {activeTab === 'case1' ? currentProblem.examples[0].output : currentProblem.examples[1].output}
                    </div>
                  </div>

                  {/* Show ACTUAL output if available */}
                  {runResult && (
                    <div className="animate-in fade-in duration-300">
                      <div className="text-zinc-500 mb-1">Actual Output:</div>
                      <div className={cn(
                        "p-2 rounded border border-zinc-800 font-mono",
                        (() => {
                          const result = runResult.results?.[activeTab === 'case1' ? 0 : 1];
                          if (!result) return "bg-zinc-950 text-zinc-500";
                          return result.status === 'Accepted' ? "bg-green-950/10 text-green-300 border-green-900/30" : "bg-red-950/10 text-red-300 border-red-900/30";
                        })()
                      )}>
                        {(() => {
                          const result = runResult.results?.[activeTab === 'case1' ? 0 : 1];
                          if (!result) return <span className="italic opacity-50">Not executed yet</span>;
                          if (result.error) return result.error; // Show runtime errors if any
                          return result.actual;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {isRunning || isSubmitting ? (
                  <div className="text-zinc-400 animate-pulse">Running code on Judge0...</div>
                ) : runResult ? (
                  <div className="space-y-4">
                    {/* OVERALL STATUS */}
                    <div className="flex items-center gap-4">
                      <div className={cn("text-lg font-bold", runResult.status === 'Accepted' ? "text-green-500" : "text-red-500")}>
                        {runResult.status}
                      </div>
                      {runResult.score && (
                        <div className="text-sm px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">
                          Score: <span className={runResult.score === "100.00" ? "text-green-400" : "text-yellow-400"}>{runResult.score}</span> / 100
                        </div>
                      )}
                      <div className="text-zinc-500 text-xs">
                        Time: {runResult.metrics?.time ? runResult.metrics.time.toFixed(2) : 0}ms
                      </div>
                    </div>

                    {/* ERROR OUTPUT */}
                    {(runResult.status === 'Compilation Error' || runResult.status === 'Runtime Error') && (
                      <div className="bg-red-950/20 border border-red-900/50 p-3 rounded text-red-300 whitespace-pre-wrap font-mono text-[11px]">
                        {runResult.output}
                      </div>
                    )}

                    {/* TEST CASE RESULTS */}
                    {runResult.results && runResult.results.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-zinc-400 font-bold mb-2">Test Results:</h4>
                        {runResult.results.map((res: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-2 bg-zinc-950 rounded border border-zinc-800">
                            <div className="mt-0.5">
                              {res.status === 'Accepted' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between">
                                <span className={cn("font-bold", res.status === 'Accepted' ? "text-green-400" : "text-red-400")}>Test Case {idx + 1}</span>
                                {res.input === 'Hidden' && <span className="text-xs text-zinc-600 bg-zinc-900 px-1 rounded">Hidden</span>}
                              </div>
                              {res.input !== 'Hidden' && (
                                <>
                                  <div className="text-zinc-500">Input: <span className="text-zinc-300">{JSON.stringify(res.params)}</span></div>
                                  <div className="text-zinc-500">Expected: <span className="text-zinc-300">{res.expected}</span></div>
                                  <div className="text-zinc-500">Actual: <span className={res.status === 'Accepted' ? "text-green-300" : "text-red-300"}>{res.actual}</span></div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-600 italic">Run your code to see the output here.</div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};