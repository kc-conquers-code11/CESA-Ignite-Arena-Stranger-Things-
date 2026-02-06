import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  BackgroundVariant,
  ReactFlowProvider,
  MarkerType,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Send, RotateCcw, CheckCircle2, Loader2, BrainCircuit, AlertCircle, MousePointer2, Save, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompetitionTimer } from './CompetitionTimer';
import { RoundTransition } from './RoundTransition';
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

// --- CUSTOM NODES ---
const handleStyle = { width: 8, height: 8, background: '#fff', border: '1px solid #777' };

const StartNode = ({ data }: any) => (
  <div className="px-4 py-2 rounded-full bg-green-900/40 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] text-green-100 text-xs font-bold min-w-[100px] text-center">
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
    {data.label}
  </div>
);

const EndNode = ({ data }: any) => (
  <div className="px-4 py-2 rounded-full bg-red-900/40 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] text-red-100 text-xs font-bold min-w-[100px] text-center">
    <Handle type="target" position={Position.Top} style={handleStyle} />
    {data.label}
  </div>
);

const ProcessNode = ({ data }: any) => (
  <div className="px-4 py-3 rounded-md bg-blue-900/40 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)] text-blue-100 text-xs font-medium min-w-[120px] text-center">
    <Handle type="target" position={Position.Top} style={handleStyle} />
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
    {data.label}
  </div>
);

const DecisionNode = ({ data }: any) => (
  <div className="relative w-28 h-24 flex items-center justify-center">
    <div className="absolute inset-0 bg-yellow-900/40 border-2 border-yellow-500 transform rotate-45 rounded-sm shadow-[0_0_15px_rgba(234,179,8,0.2)]"></div>
    <div className="relative z-10 text-[10px] font-bold text-yellow-100 text-center px-1 leading-tight transform translate-y-[-2px]">
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} style={{ ...handleStyle, top: -4 }} />
    <Handle type="source" position={Position.Right} id="yes" style={{ ...handleStyle, right: -4 }} />
    <Handle type="source" position={Position.Bottom} id="no" style={{ ...handleStyle, bottom: -4 }} />
    <Handle type="source" position={Position.Left} style={{ ...handleStyle, left: -4 }} />
  </div>
);

const nodeTypes = { start: StartNode, end: EndNode, process: ProcessNode, decision: DecisionNode };

// --- SIDEBAR ITEM ---
const SidebarItem = ({ type, label, colorClass }: { type: string, label: string, colorClass: string }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={cn("cursor-grab active:cursor-grabbing p-3 rounded-lg border bg-zinc-950 flex flex-col items-center gap-2 hover:scale-105 transition-transform", colorClass)}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className={cn("w-full h-8 border-2 rounded opacity-50", type === 'start' || type === 'end' ? 'rounded-full' : type === 'decision' ? 'rotate-45 scale-75 rounded-none' : 'rounded-md')} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};

