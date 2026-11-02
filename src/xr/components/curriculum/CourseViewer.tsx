import React, { useState } from 'react';
import { Course, LabId, Lesson } from '../../types';
import { COURSES } from '../../data/curriculumData';
import { VirtualLibraryShelf } from './VirtualLibraryShelf';
import { BookOpen, Clock, FlaskConical, Orbit, Dna, Sparkles, ShieldCheck, ChevronRight, CheckCircle2, Play, Award, BookMarked, Layers } from 'lucide-react';

interface Props {
  onSelectLab: (labId: LabId) => void;
  onOpenQuiz: (lesson: Lesson) => void;
  onRequestAITutor?: (context: string) => void;
  /** Open straight on a section (the Library button jumps here with 'library'). */
  initialSection?: 'modules' | 'library';
  /** Pre-filter the library shelf to one discipline. */
  initialLibrarySubject?: 'all' | LabId;
}

const ICON_MAP: Record<string, any> = {
  FlaskConical,
  Orbit,
  Dna,
  Sparkles,
  ShieldCheck,
};

export const CourseViewer: React.FC<Props> = ({ onSelectLab, onOpenQuiz, onRequestAITutor, initialSection, initialLibrarySubject }) => {
  const [activeCurriculumSection, setActiveCurriculumSection] = useState<'modules' | 'library'>(initialSection ?? 'modules');
  const [selectedCourse, setSelectedCourse] = useState<Course>(COURSES[0]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(COURSES[0].lessons[0]);

  const IconComp = ICON_MAP[selectedCourse.iconName] || BookOpen;

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-6 bg-slate-950 text-slate-100 overflow-y-auto space-y-4">
      {/* Curriculum Mode Section Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveCurriculumSection('modules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCurriculumSection === 'modules'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-300" />
            <span>Interactive Modules & Standards</span>
          </button>

          <button
            onClick={() => setActiveCurriculumSection('library')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCurriculumSection === 'library'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookMarked className="w-4 h-4 text-amber-300" />
            <span>Virtual Library (3D Historical Shelf)</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {activeCurriculumSection === 'modules' ? '4 Core Modules • 12 Lessons' : 'Seminal Manuscripts & Classic Textbooks'}
        </span>
      </div>

      {activeCurriculumSection === 'library' ? (
        <VirtualLibraryShelf initialSubject={initialLibrarySubject ?? 'all'} onNavigateToLab={onSelectLab} />
      ) : (
        <div className="w-full flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Left Sidebar: Course Library */}
          <div className="w-full md:w-80 shrink-0 flex flex-col gap-3">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-1">
                KEV Curriculum Tracks
              </span>
              <p className="text-xs text-slate-400">
                Aligned with ISTE, CASEL & UNESCO scientific frameworks at KEV
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {COURSES.map((c) => {
                const CIcon = ICON_MAP[c.iconName] || BookOpen;
                const isSel = selectedCourse.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCourse(c);
                      setSelectedLesson(c.lessons[0]);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSel
                        ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/80 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${c.color} text-white shrink-0 shadow-sm`}>
                      <CIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-mono text-cyan-400 font-semibold">{c.category}</span>
                        <span>{c.gradeLevel}</span>
                      </div>
                      <h4 className="font-semibold text-white text-xs truncate leading-snug">
                        {c.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {c.durationMinutes} min
                        </span>
                        <span>•</span>
                        <span>{c.lessons.length} Modules</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Area: Active Course & Lesson Detail */}
          <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 overflow-y-auto flex flex-col shadow-xl">
            {/* Course Banner Header */}
            <div className="pb-5 border-b border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold">
                    {selectedCourse.category}
                  </span>
                  <span className="text-xs text-slate-400">{selectedCourse.gradeLevel}</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-wide">{selectedCourse.title}</h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
                  {selectedCourse.summary}
                </p>
              </div>

              <button
                onClick={() => onSelectLab(selectedCourse.associatedLab)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Launch 3D Virtual Lab
              </button>
            </div>

            {/* Lesson Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
              {selectedCourse.lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 ${
                    selectedLesson.id === lesson.id
                      ? 'bg-blue-600 text-white font-semibold shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  {lesson.title}
                </button>
              ))}
            </div>

            {/* Active Lesson Content */}
            <div className="flex-1 space-y-6">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                    Module Objectives
                  </span>
                  <span className="text-xs text-slate-400">Time: {selectedLesson.estimatedMinutes} min</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{selectedLesson.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedLesson.overview}</p>
              </div>

              {/* Theory Topics & Takeaways */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block mb-2">
                    Key Scientific Principles
                  </span>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Empirical validation through 3D interactive physics and reaction visualizers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Mathematical derivation with variable constant manipulation in real-time.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 block mb-2">
                    Actionable Learning Tasks
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Complete the 3D lab experiment, record 3D visual snapshots with the lab camera, and pass the conceptual assessment quiz to earn XP.
                  </p>
                  <button
                    onClick={() => onOpenQuiz(selectedLesson)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    Take Module Assessment Quiz (+50 XP)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
