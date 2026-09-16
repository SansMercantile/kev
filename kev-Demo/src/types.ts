export type LabId = 'chemistry' | 'astrophysics' | 'biology' | 'optics';

export type ViewMode = 'campus' | 'labs' | 'classroom' | 'curriculum' | 'notebook' | 'dashboard' | 'sports' | 'physics' | 'visitors';

export type XRMode = 'standard' | 'ar' | 'vr-stereoscopic';

export interface MoleculePreset {
  id: string;
  name: string;
  formula: string;
  description: string;
  atoms: { element: 'H' | 'C' | 'O' | 'N' | 'Cl'; pos: [number, number, number]; label: string }[];
  bonds: { from: number; to: number; order: 1 | 2 | 3 }[];
  geometry: string;
  bondAngle: string;
  dipoleMoment: string;
  funFact: string;
}

export interface CelestialBody {
  id: string;
  name: string;
  mass: number;
  radius: number;
  color: string;
  pos: [number, number, number];
  vel: [number, number, number];
  trail: [number, number, number][];
  isStar?: boolean;
}

export interface Organelle {
  id: string;
  name: string;
  tagline: string;
  function: string;
  sizeNanometers: string;
  color: string;
  pos: [number, number, number];
  scale: [number, number, number];
  atpImpact: string;
  details: string[];
}

export interface OpticalSetup {
  laserAngleDeg: number;
  laserWavelengthNm: number;
  laserColorHex: string;
  prismRefractiveIndex: number;
  environmentRefractiveIndex: number;
  prismAngleDeg: number;
}

