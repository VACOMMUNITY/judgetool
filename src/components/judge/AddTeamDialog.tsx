import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { hackathonJudgeDb } from '@/services/hackathonJudgeDb';
import { VideoAiService } from '@/services/videoAiService';
import { videoFileStorage } from '@/services/videoFileStorage';
import { VideoFileSelector } from './VideoFileSelector';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Video, Users, Sparkles, HardDrive, Award } from 'lucide-react';

interface AddTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamAdded: () => void;
}

export const AddTeamDialog: React.FC<AddTeamDialogProps> = ({
  open,
  onOpenChange,
  onTeamAdded,
}) => {
  const { toast } = useToast();
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [members, setMembers] = useState('');

  // 4 Video state (URLs or Object URLs from PC)
  const [video1Url, setVideo1Url] = useState('');
  const [file1, setFile1] = useState<File | null>(null);

  const [video2Url, setVideo2Url] = useState('');
  const [file2, setFile2] = useState<File | null>(null);

  const [video3Url, setVideo3Url] = useState('');
  const [file3, setFile3] = useState<File | null>(null);

  const [video4Url, setVideo4Url] = useState('');
  const [file4, setFile4] = useState<File | null>(null);

  // Per-video Marks and Feedback state
  const [videoMarks, setVideoMarks] = useState<{
    1?: number;
    2?: number;
    3?: number;
    4?: number;
  }>({});

  const [videoFeedback, setVideoFeedback] = useState<{
    1?: string;
    2?: string;
    3?: string;
    4?: string;
  }>({});

  const [evaluatingStages, setEvaluatingStages] = useState<{
    1?: boolean;
    2?: boolean;
    3?: boolean;
    4?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Immediately analyze and award marks when a video is selected
  const evaluateVideoImmediately = async (
    stage: 1 | 2 | 3 | 4,
    url: string
  ) => {
    if (!url) return;
    setEvaluatingStages((prev) => ({ ...prev, [stage]: true }));
    try {
      const res = await VideoAiService.analyzeVideo(
        stage,
        url,
        teamName.trim() || 'Team',
        projectName.trim() || 'AI Hackathon Project'
      );
      setVideoMarks((prev) => ({ ...prev, [stage]: res.score }));
      setVideoFeedback((prev) => ({ ...prev, [stage]: res.explanation }));
    } catch (e) {
      console.warn('Error evaluating video immediately:', e);
    } finally {
      setEvaluatingStages((prev) => ({ ...prev, [stage]: false }));
    }
  };

  const handleSelectFile = (stage: 1 | 2 | 3 | 4, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    if (stage === 1) {
      setFile1(file);
      setVideo1Url(objectUrl);
    } else if (stage === 2) {
      setFile2(file);
      setVideo2Url(objectUrl);
    } else if (stage === 3) {
      setFile3(file);
      setVideo3Url(objectUrl);
    } else if (stage === 4) {
      setFile4(file);
      setVideo4Url(objectUrl);
    }

    // Trigger instant grading and display marks
    evaluateVideoImmediately(stage, objectUrl);
  };

  const handleUrlChange = (stage: 1 | 2 | 3 | 4, url: string) => {
    if (stage === 1) setVideo1Url(url);
    else if (stage === 2) setVideo2Url(url);
    else if (stage === 3) setVideo3Url(url);
    else if (stage === 4) setVideo4Url(url);

    if (url.trim().length > 6) {
      evaluateVideoImmediately(stage, url.trim());
    }
  };

  const handleClearVideo = (stage: 1 | 2 | 3 | 4) => {
    if (stage === 1) {
      if (file1 && video1Url.startsWith('blob:')) URL.revokeObjectURL(video1Url);
      setFile1(null);
      setVideo1Url('');
    } else if (stage === 2) {
      if (file2 && video2Url.startsWith('blob:')) URL.revokeObjectURL(video2Url);
      setFile2(null);
      setVideo2Url('');
    } else if (stage === 3) {
      if (file3 && video3Url.startsWith('blob:')) URL.revokeObjectURL(video3Url);
      setFile3(null);
      setVideo3Url('');
    } else if (stage === 4) {
      if (file4 && video4Url.startsWith('blob:')) URL.revokeObjectURL(video4Url);
      setFile4(null);
      setVideo4Url('');
    }

    setVideoMarks((prev) => {
      const copy = { ...prev };
      delete copy[stage];
      return copy;
    });

    setVideoFeedback((prev) => {
      const copy = { ...prev };
      delete copy[stage];
      return copy;
    });
  };

  // Running sum of marks
  const totalCalculatedMarks =
    Math.round(
      ((videoMarks[1] || 0) +
        (videoMarks[2] || 0) +
        (videoMarks[3] || 0) +
        (videoMarks[4] || 0)) *
        10
    ) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast({
        title: 'Team Name Required',
        description: 'Please specify the name of the participating hackathon team.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedMembers = members
        .split(/[,;\n]+/)
        .map((m) => m.trim())
        .filter(Boolean);

      const newTeam = hackathonJudgeDb.addTeam({
        teamName: teamName.trim(),
        projectName: projectName.trim() || 'AI Hackathon Project',
        projectDescription:
          projectDescription.trim() || 'Community.VA AI Innovation Hackathon submission.',
        members: parsedMembers.length > 0 ? parsedMembers : ['Team Lead'],
        videoUrls: {
          video1: video1Url.trim(),
          video2: video2Url.trim(),
          video3: video3Url.trim(),
          video4: video4Url.trim(),
        },
        videoFileNames: {
          video1: file1?.name,
          video2: file2?.name,
          video3: file3?.name,
          video4: file4?.name,
        },
        videoFileSizes: {
          video1: file1?.size,
          video2: file2?.size,
          video3: file3?.size,
          video4: file4?.size,
        },
        initialScores: {
          video1: videoMarks[1] || 0,
          video2: videoMarks[2] || 0,
          video3: videoMarks[3] || 0,
          video4: videoMarks[4] || 0,
        },
        initialFeedback: {
          video1: videoFeedback[1] ? { explanation: videoFeedback[1], score: videoMarks[1] || 0 } : undefined,
          video2: videoFeedback[2] ? { explanation: videoFeedback[2], score: videoMarks[2] || 0 } : undefined,
          video3: videoFeedback[3] ? { explanation: videoFeedback[3], score: videoMarks[3] || 0 } : undefined,
          video4: videoFeedback[4] ? { explanation: videoFeedback[4], score: videoMarks[4] || 0 } : undefined,
        },
      });

      // Persist any uploaded files to IndexedDB
      if (file1) await videoFileStorage.saveVideo(newTeam.id, 1, file1);
      if (file2) await videoFileStorage.saveVideo(newTeam.id, 2, file2);
      if (file3) await videoFileStorage.saveVideo(newTeam.id, 3, file3);
      if (file4) await videoFileStorage.saveVideo(newTeam.id, 4, file4);

      toast({
        title: 'Team Registered Successfully',
        description: `${teamName} has been enrolled with marks calculated (${totalCalculatedMarks} / 100).`,
      });

      // Reset
      setTeamName('');
      setProjectName('');
      setProjectDescription('');
      setMembers('');
      setFile1(null);
      setFile2(null);
      setFile3(null);
      setFile4(null);
      setVideo1Url('');
      setVideo2Url('');
      setVideo3Url('');
      setVideo4Url('');
      setVideoMarks({});
      setVideoFeedback({});

      onOpenChange(false);
      onTeamAdded();
    } catch (err) {
      toast({
        title: 'Registration Error',
        description: 'Failed to record team data.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#0B132B] text-white border-cyan-800/80 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            Register Team & Select Submission Videos
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Browse and upload the four videos from your PC. Marks are calculated and displayed immediately for each video.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Team Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-300">Team Name *</Label>
              <Input
                placeholder="e.g., VisionCare AI"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="mt-1 bg-slate-900 border-slate-700 text-white placeholder-slate-500 text-xs focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-300">Project / Solution Title</Label>
              <Input
                placeholder="e.g., Automated Glaucoma & Retinopathy Screener"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1 bg-slate-900 border-slate-700 text-white placeholder-slate-500 text-xs focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-300">Team Members (Comma-separated)</Label>
            <Input
              placeholder="e.g., Aarav Sharma (Lead), Pooja Sundaram, Rohan Mehra"
              value={members}
              onChange={(e) => setMembers(e.target.value)}
              className="mt-1 bg-slate-900 border-slate-700 text-white placeholder-slate-500 text-xs focus:border-cyan-500"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-300">Problem & Solution Summary</Label>
            <Textarea
              rows={2}
              placeholder="Brief description of the challenge and AI innovation..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="mt-1 bg-slate-900 border-slate-700 text-white placeholder-slate-500 text-xs focus:border-cyan-500"
            />
          </div>

          {/* 4 Video Selectors with Instant Marks Display */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                Select Four Videos from Your PC (Marks Displayed on Upload)
              </h4>
              <span className="text-[11px] text-slate-400">
                Click browse or drag & drop MP4 / MOV files
              </span>
            </div>

            <div className="space-y-3">
              {/* Video 1 */}
              <VideoFileSelector
                videoNumber={1}
                label="Video 1: Problem Statement Understanding"
                maxMarks={15}
                hint="Assesses problem clarity, target users, root cause, importance, and AI approach."
                videoUrl={video1Url}
                fileName={file1?.name}
                fileSize={file1?.size}
                marks={videoMarks[1]}
                onMarksChange={(val) => setVideoMarks((prev) => ({ ...prev, 1: val }))}
                isEvaluating={evaluatingStages[1]}
                evaluationFeedback={videoFeedback[1]}
                onFileSelected={(file) => handleSelectFile(1, file)}
                onUrlChange={(url) => handleUrlChange(1, url)}
                onClear={() => handleClearVideo(1)}
              />

              {/* Video 2 */}
              <VideoFileSelector
                videoNumber={2}
                label="Video 2: Pitch Deck Presentation"
                maxMarks={20}
                hint="Assesses idea quality, innovation, solution clarity, feasibility, impact, and pitch deck."
                videoUrl={video2Url}
                fileName={file2?.name}
                fileSize={file2?.size}
                marks={videoMarks[2]}
                onMarksChange={(val) => setVideoMarks((prev) => ({ ...prev, 2: val }))}
                isEvaluating={evaluatingStages[2]}
                evaluationFeedback={videoFeedback[2]}
                onFileSelected={(file) => handleSelectFile(2, file)}
                onUrlChange={(url) => handleUrlChange(2, url)}
                onClear={() => handleClearVideo(2)}
              />

              {/* Video 3 */}
              <VideoFileSelector
                videoNumber={3}
                label="Video 3: 50% Prototype Demonstration"
                maxMarks={25}
                hint="Assesses implementation progress, working features, AI integration, and technical choices."
                videoUrl={video3Url}
                fileName={file3?.name}
                fileSize={file3?.size}
                marks={videoMarks[3]}
                onMarksChange={(val) => setVideoMarks((prev) => ({ ...prev, 3: val }))}
                isEvaluating={evaluatingStages[3]}
                evaluationFeedback={videoFeedback[3]}
                onFileSelected={(file) => handleSelectFile(3, file)}
                onUrlChange={(url) => handleUrlChange(3, url)}
                onClear={() => handleClearVideo(3)}
              />

              {/* Video 4 */}
              <VideoFileSelector
                videoNumber={4}
                label="Video 4: Final Project Demonstration"
                maxMarks={40}
                hint="Assesses final working functionality, AI implementation, UX, scalability, and demo clarity."
                videoUrl={video4Url}
                fileName={file4?.name}
                fileSize={file4?.size}
                marks={videoMarks[4]}
                onMarksChange={(val) => setVideoMarks((prev) => ({ ...prev, 4: val }))}
                isEvaluating={evaluatingStages[4]}
                evaluationFeedback={videoFeedback[4]}
                onFileSelected={(file) => handleSelectFile(4, file)}
                onUrlChange={(url) => handleUrlChange(4, url)}
                onClear={() => handleClearVideo(4)}
              />
            </div>
          </div>

          {/* Running Total Marks Display */}
          <div className="bg-[#070B19] p-3.5 rounded-xl border border-cyan-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md mt-4">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-cyan-400" />
                Live Total Score Across Uploaded Videos
              </span>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                V1: {videoMarks[1] !== undefined ? `${videoMarks[1]}/15` : '--'} • 
                V2: {videoMarks[2] !== undefined ? `${videoMarks[2]}/20` : '--'} • 
                V3: {videoMarks[3] !== undefined ? `${videoMarks[3]}/25` : '--'} • 
                V4: {videoMarks[4] !== undefined ? `${videoMarks[4]}/40` : '--'}
              </span>
            </div>

            <div className="text-right flex items-center sm:flex-col justify-between sm:justify-center">
              <div>
                <span className="text-2xl font-black font-mono text-cyan-300">
                  {totalCalculatedMarks}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400"> / 100</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                ({totalCalculatedMarks}%)
              </span>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4"
            >
              {isSubmitting ? 'Registering Team...' : 'Register Team with Videos & Marks'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
