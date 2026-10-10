import { VideoStageKey, RubricCriterion } from '@/types/aiJudge';

export const OFFICIAL_STAGES: Record<VideoStageKey, {
  key: VideoStageKey;
  number: number;
  title: string;
  maxMarks: number;
  shortDesc: string;
}> = {
  problem_understanding: {
    key: 'problem_understanding',
    number: 1,
    title: 'Problem Statement Understanding',
    maxMarks: 15,
    shortDesc: 'Evaluates problem clarity, user targeting, root cause analysis, and AI approach justification.',
  },
  pitch_deck: {
    key: 'pitch_deck',
    number: 2,
    title: 'Pitch Deck Presentation',
    maxMarks: 20,
    shortDesc: 'Evaluates solution narrative, pitch deck architecture, innovation, and technical viability.',
  },
  prototype_progress: {
    key: 'prototype_progress',
    number: 3,
    title: '50% Prototype Progress',
    maxMarks: 25,
    shortDesc: 'Evaluates tangible codebase implementation, initial working features, and AI integration progress.',
  },
  final_output: {
    key: 'final_output',
    number: 4,
    title: 'Final Project Output & Demonstration',
    maxMarks: 40,
    shortDesc: 'Evaluates fully operational software demo, system reliability, UX, AI quality, and real-world impact.',
  },
};