export interface Course {
  id: string;
  title: string;
  category: 'Chemistry' | 'Physics' | 'Biology' | 'Optics' | 'AI & Digital';
  gradeLevel: string;
  durationMinutes: number;
  associatedLab: LabId;
  summary: string;
  iconName: string;
  color: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  estimatedMinutes: number;
  overview: string;
  objectives: string[];
  keyTerms: { term: string; definition: string }[];
  labTask: string;
  labSuggestedSettings?: Record<string, any>;
  quizQuestions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LabSnapshot {
  id: string;
  timestamp: string;
  labId: LabId;
  labName: string;
  imageDataUrl?: string;
  note: string;
  measurements: Record<string, string | number>;
}

export interface StudentStats {
  name: string;
  grade: string;
  xp: number;
  completedLabsCount: number;
  quizzesPassedCount: number;
  badges: string[];
  avatar?: AvatarConfig;
  studyMinutesTotal?: number;
  gpa?: number;
  overallGrade?: string;
  academicRank?: string;
  remedialCompletedCount?: number;
  focusTimerBestMinutes?: number;
  unlockedEquipmentIds?: string[];
  equippedToolId?: string;
  isAvailableForTutoring?: boolean;
  tutoringSpecialties?: string[];
  streakDays?: number;
  lastActiveDate?: string;
  customToolSkins?: Record<string, string>;
}

export interface SubjectGrade {
  subject: string;
  subjectId: LabId | 'methodology';
  letterGrade: string;
  percentage: number;
  practicalScore: number;
  theoryScore: number;
  quizScore: number;
  trend: 'up' | 'stable' | 'down';
  teacherComment: string;
}

export interface AcademicPromotion {
  rankId: string;
  rankTitle: string;
  levelRequired: number;
  xpRequired: number;
  labsRequired: number;
  badgeRequired?: string;
  perk: string;
  isCurrent: boolean;
  isUnlocked: boolean;
}

export interface RemedialActivity {
  id: string;
  title: string;
  subject: string;
  labId: LabId;
  concept: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpReward: number;
  completed: boolean;
  summary: string;
  commonMistake: string;
  conceptLaw: string;
  interactiveType: 'vsepr_slider' | 'kepler_calc' | 'snell_refract' | 'dna_pair';
}

export interface DailyActivityPoint {
  date: string;
  dayNumber: number;
  labCompletions: number;
  cumulativeCompletions: number;
  studyMinutes: number;
  xpEarned: number;
  milestone?: string;
}

export interface CampusFacility {
  id: string;
  roomNumber: string;
  name: string;
  type: 'lab' | 'auditorium' | 'lounge' | 'faculty_office' | 'observatory' | 'cleanroom' | 'gallery' | 'reception' | 'courtyard';
  associatedLabId?: LabId;
  tutorInResidence?: string;
  description: string;
  interactActionLabel: string;
  coordinates: { x: number; z: number };
}

export interface CampusFloor {
  floorNumber: 1 | 2 | 3 | 4;
  name: string;
  subtitle: string;
  color: string;
  facilities: CampusFacility[];
}

export interface TutorProfile {
  id: string;
  name: string;
  title: string;
  discipline: string;
  avatar: string;
  status: string;
  floor: 1 | 2 | 3 | 4;
  location: string;
  rating: number;
  studentsGuided: number;
  specialties: string[];
  systemVoice: string;
}

export interface GlobalBenchmarks {
  totalGlobalStudents: number;
  activeCampuses: number;
  globalAverages: {
    averageXP: number;
    medianXP: number;
    top10PercentileXP: number;
    top1PercentileXP: number;
    overallLabCompletionRate: number;
    quizzesPassedAverage: number;
    averageBadgesCount: number;
    dailyMissionCompletionRate: number;
  };
  subjectCompletionRates: {
    chemistry: number;
    astrophysics: number;
    biology: number;
    optics: number;
  };
  regionalCohorts: {
    region: string;
    studentCount: number;
    averageXP: number;
    completionRate: number;
  }[];
  xpPercentileCurve: {
    percentile: string;
    xp: number;
  }[];
}

export interface AvatarConfig {
  archetype: 'cyber-scholar' | 'astro-pioneer' | 'molecular-bio' | 'quantum-physicist' | 'nano-tech';
  visorType: 'holo-visor' | 'dual-xr' | 'neural-optics' | 'classic-goggles' | 'data-hud';
  primaryColor: string;
  glowColor: string;
  glowEffect: 'pulse' | 'orbital' | 'ion-field' | 'quantum-flux' | 'aurora';
  accessory: 'lead-researcher-badge' | 'orbital-compass' | 'molecular-pipette' | 'stellar-chronometer' | 'hologram-pad';
  suitPattern: 'hex-grid' | 'carbon-weave' | 'circuit' | 'minimal';
  name: string;
  photoUrl?: string;
  renderStyle?: 'photorealistic' | 'holographic';
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: {
    id: string;
    name: string;
    avatar: AvatarConfig;
    isFaculty?: boolean;
  };
  text: string;
  timestamp: string;
  reaction?: string;
}

export interface ChatPeer {
  id: string;
  name: string;
  roomId: string;
  avatar: AvatarConfig;
  status: 'active' | 'in_lab' | 'studying' | 'idle';
  currentActivity?: string;
}

export interface StreakDayStatus {
  date: string;
  dayLabel: string;
  dayOfMonth: number;
  completed: boolean;
  isToday: boolean;
  xpEarned?: number;
}

export interface DailyStreakData {
  currentStreakDays: number;
  longestStreakDays: number;
  lastCompletedDate: string;
  currentMultiplier: number;
  multiplierTierName: string;
  nextTierStreakRequired: number;
  nextTierMultiplier: number;
  freezeTokensRemaining: number;
  weekHistory: StreakDayStatus[];
}

export interface PeerMentor {
  id: string;
  name: string;
  grade: string;
  xp: number;
  level: number;
  avatar: AvatarConfig;
  isAvailableForTutoring: boolean;
  specialties: (LabId | 'methodology' | 'vsepr' | 'kepler' | 'snell')[];
  specialtyLabels: string[];
  bio: string;
  rating: number;
  sessionsCompleted: number;
  campusFloor: 1 | 2 | 3 | 4;
  campusFacilityName: string;
  status: 'available' | 'busy' | 'offline';
}

export interface PeerStudyRequest {
  id: string;
  fromStudentId: string;
  fromStudentName: string;
  fromStudentAvatar?: AvatarConfig;
  toMentorId: string;
  toMentorName: string;
  subject: LabId | 'general';
  topic: string;
  sessionType: 'instant_sprint' | 'scheduled_lab' | 'concept_review';
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  meetingLocation: string;
}

export interface LabEquipment {
  id: string;
  name: string;
  category: LabId | 'multi_discipline';
  tagline: string;
  description: string;
  costXP: number;
  tier: 'Advanced' | 'Elite' | 'Quantum' | 'Prototype';
  icon: string;
  dataAnalysisFeatures: string[];
  telemetryStats: { label: string; value: string; boost: string }[];
  isPurchased?: boolean;
  isEquipped?: boolean;
}

export interface ToolSkinCustomization {
  id: string;
  name?: string;
  skinName?: string;
  toolName?: string;
  toolId?: string;
  toolType?: string;
  costXP?: number;
  xpPrice?: number;
  tier?: 'Rare' | 'Epic' | 'Legendary';
  previewGradient?: string;
  accentColor: string;
  glowColor?: string;
  texturePattern: 'carbon' | 'neon-circuit' | 'titanium-frost' | 'solar-flare' | 'aurora-borealis' | 'holographic' | 'neon_glow' | 'metallic' | 'carbon_fiber';
  description: string;
  specularMultiplier?: string;
  isUnlocked?: boolean;
  unlocked?: boolean;
}

export interface CareerPath {
  id: string;
  title: string;
  industry: string;
  matchScore: number;
  description: string;
  salaryRange: string;
  educationDegree: string;
  foundationalSubjects: LabId[];
  keySkills: string[];
  recommendedNextLabs: {
    labId: LabId;
    title: string;
    focus: string;
  }[];
  industryPartners: string[];
  careerOutlook: string;
}

export interface LibraryPublication {
  id: string;
  title: string;
  originalTitle?: string;
  authors: string;
  year: number;
  type: 'classic_textbook' | 'seminal_paper' | 'modern_review';
  associatedLab: LabId;
  coverGradient: string;
  pagesCount: number;
  summary: string;
  historicalContext: string;
  keyFormulas: {
    formula: string;
    symbolMeanings: string;
    application: string;
  }[];
  fullExcerpt: string;
  citation: string;
  academicImpact: string;
}

export interface MatchmakingLobby {
  id: string;
  sport: 'swimming' | 'basketball' | 'tennis' | 'volleyball';
  sportName: string;
  roomName: string;
  hostName: string;
  hostAvatarColor: string;
  playersCount: number;
  maxPlayers: number;
  pingMs: number;
  status: 'open' | 'in_progress' | 'countdown';
  arenaFloor: string;
}

export interface PhysicsEnvironmentConfig {
  gravity: number;
  airResistance: number;
  friction: number;
  elasticity: number;
  surfaceElasticity?: number;
  surfaceFriction?: number;
  timeScale: number;
  presetName: 'earth' | 'moon' | 'mars' | 'jupiter' | 'deep_space' | 'underwater';
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  category: 'tournament' | 'maintenance' | 'event' | 'academic';
  timestamp: string;
  urgent?: boolean;
  urgency?: 'low' | 'medium' | 'normal' | 'high' | 'urgent';
  details?: string;
  actionLabel?: string;
  actionTarget?: 'tournaments' | 'sports' | 'library' | 'campus' | 'labs';
  linkAction?: string;
}

export interface GlobalTournamentEvent {
  id: string;
  title: string;
  subject: LabId | 'physics' | 'all';
  startsAt: string;
  endsAt: string;
  timeRemaining?: string;
  status?: 'live' | 'upcoming' | 'concluded';
  participantsCount?: number;
  registeredCount?: number;
  prizeXP?: number;
  xpReward?: number;
  prizeBadge?: string;
  prizeItem?: string;
  description: string;
  rules: string[];
  targetObjective?: string;
  isRegistered?: boolean;
  topLeaderboard?: {
    rank: number;
    studentName: string;
    academy: string;
    score: number;
    avatarColor: string;
    isCurrentUser?: boolean;
  }[];
  leaderboard?: {
    rank: number;
    name?: string;
    studentName?: string;
    academy?: string;
    campus?: string;
    school?: string;
    score: number;
    avatarColor?: string;
    avatar?: string;
    isUser?: boolean;
    isCurrentUser?: boolean;
  }[];
}

export interface StudyGoalMilestone {
  id: string;
  percent: number; // 25, 50, 75, 100, 125
  title: string;
  subtitle: string;
  bonusXP: number;
  badgeName?: string;
  iconName: string;
}

export interface WeeklyStudyGoalData {
  targetXP: number;
  currentWeeklyXP: number;
  focusDiscipline: string;
  weekLabel: string;
  daysRemaining: number;
  claimedMilestoneIds: string[];
  lastUpdatedDate: string;
  pastWeeksHistory: {
    weekLabel: string;
    targetXP: number;
    achievedXP: number;
    completed: boolean;
    percentage: number;
  }[];
}

// Visitors Portal & Admissions Types
export type StudyLevel = 'elementary' | 'middle' | 'high' | 'university' | 'professional';

export type CampusFloorLevelId = 'basement' | 'ground' | 'first' | 'second' | 'third' | 'roof';

export interface AdmissionStudentDetails {
  fullName: string;
  preferredName: string;
  dateOfBirth: string;
  genderOrPronouns: string;
  gradeLevel: 'Elementary (K-5)' | 'Middle School (6-8)' | 'High School (9-12)' | 'University Undergraduate' | 'Professional & Graduate';
  studyLevel: StudyLevel;
  primaryInterests: string[];
  priorExperienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Honors Scholar';
  dietaryPreferences: string[];
  accessibilityNeeds: string[];
  studentEmail: string;
  studentPhone: string;
  intendedStartDate: string;
}

export interface AdmissionGuardianDetails {
  primaryGuardianName: string;
  relationship: 'Mother' | 'Father' | 'Legal Guardian' | 'Grandparent' | 'Foster Parent' | 'Other';
  guardianEmail: string;
  guardianPhone: string;
  occupation: string;
  residentialAddress: string;
  city: string;
  country: string;
  timezone: string;
  secondaryGuardianName?: string;
  secondaryRelationship?: string;
  secondaryPhone?: string;
  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  notificationFrequency: 'daily_digest' | 'weekly_summary' | 'milestones_only';
  notificationChannels: ('email' | 'sms' | 'portal_inbox')[];
  vrUsageConsent: boolean;
  avatarAndPrivacyConsent: boolean;
  academicHonorCodeAgreed: boolean;
  digitalSignature: string;
  signatureDate: string;
}

export interface AdmissionApplication {
  id: string;
  studentId: string;
  applicationNumber: string;
  submissionDate: string;
  status: 'Admitted - Official' | 'Under Review' | 'Honor Scholar Admitted';
  student: AdmissionStudentDetails;
  guardian: AdmissionGuardianDetails;
  assignedCampusFloor: string;
  assignedTutor: string;
  virtualLockerNumber: string;
  rfidPassCode: string;
  initialXPAwarded: number;
  notes?: string;
}

export interface FloorArchitectureFacility {
  id: string;
  level: CampusFloorLevelId;
  levelDisplayName: string;
  facility: string;
  type: 'common_area' | 'office' | 'cafeteria' | 'library' | 'classroom' | 'laboratory' | 'computer_lab' | 'music_room' | 'art_studio' | 'auditorium' | 'lecture_hall' | 'gymnasium';
  capacity: number;
  equipmentAndTools: string[];
  description: string;
  status: 'Open' | 'Active Session' | 'Available for Tour' | 'Under Construction';
  interactivePreviewId?: string;
}

export interface CampusFloorTheme {
  level: CampusFloorLevelId;
  levelDisplayName: string;
  themeAndSubject: string;
  order: number;
  color: string;
  badge: string;
  description: string;
  facilitiesCount: number;
  facilities: FloorArchitectureFacility[];
}

export interface HistoricLibraryTreatise {
  id: string;
  title: string;
  author: string;
  year: number;
  discipline: 'Optics' | 'Genetics' | 'Astrophysics' | 'Chemistry' | 'Quantum Physics';
  summary: string;
  fullExcerpt: string;
  historicalSignificance: string;
  modernXRLabConnection: string;
  coverAccent: string;
}

export interface AcademyVirtualToolItem {
  id: string;
  name: string;
  discipline: 'chemistry' | 'astrophysics' | 'biology' | 'optics' | 'multi-discipline';
  associatedLabId?: LabId;
  description: string;
  precisionRating: string;
  keyCapability: string;
  iconName: string;
  defaultSkin: string;
}

export interface AcademyToolSkinItem {
  id: string;
  name: string;
  toolTarget: string;
  themeStyle: string;
  previewColors: [string, string, string];
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  visualEffectDescription: string;
  unlockedByDefault: boolean;
}

// -------------------------------------------------------------
// ADAPTIVE SCIENCE BRIEFS & MULTI-TIER TUTORING
// -------------------------------------------------------------
export type EducationTier = 'middle_school' | 'high_school' | 'ap_honors' | 'university';

export interface EducationTierInfo {
  id: EducationTier;
  label: string;
  shortBadge: string;
  targetGrades: string;
  lexileLevel: string;
  mathRigor: string;
  description: string;
}

// -------------------------------------------------------------
// XR SCIENCE TWIN CHALLENGE (Daily Lab Calibration)
// -------------------------------------------------------------
export interface ScienceTwinTarget {
  id: string;
  labId: LabId;
  title: string;
  scientificFormulaOrName: string;
  description: string;
  targetPhenomenon: string;
  targetParameters: Record<string, number | string>;
  hintPrompt: string;
  pedagogicalSignificance: string;
}

export interface ScienceTwinEvaluationResult {
  similarityScore: number; // 0 - 100
  targetAchieved: boolean;
  awardedXP: number;
  parameterBreakdown: {
    parameter: string;
    targetValue: string | number;
    studentValue: string | number;
    matchPercentage: number;
    feedback: string;
  }[];
  physicsDeviationAnalysis: string;
  conceptualCritique: string;
}

// -------------------------------------------------------------
// EARTH & PLANETARY BIOME RECONNAISSANCE (Floor 3 Planetarium)
// -------------------------------------------------------------
export interface PlanetaryReconTarget {
  id: string;
  name: string;
  celestialBody: 'Earth' | 'Mars' | 'Europa' | 'Moon' | 'Titan' | 'Exoplanet';
  locationName: string;
  description: string;
  imageUrl: string;
  satelliteType: string;
  trueLatitude: number;
  solarZenithAngle: number;
  rockStrata: {
    primaryType: 'igneous' | 'sedimentary' | 'metamorphic';
    dominantMinerals: string[];
    formationProcess: string;
    erosionMechanisms: string[];
  };
  climateData: {
    koeppenCode: string;
    zoneName: string;
    surfacePressureAtm: number;
    meanTempC: number;
  };
  habitabilityScore: number; // 0 - 1.0 ESI
}

// -------------------------------------------------------------
// RESEARCH PAPER SUMMARIZER (Curriculum View)
// -------------------------------------------------------------
export interface ResearchPaperItem {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doiOrUrl: string;
  associatedLab: LabId;
  kidFriendlySummary: string;
  bigQuestion: string;
  keyHypotheses: string[];
  prerequisiteConcepts: {
    term: string;
    definition: string;
    whyItMatters: string;
  }[];
  suggestedVirtualExperiment: string;
}

// -------------------------------------------------------------
// STEP-BY-STEP LAB GUIDE
// -------------------------------------------------------------
export interface StepByStepGuideStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  targetElementId?: string;
  scientificMethodPhase: 'Observation' | 'Hypothesis' | 'Parameter Tuning' | 'Measurement' | 'Analysis';
  completionCriterion: string;
  hint: string;
}

