/* eslint-disable */
// GENERATED CODE - do not edit by hand.
// Generator: tools/kev-api-client/generate.cjs (pure Node, no Java).
// Spec: src/generated/api/openapi.json | Scope: /xr/*
// Regenerate: npm run api:client  |  Drift gate: npm run api:drift

export interface BiomeAnalyzeRequest {
  /** Specimenid */
  specimenId?: string | unknown;
  /** Evidence */
  evidence?: Record<string, unknown>;
}

export interface BoardAppendRequest {
  /** Teachername */
  teacherName: string;
  /** Kind */
  kind: string;
  /** Payload */
  payload?: Record<string, unknown>;
}

export interface BoardClearRequest {
  /** Teachername */
  teacherName: string;
}

export interface BoardSetRequest {
  /** Teachername */
  teacherName: string;
  /** Items */
  items?: (Record<string, unknown>)[];
}

export interface BriefRequest {
  /** Labid */
  labId: string;
  /** Tier */
  tier?: string;
}

export interface ChallengeScoreRequest {
  /** Challengeid */
  challengeId: string;
  /** Params */
  params?: Record<string, number>;
  /** Description */
  description?: string;
}

export interface ChallengeSubmitRequest {
  /** Challengeid */
  challengeId: string;
  /** Params */
  params?: Record<string, number>;
  /** Description */
  description?: string;
  /** Student */
  student: string;
}

export interface ChatSendRequest {
  /** Roomid */
  roomId: string;
  sender: ChatSender;
  /** Text */
  text: string;
  /** Reaction */
  reaction?: string | unknown;
}

export interface ChatSender {
  /** Id */
  id?: string;
  /** Name */
  name?: string;
  /** Avatar */
  avatar?: unknown;
  /** Isfaculty */
  isFaculty?: boolean | unknown;
  /** Role */
  role?: string | unknown;
  /** Cohort */
  cohort?: string | unknown;
}

export interface LabTutorRequest {
  /** Question */
  question?: string | unknown;
  /** Currentlab */
  currentLab?: string | unknown;
  /** Context */
  context?: string | unknown;
  /** Simulationstate */
  simulationState?: unknown;
  /** Studentlevel */
  studentLevel?: string | unknown;
  /** Language */
  language?: string | unknown;
  /** Tier */
  tier?: string | unknown;
}

export interface LessonEndRequest {
  /** Teachername */
  teacherName: string;
}

export interface LessonJoinRequest {
  /** Name */
  name: string;
  /** Role */
  role?: string | unknown;
  /** Cohort */
  cohort?: string | unknown;
  /** Level */
  level?: string | unknown;
}

export interface LessonLeaveRequest {
  /** Name */
  name: string;
}

export interface LessonStartRequest {
  /** Teachername */
  teacherName: string;
  /** Title */
  title?: string;
  /** Cohort */
  cohort?: string | unknown;
  /** Classid */
  classId?: string | unknown;
  /** Subjectid */
  subjectId?: string | unknown;
}

export interface MarkRequest {
  /** Teachername */
  teacherName: string;
  /** Studentname */
  studentName: string;
  /** Score */
  score: number;
  /** Note */
  note?: string;
}

export interface MissionCheckRequest {
  /** Latitude */
  latitude: number;
  /** Dayofyear */
  dayOfYear?: number | unknown;
  /** Noonzenithdeg */
  noonZenithDeg?: number | unknown;
}

export interface PlethSimulateRequest {
  /** Site */
  site?: string;
  /** Wavelength */
  wavelength?: string;
  /** Heartrate */
  heartRate?: number;
  /** Perfusion */
  perfusion?: number;
  /** Compliance */
  compliance?: number;
  /** Respirationrate */
  respirationRate?: number;
  /** Motion */
  motion?: number;
  /** Skintone */
  skinTone?: number;
}

export interface SummarizeRequest {
  /** Url */
  url?: string | unknown;
  /** Text */
  text?: string | unknown;
  /** Tier */
  tier?: string;
}

export interface TutorAskRequest {
  /** Tutorid */
  tutorId?: string;
  /** Question */
  question?: string | unknown;
  /** Currentfloor */
  currentFloor?: number;
  /** Facilitycontext */
  facilityContext?: string;
  /** Studentlevel */
  studentLevel?: string;
  /** Simulationstate */
  simulationState?: unknown;
  /** Language */
  language?: string | unknown;
  /** Tier */
  tier?: string | unknown;
}
