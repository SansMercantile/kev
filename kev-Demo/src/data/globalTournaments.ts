import { GlobalTournamentEvent } from '../types';

export const GLOBAL_TOURNAMENT_EVENTS: GlobalTournamentEvent[] = [
  {
    id: 'tournament-vsepr-speedrun',
    title: 'Inter-Collegiate VSEPR Molecular Assembly Sprint',
    description: 'Construct 5 complex Lewis structures and predict 3D electron pair geometries with sub-10-second accuracy under simulated orbital perturbations.',
    subject: 'chemistry',
    startsAt: 'Live Now',
    endsAt: '48h 12m remaining',
    xpReward: 350,
    registeredCount: 412,
    isRegistered: false,
    rules: [
      'Assemble correct VSEPR geometries within 120 seconds total.',
      'Bonus multiplier awarded for zero bond-angle deviation.',
      'Top 10 finishers earn the Grand Molecular Alchemist trophy avatar skin.',
    ],
    leaderboard: [
      { rank: 1, studentName: 'Hana Takahashi (Tokyo Tech)', score: 9940, campus: 'East Asia Sector' },
      { rank: 2, studentName: 'Julian Alvarez (MIT)', score: 9810, campus: 'North America Sector' },
      { rank: 3, studentName: 'Elena Rostova (KEV XR)', score: 9750, campus: 'KEV Main Campus' },
      { rank: 4, studentName: 'Liam O’Connor (Oxford)', score: 9620, campus: 'Europe Sector' },
      { rank: 5, studentName: 'Sofia Mendes (USP)', score: 9540, campus: 'South America Sector' },
    ],
  },
  {
    id: 'tournament-orbital-slingshot',
    title: 'Interplanetary Gravitational Slingshot Cup',
    description: 'Calculate and execute minimum-delta-v multi-body gravitational assists around Jupiter and Saturn to reach interstellar escape velocity.',
    subject: 'astrophysics',
    startsAt: 'Tomorrow, 14:00 UTC',
    endsAt: 'Starts in 1d 4h',
    xpReward: 500,
    registeredCount: 289,
    isRegistered: true,
    rules: [
      'Delta-v budget capped at 4,200 m/s.',
      'Probe must pass through Io and Titan gravitational windows without atmospheric burnup.',
      'Telemetric trajectories verified by Keplerian physics engine.',
    ],
    leaderboard: [
      { rank: 1, studentName: 'Marcus Chen (KEV XR)', score: 10450, campus: 'KEV Main Campus' },
      { rank: 2, studentName: 'Amina Al-Mansoor (KAUST)', score: 10200, campus: 'Middle East Sector' },
      { rank: 3, studentName: 'Sven Lindqvist (KTH)', score: 9980, campus: 'Nordic Sector' },
    ],
  },
  {
    id: 'tournament-crispr-recombination',
    title: 'Synthetic Genomics CRISPR Optimization Derby',
    description: 'Design guide RNA sequences and repair double-strand breaks in cellular organelles while maintaining 99.9% base-pair fidelity.',
    subject: 'biology',
    startsAt: 'This Saturday',
    endsAt: 'Registration Open',
    xpReward: 400,
    registeredCount: 195,
    isRegistered: false,
    rules: [
      'Zero off-target cleavage tolerated in exons 1 through 4.',
      'Optimize ATP synthase phosphorylation rate under nutrient-depleted broth.',
    ],
    leaderboard: [
      { rank: 1, studentName: 'Chloe Dubois (Sorbonne)', score: 9400, campus: 'Europe Sector' },
      { rank: 2, studentName: 'Wei Zhang (Tsinghua)', score: 9310, campus: 'East Asia Sector' },
    ],
  },
];
