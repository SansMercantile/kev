export type LabId = 'chemistry' | 'astrophysics' | 'biology' | 'optics';

export type ViewMode = 'campus' | 'labs' | 'classroom' | 'curriculum' | 'notebook' | 'dashboard' | 'sports' | 'physics' | 'visitors' | 'challenge' | 'biome' | 'pulse' | 'quantum';

export type XRMode = 'standard' | 'ar' | 'vr-stereoscopic';

export interface MoleculePreset {
  id: string;
  name: string;
  formula: string;
  description: string;
  atoms: { element: 'H' | 'C' | 'O' | 'N' | 'Cl' | 'S'; pos: [number, number, number]; label: string }[];
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
  id?: string;
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

/**
 * Every room kind the school can contain.
 *
 * Originally this union held only the nine legacy atrium types. The consolidated
 * campus adds the Grand Concourse Hallway (floor 0), six subject wings
 * (floors 5-10) and the KEV International Virtual School building, whose rooms
 * come from the live `VirtualSchoolBuilding` and include classrooms, computer
 * labs, music rooms, art studios, a gymnasium, a cafeteria, a library,
 * workshops, seminar rooms, studios and lecture halls.
 *
 * Kept in sync with `SchoolRoomType` in `src/xr/data/schoolCampus.ts`, which is
 * generated from `backend/core/school_campus.py`. The `| (string & {})` tail
 * preserves literal autocomplete while tolerating a room type the backend adds
 * before the frontend is regenerated — a school that is data-driven must not
 * fail to render one unknown room.
 */
export type CampusRoomType =
  | 'lab' | 'auditorium' | 'lounge' | 'faculty_office' | 'observatory' | 'cleanroom'
  | 'gallery' | 'reception' | 'courtyard'
  // Hallway / circulation.
  | 'hallway' | 'kiosk' | 'portal' | 'elevator'
  // Teaching spaces.
  | 'classroom' | 'seminar_room' | 'lecture_hall' | 'computer_lab' | 'workshop'
  // Virtual-school facilities.
  | 'library' | 'gymnasium' | 'music_room' | 'art_studio' | 'cafeteria' | 'studio'
  | (string & {});

export interface CampusFacility {
  id: string;
  roomNumber: string;
  name: string;
  type: CampusRoomType;
  associatedLabId?: LabId;
  tutorInResidence?: string;
  description: string;
  interactActionLabel: string;
  coordinates: { x: number; z: number; y?: number };
  /** Accent colour for signage and lighting; falls back to the floor colour. */
  color?: string;
  /** Subject area, when the room belongs to a subject wing. */
  subject?: string;
  subjectDisplayName?: string;
  /** Class id for the 176 subject classes, when this room is a classroom. */
  classId?: string;
  /** Virtual-school metadata (live building payload). */
  level?: string;
  levelDisplayName?: string;
  capacity?: number | null;
  dimensions?: number[] | null;
  equipment?: string[];
  virtualTools?: string[];
  accessibilityFeatures?: string[];
  isBooked?: boolean;
  schoolFacilityType?: string;
  sourceFacilityId?: string;
}

/**
 * Floor numbers for the consolidated school.
 *
 *   0     Grand Concourse Hallway (circulation spine)
 *   1-4   the original XR wings — Grand Atrium & Commons, Chemistry &
 *         Molecular Sciences, Astrophysics & Quantum Photonics, Genomics &
 *         Cellular Biology / Grand XR Auditorium
 *   5     Mathematics & Computer Science
 *   6     Languages & Letters
 *   7     Humanities & Commerce
 *   8     Performing & Visual Arts
 *   9     Athletics & the KEV International Virtual School
 *   10    Trades & Frontiers
 */
export type CampusFloorNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface CampusFloor {
  floorNumber: CampusFloorNumber;
  name: string;
  subtitle: string;
  color: string;
  facilities: CampusFacility[];
  /** Discriminator used by the generated mirror. */
  kind?: 'hallway' | 'legacy_xr_wing' | 'subject_wing' | (string & {});
  isHallway?: boolean;
  subjectAreas?: string[];
  corridor?: { length: number; halfWidth: number; roomRowX: number; pitchZ: number };
  annex?: { classCount: number; subjects: string[]; note: string };
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
  /**
   * Gravity preset. `zero_g` is the free-fall preset the Physics Playground
   * actually offers and was missing from this union, so a fully-populated
   * config for it could not be expressed. `deep_space` and `underwater` are
   * retained for presets defined elsewhere.
   */
  presetName:
    | 'earth' | 'moon' | 'mars' | 'jupiter' | 'zero_g'
    | 'deep_space' | 'underwater';
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

// ---------------------------------------------------------------------------
// Consolidated campus model types (restored from kev-Demo/src/types.ts).
//
// These describe the *virtual school* half of KEV: the six building levels
// (basement -> roof) from `virtual_school/core/virtual_school_building.py`,
// its fourteen facilities, the visitor/admissions flow, and the study-goal
// and historic-library data the Visitors Portal renders. They were dropped
// when the demo was first ported into src/xr; nothing here is new.
// ---------------------------------------------------------------------------

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
