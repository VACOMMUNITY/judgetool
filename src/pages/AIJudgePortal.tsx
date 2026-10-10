import React, { useState, useEffect } from 'react';
import {
  HackathonTeamRecord,
  hackathonJudgeDb,
} from '@/services/hackathonJudgeDb';
import { VideoAiService } from '@/services/videoAiService';
import { TeamEvaluationView } from '@/components/judge/TeamEvaluationView';
import { LeaderboardView } from '@/components/judge/LeaderboardView';
import { AddTeamDialog } from '@/components/judge/AddTeamDialog';
import { ApiKeySettingsDialog } from '@/components/judge/ApiKeySettingsDialog';
import { AnnounceWinnerDialog } from '@/components/judge/AnnounceWinnerDialog';
import { CertificateDistributionDialog } from '@/components/judge/CertificateDistributionDialog';
import { PublicCertificateView } from '@/components/judge/PublicCertificateView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy,
  Scale,
  Video,
  Users,
  Search,
  PlusCircle,
  Sparkles,
  RefreshCw,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Key,
  FolderPlus,
  SlidersHorizontal,
  Award,
} from 'lucide-react';

export const AIJudgePortal: React.FC = () => {
  const { toast } = useToast();

  const [teams, setTeams] = useState<HackathonTeamRecord[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'evaluation' | 'leaderboard' | 'certificate'>('dashboard');
  const [urlCertTheme, setUrlCertTheme] = useState<'dark_winner' | 'light_clean' | undefined>(undefined);
  const [urlCertRecipient, setUrlCertRecipient] = useState<string | undefined>(undefined);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending' | 'Needs Review'>('All');

  // Modals
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isAnnounceWinnerOpen, setIsAnnounceWinnerOpen] = useState(false);
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [certificateTargetTeamId, setCertificateTargetTeamId] = useState<string | null>(null);

  const handleOpenDistributeCertificates = (teamId?: string) => {
    setCertificateTargetTeamId(teamId || selectedTeamId || teams[0]?.id || null);
    setIsCertificateDialogOpen(true);
  };

  // Batch / single analyzing state
  const [analyzingTeamId, setAnalyzingTeamId] = useState<string | null>(null);

  const reloadTeams = () => {
    const list = hackathonJudgeDb.getTeams();
    setTeams(list);
    if (selectedTeamId && !list.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(list[0]?.id || null);
    }
  };

  useEffect(() => {
    reloadTeams();

    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const teamParam = params.get('team') || params.get('teamId');
      const themeParam = params.get('theme') as 'dark_winner' | 'light_clean' | null;
      const recipientParam = params.get('recipient');

      if (themeParam) setUrlCertTheme(themeParam);
      if (recipientParam) setUrlCertRecipient(recipientParam);

      if (viewParam === 'certificate' || params.has('certificate') || (params.has('verify') && teamParam)) {
        if (teamParam) {
          setSelectedTeamId(teamParam);
          setCertificateTargetTeamId(teamParam);
        }
        setActiveTab('certificate');
      }
    } catch {}
  }, []);

  const handleSelectTeamToEvaluate = (teamId: string) => {
    setSelectedTeamId(teamId);
    setActiveTab('evaluation');
  };

  const handleAnalyzeTeamVideos = async (teamId: string) => {
    setAnalyzingTeamId(teamId);
    try {
      const res = await hackathonJudgeDb.evaluateTeamVideos(teamId);
      reloadTeams();
      if (res) {
        toast({
          title: 'Evaluation Complete',
          description: `Calculated total score: ${res.totalScore} / 100 (${res.percentage}%).`,
        });
      }
    } catch (e) {
      toast({
        title: 'Evaluation Failed',
        description: 'Encountered error analyzing video URLs.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingTeamId(null);
    }
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (confirm(`Remove team "${teamName}" from the hackathon roster?`)) {
      hackathonJudgeDb.deleteTeam(teamId);
      reloadTeams();
      toast({
        title: 'Team Removed',
        description: `${teamName} was deleted from database.`,
      });
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all team data? This will reset the judging database to empty.')) {
      hackathonJudgeDb.clearAllTeams();
      setSelectedTeamId(null);
      reloadTeams();
      toast({
        title: 'Database Reset',
        description: 'All teams removed. Roster is pristine.',
      });
    }
  };

  const handleLoadBenchmarkSamples = () => {
    hackathonJudgeDb.loadBenchmarkSamples();
    reloadTeams();
    toast({
      title: 'Benchmark Samples Loaded',
      description: 'Loaded 3 vetted hackathon teams for demonstration.',
    });
  };

  // Filtered list
  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true : t.evaluationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  const totalEvaluated = teams.filter((t) => t.evaluationStatus === 'Completed').length;
  const totalPending = teams.filter((t) => t.evaluationStatus === 'Pending').length;
  const topScore = teams.length > 0 ? Math.max(...teams.map((t) => t.finalApprovedTotal)) : 0;
  const hasGeminiKey = Boolean(VideoAiService.getApiKey());

  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-[#0B132B]/95 backdrop-blur-md border-b border-cyan-900/40 px-4 lg:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white uppercase">
                  COMMUNITY.VA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI HACKATHON JUDGE</span>
                </h1>
                <Badge className="bg-cyan-950 text-cyan-300 border-cyan-700 text-[10px] py-0 h-4 font-mono">
                  v2026.1
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap mt-0.5">
                <span className="text-slate-400">
                  AI Video Evaluation & Winner Selection System • 4-Stage Rubric (100 Marks)
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-amber-300 font-semibold flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Judge: Paidimarri Abhiram (Founder & CEO)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & API Key */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {teams.some((t) => t.finalApprovedTotal > 0 || t.evaluationStatus === 'Completed') && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleOpenDistributeCertificates()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 shadow-md shadow-emerald-900/30"
                >
                  <Award className="w-3.5 h-3.5 mr-1" />
                  Distribute Certificates (+91 8074401912, +91 8688122992)
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsAnnounceWinnerOpen(true)}
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs h-8 shadow-md shadow-amber-500/20"
                >
                  <Trophy className="w-3.5 h-3.5 mr-1 text-slate-950" />
                  Announce Winner 🏆
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsApiKeyOpen(true)}
              className="border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8"
            >
              <Key className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              {hasGeminiKey ? 'Gemini API Active' : 'Configure Gemini API'}
            </Button>

            <Button
              size="sm"
              onClick={() => setIsAddTeamOpen(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-8 font-semibold shadow-md shadow-cyan-600/30"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Register Team
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3.5 flex items-center border-t border-slate-800/80 pt-2.5 gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Judge Dashboard
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {teams.length}
            </span>
          </button>

          <button
            onClick={() => {
              if (teams.length > 0) {
                if (!selectedTeamId) setSelectedTeamId(teams[0].id);
                setActiveTab('evaluation');
              } else {
                toast({ title: 'No Teams Available', description: 'Register a team first to open evaluation.' });
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'evaluation'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Team Evaluation
            {selectedTeam && (
              <span className="text-[10px] text-cyan-400 truncate max-w-[120px]">
                ({selectedTeam.teamName})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Leaderboard & Winners
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-300 font-mono">
              Top 3
            </span>
          </button>

          {(activeTab === 'certificate' || (selectedTeam && selectedTeam.finalApprovedTotal > 0)) && (
            <button
              onClick={() => setActiveTab('certificate')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'certificate'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Verified Certificate
              {selectedTeam && (
                <span className="text-[10px] text-emerald-300 truncate max-w-[110px]">
                  ({selectedTeam.teamName})
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* VIEW 1: JUDGE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="bg-[#0B132B] p-4 rounded-xl border border-slate-800 shadow-md">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Teams
                </span>
                <div className="text-2xl font-bold text-white mt-1">{teams.length}</div>
                <span className="text-[11px] text-slate-500">Registered Roster</span>
              </div>

              <div className="bg-[#0B132B] p-4 rounded-xl border border-slate-800 shadow-md">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  AI Evaluated
                </span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{totalEvaluated}</div>
                <span className="text-[11px] text-slate-500">Scores Computed / 100</span>
              </div>

              <div className="bg-[#0B132B] p-4 rounded-xl border border-slate-800 shadow-md">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                  Pending AI Run
                </span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{totalPending}</div>
                <span className="text-[11px] text-slate-500">Awaiting Video Analysis</span>
              </div>

              <div className="bg-[#0B132B] p-4 rounded-xl border border-slate-800 shadow-md">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
                  Highest Score
                </span>
                <div className="text-2xl font-bold text-cyan-400 mt-1">
                  {teams.length > 0 ? `${topScore.toFixed(1)}/100` : '--'}
                </div>
                <span className="text-[11px] text-slate-500">Leaderboard Peak</span>
              </div>
            </div>

            {/* Celebratory Announce Winner Banner if any teams have scores */}
            {teams.some((t) => t.finalApprovedTotal > 0 || t.evaluationStatus === 'Completed') && (
              <div className="bg-gradient-to-r from-amber-950/70 via-[#111C3A] to-cyan-950/70 border-2 border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
                        SCORES ASSIGNED • LEADING SCORE: {topScore}/100
                      </span>
                      <Badge className="bg-amber-400 text-slate-950 font-mono text-[10px] font-black">
                        {totalEvaluated} Teams Graded
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Videos have been evaluated. Click <strong>Announce Winners</strong> to crown the champion, runner-up, and unlock podium results.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsAnnounceWinnerOpen(true)}
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs h-10 px-5 shadow-lg shadow-amber-500/30 whitespace-nowrap"
                >
                  <Trophy className="w-4 h-4 mr-1.5 text-slate-950" /> Announce Winners 🏆
                </Button>
              </div>
            )}

            {/* Controls Bar: Search, Filters & Quick Actions */}
            <div className="bg-[#0B132B] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    placeholder="Search teams by name, project, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-900 border-slate-700 text-white placeholder-slate-500 text-xs h-9 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  {(['All', 'Completed', 'Pending'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        statusFilter === status
                          ? 'bg-cyan-700 text-white font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLoadBenchmarkSamples}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9"
                  title="Load 3 sample hackathon teams for instant demonstration"
                >
                  <FolderPlus className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  Load Samples
                </Button>

                {teams.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearAll}
                    className="border-rose-900/60 text-rose-400 hover:bg-rose-950/60 text-xs h-9"
                    title="Remove all teams and reset database"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear Roster
                  </Button>
                )}
              </div>
            </div>

            {/* Teams Roster List */}
            {filteredTeams.length === 0 ? (
              <div className="bg-[#0B132B] rounded-2xl border border-slate-800 p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center mx-auto text-cyan-400">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">No Hackathon Teams Found</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    {teams.length === 0
                      ? 'The judging roster is currently clean and empty. Register teams with their 4 video submissions or load benchmark samples to start evaluating.'
                      : 'No teams match the current search query or filter.'}
                  </p>
                </div>
                {teams.length === 0 && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      onClick={() => setIsAddTeamOpen(true)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                      Register First Team
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleLoadBenchmarkSamples}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                    >
                      <FolderPlus className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                      Load Benchmark Samples
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredTeams.map((team) => {
                  const isCurrentAnalyzing = analyzingTeamId === team.id;
                  const v1Valid = Boolean(team.videoUrls.video1);
                  const v2Valid = Boolean(team.videoUrls.video2);
                  const v3Valid = Boolean(team.videoUrls.video3);
                  const v4Valid = Boolean(team.videoUrls.video4);

                  return (
                    <div
                      key={team.id}
                      className="bg-[#0B132B] hover:bg-[#0E1838] transition-all rounded-xl border border-slate-800 hover:border-cyan-800/60 p-4 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                            {team.id}
                          </span>
                          <h3 className="text-base font-bold text-white truncate">{team.teamName}</h3>
                          <Badge
                            className={
                              team.evaluationStatus === 'Completed'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 text-[10px]'
                                : team.evaluationStatus === 'Analyzing'
                                ? 'bg-blue-950 text-blue-300 border-blue-700 text-[10px] animate-pulse'
                                : 'bg-slate-800 text-slate-300 border-slate-700 text-[10px]'
                            }
                          >
                            {team.evaluationStatus}
                          </Badge>
                          {team.rank && team.rank <= 3 && (
                            <Badge className="bg-amber-950 text-amber-300 border-amber-700 text-[10px]">
                              {team.rank === 1 ? '🥇 Rank 1' : team.rank === 2 ? '🥈 Rank 2' : '🥉 Rank 3'}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 font-medium truncate">
                          {team.projectName}
                        </p>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="font-semibold text-slate-500">Members:</span>
                          <span className="truncate">{team.members.join(', ')}</span>
                        </div>

                        {/* Four Video Marks Breakdown Badges */}
                        <div className="flex items-center gap-1.5 pt-1.5 flex-wrap text-[11px]">
                          <span className="text-slate-400 font-semibold text-[10px] uppercase">Marks Breakdown:</span>
                          <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/60 font-mono text-[10px]">
                            V1 Problem: <strong>{team.judgeOverrides.video1 ?? team.scores.video1}</strong>/15
                          </span>
                          <span className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-900/60 font-mono text-[10px]">
                            V2 Pitch: <strong>{team.judgeOverrides.video2 ?? team.scores.video2}</strong>/20
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-900/60 font-mono text-[10px]">
                            V3 Prototype: <strong>{team.judgeOverrides.video3 ?? team.scores.video3}</strong>/25
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/60 font-mono text-[10px]">
                            V4 Final Demo: <strong>{team.judgeOverrides.video4 ?? team.scores.video4}</strong>/40
                          </span>
                        </div>
                      </div>

                      {/* Middle: Score Summary */}
                      <div className="bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center justify-between lg:justify-center gap-4 lg:text-center min-w-[150px]">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Total Marks
                          </div>
                          <div className="text-xl font-black text-white font-mono mt-0.5">
                            {team.evaluationStatus === 'Completed' || team.finalApprovedTotal > 0 ? (
                              <span className="text-cyan-400">{team.finalApprovedTotal} <span className="text-xs text-slate-400">/ 100</span></span>
                            ) : (
                              <span className="text-slate-500">-- / 100</span>
                            )}
                          </div>
                        </div>
                        {(team.evaluationStatus === 'Completed' || team.finalApprovedTotal > 0) && (
                          <div className="text-right lg:text-center">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Percentage
                            </div>
                            <div className="text-xs font-mono font-bold text-emerald-400">
                              {team.finalApprovedTotal}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end lg:self-center flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => handleAnalyzeTeamVideos(team.id)}
                          disabled={isCurrentAnalyzing}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-9"
                        >
                          {isCurrentAnalyzing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-cyan-200" />
                              AI Analyze All
                            </>
                          )}
                        </Button>

                        {team.finalApprovedTotal > 0 && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleOpenDistributeCertificates(team.id)}
                              className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-2.5 border border-emerald-500/40"
                              title="Distribute Certificate to +91 8074401912 & +91 8688122992"
                            >
                              <Award className="w-3.5 h-3.5 mr-1" />
                              Cert
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTeamId(team.id);
                                setIsAnnounceWinnerOpen(true);
                              }}
                              className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs h-9 px-3 shadow-md shadow-amber-500/20"
                            >
                              <Trophy className="w-3.5 h-3.5 mr-1" />
                              Announce Winner
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectTeamToEvaluate(team.id)}
                          className="border-cyan-700/80 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900 text-xs h-9 font-semibold"
                        >
                          <Award className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                          Give Marks
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>

                        <button
                          onClick={() => handleDeleteTeam(team.id, team.teamName)}
                          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: TEAM EVALUATION VIEW */}
        {activeTab === 'evaluation' && (
          <div>
            {teams.length === 0 ? (
              <div className="bg-[#0B132B] rounded-2xl border border-slate-800 p-8 text-center space-y-3">
                <p className="text-slate-400 text-sm">No teams registered yet.</p>
                <Button onClick={() => setIsAddTeamOpen(true)} className="bg-cyan-600 text-xs">
                  Register Team
                </Button>
              </div>
            ) : selectedTeam ? (
              <div className="space-y-4">
                {/* Team Switcher Bar */}
                <div className="bg-[#0B132B] p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Select Team:</span>
                    <select
                      value={selectedTeam.id}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-cyan-500"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id}: {t.teamName} ({t.finalApprovedTotal}/100)
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveTab('dashboard')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Back to Dashboard
                  </Button>
                </div>

                <TeamEvaluationView
                  team={selectedTeam}
                  onBack={() => setActiveTab('dashboard')}
                  onUpdated={reloadTeams}
                  onAnnounceWinner={() => setIsAnnounceWinnerOpen(true)}
                  onOpenDistributeCertificates={handleOpenDistributeCertificates}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW 3: LEADERBOARD & WINNERS */}
        {activeTab === 'leaderboard' && (
          <div>
            <LeaderboardView
              teams={teams}
              onSelectTeam={(teamId) => {
                setSelectedTeamId(teamId);
                setActiveTab('evaluation');
              }}
              onRefresh={reloadTeams}
              onAnnounceWinner={() => setIsAnnounceWinnerOpen(true)}
              onOpenDistributeCertificates={handleOpenDistributeCertificates}
            />
          </div>
        )}

        {/* VIEW 4: PUBLIC VERIFIED CERTIFICATE SHOWCASE */}
        {activeTab === 'certificate' && (
          <div>
            {selectedTeam ? (
              <PublicCertificateView
                team={selectedTeam}
                initialTheme={urlCertTheme}
                initialRecipient={urlCertRecipient}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            ) : (
              <div className="bg-[#0B132B] rounded-2xl border border-slate-800 p-8 text-center space-y-3">
                <p className="text-slate-400 text-sm">No team selected for certificate display.</p>
                <Button onClick={() => setActiveTab('dashboard')} className="bg-cyan-600 text-xs">
                  Return to Dashboard
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddTeamDialog
        open={isAddTeamOpen}
        onOpenChange={setIsAddTeamOpen}
        onTeamAdded={reloadTeams}
      />

      <ApiKeySettingsDialog
        open={isApiKeyOpen}
        onOpenChange={setIsApiKeyOpen}
      />

      <AnnounceWinnerDialog
        open={isAnnounceWinnerOpen}
        onOpenChange={setIsAnnounceWinnerOpen}
        teams={teams}
        onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
        onRefresh={reloadTeams}
        onOpenDistributeCertificates={handleOpenDistributeCertificates}
      />

      <CertificateDistributionDialog
        open={isCertificateDialogOpen}
        onOpenChange={setIsCertificateDialogOpen}
        teams={teams}
        initialTeamId={certificateTargetTeamId}
      />
    </div>
  );
};

export default AIJudgePortal;
