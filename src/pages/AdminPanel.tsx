import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; //  Import Navigate
import { supabase } from '@/lib/supabaseClient';
import { 
  Shield, RefreshCw, Lock, Unlock, Ban, Search, 
  Play, Plus, Trash2, Save, AlertTriangle, CheckCircle, LogOut //  Import LogOut Icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AnimatedBackground } from '../components/competition/AnimatedBackground'; 

// --- TYPES ---
interface Participant {
  user_id: string;
  email: string;
  status: 'active' | 'frozen' | 'disqualified';
  current_round_slug: string;
  tab_switches: number;
}

interface Question {
  id: string;
  type: 'mcq' | 'coding';
  title: string;
  description: string;
  options?: string[]; // Array of strings for MCQ
  correct_answer?: string;
  difficulty: string;
}

export default function AdminPanel() {
  const navigate = useNavigate(); //  Initialize Navigation
  const [activeTab, setActiveTab] = useState<'monitor' | 'controls' | 'questions'>('monitor');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Question Form State
  const [newQ, setNewQ] = useState({
    type: 'mcq',
    title: '',
    description: '',
    optionA: '', optionB: '', optionC: '', optionD: '',
    correct: '',
    difficulty: 'easy'
  });

  // ---------------------------------------------------------
  // 1. DATA FETCHING (REALTIME)
  // ---------------------------------------------------------
  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Users (Sorted by risk - Tab switches high to low)
    const { data: users } = await supabase
      .from('exam_sessions')
      .select('*')
      .order('tab_switches', { ascending: false });
    
    if (users) setParticipants(users);

    // Fetch Questions
    const { data: qData } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (qData) setQuestions(qData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // ⚡ REALTIME SUBSCRIPTION (Auto-Update)
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_sessions' }, () => {
        fetchData(); // Reload list whenever DB changes
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ---------------------------------------------------------
  // 2. USER ACTIONS (Freeze/Resume/DQ/Logout)
  // ---------------------------------------------------------
  const handleLogout = async () => {
      await supabase.auth.signOut();
      navigate('/login');
  };

  const handleUserAction = async (action: 'freeze' | 'unfreeze' | 'dq', userId: string) => {
    const updates = 
      action === 'freeze' ? { status: 'frozen' } :
      action === 'unfreeze' ? { status: 'active' } :
      { status: 'disqualified', is_disqualified: true }; 

    const { error } = await supabase.from('exam_sessions').update(updates).eq('user_id', userId);
    
    if (error) alert("Action Failed: " + error.message);
    else fetchData();
  };

  // ---------------------------------------------------------
  // 3. EXAM CONTROLS (Clear Waiting Room)
  // ---------------------------------------------------------
  const startExam = async () => {
    if(!confirm("⚠️ ARE YOU SURE? \n\nThis will move ALL users currently in 'Waiting Room' to 'Round 1 (MCQ)'.\nThis cannot be undone.")) return;
    
    setLoading(true);
    // Move everyone from 'waiting' -> 'mcq'
    const { error } = await supabase
        .from('exam_sessions')
        .update({ current_round_slug: 'mcq', status: 'active' })
        .eq('current_round_slug', 'waiting');

    setLoading(false);

    if (error) alert("Error starting exam: " + error.message);
    else {
        alert(" EXAM STARTED! Students moved to Round 1.");
        fetchData();
    }
  };

  const resetAllToWaiting = async () => {
    if(!confirm("🛑 DANGER ZONE \n\nAre you sure you want to RESET everyone back to the Waiting Room? \nProgress might be lost.")) return;
    
    setLoading(true);
    const { error } = await supabase
        .from('exam_sessions')
        .update({ current_round_slug: 'waiting' })
        .neq('status', 'disqualified'); // Don't reset disqualified cheaters

    setLoading(false);
    
    if(error) alert(error.message);
    else {
        alert("🔄 Reset Successful. Everyone is back in Waiting Room.");
        fetchData();
    }
  };

  // ---------------------------------------------------------
  // 4. QUESTION MANAGEMENT
  // ---------------------------------------------------------
  const handleAddQuestion = async () => {
    if(!newQ.title) return alert("Title required");

    const payload: any = {
        type: newQ.type,
        title: newQ.title,
        description: newQ.description,
        difficulty: newQ.difficulty
    };

    if(newQ.type === 'mcq') {
        if(!newQ.correct) return alert("Correct answer required for MCQ");
        payload.options = [newQ.optionA, newQ.optionB, newQ.optionC, newQ.optionD];
        payload.correct_answer = newQ.correct;
    }

    const { error } = await supabase.from('questions').insert(payload);
    
    if(error) alert(error.message);
    else {
        alert(" Question Added Successfully");
        setNewQ({ ...newQ, title: '', description: '', correct: '' }); // Partial reset
        fetchData();
    }
  };

  const deleteQuestion = async (id: string) => {
      if(confirm("Delete this question permanently?")) {
          await supabase.from('questions').delete().eq('id', id);
          fetchData();
      }
  };

  // ---------------------------------------------------------
  // UI RENDER HELPERS
  // ---------------------------------------------------------
  const filteredUsers = participants.filter(p => 
     p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans relative">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-red-900/30 backdrop-blur-md shadow-2xl shadow-red-900/10">
            <div>
                <h1 className="text-3xl font-display font-bold text-red-600 tracking-wider flex items-center gap-3">
                    <Shield className="w-8 h-8" />
                    ADMIN COMMAND
                </h1>
                <p className="text-zinc-500 text-sm mt-1">CESA CodeArena • Supervisor Terminal</p>
            </div>

            {/* CONTROLS (TABS + LOGOUT) */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                {/* TABS NAVIGATION */}
                <div className="flex gap-2 bg-black/50 p-1.5 rounded-xl border border-zinc-800">
                    {['monitor', 'controls', 'questions'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-bold transition-all capitalize tracking-wide",
                                activeTab === tab 
                                    ? "bg-red-700 text-white shadow-lg shadow-red-900/50 scale-105" 
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* LOGOUT BUTTON */}
                <Button 
                    onClick={handleLogout} 
                    variant="ghost" 
                    className="border border-red-900/50 text-red-500 hover:bg-red-950 hover:text-red-400 font-bold px-4"
                >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
            </div>
        </header>

        {/* ======================= TAB: MONITORING ======================= */}
        {activeTab === 'monitor' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Active Runners</div>
                        <div className="text-3xl font-mono font-bold text-green-500">
                            {participants.filter(p => p.status === 'active').length}
                        </div>
                    </div>
                    <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Frozen / Paused</div>
                        <div className="text-3xl font-mono font-bold text-orange-500">
                            {participants.filter(p => p.status === 'frozen').length}
                        </div>
                    </div>
                    <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Waiting Room</div>
                        <div className="text-3xl font-mono font-bold text-blue-500">
                            {participants.filter(p => p.current_round_slug === 'waiting').length}
                        </div>
                    </div>
                    <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Disqualified</div>
                        <div className="text-3xl font-mono font-bold text-red-600">
                            {participants.filter(p => p.status === 'disqualified').length}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <Input 
                            className="pl-10 bg-zinc-900/80 border-zinc-800 text-white focus:border-red-500 transition-colors h-10" 
                            placeholder="Search by email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={fetchData} variant="outline" className="border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800">
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} /> Refresh
                    </Button>
                </div>

                {/* Users Table */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-black/40 uppercase text-[11px] font-bold text-zinc-500 border-b border-zinc-800 tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Candidate</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Current Round</th>
                                <th className="p-4 text-center text-red-500">Tab Switches</th>
                                <th className="p-4 text-right pr-6">Controls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-600 italic">No participants found.</td>
                                </tr>
                            ) : filteredUsers.map((p) => (
                                <tr key={p.user_id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 pl-6 font-medium text-white">
                                        {p.email}
                                        <div className="text-[10px] text-zinc-600 font-mono">{p.user_id.slice(0, 8)}...</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                            p.status === 'active' ? "border-green-800 bg-green-900/20 text-green-400" :
                                            p.status === 'frozen' ? "border-orange-800 bg-orange-900/20 text-orange-400 animate-pulse" : 
                                            "border-red-800 bg-red-900/20 text-red-500"
                                        )}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-4 capitalize font-mono text-zinc-300">{p.current_round_slug}</td>
                                    <td className="p-4 text-center">
                                        <span className={cn(
                                            "font-mono text-lg font-bold",
                                            p.tab_switches > 0 ? "text-red-500" : "text-zinc-700"
                                        )}>
                                            {p.tab_switches}
                                        </span>
                                    </td>
                                    <td className="p-4 pr-6 flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        {p.status === 'frozen' ? (
                                            <Button size="sm" onClick={() => handleUserAction('unfreeze', p.user_id)} 
                                                className="bg-green-700 hover:bg-green-600 text-white h-8 text-xs font-bold">
                                                <Play className="w-3 h-3 mr-1" /> Resume
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => handleUserAction('freeze', p.user_id)}
                                                className="border-orange-600/50 text-orange-500 hover:bg-orange-900/20 h-8 text-xs">
                                                <Lock className="w-3 h-3 mr-1" /> Freeze
                                            </Button>
                                        )}
                                        <Button size="sm" variant="destructive" onClick={() => handleUserAction('dq', p.user_id)} className="h-8 w-8 p-0">
                                            <Ban className="w-3 h-3" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* ======================= TAB: CONTROLS ======================= */}
        {activeTab === 'controls' && (
            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Start Exam Card */}
                <div className="bg-zinc-900/80 border border-green-900/50 p-8 rounded-2xl relative overflow-hidden group hover:border-green-600/50 transition-colors">
                    <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-900/30 rounded-lg text-green-400">
                            <Play className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-green-400">Start Competition</h3>
                            <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Mass Action</p>
                        </div>
                    </div>
                    
                    <p className="text-zinc-300 mb-8 text-sm leading-relaxed">
                        This action will fetch all users currently in the <strong>Waiting Room</strong> and move them to <strong>Round 1 (MCQ)</strong>. The exam timer will begin immediately for them.
                    </p>
                    
                    <Button onClick={startExam} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 shadow-lg shadow-green-900/20">
                        {loading ? "Processing..." : "CLEAR WAITING ROOM & START"}
                    </Button>
                </div>

                {/* Reset Card */}
                <div className="bg-zinc-900/80 border border-red-900/50 p-8 rounded-2xl relative overflow-hidden group hover:border-red-600/50 transition-colors">
                    <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-900/30 rounded-lg text-red-500">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-red-500">Emergency Reset</h3>
                            <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Critical Action</p>
                        </div>
                    </div>
                    
                    <p className="text-zinc-300 mb-8 text-sm leading-relaxed">
                        Use this only if a catastrophic error occurs. It will pull <strong>everyone</strong> back to the waiting room, potentially losing progress.
                    </p>
                    
                    <Button onClick={resetAllToWaiting} disabled={loading} variant="destructive" className="w-full h-12 shadow-lg shadow-red-900/20">
                        {loading ? "Resetting..." : "RESET ALL TO WAITING"}
                    </Button>
                </div>
                
                {/* Instructions */}
                <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
                    <h4 className="text-zinc-400 font-bold mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Operational Checklist
                    </h4>
                    <ul className="text-sm text-zinc-500 space-y-2 list-disc pl-5">
                        <li>Ensure all candidates are logged in and visible in the <strong>Monitor</strong> tab with status 'Waiting'.</li>
                        <li>Add all required questions in the <strong>Questions</strong> tab before starting.</li>
                        <li>If a student gets disconnected, they can log back in. Their session state is saved in the database.</li>
                    </ul>
                </div>
            </div>
        )}

        {/* ======================= TAB: QUESTIONS ======================= */}
        {activeTab === 'questions' && (
            <div className="grid lg:grid-cols-[400px,1fr] gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* Left: Add Form */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl h-fit shadow-xl">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg border-b border-zinc-800 pb-4">
                        <Plus className="w-5 h-5 text-red-500" /> Add New Question
                    </h3>
                    
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Question Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setNewQ({...newQ, type: 'mcq'})}
                                    className={cn("p-2 rounded border text-sm font-bold transition-all", newQ.type === 'mcq' ? "bg-red-600 border-red-600 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500")}
                                >
                                    MCQ
                                </button>
                                <button 
                                    onClick={() => setNewQ({...newQ, type: 'coding'})}
                                    className={cn("p-2 rounded border text-sm font-bold transition-all", newQ.type === 'coding' ? "bg-blue-600 border-blue-600 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500")}
                                >
                                    Coding
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Title / Problem Name</label>
                            <Input 
                                className="bg-black border-zinc-700 text-white focus:border-red-500" 
                                value={newQ.title} 
                                onChange={(e) => setNewQ({...newQ, title: e.target.value})} 
                                placeholder="e.g. Reverse a String"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Description</label>
                            <Textarea 
                                className="bg-black border-zinc-700 text-white min-h-[100px] focus:border-red-500" 
                                value={newQ.description} 
                                onChange={(e) => setNewQ({...newQ, description: e.target.value})} 
                                placeholder="Full problem statement..."
                            />
                        </div>

                        {newQ.type === 'mcq' && (
                            <div className="space-y-3 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                                <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Options</label>
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                    <div key={opt} className="flex gap-2 items-center">
                                        <span className="text-xs font-bold text-zinc-600 w-4">{opt}</span>
                                        <Input 
                                            placeholder={`Option ${opt}`} 
                                            className="bg-zinc-900 border-zinc-700 text-sm h-8" 
                                            value={(newQ as any)[`option${opt}`]} 
                                            onChange={e => setNewQ({...newQ, [`option${opt}`]: e.target.value})} 
                                        />
                                    </div>
                                ))}
                                
                                <label className="text-xs text-green-500 uppercase font-bold tracking-wider mt-2 block">Correct Answer</label>
                                <Input 
                                    placeholder="Copy exact text of correct option" 
                                    className="bg-green-900/10 border-green-900/50 text-green-400 placeholder:text-green-900" 
                                    value={newQ.correct} 
                                    onChange={e => setNewQ({...newQ, correct: e.target.value})} 
                                />
                            </div>
                        )}

                        <Button onClick={handleAddQuestion} className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-10 mt-4">
                            <Save className="w-4 h-4 mr-2" /> Save to Database
                        </Button>
                    </div>
                </div>

                {/* Right: Question List */}
                <div className="space-y-4">
                    <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-wider mb-4">Existing Questions ({questions.length})</h3>
                    
                    <div className="grid gap-3">
                        {questions.length === 0 ? (
                            <div className="text-center p-12 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
                                No questions added yet.
                            </div>
                        ) : questions.map((q) => (
                            <div key={q.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex justify-between items-start group hover:border-zinc-600 transition-all">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide",
                                            q.type === 'mcq' ? "bg-blue-900/20 text-blue-400 border border-blue-900/30" : "bg-purple-900/20 text-purple-400 border border-purple-900/30"
                                        )}>
                                            {q.type}
                                        </span>
                                        <h4 className="font-bold text-white text-sm">{q.title}</h4>
                                    </div>
                                    <p className="text-zinc-500 text-xs line-clamp-1 pl-1">{q.description}</p>
                                </div>
                                <Button size="icon" variant="ghost" className="text-zinc-600 hover:text-red-500 hover:bg-red-900/10 h-8 w-8" onClick={() => deleteQuestion(q.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}