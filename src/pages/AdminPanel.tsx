import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
    Shield, RefreshCw, Play, Ban, Search,
    Plus, Trash2, AlertTriangle, LogOut,
    Activity, Workflow, CheckCircle, CheckCircle2, Eye, X, FileJson, Cpu, Code, Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AnimatedBackground } from '../components/competition/AnimatedBackground';
import { toast } from 'sonner';

// --- CONFIGURATION ---
const ADMIN_EMAILS = ["admin1@strangertech.in", "kc@strangertech.in", "admin@cesa.in"];

// --- TYPES ---
interface Participant {
    user_id: string;
    email: string;
    status: 'active' | 'frozen' | 'disqualified';
    current_round_slug: string;
    tab_switches: number;
    created_at: string;
    updated_at: string;
}

interface Question {
    id: string;
    round_id: 'mcq' | 'coding';
    title: string;
    description: string;
    options?: string[];
    correct_answer?: string;
    difficulty: string;
    code_snippet?: string;
    examples?: Array<{ input: string; output: string; explanation: string }>;
    constraints?: string[];
}

interface FlowchartProblem {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    is_active: boolean;
}

// Type for the Deep Dive Data
interface InspectionData {
    flowchart?: {
        nodes: any;
        edges: any;
        ai_score: number;
        ai_feedback: string;
        created_at: string;
    } | null;
}


interface LeaderboardEntry {
    id: string;
    user_id: string;
    round1_score: number;
    round2_score: number;
    round3_score: number;
    overall_score: number;
    updated_at: string;
}

