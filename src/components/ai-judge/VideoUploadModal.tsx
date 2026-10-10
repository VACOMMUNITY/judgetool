import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VideoStageKey, HackathonTeam } from '@/types/aiJudge';
import { OFFICIAL_STAGES } from '@/data/officialRubric';
import { aiJudgeService } from '@/services/aiJudgeService';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  Upload,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: HackathonTeam[];
  selectedTeamId?: string;
  selectedStage?: VideoStageKey;
  onVideoAttached: () => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  teams,
  selectedTeamId,
  selectedStage,
  onVideoAttached,
}) => {
  const { toast } = useToast();
  const [teamId, setTeamId] = useState(selectedTeamId || (teams[0] ? teams[0].id : ''));
  const [stage, setStage] = useState<VideoStageKey>(selectedStage || 'problem_understanding');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [runImmediateAnalysis, setRunImmediateAnalysis] = useState(true);
  const [validationResult, setValidationResult] = useState<{
    isValid?: boolean;
    format?: string;
    error?: string;
  } | null>(null);

  // Sync state if props change
  React.useEffect(() => {
    if (selectedTeamId) setTeamId(selectedTeamId);
    if (selectedStage) setStage(selectedStage);
  }, [selectedTeamId, selectedStage]);

  const handleUrlChange = (val: string) => {
    setVideoUrl(val);
    if (val.trim()) {
      const res = aiJudgeService.validateVideoUrl(val);
      setValidationResult(res);
    } else {
      setValidationResult(null);
    }
  };

  const handleQuickSampleUrl = (sampleType: 'mp4' | 'youtube' | 'drive_bad') => {
    if (sampleType === 'mp4') {
      handleUrlChange('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setFileName('demo_submission.mp4');
    } else if (sampleType === 'youtube') {
      handleUrlChange('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      setFileName('youtube_presentation.mp4');
    } else {
      handleUrlChange('https://drive.google.com/file/d/private-restricted-access-12345/view?usp=sharing');
      setFileName('restricted_drive_test.mp4');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamId) {
      toast({ title: 'Select a Team', variant: 'destructive' });
      return;
    }
    if (!videoUrl.trim()) {
      toast({ title: 'Enter a Video Link or File', variant: 'destructive' });
      return;
    }

    const attachResult = aiJudgeService.updateVideoSubmission(teamId, stage, videoUrl, fileName);

    if (!attachResult.success) {
      toast({
        title: 'Error Attaching Video',
        description: attachResult.error || 'Failed to update video.',
        variant: 'destructive',
      });
      return;
    }

    if (runImmediateAnalysis) {
      aiJudgeService.runAIVideoAnalysis(teamId, stage);
      toast({
        title: 'Video Attached & AI Evaluated',
        description: `Successfully analyzed ${OFFICIAL_STAGES[stage].title} for ${teamId}.`,
      });
    } else {
      toast({
        title: 'Video Attached',
        description: `Video submission saved for ${OFFICIAL_STAGES[stage].title}.`,
      });
    }

    onVideoAttached();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-[#0B132B] text-white border-cyan-800/80 p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" /> Attach Video Submission (Section 4)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            Attach MP4, MOV, YouTube, or Drive video link. Validates access permissions automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2 text-xs">
          {/* Team Select */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">Registered Team *</label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs">
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1C2541] border-cyan-800 text-white text-xs">
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.id} — {t.teamName} ({t.projectTitle})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submission Stage Select */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">Submission Stage Category *</label>
            <Select value={stage} onValueChange={(val: VideoStageKey) => setStage(val)}>
              <SelectTrigger className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1C2541] border-cyan-800 text-white text-xs">
                {(['problem_understanding', 'pitch_deck', 'prototype_progress', 'final_output'] as VideoStageKey[]).map(
                  (st) => (
                    <SelectItem key={st} value={st} className="text-xs">
                      Stage {OFFICIAL_STAGES[st].number}: {OFFICIAL_STAGES[st].title} (Max: {OFFICIAL_STAGES[st].maxMarks} marks)
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Video URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold block">Video URL or Storage Link *</label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-400">Insert Sample:</span>
                <button
                  type="button"
                  onClick={() => handleQuickSampleUrl('mp4')}
                  className="text-cyan-400 hover:underline"
                >
                  Public MP4
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleQuickSampleUrl('drive_bad')}
                  className="text-rose-400 hover:underline"
                >
                  Restricted Drive
                </button>
              </div>
            </div>

            <Input
              type="text"
              placeholder="https://... (MP4, MOV, YouTube, Loom, Google Drive)"
              value={videoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              required
              className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs font-mono"
            />

            {/* Validation Banner */}
            {validationResult && (
              <div
                className={`mt-2 p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
                  validationResult.isValid
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800 text-rose-200'
                }`}
              >
                {validationResult.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong>Format Detected: {validationResult.format}</strong>
                  {validationResult.error && <p className="mt-0.5">{validationResult.error}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Checkbox for Immediate AI Evaluation */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="runAI"
              checked={runImmediateAnalysis}
              onChange={(e) => setRunImmediateAnalysis(e.target.checked)}
              className="rounded border-cyan-800 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
            />
            <label htmlFor="runAI" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Automatically run AI audio transcription, visual indexing & rubric scoring immediately
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-cyan-950">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-300 hover:text-white h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-9 text-xs"
            >
              Attach & Validate Submission
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
