import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Trophy, FileText, Code, GitBranch, AlertTriangle, 
  Download, Lock, Unlock, Ban, Eye, ChevronRight, Search,
  BarChart3, Clock, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedBackground } from '@/components/competition/AnimatedBackground';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const mockParticipants = [
  { id: 'P001', name: 'Rahul Sharma', email: 'rahul@example.com', currentRound: 'coding', score: 185, status: 'active', tabSwitches: 1 },
  { id: 'P002', name: 'Priya Patel', email: 'priya@example.com', currentRound: 'flowchart', score: 120, status: 'active', tabSwitches: 0 },
  { id: 'P003', name: 'Amit Kumar', email: 'amit@example.com', currentRound: 'mcq', score: 45, status: 'active', tabSwitches: 2 },
  { id: 'P004', name: 'Sneha Reddy', email: 'sneha@example.com', currentRound: 'completed', score: 245, status: 'completed', tabSwitches: 0 },
  { id: 'P005', name: 'Vikram Singh', email: 'vikram@example.com', currentRound: 'mcq', score: 0, status: 'disqualified', tabSwitches: 5 },
];

const mockLeaderboard = [
  { rank: 1, name: 'Sneha Reddy', score: 245, time: '1:42:30' },
  { rank: 2, name: 'Rahul Sharma', score: 185, time: '1:15:00' },
  { rank: 3, name: 'Priya Patel', score: 120, time: '0:45:00' },
  { rank: 4, name: 'Amit Kumar', score: 45, time: '0:20:00' },
];

const mockCheatingLogs = [
  { id: 1, participantId: 'P005', type: 'tab_switch', count: 5, timestamp: '2024-01-15 14:32:15', action: 'Disqualified' },
  { id: 2, participantId: 'P003', type: 'tab_switch', count: 2, timestamp: '2024-01-15 14:28:00', action: 'Warning Issued' },
  { id: 3, participantId: 'P001', type: 'copy_attempt', count: 1, timestamp: '2024-01-15 14:25:30', action: 'Logged' },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Total Participants', value: 127, icon: Users, color: 'primary' },
    { label: 'Currently Active', value: 98, icon: Clock, color: 'success' },
    { label: 'Completed', value: 24, icon: Trophy, color: 'warning' },
    { label: 'Flagged/DQ', value: 5, icon: AlertTriangle, color: 'destructive' },
  ];

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Admin Header */}
        <header className="glass-strong border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-destructive to-warning flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg leading-none">
                  Admin Panel
                </h1>
                <p className="text-xs text-muted-foreground">CESA CodeArena Control</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-muted-foreground">Competition Active</span>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export Results
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-strong rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={cn(
                    "w-5 h-5",
                    stat.color === 'primary' && "text-primary",
                    stat.color === 'success' && "text-success",
                    stat.color === 'warning' && "text-warning",
                    stat.color === 'destructive' && "text-destructive",
                  )} />
                  <span className={cn(
                    "text-2xl font-display font-bold",
                    stat.color === 'primary' && "text-primary",
                    stat.color === 'success' && "text-success",
                    stat.color === 'warning' && "text-warning",
                    stat.color === 'destructive' && "text-destructive",
                  )}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="glass-strong p-1">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="participants" className="gap-2">
                <Users className="w-4 h-4" />
                Participants
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="submissions" className="gap-2">
                <Code className="w-4 h-4" />
                Submissions
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Security Logs
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Round Progress */}
                <div className="glass-strong rounded-xl p-6">
                  <h3 className="font-display font-bold mb-4">Round Progress</h3>
                  <div className="space-y-4">
                    {['MCQ Round', 'Flowchart', 'Coding'].map((round, i) => (
                      <div key={round} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{round}</span>
                          <span className="text-muted-foreground">{40 - i * 10}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                            style={{ width: `${40 - i * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-strong rounded-xl p-6">
                  <h3 className="font-display font-bold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="gap-2 h-auto py-3 flex-col">
                      <Lock className="w-5 h-5" />
                      <span className="text-xs">Lock All Rounds</span>
                    </Button>
                    <Button variant="outline" className="gap-2 h-auto py-3 flex-col">
                      <Unlock className="w-5 h-5" />
                      <span className="text-xs">Unlock Round</span>
                    </Button>
                    <Button variant="outline" className="gap-2 h-auto py-3 flex-col text-destructive border-destructive/50">
                      <Ban className="w-5 h-5" />
                      <span className="text-xs">DQ User</span>
                    </Button>
                    <Button variant="outline" className="gap-2 h-auto py-3 flex-col">
                      <Download className="w-5 h-5" />
                      <span className="text-xs">Export Data</span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value="participants" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search participants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card"
                  />
                </div>
              </div>
              
              <div className="glass-strong rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-4">ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Current Round</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Tab Switches</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockParticipants.map((p) => (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-mono text-sm">{p.id}</td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-sm">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary capitalize">
                            {p.currentRound}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-primary">{p.score}</td>
                        <td className="p-4">
                          <span className={cn(
                            "font-mono",
                            p.tabSwitches >= 3 && "text-destructive",
                            p.tabSwitches > 0 && p.tabSwitches < 3 && "text-warning",
                          )}>
                            {p.tabSwitches}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs",
                            p.status === 'active' && "bg-success/20 text-success",
                            p.status === 'completed' && "bg-primary/20 text-primary",
                            p.status === 'disqualified' && "bg-destructive/20 text-destructive",
                          )}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                              <Ban className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-4">
              <div className="glass-strong rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-4">Rank</th>
                      <th className="p-4">Participant</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLeaderboard.map((entry) => (
                      <tr key={entry.rank} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <span className={cn(
                            "w-8 h-8 rounded-full inline-flex items-center justify-center font-display font-bold",
                            entry.rank === 1 && "bg-warning/20 text-warning",
                            entry.rank === 2 && "bg-muted text-muted-foreground",
                            entry.rank === 3 && "bg-orange-500/20 text-orange-500",
                            entry.rank > 3 && "bg-muted/50 text-muted-foreground",
                          )}>
                            {entry.rank}
                          </span>
                        </td>
                        <td className="p-4 font-medium">{entry.name}</td>
                        <td className="p-4 font-mono font-bold text-primary">{entry.score}</td>
                        <td className="p-4 font-mono text-muted-foreground">{entry.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="space-y-4">
              <div className="glass-strong rounded-xl p-8 text-center">
                <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">Code Submissions</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  View all code submissions, flowcharts, and MCQ answers from participants.
                  Click on a participant to view their detailed submissions.
                </p>
              </div>
            </TabsContent>

            {/* Security Logs Tab */}
            <TabsContent value="security" className="space-y-4">
              <div className="glass-strong rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Participant</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Count</th>
                      <th className="p-4">Action Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCheatingLogs.map((log) => (
                      <tr key={log.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-mono text-xs text-muted-foreground">{log.timestamp}</td>
                        <td className="p-4 font-mono text-sm">{log.participantId}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded text-xs bg-warning/20 text-warning">
                            {log.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{log.count}</td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs",
                            log.action === 'Disqualified' && "bg-destructive/20 text-destructive",
                            log.action === 'Warning Issued' && "bg-warning/20 text-warning",
                            log.action === 'Logged' && "bg-muted text-muted-foreground",
                          )}>
                            {log.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