// -------------------------------------------------------------
// WEEKLY LAB CHALLENGES & COSMETIC BADGE VARIANTS
// -------------------------------------------------------------
export interface CosmeticBadgeVariant {
  id: string;
  name: string;
  rarity: 'Legendary' | 'Cosmic' | 'Holographic' | 'Chromatic';
  auraColor: string;
  textColor: string;
  borderColor: string;
  bgGradient: string;
  iconName: string;
  perkDescription: string;
}

export interface WeeklyLabChallengeItem {
  id: string;
  title: string;
  labId: LabId;
  subject: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Mastery' | 'Grandmaster';
  objective: string;
  targetParameterCriteria: string;
  scientificContext: string;
  xpReward: number;
  cosmeticBadge: CosmeticBadgeVariant;
  completed: boolean;
  expiresInDays: number;
  currentProgressPercent: number;
}

// -------------------------------------------------------------
// SOCIAL DISCOVERY FEED (Learner Science Network)
// -------------------------------------------------------------
export interface DiscoveryReaction {
  id: string;
  type: 'brilliant' | 'verified' | 'novel' | 'clean';
  label: string;
  icon: string;
  count: number;
  userReacted?: boolean;
}

export interface DiscoveryComment {
  id: string;
  authorName: string;
  authorAvatar?: AvatarConfig;
  gradeOrCohort: string;
  timestamp: string;
  text: string;
}

