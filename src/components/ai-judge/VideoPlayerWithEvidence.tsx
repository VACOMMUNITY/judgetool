import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Search,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { VideoSubmissionStageData, TranscriptSnippet } from '@/types/aiJudge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface VideoPlayerWithEvidenceProps {
  submission: VideoSubmissionStageData;
  teamName: string;
  onSeekRequested?: (seconds: number) => void;
}

export const VideoPlayerWithEvidence: React.FC<VideoPlayerWithEvidenceProps> = ({
  submission,
  teamName,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(submission.durationSeconds || 180);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'visual_evidence' | 'claims'>('transcript');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);

  useEffect(() => {
    if (submission.durationSeconds) {
      setDuration(submission.durationSeconds);
    }
  }, [submission]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);

      // Highlight active transcript snippet
      const matching = submission.transcript.find((t, i) => {
        const next = submission.transcript[i + 1];
        if (next) {
          return current >= t.timeSeconds && current < next.timeSeconds;
        }
        return current >= t.timeSeconds;
      });
      if (matching) {
        setActiveSnippetId(matching.id);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      setCurrentTime(seconds);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filteredTranscript = submission.transcript.filter(
    (t) =>
      t.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.keyPoints && t.keyPoints.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="bg-[#0B132B] text-white rounded-2xl border border-cyan-900/40 shadow-2xl overflow-hidden flex flex-col">
      {/* Video Header Bar */}
      <div className="bg-[#1C2541]/80 backdrop-blur px-5 py-3 border-b border-cyan-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h4 className="font-semibold text-sm tracking-wide text-cyan-200">
            Stage {submission.stageNumber}: {submission.stageTitle}
          </h4>
          <Badge variant="outline" className="text-xs bg-blue-950/70 text-blue-300 border-blue-700/50">
            Max: {submission.maxMarks} Marks
          </Badge>
          <Badge
            variant="outline"
            className={
              submission.status === 'inaccessible'
                ? 'bg-rose-950/70 text-rose-300 border-rose-700'
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
            }
          >
            {submission.status === 'inaccessible' ? 'Inaccessible Link' : `${submission.format} Video`}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span>AI Confidence:</span>
          <span className="font-mono font-bold text-cyan-300">{submission.aiConfidence}%</span>
        </div>
      </div>

      {/* Main Video & Stream Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Left Column: Video Player & Scrubbing Controls */}
        <div className="lg:col-span-7 bg-black/90 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-cyan-950">
          {/* Video Container */}
          <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
            {submission.status === 'inaccessible' ? (
              <div className="p-8 text-center max-w-md">
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3 animate-bounce" />
                <h5 className="text-rose-200 font-bold mb-1 text-base">Video Inaccessible</h5>
                <p className="text-xs text-rose-300/80 mb-4">{submission.accessError}</p>
                <div className="text-[11px] bg-rose-950/50 p-3 rounded-lg border border-rose-800/60 text-slate-300 text-left">
                  <strong>Fairness Policy Notice:</strong> As per COMMUNITY.VA AI hackathon regulations, the AI evaluation engine cannot invent scores for inaccessible media.
                </div>
              </div>
            ) : submission.format === 'YOUTUBE' ? (
              <iframe
                title="YouTube Video"
                src={submission.videoUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={submission.videoUrl}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                playsInline
              />
            )}

            {/* In-Video Watermark Badge */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-cyan-300 border border-cyan-800/50 pointer-events-none">
              {teamName} • STAGE {submission.stageNumber}
            </div>
          </div>

          {/* Interactive Player Scrubbing Bar & Controls */}
          {submission.status !== 'inaccessible' && (
            <div className="p-4 bg-[#1C2541]/90 border-t border-cyan-900/40 flex flex-col gap-2">
              {/* Scrubbing slider */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-cyan-300 w-10 text-right">
                  {formatSeconds(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 180}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
                />
                <span className="text-[11px] font-mono text-slate-400 w-10">
                  {formatSeconds(duration)}
                </span>
              </div>

              {/* Bottom control icons and timestamp quick jumps */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlay}
                    className="h-8 w-8 p-0 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/60"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-cyan-950/60"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Quick timestamp evidence pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1 scrollbar-none">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1">
                    Citations:
                  </span>
                  {submission.transcript.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => seekTo(item.timeSeconds)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/80 text-cyan-300 hover:bg-cyan-800/80 border border-cyan-700/50 transition-colors"
                    >
                      [{item.timestamp}]
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Evidence & Transcript Studio */}
        <div className="lg:col-span-5 flex flex-col bg-[#0B132B]">
          {/* Subtabs: Transcript, Visual Evidence, Verified Claims */}
          <div className="flex border-b border-cyan-900/40 bg-[#1C2541]/40 text-xs">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 py-3 px-3 font-medium transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'transcript'
                  ? 'border-cyan-400 text-cyan-300 bg-[#1C2541]/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Transcript ({submission.transcript.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('visual_evidence')}
              className={`flex-1 py-3 px-3 font-medium transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'visual_evidence'
                  ? 'border-cyan-400 text-cyan-300 bg-[#1C2541]/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Visuals ({submission.visualEvidence.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`flex-1 py-3 px-3 font-medium transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'claims'
                  ? 'border-cyan-400 text-cyan-300 bg-[#1C2541]/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Claims ({submission.claims.length})</span>
            </button>
          </div>

          {/* Tab 1: AI Transcript */}
          {activeTab === 'transcript' && (
            <div className="flex flex-col flex-1 p-3">
              {/* Transcript Search Bar */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transcript speech..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1C2541]/60 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-cyan-900/50 focus:border-cyan-400 outline-none text-slate-200"
                />
              </div>

              <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2 pr-1 scrollbar-thin scrollbar-thumb-cyan-800">
                {filteredTranscript.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    {submission.status === 'inaccessible'
                      ? 'No transcript generated due to inaccessible video URL.'
                      : 'No transcript matches found.'}
                  </div>
                ) : (
                  filteredTranscript.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => seekTo(t.timeSeconds)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        activeSnippetId === t.id
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-100 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-[#1C2541]/40 border-cyan-950/60 hover:bg-[#1C2541]/80 hover:border-cyan-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-cyan-300 text-[11px]">{t.speaker}</span>
                        <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-cyan-400">
                          {t.timestamp}
                        </span>
                      </div>
                      <p className="leading-relaxed text-[12px]">{t.text}</p>
                      {t.keyPoints && t.keyPoints.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {t.keyPoints.map((kp, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-blue-950/60 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/40"
                            >
                              • {kp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Visual Evidence Observations */}
          {activeTab === 'visual_evidence' && (
            <div className="flex-1 p-3 overflow-y-auto max-h-[400px] space-y-2.5">
              {submission.visualEvidence.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No visual observations extracted yet.
                </div>
              ) : (
                submission.visualEvidence.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => seekTo(v.timeSeconds)}
                    className="p-3 rounded-xl bg-[#1C2541]/50 border border-cyan-900/50 hover:border-cyan-500/60 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                          {v.frameType}
                        </span>
                        <span className="font-semibold text-slate-200">{v.label}</span>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-400 bg-black/40 px-1.5 py-0.5 rounded">
                        [{v.timestamp}]
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{v.description}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Vision Confidence</span>
                      <span className="font-mono text-cyan-300">{Math.round(v.confidenceScore * 100)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Claims vs. Evidence Matrix */}
          {activeTab === 'claims' && (
            <div className="flex-1 p-3 overflow-y-auto max-h-[400px] space-y-2.5">
              {submission.claims.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No key claims extracted yet.
                </div>
              ) : (
                submission.claims.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border text-xs ${
                      c.status === 'verified'
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-100'
                        : c.status === 'unsupported'
                        ? 'bg-rose-950/30 border-rose-800/60 text-rose-100'
                        : 'bg-amber-950/30 border-amber-800/50 text-amber-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {c.status === 'verified' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className="font-semibold capitalize text-[11px]">{c.status} Claim</span>
                      </div>
                      {c.evidenceTimestamp && (
                        <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-cyan-300">
                          [{c.evidenceTimestamp}]
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-[12px] mb-1 italic">"{c.claimText}"</p>
                    <p className="text-[11px] opacity-90 leading-relaxed">{c.explanation}</p>
                    {c.requiresHumanReview && (
                      <div className="mt-2 text-[10px] font-semibold text-rose-300 flex items-center gap-1 bg-rose-950/60 p-1.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Flagged for human judge manual review
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
