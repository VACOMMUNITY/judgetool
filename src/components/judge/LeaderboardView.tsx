import React, { useState } from 'react';
import { HackathonTeamRecord, hackathonJudgeDb } from '@/services/hackathonJudgeDb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy,
  Medal,
  Award,
  Download,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  GitCommit,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface LeaderboardViewProps {
  teams: HackathonTeamRecord[];
  onSelectTeam: (teamId: string) => void;
  onRefresh: () => void;
  onAnnounceWinner?: () => void;
  onOpenDistributeCertificates?: (teamId?: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  teams,
  onSelectTeam,
  onRefresh,
  onAnnounceWinner,
  onOpenDistributeCertificates,
}) => {
  const { toast } = useToast();
  const isApproved = hackathonJudgeDb.isOfficialApproved();

  const handleExportCsv = () => {
    const csvContent = hackathonJudgeDb.exportLeaderboardCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CommunityVA_AI_Judge_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Leaderboard Exported',
      description: 'Downloaded rankings as CSV spreadsheet.',
    });
  };

  const handleToggleApproval = () => {
    const nextState = !isApproved;
    hackathonJudgeDb.setOfficialApproval(nextState);
    onRefresh();
    toast({
      title: nextState ? 'Winners Approved & Ratified' : 'Provisional Status Restored',
      description: nextState
        ? 'Official hackathon results have been verified and approved by the judging panel.'
        : 'Scores set back to provisional review status.',
    });
  };

  const topThree = teams.slice(0, 3);
  const winner = topThree.find((t) => t.rank === 1);
  const runnerUp = topThree.find((t) => t.rank === 2);
  const secondRunnerUp = topThree.find((t) => t.rank === 3);

  return (
    <div className="space-y-8">
      {/* Top Banner and Approval Controls */}
      <div className="bg-[#0B132B] p-5 rounded-2xl border border-cyan-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Leaderboard & Winners</h2>
            <Badge
              className={
                isApproved
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 text-xs'
                  : 'bg-amber-950 text-amber-300 border-amber-700 text-xs'
              }
            >
              {isApproved ? 'Officially Approved by Judges' : 'Provisional AI Scores'}
            </Badge>
          </div>
          <p className="text-xs text-slate-300">
            Ranked by total score out of 100 with automatic tie-break evaluation (Stage 4 Output $\rightarrow$ Stage 3 Prototype).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenDistributeCertificates && (
            <Button
              size="sm"
              onClick={() => onOpenDistributeCertificates()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 text-xs px-3.5 shadow-md shadow-emerald-900/40"
              title="Distribute certificates to +91 8074401912 and +91 8688122992 according to results"
            >
              <Award className="w-3.5 h-3.5 mr-1 text-white" /> Distribute Certificates (+91 8074401912, +91 8688122992)
            </Button>
          )}

          {onAnnounceWinner && (
            <Button
              size="sm"
              onClick={onAnnounceWinner}
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black h-9 text-xs px-4 shadow-md shadow-amber-500/20"
            >
              <Trophy className="w-3.5 h-3.5 mr-1.5" /> Announce Winner Ceremony 🏆
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            className="border-cyan-700 text-cyan-300 hover:bg-cyan-950 h-9 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>

          <Button
            size="sm"
            onClick={handleToggleApproval}
            className={`h-9 text-xs font-bold ${
              isApproved
                ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isApproved ? (
              <>
                <Unlock className="w-3.5 h-3.5 mr-1.5" /> Unlock Results
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve Final Winners
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Top 3 Podium (Section 5) */}
      {teams.length === 0 ? (
        <div className="bg-[#0B132B] border border-cyan-950 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Teams Evaluated Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Register teams and click <strong>Analyze Videos</strong> on their evaluation page to crown the top three winners.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto pt-4">
          {/* Runner-Up (Rank 2) */}
          {runnerUp && (
            <div className="order-2 md:order-1 bg-[#1C2541]/80 border border-slate-400/30 rounded-2xl p-6 text-center shadow-xl backdrop-blur relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-400" />
              <div className="w-12 h-12 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center mx-auto mb-2">
                <Medal className="w-6 h-6 text-slate-300" />
              </div>
              <Badge className="bg-slate-300/20 text-slate-200 border-slate-400/40 text-[10px] mb-2">
                🥈 RANK 2 — RUNNER-UP
              </Badge>
              <h3 className="text-base font-bold text-white">{runnerUp.teamName}</h3>
              <p className="text-xs text-cyan-300 font-semibold mb-3 line-clamp-1">"{runnerUp.projectName}"</p>

              <div className="bg-black/50 py-2 px-3 rounded-xl border border-slate-800 font-mono text-2xl font-black text-slate-200 mb-3">
                {runnerUp.finalApprovedTotal}
                <span className="text-xs text-slate-500 font-normal"> / 100</span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectTeam(runnerUp.id)}
                className="w-full text-xs border-slate-600 text-slate-200 hover:bg-slate-800 h-8"
              >
                Inspect Scorecard
              </Button>
            </div>
          )}

          {/* Winner (Rank 1 - Center) */}
          {winner && (
            <div className="order-1 md:order-2 bg-[#1C2541] border-2 border-amber-400/80 rounded-2xl p-7 text-center shadow-2xl shadow-amber-500/10 backdrop-blur relative overflow-hidden transform md:-translate-y-3">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-yellow-300" />
              <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-300 border-2 border-amber-400/60 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-500/20">
                <Trophy className="w-8 h-8 text-amber-300 animate-bounce" />
              </div>
              <Badge className="bg-amber-400 text-slate-950 font-black text-xs mb-2 uppercase px-3 py-0.5">
                🥇 RANK 1 — WINNER
              </Badge>
              <h3 className="text-lg font-extrabold text-white">{winner.teamName}</h3>
              <p className="text-xs text-cyan-200 font-semibold mb-3 line-clamp-1">"{winner.projectName}"</p>

              <div className="bg-black/60 py-3 px-4 rounded-xl border border-amber-500/40 font-mono text-3xl font-black text-amber-300 mb-4">
                {winner.finalApprovedTotal}
                <span className="text-sm text-slate-400 font-normal"> / 100</span>
              </div>

              <Button
                size="sm"
                onClick={() => onSelectTeam(winner.id)}
                className="w-full text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:from-amber-400 hover:to-yellow-300 h-9"
              >
                Inspect Champion Scorecard
              </Button>
            </div>
          )}

          {/* Second Runner-Up (Rank 3) */}
          {secondRunnerUp && (
            <div className="order-3 md:order-3 bg-[#1C2541]/80 border border-amber-700/40 rounded-2xl p-6 text-center shadow-xl backdrop-blur relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600" />
              <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6 text-amber-500" />
              </div>
              <Badge className="bg-amber-700/30 text-amber-400 border-amber-700/50 text-[10px] mb-2">
                🥉 RANK 3 — 2ND RUNNER-UP
              </Badge>
              <h3 className="text-base font-bold text-white">{secondRunnerUp.teamName}</h3>
              <p className="text-xs text-cyan-300 font-semibold mb-3 line-clamp-1">"{secondRunnerUp.projectName}"</p>

              <div className="bg-black/50 py-2 px-3 rounded-xl border border-slate-800 font-mono text-2xl font-black text-amber-400 mb-3">
                {secondRunnerUp.finalApprovedTotal}
                <span className="text-xs text-slate-500 font-normal"> / 100</span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectTeam(secondRunnerUp.id)}
                className="w-full text-xs border-amber-700/60 text-amber-300 hover:bg-amber-950/60 h-8"
              >
                Inspect Scorecard
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Complete Rankings Table (Section 5 & 7) */}
      <div className="bg-[#0B132B] rounded-2xl border border-cyan-900/60 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-cyan-900/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Complete Team Standings ({teams.length} Teams)
          </h3>
          <span className="text-xs text-slate-400">
            Formula: Video 1 + Video 2 + Video 3 + Video 4 = Total (100)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C2541]/90 border-b border-cyan-900/50 text-slate-300 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center w-16">Rank</th>
                <th className="py-3 px-4">Team & Project</th>
                <th className="py-3 px-3 text-center">Video 1 (15)</th>
                <th className="py-3 px-3 text-center">Video 2 (20)</th>
                <th className="py-3 px-3 text-center">Video 3 (25)</th>
                <th className="py-3 px-3 text-center">Video 4 (40)</th>
                <th className="py-3 px-4 text-center font-bold text-cyan-300">Total (100)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/70 text-slate-200">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No teams available in leaderboard yet.
                  </td>
                </tr>
              ) : (
                teams.map((t) => {
                  const s1 = t.judgeOverrides.video1 ?? t.scores.video1;
                  const s2 = t.judgeOverrides.video2 ?? t.scores.video2;
                  const s3 = t.judgeOverrides.video3 ?? t.scores.video3;
                  const s4 = t.judgeOverrides.video4 ?? t.scores.video4;

                  return (
                    <tr key={t.id} className="hover:bg-[#1C2541]/50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {t.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-black font-extrabold text-xs shadow-sm">
                            1
                          </span>
                        ) : t.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-black font-bold text-xs shadow-sm">
                            2
                          </span>
                        ) : t.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs shadow-sm">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400">{t.rank}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white hover:text-cyan-300 cursor-pointer" onClick={() => onSelectTeam(t.id)}>
                              {t.teamName}
                            </span>
                            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                              {t.id}
                            </span>
                            {t.tieBreakNote && (
                              <Badge variant="outline" className="text-[9px] bg-indigo-950/80 text-indigo-300 border-indigo-700/60">
                                Tie-Break Resolved
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-300 line-clamp-1">{t.projectName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-slate-300">{s1.toFixed(1)}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-300">{s2.toFixed(1)}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-300">{s3.toFixed(1)}</td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-cyan-300">{s4.toFixed(1)}</td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-black text-sm text-cyan-300 block">
                          {t.finalApprovedTotal.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-cyan-500 font-mono block">
                          {t.finalApprovedTotal.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={
                            t.evaluationStatus === 'Completed'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700 text-[10px]'
                              : t.evaluationStatus === 'Needs Review'
                              ? 'bg-rose-950/70 text-rose-300 border-rose-700 text-[10px]'
                              : 'bg-slate-800 text-slate-400 border-slate-700 text-[10px]'
                          }
                        >
                          {t.evaluationStatus}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {onOpenDistributeCertificates && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenDistributeCertificates(t.id)}
                              className="h-8 text-xs border-emerald-600/60 text-emerald-400 hover:text-white hover:bg-emerald-950/60"
                              title="Send certificate to +91 8074401912 & +91 8688122992"
                            >
                              <Award className="w-3.5 h-3.5 mr-1" /> Cert
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSelectTeam(t.id)}
                            className="h-8 text-xs text-cyan-300 hover:text-white hover:bg-cyan-950"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Videos
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