export interface DiscoveryPost {
  id: string;
  studentName: string;
  studentAvatar?: AvatarConfig;
  gradeLevel: string;
  timestamp: string;
  labId: LabId;
  labTitle: string;
  title: string;
  summary: string;
  imageDataUrl: string;
  measurements: Record<string, string | number>;
  hypothesisConfirmed: boolean;
  tags: string[];
  kudosCount: number;
  userLiked?: boolean;
  reactions: DiscoveryReaction[];
  comments: DiscoveryComment[];
  replicationPrompt?: string;
}

// -------------------------------------------------------------
// LAB WORKBENCH CUSTOMIZER & SIMULATION EFFICIENCY UPGRADES
// -------------------------------------------------------------

export type WorkbenchSurface = 'porcelain' | 'titanium' | 'carbon_weave' | 'holo_grid' | 'scholar_wood';
export type WorkbenchLighting = 'cyan_ion' | 'amber_stellar' | 'emerald_bio' | 'violet_quantum' | 'aurora_borealis';

export interface WorkbenchFunctionalUpgrade {
  id: string;
  name: string;
  category: 'computation' | 'precision' | 'xp_yield' | 'energy_stability';
  targetEquipment: string; // 'all' or equipment id
  tier: 'MK-I' | 'MK-II' | 'MK-III' | 'Quantum-Overclock';
  level: number;
  maxLevel: number;
  costXP: number;
  unlocked: boolean;
  equipped: boolean;
  efficiencyBonusPercent: number; // e.g., +15%
  precisionBoostPercent: number;  // e.g., +20%
  speedMultiplier: number;        // e.g., 1.25x
  xpMultiplierBonus: number;      // e.g., +0.10 (10%)
  description: string;
  perkEffect: string;
  icon: string;
}

export interface WorkbenchCosmeticCustomization {
  id: string;
  name: string;
  category: 'tool_shader' | 'desk_surface' | 'ambient_lighting' | 'hologram_emblem';
  costXP: number;
  unlocked: boolean;
  equipped: boolean;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  previewColor: string;
  gradient: string;
  description: string;
  visualEffectDescription: string;
  appliedTarget?: string;
}

export interface WorkbenchEfficiencyStats {
  totalSimulationEfficiency: number; // e.g. 150%
  totalPrecisionBoost: number;        // e.g. +35%
  totalComputeAcceleration: number;  // e.g. 1.45x
  totalXPYieldBonus: number;         // e.g. +25%
  activeUpgradesCount: number;
}

export interface WorkbenchCustomizerState {
  deskSurface: WorkbenchSurface;
  ambientLighting: WorkbenchLighting;
  equippedToolId: string;
  equippedSkinIds: Record<string, string>; // toolType -> skinId
  unlockedSkinIds: string[];
  unlockedUpgradeIds: string[];
  upgradeLevels: Record<string, number>;   // upgradeId -> level
  equippedUpgradeIds: string[];
}



