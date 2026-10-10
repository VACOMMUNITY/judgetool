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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { aiJudgeService } from '@/services/aiJudgeService';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Users, Building, Mail, Phone, Code2 } from 'lucide-react';

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

const HACKATHON_TRACKS = [
  'Healthcare AI & Edge Diagnostics',
  'AgriTech & Climate Intelligence',
  'Smart Governance & Public Safety',
  'Energy & Climate Intelligence',
  'Cybersecurity & FinTech Safety',
  'EdTech & Neurodiversity Accessibility',
  'Autonomous Systems & Robotics',
  'Open Innovation AI',
];

export const AddTeamModal: React.FC<AddTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamCreated,
}) => {
  const { toast } = useToast();
  const [teamName, setTeamName] = useState('');
  const [college, setCollege] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [track, setTrack] = useState(HACKATHON_TRACKS[0]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim() || !college.trim() || !leaderName.trim() || !contactEmail.trim() || !projectTitle.trim()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please complete all team identification fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = aiJudgeService.addTeam({
        teamName,
        college,
        contactEmail,
        leaderName,
        leaderPhone,
        track,
        projectTitle,
        projectDescription,
        githubUrl: githubUrl || undefined,
        liveDemoUrl: liveDemoUrl || undefined,
      });

      toast({
        title: 'Team Registered Successfully',
        description: `Created ${created.teamName} with Team ID ${created.id}.`,
      });

      // Reset form
      setTeamName('');
      setCollege('');
      setContactEmail('');
      setLeaderName('');
      setLeaderPhone('');
      setProjectTitle('');
      setProjectDescription('');
      setGithubUrl('');
      setLiveDemoUrl('');

      onTeamCreated();
      onClose();
    } catch (error) {
      toast({
        title: 'Error Creating Team',
        description: 'Failed to save team registration.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#0B132B] text-white border-cyan-800/80 p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-400" /> Register Hackathon Team
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            Create a registered team entry. A unique Team ID will be automatically generated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Team Name *</label>
              <Input
                placeholder="e.g. Team BioPulse"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">College / University *</label>
              <Input
                placeholder="e.g. IIT Madras"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                required
                className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Leader Name *</label>
              <Input
                placeholder="e.g. Rohan Verma"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                required
                className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Contact Email *</label>
              <Input
                type="email"
                placeholder="team@college.edu"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Phone Number</label>
              <Input
                placeholder="+91 98765 43210"
                value={leaderPhone}
                onChange={(e) => setLeaderPhone(e.target.value)}
                className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Hackathon Track *</label>
              <Select value={track} onValueChange={setTrack}>
                <SelectTrigger className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C2541] border-cyan-800 text-white text-xs">
                  {HACKATHON_TRACKS.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Project Title *</label>
              <Input
                placeholder="e.g. CardioPredict: Edge Heart Risk AI"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
                className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold mb-1 block">Project Description</label>
            <Textarea
              placeholder="Brief summary of problem, methodology, and AI technology used..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={2}
              className="bg-[#1C2541]/70 border-cyan-900/60 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold mb-1 block">GitHub Repository URL</label>
              <Input
                placeholder="https://github.com/..."
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Live Demo URL</label>
              <Input
                placeholder="https://..."
                value={liveDemoUrl}
                onChange={(e) => setLiveDemoUrl(e.target.value)}
                className="bg-[#1C2541]/70 border-cyan-900/60 text-white h-9 text-xs"
              />
            </div>
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
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-9 text-xs"
            >
              Save & Register Team
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
