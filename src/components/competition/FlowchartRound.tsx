import React, { useCallback, useState, useEffect } from 'react';
import { Tldraw, Editor, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';
import { Send, RotateCcw, CheckCircle2, Loader2, BrainCircuit, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompetitionTimer } from './CompetitionTimer';
import { useCompetitionStore } from '@/store/competitionStore';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- TYPES ---
interface FlowchartProblem {
  id: string;
  title: string;
  description: string;
  requirements: string[];
}

// --- SUB-COMPONENT: EDITOR CONTROLLER ---
const EditorController = ({ onMount }: { onMount: (editor: Editor) => void }) => {
  const editor = useEditor();
  useEffect(() => { if (editor) onMount(editor); }, [editor, onMount]);
  return null;
}

// --- MAIN COMPONENT ---
export const FlowchartRound = () => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activeProblem, setActiveProblem] = useState<FlowchartProblem | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ score: number } | null>(null);

  const { completeRound, userId, startFlowchart, flowchartStartTime } = useCompetitionStore();

  // 1. Fetch Active Problem
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const { data, error } = await supabase
          .from('flowchart_problems')
          .select('*')
          .eq('is_active', true)
          .single();

        if (data) setActiveProblem(data);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoadingProblem(false);
      }
    };

    fetchProblem();
    if (!flowchartStartTime) startFlowchart();
  }, [startFlowchart, flowchartStartTime]);

  // 2. Handle Editor Mount
  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
    // Set dark mode via user preferences
    editorInstance.user.updateUserPreferences({ colorScheme: 'dark' });
  }, []);

  // 3. Reset Canvas
  const handleReset = useCallback(() => {
    if (editor) {
      editor.selectAll();
      editor.deleteShapes(editor.getSelectedShapeIds());
      toast.info("Canvas Cleared");
    }
  }, [editor]);

  // 4. FAIL-SAFE SUBMIT LOGIC
  const handleSubmit = useCallback(async () => {
    if (!userId || !activeProblem || !editor) {
      toast.error("System Error: Editor not ready.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Saving & Analyzing...");

    try {
      // 1. Get Tldraw Data
      const records = editor.store.allRecords();

      // Filter for shapes (nodes) and bindings (edges)
      const nodesData = records.filter(r => r.typeName === 'shape');
      const edgesData = records.filter(r => r.typeName === 'binding' || (r.typeName === 'shape' && r.type === 'arrow'));

      // 2. Save to DB (Primary Step)
      const { data: submission, error: dbError } = await supabase
        .from('flowchart_submissions')
        .insert({
          user_id: userId,
          problem_id: activeProblem.id,
          nodes: nodesData,
          edges: edgesData,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw new Error(`DB Save Failed: ${dbError.message}`);

      // 3. Try Calling AI (Secondary Step)
      try {
        const { data: responseData, error: invokeError } = await supabase.functions.invoke('evaluate-flowchart', {
          body: { submission_id: submission.id }
        });

        if (invokeError) throw invokeError;

        if (responseData?.success) {
          // AI Success
          setAiFeedback(responseData.data);
          toast.success(`Score: ${responseData.data.score}/100`, { id: toastId });
        } else {
          throw new Error("AI Logic Error");
        }

      } catch (aiError) {
        // ⚠️ FAIL-SAFE: If AI fails, DO NOT BLOCK USER
        console.warn("AI Evaluation Failed (Skipping):", aiError);
        toast.warning("AI busy. Submitted for Manual Review.", { id: toastId });

        // Mark for manual review in DB silently
        await supabase.from('flowchart_submissions')
          .update({ status: 'manual_review' })
          .eq('id', submission.id);
      }

      // 4. Always Move Forward
      setTimeout(() => {
        completeRound('flowchart');
        toast.success('Round 2 Complete! Loading Coding Round...');
      }, 1500);

    } catch (err: any) {
      console.error("Critical Submission Error:", err);
      // Only stop if the Database Save itself failed
      toast.error(`Submission Error: ${err.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }, [editor, userId, activeProblem, completeRound]);

  // Loading States
  if (loadingProblem) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs font-mono">Initializing Whiteboard...</p>
      </div>
    );
  }

  if (!activeProblem) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h2 className="text-lg font-bold text-white">Module Offline</h2>
        <p className="text-sm">Waiting for admin activation.</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr,300px] gap-6 h-full animate-in fade-in duration-500">

      {/* LEFT: Canvas Area */}
      <div className="flex flex-col gap-4 h-full relative">

        {/* Header Overlay */}
        <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex justify-between items-start backdrop-blur-md pointer-events-auto shadow-2xl">
            <div>
              <h2 className="font-bold text-white text-lg">{activeProblem.title}</h2>
              <p className="text-xs text-zinc-400 max-w-xl mt-1">{activeProblem.description}</p>
            </div>
            {aiFeedback && (
              <div className="text-right">
                <p className="text-[10px] uppercase text-zinc-500 font-bold">Score</p>
                <p className="text-2xl font-mono font-bold text-blue-400">{aiFeedback.score}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas (TLDRAW) */}
        <div className="flex-1 border border-zinc-800 rounded-xl overflow-hidden bg-[#0a0a0a] relative min-h-[500px]">
          {isSubmitting && (
            <div className="absolute inset-0 z-[1000] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
              <BrainCircuit className="w-16 h-16 text-blue-500 animate-pulse mb-3" />
              <h3 className="text-xl font-bold text-white">AI Analysis in Progress...</h3>
              <p className="text-zinc-400 text-sm font-mono mt-2">Reading logic structure...</p>
            </div>
          )}

          <div className="absolute inset-0 tldraw-custom-wrapper">
            <Tldraw
              persistenceKey={`flowchart-${userId}`}
              hideUi={false}
              onMount={handleMount}
            >
              <EditorController onMount={handleMount} />
            </Tldraw>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-zinc-500 hover:text-white hover:bg-red-900/20">
            <RotateCcw className="w-4 h-4 mr-2" /> Clear Canvas
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 shadow-lg shadow-blue-900/20">
            {isSubmitting ? 'Evaluating...' : 'Submit Logic'} <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* RIGHT: Stats & Requirements */}
      <div className="flex flex-col gap-4">
        <CompetitionTimer totalSeconds={45 * 60} onTimeUp={handleSubmit} />

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Requirements
          </h3>
          <ul className="space-y-3">
            {activeProblem.requirements.map((req, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-start gap-3 bg-zinc-800/30 p-2 rounded border border-zinc-800">
                <span className="text-blue-500 font-mono text-xs mt-0.5">0{i + 1}</span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex-1">
          <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Canvas Guide</h3>
          <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4">
            <li>Use <span className="text-white font-bold">Shapes</span> from the toolbar.</li>
            <li>Connect using the <span className="text-white font-bold">Arrow</span> tool.</li>
            <li>Double click to add text.</li>
            <li>Right click to delete or duplicate.</li>
          </ul>
        </div>
      </div>

    </div>
  );
};