export const OFFICIAL_RUBRICS: Record<VideoStageKey, RubricCriterion[]> = {
  problem_understanding: [
    {
      id: 'crit-p1',
      name: 'Clarity of the Problem Statement',
      stage: 'problem_understanding',
      maxScore: 3,
      description: 'Precision with which the core friction or pain point is articulated.',
      guidelines: [
        'States the specific problem without ambiguity',
        'Avoids superficial generalizations',
        'Backs problem context with domain evidence',
      ],
    },
    {
      id: 'crit-p2',
      name: 'Identification of Target Users',
      stage: 'problem_understanding',
      maxScore: 2,
      description: 'Defined user personas, stakeholders, and community segments affected.',
      guidelines: [
        'Clearly defines who experiences the pain point',
        'Recognizes varied workflow requirements across user types',
      ],
    },
    {
      id: 'crit-p3',
      name: 'Understanding of Root Cause',
      stage: 'problem_understanding',
      maxScore: 3,
      description: 'Deconstructs symptoms into structural, technical, or systemic causes.',
      guidelines: [
        'Identifies why previous tools failed or are insufficient',
        'Distinguishes root structural drivers from surface symptoms',
      ],
    },
    {
      id: 'crit-p4',
      name: 'Importance & Real-World Relevance',
      stage: 'problem_understanding',
      maxScore: 2,
      description: 'Urgency, scale, and socio-economic or technological consequence.',
      guidelines: [
        'Validates measurable impact or necessity in 2026',
        'Addresses Community.VA hackathon themes directly',
      ],
    },
    {
      id: 'crit-p5',
      name: 'Existing Limitations & Gaps',
      stage: 'problem_understanding',
      maxScore: 2,
      description: 'Critique of current alternatives and market solutions.',
      guidelines: [
        'Enumerates explicit gaps in present-day offerings',
        'Articulates why existing methods do not scale',
      ],
    },
    {
      id: 'crit-p6',
      name: 'Clarity of Proposed AI-Based Approach',
      stage: 'problem_understanding',
      maxScore: 3,
      description: 'Justification for applying AI models rather than simple rule-based logic.',
      guidelines: [
        'Explains why machine learning/LLM/CV is the appropriate mechanism',
        'Presents logical hypothesis of how AI transforms the outcome',
      ],
    },
  ],

  pitch_deck: [
    {
      id: 'crit-d1',
      name: 'Clarity of Idea and Solution',
      stage: 'pitch_deck',
      maxScore: 3,
      description: 'Coherent product concept and elegant user journey.',
      guidelines: ['Communicates unique value proposition', 'Solution cleanly maps to problem space'],
    },
    {
      id: 'crit-d2',
      name: 'Quality and Structure of Pitch Deck',
      stage: 'pitch_deck',
      maxScore: 3,
      description: 'Visual clarity, logical narrative flow, and professional documentation.',
      guidelines: ['Cohesive slide progression', 'Legible diagrams and data representations'],
    },
    {
      id: 'crit-d3',
      name: 'Innovation and Uniqueness',
      stage: 'pitch_deck',
      maxScore: 3,
      description: 'Creative engineering leap or differentiation from standard clone apps.',
      guidelines: ['Novel algorithm application or synthesis', 'Differentiated competitive moat'],
    },
    {
      id: 'crit-d4',
      name: 'Target Audience and Use Cases',
      stage: 'pitch_deck',
      maxScore: 3,
      description: 'Concrete operational scenarios and customer adoption paths.',
      guidelines: ['Walks through realistic scenario workflow', 'Validates willingness to use'],
    },
    {
      id: 'crit-d5',
      name: 'Technical Feasibility',
      stage: 'pitch_deck',
      maxScore: 3,
      description: 'Realism of system architecture, data pipelines, and hardware bounds.',
      guidelines: ['Realistic latency, compute, and model sizing', 'Grounded API integration plan'],
    },
    {
      id: 'crit-d6',
      name: 'Potential Impact and Scalability',
      stage: 'pitch_deck',
      maxScore: 3,
      description: 'Growth vector from prototype to thousands of concurrent users.',
      guidelines: ['Scalable cloud/edge deployment strategy', 'Quantifiable multiplier effect'],
    },
    {
      id: 'crit-d7',
      name: 'Business or Implementation Viability',
      stage: 'pitch_deck',
      maxScore: 2,
      description: 'Cost of inference, unit economics, open-source sustainability or operational plan.',
      guidelines: ['Considers API cost per query', 'Practical maintenance model'],
    },
  ],

  prototype_progress: [
    {
      id: 'crit-m1',
      name: 'Evidence of Actual Implementation',
      stage: 'prototype_progress',
      maxScore: 4,
      description: 'Direct video evidence of local code repository, IDE, or running server.',
      guidelines: ['Displays real source code in editor', 'Demonstrates live running environment'],
    },
    {
      id: 'crit-m2',
      name: 'Working Features Demonstrated in Video',
      stage: 'prototype_progress',
      maxScore: 4,
      description: 'At least 50% core interactive features functioning on screen.',
      guidelines: ['Interactive UI elements accepting input', 'Live state changes on screen'],
    },
    {
      id: 'crit-m3',
      name: 'Relevance to Stated Problem',
      stage: 'prototype_progress',
      maxScore: 4,
      description: 'Features align directly with the initial pitch rather than scope drift.',
      guidelines: ['Addresses the core user journey', 'Implements promised primitives'],
    },
    {
      id: 'crit-m4',
      name: 'Appropriate AI Integration Progress',
      stage: 'prototype_progress',
      maxScore: 4,
      description: 'Early model inference, embeddings, or pipeline connected and executing.',
      guidelines: ['Displays model inference response', 'Realistic prompts or tensor transforms'],
    },
    {
      id: 'crit-m5',
      name: 'Technical Decisions & Implementation Quality',
      stage: 'prototype_progress',
      maxScore: 3,
      description: 'Thoughtful framework, backend, database, and library selections.',
      guidelines: ['Modular folder architecture', 'Standard conventions and clean code'],
    },
    {
      id: 'crit-m6',
      name: 'Progress Toward Proposed Solution',
      stage: 'prototype_progress',
      maxScore: 3,
      description: 'Tangible 50% milestone achievement within hackathon timeline.',
      guidelines: ['Demonstrates half the target roadmap complete', 'Logical feature priority'],
    },
    {
      id: 'crit-m7',
      name: 'Current Limitations & Next Steps Identified',
      stage: 'prototype_progress',
      maxScore: 3,
      description: 'Honest self-awareness of bottlenecks and remaining milestone sprint.',
      guidelines: [
        'Transparently outlines remaining bugs/todos',
        'Does not falsely claim unfinished parts are done',
      ],
    },
  ],

  final_output: [
    {
      id: 'crit-f1',
      name: 'Functionality & Successful Demonstration',
      stage: 'final_output',
      maxScore: 6,
      description: 'End-to-end operational software without crash during video test.',
      guidelines: ['Flawless end-to-end execution of main user story', 'Real-time demonstration live'],
    },
    {
      id: 'crit-f2',
      name: 'Effectiveness of the Solution',
      stage: 'final_output',
      maxScore: 5,
      description: 'Solves the target problem conclusively with tangible output.',
      guidelines: ['Produces correct, high-utility result', 'Measurable task completion rate'],
    },
    {
      id: 'crit-f3',
      name: 'Quality of AI Implementation',
      stage: 'final_output',
      maxScore: 6,
      description: 'Sophistication of model, prompts, fine-tuning, latency optimization, or accuracy.',
      guidelines: [
        'Robust handling of edge cases and hallucination mitigations',
        'Measurable inference speed or precision benchmark',
      ],
    },
    {
      id: 'crit-f4',
      name: 'Technical Execution & Reliability',
      stage: 'final_output',
      maxScore: 5,
      description: 'Graceful error handling, input validation, and stable architecture.',
      guidelines: ['Zero critical failures during live demo', 'Clean responsive feedback'],
    },
    {
      id: 'crit-f5',
      name: 'User Experience & Usability',
      stage: 'final_output',
      maxScore: 5,
      description: 'Intuitive UI, accessibility, polished visual feedback, and friction-free flow.',
      guidelines: ['Polished aesthetic aligned with purpose', 'Accessible for target audience'],
    },
    {
      id: 'crit-f6',
      name: 'Innovation & Originality',
      stage: 'final_output',
      maxScore: 5,
      description: 'Standout creativity and engineering excellence that inspires.',
      guidelines: ['Unique feature invention', 'Inspiring hackathon deliverable'],
    },
    {
      id: 'crit-f7',
      name: 'Real-World Impact & Scalability',
      stage: 'final_output',
      maxScore: 4,
      description: 'Deployment readiness for immediate pilot or open community use.',
      guidelines: ['Clear path to production deployment', 'Scalable design principles demonstrated'],
    },
    {
      id: 'crit-f8',
      name: 'Ability to Explain System & Limitations',
      stage: 'final_output',
      maxScore: 4,
      description: 'Deep technical clarity, honest appraisal of constraints, and ethics/safety review.',
      guidelines: [
        'Transparent regarding edge case limitations',
        'Articulates privacy and safety considerations',
      ],
    },
  ],
};
