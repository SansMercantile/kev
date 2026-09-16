import React, { useRef } from 'react';
import {
  Award,
  CheckCircle,
  Download,
  Printer,
  Sparkles,
  QrCode,
  ShieldCheck,
  UserCheck,
  MapPin,
  Compass,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { AdmissionApplication } from '../../types';

interface Props {
  admission: AdmissionApplication;
  onEnterCampus?: () => void;
  onEnterLabs?: () => void;
  onClose?: () => void;
}

export const DigitalAdmissionCard: React.FC<Props> = ({
  admission,
  onEnterCampus,
  onEnterLabs,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Official Acceptance Announcement Banner */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-cyan-950/50 to-slate-900 border border-emerald-500/40 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                OFFICIAL ADMISSION CONFIRMED
              </span>
              <span className="text-[11px] text-cyan-300 font-mono">
                {admission.submissionDate}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              Welcome to KEV Science Academy, {admission.student.preferredName}!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Your student profile and parental/guardian credentials have been verified into the Academy registry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Print Official Admission Certificate"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print Pass</span>
          </button>
        </div>
      </div>

      {/* Holographic / Tech ID Pass Card */}
      <div
        ref={printRef}
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 sm:p-8 text-white shadow-2xl"
      >
        {/* Decorative Grid Lines */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold font-mono text-sm shadow-md">
              KEV
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                KEV XR Science Academy · Official Student Credential
              </div>
              <div className="text-xs text-slate-400 font-mono">
                San Francisco Virtual Campus · Registry Node #872
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {admission.status}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-800">
          {/* Student Persona Col */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="w-20 h-20 rounded-2xl bg-cyan-950 border-2 border-cyan-500/40 p-1 flex items-center justify-center shadow-lg relative">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 flex items-center justify-center font-bold text-2xl text-cyan-300 font-mono">
                {admission.student.fullName.charAt(0)}
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-white leading-tight">
                {admission.student.fullName}
              </h4>
              <div className="text-xs text-cyan-300 font-mono">
                Preferred: "{admission.student.preferredName}" ({admission.student.genderOrPronouns})
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Grade: {admission.student.gradeLevel}
              </div>
            </div>
          </div>

          {/* Academic & Campus Allocation Col */}
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Assigned Student ID
              </span>
              <span className="text-base font-bold font-mono text-cyan-300">
                {admission.studentId}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Primary Academic Disciplines
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {admission.student.primaryInterests.map((interest, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Assigned Faculty Mentor
              </span>
              <span className="text-xs font-semibold text-white">
                {admission.assignedTutor}
              </span>
            </div>
          </div>

          {/* Security & Access Keys Col */}
          <div className="space-y-3 text-xs bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Campus Base Location
              </span>
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {admission.assignedCampusFloor}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Locker Number
                </span>
                <span className="font-mono text-white text-xs font-bold">
                  {admission.virtualLockerNumber}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Starter Grant
                </span>
                <span className="font-mono text-amber-400 text-xs font-bold">
                  +{admission.initialXPAwarded} XP
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Encrypted RFID Token
              </span>
              <span className="font-mono text-[11px] text-cyan-400 tracking-wider">
                {admission.rfidPassCode}
              </span>
            </div>
          </div>
        </div>

        {/* Guardian Verification Record Footer */}
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            <span>Guardian Sponsor: </span>
            <strong className="text-slate-200">{admission.guardian.primaryGuardianName}</strong>{' '}
            <span className="text-slate-500 font-mono">({admission.guardian.relationship})</span>
            <div className="text-[11px] text-slate-500 font-mono">
              Signed Digitally: {admission.guardian.digitalSignature} · {admission.guardian.signatureDate}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right font-mono text-[11px]">
              <span className="text-emerald-400">VR Consent Verified</span> ·{' '}
              <span className="text-cyan-400">Honor Code Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Action Options */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {onEnterLabs && (
          <button
            onClick={onEnterLabs}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            <span>Enter 3D Virtual Science Labs</span>
          </button>
        )}
        {onEnterCampus && (
          <button
            onClick={onEnterCampus}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-500/25"
          >
            <Compass className="w-4 h-4" />
            <span>Explore 4-Floor Virtual Campus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
