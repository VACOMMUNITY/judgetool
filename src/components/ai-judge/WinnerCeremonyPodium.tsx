import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LeaderboardEntry, HackathonTeam } from '@/types/aiJudge';
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  ExternalLink,
  Download,
  Share2,
  CheckCircle2,
  GraduationCap,
  FolderGit2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WinnerCeremonyPodiumProps {
  topThree: LeaderboardEntry[];
  teamsData: HackathonTeam[];
  onInspectTeam: (teamId: string) => void;
}

export const WinnerCeremonyPodium: React.FC<WinnerCeremonyPodiumProps> = ({
  topThree,
  teamsData,
  onInspectTeam,
}) => {
  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#3B82F6', '#F59E0B', '#10B981'],
      });
    } catch {}
  }, []);

  const winner = topThree.find((t) => t.rank === 1);
  const runnerUp = topThree.find((t) => t.rank === 2);
  const secondRunnerUp = topThree.find((t) => t.rank === 3);

  const getTeamDetails = (teamId?: string) => {
    if (!teamId) return undefined;
    return teamsData.find((t) => t.id === teamId);
  };

  const winnerDetails = getTeamDetails(winner?.teamId);
  const runnerUpDetails = getTeamDetails(runnerUp?.teamId);
  const secondRunnerUpDetails = getTeamDetails(secondRunnerUp?.teamId);

  return (
    <div className="space-y-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          COMMUNITY.VA AI INNOVATION HACKATHON 2026
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Official Winner Selection & Results Ceremony
        </h2>
        <p className="text-slate-300 text-sm mt-2 max-w-xl mx-auto">
          Evaluated across 4 rigorous video stages, verified with technical visual evidence, and ratified by the judging panel.
        </p>
      </div>

      {/* 3-Tier Podium */}
      {topThree.length === 0 ? (
        <div className="bg-[#1C2541]/50 border border-cyan-900/60 rounded-2xl p-12 text-center max-w-xl mx-auto">
          <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Awaiting Team Evaluations</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            No finalized winners to display yet. As registered teams submit their 4 video stages and evaluations are approved by judges, the top 3 will be crowned here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto pt-6">
        {/* Rank 2: Runner-Up (Left) */}
        {runnerUp && (
          <div className="order-2 md:order-1 flex flex-col items-center">
            <div className="w-full bg-[#1C2541]/90 border border-slate-400/30 rounded-2xl p-6 shadow-2xl backdrop-blur relative overflow-hidden text-center hover:border-slate-300 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-200" />
              <div className="w-14 h-14 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Medal className="w-7 h-7 text-slate-300" />
              </div>

              <Badge className="bg-slate-300/20 text-slate-200 border-slate-300/40 text-xs mb-2">
                RUNNER-UP • 2ND PLACE
              </Badge>
              <h3 className="text-lg font-bold text-white mb-0.5">{runnerUp.teamName}</h3>
              <p className="text-xs text-slate-300 mb-2">{runnerUp.college}</p>
              <p className="text-xs font-medium text-cyan-300 mb-4 line-clamp-2 px-2">
                "{runnerUp.projectTitle}"
              </p>

              {/* Total Score */}
              <div className="bg-black/40 py-2.5 px-4 rounded-xl border border-slate-700/60 mb-4 font-mono">
                <span className="text-[11px] text-slate-400 block uppercase">Final Approved Score</span>
                <span className="text-2xl font-black text-slate-200">
                  {runnerUp.totalScore.toFixed(1)}
                  <span className="text-xs text-slate-400 font-normal"> / 100</span>
                </span>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-left text-[11px] bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 mb-4">
                <div>
                  <span className="text-slate-400 block">Problem (15):</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {runnerUp.problemScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pitch (20):</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {runnerUp.pitchDeckScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Prototype (25):</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {runnerUp.prototypeScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Output (40):</span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {runnerUp.finalOutputScore.toFixed(1)}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onInspectTeam(runnerUp.teamId)}
                className="w-full text-xs border-slate-600 text-slate-200 hover:bg-slate-800"
              >
                Inspect Scorecard
              </Button>
            </div>
            {/* Podium Base */}
            <div className="w-full h-16 bg-gradient-to-t from-slate-900 to-[#1C2541] border-t-2 border-slate-400/40 rounded-t-lg hidden md:flex items-center justify-center font-bold text-slate-300 text-lg">
              2nd
            </div>
          </div>
        )}

        {/* Rank 1: Winner (Center - Tallest) */}
        {winner && (
          <div className="order-1 md:order-2 flex flex-col items-center">
            <div className="w-full bg-[#1C2541] border-2 border-amber-400/80 rounded-2xl p-7 shadow-2xl shadow-amber-500/20 backdrop-blur relative overflow-hidden text-center hover:border-amber-300 transition-all transform md:-translate-y-4">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-300 border-2 border-amber-400/60 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 animate-pulse">
                <Trophy className="w-9 h-9 text-amber-300" />
              </div>

              <Badge className="bg-amber-400 text-slate-950 font-extrabold text-xs mb-2 uppercase px-3 py-0.5">
                GRAND WINNER • 1ST PLACE
              </Badge>
              <h3 className="text-xl font-extrabold text-white mb-0.5">{winner.teamName}</h3>
              <p className="text-xs text-amber-200/90 font-medium mb-2">{winner.college}</p>
              <p className="text-xs font-semibold text-cyan-200 mb-4 line-clamp-2 px-1">
                "{winner.projectTitle}"
              </p>

              {/* Total Score */}
              <div className="bg-black/60 py-3 px-4 rounded-xl border border-amber-500/50 mb-4 font-mono">
                <span className="text-[11px] text-amber-300 block uppercase font-semibold">
                  Champion Final Score
                </span>
                <span className="text-3xl font-black text-amber-300">
                  {winner.totalScore.toFixed(1)}
                  <span className="text-sm text-slate-400 font-normal"> / 100</span>
                </span>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-950/70 p-3 rounded-lg border border-amber-500/30 mb-5">
                <div>
                  <span className="text-slate-400 block text-[11px]">Problem (15):</span>
                  <span className="font-mono font-bold text-white">
                    {winner.problemScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pitch (20):</span>
                  <span className="font-mono font-bold text-white">
                    {winner.pitchDeckScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Prototype (25):</span>
                  <span className="font-mono font-bold text-white">
                    {winner.prototypeScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Output (40):</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {winner.finalOutputScore.toFixed(1)}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => onInspectTeam(winner.teamId)}
                className="w-full text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:from-amber-400 hover:to-yellow-300 shadow-md"
              >
                Inspect Champion Scorecard
              </Button>
            </div>
            {/* Podium Base */}
            <div className="w-full h-24 bg-gradient-to-t from-slate-900 to-[#1C2541] border-t-2 border-amber-400/80 rounded-t-lg hidden md:flex items-center justify-center font-extrabold text-amber-300 text-2xl">
              1st
            </div>
          </div>
        )}

        {/* Rank 3: Second Runner-Up (Right) */}
        {secondRunnerUp && (
          <div className="order-3 md:order-3 flex flex-col items-center">
            <div className="w-full bg-[#1C2541]/90 border border-amber-700/40 rounded-2xl p-6 shadow-2xl backdrop-blur relative overflow-hidden text-center hover:border-amber-600 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-700 to-amber-500" />
              <div className="w-14 h-14 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Award className="w-7 h-7 text-amber-500" />
              </div>

              <Badge className="bg-amber-700/30 text-amber-400 border-amber-700/50 text-xs mb-2">
                2ND RUNNER-UP • 3RD PLACE
              </Badge>
              <h3 className="text-lg font-bold text-white mb-0.5">{secondRunnerUp.teamName}</h3>
              <p className="text-xs text-slate-300 mb-2">{secondRunnerUp.college}</p>
              <p className="text-xs font-medium text-cyan-300 mb-4 line-clamp-2 px-2">
                "{secondRunnerUp.projectTitle}"
              </p>

              {/* Total Score */}
              <div className="bg-black/40 py-2.5 px-4 rounded-xl border border-slate-700/60 mb-4 font-mono">
                <span className="text-[11px] text-slate-400 block uppercase">Final Approved Score</span>
                <span className="text-2xl font-black text-amber-400">
                  {secondRunnerUp.totalScore.toFixed(1)}
                  <span className="text-xs text-slate-400 font-normal"> / 100</span>
                </span>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-left text-[11px] bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 mb-4">
                <div>
                  <span className="text-slate-400 block">Problem (15):</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {secondRunnerUp.problemScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pitch (20):</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {secondRunnerUp.pitchDeckScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Prototype (25):</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {secondRunnerUp.prototypeScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Output (40):</span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {secondRunnerUp.finalOutputScore.toFixed(1)}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onInspectTeam(secondRunnerUp.teamId)}
                className="w-full text-xs border-amber-700/60 text-amber-300 hover:bg-amber-950/60"
              >
                Inspect Scorecard
              </Button>
            </div>
            {/* Podium Base */}
            <div className="w-full h-12 bg-gradient-to-t from-slate-900 to-[#1C2541] border-t-2 border-amber-700/60 rounded-t-lg hidden md:flex items-center justify-center font-bold text-amber-500 text-base">
              3rd
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
