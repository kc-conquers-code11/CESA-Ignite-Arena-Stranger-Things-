import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Send, RotateCcw, RotateCw, ZoomIn, ZoomOut, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompetitionTimer } from './CompetitionTimer';
import { useCompetitionStore } from '@/store/competitionStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- Custom Node Components (Defined Outside) ---

const StartEndNode = ({ data, type }: { data: { label: string }; type: string }) => (
  <div className={cn(
    "px-6 py-3 rounded-full border-2 font-bold text-sm min-w-[100px] text-center",
    type === 'start' ? "bg-success/20 border-success text-success" : "bg-destructive/20 border-destructive text-destructive"
  )}>
    <Handle type="source" position={Position.Bottom} className="!bg-foreground" />
    <Handle type="target" position={Position.Top} className="!bg-foreground" />
    {data.label}
  </div>
);

// Wrapper components to avoid inline functions in nodeTypes
const StartNode = (props: any) => <StartEndNode {...props} type="start" />;
const EndNode = (props: any) => <StartEndNode {...props} type="end" />;

const ProcessNode = ({ data }: { data: { label: string } }) => (
  <div className="px-6 py-3 bg-primary/20 border-2 border-primary rounded-lg font-medium text-sm min-w-[120px] text-center">
    <Handle type="target" position={Position.Top} className="!bg-primary" />
    <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    {data.label}
  </div>
);

const DecisionNode = ({ data }: { data: { label: string } }) => (
  <div className="relative">
    <div
      className="w-32 h-20 bg-secondary/20 border-2 border-secondary flex items-center justify-center font-medium text-sm text-center"
      style={{
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        transform: 'scale(1.2)'
      }}
    >
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className="!bg-secondary !top-0" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-secondary !bottom-0" />
    <Handle type="source" position={Position.Right} id="right" className="!bg-secondary !right-0" />
    <Handle type="source" position={Position.Left} id="left" className="!bg-secondary !left-0" />
  </div>
);

const InputOutputNode = ({ data }: { data: { label: string } }) => (
  <div
    className="px-6 py-3 bg-accent/20 border-2 border-accent font-medium text-sm min-w-[120px] text-center"
    style={{
      clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
    }}
  >
    <Handle type="target" position={Position.Top} className="!bg-accent" />
    <Handle type="source" position={Position.Bottom} className="!bg-accent" />
    {data.label}
  </div>
);

// --- Configuration Data ---

const initialNodes: Node[] = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'START' } },
];

const problemStatement = {
  title: 'Binary Search Implementation',
  description: 'Design a flowchart that implements the binary search algorithm to find a target element in a sorted array. The flowchart should include proper decision points for comparing the target with the middle element and adjusting the search range accordingly.',
  requirements: [
    'Start with initializing low and high pointers',
    'Include a loop condition check',
    'Calculate the middle index',
    'Compare target with middle element',
    'Handle found element case',
    'Handle element not found case',
  ],
};

const nodeTemplates = [
  { type: 'start', label: 'START', color: 'success' },
  { type: 'end', label: 'END', color: 'destructive' },
  { type: 'process', label: 'Process', color: 'primary' },
  { type: 'decision', label: 'Decision', color: 'secondary' },
  { type: 'inputOutput', label: 'I/O', color: 'accent' },
];

// --- Main Component ---

export const FlowchartRound = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);

  const { completeRound, saveFlowchart, startFlowchart, flowchartStartTime } = useCompetitionStore();

  // Memoize nodeTypes so React Flow doesn't re-create them on every render
  const nodeTypes = useMemo<NodeTypes>(() => ({
    start: StartNode,
    end: EndNode,
    process: ProcessNode,
    decision: DecisionNode,
    inputOutput: InputOutputNode,
  }), []);

  useEffect(() => {
    if (!flowchartStartTime) {
      startFlowchart();
    }
  }, [flowchartStartTime, startFlowchart]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge({
          ...params,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(var(--primary))' },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
        }, eds)
      );
    },
    [setEdges]
  );

  const handleAddNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 250, y: nodes.length * 100 + 50 },
      data: { label: type === 'start' ? 'START' : type === 'end' ? 'END' : `${type.charAt(0).toUpperCase() + type.slice(1)}` },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeType(null);
  }, [nodes.length, setNodes]);

  const handleReset = useCallback(() => {
    setNodes(initialNodes);
    setEdges([]);
    toast.info('Canvas reset');
  }, [setNodes, setEdges]);

  const handleSubmit = useCallback(() => {
    saveFlowchart({ nodes, edges, submittedAt: new Date() });
    completeRound('flowchart');
    toast.success('Flowchart submitted! Moving to Coding Arena...');
  }, [nodes, edges, saveFlowchart, completeRound]);

  const handleTimeUp = useCallback(() => {
    toast.error("Time's up! Auto-submitting your flowchart...");
    handleSubmit();
  }, [handleSubmit]);

  return (
    <div className="grid lg:grid-cols-[1fr,300px] gap-6 h-full">
      {/* Main Canvas */}
      <div className="space-y-4">
        {/* Problem Statement */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4"
        >
          <h2 className="font-display font-bold text-lg gradient-text mb-2">
            {problemStatement.title}
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            {problemStatement.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {problemStatement.requirements.map((req, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                {req}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Node Palette */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Drag to add nodes:</h3>
          <div className="flex gap-2 flex-wrap">
            {nodeTemplates.map((template) => (
              <Button
                key={template.type}
                variant="outline"
                size="sm"
                onClick={() => handleAddNode(template.type)}
                className={cn(
                  "gap-2",
                  template.color === 'success' && "border-success text-success hover:bg-success/10",
                  template.color === 'destructive' && "border-destructive text-destructive hover:bg-destructive/10",
                  template.color === 'primary' && "border-primary text-primary hover:bg-primary/10",
                  template.color === 'secondary' && "border-secondary text-secondary hover:bg-secondary/10",
                  template.color === 'accent' && "border-accent text-accent hover:bg-accent/10",
                )}
              >
                + {template.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-xl overflow-hidden"
          style={{ height: '500px' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Controls className="!bg-card !border-border !rounded-lg overflow-hidden" />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="hsl(var(--muted-foreground) / 0.2)"
            />
          </ReactFlow>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset Canvas
          </Button>

          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-primary to-secondary gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Flowchart
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <CompetitionTimer
          totalSeconds={45 * 60}
          onTimeUp={handleTimeUp}
        />

        {/* Stats */}
        <div className="glass rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">Canvas Statistics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nodes</span>
              <span className="font-bold text-primary">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-bold text-secondary">{edges.length}</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Click and drag between handles to connect</li>
            <li>• Double-click nodes to edit labels</li>
            <li>• Use scroll to zoom</li>
            <li>• Decision nodes have multiple outputs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};