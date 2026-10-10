import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Scale,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck,
  Lock,
  Eye,
  Sparkles,
} from 'lucide-react';
import { AuditLogItem } from '@/types/aiJudge';

interface FairnessSafeguardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogItem[];
}

export const FairnessSafeguardsModal: React.FC<FairnessSafeguardsModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0B132B] text-white border-cyan-800/80 p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-700/50 text-cyan-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Fairness, Anti-Cheating & AI Governance Framework
              </DialogTitle>
              <p className="text-xs text-slate-300">
                Official COMMUNITY.VA AI Innovation Hackathon 2026 Evaluation Safeguards (Section 10)
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4 text-xs">
          {/* Safeguard Principles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#1C2541]/70 border border-cyan-900/60 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-cyan-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Uniform Scoring Rubric</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Every single team is strictly assessed against identical mathematical rubrics with maximum caps: Problem (15), Pitch (20), Prototype (25), and Output (40).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#1C2541]/70 border border-cyan-900/60 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>50% Milestone Safe-Harbor Policy</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Teams are never penalized for unfinished components at Stage 3. The 50% milestone specifically rewards work-in-progress codebase velocity and honest identification of remaining sprints.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#1C2541]/70 border border-cyan-900/60 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Human-in-the-Loop Disqualification Guarantee</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                AI cannot automatically disqualify any team or accuse participants of plagiarism. Unsupported claims or suspicious overlaps are flagged solely for human review.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#1C2541]/70 border border-cyan-900/60 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-indigo-300">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Immutable Review Audit Trail</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                All judge overrides require mandatory documented justification of at least 5 characters. Every score adjustment is timestamped and permanently logged in the audit ledger.
              </p>
            </div>
          </div>

          {/* Audit Trail Log Stream */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" /> Recent Judging & Audit Trail Ledger
              </h4>
              <Badge variant="outline" className="text-[10px] text-slate-400 border-cyan-900">
                {auditLogs.length} Events Logged
              </Badge>
            </div>

            <div className="bg-[#1C2541]/40 border border-cyan-950 rounded-xl max-h-56 overflow-y-auto divide-y divide-cyan-950/70 p-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 hover:bg-[#1C2541]/80 transition-colors">
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-semibold text-cyan-300">{log.actor}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{log.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={onClose}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-8 text-xs px-5"
            >
              Acknowledge & Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