export default function AdminPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'monitor' | 'controls' | 'questions' | 'leaderboard'>('monitor');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [flowchartProblems, setFlowchartProblems] = useState<FlowchartProblem[]>([]);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Inspection State
    const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
    const [inspectionData, setInspectionData] = useState<InspectionData | null>(null);
    const [loadingInspection, setLoadingInspection] = useState(false);

    const [newQ, setNewQ] = useState({
        round_id: 'mcq',
        title: '',
        description: '',
        optionA: '', optionB: '', optionC: '', optionD: '',
        correct: '',
        difficulty: 'easy',
        // For coding problems
        code_snippet: '',
        example1_input: '', example1_output: '', example1_explanation: '',
        example2_input: '', example2_output: '', example2_explanation: '',
        constraint1: '', constraint2: '', constraint3: ''
    });

    const [newFlowchart, setNewFlowchart] = useState({
        title: '',
        description: '',
        req1: '',
        req2: '',
        req3: '',
        req4: ''
    });

    // ---------------------------------------------------------
    // 1. DATA FETCHING
    // ---------------------------------------------------------
    const fetchData = async () => {
        setLoading(true);
        try {
            // Users
            const { data: users } = await supabase
                .from('exam_sessions')
                .select('*')
                .order('tab_switches', { ascending: false });

            if (users) {
                const studentsOnly = users.filter(user => !ADMIN_EMAILS.includes(user.email));
                setParticipants(studentsOnly);
            }

            // Questions & Flowcharts
            const { data: qData } = await supabase.from('questions').select('*').order('created_at', { ascending: false });
            if (qData) setQuestions(qData);

            const { data: fData } = await supabase.from('flowchart_problems').select('*').order('created_at', { ascending: false });
            if (fData) setFlowchartProblems(fData);

            // Leaderboard (Scores)
            const { data: lData } = await supabase.from('leaderboard').select('*').order('overall_score', { ascending: false });
            if (lData) setLeaderboardData(lData);

        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Realtime Listener
        const channel = supabase
            .channel('admin-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_sessions' }, (payload) => {
                fetchData(); // Simplest way to keep everything safely in sync
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, (payload) => {
                // Update leaderboard state directly or refetch
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    setLeaderboardData(prev => {
                        const newData = payload.new as LeaderboardEntry;
                        const exists = prev.find(p => p.id === newData.id);
                        let list = exists ? prev.map(p => p.id === newData.id ? newData : p) : [...prev, newData];
                        return list.sort((a, b) => b.overall_score - a.overall_score);
                    });
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // ---------------------------------------------------------
    // 2. INSPECTION LOGIC (DEEP DIVE)
    // ---------------------------------------------------------
    const inspectUser = async (user: Participant) => {
        setSelectedUser(user);
        setLoadingInspection(true);
        setInspectionData(null); // Clear previous data

        try {
            // Fetch Flowchart Submission for this user
            const { data: flowchartData } = await supabase
                .from('flowchart_submissions')
                .select('*')
                .eq('user_id', user.user_id)
                .order('created_at', { ascending: false }) // Get latest
                .limit(1)
                .single();

            setInspectionData({
                flowchart: flowchartData || null
            });

        } catch (err) {
            console.error("Inspection failed:", err);
            toast.error("Could not fetch user details");
        } finally {
            setLoadingInspection(false);
        }
    };

    const closeInspection = () => {
        setSelectedUser(null);
        setInspectionData(null);
    };

    // ---------------------------------------------------------
    // 3. HELPERS & ACTIONS
    // ---------------------------------------------------------
    const formatTime = (isoString: string | null | undefined) => {
        if (!isoString) return <span className="text-zinc-600">--:--:--</span>;
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return <span className="text-red-900">Invalid</span>;
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        } catch (e) { return <span className="text-zinc-600">--:--:--</span>; }
    };

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

    const handleUserAction = async (action: 'freeze' | 'unfreeze' | 'dq', userId: string) => {
        const updates = action === 'freeze' ? { status: 'frozen' } : action === 'unfreeze' ? { status: 'active' } : { status: 'disqualified', is_disqualified: true };
        await supabase.from('exam_sessions').update(updates).eq('user_id', userId);
        toast.success(`User ${action} action sent`);
    };

    const activateFlowchartProblem = async (id: string) => {
        await supabase.from('flowchart_problems').update({ is_active: false }).neq('id', id);
        await supabase.from('flowchart_problems').update({ is_active: true }).eq('id', id);
        toast.success("Problem Activated!");
        setFlowchartProblems(prev => prev.map(fp => ({ ...fp, is_active: fp.id === id })));
    };

    const startExam = async () => {
        if (!confirm("⚠️ START EXAM?")) return;
        setLoading(true);
        const toastId = toast.loading("Starting Round 1...");

        const { data, error } = await supabase
            .from('exam_sessions')
            .update({ current_round_slug: 'mcq', status: 'active' })
            .eq('current_round_slug', 'waiting')
            .select();

        if (error) {
            toast.error("Failed to start round", { id: toastId });
        } else {
            const count = data?.length || 0;
            toast.success(`Round 1 Started! ${count} participant(s) moved to MCQ`, { id: toastId });
            fetchData();
        }
        setLoading(false);
    };

    const startRound2 = async () => {
        if (!confirm("⚠️ START ROUND 2 (FLOWCHART)?")) return;
        setLoading(true);
        const toastId = toast.loading("Starting Round 2...");

        const { data, error } = await supabase
            .from('exam_sessions')
            .update({ current_round_slug: 'flowchart', status: 'active' })
            .eq('current_round_slug', 'mcq')
            .select();

        if (error) {
            toast.error("Failed to start round", { id: toastId });
        } else {
            const count = data?.length || 0;
            toast.success(`Round 2 Started! ${count} participant(s) moved to Flowchart`, { id: toastId });
            fetchData();
        }
        setLoading(false);
    };

    const startRound3 = async () => {
        if (!confirm("⚠️ START ROUND 3 (CODING)?")) return;
        setLoading(true);
        const toastId = toast.loading("Starting Round 3...");

        const { data, error } = await supabase
            .from('exam_sessions')
            .update({ current_round_slug: 'coding', status: 'active' })
            .eq('current_round_slug', 'flowchart')
            .select();

        if (error) {
            toast.error("Failed to start round", { id: toastId });
        } else {
            const count = data?.length || 0;
            toast.success(`Round 3 Started! ${count} participant(s) moved to Coding`, { id: toastId });
            fetchData();
        }
        setLoading(false);
    };

    const resetAllToWaiting = async () => {
        if (!confirm("🛑 RESET ALL?")) return;
        await supabase.from('exam_sessions').update({ current_round_slug: 'waiting' }).neq('status', 'disqualified');
        toast.info("Reset Successful.");
    };

    const handleAddQuestion = async () => {
        if (!newQ.title) return toast.error("Title required");

        const payload: any = {
            round_id: newQ.round_id,
            title: newQ.title,
            description: newQ.description,
            difficulty: newQ.difficulty
        };

        if (newQ.round_id === 'mcq') {
            payload.options = [newQ.optionA, newQ.optionB, newQ.optionC, newQ.optionD].filter(o => o.trim());
            payload.correct_answer = newQ.correct;
        } else if (newQ.round_id === 'coding') {
            payload.code_snippet = newQ.code_snippet;

            // Build examples array
            const examples = [];
            if (newQ.example1_input && newQ.example1_output) {
                examples.push({
                    input: newQ.example1_input,
                    output: newQ.example1_output,
                    explanation: newQ.example1_explanation
                });
            }
            if (newQ.example2_input && newQ.example2_output) {
                examples.push({
                    input: newQ.example2_input,
                    output: newQ.example2_output,
                    explanation: newQ.example2_explanation
                });
            }
            payload.examples = examples;

            // Build constraints array
            payload.constraints = [newQ.constraint1, newQ.constraint2, newQ.constraint3].filter(c => c.trim());
        }

        const { error } = await supabase.from('questions').insert(payload);
        if (!error) {
            toast.success("Question Added");
            setNewQ({
                round_id: 'mcq',
                title: '',
                description: '',
                optionA: '', optionB: '', optionC: '', optionD: '',
                correct: '',
                difficulty: 'easy',
                code_snippet: '',
                example1_input: '', example1_output: '', example1_explanation: '',
                example2_input: '', example2_output: '', example2_explanation: '',
                constraint1: '', constraint2: '', constraint3: ''
            });
            fetchData();
        }
    };

    const handleAddFlowchart = async () => {
        if (!newFlowchart.title) return toast.error("Title required");

        const requirements = [
            newFlowchart.req1,
            newFlowchart.req2,
            newFlowchart.req3,
            newFlowchart.req4
        ].filter(r => r.trim());

        if (requirements.length === 0) return toast.error("Add at least one requirement");

        const payload = {
            title: newFlowchart.title,
            description: newFlowchart.description,
            requirements: requirements,
            is_active: false
        };

        const { error } = await supabase.from('flowchart_problems').insert(payload);
        if (!error) {
            toast.success("Flowchart Problem Added");
            setNewFlowchart({
                title: '',
                description: '',
                req1: '',
                req2: '',
                req3: '',
                req4: ''
            });
            fetchData();
        } else {
            toast.error("Failed to add flowchart problem");
        }
    };

    const deleteQuestion = async (id: string, table: 'questions' | 'flowchart_problems') => {
        if (confirm("Delete permanently?")) {
            await supabase.from(table).delete().eq('id', id);
            if (table === 'questions') setQuestions(prev => prev.filter(q => q.id !== id));
            else setFlowchartProblems(prev => prev.filter(fp => fp.id !== id));
        }
    };

    const filteredUsers = participants.filter(p => p.email?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-black text-slate-200 font-sans relative pb-20">
            <AnimatedBackground />

            <div className="relative z-10 container mx-auto px-4 py-8">

                {/* HEADER */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-zinc-900/80 p-6 rounded-2xl border border-red-900/30 backdrop-blur-md shadow-2xl">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-red-600 tracking-wider flex items-center gap-3">
                            <Shield className="w-8 h-8" /> ADMIN COMMAND
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">CESA CodeArena • Supervisor Terminal</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex gap-2 bg-black/50 p-1.5 rounded-xl border border-zinc-800">
                            {['monitor', 'controls', 'questions', 'leaderboard'].map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all capitalize tracking-wide", activeTab === tab ? "bg-red-700 text-white shadow-lg" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <Button onClick={handleLogout} variant="ghost" className="text-red-500 hover:bg-red-950/30"><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
                    </div>
                </header>

                {/* ======================= MONITOR TAB ======================= */}
                {activeTab === 'monitor' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Active', count: participants.filter(p => p.status === 'active').length, color: 'text-green-500' },
                                { label: 'Frozen', count: participants.filter(p => p.status === 'frozen').length, color: 'text-orange-500' },
                                { label: 'Waiting', count: participants.filter(p => p.current_round_slug === 'waiting').length, color: 'text-blue-500' },
                                { label: 'Disqualified', count: participants.filter(p => p.status === 'disqualified').length, color: 'text-red-600' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                                    <div className={`text-3xl font-mono font-bold ${stat.color}`}>{stat.count}</div>
                                </div>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-black/40 uppercase text-[11px] font-bold text-zinc-500 border-b border-zinc-800 tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Candidate</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Round</th>
                                        <th className="p-4">Activity</th>
                                        <th className="p-4 text-center text-red-500">Tab Switches</th>
                                        <th className="p-4 text-right pr-6">Controls</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filteredUsers.map((p) => (
                                        <tr key={p.user_id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 pl-6 font-medium text-white">{p.email}<div className="text-[10px] text-zinc-600 font-mono">ID: {p.user_id.slice(0, 8)}</div></td>
                                            <td className="p-4"><span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", p.status === 'active' ? "border-green-800 bg-green-900/20 text-green-400" : p.status === 'frozen' ? "border-orange-800 bg-orange-900/20 text-orange-400 animate-pulse" : "border-red-800 bg-red-900/20 text-red-500")}>{p.status}</span></td>
                                            <td className="p-4 capitalize font-mono text-zinc-300">{p.current_round_slug}</td>
                                            <td className="p-4 text-xs font-mono">
                                                <div className="flex items-center gap-2 text-zinc-400"><Play className="w-3 h-3 text-green-600" /> Start: {formatTime(p.created_at)}</div>
                                                <div className="flex items-center gap-2 text-zinc-400 mt-1"><Activity className="w-3 h-3 text-blue-500" /> Last: {formatTime(p.updated_at)}</div>
                                            </td>
                                            <td className="p-4 text-center"><span className={cn("font-mono text-lg font-bold", p.tab_switches > 0 ? "text-red-500" : "text-zinc-700")}>{p.tab_switches}</span></td>
                                            <td className="p-4 pr-6 flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {/* INSPECT BUTTON */}
                                                <Button size="sm" variant="ghost" onClick={() => inspectUser(p)} className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" title="Inspect Solutions">
                                                    <Eye className="w-4 h-4" />
                                                </Button>

                                                {p.status === 'frozen' ? (
                                                    <Button size="sm" onClick={() => handleUserAction('unfreeze', p.user_id)} className="bg-green-700 hover:bg-green-600 text-white h-8 text-xs font-bold">Resume</Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => handleUserAction('freeze', p.user_id)} className="border-orange-600/50 text-orange-500 hover:bg-orange-900/20 h-8 text-xs">Freeze</Button>
                                                )}
                                                <Button size="sm" variant="destructive" onClick={() => handleUserAction('dq', p.user_id)} className="h-8 w-8 p-0"><Ban className="w-3 h-3" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ======================= CONTROLS TAB ======================= */}
                {activeTab === 'controls' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Round Controls Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* ROUND 1 */}
                            <div className="bg-zinc-900/80 border border-green-900/50 p-6 rounded-2xl relative overflow-hidden group hover:border-green-600/50 transition-colors">
                                <h3 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2"><Play className="w-5 h-5" /> Start Round 1</h3>
                                <p className="text-zinc-400 mb-2 text-xs">Moves everyone from <strong>Waiting Room</strong> to <strong>MCQ Round</strong>.</p>

                                {/* Live Stats */}
                                <div className="flex items-center gap-4 mb-4 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-zinc-500">Waiting:</span>
                                        <span className="font-bold text-white">{participants.filter(p => p.current_round_slug === 'waiting').length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-zinc-500">In MCQ:</span>
                                        <span className="font-bold text-white">{participants.filter(p => p.current_round_slug === 'mcq').length}</span>
                                    </div>
                                </div>

                                <Button onClick={startExam} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-10 text-sm">
                                    {loading ? "Processing..." : "START ROUND 1"}
                                </Button>
                            </div>

                            {/* ROUND 2 */}
                            <div className="bg-zinc-900/80 border border-yellow-900/50 p-6 rounded-2xl relative overflow-hidden group hover:border-yellow-600/50 transition-colors">
                                <h3 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2"><Workflow className="w-5 h-5" /> Start Round 2</h3>
                                <p className="text-zinc-400 mb-2 text-xs">Moves everyone from <strong>MCQ</strong> to <strong>Flowchart Round</strong>.</p>

                                {/* Live Stats */}
                                <div className="flex items-center gap-4 mb-4 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-zinc-500">In MCQ:</span>
                                        <span className="font-bold text-white">{participants.filter(p => p.current_round_slug === 'mcq').length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <span className="text-zinc-500">In Flowchart:</span>
                                        <span className="font-bold text-white">{participants.filter(p => p.current_round_slug === 'flowchart').length}</span>
                                    </div>
                                </div>

                                <Button onClick={startRound2} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold h-10 text-sm">
                                    {loading ? "Processing..." : "START ROUND 2"}
                                </Button>
                            </div>

                            {/* ROUND 3 */}
                            <div className="bg-zinc-900/80 border border-purple-900/50 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-600/50 transition-colors">
                                <h3 className="text-lg font-bold text-purple-400 mb-2 flex items-center gap-2"><Code className="w-5 h-5" /> Start Round 3</h3>
                                <p className="text-zinc-400 mb-2 text-xs">Moves everyone from <strong>Flowchart</strong> to <strong>Coding Round</strong>.</p>

                                {/* Live Stats */}
                                <div className="flex items-center gap-4 mb-4 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <span className="text-zinc-500">In Flowchart:</span>
                                        <span className="font-bold text-white">{participants.filter(p => p.current_round_slug === 'flowchart').length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <span className="text-zinc-500">In Coding:</span>
                                        <span className="font-bold text-white">{participants.filter(p => p.current_round_slug === 'coding').length}</span>
                                    </div>
                                </div>

                                <Button onClick={startRound3} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-10 text-sm">
                                    {loading ? "Processing..." : "START ROUND 3"}
                                </Button>
                            </div>
                        </div>

                        {/* Emergency Reset */}
                        <div className="bg-zinc-900/80 border border-red-900/50 p-8 rounded-2xl relative overflow-hidden group hover:border-red-600/50 transition-colors">
                            <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Emergency Reset</h3>
                            <p className="text-zinc-400 mb-6 text-sm">Pulls everyone back to <strong>Waiting Room</strong>.</p>
                            <Button onClick={resetAllToWaiting} disabled={loading} variant="destructive" className="w-full h-12">{loading ? "Resetting..." : "RESET TO WAITING"}</Button>
                        </div>
                    </div>
                )}

                {/* ======================= QUESTIONS TAB ======================= */}
                {activeTab === 'questions' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Add Question Form */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg"><Plus className="w-5 h-5 text-blue-500" /> Add Standard Question</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" onClick={() => setNewQ({ ...newQ, round_id: 'mcq' })} className={cn(newQ.round_id === 'mcq' && "bg-blue-600 border-blue-600 text-white")}>MCQ</Button>
                                    <Button variant="outline" onClick={() => setNewQ({ ...newQ, round_id: 'coding' })} className={cn(newQ.round_id === 'coding' && "bg-purple-600 border-purple-600 text-white")}>Coding</Button>
                                </div>
                                <Input placeholder="Title" className="bg-black border-zinc-700" value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} />
                                <Textarea placeholder="Description" className="bg-black border-zinc-700 min-h-[80px]" value={newQ.description} onChange={e => setNewQ({ ...newQ, description: e.target.value })} />

                                {newQ.round_id === 'mcq' && (
                                    <div className="space-y-2 bg-zinc-950 p-3 rounded border border-zinc-800">
                                        <p className="text-xs font-bold text-zinc-500">OPTIONS</p>
                                        {['A', 'B', 'C', 'D'].map(opt => (<Input key={opt} placeholder={`Option ${opt}`} className="h-8 bg-zinc-900 border-zinc-700" value={(newQ as any)[`option${opt}`]} onChange={e => setNewQ({ ...newQ, [`option${opt}`]: e.target.value })} />))}
                                        <Input placeholder="Correct Answer" className="h-8 bg-green-900/20 border-green-900 text-green-400" value={newQ.correct} onChange={e => setNewQ({ ...newQ, correct: e.target.value })} />
                                    </div>
                                )}

                                {newQ.round_id === 'coding' && (
                                    <div className="space-y-3 bg-zinc-950 p-4 rounded border border-zinc-800">
                                        <p className="text-xs font-bold text-purple-400">CODING PROBLEM DETAILS</p>

                                        <div>
                                            <label className="text-xs text-zinc-500 mb-1 block">Code Snippet (Default Template)</label>
                                            <Textarea placeholder="def twoSum(nums, target):\n    # Write your code here\n    pass" className="bg-zinc-900 border-zinc-700 font-mono text-xs min-h-[100px]" value={newQ.code_snippet} onChange={e => setNewQ({ ...newQ, code_snippet: e.target.value })} />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-zinc-500">Example 1</p>
                                            <Input placeholder="Input: nums = [2,7,11,15], target = 9" className="h-8 bg-zinc-900 border-zinc-700 text-xs" value={newQ.example1_input} onChange={e => setNewQ({ ...newQ, example1_input: e.target.value })} />
                                            <Input placeholder="Output: [0,1]" className="h-8 bg-zinc-900 border-zinc-700 text-xs" value={newQ.example1_output} onChange={e => setNewQ({ ...newQ, example1_output: e.target.value })} />
                                            <Input placeholder="Explanation: Because nums[0] + nums[1] == 9, we return [0, 1]." className="h-8 bg-zinc-900 border-zinc-700 text-xs" value={newQ.example1_explanation} onChange={e => setNewQ({ ...newQ, example1_explanation: e.target.value })} />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-zinc-500">Example 2 (Optional)</p>
                                            <Input placeholder="Input" className="h-8 bg-zinc-900 border-zinc-700 text-xs" value={newQ.example2_input} onChange={e => setNewQ({ ...newQ, example2_input: e.target.value })} />
                                            <Input placeholder="Output" className="h-8 bg-zinc-900 border-zinc-700 text-xs" value={newQ.example2_output} onChange={e => setNewQ({ ...newQ, example2_output: e.target.value })} />
                                            <Input placeholder="Explanation" className="h-8 bg-zinc-900 border-zinc-700 text-xs" value={newQ.example2_explanation} onChange={e => setNewQ({ ...newQ, example2_explanation: e.target.value })} />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-zinc-500">Constraints</p>
                                            <Input placeholder="2 <= nums.length <= 10^4" className="h-8 bg-zinc-900 border-zinc-700 text-xs" value={newQ.constraint1} onChange={e => setNewQ({ ...newQ, constraint1: e.target.value })} />
                                            <Input placeholder="-10^9 <= nums[i] <= 10^9" className="h-8 bg-zinc-900 border-zinc-700 text-xs" value={newQ.constraint2} onChange={e => setNewQ({ ...newQ, constraint2: e.target.value })} />
                                            <Input placeholder="-10^9 <= target <= 10^9" className="h-8 bg-zinc-900 border-zinc-700 text-xs" value={newQ.constraint3} onChange={e => setNewQ({ ...newQ, constraint3: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                <Button onClick={handleAddQuestion} className="w-full bg-white hover:bg-zinc-200 text-black font-bold">Save Question</Button>
                            </div>
                        </div>

                        {/* Questions List Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* MCQ Questions */}
                            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                                <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Round 1: MCQ Questions
                                </h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {questions.filter(q => q.round_id === 'mcq').map(q => (
                                        <div key={q.id} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <span className="text-sm font-bold text-zinc-300">{q.title}</span>
                                                <p className="text-xs text-zinc-500 mt-0.5">{q.description.substring(0, 50)}...</p>
                                            </div>
                                            <Button size="icon" variant="ghost" onClick={() => deleteQuestion(q.id, 'questions')}><Trash2 className="w-4 h-4 text-zinc-600 hover:text-red-500" /></Button>
                                        </div>
                                    ))}
                                    {questions.filter(q => q.round_id === 'mcq').length === 0 && (
                                        <div className="text-center py-8 text-zinc-500 text-sm">No MCQ questions yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Coding Questions */}
                            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                                <h4 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                                    <Code className="w-4 h-4" /> Round 3: Coding Questions
                                </h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {questions.filter(q => q.round_id === 'coding').map(q => (
                                        <div key={q.id} className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <span className="text-sm font-bold text-zinc-300">{q.title}</span>
                                                <p className="text-xs text-zinc-500 mt-0.5">{q.description.substring(0, 50)}...</p>
                                            </div>
                                            <Button size="icon" variant="ghost" onClick={() => deleteQuestion(q.id, 'questions')}><Trash2 className="w-4 h-4 text-zinc-600 hover:text-red-500" /></Button>
                                        </div>
                                    ))}
                                    {questions.filter(q => q.round_id === 'coding').length === 0 && (
                                        <div className="text-center py-8 text-zinc-500 text-sm">No coding questions yet</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Flowchart Manager */}
                        <div className="bg-zinc-900 border border-yellow-900/30 p-6 rounded-2xl shadow-xl">
                            <h3 className="font-bold text-yellow-500 mb-4 flex items-center gap-2 text-lg"><Workflow className="w-5 h-5" /> Round 2: Flowchart Challenges</h3>

                            {/* Add Flowchart Form */}
                            <div className="mb-6 bg-zinc-950 border border-yellow-900/20 p-4 rounded-xl">
                                <p className="text-xs font-bold text-yellow-400 mb-3">ADD NEW FLOWCHART PROBLEM</p>
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Problem Title (e.g., Find Largest of 3 Numbers)"
                                        className="bg-zinc-900 border-zinc-700 text-sm"
                                        value={newFlowchart.title}
                                        onChange={e => setNewFlowchart({ ...newFlowchart, title: e.target.value })}
                                    />
                                    <Textarea
                                        placeholder="Problem Description"
                                        className="bg-zinc-900 border-zinc-700 text-sm min-h-[60px]"
                                        value={newFlowchart.description}
                                        onChange={e => setNewFlowchart({ ...newFlowchart, description: e.target.value })}
                                    />
                                    <div className="space-y-2">
                                        <p className="text-xs text-zinc-500">Requirements (at least 1)</p>
                                        <Input
                                            placeholder="Requirement 1"
                                            className="h-8 bg-zinc-900 border-zinc-700 text-xs"
                                            value={newFlowchart.req1}
                                            onChange={e => setNewFlowchart({ ...newFlowchart, req1: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Requirement 2 (optional)"
                                            className="h-8 bg-zinc-900 border-zinc-700 text-xs"
                                            value={newFlowchart.req2}
                                            onChange={e => setNewFlowchart({ ...newFlowchart, req2: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Requirement 3 (optional)"
                                            className="h-8 bg-zinc-900 border-zinc-700 text-xs"
                                            value={newFlowchart.req3}
                                            onChange={e => setNewFlowchart({ ...newFlowchart, req3: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Requirement 4 (optional)"
                                            className="h-8 bg-zinc-900 border-zinc-700 text-xs"
                                            value={newFlowchart.req4}
                                            onChange={e => setNewFlowchart({ ...newFlowchart, req4: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddFlowchart}
                                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold h-9"
                                    >
                                        Add Flowchart Problem
                                    </Button>
                                </div>
                            </div>

                            {/* Existing Flowchart Problems */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Existing Problems</p>
                                {flowchartProblems.map(fp => (
                                    <div key={fp.id} className={cn("p-4 rounded-xl border transition-all relative", fp.is_active ? "bg-yellow-900/20 border-yellow-500" : "bg-zinc-950 border-zinc-800")}>
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <h4 className={cn("font-bold text-sm mb-1", fp.is_active ? "text-white" : "text-zinc-400")}>{fp.title}</h4>
                                                <p className="text-xs text-zinc-500 mb-2">{fp.description}</p>
                                                <div className="text-xs text-zinc-600">
                                                    {fp.requirements.length} requirements
                                                </div>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                {fp.is_active ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-500 text-black px-2 py-1 rounded">
                                                        <CheckCircle className="w-3 h-3" /> ACTIVE
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => activateFlowchartProblem(fp.id)}
                                                        variant="outline"
                                                        className="h-7 text-xs border-zinc-700"
                                                    >
                                                        Activate
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => deleteQuestion(fp.id, 'flowchart_problems')}
                                                    className="h-7 w-7"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-zinc-600 hover:text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {flowchartProblems.length === 0 && (
                                    <div className="text-center py-8 text-zinc-500 text-sm">No flowchart problems yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ======================= LEADERBOARD TAB ======================= */}
                {activeTab === 'leaderboard' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> Live Leaderboard</h2>
                            <Button onClick={fetchData} variant="outline" size="sm" className="h-8 gap-2"><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh</Button>
                        </div>

                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-black/40 uppercase text-[11px] font-bold text-zinc-500 border-b border-zinc-800 tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Participant ID</th>
                                        <th className="p-4 text-center">R1 (MCQ)</th>
                                        <th className="p-4 text-center">R2 (Flow)</th>
                                        <th className="p-4 text-center">R3 (Code)</th>
                                        <th className="p-4 text-right pr-6">Total Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {leaderboardData.map((entry, i) => (
                                        <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 pl-6 font-medium text-white flex items-center gap-3">
                                                <span className={cn("text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold", i < 3 ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-500")}>{i + 1}</span>
                                                <span className="font-mono text-xs text-zinc-400">{entry.user_id}</span>
                                            </td>
                                            <td className="p-4 text-center font-mono text-zinc-300">{entry.round1_score}</td>
                                            <td className="p-4 text-center font-mono text-zinc-300">{entry.round2_score}</td>
                                            <td className="p-4 text-center font-mono text-zinc-300">{entry.round3_score}</td>
                                            <td className="p-4 text-right pr-6 font-mono font-bold text-green-400 text-lg">{entry.overall_score}</td>
                                        </tr>
                                    ))}
                                    {leaderboardData.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-zinc-500">No scores yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* ======================= INSPECTION MODAL (DEEP DIVE) ======================= */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-500" /> Inspection Mode
                                </h2>
                                <p className="text-zinc-400 text-sm mt-1 font-mono">{selectedUser.email} <span className="text-zinc-600">|</span> ID: {selectedUser.user_id}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={closeInspection} className="rounded-full hover:bg-zinc-800"><X className="w-6 h-6 text-zinc-400" /></Button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {loadingInspection ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                    <RefreshCw className="w-10 h-10 animate-spin mb-4" />
                                    <p>Retrieving classified logs...</p>
                                </div>
                            ) : (
                                <>
                                    {/* 1. STATUS CARD */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                            <p className="text-xs text-zinc-500 uppercase font-bold">Current Status</p>
                                            <p className={cn("text-xl font-bold capitalize", selectedUser.status === 'frozen' ? 'text-orange-500' : 'text-green-500')}>{selectedUser.status}</p>
                                        </div>
                                        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                            <p className="text-xs text-zinc-500 uppercase font-bold">Tab Switches</p>
                                            <p className="text-xl font-bold text-red-500">{selectedUser.tab_switches}</p>
                                        </div>
                                        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                            <p className="text-xs text-zinc-500 uppercase font-bold">Current Round</p>
                                            <p className="text-xl font-bold text-blue-400 capitalize">{selectedUser.current_round_slug}</p>
                                        </div>
                                    </div>

                                    {/* 2. FLOWCHART SUBMISSION */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-2 border-b border-zinc-800">
                                            <Workflow className="w-5 h-5 text-yellow-500" /> Flowchart Submission
                                        </h3>

                                        {inspectionData?.flowchart ? (
                                            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 space-y-6">
                                                {/* Score & Feedback */}
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="flex-1 bg-black/40 p-4 rounded-lg border border-zinc-800">
                                                        <p className="text-xs text-zinc-500 uppercase font-bold mb-2">AI Score</p>
                                                        <div className="text-4xl font-bold text-blue-400">{inspectionData.flowchart.ai_score}<span className="text-lg text-zinc-600">/100</span></div>
                                                    </div>
                                                    <div className="flex-[2] bg-black/40 p-4 rounded-lg border border-zinc-800">
                                                        <p className="text-xs text-zinc-500 uppercase font-bold mb-2 flex items-center gap-2">
                                                            <Cpu className="w-3 h-3" /> AI Feedback Logic
                                                        </p>
                                                        <p className="text-zinc-300 text-sm leading-relaxed">{inspectionData.flowchart.ai_feedback || "No feedback generated."}</p>
                                                    </div>
                                                </div>

                                                {/* Raw Data Preview */}
                                                <div className="space-y-2">
                                                    <p className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-2"><FileJson className="w-3 h-3" /> Raw Structure (JSON)</p>
                                                    <div className="bg-black p-4 rounded-lg border border-zinc-800 font-mono text-xs text-green-400 overflow-x-auto max-h-60">
                                                        <pre>{JSON.stringify(inspectionData.flowchart.nodes, null, 2)}</pre>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-8 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800 text-zinc-500">
                                                No Flowchart submission found for this user.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}