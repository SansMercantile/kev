import React, { useState, useEffect } from 'react';
import {
  Building2,
  UserCheck,
  GraduationCap,
  Layers,
  Wrench,
  BookOpen,
  Sparkles,
  Award,
  CheckCircle,
  Clock,
  MapPin,
  Compass,
  ArrowRight,
  Shield,
  Search,
  Filter,
  Check,
  AlertCircle,
  ExternalLink,
  Users,
  ChevronRight,
  Palette,
  Heart,
  Globe,
  Radio,
  FileText,
  FileCheck,
  Smartphone,
  Mail,
  Zap,
  Dna,
  Orbit,
  Activity,
  Gauge,
  Utensils
} from 'lucide-react';
import {
  AdmissionApplication,
  AdmissionStudentDetails,
  AdmissionGuardianDetails,
  StudyLevel,
  CampusFloorLevelId,
  FloorArchitectureFacility,
  HistoricLibraryTreatise,
  AcademyVirtualToolItem,
  AcademyToolSkinItem,
  LabId
} from '../../types';
import {
  CAMPUS_FLOOR_THEMES,
  ACADEMY_VIRTUAL_TOOLS,
  ACADEMY_TOOL_SKINS,
  HISTORIC_LIBRARY_TREATISES,
  SEEDED_ADMISSIONS_DATABASE,
  SUBJECTS_REGISTRY_METRICS,
  AUTONOMOUS_AGENT_DOMAINS,
  STUDY_LEVELS_INFO,
  UI_LANGUAGE_BUNDLES
} from '../../data/visitorsData';
import { FacilityDetailModal } from './FacilityDetailModal';
import { LibraryTreatiseReaderModal } from './LibraryTreatiseReaderModal';
import { DigitalAdmissionCard } from './DigitalAdmissionCard';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';
import { libApi } from '../../lib/xrApi';
import { cachedFetch, queueOutbox } from '../../lib/offline';

interface Props {
  currentStudentName: string;
  onAdmissionSuccess?: (application: AdmissionApplication) => void;
  onNavigateToFloor?: (floor: number) => void;
  onNavigateToLab?: (labId: LabId) => void;
  onNavigateToCampus?: () => void;
}

