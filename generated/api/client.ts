/* eslint-disable */
// GENERATED CODE - do not edit by hand.
// Generator: tools/kev-api-client/generate.cjs (pure Node, no Java).
// Spec: src/generated/api/openapi.json | Scope: /xr/*
// Regenerate: npm run api:client  |  Drift gate: npm run api:drift

import type {
  BiomeAnalyzeRequest,
  BoardAppendRequest,
  BoardClearRequest,
  BoardSetRequest,
  BriefRequest,
  ChallengeScoreRequest,
  ChallengeSubmitRequest,
  ChatSendRequest,
  ChatSender,
  LabTutorRequest,
  LessonEndRequest,
  LessonJoinRequest,
  LessonLeaveRequest,
  LessonStartRequest,
  MarkRequest,
  MissionCheckRequest,
  PlethSimulateRequest,
  SummarizeRequest,
  TutorAskRequest,
} from './types';

export interface KevClientConfig {
  /** API base, e.g. '/api' behind the Vite proxy or 'http://localhost:8000'. */
  basePath: string;
  /** Auth headers (Auth0 bearer + dev-bypass role headers), called per request. */
  headers?: () => Record<string, string>;
  /** Injectable fetch for tests. */
  fetchImpl?: typeof fetch;
}

async function send<T>(
  config: KevClientConfig,
  method: string,
  path: string,
  opts?: { query?: Record<string, unknown>; body?: unknown }
): Promise<T> {
  const impl = config.fetchImpl || fetch;
  const url = new URL(path.replace(/^\//, ''), config.basePath.replace(/\/$/, '') + '/');
  for (const [key, value] of Object.entries(opts?.query || {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  const headers: Record<string, string> = { ...(config.headers ? config.headers() : {}) };
  const init: RequestInit = { method, headers };
  if (opts?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }
  const response = await impl(url.toString(), init);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const parsed = (await response.json()) as { detail?: string };
      if (parsed?.detail) detail = parsed.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`KEV API ${method} ${path} failed: ${response.status} ${detail}`);
  }
  return (await response.json()) as T;
}

export function createKevXrClient(config: KevClientConfig) {
  const request = <T>(method: string, path: string, opts?: { query?: Record<string, unknown>; body?: unknown }) =>
    send<T>(config, method, path, opts);

  return {
  /** GET /xr/analytics/global-benchmarks - Xr Global Benchmarks */
  analyticsGlobalBenchmarks: () =>
    request<unknown>("GET", '/xr/analytics/global-benchmarks'),

  /** POST /xr/biome/analyze - Biome Analyze */
  biomeAnalyzePost: (body: BiomeAnalyzeRequest) =>
    request<unknown>("POST", '/xr/biome/analyze', { body }),

  /** GET /xr/biome/missions - Biome Missions */
  biomeMissions: () =>
    request<unknown>("GET", '/xr/biome/missions'),

  /** POST /xr/biome/missions/check - Biome Mission Check */
  biomeMissionsCheckPost: (body: MissionCheckRequest) =>
    request<unknown>("POST", '/xr/biome/missions/check', { body }),

  /** GET /xr/biome/specimens - Biome Specimens */
  biomeSpecimens: () =>
    request<unknown>("GET", '/xr/biome/specimens'),

  /** POST /xr/briefs - Briefs */
  briefsPost: (body: BriefRequest) =>
    request<unknown>("POST", '/xr/briefs', { body }),

  /** GET /xr/campus/chat/messages - Xr Chat Messages */
  campusChatMessages: (args: { 'roomId'?: string; 'viewer'?: string | unknown }) =>
    request<unknown>("GET", '/xr/campus/chat/messages', { query: { 'roomId': args['roomId'], 'viewer': args['viewer'] } }),

  /** POST /xr/campus/chat/send - Xr Chat Send */
  campusChatSendPost: (body: ChatSendRequest) =>
    request<unknown>("POST", '/xr/campus/chat/send', { body }),

  /** GET /xr/campus/classes/{class_id} - Xr Campus Classroom */
  campusClassesClassId: (args: { 'class_id': string }) =>
    request<unknown>("GET", `/xr/campus/classes/${encodeURIComponent(String(args['class_id']))}`),

  /** GET /xr/campus/floors - Xr Campus Floors */
  campusFloors: (args: { 'scope'?: string }) =>
    request<unknown>("GET", '/xr/campus/floors', { query: { 'scope': args['scope'] } }),

  /** GET /xr/campus/hallway - Xr Campus Hallway */
  campusHallway: () =>
    request<unknown>("GET", '/xr/campus/hallway'),

  /** GET /xr/campus/live-facilities - Xr Live Facilities */
  campusLiveFacilities: () =>
    request<unknown>("GET", '/xr/campus/live-facilities'),

  /** GET /xr/campus/school - Xr Campus School */
  campusSchool: () =>
    request<unknown>("GET", '/xr/campus/school'),

  /** GET /xr/campus/subject-wings - Xr Campus Subject Wings */
  campusSubjectWings: (args: { 'subject'?: string | unknown }) =>
    request<unknown>("GET", '/xr/campus/subject-wings', { query: { 'subject': args['subject'] } }),

  /** GET /xr/campus/virtual-school - Xr Campus Virtual School */
  campusVirtualSchool: () =>
    request<unknown>("GET", '/xr/campus/virtual-school'),

  /** GET /xr/challenges/daily - Challenge Daily */
  challengesDaily: () =>
    request<unknown>("GET", '/xr/challenges/daily'),

  /** POST /xr/challenges/score - Challenge Score */
  challengesScorePost: (body: ChallengeScoreRequest) =>
    request<unknown>("POST", '/xr/challenges/score', { body }),

  /** POST /xr/challenges/submit - Challenge Submit */
  challengesSubmitPost: (body: ChallengeSubmitRequest) =>
    request<unknown>("POST", '/xr/challenges/submit', { body }),

  /** GET /xr/challenges/xp - Challenge Xp */
  challengesXp: (args: { 'student': string }) =>
    request<unknown>("GET", '/xr/challenges/xp', { query: { 'student': args['student'] } }),

  /** GET /xr/cohorts - Xr Cohorts */
  cohorts: () =>
    request<unknown>("GET", '/xr/cohorts'),

  /** GET /xr/curriculum/shared - Xr Curriculum Shared */
  curriculumShared: () =>
    request<unknown>("GET", '/xr/curriculum/shared'),

  /** POST /xr/curriculum/summarize - Summarize */
  curriculumSummarizePost: (body: SummarizeRequest) =>
    request<unknown>("POST", '/xr/curriculum/summarize', { body }),

  /** GET /xr/health - Xr Health */
  health: () =>
    request<unknown>("GET", '/xr/health'),

  /** GET /xr/lessons/{lesson_id} - Xr Lesson Get */
  lessonsLessonId: (args: { 'lesson_id': string; 'viewer'?: string | unknown }) =>
    request<unknown>("GET", `/xr/lessons/${encodeURIComponent(String(args['lesson_id']))}`, { query: { 'viewer': args['viewer'] } }),

  /** GET /xr/lessons/{lesson_id}/board - Xr Board Get */
  lessonsLessonIdBoard: (args: { 'lesson_id': string }) =>
    request<unknown>("GET", `/xr/lessons/${encodeURIComponent(String(args['lesson_id']))}/board`),

  /** PUT /xr/lessons/{lesson_id}/board - Xr Board Set */
  lessonsLessonIdBoardPut: (args: { 'lesson_id': string }, body: BoardSetRequest) =>
    request<unknown>("PUT", `/xr/lessons/${encodeURIComponent(String(args['lesson_id']))}/board`, { body }),

  /** POST /xr/lessons/{lesson_id}/board/append - Xr Board Append */
  lessonsLessonIdBoardAppendPost: (args: { 'lesson_id': string }, body: BoardAppendRequest) =>
    request<unknown>("POST", `/xr/lessons/${encodeURIComponent(String(args['lesson_id']))}/board/append`, { body }),

  /** POST /xr/lessons/{lesson_id}/board/clear - Xr Board Clear */
  lessonsLessonIdBoardClearPost: (args: { 'lesson_id': string }, body: BoardClearRequest) =>
    request<unknown>("POST", `/xr/lessons/${encodeURIComponent(String(args['lesson_id']))}/board/clear`, { body }),

  /** POST /xr/lessons/{lesson_id}/end - Xr Lessons End */
  lessonsLessonIdEndPost: (args: { 'lesson_id': string }, body: LessonEndRequest) =>
    request<unknown>("POST", `/xr/lessons/${encodeURIComponent(String(args['lesson_id']))}/end`, { body }),

  /** POST /xr/lessons/{lesson_id}/join - Xr Lessons Join */
  lessonsLessonIdJoinPost: (args: { 'lesson_id': string }, body: LessonJoinRequest) =>
    request<unknown>("POST", `/xr/lessons/${encodeURIComponent(String(args['lesson_id']))}/join`, { body }),

  /** POST /xr/lessons/{lesson_id}/leave - Xr Lessons Leave */
  lessonsLessonIdLeavePost: (args: { 'lesson_id': string }, body: LessonLeaveRequest) =>
    request<unknown>("POST", `/xr/lessons/${encodeURIComponent(String(args['lesson_id']))}/leave`, { body }),

  /** POST /xr/lessons/{lesson_id}/marks - Xr Mark Set */
  lessonsLessonIdMarksPost: (args: { 'lesson_id': string }, body: MarkRequest) =>
    request<unknown>("POST", `/xr/lessons/${encodeURIComponent(String(args['lesson_id']))}/marks`, { body }),

  /** GET /xr/lessons/live - Xr Lessons Live */
  lessonsLive: (args: { 'cohort'?: string | unknown }) =>
    request<unknown>("GET", '/xr/lessons/live', { query: { 'cohort': args['cohort'] } }),

  /** POST /xr/lessons/start - Xr Lessons Start */
  lessonsStartPost: (body: LessonStartRequest) =>
    request<unknown>("POST", '/xr/lessons/start', { body }),

  /** GET /xr/levels - Xr Levels */
  levels: () =>
    request<unknown>("GET", '/xr/levels'),

  /** GET /xr/marks/mine - Xr Marks Mine */
  marksMine: (args: { 'student': string }) =>
    request<unknown>("GET", '/xr/marks/mine', { query: { 'student': args['student'] } }),

  /** POST /xr/pleth/simulate - Pleth Simulate */
  plethSimulatePost: (body: PlethSimulateRequest) =>
    request<unknown>("POST", '/xr/pleth/simulate', { body }),

  /** GET /xr/pleth/sites - Pleth Sites */
  plethSites: () =>
    request<unknown>("GET", '/xr/pleth/sites'),

  /** GET /xr/study-path - Xr Study Path */
  studyPath: (args: { 'completed'?: string; 'level'?: string | unknown }) =>
    request<unknown>("GET", '/xr/study-path', { query: { 'completed': args['completed'], 'level': args['level'] } }),

  /** GET /xr/subjects - Xr Subjects */
  subjects: (args: { 'level'?: string | unknown }) =>
    request<unknown>("GET", '/xr/subjects', { query: { 'level': args['level'] } }),

  /** GET /xr/teacher/materials - Xr Teacher Materials */
  teacherMaterials: (args: { 'subject'?: string | unknown; 'cohort'?: string | unknown }) =>
    request<unknown>("GET", '/xr/teacher/materials', { query: { 'subject': args['subject'], 'cohort': args['cohort'] } }),

  /** GET /xr/tiers - Tiers */
  tiers: () =>
    request<unknown>("GET", '/xr/tiers'),

  /** POST /xr/tutor - Xr Lab Tutor */
  tutorPost: (body: LabTutorRequest) =>
    request<unknown>("POST", '/xr/tutor', { body }),

  /** GET /xr/tutors - Xr Tutors */
  tutors: () =>
    request<unknown>("GET", '/xr/tutors'),

  /** POST /xr/tutors/ask - Xr Tutors Ask */
  tutorsAskPost: (body: TutorAskRequest) =>
    request<unknown>("POST", '/xr/tutors/ask', { body }),

  /** GET /xr/world/languages - Xr World Languages */
  worldLanguages: (args: { 'country'?: string | unknown; 'q'?: string | unknown }) =>
    request<unknown>("GET", '/xr/world/languages', { query: { 'country': args['country'], 'q': args['q'] } }),
  };
}

export type KevXrClient = ReturnType<typeof createKevXrClient>;