// --- MAIN BUILDER ---
const FlowchartBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, toObject } = useReactFlow(); // toObject gets full JSON

  const [activeProblem, setActiveProblem] = useState<FlowchartProblem | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiFeedback, setAiFeedback] = useState<{ score: number } | null>(null);

  const { completeRound, userId, startFlowchart, flowchartStartTime } = useCompetitionStore();

  // 1. Fetch Problem & Restore Draft
  useEffect(() => {
    const initRound = async () => {
      try {
        // Fetch Problem
        const { data: problem } = await supabase.from('flowchart_problems').select('*').eq('is_active', true).limit(1).maybeSingle();
        setActiveProblem(problem);

        // Fetch Existing Draft (Restore State)
        if (userId && problem) {
          const { data: draft } = await supabase
            .from('flowchart_submissions')
            .select('*')
            .eq('user_id', userId)
            .eq('problem_id', problem.id)
            .single();

          if (draft && draft.nodes) {
            // Restore Canvas
            setNodes(draft.nodes || []);
            setEdges(draft.edges || []);
            if (draft.status === 'graded') {
              setSubmitted(true); // Already finished
            }
            toast.success("Draft restored from server");
          }
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoadingProblem(false);
      }
    };

    initRound();
    if (!flowchartStartTime) startFlowchart();
  }, [startFlowchart, flowchartStartTime, userId, setNodes, setEdges]);

  // 2. Save Logic (Fixed)
  const handleSaveDraft = useCallback(async (silent = false) => {
    if (!userId || !activeProblem) return;
    
    if (isSubmitting) return; // Don't save if submitting

    if (!silent) setIsSaving(true);

    try {
        const flowData = toObject();

        const { error } = await supabase
            .from('flowchart_submissions')
            .upsert({
                user_id: userId,
                problem_id: activeProblem.id,
                nodes: flowData.nodes,
                edges: flowData.edges,
                status: 'draft',
                updated_at: new Date().toISOString()
            }, { 
                onConflict: 'user_id,problem_id', // <--- SPACE REMOVED HERE (Critical)
                ignoreDuplicates: false 
            });

        if (error) {
            // Log full error object to verify structure
            console.error("Supabase Error Details:", JSON.stringify(error, null, 2));
            throw error;
        }

        setLastSaved(new Date());
        if (!silent) toast.success("Draft Saved");

    } catch (err: any) {
        console.error("Save Draft Failed:", err);
        if (!silent) {
            // Show exact error message from DB
            toast.error(`Save Failed: ${err.message || err.details || "Unknown error"}`);
        }
    } finally {
        if (!silent) setIsSaving(false);
    }
  }, [userId, activeProblem, toObject, isSubmitting]);

  // 3. Auto-Save Interval (Every 60 Seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (nodes.length > 0) {
        handleSaveDraft(true); // Silent save
      }
    }, 60000); // 1 Minute

    return () => clearInterval(timer);
  }, [handleSaveDraft, nodes]);

  // 4. Drag & Drop Logic
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: type === 'decision' ? '?' : type.charAt(0).toUpperCase() + type.slice(1) },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges],
  );

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    const newLabel = prompt("Enter text:", node.data.label as string);
    if (newLabel !== null) {
      setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, label: newLabel } } : n)));
    }
  }, [setNodes]);

 // 5. Submit Logic (Fixed: Now handles Upsert correctly)
  const handleSubmit = useCallback(async () => {
    if (!userId || !activeProblem) return;
    if (nodes.length === 0) return toast.error("Canvas is empty!");

    setIsSubmitting(true);
    const toastId = toast.loading("Analyzing Logic...");

    try {
        // 1. Final Save to DB (UPSERT with onConflict)
        const flowData = toObject();
        
        const { data: submission, error: dbError } = await supabase
            .from('flowchart_submissions')
            .upsert({ 
                user_id: userId,
                problem_id: activeProblem.id,
                nodes: flowData.nodes,
                edges: flowData.edges,
                status: 'pending', // Change status from 'draft' to 'pending'
                updated_at: new Date().toISOString()
            }, {
                // 👇 YE LINE MISSING THI, ISLIYE 409 AA RAHA THA
                onConflict: 'user_id,problem_id' 
            })
            .select()
            .single();

        if (dbError) {
            console.error("DB Upsert Error:", dbError);
            throw new Error(`DB Error: ${dbError.message}`);
        }

        // 2. Call AI Evaluation
        try {
            const { data: aiRes, error: invokeError } = await supabase.functions.invoke('evaluate-flowchart', {
                body: { submission_id: submission.id }
            });

            if (invokeError || !aiRes?.success) throw new Error("AI Error");

            setAiFeedback(aiRes.data);
            toast.success(`Score: ${aiRes.data.score}/100`, { id: toastId });

        } catch (aiError) {
            console.warn("AI Skipped:", aiError);
            toast.warning("AI busy. Sent for manual review.", { id: toastId });
            // Fail-safe: Update status so user doesn't get stuck
            await supabase.from('flowchart_submissions')
                .update({ status: 'manual_review' })
                .eq('id', submission.id);
        }

        // 3. Move to Next Round
        setTimeout(() => {
            setSubmitted(true);
            completeRound('flowchart');
        }, 2000);

    } catch (err: any) {
        toast.error(`Error: ${err.message}`, { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  }, [toObject, userId, activeProblem, completeRound, nodes.length]);
  

  const handleReset = () => {
    if (confirm("Clear entire canvas? This cannot be undone.")) {
      setNodes([]);
      setEdges([]);
    }
  };

  if (submitted) return <RoundTransition completedRound="Flowchart Round" nextRoundName="Coding Round" nextRoundSlug="coding" />;
  if (loadingProblem) return <div className="flex h-full items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!activeProblem) return <div className="flex h-full items-center justify-center text-red-500"><AlertCircle className="w-8 h-8 mr-2" /> Admin has not activated this round.</div>;

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)] w-full animate-in fade-in duration-500">

      {/* LEFT: Canvas + Toolbar */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden relative">
        {/* Header Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
          <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 p-3 rounded-lg pointer-events-auto shadow-xl max-w-lg">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-white text-sm">{activeProblem.title}</h2>
              {lastSaved && <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Cloud className="w-3 h-3" /> Saved {lastSaved.toLocaleTimeString()}</span>}
            </div>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{activeProblem.description}</p>
          </div>
          {aiFeedback && <div className="bg-blue-900/90 backdrop-blur border border-blue-500/50 p-3 rounded-lg pointer-events-auto"><div className="text-xs text-blue-300 font-bold uppercase">Score</div><div className="text-2xl font-mono font-bold text-white">{aiFeedback.score}</div></div>}
        </div>

        {/* Drag Source Toolbar */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-2 rounded-xl flex flex-col gap-2 shadow-xl">
          <div className="text-[10px] text-zinc-500 text-center font-bold mb-1">TOOLS</div>
          <SidebarItem type="start" label="Start" colorClass="border-green-500/50 text-green-500" />
          <SidebarItem type="process" label="Process" colorClass="border-blue-500/50 text-blue-500" />
          <SidebarItem type="decision" label="Decision" colorClass="border-yellow-500/50 text-yellow-500" />
          <SidebarItem type="end" label="End" colorClass="border-red-500/50 text-red-500" />
        </div>

        {/* Main Canvas */}
        <div className="flex-1 h-full w-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}

            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-black"
          >
            <Background color="#27272a" variant={BackgroundVariant.Dots} gap={20} />
            <Controls className="bg-zinc-800 border-zinc-700 fill-zinc-400" />
            <MiniMap className="bg-zinc-900 border-zinc-800" nodeColor="#3f3f46" />
          </ReactFlow>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-2 rounded-lg flex gap-4 shadow-xl z-10">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-zinc-400 hover:text-red-400 h-8 text-xs"><RotateCcw className="w-3 h-3 mr-2" /> Reset</Button>

          {/* MANUAL SAVE BUTTON */}
          <Button variant="secondary" size="sm" onClick={() => handleSaveDraft(false)} disabled={isSaving} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 h-8 text-xs border border-zinc-700">
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
            Save Draft
          </Button>

          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-8 text-xs px-6">
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3 mr-2" /> Submit Logic</>}
          </Button>
        </div>
      </div>

      {/* RIGHT: Requirements & Timer */}
      <div className="w-[280px] flex flex-col gap-3 shrink-0">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <CompetitionTimer totalSeconds={45 * 60} onTimeUp={handleSubmit} />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Requirements</h3>
          <ul className="space-y-2">
            {activeProblem.requirements.map((req, i) => (
              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-blue-500 font-bold mt-0.5">•</span> {req}
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2"><MousePointer2 className="w-3 h-3" /> Guide</h3>
            <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Drag</strong> shapes from left.</li>
              <li><strong>Connect</strong> dots for flow.</li>
              <li><strong>Double Click</strong> to edit text.</li>
              <li><strong>Auto-saves</strong> every minute.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

// Wrapper for Provider
export const FlowchartRound = () => (
  <ReactFlowProvider>
    <FlowchartBuilder />
  </ReactFlowProvider>
);