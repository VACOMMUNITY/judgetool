import React, { useState } from 'react';
import { LeaderboardEntry, SystemSettings } from '@/types/aiJudge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Trophy,
  Medal,
  Award,
  Download,
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Eye,
  Filter,
  Sparkles,
  GitCommit,
} from 'lucide-react';
import { aiJudgeService } from '@/services/aiJudgeService';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  settings: SystemSettings;
  activeRole: 'admin' | 'judge' | 'public';
  onSelectTeam: (teamId: string) => void;
  onSettingsUpdated?: () => void;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  leaderboard,
  settings,
  activeRole,
  onSelectTeam,
  onSettingsUpdated,
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'officially_approved' | 'provisional_ai'>('all');
  const [isTogglingLock, setIsTogglingLock] = useState(false);

  const filteredEntries = leaderboard.filter((entry) => {
    const matchesSearch =
      entry.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.teamId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.college.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'officially_approved'
        ? entry.reviewStatus === 'officially_approved'
        : entry.reviewStatus !== 'officially_approved';

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const csvContent = aiJudgeService.exportLeaderboardToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CommunityVA_Hackathon2026_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Leaderboard Exported',
      description: 'Downloaded official hackathon leaderboard as CSV spreadsheet.',
    });
  };

  const handleToggleLock = () => {
    if (activeRole !== 'admin') {
      toast({
        title: 'Admin Only',
        description: 'Only authorized organizers can lock or unlock finalized results.',
        variant: 'destructive',
      });
      return;
    }

    setIsTogglingLock(true);
    const newLockState = !settings.isLeaderboardLocked;
    aiJudgeService.updateSystemSettings({ isLeaderboardLocked: newLockState });
    setIsTogglingLock(false);

    toast({
      title: newLockState ? 'Results Locked' : 'Results Unlocked',
      description: newLockState
        ? 'Final hackathon rankings are locked and certified.'
        : 'Rankings unlocked for further judge review.',
    });

    if (onSettingsUpdated) onSettingsUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Official Tie-Break Banner */}
      <div className="bg-[#1C2541]/80 border border-cyan-800/60 p-4 rounded-2xl backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-700/50 mt-0.5">
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-cyan-200">
              Official Published Tie-Break Rule (Section 7)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              Tied total scores are resolved by:{' '}
              <strong className="text-cyan-300 font-medium">1. Higher Stage 4 Final Project Output</strong>{' '}
              marks, followed by{' '}
              <strong className="text-cyan-300 font-medium">2. Higher Stage 3 Prototype Progress</strong>{' '}
              marks. If still tied, the result is escalated to the Human Judging Panel for a documented decision.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="border-cyan-700 text-cyan-300 hover:bg-cyan-950 h-9 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>

          {activeRole === 'admin' && (
            <Button
              size="sm"
              onClick={handleToggleLock}
              disabled={isTogglingLock}
              className={`h-9 text-xs font-semibold ${
                settings.isLeaderboardLocked
                  ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {settings.isLeaderboardLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 mr-1.5" /> Locked (Official)
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 mr-1.5" /> Lock Final Results
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            type="text"
            placeholder="Search teams by name, ID, college, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#0B132B] border-cyan-900/60 pl-9 text-xs h-10 text-white placeholder:text-slate-500 focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Filter:</span>
          <div className="flex bg-[#0B132B] p-1 rounded-xl border border-cyan-900/50 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({leaderboard.length})
            </button>
            <button
              onClick={() => setStatusFilter('officially_approved')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'officially_approved'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('provisional_ai')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'provisional_ai'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Provisional AI
            </button>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-[#0B132B] rounded-2xl border border-cyan-900/50 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C2541]/90 border-b border-cyan-900/50 text-slate-300 font-semibold tracking-wider uppercase text-[11px]">
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Team & Project</th>
                <th className="py-3.5 px-3 text-center">Problem (15)</th>
                <th className="py-3.5 px-3 text-center">Pitch (20)</th>
                <th className="py-3.5 px-3 text-center">Proto (25)</th>
                <th className="py-3.5 px-3 text-center">Output (40)</th>
                <th className="py-3.5 px-4 text-center font-bold text-cyan-300">Total (100)</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/70 text-slate-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-500">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-sm text-slate-200">No Teams in Leaderboard</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      All fake data has been removed. Switch to "Team Management" to register actual hackathon teams or attach real video submissions.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                const isWinner = entry.rank === 1;
                const isRunnerUp = entry.rank === 2;
                const isSecondRunnerUp = entry.rank === 3;

                return (
                  <tr
                    key={entry.teamId}
                    className={`hover:bg-[#1C2541]/50 transition-colors ${
                      isWinner
                        ? 'bg-amber-500/5 font-medium'
                        : isRunnerUp
                        ? 'bg-slate-400/5'
                        : isSecondRunnerUp
                        ? 'bg-amber-700/5'
                        : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-4 px-4 text-center font-mono font-bold">
                      {isWinner ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shadow-amber-500/30">
                            1
                          </span>
                          <span className="text-[10px] text-amber-400 font-semibold mt-0.5">Winner</span>
                        </div>
                      ) : isRunnerUp ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                            2
                          </span>
                          <span className="text-[10px] text-slate-300 font-semibold mt-0.5">Runner-Up</span>
                        </div>
                      ) : isSecondRunnerUp ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                            3
                          </span>
                          <span className="text-[10px] text-amber-500 font-semibold mt-0.5">2nd Runner-Up</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">{entry.rank}</span>
                      )}
                    </td>

                    {/* Team Details */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white hover:text-cyan-300 transition-colors cursor-pointer" onClick={() => onSelectTeam(entry.teamId)}>
                            {entry.teamName}
                          </span>
                          <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
                            {entry.teamId}
                          </span>
                          {entry.isTied && (
                            <Badge variant="outline" className="text-[10px] bg-indigo-950/70 text-indigo-300 border-indigo-700/60" title={entry.tieBreakReason}>
                              Tie-Break Applied
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
                          {entry.projectTitle}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {entry.college}
                        </span>
                      </div>
                    </td>

                    {/* Stage 1 */}
                    <td className="py-4 px-3 text-center font-mono">
                      <span className="font-medium text-slate-200">{entry.problemScore.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 block">/15</span>
                    </td>

                    {/* Stage 2 */}
                    <td className="py-4 px-3 text-center font-mono">
                      <span className="font-medium text-slate-200">{entry.pitchDeckScore.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 block">/20</span>
                    </td>

                    {/* Stage 3 */}
                    <td className="py-4 px-3 text-center font-mono">
                      <span className="font-medium text-slate-200">{entry.prototypeScore.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 block">/25</span>
                    </td>

                    {/* Stage 4 */}
                    <td className="py-4 px-3 text-center font-mono">
                      <span className={`font-semibold ${isWinner || isRunnerUp ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {entry.finalOutputScore.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/40</span>
                    </td>

                    {/* Total Score & Percentage */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-extrabold text-base text-cyan-300">
                          {entry.totalScore.toFixed(1)}
                        </span>
                        <span className="font-mono text-[10px] text-cyan-500">
                          {entry.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Review Status */}
                    <td className="py-4 px-3 text-center">
                      {entry.reviewStatus === 'officially_approved' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : entry.reviewStatus === 'judge_reviewed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/70 border border-amber-800/60 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> In Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 bg-blue-950/70 border border-blue-800/60 px-2.5 py-1 rounded-full">
                          <Sparkles className="w-3 h-3" /> Provisional AI
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectTeam(entry.teamId)}
                        className="h-8 text-xs text-cyan-300 hover:text-white hover:bg-cyan-900/60"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Scorecard
                      </Button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
