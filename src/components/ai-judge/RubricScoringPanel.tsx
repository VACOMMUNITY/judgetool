import React, { useState } from 'react';
import {
  VideoSubmissionStageData,
  RubricScoreItem,
  VideoStageKey,
} from '@/types/aiJudge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldAlert,
  CheckCircle2,
  Edit3,
  Award,
  AlertCircle,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  FileQuestion,
  Save,
  X,
} from 'lucide-react';
import { aiJudgeService } from '@/services/aiJudgeService';
import { useToast } from '@/hooks/use-toast';

interface RubricScoringPanelProps {
  teamId: string;
  submission: VideoSubmissionStageData;
  activeRole: 'admin' | 'judge' | 'public';
  judgeInfo?: { id: string; name: string };
  onScoreUpdated?: () => void;
  onSeekRequested?: (seconds: number) => void;
}

export const RubricScoringPanel: React.FC<RubricScoringPanelProps> = ({
  teamId,
  submission,
  activeRole,
  judgeInfo = { id: 'judge-01', name: 'Dr. Aris Verma' },
  onScoreUpdated,
}) => {
  const { toast } = useToast();
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const startEdit = (item: RubricScoreItem) => {
    setEditingCriterionId(item.criterionId);
    setOverrideScore(item.humanOverrideScore !== undefined ? item.humanOverrideScore : item.score);
    setOverrideReason(item.humanOverrideReason || '');
  };

  const cancelEdit = () => {
    setEditingCriterionId(null);
    setOverrideScore(0);
    setOverrideReason('');
  };

  const handleSaveOverride = (item: RubricScoreItem) => {
    if (overrideScore < 0 || overrideScore > item.maxScore) {
      toast({
        title: 'Invalid Score Range',
        description: `Score must be between 0 and ${item.maxScore} marks.`,
        variant: 'destructive',
      });
      return;
    }

    if (!overrideReason || overrideReason.trim().length < 5) {
      toast({
        title: 'Documented Reason Required',
        description: 'You must provide a documented rationale of at least 5 characters to override AI evaluations.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingOverride(true);
    const result = aiJudgeService.judgeOverrideScore(
      teamId,
      submission.stage,
      item.criterionId,
      overrideScore,
      overrideReason,
      judgeInfo.id,
      judgeInfo.name
    );
    setIsSubmittingOverride(false);

    if (result.success) {
      toast({
        title: 'Score Override Saved',
        description: `Successfully adjusted ${item.criterionName} to ${overrideScore}/${item.maxScore}.`,
      });
      setEditingCriterionId(null);
      if (onScoreUpdated) onScoreUpdated();
    } else {
      toast({
        title: 'Override Failed',
        description: result.error || 'Unable to save override.',
        variant: 'destructive',
      });
    }
  };

  const parseTimestampSeconds = (ts: string) => {
    const parts = ts.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Category Stage Summary Scorecard */}
      <div className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] p-6 rounded-2xl border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/40 text-xs uppercase font-mono">
              Stage {submission.stageNumber}
            </Badge>
            <h3 className="text-xl font-bold text-white tracking-tight">{submission.stageTitle}</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Strict rubric evaluation based on visible evidence, technical proof, and project demonstration.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-xl border border-cyan-900/50 backdrop-blur">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block">
              Stage Marks
            </span>
            <span className="text-xs text-slate-300">
              Max Cap: <strong className="text-white">{submission.maxMarks}</strong>
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-cyan-300 border-l border-cyan-800/60 pl-4">
            {submission.stageScore.toFixed(1)}
            <span className="text-sm font-normal text-slate-400">/{submission.maxMarks}</span>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Criterion-by-Criterion Rubric Scoring
          </h4>
          <span className="text-xs text-slate-400">
            {submission.criterionScores.length} Criteria Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {submission.criterionScores.map((item) => {
            const isEditing = editingCriterionId === item.criterionId;
            const currentScore =
              item.humanOverrideScore !== undefined ? item.humanOverrideScore : item.score;
            const percentage = Math.round((currentScore / item.maxScore) * 100);

            return (
              <div
                key={item.criterionId}
                className={`p-4 rounded-xl border transition-all ${
                  item.humanOverrideScore !== undefined
                    ? 'bg-[#1C2541]/90 border-amber-500/60 shadow-amber-950/20'
                    : 'bg-[#0B132B]/90 border-cyan-900/50 hover:border-cyan-700/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-sm text-white">{item.criterionName}</h5>
                    {item.humanOverrideScore !== undefined && (
                      <Badge className="bg-amber-950/80 text-amber-300 border-amber-600/50 text-[10px]">
                        Judge Overridden
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-cyan-300">
                        {currentScore.toFixed(1)}
                      </span>
                      <span className="font-mono text-xs text-slate-400"> / {item.maxScore}</span>
                    </div>

                    {activeRole !== 'public' && !isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(item)}
                        className="h-7 text-xs border-cyan-800 text-cyan-300 hover:bg-cyan-950 hover:text-cyan-100"
                      >
                        <Edit3 className="w-3 h-3 mr-1" /> Override
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mb-2.5">
                  <div
                    className={`h-full transition-all duration-500 ${
                      item.humanOverrideScore !== undefined
                        ? 'bg-amber-400'
                        : percentage >= 85
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                        : percentage >= 60
                        ? 'bg-cyan-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>

                {/* Rationale & citations */}
                <p className="text-xs text-slate-300 leading-relaxed mb-2">{item.explanation}</p>

                {item.humanOverrideReason && (
                  <div className="bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/50 text-xs text-amber-200 mb-2">
                    <strong className="text-amber-300">Documented Judge Override Reason:</strong>{' '}
                    {item.humanOverrideReason}
                  </div>
                )}

                {/* Citations */}
                {item.supportingTimestamps && item.supportingTimestamps.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
                    <span>Evidence Timestamps:</span>
                    {item.supportingTimestamps.map((ts, idx) => (
                      <span
                        key={idx}
                        className="font-mono bg-cyan-950/70 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/40"
                      >
                        [{ts}]
                      </span>
                    ))}
                  </div>
                )}

                {/* In-place Judge Override Editor */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-cyan-900/60 bg-[#1C2541]/70 p-3.5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" /> Judge Override for: {item.criterionName}
                      </span>
                      <span className="text-xs text-slate-400">Max: {item.maxScore} marks</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-1">
                        <label className="text-[11px] text-slate-300 mb-1 block font-medium">
                          New Score (0 - {item.maxScore})
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max={item.maxScore}
                          value={overrideScore}
                          onChange={(e) => setOverrideScore(parseFloat(e.target.value) || 0)}
                          className="bg-slate-900 border-amber-600/50 text-white font-mono text-sm h-9"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] text-slate-300 mb-1 block font-medium">
                          Documented Justification (Required)
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g. Demonstrated custom quantized ONNX model verified on hardware..."
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="bg-slate-900 border-amber-600/50 text-white text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="h-8 text-xs text-slate-300 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveOverride(item)}
                        disabled={isSubmittingOverride}
                        className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                      >
                        <Save className="w-3.5 h-3.5 mr-1" /> Save & Log Override
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Quadrant: Strengths, Weaknesses, Missing Info, Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
          <h5 className="font-semibold text-xs uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5" /> Strengths of Submission
          </h5>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {submission.strengths.length > 0 ? (
              submission.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400">•</span>
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">No specific strengths listed.</li>
            )}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40">
          <h5 className="font-semibold text-xs uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
            <ThumbsDown className="w-3.5 h-3.5" /> Areas Requiring Improvement
          </h5>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {submission.weaknesses.length > 0 ? (
              submission.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400">•</span>
                  <span>{w}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">No critical weaknesses identified.</li>
            )}
          </ul>
        </div>

        {/* Missing Evidence */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40">
          <h5 className="font-semibold text-xs uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <FileQuestion className="w-3.5 h-3.5" /> Missing Evidence & Verification Concerns
          </h5>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {submission.missingEvidence.length > 0 ? (
              submission.missingEvidence.map((m, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400">•</span>
                  <span>{m}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">All key rubric evidence was demonstrated.</li>
            )}
          </ul>
        </div>

        {/* Improvement Opportunities */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40">
          <h5 className="font-semibold text-xs uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Improvement Opportunities
          </h5>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {submission.improvementOpportunities.length > 0 ? (
              submission.improvementOpportunities.map((opp, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-cyan-400">•</span>
                  <span>{opp}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">No specific opportunities noted.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
