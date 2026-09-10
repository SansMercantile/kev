import React, { useState } from 'react';
import { QuizQuestion } from '../../types';
import { Award, CheckCircle2, Clock, HelpCircle, RotateCcw, Sparkles, XCircle, ArrowRight, ShieldCheck, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../toast/ToastContext';

interface Props {
  onCompleteTest: (scorePercent: number, xpReward: number) => void;
  onRequestAITutor?: (prompt: string) => void;
}

interface ExamModule {
  id: string;
  title: string;
  category: string;
  timeLimitMinutes: number;
  xpReward: number;
  description: string;
  questions: QuizQuestion[];
}

const EXAM_MODULES: ExamModule[] = [
  {
    id: 'exam-comprehensive-stem',
    title: 'Mid-Term Comprehensive STEM Diagnostic',
    category: 'Multi-Disciplinary Science',
    timeLimitMinutes: 10,
    xpReward: 100,
    description: 'A formal assessment covering molecular VSEPR angles, Keplerian planetary orbits, eukaryotic organelle function, and Snell’s Law of refraction.',
    questions: [
      {
        id: 'q1',
        question: 'Which molecular geometry corresponds to a central atom with steric number 4, comprising 2 bonding pairs and 2 non-bonding lone pairs (e.g. H₂O)?',
        options: ['Linear (180°)', 'Trigonal Planar (120°)', 'Bent (~104.5°)', 'Octahedral (90°)'],
        correctIndex: 2,
        explanation: 'Water has 4 electron pairs in a tetrahedral arrangement, but the 2 non-bonding lone pairs exert extra repulsion, compressing the bond angle from 109.5° down to ~104.5° in a Bent geometry.',
      },
      {
        id: 'q2',
        question: 'According to Kepler’s 3rd Law of Planetary Motion, if a planet’s orbital semi-major axis is 4 AU, what is its orbital period in Earth years?',
        options: ['2 years', '4 years', '8 years', '16 years'],
        correctIndex: 2,
        explanation: 'Kepler’s 3rd Law states T² = a³. Here, a = 4, so a³ = 64. Taking the square root gives T = √64 = 8 Earth years.',
      },
      {
        id: 'q3',
        question: 'When a beam of light travels from air (n = 1.0) into crown glass (n = 1.52) at an incident angle of 30° to the normal, what happens to the beam?',
        options: [
          'It speeds up and bends away from the normal',
          'It slows down and bends toward the normal',
          'It reflects completely with zero refraction',
          'Its wavelength increases while frequency drops',
        ],
        correctIndex: 1,
        explanation: 'Light slows down in optically denser media (higher index n), causing the wavefront to pivot toward the normal (perpendicular) line according to Snell’s Law: n₁ sin θ₁ = n₂ sin θ₂.',
      },
      {
        id: 'q4',
        question: 'During cellular transcription, which mRNA nucleotide base pairs with a DNA Adenine (A) nucleotide on the template strand?',
        options: ['Thymine (T)', 'Uracil (U)', 'Cytosine (C)', 'Guanine (G)'],
        correctIndex: 1,
        explanation: 'RNA contains Uracil (U) instead of Thymine (T). Therefore, RNA polymerase incorporates Uracil to pair with genomic Adenine during transcription.',
      },
    ],
  },
  {
    id: 'exam-optics-physics',
    title: 'Wave Optics & Electromagnetic Spectrum Exam',
    category: 'Physics',
    timeLimitMinutes: 8,
    xpReward: 75,
    description: 'Evaluates Snell’s Law, dispersion across glass prisms, index of refraction, and critical angle thresholds for fiber-optic communication.',
    questions: [
      {
        id: 'qo1',
        question: 'Total Internal Reflection can ONLY occur when light travels under which condition?',
        options: [
          'From a medium of lower refractive index to higher refractive index',
          'From a medium of higher refractive index to lower refractive index at an angle exceeding the critical angle',
          'Only when light passes through a vacuum at normal incidence',
          'Whenever white light is dispersed into a rainbow spectrum',
        ],
        correctIndex: 1,
        explanation: 'Total Internal Reflection requires light to start in an optically denser medium (higher n₁) traveling toward a rarer medium (lower n₂), at an incident angle θ₁ greater than the critical angle θc = arcsin(n₂/n₁).',
      },
      {
        id: 'qo2',
        question: 'Why does white light disperse into a spectrum of colors when entering a glass triangular prism?',
        options: [
          'Different wavelengths of light travel at different speeds in glass, causing violet light to bend more than red light',
          'The glass absorbs the red photons and transmits the violet photons at higher amplitude',
          'Prisms heat the light beam and shift its thermal blackbody emission spectrum',
          'Total internal reflection only works for green wavelengths',
        ],
        correctIndex: 0,
        explanation: 'Dispersion occurs because glass has a slightly higher refractive index for shorter wavelengths (violet ~400nm) than for longer wavelengths (red ~700nm). Violet light therefore bends more sharply.',
      },
    ],
  },
];

export const StandardizedTestingCenter: React.FC<Props> = ({
  onCompleteTest,
  onRequestAITutor,
}) => {
  const { showToast } = useToast();
  const [selectedExam, setSelectedExam] = useState<ExamModule>(EXAM_MODULES[0]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [testCompleted, setTestCompleted] = useState<boolean>(false);

  const currentQ = selectedExam.questions[currentQIndex];
  const totalQuestions = selectedExam.questions.length;

  const handleSelectOption = (optIdx: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: optIdx }));
  };

  const handleFinishExam = () => {
    setShowResults(true);
    let correctCount = 0;
    selectedExam.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correctCount++;
    });

    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const xpEarned = scorePercent >= 75 ? selectedExam.xpReward : Math.round(selectedExam.xpReward * 0.5);

    if (!testCompleted) {
      setTestCompleted(true);
      onCompleteTest(scorePercent, xpEarned);
      if (scorePercent >= 75) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      }
      showToast({
        type: scorePercent >= 75 ? 'badge' : 'info',
        title: `Exam Score: ${scorePercent}% (${scorePercent >= 75 ? 'Honors Pass' : 'Review Needed'})`,
        message: `You earned +${xpEarned} XP logged directly into your academic gradebook.`,
      });
    }
  };

  const handleRetakeExam = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setCurrentQIndex(0);
    setTestCompleted(false);
  };

  return (
    <div className="space-y-6">
      {/* Exam Header */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Standardized STEM Assessment & Testing Center
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-500/30">
              GRADE 9 CURRICULUM
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Formative checkpoints and benchmark exams with instant diagnostic explanations and gradebook synchronization.
          </p>
        </div>

        {/* Exam Module Switcher */}
        <div className="flex items-center gap-2">
          {EXAM_MODULES.map((exam) => (
            <button
              key={exam.id}
              onClick={() => {
                setSelectedExam(exam);
                handleRetakeExam();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedExam.id === exam.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {exam.title.split(' ')[0]} Exam
            </button>
          ))}
        </div>
      </div>

      {/* Main Testing Workspace */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        {/* Progress & Question Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase">
              {selectedExam.category}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              Question {currentQIndex + 1} of {totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedExam.timeLimitMinutes}m Target</span>
            </div>
            <span className="text-amber-400 font-bold">+{selectedExam.xpReward} XP</span>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="space-y-4">
          <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed">
            {currentQ.question}
          </h4>

          {/* Answer Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentQIndex] === optIdx;
              const isCorrect = optIdx === currentQ.correctIndex;
              let btnStyle = 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200';

              if (showResults) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-semibold';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-200';
                }
              } else if (isSelected) {
                btnStyle = 'bg-purple-600/20 border-purple-500/60 text-purple-200 font-semibold shadow-sm';
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-400">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {showResults && (
                    <div>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Socratic Explanatory Feedback (after submission or when viewing results) */}
          {showResults && (
            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 text-xs space-y-1.5 animate-fade-in">
              <div className="flex items-center gap-2 text-purple-300 font-bold">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Scientific Concept Analysis:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Navigation & Submission Toolbar */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <button
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((prev) => prev - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={currentQIndex === totalQuestions - 1}
              onClick={() => setCurrentQIndex((prev) => prev + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-2">
            {showResults ? (
              <button
                onClick={handleRetakeExam}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Exam</span>
              </button>
            ) : (
              <button
                disabled={Object.keys(selectedAnswers).length < totalQuestions}
                onClick={handleFinishExam}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer transition-all"
              >
                <span>Submit Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
