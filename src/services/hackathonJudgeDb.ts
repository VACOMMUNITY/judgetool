import { VideoAnalysisResult, TeamFullAnalysisResult, VideoAiService } from './videoAiService';

export interface HackathonTeamRecord {
  id: string;
  teamName: string;
  members: string[];
  projectName: string;
  projectDescription: string;
  videoUrls: {
    video1: string; // Problem Understanding (15)
    video2: string; // Pitch Deck (20)
    video3: string; // 50% Prototype (25)
    video4: string; // Final Project (40)
  };
  videoFileNames?: {
    video1?: string;
    video2?: string;
    video3?: string;
    video4?: string;
  };
  videoFileSizes?: {
    video1?: number;
    video2?: number;
    video3?: number;
    video4?: number;
  };
  evaluationStatus: 'Pending' | 'Analyzing' | 'Completed' | 'Needs Review';
  scores: {
    video1: number; // max 15
    video2: number; // max 20
    video3: number; // max 25
    video4: number; // max 40
    total: number;  // max 100
    percentage: number;
  };
  feedback: {
    video1?: VideoAnalysisResult;
    video2?: VideoAnalysisResult;
    video3?: VideoAnalysisResult;
    video4?: VideoAnalysisResult;
    overallSummary?: string;
  };
  judgeOverrides: {
    video1?: number;
    video2?: number;
    video3?: number;
    video4?: number;
    comments?: string;
    judgeName?: string;
    overriddenAt?: string;
  };
  finalApprovedTotal: number;
  isApproved: boolean;
  rank?: number;
  tieBreakNote?: string;
  createdAt: string;
}

const STORAGE_KEY_TEAMS = 'cva_judge_teams_store_v2';
const STORAGE_KEY_APPROVAL = 'cva_judge_official_approval_v2';

export class HackathonJudgeDb {
  private static instance: HackathonJudgeDb;

  private constructor() {
    this.init();
  }

  public static getInstance(): HackathonJudgeDb {
    if (!HackathonJudgeDb.instance) {
      HackathonJudgeDb.instance = new HackathonJudgeDb();
    }
    return HackathonJudgeDb.instance;
  }

