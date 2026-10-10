import React, { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { VideoAiService } from '@/services/videoAiService';
import { useToast } from '@/hooks/use-toast';
import { Key, ShieldCheck, Sparkles, ExternalLink, CheckCircle2 } from 'lucide-react';

interface ApiKeySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ApiKeySettingsDialog: React.FC<ApiKeySettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');

  useEffect(() => {
    if (open) {
      const current = VideoAiService.getApiKey();
      setApiKey(current);
      setSavedKey(current);
    }
  }, [open]);

  const handleSave = () => {
    VideoAiService.setApiKey(apiKey);
    setSavedKey(apiKey.trim());
    toast({
      title: apiKey.trim() ? 'Gemini API Key Configured' : 'API Key Removed',
      description: apiKey.trim()
        ? 'Real Google Gemini Multimodal API will be utilized for video analysis.'
        : 'Reverted to local video evaluation engine.',
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    VideoAiService.setApiKey('');
    setApiKey('');
    setSavedKey('');
    toast({
      title: 'API Key Cleared',
      description: 'API key has been securely removed from your browser storage.',
    });
  };

  const hasKey = Boolean(savedKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0B132B] text-white border-cyan-800/80">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Key className="w-5 h-5 text-cyan-400" />
            AI Service & Gemini API Key
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Connect your Google Gemini API key to enable multimodal video transcription, claim analysis, and rubric evaluation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-300">Status:</span>
            {hasKey ? (
              <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Live Gemini Multimodal Active
              </Badge>
            ) : (
              <Badge className="bg-amber-950 text-amber-300 border-amber-700 flex items-center gap-1 text-[11px]">
                Built-in Evaluation Engine
              </Badge>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-300">Google Gemini API Key</Label>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1 bg-slate-950 border-slate-700 text-white placeholder-slate-600 text-xs font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Keys are strictly kept in your browser's private local storage and sent directly to Google Gemini API endpoints without intermediate servers.
            </p>
          </div>

          <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-200">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Multimodal Evaluation
            </div>
            Uses <span className="font-mono text-cyan-100">gemini-1.5-flash</span> to evaluate problem understanding, slide decks, prototypes, and final demonstrations against the rubric.
          </div>
        </div>

        <DialogFooter className="gap-2">
          {hasKey && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="border-rose-900 text-rose-400 hover:bg-rose-950 text-xs mr-auto"
            >
              Clear Key
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
