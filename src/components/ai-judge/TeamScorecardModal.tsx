import React from 'react';
import { HackathonTeam, VideoStageKey } from '@/types/aiJudge';
import { OFFICIAL_STAGES, OFFICIAL_RUBRICS } from '@/data/officialRubric';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  AlertTriangle,
  User,
  ShieldCheck,
  FileText,
  TrendingUp,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface TeamScorecardModalProps {
  team: HackathonTeam | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVideoEvaluation?: (teamId: string, stage: VideoStageKey) => void;
}

export const TeamScorecardModal: React.FC<TeamScorecardModalProps> = ({
  team,
  isOpen,
  onClose,
  onOpenVideoEvaluation,
}) => {
  if (!team) return null;

  const handlePrint = () => {
    window.print();
  };

  // Prepare radar chart data
  const radarData = [
    {
      subject: 'Problem (15)',
      score: team.scores.problemUnderstanding,
      fullMark: 15,
      normalized: Math.round((team.scores.problemUnderstanding / 15) * 100),
    },
    {
      subject: 'Pitch (20)',
      score: team.scores.pitchDeck,
      fullMark: 20,
      normalized: Math.round((team.scores.pitchDeck / 20) * 100),
    },
    {
      subject: 'Proto 50% (25)',
      score: team.scores.prototypeProgress,
      fullMark: 25,
      normalized: Math.round((team.scores.prototypeProgress / 25) * 100),
    },
    {
      subject: 'Final Output (40)',
      score: team.scores.finalProjectOutput,
      fullMark: 40,
      normalized: Math.round((team.scores.finalProjectOutput / 40) * 100),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0B132B] text-white border-cyan-800/80 p-0 rounded-2xl shadow-2xl">
        {/* Printable/Modal Header */}
        <div className="bg-gradient-to-r from-[#1C2541] via-[#0B132B] to-[#1C2541] p-6 border-b border-cyan-900/50 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-mono text-xs">
                  {team.id}
                </Badge>
                <Badge
                  className={
                    team.reviewStatus === 'officially_approved'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-blue-950/80 text-blue-300 border-blue-700'
                  }
                >
                  {team.reviewStatus === 'officially_approved'
                    ? 'Officially Approved'
                    : 'Provisional AI Evaluation'}
                </Badge>
                <Badge variant="outline" className="text-slate-300 border-slate-700 text-xs">
                  Track: {team.track}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{team.teamName}</h2>
              <p className="text-cyan-300 text-sm font-semibold">{team.projectTitle}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {team.college} • Lead: {team.leaderName} ({team.contactEmail})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
                className="border-cyan-700 text-cyan-300 hover:bg-cyan-950 h-8 text-xs print:hidden"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Scorecard
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Top KPI Cards & Radar Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Total Marks Metric Callout */}
            <div className="md:col-span-5 bg-[#1C2541]/70 p-5 rounded-2xl border border-cyan-900/60 flex flex-col justify-between h-full">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block">
                  Official Total Marks
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold font-mono text-cyan-300">
                    {team.scores.finalApprovedScore.toFixed(1)}
                  </span>
                  <span className="text-lg font-mono text-slate-400">/ 100</span>
                </div>
                <div className="mt-2 text-xs text-slate-300">
                  Percentage: <strong className="text-white font-mono">{team.scores.percentage.toFixed(1)}%</strong>
                </div>
              </div>

              {/* Formula reference */}
              <div className="mt-4 pt-3 border-t border-cyan-900/60 text-[11px] text-slate-400 font-mono">
                Total = Problem (15) + Pitch (20) + Proto (25) + Output (40)
              </div>
            </div>

            {/* Radar Chart Visualizing Balance */}
            <div className="md:col-span-7 bg-[#1C2541]/40 p-3 rounded-2xl border border-cyan-900/40 h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
                  <Radar
                    name="Performance"
                    dataKey="normalized"
                    stroke="#00F0FF"
                    fill="#00F0FF"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Four Stages Grid */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-slate-200 uppercase tracking-wider text-xs">
              Category Marks & Video Submission Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['problem_understanding', 'pitch_deck', 'prototype_progress', 'final_output'] as VideoStageKey[]).map(
                (stageKey) => {
                  const stageInfo = OFFICIAL_STAGES[stageKey];
                  const sub = team.submissions[stageKey];

                  return (
                    <div
                      key={stageKey}
                      className="p-4 rounded-xl bg-[#1C2541]/50 border border-cyan-900/50 hover:border-cyan-700/60 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-300">
                            Stage {stageInfo.number}: {stageInfo.title}
                          </span>
                          <span className="font-mono text-sm font-bold text-cyan-300">
                            {sub.stageScore.toFixed(1)} / {stageInfo.maxMarks}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2 text-xs">
                          <Badge
                            variant="outline"
                            className={
                              sub.status === 'inaccessible'
                                ? 'bg-rose-950/60 text-rose-300 border-rose-700'
                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                            }
                          >
                            {sub.status === 'inaccessible' ? 'Inaccessible Media' : `${sub.format} Verified`}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            AI Confidence: <strong className="text-cyan-400">{sub.aiConfidence}%</strong>
                          </span>
                        </div>

                        {sub.accessError && (
                          <p className="text-[11px] text-rose-300 mb-2 italic">{sub.accessError}</p>
                        )}
                      </div>

                      {onOpenVideoEvaluation && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onClose();
                            onOpenVideoEvaluation(team.id, stageKey);
                          }}
                          className="w-full text-xs text-cyan-300 hover:bg-cyan-950/80 mt-2 h-7"
                        >
                          Review Video & Evidence <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Detailed Criteria Scores Table */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-200">
              Detailed Criterion Evidence Breakdown
            </h4>

            <div className="border border-cyan-900/50 rounded-xl overflow-hidden bg-[#1C2541]/30">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1C2541]/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-cyan-900/50">
                  <tr>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Criterion</th>
                    <th className="py-2.5 px-3 text-center">Marks</th>
                    <th className="py-2.5 px-3">Evidence Explanation</th>
                    <th className="py-2.5 px-3 text-center">Timestamps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-950/60 text-slate-300">
                  {(['problem_understanding', 'pitch_deck', 'prototype_progress', 'final_output'] as VideoStageKey[]).flatMap(
                    (stageKey) => {
                      const sub = team.submissions[stageKey];
                      return sub.criterionScores.map((crit) => {
                        const finalScore =
                          crit.humanOverrideScore !== undefined
                            ? crit.humanOverrideScore
                            : crit.score;

                        return (
                          <tr key={crit.criterionId} className="hover:bg-[#1C2541]/50">
                            <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                              S{sub.stageNumber}
                            </td>
                            <td className="py-2 px-3 font-medium text-white">
                              {crit.criterionName}
                              {crit.humanOverrideScore !== undefined && (
                                <span className="block text-[10px] text-amber-400">
                                  (Overridden by judge)
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-cyan-300">
                              {finalScore.toFixed(1)} / {crit.maxScore}
                            </td>
                            <td className="py-2 px-3 text-slate-300 text-[11px] leading-relaxed">
                              {crit.explanation}
                              {crit.humanOverrideReason && (
                                <span className="block text-amber-300 mt-0.5">
                                  Override note: {crit.humanOverrideReason}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[10px] text-cyan-400">
                              {crit.supportingTimestamps.join(', ') || 'N/A'}
                            </td>
                          </tr>
                        );
                      });
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Human Judge Feedback & Approvals */}
          {team.humanReviews.length > 0 && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 space-y-2">
              <h5 className="font-semibold text-xs text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Human Judging Panel Ratification
              </h5>
              {team.humanReviews.map((rev, idx) => (
                <div key={idx} className="text-xs text-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-white">{rev.reviewerName}</strong>
                    <span className="text-slate-400">({rev.reviewerRole})</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(rev.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="italic text-slate-300">"{rev.overallComments}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