  private init(): void {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEY_TEAMS)) {
      // Clean production state by default
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify([]));
    }
  }

  public getTeams(): HackathonTeamRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TEAMS);
      const teams: HackathonTeamRecord[] = data ? JSON.parse(data) : [];
      return this.computeRankings(teams);
    } catch {
      return [];
    }
  }

  public getTeamById(id: string): HackathonTeamRecord | undefined {
    return this.getTeams().find((t) => t.id === id);
  }

  public saveTeams(teams: HackathonTeamRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
    } catch (e) {
      console.error('Failed to save teams in localStorage:', e);
    }
  }

  public addTeam(team: {
    teamName: string;
    members: string[];
    projectName: string;
    projectDescription: string;
    videoUrls: { video1: string; video2: string; video3: string; video4: string };
    videoFileNames?: { video1?: string; video2?: string; video3?: string; video4?: string };
    videoFileSizes?: { video1?: number; video2?: number; video3?: number; video4?: number };
    initialScores?: { video1?: number; video2?: number; video3?: number; video4?: number };
    initialFeedback?: { video1?: any; video2?: any; video3?: any; video4?: any };
  }): HackathonTeamRecord {
    const teams = this.getTeams();
    const nextNum = teams.length + 1;
    const newId = `CVA-2026-${String(nextNum).padStart(3, '0')}`;

    const v1 = team.initialScores?.video1 || 0;
    const v2 = team.initialScores?.video2 || 0;
    const v3 = team.initialScores?.video3 || 0;
    const v4 = team.initialScores?.video4 || 0;
    const totalScore = Math.min(100, Math.round((v1 + v2 + v3 + v4) * 10) / 10);

    const isAllSubmitted =
      Boolean(team.videoUrls.video1) &&
      Boolean(team.videoUrls.video2) &&
      Boolean(team.videoUrls.video3) &&
      Boolean(team.videoUrls.video4);

    const newTeam: HackathonTeamRecord = {
      id: newId,
      teamName: team.teamName,
      members: team.members.length > 0 ? team.members : ['Team Leader'],
      projectName: team.projectName,
      projectDescription: team.projectDescription,
      videoUrls: team.videoUrls,
      videoFileNames: team.videoFileNames,
      videoFileSizes: team.videoFileSizes,
      evaluationStatus: totalScore > 0 ? (isAllSubmitted ? 'Completed' : 'Pending') : 'Pending',
      scores: {
        video1: v1,
        video2: v2,
        video3: v3,
        video4: v4,
        total: totalScore,
        percentage: totalScore,
      },
      feedback: team.initialFeedback || {},
      judgeOverrides: {},
      finalApprovedTotal: totalScore,
      isApproved: false,
      createdAt: new Date().toISOString(),
    };

    teams.push(newTeam);
    this.saveTeams(teams);
    return newTeam;
  }

  public updateTeamVideos(
    teamId: string,
    videoUrls: { video1: string; video2: string; video3: string; video4: string },
    videoFileNames?: { video1?: string; video2?: string; video3?: string; video4?: string },
    videoFileSizes?: { video1?: number; video2?: number; video3?: number; video4?: number }
  ): boolean {
    const teams = this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return false;

    team.videoUrls = videoUrls;
    if (videoFileNames) team.videoFileNames = { ...team.videoFileNames, ...videoFileNames };
    if (videoFileSizes) team.videoFileSizes = { ...team.videoFileSizes, ...videoFileSizes };
    this.saveTeams(teams);
    return true;
  }

  public deleteTeam(teamId: string): boolean {
    const teams = this.getTeams();
    const filtered = teams.filter((t) => t.id !== teamId);
    if (filtered.length === teams.length) return false;
    this.saveTeams(filtered);
    return true;
  }

  public async evaluateTeamVideos(
    teamId: string,
    onProgress?: (stageNumber: number, stageName: string) => void
  ): Promise<TeamFullAnalysisResult | null> {
    const teams = this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return null;

    team.evaluationStatus = 'Analyzing';
    this.saveTeams(teams);

    try {
      const result = await VideoAiService.analyzeAllFourVideos(
        team.videoUrls,
        team.teamName,
        team.projectName,
        onProgress
      );

      // Check if any video errored
      const hasErrors =
        result.video1.status === 'error' ||
        result.video2.status === 'error' ||
        result.video3.status === 'error' ||
        result.video4.status === 'error';

      team.scores = {
        video1: result.video1.score,
        video2: result.video2.score,
        video3: result.video3.score,
        video4: result.video4.score,
        total: result.totalScore,
        percentage: result.percentage,
      };

      team.feedback = {
        video1: result.video1,
        video2: result.video2,
        video3: result.video3,
        video4: result.video4,
        overallSummary: result.overallSummary,
      };

      // Calculate finalized total score (factoring in any existing judge overrides)
      team.finalApprovedTotal = this.calculateApprovedTotal(team);
      team.evaluationStatus = hasErrors ? 'Needs Review' : 'Completed';

      this.saveTeams(teams);
      return result;
    } catch (err) {
      team.evaluationStatus = 'Needs Review';
      this.saveTeams(teams);
      throw err;
    }
  }

  public async evaluateSingleVideo(
    teamId: string,
    stageNumber: 1 | 2 | 3 | 4
  ): Promise<VideoAnalysisResult | null> {
    const teams = this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return null;

    const urlKey = `video${stageNumber}` as keyof typeof team.videoUrls;
    const videoUrl = team.videoUrls[urlKey];

    const result = await VideoAiService.analyzeVideo(
      stageNumber,
      videoUrl,
      team.teamName,
      team.projectName
    );

    team.scores[urlKey] = result.score;
    team.feedback[urlKey] = result;

    team.scores.total =
      team.scores.video1 + team.scores.video2 + team.scores.video3 + team.scores.video4;
    team.scores.percentage = team.scores.total;
    team.finalApprovedTotal = this.calculateApprovedTotal(team);

    if (
      team.scores.video1 > 0 &&
      team.scores.video2 > 0 &&
      team.scores.video3 > 0 &&
      team.scores.video4 > 0
    ) {
      team.evaluationStatus = 'Completed';
    }

    this.saveTeams(teams);
    return result;
  }

  public setSingleVideoMark(
    teamId: string,
    stageNumber: 1 | 2 | 3 | 4,
    mark: number,
    judgeName?: string,
    comment?: string
  ): boolean {
    const maxMarks = { 1: 15, 2: 20, 3: 25, 4: 40 }[stageNumber];
    if (mark < 0 || mark > maxMarks) return false;

    const teams = this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return false;

    const key = `video${stageNumber}` as 'video1' | 'video2' | 'video3' | 'video4';
    team.judgeOverrides[key] = mark;
    team.judgeOverrides.judgeName = judgeName || team.judgeOverrides.judgeName || 'Paidimarri Abhiram (Founder & CEO)';
    if (comment) {
      const current = team.judgeOverrides.comments || '';
      team.judgeOverrides.comments = current
        ? `${current}\n[Video ${stageNumber}]: ${comment}`
        : `[Video ${stageNumber}]: ${comment}`;
    }
    team.judgeOverrides.overriddenAt = new Date().toISOString();

    team.finalApprovedTotal = this.calculateApprovedTotal(team);
    if (team.finalApprovedTotal > 0) {
      team.evaluationStatus = 'Completed';
    }

    this.saveTeams(teams);
    return true;
  }

  public setJudgeOverride(
    teamId: string,
    overrides: {
      video1?: number;
      video2?: number;
      video3?: number;
      video4?: number;
      comments?: string;
      judgeName?: string;
    }
  ): boolean {
    const teams = this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return false;

    // Validate maximum marks caps
    if (overrides.video1 !== undefined && (overrides.video1 < 0 || overrides.video1 > 15)) return false;
    if (overrides.video2 !== undefined && (overrides.video2 < 0 || overrides.video2 > 20)) return false;
    if (overrides.video3 !== undefined && (overrides.video3 < 0 || overrides.video3 > 25)) return false;
    if (overrides.video4 !== undefined && (overrides.video4 < 0 || overrides.video4 > 40)) return false;

    team.judgeOverrides = {
      ...team.judgeOverrides,
      ...overrides,
      judgeName: overrides.judgeName || team.judgeOverrides.judgeName || 'Paidimarri Abhiram (Founder & CEO)',
      overriddenAt: new Date().toISOString(),
    };

    team.finalApprovedTotal = this.calculateApprovedTotal(team);
    this.saveTeams(teams);
    return true;
  }

  public setOfficialApproval(isApproved: boolean): void {
    localStorage.setItem(STORAGE_KEY_APPROVAL, String(isApproved));
    if (isApproved && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cva_winners_announced', {
        detail: { announcedAt: new Date().toISOString() }
      }));
    }
  }

  public isOfficialApproved(): boolean {
    return localStorage.getItem(STORAGE_KEY_APPROVAL) === 'true';
  }

  public getAnnouncementInfo(): { isAnnounced: boolean; announcedAt?: string; announcedBy?: string } {
    try {
      const isApproved = this.isOfficialApproved();
      const raw = localStorage.getItem('cva_winner_announcement_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        return { isAnnounced: isApproved, ...parsed };
      }
      return { isAnnounced: isApproved, announcedBy: 'Paidimarri Abhiram (Founder & CEO)' };
    } catch {
      return { isAnnounced: this.isOfficialApproved(), announcedBy: 'Paidimarri Abhiram (Founder & CEO)' };
    }
  }

  public announceWinners(announcedBy: string = 'Paidimarri Abhiram (Founder & CEO)'): { announcedAt: string } {
    const announcedAt = new Date().toISOString();
    this.setOfficialApproval(true);
    try {
      localStorage.setItem('cva_winner_announcement_data', JSON.stringify({
        isAnnounced: true,
        announcedAt,
        announcedBy,
      }));
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cva_winners_announced', {
        detail: { announcedAt, announcedBy }
      }));
    }
    return { announcedAt };
  }

  private calculateApprovedTotal(team: HackathonTeamRecord): number {
    const s1 = team.judgeOverrides.video1 !== undefined ? team.judgeOverrides.video1 : team.scores.video1;
    const s2 = team.judgeOverrides.video2 !== undefined ? team.judgeOverrides.video2 : team.scores.video2;
    const s3 = team.judgeOverrides.video3 !== undefined ? team.judgeOverrides.video3 : team.scores.video3;
    const s4 = team.judgeOverrides.video4 !== undefined ? team.judgeOverrides.video4 : team.scores.video4;
    return Math.min(100, Math.round((s1 + s2 + s3 + s4) * 10) / 10);
  }

  /**
   * Automatic Winner Ranking with Published Tie-Breaker:
   * 1. Total score descending.
   * 2. Tie-break: Higher Video 4 (Final Project) score first.
   * 3. Tie-break: Higher Video 3 (50% Prototype) score second.
   * 4. If still tied: marked for judge panel review.
   */
  public computeRankings(teams: HackathonTeamRecord[]): HackathonTeamRecord[] {
    const sorted = [...teams].sort((a, b) => {
      const scoreDiff = b.finalApprovedTotal - a.finalApprovedTotal;
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff;

      // Tie-breaker 1: Video 4 Final Project Demonstration
      const v4_a = a.judgeOverrides.video4 !== undefined ? a.judgeOverrides.video4 : a.scores.video4;
      const v4_b = b.judgeOverrides.video4 !== undefined ? b.judgeOverrides.video4 : b.scores.video4;
      const v4_diff = v4_b - v4_a;
      if (Math.abs(v4_diff) > 0.001) return v4_diff;

      // Tie-breaker 2: Video 3 50% Prototype Demonstration
      const v3_a = a.judgeOverrides.video3 !== undefined ? a.judgeOverrides.video3 : a.scores.video3;
      const v3_b = b.judgeOverrides.video3 !== undefined ? b.judgeOverrides.video3 : b.scores.video3;
      const v3_diff = v3_b - v3_a;
      if (Math.abs(v3_diff) > 0.001) return v3_diff;

      return 0;
    });

    return sorted.map((team, idx) => {
      const rank = idx + 1;
      let tieBreakNote: string | undefined = undefined;

      const prev = sorted[idx - 1];
      const next = sorted[idx + 1];

      const tiedPrev = prev && Math.abs(prev.finalApprovedTotal - team.finalApprovedTotal) < 0.001;
      const tiedNext = next && Math.abs(next.finalApprovedTotal - team.finalApprovedTotal) < 0.001;

      if (tiedPrev || tiedNext) {
        if (tiedNext) {
          const v4_curr = team.judgeOverrides.video4 ?? team.scores.video4;
          const v4_next = next.judgeOverrides.video4 ?? next.scores.video4;
          if (v4_curr > v4_next) {
            tieBreakNote = `Won tie-break at ${team.finalApprovedTotal} pts via higher Final Project Output (${v4_curr} vs ${v4_next}).`;
          } else {
            tieBreakNote = `Tied total score. Prototype progress score resolved rank.`;
          }
        }
      }

      return {
        ...team,
        rank,
        tieBreakNote,
      };
    });
  }

  public exportLeaderboardCsv(): string {
    const teams = this.getTeams();
    const headers = [
      'Rank',
      'Award',
      'Team ID',
      'Team Name',
      'Project Name',
      'Video 1: Problem (15)',
      'Video 2: Pitch Deck (20)',
      'Video 3: Prototype (25)',
      'Video 4: Final Output (40)',
      'Total Score (100)',
      'Percentage',
      'Evaluation Status',
      'Tie-Break Details',
    ];

    const rows = teams.map((t) => {
      let award = '';
      if (t.rank === 1) award = 'Winner';
      else if (t.rank === 2) award = 'Runner-Up';
      else if (t.rank === 3) award = 'Second Runner-Up';

      const s1 = t.judgeOverrides.video1 ?? t.scores.video1;
      const s2 = t.judgeOverrides.video2 ?? t.scores.video2;
      const s3 = t.judgeOverrides.video3 ?? t.scores.video3;
      const s4 = t.judgeOverrides.video4 ?? t.scores.video4;

      return [
        t.rank || '',
        `"${award}"`,
        `"${t.id}"`,
        `"${t.teamName.replace(/"/g, '""')}"`,
        `"${t.projectName.replace(/"/g, '""')}"`,
        s1,
        s2,
        s3,
        s4,
        t.finalApprovedTotal,
        `${t.finalApprovedTotal}%`,
        `"${t.evaluationStatus}"`,
        `"${(t.tieBreakNote || '').replace(/"/g, '""')}"`,
      ];
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public clearAllTeams(): void {
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEY_APPROVAL);
  }

  /**
   * Benchmark sample data loader for quick demonstration if desired.
   */
  public loadBenchmarkSamples(): void {
    const sampleTeams: HackathonTeamRecord[] = [
      {
        id: 'CVA-2026-001',
        teamName: 'Team NeuroVision',
        members: ['Aarav Sharma (Lead)', 'Pooja Sundaram', 'Rohan Mehra'],
        projectName: 'GlaucoGuard: Edge AI Retinal Screener',
        projectDescription: 'Quantized on-device ONNX vision transformer for early glaucoma detection using smartphone camera optics.',
        videoUrls: {
          video1: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          video2: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          video3: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          video4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        },
        evaluationStatus: 'Completed',
        scores: { video1: 14.5, video2: 19.0, video3: 24.0, video4: 39.0, total: 96.5, percentage: 96.5 },
        feedback: {
          overallSummary: 'Exemplary offline AI edge diagnostics tested live in airplane mode.',
        },
        judgeOverrides: {},
        finalApprovedTotal: 96.5,
        isApproved: true,
        createdAt: '2026-10-09T10:00:00.000Z',
      },
      {
        id: 'CVA-2026-002',
        teamName: 'Team AgroSense',
        members: ['Divya Nambiar (Lead)', 'Siddharth Iyer', 'Kavita Joshi'],
        projectName: 'KisanMitra: Vernacular Voice & Vision Agricultural AI',
        projectDescription: 'Multimodal conversational assistant for farmers in regional Hindi, Marathi, and Kannada with live leaf disease detection.',
        videoUrls: {
          video1: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          video2: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          video3: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
          video4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        },
        evaluationStatus: 'Completed',
        scores: { video1: 14.0, video2: 18.5, video3: 22.0, video4: 37.5, total: 92.0, percentage: 92.0 },
        feedback: {
          overallSummary: 'High impact vernacular voice interaction with leaf lesion computer vision.',
        },
        judgeOverrides: {},
        finalApprovedTotal: 92.0,
        isApproved: true,
        createdAt: '2026-10-09T11:00:00.000Z',
      },
      {
        id: 'CVA-2026-003',
        teamName: 'Team SafeRoute',
        members: ['Vikramaditya Rao (Lead)', 'Meera Nair', 'Karthik Reddy'],
        projectName: 'NightOwl: Public Transit Computer Vision SOS System',
        projectDescription: 'Privacy preserving CCTV edge anomaly detection alerting transit command center of passenger distress.',
        videoUrls: {
          video1: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
          video2: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          video3: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          video4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        },
        evaluationStatus: 'Completed',
        scores: { video1: 14.5, video2: 18.5, video3: 23.0, video4: 36.0, total: 92.0, percentage: 92.0 },
        feedback: {
          overallSummary: 'Tie-break competitor. Video 4 score (36.0 vs 37.5) ranks SafeRoute as 2nd Runner-Up.',
        },
        judgeOverrides: {},
        finalApprovedTotal: 92.0,
        isApproved: true,
        createdAt: '2026-10-09T12:00:00.000Z',
      },
    ];

    this.saveTeams(sampleTeams);
  }
}

export const hackathonJudgeDb = HackathonJudgeDb.getInstance();
