import React, { useState } from 'react';
import {
  X,
  Users,
  GraduationCap,
  Sparkles,
  Search,
  Star,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  Calendar,
  Layers,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Zap,
  Radio,
  BookOpen
} from 'lucide-react';
import { PeerMentor, PeerStudyRequest, StudentStats, LabId } from '../../types';
import { INITIAL_PEER_MENTORS } from '../../data/peerMentors';
import { useToast } from '../toast/ToastContext';
import { soundManager } from '../../utils/soundEffects';

interface Props {
  studentStats: StudentStats;
  currentFloor: 1 | 2 | 3 | 4;
  onNavigateToLab: (labId: LabId) => void;
  onOpenCampusChat: () => void;
  onAwardBadge?: (badgeName: string, reason: string) => void;
  onClose: () => void;
}

export const PeerMentorMatchingModal: React.FC<Props> = ({
  studentStats,
  currentFloor,
  onNavigateToLab,
  onOpenCampusChat,
  onAwardBadge,
  onClose,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'directory' | 'requests' | 'my_status'>('directory');
  const [mentors, setMentors] = useState<PeerMentor[]>(INITIAL_PEER_MENTORS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Student's own tutoring status
  const [isAvailableForTutoring, setIsAvailableForTutoring] = useState<boolean>(() => {
    return studentStats.isAvailableForTutoring ?? true;
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(() => {
    return studentStats.tutoringSpecialties ?? ['chemistry', 'optics'];
  });

  // Active study requests
  const [requests, setRequests] = useState<PeerStudyRequest[]>(() => {
    const saved = localStorage.getItem('kev_peer_study_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [
      {
        id: 'req-init-1',
        fromStudentId: 'student-elena',
        fromStudentName: 'Elena Rostova',
        toMentorId: 'current-user',
        toMentorName: studentStats.name,
        subject: 'chemistry',
        topic: 'Verifying lone pair repulsion angle in Ammonia (NH3) vs Water (H2O)',
        sessionType: 'scheduled_lab',
        status: 'pending',
        createdAt: '10 mins ago',
        meetingLocation: 'Floor 1 Atrium Study Pod B',
      },
    ];
  });

  // Selected mentor for requesting a session
  const [requestTargetMentor, setRequestTargetMentor] = useState<PeerMentor | null>(null);
  const [requestSubject, setRequestSubject] = useState<LabId | 'general'>('chemistry');
  const [requestTopic, setRequestTopic] = useState<string>('');
  const [requestSessionType, setRequestSessionType] = useState<'instant_sprint' | 'scheduled_lab' | 'concept_review'>('instant_sprint');
  const [requestLocation, setRequestLocation] = useState<string>('Floor 1 Central Atrium Study Pod A');

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.specialtyLabels.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject =
      subjectFilter === 'all' || m.specialties.includes(subjectFilter as any);

    return matchesSearch && matchesSubject;
  });

  const handleToggleTutoringStatus = () => {
    const newStatus = !isAvailableForTutoring;
    setIsAvailableForTutoring(newStatus);
    soundManager.playClick();

    showToast({
      type: newStatus ? 'success' : 'info',
      title: newStatus ? 'Tutoring Status: AVAILABLE' : 'Tutoring Status: OFFLINE',
      message: newStatus
        ? 'Other students on campus can now discover you and request study collaboration.'
        : 'Your peer tutoring listing is now hidden from the campus directory.',
    });
  };

  const handleSendStudyRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTargetMentor || !requestTopic.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Topic',
        message: 'Please provide a topic or question for your study session.',
      });
      return;
    }

    const newReq: PeerStudyRequest = {
      id: `req-${Date.now()}`,
      fromStudentId: 'current-user',
      fromStudentName: studentStats.name,
      toMentorId: requestTargetMentor.id,
      toMentorName: requestTargetMentor.name,
      subject: requestSubject,
      topic: requestTopic.trim(),
      sessionType: requestSessionType,
      status: 'pending',
      createdAt: 'Just now',
      meetingLocation: requestLocation,
    };

    const updated = [newReq, ...requests];
    setRequests(updated);
    localStorage.setItem('kev_peer_study_requests', JSON.stringify(updated));

    soundManager.playXPEarned();
    setRequestTargetMentor(null);
    setRequestTopic('');
    setActiveTab('requests');

    showToast({
      type: 'success',
      title: 'Study Request Sent!',
      message: `Invitation delivered to ${newReq.toMentorName}. You will be notified when accepted.`,
    });
  };

  const handleAcceptRequest = (reqId: string) => {
    const updated = requests.map((r) => (r.id === reqId ? { ...r, status: 'accepted' as const } : r));
    setRequests(updated);
    localStorage.setItem('kev_peer_study_requests', JSON.stringify(updated));

    soundManager.playBadgeUnlock();
    if (onAwardBadge) {
      onAwardBadge('Peer Mentor', 'Accepted and hosted a peer academic study session on the Virtual Campus!');
    }

    showToast({
      type: 'badge',
      title: 'Peer Session Accepted!',
      message: 'Study room initialized. You can now launch the virtual lab together.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  KEV Campus Peer Mentor Matching
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  Collaborative Learning
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30" title="Illustrative mentor roster — live peer matching is not connected yet">
                  SAMPLE ROSTER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect with high-XP student mentors across all 4 school floors for 1-on-1 experiment coaching.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Close Peer Mentor Matching"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation & Quick Status Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Campus Mentors Directory</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'requests'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Study Requests ({requests.length})</span>
              {requests.some((r) => r.status === 'pending' && r.toMentorId === 'current-user') && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('my_status')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'my_status'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>My Tutoring Settings</span>
            </button>
          </div>

          {/* User's Tutoring Status Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Your Status:</span>
              <button
                onClick={handleToggleTutoringStatus}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                  isAvailableForTutoring
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                }`}
                title="Toggle your availability for student peer tutoring"
              >
                <span className={`w-2 h-2 rounded-full ${isAvailableForTutoring ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>{isAvailableForTutoring ? 'Available for Tutoring' : 'Busy / Away'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'directory' && (
            <div className="space-y-5">
              {/* Search & Subject Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search mentor by name, VSEPR, Kepler, Optics..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {[
                    { id: 'all', label: 'All Subjects' },
                    { id: 'chemistry', label: 'Chemistry' },
                    { id: 'astrophysics', label: 'Astrophysics' },
                    { id: 'biology', label: 'Biology' },
                    { id: 'optics', label: 'Optics' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSubjectFilter(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        subjectFilter === s.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mentors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Mentor Profile Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white font-mono shadow-md border"
                              style={{
                                backgroundColor: mentor.avatar.primaryColor,
                                borderColor: mentor.avatar.glowColor,
                              }}
                            >
                              {mentor.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-400 border border-amber-500/40 text-[9px] font-mono font-bold">
                              LVL {mentor.level}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-sm">{mentor.name}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/30">
                                {mentor.xp} XP
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{mentor.grade}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{mentor.rating.toFixed(1)}</span>
                          <span className="text-slate-500 text-[10px]">({mentor.sessionsCompleted})</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-300 mt-3 leading-relaxed">{mentor.bio}</p>

                      {/* Location on Campus */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Floor {mentor.campusFloor}: {mentor.campusFacilityName}</span>
                      </div>

                      {/* Specialties */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {mentor.specialtyLabels.map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {mentor.status === 'available' ? 'Available on Campus' : 'In Session'}
                      </span>

                      <button
                        onClick={() => {
                          setRequestTargetMentor(mentor);
                          setRequestSubject(mentor.specialties[0] as any || 'chemistry');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-cyan-500/20 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Study Session</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Active Academic Peer Study Sessions
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {requests.length} Requests on File
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                  <p className="text-sm text-slate-400">No active study requests right now.</p>
                  <p className="text-xs text-slate-500">
                    Find a peer mentor in the directory to request your first 1-on-1 lab session!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {req.status.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono text-cyan-300 font-semibold uppercase">
                            {req.subject} LAB
                          </span>
                          <span className="text-xs text-slate-500 font-mono">• {req.createdAt}</span>
                        </div>

                        <h4 className="text-sm font-bold text-white">{req.topic}</h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                          <span>
                            From: <strong className="text-slate-200">{req.fromStudentName}</strong>
                          </span>
                          <span>→</span>
                          <span>
                            Mentor: <strong className="text-slate-200">{req.toMentorName}</strong>
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            {req.meetingLocation}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {req.status === 'pending' && req.toMentorId === 'current-user' ? (
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accept Session</span>
                          </button>
                        ) : req.status === 'accepted' ? (
                          <button
                            onClick={() => {
                              if (req.subject !== 'general') {
                                onNavigateToLab(req.subject as LabId);
                                onClose();
                              } else {
                                onOpenCampusChat();
                                onClose();
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5"
                          >
                            <Layers className="w-4 h-4" />
                            <span>Launch Joint 3D Lab</span>
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-slate-500">Awaiting Mentor Response</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'my_status' && (
            <div className="max-w-2xl space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Peer Tutoring Availability</h4>
                    <p className="text-xs text-slate-400">
                      When enabled, your profile appears in the Campus Peer Mentor Directory.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleTutoringStatus}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isAvailableForTutoring
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isAvailableForTutoring ? 'Available ON' : 'Offline OFF'}
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                    Select Your Tutoring Specialties:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'chemistry', label: 'Chemistry (VSEPR & Bonds)' },
                      { id: 'astrophysics', label: 'Astrophysics (Kepler & Gravity)' },
                      { id: 'biology', label: 'Biology (Organelles & DNA)' },
                      { id: 'optics', label: 'Optics (Snell & Refraction)' },
                    ].map((spec) => {
                      const isSelected = selectedSpecialties.includes(spec.id);
                      return (
                        <button
                          key={spec.id}
                          onClick={() => {
                            const updated = isSelected
                              ? selectedSpecialties.filter((s) => s !== spec.id)
                              : [...selectedSpecialties, spec.id];
                            setSelectedSpecialties(updated);
                          }}
                          className={`p-3 rounded-xl border text-left text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{spec.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
                  Current Campus Location: <strong>Floor {currentFloor} Facilities</strong>. (Students will meet you at this floor).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Prompt: Compose Study Request Dialog */}
        {requestTargetMentor && (
          <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative space-y-4">
              <button
                onClick={() => setRequestTargetMentor(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Request Study Session with {requestTargetMentor.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Floor {requestTargetMentor.campusFloor} • {requestTargetMentor.rating} ⭐ Rating
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendStudyRequest} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Subject Discipline</label>
                  <select
                    value={requestSubject}
                    onChange={(e) => setRequestSubject(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="chemistry">Chemistry (VSEPR & Geometry)</option>
                    <option value="astrophysics">Astrophysics (Kepler Orbits)</option>
                    <option value="biology">Cellular Biology (Organelles & DNA)</option>
                    <option value="optics">Wave Optics (Snell & Refraction)</option>
                    <option value="general">General Science Methodology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Session Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'instant_sprint', label: '15m Instant' },
                      { id: 'scheduled_lab', label: '30m Lab Pair' },
                      { id: 'concept_review', label: 'Theory Review' },
                    ].map((fmt) => (
                      <button
                        type="button"
                        key={fmt.id}
                        onClick={() => setRequestSessionType(fmt.id as any)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          requestSessionType === fmt.id
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Topic or Specific Question</label>
                  <textarea
                    rows={3}
                    value={requestTopic}
                    onChange={(e) => setRequestTopic(e.target.value)}
                    placeholder="e.g. Could you help me understand how lone pairs distort the 109.5° tetrahedral angle in H2O?"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRequestTargetMentor(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Invitation</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
