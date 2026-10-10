import React, { useState, useEffect, useRef } from 'react';
import { HackathonTeamRecord, hackathonJudgeDb } from '@/services/hackathonJudgeDb';
import { VideoAiService } from '@/services/videoAiService';
import { videoFileStorage } from '@/services/videoFileStorage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Edit3,
  Save,
  ThumbsUp,
  ThumbsDown,
  Video,
  ExternalLink,
  Layers,
  HardDrive,
  FileCheck,
  FolderOpen,
  Award,
  RefreshCw,
  Trophy,
} from 'lucide-react';

interface TeamEvaluationViewProps {
  team: HackathonTeamRecord;
  onBack: () => void;
  onUpdated: () => void;
  onAnnounceWinner?: () => void;
  onOpenDistributeCertificates?: (teamId?: string) => void;
}

export const TeamEvaluationView: React.FC<TeamEvaluationViewProps> = ({
  team,
  onBack,
  onUpdated,
  onAnnounceWinner,
  onOpenDistributeCertificates,
}) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalyzingStep, setCurrentAnalyzingStep] = useState<string>('');
  const [evaluatingStage, setEvaluatingStage] = useState<number | null>(null);

  // Local object URLs for video files browsed from PC
  const [loadedUrls, setLoadedUrls] = useState<Record<number, string>>({});
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);
  const fileInputRef4 = useRef<HTMLInputElement>(null);

  // Individual marks & comments for each video
  const [videoMarks, setVideoMarks] = useState<{
    1: string;
    2: string;
    3: string;
    4: string;
  }>({
    1: team.judgeOverrides.video1 !== undefined ? String(team.judgeOverrides.video1) : team.scores.video1 ? String(team.scores.video1) : '',
    2: team.judgeOverrides.video2 !== undefined ? String(team.judgeOverrides.video2) : team.scores.video2 ? String(team.scores.video2) : '',
    3: team.judgeOverrides.video3 !== undefined ? String(team.judgeOverrides.video3) : team.scores.video3 ? String(team.scores.video3) : '',
    4: team.judgeOverrides.video4 !== undefined ? String(team.judgeOverrides.video4) : team.scores.video4 ? String(team.scores.video4) : '',
  });

  const [videoComments, setVideoComments] = useState<{
    1: string;
    2: string;
    3: string;
    4: string;
  }>({ 1: '', 2: '', 3: '', 4: '' });

  useEffect(() => {
    setVideoMarks({
      1: team.judgeOverrides.video1 !== undefined ? String(team.judgeOverrides.video1) : team.scores.video1 ? String(team.scores.video1) : '',
      2: team.judgeOverrides.video2 !== undefined ? String(team.judgeOverrides.video2) : team.scores.video2 ? String(team.scores.video2) : '',
      3: team.judgeOverrides.video3 !== undefined ? String(team.judgeOverrides.video3) : team.scores.video3 ? String(team.scores.video3) : '',
      4: team.judgeOverrides.video4 !== undefined ? String(team.judgeOverrides.video4) : team.scores.video4 ? String(team.scores.video4) : '',
    });
  }, [team.id, team.judgeOverrides, team.scores]);

  useEffect(() => {
    let isMounted = true;
    const loadStoredVideos = async () => {
      const urls: Record<number, string> = {};
      for (const num of [1, 2, 3, 4] as const) {
        const stored = await videoFileStorage.getVideoObjectUrl(team.id, num);
        if (stored) {
          urls[num] = stored;
        }
      }
      if (isMounted && Object.keys(urls).length > 0) {
        setLoadedUrls(urls);
      }
    };
    loadStoredVideos();
    return () => {
      isMounted = false;
    };
  }, [team.id]);

  const handleUploadFromPc = async (stageNum: 1 | 2 | 3 | 4, file: File) => {
    try {
      const objUrl = await videoFileStorage.saveVideo(team.id, stageNum, file);
      setLoadedUrls((prev) => ({ ...prev, [stageNum]: objUrl }));

      const currentUrls = { ...team.videoUrls, [`video${stageNum}`]: objUrl };
      const currentNames = { ...team.videoFileNames, [`video${stageNum}`]: file.name };
      const currentSizes = { ...team.videoFileSizes, [`video${stageNum}`]: file.size };

      hackathonJudgeDb.updateTeamVideos(team.id, currentUrls, currentNames, currentSizes);
      toast({
        title: `Video ${stageNum} Loaded from PC`,
        description: `${file.name} is ready for evaluation.`,
      });
      onUpdated();
    } catch (e) {
      toast({
        title: 'Error loading file',
        description: 'Failed to access video from local machine.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSingleVideoMark = (stageNum: 1 | 2 | 3 | 4) => {
    const rawVal = videoMarks[stageNum].trim();
    const max = { 1: 15, 2: 20, 3: 25, 4: 40 }[stageNum];
    if (rawVal === '') {
      toast({
        title: 'Enter Marks',
        description: `Please enter marks for Video ${stageNum} (between 0 and ${max}).`,
        variant: 'destructive',
      });
      return;
    }
    const val = parseFloat(rawVal);
    if (isNaN(val) || val < 0 || val > max) {
      toast({
        title: 'Marks Out of Range',
        description: `Marks for Video ${stageNum} must be between 0 and ${max}.`,
        variant: 'destructive',
      });
      return;
    }

    const success = hackathonJudgeDb.setSingleVideoMark(
      team.id,
      stageNum,
      val,
      judgeName,
      videoComments[stageNum]
    );

    if (success) {
      toast({
        title: `Video ${stageNum} Marks Awarded`,
        description: `Awarded ${val} / ${max} marks. Total score recalculated.`,
      });
      onUpdated();
    }
  };

  const handleEvaluateSingleVideo = async (stageNum: 1 | 2 | 3 | 4) => {
    setEvaluatingStage(stageNum);
    try {
      const res = await hackathonJudgeDb.evaluateSingleVideo(team.id, stageNum);
      if (res) {
        setVideoMarks((prev) => ({ ...prev, [stageNum]: String(res.score) }));
        toast({
          title: `AI Graded Video ${stageNum}`,
          description: `Score awarded: ${res.score} / ${res.maxScore} marks.`,
        });
        onUpdated();
      }
    } catch {
      toast({
        title: 'Evaluation Failed',
        description: 'Unable to grade video. Check video file or link.',
        variant: 'destructive',
      });
    } finally {
      setEvaluatingStage(null);
    }
  };

  // Judge Override form states
  const [overrideV1, setOverrideV1] = useState<string>(
    team.judgeOverrides.video1 !== undefined ? String(team.judgeOverrides.video1) : ''
  );
  const [overrideV2, setOverrideV2] = useState<string>(
    team.judgeOverrides.video2 !== undefined ? String(team.judgeOverrides.video2) : ''
  );
  const [overrideV3, setOverrideV3] = useState<string>(
    team.judgeOverrides.video3 !== undefined ? String(team.judgeOverrides.video3) : ''
  );
  const [overrideV4, setOverrideV4] = useState<string>(
    team.judgeOverrides.video4 !== undefined ? String(team.judgeOverrides.video4) : ''
  );
  const [judgeComments, setJudgeComments] = useState<string>(
    team.judgeOverrides.comments || ''
  );
  const [judgeName, setJudgeName] = useState<string>(
    team.judgeOverrides.judgeName || 'Paidimarri Abhiram (Founder & CEO)'
  );
  const [isSavingOverrides, setIsSavingOverrides] = useState(false);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentAnalyzingStep('Initializing AI Video Analyzer...');
    try {
      await hackathonJudgeDb.evaluateTeamVideos(team.id, (stageNum, stageName) => {
        setCurrentAnalyzingStep(`Evaluating Video ${stageNum}: ${stageName}...`);
      });
      toast({
        title: 'AI Video Analysis Completed',
        description: `Successfully analyzed all four videos for ${team.teamName}. Total Score calculated.`,
      });
      onUpdated();
    } catch (err) {
      toast({
        title: 'Analysis Error',
        description: 'Failed to complete video evaluation. Check video links.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalyzingStep('');
    }
  };

  const handleSaveOverrides = () => {
    setIsSavingOverrides(true);
    const parsedV1 = overrideV1.trim() !== '' ? parseFloat(overrideV1) : undefined;
    const parsedV2 = overrideV2.trim() !== '' ? parseFloat(overrideV2) : undefined;
    const parsedV3 = overrideV3.trim() !== '' ? parseFloat(overrideV3) : undefined;
    const parsedV4 = overrideV4.trim() !== '' ? parseFloat(overrideV4) : undefined;

    // Validate boundaries
    if (parsedV1 !== undefined && (parsedV1 < 0 || parsedV1 > 15)) {
      toast({ title: 'Invalid Video 1 Marks', description: 'Must be between 0 and 15 marks.', variant: 'destructive' });
      setIsSavingOverrides(false);
      return;
    }
    if (parsedV2 !== undefined && (parsedV2 < 0 || parsedV2 > 20)) {
      toast({ title: 'Invalid Video 2 Marks', description: 'Must be between 0 and 20 marks.', variant: 'destructive' });
      setIsSavingOverrides(false);
      return;
    }
    if (parsedV3 !== undefined && (parsedV3 < 0 || parsedV3 > 25)) {
      toast({ title: 'Invalid Video 3 Marks', description: 'Must be between 0 and 25 marks.', variant: 'destructive' });
      setIsSavingOverrides(false);
      return;
    }
    if (parsedV4 !== undefined && (parsedV4 < 0 || parsedV4 > 40)) {
      toast({ title: 'Invalid Video 4 Marks', description: 'Must be between 0 and 40 marks.', variant: 'destructive' });
      setIsSavingOverrides(false);
      return;
    }

    const success = hackathonJudgeDb.setJudgeOverride(team.id, {
      video1: parsedV1,
      video2: parsedV2,
      video3: parsedV3,
      video4: parsedV4,
      comments: judgeComments,
      judgeName,
    });

    setIsSavingOverrides(false);
    if (success) {
      toast({
        title: 'Judge Marks & Feedback Saved',
        description: 'Scores updated in leaderboard.',
      });
      onUpdated();
    }
  };

  const videoCards = [
    {
      num: 1,
      title: 'Problem Statement Understanding',
      max: 15,
      url: loadedUrls[1] || team.videoUrls.video1,
      fileName: team.videoFileNames?.video1,
      ref: fileInputRef1,
      score: team.scores.video1,
      overrideScore: team.judgeOverrides.video1,
      feedback: team.feedback.video1,
      criteria: 'Problem clarity, target user identification, root cause depth, importance and real-world relevance, existing limitations, clarity of AI approach.',
    },
    {
      num: 2,
      title: 'Pitch Deck Presentation',
      max: 20,
      url: loadedUrls[2] || team.videoUrls.video2,
      fileName: team.videoFileNames?.video2,
      ref: fileInputRef2,
      score: team.scores.video2,
      overrideScore: team.judgeOverrides.video2,
      feedback: team.feedback.video2,
      criteria: 'Idea quality, innovation, solution clarity, technical feasibility, potential impact and scalability, business viability, deck quality.',
    },
    {
      num: 3,
      title: '50% Prototype Demonstration',
      max: 25,
      url: loadedUrls[3] || team.videoUrls.video3,
      fileName: team.videoFileNames?.video3,
      ref: fileInputRef3,
      score: team.scores.video3,
      overrideScore: team.judgeOverrides.video3,
      feedback: team.feedback.video3,
      criteria: 'Evidence of implementation, working features demonstrated, AI integration progress, technical quality, progress toward proposed solution, limitations and next steps.',
    },
    {
      num: 4,
      title: 'Final Project Demonstration',
      max: 40,
      url: loadedUrls[4] || team.videoUrls.video4,
      fileName: team.videoFileNames?.video4,
      ref: fileInputRef4,
      score: team.scores.video4,
      overrideScore: team.judgeOverrides.video4,
      feedback: team.feedback.video4,
      criteria: 'Functionality and successful demo, effectiveness of solution, quality of AI implementation, technical execution and reliability, usability/UX, innovation, real-world impact.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B132B] p-5 rounded-2xl border border-cyan-900/60 shadow-xl">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={onBack}
            className="text-slate-300 hover:text-white hover:bg-[#1C2541] h-9 px-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>

          <div className="h-6 w-px bg-cyan-900/80" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {team.id}
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">{team.teamName}</h2>
              <Badge
                className={
                  team.evaluationStatus === 'Completed'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700 text-xs'
                    : team.evaluationStatus === 'Needs Review'
                    ? 'bg-rose-950 text-rose-300 border-rose-700 text-xs'
                    : team.evaluationStatus === 'Analyzing'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 text-xs animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700 text-xs'
                }
              >
                Status: {team.evaluationStatus}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Project: <strong className="text-white">{team.projectName}</strong> • Members:{' '}
              {team.members.join(', ')}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {team.finalApprovedTotal > 0 && onOpenDistributeCertificates && (
            <Button
              size="sm"
              onClick={() => onOpenDistributeCertificates(team.id)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-3.5 shadow-lg shadow-emerald-900/30 text-xs"
              title="Distribute certificate to +91 8074401912 and +91 8688122992"
            >
              <Award className="w-4 h-4 mr-1.5" /> Distribute Certificate
            </Button>
          )}

          {team.finalApprovedTotal > 0 && onAnnounceWinner && (
            <Button
              size="sm"
              onClick={onAnnounceWinner}
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black h-10 px-4 shadow-lg shadow-amber-500/25 text-xs animate-pulse"
            >
              <Trophy className="w-4 h-4 mr-1.5 text-slate-950" /> Announce Winner 🏆
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold h-10 px-5 shadow-lg shadow-cyan-900/30 text-xs"
          >
            <Sparkles className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? currentAnalyzingStep || 'Analyzing Videos...' : 'Analyze Videos'}
          </Button>
        </div>
      </div>

      {/* Score Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#0B132B] p-4 rounded-2xl border border-cyan-900/50 text-center">
        <div className="p-3 rounded-xl bg-[#1C2541]/50 border border-cyan-950">
          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Video 1 (15m)</span>
          <span className="text-xl font-bold font-mono text-cyan-300">
            {team.judgeOverrides.video1 ?? team.scores.video1}
            <span className="text-xs text-slate-500"> / 15</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#1C2541]/50 border border-cyan-950">
          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Video 2 (20m)</span>
          <span className="text-xl font-bold font-mono text-cyan-300">
            {team.judgeOverrides.video2 ?? team.scores.video2}
            <span className="text-xs text-slate-500"> / 20</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#1C2541]/50 border border-cyan-950">
          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Video 3 (25m)</span>
          <span className="text-xl font-bold font-mono text-cyan-300">
            {team.judgeOverrides.video3 ?? team.scores.video3}
            <span className="text-xs text-slate-500"> / 25</span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#1C2541]/50 border border-cyan-950">
          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Video 4 (40m)</span>
          <span className="text-xl font-bold font-mono text-cyan-300">
            {team.judgeOverrides.video4 ?? team.scores.video4}
            <span className="text-xs text-slate-500"> / 40</span>
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-600/50 shadow-inner">
          <span className="text-[10px] text-cyan-300 block uppercase font-bold">Total Score</span>
          <span className="text-2xl font-black font-mono text-white">
            {team.finalApprovedTotal}
            <span className="text-xs text-cyan-300"> / 100</span>
          </span>
          <span className="text-[10px] text-cyan-400 block mt-0.5">
            ({team.finalApprovedTotal}%)
          </span>
        </div>
      </div>

      {/* Prominent Announce Winner Banner after score is given */}
      {team.finalApprovedTotal > 0 && onAnnounceWinner && (
        <div className="bg-gradient-to-r from-amber-950/70 via-[#131F3F] to-cyan-950/70 border-2 border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
                  SCORE GRANTED: {team.finalApprovedTotal} / 100 ({team.finalApprovedTotal}%)
                </span>
                {team.rank && (
                  <Badge className="bg-amber-400 text-slate-950 font-mono text-[10px] font-black">
                    {team.rank === 1 ? '🥇 Rank 1 — Current Leader' : team.rank === 2 ? '🥈 Rank 2' : team.rank === 3 ? '🥉 Rank 3' : `Rank #${team.rank}`}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Marks evaluated across all stages. Distribute official certificate to <strong>+91 8074401912</strong> & <strong>+91 8688122992</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenDistributeCertificates && (
              <Button
                size="sm"
                onClick={() => onOpenDistributeCertificates(team.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-4 shadow-md shadow-emerald-900/30 whitespace-nowrap"
              >
                <Award className="w-4 h-4 mr-1.5" /> Distribute Certificate (+91 8074401912, +91 8688122992)
              </Button>
            )}
            <Button
              size="sm"
              onClick={onAnnounceWinner}
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs h-10 px-5 shadow-lg shadow-amber-500/30 whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 mr-1.5" /> Announce Winner 🏆
            </Button>
          </div>
        </div>
      )}

      {/* Four Videos Grid (2x2 or 4 Rows) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {videoCards.map((card) => {
          const finalScore = card.overrideScore !== undefined ? card.overrideScore : card.score;
          const hasFeedback = Boolean(card.feedback && card.feedback.status === 'completed');
          const isError = card.feedback?.status === 'error';

          return (
            <div
              key={card.num}
              className="bg-[#0B132B] rounded-2xl border border-cyan-900/60 p-5 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Stage Title and Marks */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">
                      Video {card.num} (Max: {card.max} Marks)
                    </span>
                    <h3 className="text-base font-bold text-white">{card.title}</h3>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xl font-extrabold text-cyan-300">
                      {finalScore.toFixed(1)}
                    </span>
                    <span className="font-mono text-xs text-slate-500"> / {card.max}</span>
                    {card.overrideScore !== undefined && (
                      <span className="block text-[9px] text-amber-400 font-semibold">Judge Overridden</span>
                    )}
                  </div>
                </div>

                {/* Embedded Video Player */}
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/90 border border-cyan-950 relative flex items-center justify-center mb-4">
                  {!card.url ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      <Video className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <span>No video URL provided for Video {card.num}.</span>
                    </div>
                  ) : card.url.includes('youtube.com') || card.url.includes('youtu.be') ? (
                    <iframe
                      title={`Video ${card.num}`}
                      src={card.url.replace('watch?v=', 'embed/')}
                      className="w-full h-full border-0"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={card.url}
                      controls
                      className="w-full h-full object-contain"
                      playsInline
                    />
                  )}
                </div>

                {/* Video source & Browse from PC toolbar */}
                <div className="flex items-center justify-between text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 mb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[220px]">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="truncate text-[11px] font-mono">
                      {card.fileName ? card.fileName : card.url ? 'Attached Video' : 'No video selected'}
                    </span>
                  </div>

                  <input
                    ref={card.ref}
                    type="file"
                    accept="video/mp4,video/quicktime,video/mov,video/webm,video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadFromPc(card.num as 1 | 2 | 3 | 4, e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => card.ref.current?.click()}
                    className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 text-[11px] h-7 px-2.5 flex-shrink-0 ml-auto"
                  >
                    <FolderOpen className="w-3 h-3 mr-1 text-cyan-400" />
                    Browse from PC
                  </Button>
                </div>

                {/* Criteria Definition */}
                <div className="bg-[#1C2541]/40 p-2.5 rounded-lg border border-cyan-950 text-[11px] text-slate-400 mb-3">
                  <strong className="text-slate-300">Evaluation Focus:</strong> {card.criteria}
                </div>

                {/* AI-Generated Feedback Box */}
                {isError ? (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Evaluation Error</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{card.feedback?.errorMessage}</p>
                  </div>
                ) : hasFeedback ? (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-[#1C2541]/70 border border-cyan-800/40 text-xs">
                      <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block mb-1">
                        AI Rubric Explanation
                      </span>
                      <p className="text-slate-200 leading-relaxed text-[11px]">{card.feedback?.explanation}</p>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-200">
                        <strong className="text-[10px] uppercase text-emerald-400 block mb-1 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> Strengths
                        </strong>
                        <ul className="space-y-1">
                          {card.feedback?.strengths.map((str, i) => (
                            <li key={i} className="line-clamp-2">• {str}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/40 text-rose-200">
                        <strong className="text-[10px] uppercase text-rose-400 block mb-1 flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" /> Improvement Areas
                        </strong>
                        <ul className="space-y-1">
                          {card.feedback?.weaknesses.map((w, i) => (
                            <li key={i} className="line-clamp-2">• {w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                    Click <strong>Analyze Videos</strong> above to generate AI marks and evidence feedback.
                  </div>
                )}

                {/* DIRECT MARKS AWARD SECTION FOR THIS VIDEO */}
                <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-cyan-800/60 shadow-inner space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-cyan-400" />
                      Give Marks for Video {card.num}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Cap: {card.max} Marks
                    </span>
                  </div>

                  {/* Input row + quick buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-semibold whitespace-nowrap">Enter Marks:</span>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max={card.max}
                        placeholder={`0 - ${card.max}`}
                        value={videoMarks[card.num as 1 | 2 | 3 | 4]}
                        onChange={(e) =>
                          setVideoMarks((prev) => ({
                            ...prev,
                            [card.num]: e.target.value,
                          }))
                        }
                        className="bg-slate-900 border-slate-700 text-white font-mono font-bold text-sm h-8 w-24 text-center focus:border-cyan-400"
                      />
                      <span className="text-xs text-slate-400 font-mono">/ {card.max}</span>
                    </div>

                    {/* Quick marks preset pills */}
                    <div className="flex items-center gap-1 flex-wrap sm:ml-auto">
                      <span className="text-[10px] text-slate-500 uppercase mr-0.5">Presets:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setVideoMarks((prev) => ({
                            ...prev,
                            [card.num]: String(card.max),
                          }))
                        }
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-cyan-900 hover:text-cyan-200 text-slate-300 transition-colors"
                      >
                        Max ({card.max})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setVideoMarks((prev) => ({
                            ...prev,
                            [card.num]: String(Math.round(card.max * 0.9 * 2) / 2),
                          }))
                        }
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-cyan-900 hover:text-cyan-200 text-slate-300 transition-colors"
                      >
                        90% ({Math.round(card.max * 0.9 * 2) / 2})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setVideoMarks((prev) => ({
                            ...prev,
                            [card.num]: String(Math.round(card.max * 0.8 * 2) / 2),
                          }))
                        }
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-cyan-900 hover:text-cyan-200 text-slate-300 transition-colors"
                      >
                        80% ({Math.round(card.max * 0.8 * 2) / 2})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setVideoMarks((prev) => ({
                            ...prev,
                            [card.num]: String(Math.round(card.max * 0.7 * 2) / 2),
                          }))
                        }
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-cyan-900 hover:text-cyan-200 text-slate-300 transition-colors"
                      >
                        70% ({Math.round(card.max * 0.7 * 2) / 2})
                      </button>
                    </div>
                  </div>

                  {/* Comment / Note input */}
                  <Input
                    placeholder={`Judge justification / notes for Video ${card.num} (optional)...`}
                    value={videoComments[card.num as 1 | 2 | 3 | 4]}
                    onChange={(e) =>
                      setVideoComments((prev) => ({
                        ...prev,
                        [card.num]: e.target.value,
                      }))
                    }
                    className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 text-xs h-8"
                  />

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleEvaluateSingleVideo(card.num as 1 | 2 | 3 | 4)}
                      disabled={evaluatingStage === card.num}
                      className="border-cyan-800 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900 text-xs h-8"
                    >
                      {evaluatingStage === card.num ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          AI Grading...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                          AI Grade Video {card.num}
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveSingleVideoMark(card.num as 1 | 2 | 3 | 4)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs h-8 px-3"
                    >
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      Save Video {card.num} Marks
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Human Judge Score Override & Comments Section (Section 6) */}
      <div className="bg-[#0B132B] rounded-2xl border border-cyan-900/70 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Judge Score Override & Comments</h3>
          </div>
          <span className="text-xs text-slate-400">
            Authorized judges can adjust marks within category maximums.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold">
              Video 1 Override (0 - 15)
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="15"
              placeholder={`Current: ${team.scores.video1}`}
              value={overrideV1}
              onChange={(e) => setOverrideV1(e.target.value)}
              className="bg-[#1C2541] border-cyan-900 text-white font-mono text-xs h-9"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold">
              Video 2 Override (0 - 20)
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="20"
              placeholder={`Current: ${team.scores.video2}`}
              value={overrideV2}
              onChange={(e) => setOverrideV2(e.target.value)}
              className="bg-[#1C2541] border-cyan-900 text-white font-mono text-xs h-9"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold">
              Video 3 Override (0 - 25)
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="25"
              placeholder={`Current: ${team.scores.video3}`}
              value={overrideV3}
              onChange={(e) => setOverrideV3(e.target.value)}
              className="bg-[#1C2541] border-cyan-900 text-white font-mono text-xs h-9"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold">
              Video 4 Override (0 - 40)
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="40"
              placeholder={`Current: ${team.scores.video4}`}
              value={overrideV4}
              onChange={(e) => setOverrideV4(e.target.value)}
              className="bg-[#1C2541] border-cyan-900 text-white font-mono text-xs h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="text-xs text-slate-300 block mb-1 font-semibold">Judge Name / Signature</label>
            <Input
              type="text"
              placeholder="Paidimarri Abhiram (Founder & CEO)"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              className="bg-[#1C2541] border-cyan-900 text-white text-xs h-9"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-slate-300 block mb-1 font-semibold">Judge Notes & Feedback</label>
            <Textarea
              rows={2}
              placeholder="Provide constructive feedback or rationale for adjusted marks..."
              value={judgeComments}
              onChange={(e) => setJudgeComments(e.target.value)}
              className="bg-[#1C2541] border-cyan-900 text-white text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {onAnnounceWinner && team.finalApprovedTotal > 0 ? (
            <Button
              type="button"
              size="sm"
              onClick={onAnnounceWinner}
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs h-9 px-4 shadow-md shadow-amber-500/20"
            >
              <Trophy className="w-4 h-4 mr-1.5" /> Announce Winner 🏆
            </Button>
          ) : <div />}

          <Button
            size="sm"
            onClick={handleSaveOverrides}
            disabled={isSavingOverrides}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs h-9 px-5"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Overrides & Recalculate Total
          </Button>
        </div>
      </div>
    </div>
  );
};
