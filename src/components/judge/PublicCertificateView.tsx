import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { HackathonTeamRecord } from '@/services/hackathonJudgeDb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Award,
  Trophy,
  Download,
  Copy,
  Printer,
  Share2,
  ShieldCheck,
  Calendar,
  Clock,
  Wifi,
  Users,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface PublicCertificateViewProps {
  team: HackathonTeamRecord;
  initialTheme?: 'dark_winner' | 'light_clean';
  initialRecipient?: string;
  onBackToDashboard?: () => void;
}

export const PublicCertificateView: React.FC<PublicCertificateViewProps> = ({
  team,
  initialTheme,
  initialRecipient,
  onBackToDashboard,
}) => {
  const { toast } = useToast();
  const certRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'dark_winner' | 'light_clean'>(
    initialTheme || (team.rank && team.rank <= 3 ? 'dark_winner' : 'light_clean')
  );
  const [recipientName, setRecipientName] = useState<string>(
    initialRecipient || team.teamName
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const certId = `CVA-AI-2026-${team.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;

  // Generate QR code
  useEffect(() => {
    const verifyUrl = window.location.href;
    QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: theme === 'dark_winner' ? '#FBBF24' : '#0B132B',
        light: theme === 'dark_winner' ? '#070B18' : '#FFFFFF',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => setQrCodeDataUrl(''));
  }, [team.id, theme]);

  const getTier = () => {
    if (team.rank === 1) {
      return {
        title: 'CERTIFICATE OF WINNER',
        honor: 'WINNER — FIRST PLACE (GRAND CHAMPION)',
        verb: 'has emerged as the WINNER of the',
        text: 'We recognize your outstanding innovation, technical excellence and impactful solution towards solving real-world problems using AI.',
      };
    } else if (team.rank === 2) {
      return {
        title: 'CERTIFICATE OF RUNNER-UP',
        honor: 'RUNNER-UP — SECOND PLACE',
        verb: 'has emerged as the RUNNER-UP of the',
        text: 'We recognize your exceptional technical innovation, creativity and impactful execution towards solving real-world problems using AI.',
      };
    } else if (team.rank === 3) {
      return {
        title: 'CERTIFICATE OF SECOND RUNNER-UP',
        honor: 'SECOND RUNNER-UP — THIRD PLACE',
        verb: 'has emerged as the SECOND RUNNER-UP of the',
        text: 'We recognize your impressive prototype execution, innovation and dedication towards building AI solutions for real-world impact.',
      };
    } else {
      return {
        title: 'CERTIFICATE OF PARTICIPATION',
        honor: `FINALIST PARTICIPANT (RANK #${team.rank || 'N/A'})`,
        verb: 'has successfully participated in the',
        text: 'We appreciate your enthusiasm, creativity and commitment towards building AI-powered solutions for real-world problems.',
      };
    }
  };

  const tier = getTier();

  const captureCertificateCanvas = async () => {
    if (!certRef.current) return null;
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
    } catch {
      // ignore
    }
    return await html2canvas(certRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: theme === 'dark_winner' ? '#060A17' : '#FFFFFF',
      logging: false,
      onclone: (clonedDoc) => {
        // Safety pass: Strip any gradient text clip classes that cause html2canvas solid box artifacts
        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.classList?.contains('text-transparent')) {
            htmlEl.classList.remove('text-transparent');
          }
          if (htmlEl.classList?.contains('bg-clip-text')) {
            htmlEl.classList.remove('bg-clip-text');
            htmlEl.style.webkitBackgroundClip = 'unset';
            htmlEl.style.backgroundClip = 'unset';
            htmlEl.style.backgroundImage = 'none';
          }
        });
      },
    });
  };

  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await captureCertificateCanvas();
      if (!canvas) throw new Error('Could not render certificate');
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `CommunityVA_Certificate_${team.teamName.replace(/\s+/g, '_')}_${theme}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: 'Official Certificate Downloaded! 🎓',
        description: 'Saved high-definition PNG certificate to your device.',
      });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Unable to render image. You can use the Print button instead.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await captureCertificateCanvas();
      if (!canvas) throw new Error('Could not render certificate');
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          toast({
            title: 'Certificate Image Copied! 📋',
            description: 'Press Ctrl+V in WhatsApp, Telegram, or Discord to paste the certificate image directly.',
          });
        } catch {
          handleDownloadImage();
        }
      }, 'image/png');
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToWhatsApp = () => {
    const text =
      `🎓 *COMMUNITY.VA AI INNOVATION HACKATHON 2026 — OFFICIAL CERTIFICATE* 🎓\n\n` +
      `🏅 *Award:* ${tier.title} (${tier.honor})\n` +
      `👤 *Awarded To:* ${recipientName}\n` +
      `👥 *Team:* ${team.teamName}\n` +
      `💡 *Project:* ${team.projectName}\n` +
      `⭐ *Total Score:* ${team.finalApprovedTotal} / 100 (${team.finalApprovedTotal}%)\n` +
      `📜 *Certificate ID:* ${certId}\n` +
      `⚖️ *Judge & Ratifier:* Paidimarri Abhiram (Founder & CEO, Community.VA)\n\n` +
      `🔗 *View Official Verified Digital Certificate & HD Download:*\n` +
      `${window.location.href}\n\n` +
      `Congratulations on your achievement! 🚀`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Bar with Status and Action Buttons */}
      <div className="bg-[#0B132B] border border-cyan-900 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToDashboard}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-9"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Portal
            </Button>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-950 text-emerald-300 border-emerald-600 text-[10px] font-mono">
                <CheckCircle2 className="w-3 h-3 mr-1" /> VERIFIED OFFICIAL CREDENTIAL
              </Badge>
              <span className="text-xs text-amber-300 font-semibold font-mono">
                Serial: {certId}
              </span>
            </div>
            <h1 className="text-lg font-black text-white mt-0.5">
              {team.teamName} — Official Certificate
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Theme switcher */}
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              onClick={() => setTheme('dark_winner')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                theme === 'dark_winner'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Gold Winner
            </button>
            <button
              onClick={() => setTheme('light_clean')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                theme === 'light_clean'
                  ? 'bg-cyan-600 text-white font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Light Clean Modern
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-md shadow-emerald-900/30"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {isGenerating ? 'Rendering HD PNG...' : 'Download HD Image (PNG)'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyImage}
            disabled={isGenerating}
            className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 text-xs h-9"
            title="Copy image so you can paste (Ctrl+V) directly into WhatsApp"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Image
          </Button>

          <Button
            size="sm"
            onClick={handleShareToWhatsApp}
            className="bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold text-xs h-9 shadow-md"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share to WhatsApp
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-9"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* Recipient Selector (Allows toggling between Team Name and Member Names) */}
      {team.members && team.members.length > 0 && (
        <div className="bg-[#0B132B]/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-slate-400">Issue Certificate To:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setRecipientName(team.teamName)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  recipientName === team.teamName
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Team: {team.teamName}
              </button>
              {team.members.map((member) => (
                <button
                  key={member}
                  type="button"
                  onClick={() => setRecipientName(member)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    recipientName === member
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {member}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Ratified by <strong className="text-amber-300">Paidimarri Abhiram (Founder & CEO)</strong>
          </div>
        </div>
      )}

      {/* =========================================================================
          THE CERTIFICATE CANVAS (Pixel-perfect rendition of the user's templates)
          ========================================================================= */}
      <div className="printable-certificate shadow-2xl rounded-2xl overflow-hidden">
        {theme === 'dark_winner' ? (
          /* TEMPLATE 1: DARK LUXURY GOLD WINNER TEMPLATE */
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
            {/* Inner Gold Borders */}
            <div className="absolute inset-2 border border-[#D4AF37]/50 rounded-xl pointer-events-none" />
            <div className="absolute inset-3 border border-[#D4AF37]/20 rounded-lg pointer-events-none" />

            {/* Corner Gold Highlights */}
            <div className="absolute top-2 left-2 w-7 h-7 border-t-2 border-l-2 border-yellow-400" />
            <div className="absolute top-2 right-2 w-7 h-7 border-t-2 border-r-2 border-yellow-400" />
            <div className="absolute bottom-2 left-2 w-7 h-7 border-b-2 border-l-2 border-yellow-400" />
            <div className="absolute bottom-2 right-2 w-7 h-7 border-b-2 border-r-2 border-yellow-400" />

            {/* Header: Logo and Motto */}
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

            {/* Main Title & Laurel Wreath */}
            <div className="relative z-10 text-center space-y-2 mb-4">
              <h1
                className="text-2xl sm:text-4xl font-black uppercase tracking-wider text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.7)]"
                style={{ wordSpacing: '0.25em' }}
              >
                AI{'\u00A0'}INNOVATION{'\u00A0'}HACKATHON{'\u00A0'}2026
              </h1>

              <div
                className="inline-block px-4 py-1 rounded-full border border-cyan-400/80 bg-cyan-950/40 text-cyan-200 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase"
                style={{ wordSpacing: '0.2em' }}
              >
                BUILD{'\u00A0'}AI-POWERED{'\u00A0'}SOLUTIONS{'\u00A0'}FOR{'\u00A0'}REAL-WORLD{'\u00A0'}PROBLEMS
              </div>

              {/* Laurel Wreath */}
              <div className="flex items-center justify-center gap-3 pt-3">
                <span className="text-2xl text-yellow-400 transform -scale-x-100">🌿</span>
                <h2
                  className="text-xl sm:text-3xl font-cert-serif font-black uppercase tracking-wider text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.7)]"
                  style={{ wordSpacing: '0.25em' }}
                >
                  {tier.title.split(' ').join('\u00A0')}
                </h2>
                <span className="text-2xl text-yellow-400">🌿</span>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="relative z-10 text-center space-y-2.5 my-4 max-w-2xl mx-auto">
              <p className="text-xs text-slate-400 italic">This is to certify that</p>

              <div className="py-1">
                <h3 className="font-cert-script text-3xl sm:text-5xl text-yellow-300 drop-shadow-[0_2px_10px_rgba(253,224,71,0.5)]">
                  {recipientName}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans" style={{ wordSpacing: '0.15em' }}>
                {tier.verb}{'\u00A0'}
                <strong className="text-yellow-300 font-bold">
                  COMMUNITY.VA{'\u00A0\u00A0'}AI{'\u00A0'}INNOVATION{'\u00A0'}HACKATHON{'\u00A0'}2026
                </strong>
                ,{'\u00A0'}a{'\u00A0'}24-hour{'\u00A0'}online{'\u00A0'}hackathon,{'\u00A0'}held{'\u00A0'}on{'\u00A0'}
                <span className="text-white font-semibold">9{'\u00A0'}October{'\u00A0'}2026</span>.
              </p>

              <p className="text-xs text-slate-300 leading-relaxed max-w-xl mx-auto" style={{ wordSpacing: '0.15em' }}>
                {tier.text}
              </p>
            </div>

            {/* 4 Feature Badges */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto my-4">
              <div className="bg-[#0B132B]/80 border border-yellow-500/40 rounded-xl p-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-xs mb-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-bold font-mono">9{'\u00A0'}OCT{'\u00A0'}2026</span>
                </div>
                <span className="text-[9px] text-slate-400 uppercase font-mono">DATE</span>
              </div>

              <div className="bg-[#0B132B]/80 border border-yellow-500/40 rounded-xl p-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-xs mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-bold font-mono">24{'\u00A0'}HOURS</span>
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
                  <span className="font-bold font-mono">2{'\u00A0'}-{'\u00A0'}4{'\u00A0'}MEMBERS</span>
                </div>
                <span className="text-[9px] text-slate-400 uppercase font-mono" style={{ wordSpacing: '0.15em' }}>TEAM{'\u00A0'}SIZE</span>
              </div>
            </div>

            {/* Scorecard Strip */}
            <div className="relative z-10 max-w-xl mx-auto bg-slate-950/90 border border-yellow-500/30 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-mono my-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Evaluated Rubric:</span>
                <span className="text-slate-300 text-[11px]">
                  V1: {team.judgeOverrides.video1 ?? team.scores.video1}/15 •
                  V2: {team.judgeOverrides.video2 ?? team.scores.video2}/20 •
                  V3: {team.judgeOverrides.video3 ?? team.scores.video3}/25 •
                  V4: {team.judgeOverrides.video4 ?? team.scores.video4}/40
                </span>
              </div>
              <div className="text-right">
                <span className="text-amber-400 font-black text-sm">
                  {team.finalApprovedTotal} / 100
                </span>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="relative z-10 grid grid-cols-3 gap-4 items-end pt-5 border-t border-[#D4AF37]/30 max-w-2xl mx-auto">
              {/* Left: Paidimarri Abhiram (Founder & CEO) */}
              <div className="text-center">
                <div className="font-cert-signature text-2xl sm:text-3xl text-yellow-300 pb-0.5">
                  Paidimarri{'\u00A0'}Abhiram
                </div>
                <div className="w-36 mx-auto border-b border-yellow-400/60 pb-1" />
                <div className="text-xs font-bold text-white uppercase mt-1 tracking-wider" style={{ wordSpacing: '0.25em' }}>
                  Paidimarri{'\u00A0'}Abhiram
                </div>
                <div className="text-[10px] text-yellow-400 font-mono uppercase font-semibold" style={{ wordSpacing: '0.2em' }}>
                  Founder{'\u00A0'}&{'\u00A0'}CEO
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  Community.VA
                </div>
              </div>

              {/* Center: 3D Trophy + QR Verification */}
              <div className="flex flex-col items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-14 h-14 rounded border border-yellow-400/60 bg-black p-0.5 shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border border-yellow-400 flex items-center justify-center text-yellow-400">
                    <Trophy className="w-6 h-6" />
                  </div>
                )}
                <span className="text-[8px] font-mono text-yellow-300/80 uppercase mt-1" style={{ wordSpacing: '0.15em' }}>
                  Official{'\u00A0'}Seal{'\u00A0'}•{'\u00A0'}Verified
                </span>
              </div>

              {/* Right: Organizing Team */}
              <div className="text-center">
                <div className="font-cert-signature text-2xl sm:text-3xl text-cyan-300 pb-0.5">
                  Organizing{'\u00A0'}Team
                </div>
                <div className="w-36 mx-auto border-b border-cyan-400/60 pb-1" />
                <div className="text-xs font-bold text-white uppercase mt-1 tracking-wider" style={{ wordSpacing: '0.25em' }}>
                  Organizing{'\u00A0'}Team
                </div>
                <div className="text-[10px] text-cyan-400 font-mono uppercase font-semibold">
                  COMMUNITY.VA
                </div>
                <div className="text-[9px] text-slate-400 font-mono" style={{ wordSpacing: '0.2em' }}>
                  Hackathon{'\u00A0'}Committee
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TEMPLATE 2: LIGHT CLEAN MODERN INNOVATION TEMPLATE */
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
            {/* Tech Borders */}
            <div className="absolute inset-2 border border-blue-800/40 rounded-xl pointer-events-none" />
            <div className="absolute inset-3 border border-cyan-600/20 rounded-lg pointer-events-none" />

            {/* Geometric Corners */}
            <div className="absolute top-2 left-2 w-7 h-7 border-t-4 border-l-4 border-blue-900" />
            <div className="absolute top-2 right-2 w-7 h-7 border-t-4 border-r-4 border-blue-900" />
            <div className="absolute bottom-2 left-2 w-7 h-7 border-b-4 border-l-4 border-blue-900" />
            <div className="absolute bottom-2 right-2 w-7 h-7 border-b-4 border-r-4 border-blue-900" />

            {/* Header: Logo and Motto */}
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

            {/* Title */}
            <div className="relative z-10 text-center space-y-2 mb-4">
              <h1
                className="text-2xl sm:text-4xl font-black uppercase tracking-wider text-blue-900 drop-shadow-sm"
                style={{ wordSpacing: '0.25em' }}
              >
                AI{'\u00A0'}INNOVATION{'\u00A0'}HACKATHON{'\u00A0'}2026
              </h1>

              <div
                className="inline-block px-4 py-1 rounded-full border border-blue-600 bg-blue-50 text-blue-800 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase"
                style={{ wordSpacing: '0.2em' }}
              >
                BUILD{'\u00A0'}AI-POWERED{'\u00A0'}SOLUTIONS{'\u00A0'}FOR{'\u00A0'}REAL-WORLD{'\u00A0'}PROBLEMS
              </div>

              <h2
                className="text-xl sm:text-3xl font-cert-serif font-black uppercase tracking-wider text-slate-900 pt-2"
                style={{ wordSpacing: '0.25em' }}
              >
                {tier.title.split(' ').join('\u00A0')}
              </h2>
            </div>

            {/* Recipient */}
            <div className="relative z-10 text-center space-y-2.5 my-4 max-w-2xl mx-auto">
              <p className="text-xs text-slate-500 italic">This is to certify that</p>

              <div className="py-1">
                <h3 className="font-cert-script text-3xl sm:text-5xl text-blue-950 font-normal">
                  {recipientName}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans" style={{ wordSpacing: '0.15em' }}>
                {tier.verb}{'\u00A0'}
                <strong className="text-blue-900 font-bold">
                  COMMUNITY.VA{'\u00A0\u00A0'}AI{'\u00A0'}INNOVATION{'\u00A0'}HACKATHON{'\u00A0'}2026
                </strong>
                ,{'\u00A0'}a{'\u00A0'}24-hour{'\u00A0'}online{'\u00A0'}hackathon,{'\u00A0'}held{'\u00A0'}on{'\u00A0'}
                <span className="text-slate-900 font-semibold">9{'\u00A0'}October{'\u00A0'}2026</span>.
              </p>

              <p className="text-xs text-slate-600 leading-relaxed max-w-xl mx-auto" style={{ wordSpacing: '0.15em' }}>
                {tier.text}
              </p>
            </div>

            {/* 4 Feature Badges */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto my-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-blue-700 text-xs mb-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-bold font-mono">9{'\u00A0'}OCT{'\u00A0'}2026</span>
                </div>
                <span className="text-[9px] text-slate-500 uppercase font-mono">DATE</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-blue-700 text-xs mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-bold font-mono">24{'\u00A0'}HOURS</span>
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
                  <span className="font-bold font-mono">2{'\u00A0'}-{'\u00A0'}4{'\u00A0'}MEMBERS</span>
                </div>
                <span className="text-[9px] text-slate-500 uppercase font-mono" style={{ wordSpacing: '0.15em' }}>TEAM{'\u00A0'}SIZE</span>
              </div>
            </div>

            {/* Scorecard Strip */}
            <div className="relative z-10 max-w-xl mx-auto bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-mono my-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Evaluated Rubric:</span>
                <span className="text-slate-700 text-[11px]">
                  V1: {team.judgeOverrides.video1 ?? team.scores.video1}/15 •
                  V2: {team.judgeOverrides.video2 ?? team.scores.video2}/20 •
                  V3: {team.judgeOverrides.video3 ?? team.scores.video3}/25 •
                  V4: {team.judgeOverrides.video4 ?? team.scores.video4}/40
                </span>
              </div>
              <div className="text-right">
                <span className="text-blue-900 font-black text-sm">
                  {team.finalApprovedTotal} / 100
                </span>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="relative z-10 grid grid-cols-3 gap-4 items-end pt-5 border-t border-slate-200 max-w-2xl mx-auto">
              {/* Left: Paidimarri Abhiram (Founder & CEO) */}
              <div className="text-center">
                <div className="font-cert-signature text-2xl sm:text-3xl text-blue-950 pb-0.5">
                  Paidimarri{'\u00A0'}Abhiram
                </div>
                <div className="w-36 mx-auto border-b border-slate-400 pb-1" />
                <div className="text-xs font-bold text-slate-900 uppercase mt-1 tracking-wider" style={{ wordSpacing: '0.25em' }}>
                  Paidimarri{'\u00A0'}Abhiram
                </div>
                <div className="text-[10px] text-blue-700 font-mono uppercase font-semibold" style={{ wordSpacing: '0.2em' }}>
                  Founder{'\u00A0'}&{'\u00A0'}CEO
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  Community.VA
                </div>
              </div>

              {/* Center: Blue & Gold Rosette Ribbon Seal */}
              <div className="flex flex-col items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-14 h-14 rounded border border-blue-900 bg-white p-0.5 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-blue-900 bg-blue-50 flex items-center justify-center text-blue-900">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                )}
                <span className="text-[8px] font-mono text-slate-500 uppercase mt-1" style={{ wordSpacing: '0.15em' }}>
                  Official{'\u00A0'}Seal{'\u00A0'}•{'\u00A0'}Verified
                </span>
              </div>

              {/* Right: Organizing Team */}
              <div className="text-center">
                <div className="font-cert-signature text-2xl sm:text-3xl text-blue-950 pb-0.5">
                  Organizing{'\u00A0'}Team
                </div>
                <div className="w-36 mx-auto border-b border-slate-400 pb-1" />
                <div className="text-xs font-bold text-slate-900 uppercase mt-1 tracking-wider" style={{ wordSpacing: '0.25em' }}>
                  Organizing{'\u00A0'}Team
                </div>
                <div className="text-[10px] text-blue-700 font-mono uppercase font-semibold">
                  COMMUNITY.VA
                </div>
                <div className="text-[9px] text-slate-500 font-mono" style={{ wordSpacing: '0.2em' }}>
                  Hackathon{'\u00A0'}Committee
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
