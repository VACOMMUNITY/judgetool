export type VideoStageKey = 'problem_understanding' | 'pitch_deck' | 'prototype_progress' | 'final_output';

export interface RubricCriterion {
  id: string;
  name: string;
  stage: VideoStageKey;
  maxScore: number;
  description: string;
  guidelines: string[];
}

export interface RubricScoreItem {
  criterionId: string;
  criterionName: string;
  maxScore: number;
  score: number;
  explanation: string;
  supportingTimestamps: string[];
  humanOverrideScore?: number;
  humanOverrideReason?: string;
}

export interface TranscriptSnippet {
  id: string;
  timestamp: string; // e.g. "01:24"
  timeSeconds: number;
  speaker: string;
  text: string;
  keyPoints?: string[];
  visualTag?: 'slide' | 'code' | 'demo' | 'speech';
}

export interface VisualObservation {
  id: string;
  timestamp: string; // "02:15"
  timeSeconds: number;
  frameType: 'slide' | 'screen_demo' | 'terminal' | 'architecture' | 'ui_interaction';
  label: string;
  description: string;
  confidenceScore: number;
  detectedEntities?: string[];
}

export interface ClaimVerification {
  id: string;
  claimText: string;
  category: 'technical' | 'metric' | 'problem' | 'ai_capability';
  status: 'verified' | 'unsupported' | 'partial' | 'inconclusive';
  confidence: number;
  evidenceTimestamp?: string;
  explanation: string;
  requiresHumanReview: boolean;
}

export interface VideoSubmissionStageData {
  stage: VideoStageKey;
  stageNumber: number;
  stageTitle: string;
  maxMarks: number;
  videoUrl: string;
  fileName?: string;
  format: 'MP4' | 'MOV' | 'WEBM' | 'YOUTUBE' | 'DRIVE' | 'LOOM';
  status: 'missing' | 'inaccessible' | 'pending_evaluation' | 'analyzing' | 'evaluated' | 'flagged';
  accessError?: string;
  duration?: string;
  durationSeconds?: number;
  submittedAt?: string;
  
  // AI Video Analysis Output
  transcript: TranscriptSnippet[];
  visualEvidence: VisualObservation[];
  claims: ClaimVerification[];
  criterionScores: RubricScoreItem[];
  stageScore: number; // Sum of criteria, capped strictly to maxMarks
  
  strengths: string[];
  weaknesses: string[];
  missingEvidence: string[];
  improvementOpportunities: string[];
  
  aiConfidence: number; // 0 - 100%
  uncertaintyFlag: boolean;
  uncertaintyReason?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  email: string;
}

export interface JudgeOverride {
  judgeId: string;
  judgeName: string;
  stage: VideoStageKey;
  criterionId: string;
  originalAiScore: number;
  newScore: number;
  reason: string;
  updatedAt: string;
}

export interface HumanReviewData {
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  reviewedAt: string;
  overallComments: string;
  approvalStatus: 'provisional' | 'approved' | 'rejected' | 'reopened';
  overrides: JudgeOverride[];
  independentScore?: number;
}

export interface HackathonTeam {
  id: string; // e.g., 'CVA-2026-001'
  teamName: string;
  college: string;
  contactEmail: string;
  leaderName: string;
  leaderPhone?: string;
  members: TeamMember[];
  track: string;
  projectTitle: string;
  projectDescription: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  
  submissions: Record<VideoStageKey, VideoSubmissionStageData>;
  
  // Scores
  scores: {
    problemUnderstanding: number; // max 15
    pitchDeck: number;            // max 20
    prototypeProgress: number;    // max 25
    finalProjectOutput: number;   // max 40
    aiTotalScore: number;         // max 100
    finalApprovedScore: number;   // max 100 (after judge overrides or approval)
    percentage: number;           // (Total / 100) * 100
  };
  
  // Review Status
  reviewStatus: 'provisional_ai' | 'judge_reviewed' | 'officially_approved';
  humanReviews: HumanReviewData[];
  
  // Anti-cheating & Safeguards
  plagiarismRisk: 'low' | 'medium' | 'high';
  unsupportedClaimsCount: number;
  duplicateSubmissionFlag: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  displayRankLabel?: 'Winner' | 'Runner-up' | 'Second Runner-up' | '';
  teamId: string;
  teamName: string;
  projectTitle: string;
  college: string;
  problemScore: number;
  pitchDeckScore: number;
  prototypeScore: number;
  finalOutputScore: number;
  totalScore: number;
  percentage: number;
  reviewStatus: 'provisional_ai' | 'judge_reviewed' | 'officially_approved';
  isTied: boolean;
  tieBreakReason?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  teamId: string;
  action: 'AI_EVALUATION_COMPLETED' | 'JUDGE_SCORE_OVERRIDE' | 'OFFICIAL_APPROVAL' | 'VIDEO_UPLOADED' | 'SYSTEM_LOCKED' | 'SYSTEM_UNLOCKED';
  summary: string;
  details?: Record<string, any>;
}

export interface SystemSettings {
  isLeaderboardLocked: boolean;
  aggregationMethod: 'judge_override' | 'judge_average' | 'ai_judge_hybrid';
  strictRubricEnforcement: boolean;
  allowPublicView: boolean;
  lastUpdated: string;
}
