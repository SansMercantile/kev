import { BookOpenIcon, BrainCircuitIcon, ShieldCheckIcon, StarIcon, UsersIcon, ActivityIcon } from './icons.jsx'

export const heroFeatures = [
  {
    icon: BookOpenIcon,
    title: '185+ Standalone Subjects',
    description: 'Curriculum coverage for elementary through professional development across 185+ standalone disciplines.',
  },
  {
    icon: BrainCircuitIcon,
    title: 'Adaptive Learning Intelligence',
    description: 'AI-enhanced pathways optimize mastery, pacing, and subject recommendations in real time.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Governance-Ready Curriculum',
    description: 'Policy-aligned learning frameworks with accreditation, compliance, and institutional controls.',
  },
]

export const categoryBlocks = [
  {
    id: 'dream-based-education',
    title: 'Dream-Based Education',
    subtitle: 'Subconscious learning and lucid curriculum systems for immersive student growth.',
    color: '#ec4899',
    stats: '32 active agents',
    features: ['Lucid curriculum design', 'Dream classroom environments', 'Subconscious learning optimization'],
  },
  {
    id: 'education-knowledge',
    title: 'Education & Knowledge',
    subtitle: 'Core learning content, analytics, and knowledge graph management for institutions.',
    color: '#3b82f6',
    stats: '47 active agents',
    features: ['Curriculum design', 'Learning analytics', 'Assessment and certification'],
  },
  {
    id: 'education-policy',
    title: 'Education Policy',
    subtitle: 'Strategic education reform, compliance, equity, and funding systems.',
    color: '#ef4444',
    stats: '40 active agents',
    features: ['Policy analysis', 'Governance systems', 'Equity initiatives'],
  },
  {
    id: 'hr-talent',
    title: 'HR & Talent Management',
    subtitle: 'Learning and development systems for educators, staff, and operational talent.',
    color: '#8b5cf6',
    stats: '43 active agents',
    features: ['Workforce analytics', 'Talent development', 'Performance coaching'],
  },
  {
    id: 'multispecies-education',
    title: 'Multispecies Education',
    subtitle: 'Cross-kin learning, empathy translation, and sensory curriculum experiences.',
    color: '#10b981',
    stats: '27 active agents',
    features: ['Empathy translation', 'Interspecies curriculum', 'Sensory learning models'],
  },
  {
    id: 'mythic-education',
    title: 'Mythic Education',
    subtitle: 'Archetypal and narrative-based learning for story-driven student journeys.',
    color: '#f59e0b',
    stats: '25 active agents',
    features: ['Archetypal learning', 'Narrative learning paths', 'Symbolic teaching models'],
  },
]

export const portalSubjects = [
  {
    title: 'Dream Curriculum Design',
    progress: 82,
    label: 'Immersive learning',
    students: 114,
  },
  {
    title: 'Knowledge Graph Mapping',
    progress: 68,
    label: 'Curriculum analytics',
    students: 190,
  },
  {
    title: 'Policy Reform Lab',
    progress: 46,
    label: 'Governance readiness',
    students: 76,
  },
  {
    title: 'Multispecies Empathy Systems',
    progress: 91,
    label: 'Cross-kin learning',
    students: 58,
  },
]

export const portalStats = [
  { label: 'Specialist Tutors', value: '872+', icon: UsersIcon, accent: '#2563eb' },
  { label: 'Subjects Covered', value: '14', icon: BookOpenIcon, accent: '#10b981' },
  { label: 'Campus Floors', value: '5', icon: ActivityIcon, accent: '#f59e0b' },
  { label: 'Architecture', value: 'Stateless', icon: StarIcon, accent: '#8b5cf6' },
]
