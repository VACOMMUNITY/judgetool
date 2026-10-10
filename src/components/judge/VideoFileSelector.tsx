import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Video,
  FileCheck,
  X,
  Link as LinkIcon,
  HardDrive,
  Film,
  Play,
  Award,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface VideoFileSelectorProps {
  label: string;
  maxMarks: number;
  hint: string;
  videoNumber: 1 | 2 | 3 | 4;
  videoUrl: string;
  fileName?: string;
  fileSize?: number;
  marks?: number;
  onMarksChange?: (mark: number) => void;
  isEvaluating?: boolean;
  evaluationFeedback?: string;
  onFileSelected: (file: File) => void;
  onUrlChange: (url: string) => void;
  onClear: () => void;
}

export const VideoFileSelector: React.FC<VideoFileSelectorProps> = ({
  label,
  maxMarks,
  hint,
  videoNumber,
  videoUrl,
  fileName,
  fileSize,
  marks,
  onMarksChange,
  isEvaluating,
  evaluationFeedback,
  onFileSelected,
  onUrlChange,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'pc' | 'url'>('pc');

  const colorStyles = {
    1: {
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
      accent: 'border-amber-500/50 hover:border-amber-400',
    },
    2: {
      text: 'text-cyan-300',
      border: 'border-cyan-500/40',
      badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
      accent: 'border-cyan-500/50 hover:border-cyan-400',
    },
    3: {
      text: 'text-purple-300',
      border: 'border-purple-500/40',
      badge: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
      accent: 'border-purple-500/50 hover:border-purple-400',
    },
    4: {
      text: 'text-emerald-300',
      border: 'border-emerald-500/40',
      badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
      accent: 'border-emerald-500/50 hover:border-emerald-400',
    },
  }[videoNumber];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name)) {
        onFileSelected(file);
      }
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const hasVideo = Boolean(videoUrl);

  return (
    <div className="bg-[#0B132B]/90 rounded-xl border border-slate-800/90 p-3.5 space-y-2.5 transition-all shadow-sm">
      {/* Header with Title, Rubric Max, and Mode Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Film className={`w-4 h-4 ${colorStyles.text}`} />
          <Label className={`text-xs font-bold ${colorStyles.text}`}>
            {label}
          </Label>
        </div>

        <div className="flex items-center gap-2">
          {marks !== undefined ? (
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border bg-emerald-950/80 text-emerald-300 border-emerald-700/80 flex items-center gap-1 shadow-sm">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Awarded: {marks} / {maxMarks} Marks
            </span>
          ) : (
            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${colorStyles.badge}`}>
              Max: {maxMarks} marks
            </span>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === 'pc' ? 'url' : 'pc')}
            className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800/50"
            title="Toggle between PC upload and URL link"
          >
            {mode === 'pc' ? (
              <>
                <LinkIcon className="w-3 h-3" /> URL Link
              </>
            ) : (
              <>
                <HardDrive className="w-3 h-3 text-cyan-400" /> Browse from PC
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-tight">
        {hint}
      </p>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/mov,video/webm,video/x-matroska,video/x-msvideo,.mp4,.mov,.webm,.avi,.mkv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Mode 1: Browse from PC (Default) */}
      {mode === 'pc' && (
        <div>
          {hasVideo ? (
            /* Selected File State */
            <div className="space-y-2.5">
              <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-3 flex flex-col sm:flex-row items-center gap-3">
                {/* Mini Video Preview */}
                <div className="w-full sm:w-36 h-20 bg-black rounded-md overflow-hidden border border-slate-800 flex-shrink-0 relative">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    playsInline
                  />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0 space-y-1 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                    <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{fileName || 'Video selected from PC'}</span>
                  </div>
                  {fileSize && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      Size: {formatBytes(fileSize)}
                    </div>
                  )}
                  <div className="text-[10px] text-emerald-400 font-medium">
                    ✓ Video uploaded successfully
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-[11px] h-7 px-2"
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onClear}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-[11px] h-7 px-2"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                </div>
              </div>

              {/* DIRECT MARKS DISPLAY RIGHT HERE FOR THIS VIDEO */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Award className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-white">Awarded Marks:</span>

                  {isEvaluating ? (
                    <span className="text-xs text-cyan-300 font-mono animate-pulse flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      Analyzing video & calculating marks...
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max={maxMarks}
                        value={marks !== undefined ? marks : ''}
                        onChange={(e) => onMarksChange && onMarksChange(parseFloat(e.target.value) || 0)}
                        className="w-20 h-7 bg-slate-950 border-cyan-500 text-cyan-300 font-mono font-black text-sm text-center focus:border-cyan-400"
                      />
                      <span className="text-xs font-mono font-bold text-slate-300">/ {maxMarks} Marks</span>
                    </div>
                  )}
                </div>

                {!isEvaluating && onMarksChange && (
                  <div className="flex items-center gap-1 flex-wrap self-start sm:self-auto">
                    <span className="text-[10px] text-slate-500 uppercase">Presets:</span>
                    <button
                      type="button"
                      onClick={() => onMarksChange(maxMarks)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-900 text-cyan-300 transition-colors"
                    >
                      Max ({maxMarks})
                    </button>
                    <button
                      type="button"
                      onClick={() => onMarksChange(Math.round(maxMarks * 0.9 * 2) / 2)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-900 text-cyan-300 transition-colors"
                    >
                      90% ({Math.round(maxMarks * 0.9 * 2) / 2})
                    </button>
                    <button
                      type="button"
                      onClick={() => onMarksChange(Math.round(maxMarks * 0.8 * 2) / 2)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-900 text-cyan-300 transition-colors"
                    >
                      80% ({Math.round(maxMarks * 0.8 * 2) / 2})
                    </button>
                  </div>
                )}
              </div>

              {evaluationFeedback && !isEvaluating && (
                <div className="text-[11px] text-cyan-200 bg-cyan-950/40 p-2 rounded-lg border border-cyan-900/60 leading-relaxed">
                  <strong className="text-cyan-400">AI Evaluation:</strong> {evaluationFeedback}
                </div>
              )}
            </div>
          ) : (
            /* Dropzone / Browse Button */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-all bg-slate-950/50 hover:bg-slate-900/60 ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-sm">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center justify-center gap-1.5">
                    <span>Click to browse from PC</span>
                    <span className="text-slate-400 font-normal">or drag & drop</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Supports MP4, MOV, WebM, AVI (up to 500 MB)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Enter URL (Fallback) */}
      {mode === 'url' && (
        <div className="space-y-2">
          <Input
            placeholder="Paste public video URL (MP4, MOV, YouTube, Google Drive)..."
            value={videoUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            className="bg-slate-950 border-slate-700 text-white placeholder-slate-600 text-xs h-9 focus:border-cyan-500"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Direct link to video or YouTube embed</span>
            {hasVideo && (
              <button
                type="button"
                onClick={onClear}
                className="text-rose-400 hover:underline"
              >
                Clear URL
              </button>
            )}
          </div>

          {/* If URL entered, show marks display as well */}
          {hasVideo && (
            <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-800/80 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Awarded Marks:</span>
                {isEvaluating ? (
                  <span className="text-xs text-cyan-300 font-mono animate-pulse">Calculating marks...</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max={maxMarks}
                      value={marks !== undefined ? marks : ''}
                      onChange={(e) => onMarksChange && onMarksChange(parseFloat(e.target.value) || 0)}
                      className="w-20 h-7 bg-slate-950 border-cyan-500 text-cyan-300 font-mono font-black text-sm text-center"
                    />
                    <span className="text-xs font-mono font-bold text-slate-300">/ {maxMarks} Marks</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
