import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, RefreshCw, Terminal, CheckCircle2, XCircle, Clock, Code2, AlertCircle, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetitionTimer } from './CompetitionTimer';
import { useCompetitionStore } from '@/store/competitionStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- DATA ---
const languages = [
  { id: 'python', name: 'Python 3', extension: 'py' },
  { id: 'cpp', name: 'C++17', extension: 'cpp' },
  { id: 'java', name: 'Java 17', extension: 'java' },
  { id: 'javascript', name: 'JavaScript', extension: 'js' },
];

const defaultCode: Record<string, string> = {
  python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your code here\n        pass`,
  cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`,
  java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
  javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};`
};

const problemStatement = {
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
};

// --- COMPONENT ---
export const CodingRound = () => {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(defaultCode.python);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'case1' | 'case2'>('case1');
  const [consoleView, setConsoleView] = useState<'testcases' | 'result'>('testcases');
  const [runResult, setRunResult] = useState<any>(null);

  const { completeRound } = useCompetitionStore();

  useEffect(() => {
    setCode(defaultCode[language] || '');
  }, [language]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setConsoleView('result');
    // Mock Execution
    await new Promise(resolve => setTimeout(resolve, 1200));
    setRunResult({ status: 'Accepted', runtime: '42ms' });
    setIsRunning(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Evaluating Solution...");

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Log submission data (store methods would be called here if they existed)
    console.log('Code submitted:', { language, code, submittedAt: new Date(), verdict: 'accepted' });

    toast.success("Solution Accepted!", { id: toastId });
    setTimeout(() => {
      completeRound('coding');
    }, 1000);

    setIsSubmitting(false);
  }, [code, language, completeRound]);

  const handleTimeUp = useCallback(() => {
    toast.error("Time Up! Auto-submitting...");
    handleSubmit();
  }, [handleSubmit]);

  return (
    // MAIN CONTAINER: Fixed Height, split logic
    <div className="flex gap-3 h-[calc(100vh-6rem)] w-full animate-in fade-in duration-500 overflow-hidden">

      {/* --- LEFT PANE: PROBLEM STATEMENT (40%) --- */}
      <div className="w-[40%] flex flex-col bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-white truncate">{problemStatement.title}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
              {problemStatement.difficulty}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-zinc-300 whitespace-pre-line leading-7">{problemStatement.description}</p>

            <h3 className="text-white font-bold mt-6 mb-3 flex items-center gap-2 text-sm">
              <Code2 className="w-4 h-4 text-blue-500" /> Examples
            </h3>
            <div className="space-y-4">
              {problemStatement.examples.map((ex, i) => (
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
              {problemStatement.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* --- RIGHT PANE: EDITOR + CONSOLE (60%) --- */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* TOP: EDITOR AREA */}
        <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden relative">
          {/* Timer Bar - Prominent display at the top */}
          <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2 shrink-0">
            <CompetitionTimer totalSeconds={60 * 60} onTimeUp={handleTimeUp} />
          </div>

          {/* Toolbar */}
          <div className="h-10 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-2 shrink-0">
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[120px] h-7 bg-zinc-900 border-zinc-700 text-xs text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                  {languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[120px]" /> {/* Spacer for balance */}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={(v) => setCode(v || '')}
              theme="vs-dark"
              options={{
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
        <div className="h-[180px] bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col shrink-0">
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
              <Button size="sm" variant="secondary" onClick={handleRun} disabled={isRunning} className="h-6 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700">
                {isRunning ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />} Run
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="h-6 text-xs bg-green-700 hover:bg-green-600 text-white border border-green-600">
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>

          {/* Console Body */}
          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar font-mono text-xs">
            {consoleView === 'testcases' ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('case1')} className={cn("px-3 py-1 rounded border transition-colors", activeTab === 'case1' ? "bg-zinc-800 border-zinc-600 text-white" : "text-zinc-500 border-zinc-800 hover:bg-zinc-900")}>Case 1</button>
                  <button onClick={() => setActiveTab('case2')} className={cn("px-3 py-1 rounded border transition-colors", activeTab === 'case2' ? "bg-zinc-800 border-zinc-600 text-white" : "text-zinc-500 border-zinc-800 hover:bg-zinc-900")}>Case 2</button>
                </div>
                <div className="space-y-2">
                  <div className="text-zinc-500">Input:</div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300">
                    {activeTab === 'case1' ? 'nums = [2,7,11,15], target = 9' : 'nums = [3,2,4], target = 6'}
                  </div>
                  <div className="text-zinc-500">Expected Output:</div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300">
                    {activeTab === 'case1' ? '[0, 1]' : '[1, 2]'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {isRunning ? (
                  <div className="text-zinc-400 animate-pulse">Running code against test cases...</div>
                ) : runResult ? (
                  <div>
                    <div className="text-lg font-bold text-green-500 mb-2">Accepted</div>
                    <div className="text-zinc-400">Runtime: <span className="text-white">{runResult.runtime}</span></div>
                    <div className="mt-4 p-2 bg-green-900/10 border border-green-900/30 rounded text-green-400">
                      All sample test cases passed successfully.
                    </div>
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