export const VisitorsPortal: React.FC<Props> = ({
  currentStudentName,
  onAdmissionSuccess,
  onNavigateToFloor,
  onNavigateToLab,
  onNavigateToCampus
}) => {
  const { showXPToast, showBadgeToast } = useToast();

  // Active top-level Visitors Portal Tab
  const [activeTab, setActiveTab] = useState<'admission' | 'architecture' | 'tools' | 'library' | 'curriculum'>('admission');

  // Admissions State
  const [admissionsList, setAdmissionsList] = useState<AdmissionApplication[]>(() => {
    try {
      const saved = localStorage.getItem('kev_admissions_list');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return SEEDED_ADMISSIONS_DATABASE;
  });

  const [activeAdmissionRecord, setActiveAdmissionRecord] = useState<AdmissionApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccessMsg, setSubmissionSuccessMsg] = useState<string | null>(null);

  // Form State - Student Details
  const [studentForm, setStudentForm] = useState<AdmissionStudentDetails>({
    fullName: currentStudentName && currentStudentName !== 'Alex Rivera' ? currentStudentName : '',
    preferredName: '',
    dateOfBirth: '2008-05-14',
    genderOrPronouns: 'They/Them',
    gradeLevel: 'High School (9-12)',
    studyLevel: 'high',
    primaryInterests: ['Chemistry', 'Astrophysics'],
    priorExperienceLevel: 'Intermediate',
    dietaryPreferences: ['Regular'],
    accessibilityNeeds: [],
    studentEmail: '',
    studentPhone: '+1 (555) 019-2834',
    intendedStartDate: 'Fall Term 2026'
  });

  // Form State - Parental / Guardian Information
  const [guardianForm, setGuardianForm] = useState<AdmissionGuardianDetails>({
    primaryGuardianName: '',
    relationship: 'Mother',
    guardianEmail: '',
    guardianPhone: '+1 (555) 019-2830',
    occupation: 'Senior Research Scientist',
    residentialAddress: '500 Innovation Way',
    city: 'San Francisco, CA',
    country: 'United States',
    timezone: 'America/Los_Angeles',
    secondaryGuardianName: '',
    secondaryRelationship: 'Father',
    secondaryPhone: '',
    emergencyContactName: '',
    emergencyRelationship: 'Primary Guardian',
    emergencyPhone: '+1 (555) 019-2830',
    notificationFrequency: 'weekly_summary',
    notificationChannels: ['email', 'portal_inbox'],
    vrUsageConsent: true,
    avatarAndPrivacyConsent: true,
    academicHonorCodeAgreed: true,
    digitalSignature: '',
    signatureDate: new Date().toISOString().split('T')[0]
  });

  // Floor Architecture Filter
  const [selectedFloorLevel, setSelectedFloorLevel] = useState<CampusFloorLevelId | 'all'>('all');
  const [facilitySearch, setFacilitySearch] = useState<string>('');
  const [inspectingFacility, setInspectingFacility] = useState<FloorArchitectureFacility | null>(null);

  // Library Treatises Reader Modal
  const [readingTreatise, setReadingTreatise] = useState<HistoricLibraryTreatise | null>(null);

  // Equipped Skin notice state
  const [equippedSkin, setEquippedSkin] = useState<string>(() => {
    return localStorage.getItem('kev_equipped_tool_skin') || 'Bunsen Plasma Aurora';
  });

  // Sync admissions to localStorage
  useEffect(() => {
    localStorage.setItem('kev_admissions_list', JSON.stringify(admissionsList));
  }, [admissionsList]);

  // Load backend admissions on mount
  useEffect(() => {
    async function fetchAdmissions() {
      try {
        const data = await cachedFetch<{ admissions?: AdmissionApplication[] }>(
          libApi('/admissions/list')
        );
        if (data.admissions && data.admissions.length > 0) {
          setAdmissionsList(data.admissions);
        }
      } catch (err) {
        console.warn('Using client-side admissions database:', err);
      }
    }
    fetchAdmissions();
  }, []);

  // Form submission handler
  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentForm.fullName.trim()) {
      alert('Please provide the student’s full legal name.');
      return;
    }
    if (!guardianForm.primaryGuardianName.trim()) {
      alert('Please provide the primary parent/guardian name.');
      return;
    }
    if (!guardianForm.digitalSignature.trim()) {
      alert('Please provide a digital signature for parental consent.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Post to backend (queued offline and replayed on reconnect)
      let data: { success?: boolean; admission?: AdmissionApplication };
      try {
        const res = await fetch(libApi('/admissions/apply'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student: studentForm,
            guardian: guardianForm
          }),
        });
        data = await res.json();
      } catch {
        await queueOutbox({
          url: libApi('/admissions/apply'),
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student: studentForm, guardian: guardianForm }),
        });
        data = {};
      }

      let admissionRecord: AdmissionApplication;

      if (data.success && data.admission) {
        admissionRecord = data.admission;
      } else {
        // Fallback local creation
        const num = admissionsList.length + 8421;
        admissionRecord = {
          id: `adm-2026-${String(admissionsList.length + 1).padStart(3, '0')}`,
          studentId: `KEV-STU-${num}`,
          applicationNumber: `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          submissionDate: new Date().toISOString().split('T')[0],
          status: studentForm.priorExperienceLevel === 'Honors Scholar' ? 'Honor Scholar Admitted' : 'Admitted - Official',
          student: { ...studentForm },
          guardian: { ...guardianForm },
          assignedCampusFloor: 'Ground Floor Commons & First Floor STEM Wing',
          assignedTutor: 'Dr. Marcus Ward & Prof. KEV',
          virtualLockerNumber: `Locker B-${100 + admissionsList.length * 3}`,
          rfidPassCode: `RFID-KEV-${Math.floor(1000 + Math.random() * 9000)}-AUTH`,
          initialXPAwarded: 100,
          notes: 'Admitted with High Honors.'
        };
      }

      setAdmissionsList(prev => [admissionRecord, ...prev]);
      setActiveAdmissionRecord(admissionRecord);
      setSubmissionSuccessMsg(`Admissions application approved! Student ID: ${admissionRecord.studentId}`);

      // Sound & toast celebration
      soundManager.playBadgeUnlock();
      showXPToast(100, 'Academy Admission Starter XP Grant');
      showBadgeToast('Official Scholar Admitted', 'Completed formal enrollment and guardian credentialing at KEV Academy!');

      if (onAdmissionSuccess) {
        onAdmissionSuccess(admissionRecord);
      }
    } catch (err) {
      console.error('Admission submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle interest tags
  const toggleInterest = (interest: string) => {
    setStudentForm(prev => {
      const exists = prev.primaryInterests.includes(interest);
      if (exists) {
        return { ...prev, primaryInterests: prev.primaryInterests.filter(i => i !== interest) };
      } else {
        return { ...prev, primaryInterests: [...prev.primaryInterests, interest] };
      }
    });
  };

  // Toggle dietary options
  const toggleDietary = (diet: string) => {
    setStudentForm(prev => {
      const exists = prev.dietaryPreferences.includes(diet);
      if (exists) {
        return { ...prev, dietaryPreferences: prev.dietaryPreferences.filter(d => d !== diet) };
      } else {
        return { ...prev, dietaryPreferences: [...prev.dietaryPreferences, diet] };
      }
    });
  };

  // Toggle accessibility options
  const toggleAccessibility = (acc: string) => {
    setStudentForm(prev => {
      const exists = prev.accessibilityNeeds.includes(acc);
      if (exists) {
        return { ...prev, accessibilityNeeds: prev.accessibilityNeeds.filter(a => a !== acc) };
      } else {
        return { ...prev, accessibilityNeeds: [...prev.accessibilityNeeds, acc] };
      }
    });
  };

  const handleEquipSkin = (skinName: string) => {
    setEquippedSkin(skinName);
    localStorage.setItem('kev_equipped_tool_skin', skinName);
    soundManager.playClick();
    showBadgeToast(`Equipped: ${skinName}`, 'Custom tool skin applied to 3D virtual lab instruments!');
  };

  // Filter facilities based on active floor & search query
  const filteredFacilities = CAMPUS_FLOOR_THEMES
    .filter(theme => selectedFloorLevel === 'all' || theme.level === selectedFloorLevel)
    .flatMap(theme => theme.facilities)
    .filter(fac => {
      if (!facilitySearch.trim()) return true;
      const q = facilitySearch.toLowerCase();
      return (
        fac.facility.toLowerCase().includes(q) ||
        fac.description.toLowerCase().includes(q) ||
        fac.type.toLowerCase().includes(q) ||
        fac.equipmentAndTools.some(t => t.toLowerCase().includes(q))
      );
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Visitors Banner */}
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                OFFICIAL VISITORS & ADMISSIONS PORTAL
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Academic Year 2026–2027
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              KEV XR Science Academy
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore our 6-level architectural campus (Basement through Roof), inspect virtual laboratory tools,
              consult classical scientific library treatises, and complete student admission & parental guardian enrollment.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-sm">
            <div className="text-center px-3">
              <div className="text-xs text-slate-400 font-mono">Total Admitted</div>
              <div className="text-xl font-bold font-mono text-cyan-300">{admissionsList.length}</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-3">
              <div className="text-xs text-slate-400 font-mono">Levels</div>
              <div className="text-xl font-bold font-mono text-indigo-300">6 Floors</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-3">
              <div className="text-xs text-slate-400 font-mono">Starter Grant</div>
              <div className="text-xl font-bold font-mono text-amber-400">+100 XP</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('admission')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'admission'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-cyan-300" />
            <span>Admissions & Enrollment</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'architecture'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-300" />
            <span>Campus Floors & 14 Facilities</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'tools'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4 text-emerald-300" />
            <span>Virtual Tools & Skins</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'library'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Library Treatises (5 Rare Classics)</span>
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'curriculum'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>Curriculum & 1,092 Agents</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 w-full space-y-8">
        {/* =========================================================================
            TAB 1: ADMISSIONS & ENROLLMENT DESK
           ========================================================================= */}
        {activeTab === 'admission' && (
          <div className="space-y-8">
            {/* If active admission record exists, show digital credential card */}
            {activeAdmissionRecord && (
              <DigitalAdmissionCard
                admission={activeAdmissionRecord}
                onEnterCampus={onNavigateToCampus}
                onEnterLabs={() => onNavigateToLab && onNavigateToLab('chemistry')}
                onClose={() => setActiveAdmissionRecord(null)}
              />
            )}

            {/* Admission Form Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-cyan-500/20 text-cyan-300">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      Student Admission & Parental Guardian Registration
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete the formal intake form to receive your official digital Student ID pass, locker assignment, and +100 Starter XP grant.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Ground Floor Reception Office · Official Form 101</span>
                </div>
              </div>

              <form onSubmit={handleAdmissionSubmit} className="p-6 sm:p-8 space-y-8">
                {/* SECTION 1: STUDENT DETAILS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                      Section 1: Student Information & Academic Profile
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Full Legal Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={studentForm.fullName}
                        onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                        placeholder="e.g. Maya Chen"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Preferred Name / Nickname
                      </label>
                      <input
                        type="text"
                        value={studentForm.preferredName}
                        onChange={(e) => setStudentForm({ ...studentForm, preferredName: e.target.value })}
                        placeholder="e.g. Maya"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Date of Birth <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={studentForm.dateOfBirth}
                        onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Gender / Pronouns
                      </label>
                      <input
                        type="text"
                        value={studentForm.genderOrPronouns}
                        onChange={(e) => setStudentForm({ ...studentForm, genderOrPronouns: e.target.value })}
                        placeholder="e.g. She/Her, He/Him, They/Them"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Grade Level Tier <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={studentForm.gradeLevel}
                        onChange={(e) => setStudentForm({ ...studentForm, gradeLevel: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Elementary (K-5)">Elementary (K-5)</option>
                        <option value="Middle School (6-8)">Middle School (6-8)</option>
                        <option value="High School (9-12)">High School (9-12)</option>
                        <option value="University Undergraduate">University Undergraduate</option>
                        <option value="Professional & Graduate">Professional & Graduate</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Core Study Level (levels.py) <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={studentForm.studyLevel}
                        onChange={(e) => setStudentForm({ ...studentForm, studyLevel: e.target.value as StudyLevel })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                      >
                        <option value="elementary">elementary (K-5 foundational)</option>
                        <option value="middle">middle (6-8 exploratory)</option>
                        <option value="high">high (9-12 college prep)</option>
                        <option value="university">university (undergraduate honors)</option>
                        <option value="professional">professional (advanced research)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Student Email
                      </label>
                      <input
                        type="email"
                        value={studentForm.studentEmail}
                        onChange={(e) => setStudentForm({ ...studentForm, studentEmail: e.target.value })}
                        placeholder="e.g. scholar@kev-student.org"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Prior STEM / Experience Level
                      </label>
                      <select
                        value={studentForm.priorExperienceLevel}
                        onChange={(e) => setStudentForm({ ...studentForm, priorExperienceLevel: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Beginner">Beginner (Curious Explorer)</option>
                        <option value="Intermediate">Intermediate (Completed Intro Labs)</option>
                        <option value="Advanced">Advanced (AP/IB Honors Level)</option>
                        <option value="Honors Scholar">Honors Scholar (Olympiad / Independent Research)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Intended Start Term
                      </label>
                      <input
                        type="text"
                        value={studentForm.intendedStartDate}
                        onChange={(e) => setStudentForm({ ...studentForm, intendedStartDate: e.target.value })}
                        placeholder="e.g. Fall Term 2026"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Primary Academic Disciplines / Interests Chips */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Select Primary Academic Interests & Focus Disciplines
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Chemistry (VSEPR & Molecular)',
                        'Astrophysics (Kepler & Gravity)',
                        'Biology (Cellular & Genomics)',
                        'Optics (Lasers & Refraction)',
                        'Mathematics & Proofs',
                        'Computer Science & Cloud',
                        'Music Composition',
                        'Visual Arts & 3D Modeling',
                        'Dance & Biomechanics',
                        'Physical Education & Aquatics'
                      ].map((interest) => {
                        const isSelected = studentForm.primaryInterests.includes(interest);
                        return (
                          <button
                            type="button"
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dietary Preferences (Ground Floor Main Cafeteria Sync) */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5" />
                        Ground Floor Main Cafeteria — Dietary & Allergen Profile
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">300-seat culinary sync</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Select dietary plans to configure automated nutrition tracking in the school cafeteria:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Regular', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy'].map((diet) => {
                        const isSel = studentForm.dietaryPreferences.includes(diet);
                        return (
                          <button
                            type="button"
                            key={diet}
                            onClick={() => toggleDietary(diet)}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                              isSel
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {diet}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accessibility Accommodations (Main Entrance Hall & Wayfinding) */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5" />
                        Campus Universal Access & Accommodation Accompaniments
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Entrance Hall, Ramps & Braille</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        'Wheelchair Ramp & Elevator Priority',
                        'Braille & Tactile Wayfinding Signs',
                        'Large Font & Screen Reader Optimization',
                        'Audio Descriptions & Captions',
                        'Sensory Low-Stimulation Quiet Pods'
                      ].map((acc) => {
                        const isSel = studentForm.accessibilityNeeds.includes(acc);
                        return (
                          <button
                            type="button"
                            key={acc}
                            onClick={() => toggleAccessibility(acc)}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                              isSel
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {acc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PARENTAL & GUARDIAN DETAILS */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
                      Section 2: Parental / Guardian Credentials & Contact
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Primary Guardian Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={guardianForm.primaryGuardianName}
                        onChange={(e) => setGuardianForm({ ...guardianForm, primaryGuardianName: e.target.value })}
                        placeholder="e.g. Dr. Arthur Chen"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Relationship to Student <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={guardianForm.relationship}
                        onChange={(e) => setGuardianForm({ ...guardianForm, relationship: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                        <option value="Grandparent">Grandparent</option>
                        <option value="Foster Parent">Foster Parent</option>
                        <option value="Other">Other Authorized Custodian</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Guardian Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={guardianForm.guardianEmail}
                        onChange={(e) => setGuardianForm({ ...guardianForm, guardianEmail: e.target.value })}
                        placeholder="e.g. arthur.chen@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Guardian Phone Number <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={guardianForm.guardianPhone}
                        onChange={(e) => setGuardianForm({ ...guardianForm, guardianPhone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Occupation / Affiliation
                      </label>
                      <input
                        type="text"
                        value={guardianForm.occupation}
                        onChange={(e) => setGuardianForm({ ...guardianForm, occupation: e.target.value })}
                        placeholder="e.g. Electrical Engineer"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        City & Country of Residence
                      </label>
                      <input
                        type="text"
                        value={guardianForm.city}
                        onChange={(e) => setGuardianForm({ ...guardianForm, city: e.target.value })}
                        placeholder="e.g. San Francisco, United States"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Secondary & Emergency Contacts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-semibold text-slate-300 block">
                        Secondary Guardian (Optional)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={guardianForm.secondaryGuardianName || ''}
                          onChange={(e) => setGuardianForm({ ...guardianForm, secondaryGuardianName: e.target.value })}
                          placeholder="Secondary Guardian Name"
                          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="tel"
                          value={guardianForm.secondaryPhone || ''}
                          onChange={(e) => setGuardianForm({ ...guardianForm, secondaryPhone: e.target.value })}
                          placeholder="Contact Phone"
                          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-semibold text-slate-300 block">
                        Emergency Contact <span className="text-rose-400">*</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={guardianForm.emergencyContactName}
                          onChange={(e) => setGuardianForm({ ...guardianForm, emergencyContactName: e.target.value })}
                          placeholder="Emergency Contact Name"
                          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="tel"
                          required
                          value={guardianForm.emergencyPhone}
                          onChange={(e) => setGuardianForm({ ...guardianForm, emergencyPhone: e.target.value })}
                          placeholder="Emergency Phone"
                          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: GUARDIAN CONSENTS & DIGITAL SIGNATURE */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                      Section 3: Educational Consents, XR Virtual Reality Agreement & Digital Signature
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={guardianForm.vrUsageConsent}
                        onChange={(e) => setGuardianForm({ ...guardianForm, vrUsageConsent: e.target.checked })}
                        className="mt-1 rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="text-xs text-slate-300">
                        <strong className="text-white">WebXR & Virtual Reality Headset Usage Consent: </strong>
                        I give permission for the student to participate in stereoscopic 3D science simulations and WebXR laboratory walkthroughs in accordance with academy health and safety guidelines.
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={guardianForm.avatarAndPrivacyConsent}
                        onChange={(e) => setGuardianForm({ ...guardianForm, avatarAndPrivacyConsent: e.target.checked })}
                        className="mt-1 rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="text-xs text-slate-300">
                        <strong className="text-white">Student Digital Persona & Academic Privacy: </strong>
                        I consent to the generation of student avatars, lab telemetry snapshots, and participation in peer chat within the encrypted school portal.
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={guardianForm.academicHonorCodeAgreed}
                        onChange={(e) => setGuardianForm({ ...guardianForm, academicHonorCodeAgreed: e.target.checked })}
                        className="mt-1 rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="text-xs text-slate-300">
                        <strong className="text-white">KEV Academic Honor Code & Socratic Integrity: </strong>
                        The student pledges to complete virtual laboratory experiments honestly, cite classical scientific sources, and support peer scholars cordially.
                      </div>
                    </label>
                  </div>

                  {/* Digital Signature */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Parent / Guardian Digital Signature (Type Full Name) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={guardianForm.digitalSignature}
                        onChange={(e) => setGuardianForm({ ...guardianForm, digitalSignature: e.target.value })}
                        placeholder="e.g. Arthur Chen, Ph.D."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs font-serif italic text-emerald-300 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Signature Date
                      </label>
                      <input
                        type="date"
                        readOnly
                        value={guardianForm.signatureDate}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Admissions include immediate +100 Starter XP grant & digital locker.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Verifying & Provisioning Student ID...' : 'Submit Admission Application & Grant ID'}
                  </button>
                </div>
              </form>
            </div>

            {/* Live Registered Admissions Ledger */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    Admissions Ledger & Registered Scholar Cohort
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official records of verified students and parental guardian sponsors
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                  {admissionsList.length} Students Registered
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {admissionsList.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setActiveAdmissionRecord(app)}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs">
                          {app.student.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {app.student.fullName}
                          </h4>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {app.studentId}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        {app.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                      <span>Grade: {app.student.gradeLevel}</span>
                      <span>Guardian: {app.guardian.primaryGuardianName} ({app.guardian.relationship})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CAMPUS FLOORS & 14 FACILITIES DIRECTORY (Basement to Roof)
           ========================================================================= */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            {/* Floor Theme Level Legend Bar */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Campus Architectural Levels (Basement to Roof)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Theme breakdown and facility inventory across all academic divisions
                  </p>
                </div>

                {/* Search facilities */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={facilitySearch}
                    onChange={(e) => setFacilitySearch(e.target.value)}
                    placeholder="Search 14 facilities or tools..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Floor Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  onClick={() => setSelectedFloorLevel('all')}
                  className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                    selectedFloorLevel === 'all'
                      ? 'bg-cyan-600/20 border-cyan-500 text-white font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[10px] font-mono text-cyan-400 uppercase">View All</div>
                  <div className="text-xs font-bold text-white mt-0.5">All 6 Levels</div>
                  <div className="text-[10px] text-slate-400">14 facilities total</div>
                </button>

                {CAMPUS_FLOOR_THEMES.map((theme) => (
                  <button
                    key={theme.level}
                    onClick={() => setSelectedFloorLevel(theme.level)}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                      selectedFloorLevel === theme.level
                        ? 'bg-cyan-600/20 border-cyan-500 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase" style={{ color: theme.color }}>
                      {theme.levelDisplayName}
                    </div>
                    <div className="text-xs font-bold text-white truncate mt-0.5" title={theme.themeAndSubject}>
                      {theme.themeAndSubject}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {theme.facilitiesCount} facilities
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Facilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFacilities.map((fac) => (
                <div
                  key={fac.id}
                  onClick={() => setInspectingFacility(fac)}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                        {fac.levelDisplayName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 capitalize">
                        {fac.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {fac.facility}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {fac.description}
                      </p>
                    </div>

                    {/* Capacity & Tools preview */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-850">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Capacity: <strong className="text-white font-mono">{fac.capacity}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Tools: <strong className="text-white font-mono">{fac.equipmentAndTools.length}</strong></span>
                      </div>
                    </div>

                    {/* Equipment tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {fac.equipmentAndTools.slice(0, 3).map((tool, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-slate-300 border border-slate-850"
                        >
                          {tool.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {fac.equipmentAndTools.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-cyan-400">
                          +{fac.equipmentAndTools.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect Facility & Tools</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>

            {/* Roof Level Notice (Defined in enum; no facilities built yet) */}
            <div className="p-4 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex items-center gap-3 text-xs text-slate-400">
              <Compass className="w-5 h-5 text-slate-500" />
              <div>
                <strong className="text-slate-300">Roof Level (R): </strong>
                Defined in enum; no facilities built yet. Earmarked for future solar arrays and atmospheric meteorological instruments.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: VIRTUAL TOOLS & TOOL SKINS SHOWCASE (Prompt Section 2)
           ========================================================================= */}
        {activeTab === 'tools' && (
          <div className="space-y-8">
            {/* Section 1: 5 Core Academy Virtual Tools */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-emerald-400" />
                  Official Academy Virtual Tools (Instrumentation)
                </h2>
                <p className="text-xs text-slate-400">
                  Precision digital scientific apparatus engineered for experimental accuracy
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACADEMY_VIRTUAL_TOOLS.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          {tool.discipline}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {tool.precisionRating}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{tool.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono text-cyan-400">
                        <strong>Key Capability:</strong> {tool.keyCapability}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Default Chassis:</span>
                        <span className="text-white font-mono font-medium">{tool.defaultSkin}</span>
                      </div>
                      {tool.associatedLabId && onNavigateToLab && (
                        <button
                          onClick={() => onNavigateToLab(tool.associatedLabId!)}
                          className="w-full mt-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Test in {tool.associatedLabId.toUpperCase()} Lab</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: 6 Tool Skins */}
            <div className="space-y-4 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-400" />
                    Specialized Tool Skins (6 Official Variants)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Custom holographic finishes, high-frequency plasma emissions, and quantum ion glows
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-3 py-1 rounded-xl border border-cyan-500/30">
                  Currently Equipped: <strong className="text-white">{equippedSkin}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACADEMY_TOOL_SKINS.map((skin) => {
                  const isCurrent = equippedSkin === skin.name;
                  return (
                    <div
                      key={skin.id}
                      className={`p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between space-y-4 ${
                        isCurrent ? 'border-cyan-500 shadow-lg shadow-cyan-500/10' : 'border-slate-800'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            skin.rarity === 'Legendary'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : skin.rarity === 'Epic'
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {skin.rarity}
                          </span>

                          {/* Color Swatch Dots */}
                          <div className="flex items-center gap-1.5">
                            {skin.previewColors.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">{skin.name}</h3>
                          <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                            Target: {skin.toolTarget}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {skin.description}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-[11px] font-mono text-slate-300">
                          <strong className="text-slate-400 block text-[10px] uppercase">Particle Effect:</strong>
                          {skin.visualEffectDescription}
                        </div>
                      </div>

                      <button
                        onClick={() => handleEquipSkin(skin.name)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-200'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Skin Equipped</span>
                          </>
                        ) : (
                          <span>Equip to Lab Tools</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: CLASSICAL SCIENCE LIBRARY (5 RARE TREATISES)
           ========================================================================= */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-500/20 text-amber-300">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    Ground Floor School Library — Classical Treatises Archive
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Inspect the 5 foundational historical manuscripts that shaped modern physics, chemistry, genetics, and optics.
                  Click any treatise to read verified primary excerpts and examine how each is simulated in KEV XR labs.
                </p>
              </div>

              <span className="text-xs font-mono text-amber-300 bg-amber-950 px-3 py-1.5 rounded-xl border border-amber-500/40 whitespace-nowrap">
                5 Primary Treatises Digitized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {HISTORIC_LIBRARY_TREATISES.map((treatise) => (
                <div
                  key={treatise.id}
                  onClick={() => setReadingTreatise(treatise)}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 group shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {treatise.discipline}
                      </span>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        Anno {treatise.year}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                        {treatise.title}
                      </h3>
                      <div className="text-xs text-slate-400 font-serif italic mt-0.5">
                        Author: {treatise.author}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {treatise.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-amber-300 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Read Archival Excerpt</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: CURRICULUM, SUBJECTS & 1,092 AGENT ECOSYSTEM
           ========================================================================= */}
        {activeTab === 'curriculum' && (
          <div className="space-y-8">
            {/* Section 1: Subject Registry Overview */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Subject Registry & Faculty Constellation
                  </h2>
                  <p className="text-xs text-slate-400">
                    14 Subject Areas · 176 Subject-Level Specializations · 872 Specialized Tutor Agents
                  </p>
                </div>

                <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-3 py-1 rounded-xl border border-cyan-500/30">
                  1,092 Total Autonomous Agent Ecosystem
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                {SUBJECTS_REGISTRY_METRICS.areas.map((area) => (
                  <div
                    key={area.name}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1"
                  >
                    <div className="text-xs font-bold text-white truncate" title={area.name}>
                      {area.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {area.specializations} specs
                    </div>
                    <div className="text-[10px] font-mono font-semibold" style={{ color: area.color }}>
                      {area.agents} agents
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: 5 Study Levels & 6 Curated Languages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 5 Study Levels (levels.py) */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  Study Levels Progression (backend/core/levels.py)
                </h3>
                <div className="space-y-2.5">
                  {STUDY_LEVELS_INFO.map((lvl) => (
                    <div
                      key={lvl.level}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-start gap-3"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: lvl.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{lvl.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{lvl.badge}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{lvl.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6 Language Bundles */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Curated Multilingual UI Bundles
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {UI_LANGUAGE_BUNDLES.map((lang) => (
                    <div
                      key={lang.code}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{lang.name}</span>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase">{lang.code}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-serif italic">{lang.native}</div>
                      <div className="text-[10px] text-slate-500 truncate">{lang.region}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                  <strong className="text-cyan-300 block mb-1">The Remainder Spaceship Mission Loop:</strong>
                  7-crew spaceship simulator vs AI "The Quotient" featuring 7 Sectors, 7 Stations, and an 8-step iterative hypothesis loop.
                </div>
              </div>
            </div>

            {/* Section 3: 219 Autonomous System Agents across 6 Domains */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  219 Autonomous System Agents (6 Operational Domains)
                </h3>
                <p className="text-xs text-slate-400">
                  Backbone multi-agent architecture coordinating campus governance, simulations, and narrative immersion
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {AUTONOMOUS_AGENT_DOMAINS.map((domain) => (
                  <div
                    key={domain.domain}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate" title={domain.domain}>
                        {domain.domain}
                      </h4>
                      <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30">
                        {domain.agentCount} Agents
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {domain.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Facility Details Modal */}
      {inspectingFacility && (
        <FacilityDetailModal
          facility={inspectingFacility}
          onClose={() => setInspectingFacility(null)}
          onNavigateToFloor={onNavigateToFloor}
        />
      )}

      {/* Library Treatise Reader Modal */}
      {readingTreatise && (
        <LibraryTreatiseReaderModal
          treatise={readingTreatise}
          onClose={() => setReadingTreatise(null)}
          onNavigateToLab={onNavigateToLab}
        />
      )}
    </div>
  );
};
