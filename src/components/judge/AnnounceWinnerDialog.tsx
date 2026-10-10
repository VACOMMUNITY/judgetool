import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  HackathonTeamRecord,
  hackathonJudgeDb,
} from '@/services/hackathonJudgeDb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  CheckCircle2,
  Share2,
  Download,
  PartyPopper,
  ExternalLink,
  Flame,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface AnnounceWinnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: HackathonTeamRecord[];
  onNavigateToLeaderboard?: () => void;
  onRefresh?: () => void;
  onOpenDistributeCertificates?: (teamId?: string) => void;
}

export const AnnounceWinnerDialog: React.FC<AnnounceWinnerDialogProps> = ({
  open,
  onOpenChange,
  teams,
  onNavigateToLeaderboard,
  onRefresh,
  onOpenDistributeCertificates,
}) => {
  const { toast } = useToast();
  const [isAnnounced, setIsAnnounced] = useState(false);
  const [announcedAt, setAnnouncedAt] = useState<string | null>(null);

  // Compute top ranked teams
  const sortedTeams = [...teams].filter((t) => t.finalApprovedTotal > 0 || t.evaluationStatus === 'Completed');
  const winner = sortedTeams.find((t) => t.rank === 1) || sortedTeams[0];
  const runnerUp = sortedTeams.find((t) => t.rank === 2) || sortedTeams[1];
  const secondRunnerUp = sortedTeams.find((t) => t.rank === 3) || sortedTeams[2];

  useEffect(() => {
    if (open) {
      const info = hackathonJudgeDb.getAnnouncementInfo();
      setIsAnnounced(info.isAnnounced);
      setAnnouncedAt(info.announcedAt || null);

      // Trigger celebratory confetti burst on opening
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#EC4899'],
        });
      } catch {}
    }
  }, [open]);

  const fireGrandCelebration = () => {
    try {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() - 0.2 },
        });
      }, 250);
    } catch {}
  };

  const handleConfirmAnnouncement = () => {
    const res = hackathonJudgeDb.announceWinners('Paidimarri Abhiram (Founder & CEO, Community.VA)');
    setIsAnnounced(true);
    setAnnouncedAt(res.announcedAt);
    fireGrandCelebration();

    toast({
      title: '🎉 WINNERS OFFICIALLY ANNOUNCED! 🏆',
      description: `Grand Champion: ${winner?.teamName || 'Winner'} has been crowned by Paidimarri Abhiram (Founder & CEO)! All results ratified.`,
    });

    if (onRefresh) onRefresh();
  };

  const handleResetAnnouncement = () => {
    hackathonJudgeDb.setOfficialApproval(false);
    setIsAnnounced(false);
    setAnnouncedAt(null);
    toast({
      title: 'Announcement Status Reset',
      description: 'Scores restored to provisional review status.',
    });
    if (onRefresh) onRefresh();
  };

  const handleCopyAnnouncementText = () => {
    if (!winner) return;

    const text = `🏆 COMMUNITY.VA AI HACKATHON 2026 — OFFICIAL WINNER ANNOUNCEMENT 🏆\n\n` +
      `We are thrilled to announce the official winners of the Community.VA AI Hackathon evaluated via the 4-Video AI Judging Rubric:\n\n` +
      `🥇 GRAND CHAMPION (WINNER): ${winner.teamName}\n` +
      `   Project: "${winner.projectName}"\n` +
      `   Total Score: ${winner.finalApprovedTotal} / 100 (${winner.finalApprovedTotal}%)\n` +
      `   Members: ${winner.members.join(', ')}\n` +
      `   Award: Winner Trophy & Certificate of Winner\n\n` +
      (runnerUp ? `🥈 RUNNER-UP: ${runnerUp.teamName}\n   Project: "${runnerUp.projectName}"\n   Total Score: ${runnerUp.finalApprovedTotal} / 100\n   Award: Runner-Up Medal & Certificate\n\n` : '') +
      (secondRunnerUp ? `🥉 SECOND RUNNER-UP: ${secondRunnerUp.teamName}\n   Project: "${secondRunnerUp.projectName}"\n   Total Score: ${secondRunnerUp.finalApprovedTotal} / 100\n   Award: Second Runner-Up Medal & Certificate\n\n` : '') +
      `📜 Ratified & Certified By: Paidimarri Abhiram (Founder & CEO, Community.VA)\n` +
      `Congratulations to all teams for building outstanding AI solutions! 🚀`;

    navigator.clipboard.writeText(text);
    toast({
      title: 'Announcement Copied to Clipboard 📋',
      description: 'Ready to share on Discord, LinkedIn, WhatsApp, or Twitter!',
    });
  };

  const handleDownloadCsv = () => {
    const csvContent = hackathonJudgeDb.exportLeaderboardCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CommunityVA_Hackathon_Winners_Announcement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Results Downloaded',
      description: 'Saved official winner roster as CSV.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#070B19] border border-cyan-700/60 text-slate-100 p-0 overflow-hidden shadow-2xl rounded-2xl max-h-[92vh] flex flex-col">
        {/* Top Celebratory Header */}
        <div className="relative bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 p-6 text-slate-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-300/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-xl border border-yellow-300/50">
                <Trophy className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full font-mono">
                    COMMUNITY.VA AI HACKATHON
                  </span>
                  {isAnnounced && (
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/50 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> RATIFIED & PUBLISHED
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 mt-1 uppercase">
                  Official Winner Announcement 🏆
                </h2>
                <p className="text-xs text-slate-900 font-medium">
                  Automated 4-Video Scoring (100 Marks) • Final Podium Roster
                </p>
              </div>
            </div>

            {/* Top Action buttons */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
              {onOpenDistributeCertificates && (
                <Button
                  size="sm"
                  onClick={() => onOpenDistributeCertificates(winner?.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-bold shadow-md shadow-emerald-900/40"
                  title="Distribute certificates to +91 8074401912 and +91 8688122992 according to results"
                >
                  <Award className="w-3.5 h-3.5 mr-1 text-white" /> Distribute Certificates (+91 8074401912, +91 8688122992)
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyAnnouncementText}
                className="bg-slate-950/80 border-slate-900 text-amber-300 hover:bg-slate-950 text-xs h-8 font-semibold"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share Press Release
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadCsv}
                className="bg-slate-950/80 border-slate-900 text-amber-300 hover:bg-slate-950 text-xs h-8 font-semibold"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {sortedTeams.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-[#0B132B] rounded-2xl border border-slate-800 p-8">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Evaluated Teams Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Please evaluate team videos first or load benchmark samples to announce the hackathon champions.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Podium Display: Winner in center, Runner up left, 2nd runner up right */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* 2nd Place: Runner Up */}
                {runnerUp ? (
                  <div className="order-2 md:order-1 bg-[#0E1738] border-2 border-slate-400/40 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-400" />
                    <div className="w-10 h-10 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/40 flex items-center justify-center mx-auto mb-2">
                      <Medal className="w-5 h-5 text-slate-300" />
                    </div>
                    <Badge className="bg-slate-400/20 text-slate-200 border-slate-400/40 text-[10px] mb-2 font-mono">
                      🥈 RANK 2 • RUNNER-UP
                    </Badge>
                    <h3 className="text-base font-bold text-white truncate">{runnerUp.teamName}</h3>
                    <p className="text-xs text-cyan-300 font-medium truncate mb-2">
                      "{runnerUp.projectName}"
                    </p>

                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 font-mono text-xl font-black text-slate-200 mb-2">
                      {runnerUp.finalApprovedTotal}
                      <span className="text-xs text-slate-500 font-normal"> / 100</span>
                    </div>

                    <div className="text-[11px] text-slate-300 font-semibold mb-2">
                      🥈 Runner-Up Award & Certificate
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[9px] font-mono bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-slate-300">
                      <div>
                        V1: <strong>{runnerUp.judgeOverrides.video1 ?? runnerUp.scores.video1}</strong>/15
                      </div>
                      <div>
                        V2: <strong>{runnerUp.judgeOverrides.video2 ?? runnerUp.scores.video2}</strong>/20
                      </div>
                      <div>
                        V3: <strong>{runnerUp.judgeOverrides.video3 ?? runnerUp.scores.video3}</strong>/25
                      </div>
                      <div>
                        V4: <strong>{runnerUp.judgeOverrides.video4 ?? runnerUp.scores.video4}</strong>/40
                      </div>
                    </div>

                    {onOpenDistributeCertificates && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenDistributeCertificates(runnerUp.id)}
                        className="w-full mt-2.5 text-[11px] h-7 border-slate-600 text-slate-200 hover:bg-slate-800"
                      >
                        <Award className="w-3 h-3 mr-1 text-slate-300" /> Distribute Certificate
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="order-2 md:order-1 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                    Awaiting 2nd Team Evaluation
                  </div>
                )}

                {/* 1st Place: Grand Winner Champion (Center & Elevated) */}
                {winner && (
                  <div className="order-1 md:order-2 bg-gradient-to-b from-[#1E1B4B] via-[#0F172A] to-[#0B132B] border-2 border-yellow-400 rounded-2xl p-5 text-center shadow-2xl relative overflow-hidden transform md:-translate-y-2">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 border-2 border-yellow-200 flex items-center justify-center mx-auto mb-2 shadow-xl shadow-amber-500/30">
                      <Trophy className="w-7 h-7" />
                    </div>
                    <Badge className="bg-amber-400 text-slate-950 border-yellow-300 text-xs font-black mb-2 shadow-sm">
                      🥇 GRAND CHAMPION — WINNER
                    </Badge>
                    <h3 className="text-lg font-black text-white truncate">{winner.teamName}</h3>
                    <p className="text-xs text-amber-300 font-bold truncate mb-2">
                      "{winner.projectName}"
                    </p>

                    <div className="bg-slate-950/90 p-3 rounded-xl border border-yellow-400/40 font-mono text-2xl font-black text-yellow-300 mb-2 shadow-inner">
                      {winner.finalApprovedTotal}
                      <span className="text-xs text-amber-400/70 font-normal"> / 100</span>
                      <span className="text-xs text-emerald-400 block font-sans font-bold">
                        {winner.finalApprovedTotal}% Overall Score
                      </span>
                    </div>

                    <div className="text-xs text-amber-300 font-black mb-3">
                      🏆 Grand Winner Trophy & Certificate of Excellence
                    </div>

                    <div className="text-[11px] text-slate-300 mb-2 truncate">
                      Members: <span className="text-white font-medium">{winner.members.join(', ')}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono bg-slate-950 p-2 rounded-lg border border-yellow-400/30 text-amber-200 font-bold">
                      <div>
                        V1: {winner.judgeOverrides.video1 ?? winner.scores.video1}/15
                      </div>
                      <div>
                        V2: {winner.judgeOverrides.video2 ?? winner.scores.video2}/20
                      </div>
                      <div>
                        V3: {winner.judgeOverrides.video3 ?? winner.scores.video3}/25
                      </div>
                      <div>
                        V4: {winner.judgeOverrides.video4 ?? winner.scores.video4}/40
                      </div>
                    </div>

                    {onOpenDistributeCertificates && (
                      <Button
                        size="sm"
                        onClick={() => onOpenDistributeCertificates(winner.id)}
                        className="w-full mt-2.5 text-xs h-8 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                      >
                        <Award className="w-3.5 h-3.5 mr-1" /> Distribute Champion Certificate
                      </Button>
                    )}
                  </div>
                )}

                {/* 3rd Place: Second Runner Up */}
                {secondRunnerUp ? (
                  <div className="order-3 bg-[#0E1738] border-2 border-amber-700/50 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-700" />
                    <div className="w-10 h-10 rounded-full bg-amber-700/20 text-amber-300 border border-amber-700/40 flex items-center justify-center mx-auto mb-2">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <Badge className="bg-amber-700/20 text-amber-300 border-amber-700/40 text-[10px] mb-2 font-mono">
                      🥉 RANK 3 • 2ND RUNNER-UP
                    </Badge>
                    <h3 className="text-base font-bold text-white truncate">{secondRunnerUp.teamName}</h3>
                    <p className="text-xs text-cyan-300 font-medium truncate mb-2">
                      "{secondRunnerUp.projectName}"
                    </p>

                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 font-mono text-xl font-black text-amber-300 mb-2">
                      {secondRunnerUp.finalApprovedTotal}
                      <span className="text-xs text-slate-500 font-normal"> / 100</span>
                    </div>

                    <div className="text-[11px] text-amber-400 font-semibold mb-2">
                      🥉 2nd Runner-Up Award & Certificate
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[9px] font-mono bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-slate-300">
                      <div>
                        V1: <strong>{secondRunnerUp.judgeOverrides.video1 ?? secondRunnerUp.scores.video1}</strong>/15
                      </div>
                      <div>
                        V2: <strong>{secondRunnerUp.judgeOverrides.video2 ?? secondRunnerUp.scores.video2}</strong>/20
                      </div>
                      <div>
                        V3: <strong>{secondRunnerUp.judgeOverrides.video3 ?? secondRunnerUp.scores.video3}</strong>/25
                      </div>
                      <div>
                        V4: <strong>{secondRunnerUp.judgeOverrides.video4 ?? secondRunnerUp.scores.video4}</strong>/40
                      </div>
                    </div>

                    {onOpenDistributeCertificates && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenDistributeCertificates(secondRunnerUp.id)}
                        className="w-full mt-2.5 text-[11px] h-7 border-amber-800 text-amber-300 hover:bg-amber-950/60"
                      >
                        <Award className="w-3 h-3 mr-1 text-amber-400" /> Distribute Certificate
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="order-3 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                    Awaiting 3rd Team Evaluation
                  </div>
                )}
              </div>

              {/* Complete Ranked Leaderboard Table Preview */}
              <div className="bg-[#0B132B] rounded-xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Complete Roster Standings
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {sortedTeams.length} Evaluated Teams
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800/80">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-[10px] text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="p-2.5">Rank</th>
                        <th className="p-2.5">Team & Project</th>
                        <th className="p-2.5 text-center">V1 (15m)</th>
                        <th className="p-2.5 text-center">V2 (20m)</th>
                        <th className="p-2.5 text-center">V3 (25m)</th>
                        <th className="p-2.5 text-center">V4 (40m)</th>
                        <th className="p-2.5 text-right">Total / 100</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {sortedTeams.map((t, idx) => (
                        <tr
                          key={t.id}
                          className={
                            t.rank === 1
                              ? 'bg-amber-950/20'
                              : t.rank === 2
                              ? 'bg-slate-800/20'
                              : t.rank === 3
                              ? 'bg-amber-900/10'
                              : ''
                          }
                        >
                          <td className="p-2.5 font-bold">
                            {t.rank === 1
                              ? '🥇 1'
                              : t.rank === 2
                              ? '🥈 2'
                              : t.rank === 3
                              ? '🥉 3'
                              : `#${t.rank || idx + 1}`}
                          </td>
                          <td className="p-2.5 font-sans">
                            <div className="font-bold text-white">{t.teamName}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {t.projectName}
                            </div>
                          </td>
                          <td className="p-2.5 text-center text-slate-300">
                            {t.judgeOverrides.video1 ?? t.scores.video1}
                          </td>
                          <td className="p-2.5 text-center text-slate-300">
                            {t.judgeOverrides.video2 ?? t.scores.video2}
                          </td>
                          <td className="p-2.5 text-center text-slate-300">
                            {t.judgeOverrides.video3 ?? t.scores.video3}
                          </td>
                          <td className="p-2.5 text-center text-slate-300">
                            {t.judgeOverrides.video4 ?? t.scores.video4}
                          </td>
                          <td className="p-2.5 text-right font-black text-cyan-400 text-sm">
                            {t.finalApprovedTotal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Controls */}
        <div className="bg-[#0B132B] border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>
              {isAnnounced ? (
                <strong className="text-emerald-400">
                  Winners Ratified by Paidimarri Abhiram (Founder & CEO) • {announcedAt ? new Date(announcedAt).toLocaleTimeString() : 'Today'}
                </strong>
              ) : (
                'Scores ready. Ratified by Paidimarri Abhiram (Founder & CEO).'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {isAnnounced && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetAnnouncement}
                className="text-xs text-slate-400 hover:text-rose-400 h-9"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Status
              </Button>
            )}

            {onNavigateToLeaderboard && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onNavigateToLeaderboard();
                }}
                className="border-cyan-800 text-cyan-300 hover:bg-cyan-950 text-xs h-9"
              >
                Full Leaderboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleConfirmAnnouncement}
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs h-9 px-5 shadow-lg shadow-amber-500/20"
            >
              <PartyPopper className="w-4 h-4 mr-1.5" />
              {isAnnounced ? 'Re-Celebrate & Broadcast 🎉' : 'Announce & Ratify Winners 🏆'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
