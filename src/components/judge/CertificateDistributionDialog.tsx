import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import {
  HackathonTeamRecord,
  hackathonJudgeDb,
} from '@/services/hackathonJudgeDb';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Award,
  Trophy,
  Send,
  Phone,
  MessageCircle,
  CheckCircle2,
  Printer,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  Wifi,
  Users,
  Eye,
  Check,
  Download,
  Copy,
  Share2,
  ExternalLink,
} from 'lucide-react';

interface CertificateDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: HackathonTeamRecord[];
  initialTeamId?: string | null;
}

const DEFAULT_DISTRIBUTE_NUMBERS = [
  { id: 'num1', label: 'Distribution Contact 1', phone: '+91 8074401912', rawPhone: '918074401912' },
  { id: 'num2', label: 'Distribution Contact 2', phone: '+91 8688122992', rawPhone: '918688122992' },
];

export const CertificateDistributionDialog: React.FC<CertificateDistributionDialogProps> = ({
  open,
  onOpenChange,
  teams,
  initialTeamId,
}) => {
  const { toast } = useToast();
  const certRef = useRef<HTMLDivElement>(null);

  // Active evaluated teams
  const evaluatedTeams = teams.filter((t) => t.finalApprovedTotal > 0 || t.evaluationStatus === 'Completed');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    initialTeamId || evaluatedTeams[0]?.id || teams[0]?.id || ''
  );

  // Template Theme: 'dark_winner' (Right template in user image) or 'light_clean' (Left template in user image)
  const [templateTheme, setTemplateTheme] = useState<'dark_winner' | 'light_clean'>('dark_winner');
  
  // Recipient target: Entire Team or specific member
  const [recipientMode, setRecipientMode] = useState<'team' | 'member'>('team');
  const [selectedMemberName, setSelectedMemberName] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [dispatchedMap, setDispatchedMap] = useState<Record<string, { num1?: boolean; num2?: boolean; timestamp?: string }>>(() => {
    try {
      const stored = localStorage.getItem('cva_certificate_dispatches');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || evaluatedTeams[0] || teams[0];

  useEffect(() => {
    if (initialTeamId) {
      setSelectedTeamId(initialTeamId);
    } else if (evaluatedTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(evaluatedTeams[0].id);
    }
  }, [initialTeamId, evaluatedTeams]);

  // When selected team changes, auto-switch to dark_winner for podium top 3, or light_clean for participants/finalists
  useEffect(() => {
    if (selectedTeam) {
      if (selectedTeam.rank && selectedTeam.rank <= 3) {
        setTemplateTheme('dark_winner');
      } else {
        setTemplateTheme('light_clean');
      }
      if (selectedTeam.members && selectedTeam.members.length > 0) {
        setSelectedMemberName(selectedTeam.members[0]);
      }
    }
  }, [selectedTeam?.id, selectedTeam?.rank]);

  // Generate QR code for the selected team
  useEffect(() => {
    if (selectedTeam) {
      const verifyUrl = `${window.location.origin}/ai-judge?team=${selectedTeam.id}&verify=official`;
      QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: templateTheme === 'dark_winner' ? '#FBBF24' : '#0B132B',
          light: templateTheme === 'dark_winner' ? '#070B18' : '#FFFFFF',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => setQrCodeDataUrl(''));
    }
  }, [selectedTeam?.id, templateTheme]);

  // Determine certificate titles based on result
  const getCertificateTier = (team?: HackathonTeamRecord) => {
    if (!team) {
      return {
        title: 'CERTIFICATE OF PARTICIPATION',
        honor: 'PARTICIPANT',
        roleLabel: 'PARTICIPANT',
        recognitionText: 'We appreciate your enthusiasm and commitment towards building AI solutions.',
        participationVerb: 'has participated in the',
      };
    }
    if (team.rank === 1) {
      return {
        title: 'CERTIFICATE OF WINNER',
        honor: 'WINNER — FIRST PLACE (GRAND CHAMPION)',
        roleLabel: 'WINNER',
        recognitionText: 'We recognize your outstanding innovation, technical excellence and impactful solution towards solving real-world problems using AI.',
        participationVerb: 'has emerged as the WINNER of the',
      };
    } else if (team.rank === 2) {
      return {
        title: 'CERTIFICATE OF RUNNER-UP',
        honor: 'RUNNER-UP — SECOND PLACE',
        roleLabel: 'RUNNER-UP',
        recognitionText: 'We recognize your exceptional technical innovation, creativity and impactful execution towards solving real-world problems using AI.',
        participationVerb: 'has emerged as the RUNNER-UP of the',
      };
    } else if (team.rank === 3) {
      return {
        title: 'CERTIFICATE OF SECOND RUNNER-UP',
        honor: 'SECOND RUNNER-UP — THIRD PLACE',
        roleLabel: 'SECOND RUNNER-UP',
        recognitionText: 'We recognize your impressive prototype execution, innovation and dedication towards building AI solutions for real-world impact.',
        participationVerb: 'has emerged as the SECOND RUNNER-UP of the',
      };
    } else {
      return {
        title: 'CERTIFICATE OF PARTICIPATION',
        honor: `FINALIST PARTICIPANT (RANK #${team.rank || 'N/A'})`,
        roleLabel: 'PARTICIPANT',
        recognitionText: 'We appreciate your enthusiasm, creativity and commitment towards building AI-powered solutions for real-world problems.',
        participationVerb: 'has successfully participated in the',
      };
    }
  };

  const tier = getCertificateTier(selectedTeam);
  const certId = selectedTeam ? `CVA-AI-2026-${selectedTeam.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}` : '';
  const recipientDisplayName = recipientMode === 'member' && selectedMemberName ? selectedMemberName : (selectedTeam?.teamName || '');

  const directCertificateUrl = selectedTeam
    ? `${window.location.origin}/ai-judge?view=certificate&teamId=${selectedTeam.id}&theme=${templateTheme}&recipient=${encodeURIComponent(recipientDisplayName)}`
    : '';

  const captureCertificateCanvas = async () => {
    if (!certRef.current) return null;
    return await html2canvas(certRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: templateTheme === 'dark_winner' ? '#060A17' : '#FFFFFF',
      logging: false,
    });
  };

  const handleDownloadImage = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = await captureCertificateCanvas();
      if (!canvas) throw new Error('Could not render certificate');
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `CommunityVA_Certificate_${selectedTeam.teamName.replace(/\s+/g, '_')}_${templateTheme}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'HD Certificate Image Downloaded! 🎓',
        description: `Saved high-resolution PNG certificate for ${recipientDisplayName}.`,
      });
    } catch {
      toast({
        title: 'Image Download Failed',
        description: 'Unable to render image. You can use the Print / PDF option.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyImageToClipboard = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = await captureCertificateCanvas();
      if (!canvas) throw new Error('Could not render certificate');
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          toast({
            title: 'Certificate Image Copied! 📋',
            description: 'Now switch to WhatsApp and press Ctrl+V to paste and send the actual certificate image!',
          });
        } catch {
          handleDownloadImage();
        }
      }, 'image/png');
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const formatWhatsAppMessage = (team: HackathonTeamRecord) => {
    const t = getCertificateTier(team);
    const text =
      `🎓 *COMMUNITY.VA AI INNOVATION HACKATHON 2026 — OFFICIAL CERTIFICATE* 🎓\n\n` +
      `We proudly present this *${t.title}* to:\n` +
      `👤 *Recipient:* ${recipientDisplayName}\n` +
      `👥 *Team:* ${team.teamName}\n` +
      `🏅 *Result:* ${t.honor}\n` +
      `💡 *Project:* ${team.projectName}\n` +
      `👥 *Members:* ${team.members.join(', ')}\n\n` +
      `📊 *Official 4-Video Rubric Score:*\n` +
      `• Video 1 (Problem Understanding): ${team.judgeOverrides.video1 ?? team.scores.video1}/15\n` +
      `• Video 2 (Pitch Deck): ${team.judgeOverrides.video2 ?? team.scores.video2}/20\n` +
      `• Video 3 (Prototype Demonstration): ${team.judgeOverrides.video3 ?? team.scores.video3}/25\n` +
      `• Video 4 (Final Demonstration): ${team.judgeOverrides.video4 ?? team.scores.video4}/40\n` +
      `⭐ *TOTAL SCORE: ${team.finalApprovedTotal} / 100 (${team.finalApprovedTotal}%)*\n\n` +
      `📜 *Certificate Serial:* ${certId}\n` +
      `⚖️ *Judge & Ratifier:* Paidimarri Abhiram (Founder & CEO, Community.VA)\n` +
      `🏛️ *Issued By:* Community.VA Hackathon Organizing Committee\n\n` +
      `👉 *CLICK BELOW TO VIEW & DOWNLOAD YOUR OFFICIAL HD CERTIFICATE:*\n` +
      `${directCertificateUrl}\n\n` +
      `Congratulations on your exceptional accomplishment! 🚀`;

    return encodeURIComponent(text);
  };

  const handleSendWhatsApp = (contact: typeof DEFAULT_DISTRIBUTE_NUMBERS[0]) => {
    // Also try copying the image to clipboard so user can just Ctrl+V in WhatsApp Web
    handleCopyImageToClipboard();

    const encoded = formatWhatsAppMessage(selectedTeam);
    const url = `https://wa.me/${contact.rawPhone}?text=${encoded}`;
    window.open(url, '_blank');

    const updated = {
      ...dispatchedMap,
      [selectedTeam.id]: {
        ...dispatchedMap[selectedTeam.id],
        [contact.id]: true,
        timestamp: new Date().toISOString(),
      },
    };
    setDispatchedMap(updated);
    try {
      localStorage.setItem('cva_certificate_dispatches', JSON.stringify(updated));
    } catch {}

    toast({
      title: `Certificate Dispatched to ${contact.phone} 🚀`,
      description: `Opened WhatsApp! Certificate image is also copied to clipboard (press Ctrl+V to paste).`,
    });
  };

  const handleDistributeBothNumbers = () => {
    const encoded = formatWhatsAppMessage(selectedTeam);
    window.open(`https://wa.me/${DEFAULT_DISTRIBUTE_NUMBERS[0].rawPhone}?text=${encoded}`, '_blank');

    setTimeout(() => {
      window.open(`https://wa.me/${DEFAULT_DISTRIBUTE_NUMBERS[1].rawPhone}?text=${encoded}`, '_blank');
    }, 800);

    const updated = {
      ...dispatchedMap,
      [selectedTeam.id]: {
        num1: true,
        num2: true,
        timestamp: new Date().toISOString(),
      },
    };
    setDispatchedMap(updated);
    try {
      localStorage.setItem('cva_certificate_dispatches', JSON.stringify(updated));
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch {}

    toast({
      title: `Certificates Dispatched to Both Numbers 🎉`,
      description: `Sent to 1. +91 8074401912 and 2. +91 8688122992 according to ${selectedTeam.teamName}'s result (${tier.honor}).`,
    });
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const isSentNum1 = Boolean(selectedTeam && dispatchedMap[selectedTeam.id]?.num1);
  const isSentNum2 = Boolean(selectedTeam && dispatchedMap[selectedTeam.id]?.num2);

  if (!selectedTeam) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-[#070B19] border border-cyan-800 text-slate-100 p-0 overflow-hidden shadow-2xl rounded-2xl max-h-[95vh] flex flex-col">
        {/* Top Control Header */}
        <div className="bg-gradient-to-r from-[#0B132B] via-[#101D42] to-[#0D1B2A] p-4 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-cyan-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-400/50 flex items-center justify-center shadow-md">
              <Award className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-black/50 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                  OFFICIAL HACKATHON CREDENTIALS
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40">
                  Judge: Paidimarri Abhiram (Founder & CEO)
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Certificate Distribution Hub
              </h2>
            </div>
          </div>

          {/* Quick Selectors */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            {/* Team Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-semibold">Team:</span>
              <select
                value={selectedTeam.id}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="bg-slate-950 border border-cyan-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-cyan-400 max-w-[160px] truncate"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.rank ? `#${t.rank}` : '•'} {t.teamName} ({t.finalApprovedTotal}/100)
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Mode: Team or Specific Member */}
            <div className="flex items-center gap-1.5">
              <select
                value={recipientMode}
                onChange={(e) => setRecipientMode(e.target.value as 'team' | 'member')}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5"
              >
                <option value="team">Team Name</option>
                <option value="member">Individual Member</option>
              </select>

              {recipientMode === 'member' && selectedTeam.members.length > 0 && (
                <select
                  value={selectedMemberName}
                  onChange={(e) => setSelectedMemberName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 max-w-[130px] truncate"
                >
                  {selectedTeam.members.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Distribution Numbers & Action Bar */}
          <div className="bg-[#0B132B] border border-cyan-900/80 rounded-xl p-3.5 shadow-lg space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> Certificate Distribution Numbers
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pre-configured numbers to dispatch certificates according to results:
                </p>
              </div>

              <Button
                size="sm"
                onClick={handleDistributeBothNumbers}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs h-7.5 px-3.5 shadow-md shadow-emerald-600/20"
              >
                <Send className="w-3 h-3 mr-1.5" /> Distribute to Both Numbers (+91 8074401912 & +91 8688122992)
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_DISTRIBUTE_NUMBERS.map((contact, idx) => {
                const isSent = idx === 0 ? isSentNum1 : isSentNum2;
                return (
                  <div
                    key={contact.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">
                          {idx === 0 ? 'Number 1' : 'Number 2'}
                        </div>
                        <div className="text-xs font-mono font-bold text-white truncate">
                          {contact.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSent && (
                        <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Sent
                        </span>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleSendWhatsApp(contact)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] h-6 px-2.5"
                      >
                        <Send className="w-2.5 h-2.5 mr-1" /> Send
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Template Switcher Tabs */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Template Design:
              </span>
              <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTemplateTheme('dark_winner')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    templateTheme === 'dark_winner'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Dark Luxury Gold Winner Template
                  {selectedTeam.rank && selectedTeam.rank <= 3 && (
                    <Badge className="bg-slate-950 text-amber-300 text-[9px] ml-1 py-0 px-1">
                      Recommended
                    </Badge>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateTheme('light_clean')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    templateTheme === 'light_clean'
                      ? 'bg-cyan-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Light Clean Innovation Template
                  {(!selectedTeam.rank || selectedTeam.rank > 3) && (
                    <Badge className="bg-slate-950 text-cyan-300 text-[9px] ml-1 py-0 px-1">
                      Recommended
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Cert Serial: <span className="text-cyan-400 font-semibold">{certId}</span>
            </div>
          </div>

          {/* =========================================================================
              CERTIFICATE PREVIEW CANVAS (High-fidelity rendition of both templates)
              ========================================================================= */}
          <div className="printable-certificate relative shadow-2xl rounded-2xl overflow-hidden transition-all">
            {/* ===================================================================
                TEMPLATE 1: DARK LUXURY GOLD WINNER TEMPLATE (Right image in photo)
               =================================================================== */}
            {templateTheme === 'dark_winner' && (
              <div
                ref={certRef}
                className="relative bg-[#060A17] text-white border-4 border-[#D4AF37] rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 15% 30%, rgba(14, 165, 233, 0.18) 0%, transparent 40%),
                    radial-gradient(circle at 85% 30%, rgba(37, 99, 235, 0.18) 0%, transparent 45%),
                    radial-gradient(ellipse at 50% 80%, rgba(212, 175, 55, 0.12) 0%, transparent 55%),
                    linear-gradient(180deg, #070C1D 0%, #050814 100%)
                  `,
                }}
              >
                {/* Decorative Metallic Gold Border Inset */}
                <div className="absolute inset-2 border border-[#D4AF37]/50 rounded-xl pointer-events-none" />
                <div className="absolute inset-3 border border-[#D4AF37]/20 rounded-lg pointer-events-none" />

                {/* Corner Metallic Accents */}
                <div className="absolute top-2 left-2 w-7 h-7 border-t-2 border-l-2 border-yellow-400" />
                <div className="absolute top-2 right-2 w-7 h-7 border-t-2 border-r-2 border-yellow-400" />
                <div className="absolute bottom-2 left-2 w-7 h-7 border-b-2 border-l-2 border-yellow-400" />
                <div className="absolute bottom-2 right-2 w-7 h-7 border-b-2 border-r-2 border-yellow-400" />

                {/* Left Hologram AI Face Silhouette Glow & Right High-Tech Digital Globe Graphic (SVG) */}
                <div className="absolute top-12 left-3 w-40 h-56 opacity-20 pointer-events-none hidden sm:block">
                  <svg viewBox="0 0 100 120" className="w-full h-full text-cyan-400" fill="none" stroke="currentColor">
                    <path d="M40 20 C60 20 70 35 70 50 C70 65 65 75 55 90 C50 98 45 105 40 110" strokeWidth="1.5" strokeDasharray="2 2" />
                    <circle cx="55" cy="45" r="3" fill="cyan" />
                    <circle cx="62" cy="60" r="2.5" fill="cyan" />
                    <path d="M55 45 L62 60 L48 70 L40 85" strokeWidth="1" />
                    <circle cx="48" cy="70" r="2" fill="cyan" />
                  </svg>
                </div>
                <div className="absolute top-12 right-3 w-40 h-56 opacity-20 pointer-events-none hidden sm:block">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400" fill="none" stroke="currentColor">
                    <circle cx="50" cy="50" r="40" strokeWidth="1" strokeDasharray="3 3" />
                    <ellipse cx="50" cy="50" rx="40" ry="18" strokeWidth="1" />
                    <ellipse cx="50" cy="50" rx="18" ry="40" strokeWidth="1" />
                  </svg>
                </div>

                {/* Certificate Top Header: Logo on Left, Vertical Motto on Right */}
                <div className="relative z-10 flex items-start justify-between border-b border-[#D4AF37]/30 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-yellow-400/60 p-1 flex items-center justify-center shadow-lg">
                      <img
                        src="/community-va-logo.png"
                        alt="COMMUNITY.VA Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                        <span>COMMUNITY</span>
                        <span className="text-rose-500">.</span>
                        <span className="text-cyan-400">VA</span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-300 font-mono tracking-wider uppercase font-semibold">
                        BUILDING FUTURE INNOVATORS THROUGH PRACTICAL LEARNING
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[9px] sm:text-[10px] text-slate-300 uppercase tracking-widest leading-tight">
                    <span className="block text-cyan-300 font-bold">INNOVATE</span>
                    <span className="block">COLLABORATE</span>
                    <span className="block">BUILD</span>
                    <span className="block">CREATE</span>
                    <span className="block text-yellow-400 font-bold border-b border-yellow-400/60 pb-0.5">
                      IMPACT
                    </span>
                  </div>
                </div>

                {/* Main Hackathon Title & Laurel Banner */}
                <div className="relative z-10 text-center space-y-2 mb-4">
                  <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-200 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                    AI INNOVATION HACKATHON 2026
                  </h1>

                  <div className="inline-block px-4 py-1 rounded-full border border-cyan-400/80 bg-cyan-950/40 text-cyan-200 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase">
                    BUILD AI-POWERED SOLUTIONS FOR REAL-WORLD PROBLEMS
                  </div>

                  {/* Laurel Wreath with Certificate Title */}
                  <div className="flex items-center justify-center gap-3 pt-3">
                    <span className="text-2xl text-yellow-400 transform -scale-x-100">🌿</span>
                    <h2 className="text-xl sm:text-3xl font-cert-serif font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500">
                      {tier.title}
                    </h2>
                    <span className="text-2xl text-yellow-400">🌿</span>
                  </div>
                </div>

                {/* Recipient Details & Cursive Signature Calligraphy */}
                <div className="relative z-10 text-center space-y-2.5 my-4 max-w-2xl mx-auto">
                  <p className="text-xs text-slate-400 italic">This is to certify that</p>

                  <div className="py-1">
                    <h3 className="font-cert-script text-3xl sm:text-5xl text-yellow-300 drop-shadow-[0_2px_10px_rgba(253,224,71,0.5)]">
                      {recipientDisplayName}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {tier.participationVerb}{' '}
                    <strong className="text-yellow-300 font-bold">
                      COMMUNITY.VA AI INNOVATION HACKATHON 2026
                    </strong>
                    , a 24-hour online hackathon, held on{' '}
                    <span className="text-white font-semibold">9 October 2026</span>.
                  </p>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl mx-auto">
                    {tier.recognitionText}
                  </p>
                </div>

                {/* 4 Feature Spec Badges (Date, Duration, Mode, Team Size) */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto my-4">
                  <div className="bg-[#0B132B]/80 border border-yellow-500/40 rounded-xl p-2 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-xs mb-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-bold font-mono">9 OCT 2026</span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono">DATE</span>
                  </div>

                  <div className="bg-[#0B132B]/80 border border-yellow-500/40 rounded-xl p-2 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-xs mb-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-bold font-mono">24 HOURS</span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono">DURATION</span>
                  </div>

                  <div className="bg-[#0B132B]/80 border border-yellow-500/40 rounded-xl p-2 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-xs mb-0.5">
                      <Wifi className="w-3.5 h-3.5" />
                      <span className="font-bold font-mono">ONLINE</span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono">MODE</span>
                  </div>

                  <div className="bg-[#0B132B]/80 border border-yellow-500/40 rounded-xl p-2 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-xs mb-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-bold font-mono">2 - 4 MEMBERS</span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono">TEAM SIZE</span>
                  </div>
                </div>

                {/* Scorecard Strip with Official 4-Video Rubric breakdown */}
                <div className="relative z-10 max-w-xl mx-auto bg-slate-950/90 border border-yellow-500/30 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-mono my-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Evaluated Rubric:</span>
                    <span className="text-slate-300 text-[11px]">
                      V1: {selectedTeam.judgeOverrides.video1 ?? selectedTeam.scores.video1}/15 •
                      V2: {selectedTeam.judgeOverrides.video2 ?? selectedTeam.scores.video2}/20 •
                      V3: {selectedTeam.judgeOverrides.video3 ?? selectedTeam.scores.video3}/25 •
                      V4: {selectedTeam.judgeOverrides.video4 ?? selectedTeam.scores.video4}/40
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-black text-sm">
                      {selectedTeam.finalApprovedTotal} / 100
                    </span>
                  </div>
                </div>

                {/* Signatures & Center Trophy / QR Code */}
                <div className="relative z-10 grid grid-cols-3 gap-4 items-end pt-5 border-t border-[#D4AF37]/30 max-w-2xl mx-auto">
                  {/* Left Signature: Paidimarri Abhiram (Founder & CEO) */}
                  <div className="text-center">
                    <div className="font-cert-signature text-2xl sm:text-3xl text-yellow-300 pb-0.5">
                      Paidimarri Abhiram
                    </div>
                    <div className="w-36 mx-auto border-b border-yellow-400/60 pb-1" />
                    <div className="text-xs font-bold text-white uppercase mt-1">
                      Paidimarri Abhiram
                    </div>
                    <div className="text-[10px] text-yellow-400 font-mono uppercase font-semibold">
                      Founder & CEO
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Community.VA
                    </div>
                  </div>

                  {/* Center: 3D Gold Trophy & Laurel Wreath + QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    {qrCodeDataUrl ? (
                      <div className="relative">
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code"
                          className="w-14 h-14 rounded border border-yellow-400/60 bg-black p-0.5 shadow-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-yellow-400 flex items-center justify-center text-yellow-400">
                        <Trophy className="w-6 h-6" />
                      </div>
                    )}
                    <span className="text-[8px] font-mono text-yellow-300/80 uppercase mt-1">
                      Official Seal • Scan to Verify
                    </span>
                  </div>

                  {/* Right Signature: Organizing Team */}
                  <div className="text-center">
                    <div className="font-cert-signature text-2xl sm:text-3xl text-cyan-300 pb-0.5">
                      Organizing Team
                    </div>
                    <div className="w-36 mx-auto border-b border-cyan-400/60 pb-1" />
                    <div className="text-xs font-bold text-white uppercase mt-1">
                      Organizing Team
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono uppercase font-semibold">
                      COMMUNITY.VA
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Hackathon Committee
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                TEMPLATE 2: LIGHT CLEAN MODERN INNOVATION TEMPLATE (Left in photo)
               =================================================================== */}
            {templateTheme === 'light_clean' && (
              <div
                ref={certRef}
                className="relative bg-white text-slate-900 border-4 border-blue-900 rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 10% 15%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
                    radial-gradient(circle at 90% 15%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
                    linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)
                  `,
                }}
              >
                {/* Tech Circuit Pattern Framing */}
                <div className="absolute inset-2 border border-blue-800/40 rounded-xl pointer-events-none" />
                <div className="absolute inset-3 border border-cyan-600/20 rounded-lg pointer-events-none" />

                {/* Angular Navy & Cyan Geometric Corners */}
                <div className="absolute top-2 left-2 w-7 h-7 border-t-4 border-l-4 border-blue-900" />
                <div className="absolute top-2 right-2 w-7 h-7 border-t-4 border-r-4 border-blue-900" />
                <div className="absolute bottom-2 left-2 w-7 h-7 border-b-4 border-l-4 border-blue-900" />
                <div className="absolute bottom-2 right-2 w-7 h-7 border-b-4 border-r-4 border-blue-900" />

                {/* Header: Logo & Subtitle on Left, Stacked Motto on Right */}
                <div className="relative z-10 flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-sm">
                      <img
                        src="/community-va-logo.png"
                        alt="COMMUNITY.VA Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                        <span>COMMUNITY</span>
                        <span className="text-rose-500">.</span>
                        <span className="text-blue-600">VA</span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-600 font-mono tracking-wider uppercase font-semibold">
                        BUILDING FUTURE INNOVATORS THROUGH PRACTICAL LEARNING
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[9px] sm:text-[10px] text-slate-600 uppercase tracking-widest leading-tight">
                    <span className="block text-blue-600 font-bold">INNOVATE</span>
                    <span className="block">COLLABORATE</span>
                    <span className="block">BUILD</span>
                    <span className="block">CREATE</span>
                    <span className="block text-cyan-600 font-bold border-b-2 border-cyan-600 pb-0.5">
                      IMPACT
                    </span>
                  </div>
                </div>

                {/* Main Hackathon Title & Pill Banner */}
                <div className="relative z-10 text-center space-y-2 mb-4">
                  <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-wider text-blue-900 drop-shadow-sm">
                    AI INNOVATION HACKATHON 2026
                  </h1>

                  <div className="inline-block px-4 py-1 rounded-full border border-blue-600 bg-blue-50 text-blue-800 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase">
                    BUILD AI-POWERED SOLUTIONS FOR REAL-WORLD PROBLEMS
                  </div>

                  <h2 className="text-xl sm:text-3xl font-cert-serif font-black uppercase tracking-wider text-slate-900 pt-2">
                    {tier.title}
                  </h2>
                </div>

                {/* Recipient Name in Cursive Script */}
                <div className="relative z-10 text-center space-y-2.5 my-4 max-w-2xl mx-auto">
                  <p className="text-xs text-slate-500 italic">This is to certify that</p>

                  <div className="py-1">
                    <h3 className="font-cert-script text-3xl sm:text-5xl text-blue-950 font-normal">
                      {recipientDisplayName}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    {tier.participationVerb}{' '}
                    <strong className="text-blue-900 font-bold">
                      COMMUNITY.VA AI INNOVATION HACKATHON 2026
                    </strong>
                    , a 24-hour online hackathon, held on{' '}
                    <span className="text-slate-900 font-semibold">9 October 2026</span>.
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl mx-auto">
                    {tier.recognitionText}
                  </p>
                </div>

                {/* 4 Metadata Cards */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto my-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                    <div className="flex items-center justify-center gap-1.5 text-blue-700 text-xs mb-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-bold font-mono">9 OCT 2026</span>
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono">DATE</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                    <div className="flex items-center justify-center gap-1.5 text-blue-700 text-xs mb-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-bold font-mono">24 HOURS</span>
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono">DURATION</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                    <div className="flex items-center justify-center gap-1.5 text-blue-700 text-xs mb-0.5">
                      <Wifi className="w-3.5 h-3.5" />
                      <span className="font-bold font-mono">ONLINE</span>
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono">MODE</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                    <div className="flex items-center justify-center gap-1.5 text-blue-700 text-xs mb-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-bold font-mono">2 - 4 MEMBERS</span>
                    </div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono">TEAM SIZE</span>
                  </div>
                </div>

                {/* Scorecard Strip */}
                <div className="relative z-10 max-w-xl mx-auto bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-mono my-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Evaluated Rubric:</span>
                    <span className="text-slate-700 text-[11px]">
                      V1: {selectedTeam.judgeOverrides.video1 ?? selectedTeam.scores.video1}/15 •
                      V2: {selectedTeam.judgeOverrides.video2 ?? selectedTeam.scores.video2}/20 •
                      V3: {selectedTeam.judgeOverrides.video3 ?? selectedTeam.scores.video3}/25 •
                      V4: {selectedTeam.judgeOverrides.video4 ?? selectedTeam.scores.video4}/40
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-900 font-black text-sm">
                      {selectedTeam.finalApprovedTotal} / 100
                    </span>
                  </div>
                </div>

                {/* Signatures & Rosette Ribbon Emblem Seal */}
                <div className="relative z-10 grid grid-cols-3 gap-4 items-end pt-5 border-t border-slate-200 max-w-2xl mx-auto">
                  {/* Left Signature: Paidimarri Abhiram (Founder & CEO) */}
                  <div className="text-center">
                    <div className="font-cert-signature text-2xl sm:text-3xl text-blue-950 pb-0.5">
                      Paidimarri Abhiram
                    </div>
                    <div className="w-36 mx-auto border-b border-slate-400 pb-1" />
                    <div className="text-xs font-bold text-slate-900 uppercase mt-1">
                      Paidimarri Abhiram
                    </div>
                    <div className="text-[10px] text-blue-700 font-mono uppercase font-semibold">
                      Founder & CEO
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      Community.VA
                    </div>
                  </div>

                  {/* Center: Blue & Gold Official Rosette Ribbon Seal & QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    {qrCodeDataUrl ? (
                      <div className="relative">
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code"
                          className="w-14 h-14 rounded border border-blue-900 bg-white p-0.5 shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-blue-900 bg-blue-50 flex items-center justify-center text-blue-900">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                    )}
                    <span className="text-[8px] font-mono text-slate-500 uppercase mt-1">
                      Official Seal • Verified
                    </span>
                  </div>

                  {/* Right Signature: Organizing Team */}
                  <div className="text-center">
                    <div className="font-cert-signature text-2xl sm:text-3xl text-blue-950 pb-0.5">
                      Organizing Team
                    </div>
                    <div className="w-36 mx-auto border-b border-slate-400 pb-1" />
                    <div className="text-xs font-bold text-slate-900 uppercase mt-1">
                      Organizing Team
                    </div>
                    <div className="text-[10px] text-blue-700 font-mono uppercase font-semibold">
                      COMMUNITY.VA
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      Hackathon Committee
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-[#0B132B] border-t border-slate-800 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Certificates authenticated by <strong>Paidimarri Abhiram (Founder & CEO)</strong> for dispatch to{' '}
              <strong className="text-white">+91 8074401912</strong> & <strong className="text-white">+91 8688122992</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <Button
              size="sm"
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs h-8 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              {isGeneratingImage ? 'Rendering...' : 'Download HD Image (PNG)'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyImageToClipboard}
              disabled={isGeneratingImage}
              className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 text-xs h-8"
              title="Copy image so you can paste (Ctrl+V) directly into WhatsApp"
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy Image
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handlePrintCertificate}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-8"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / PDF
            </Button>

            <Button
              size="sm"
              onClick={handleDistributeBothNumbers}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-4 shadow-md shadow-emerald-600/30"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" /> Distribute to Both Numbers
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
