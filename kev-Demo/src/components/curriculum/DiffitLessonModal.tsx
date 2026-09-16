import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Download,
  Printer,
  Copy,
  Check,
  X,
  RefreshCw,
  Zap,
  FlaskConical,
  ExternalLink
} from 'lucide-react';
import { Lesson, LabId } from '../../types';
import { soundManager } from '../../utils/soundEffects';
import { useToast } from '../toast/ToastContext';

interface VocabularyItem {
  term: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  example: string;
}

interface QuestionItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface DifferentiatedData {
  adaptedPassage: string;
  keyTakeaways: string[];
  vocabularyList: VocabularyItem[];
  assessmentQuestions: QuestionItem[];
  socraticPrompt: string;
  handsOnLabActivity: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  courseTitle: string;
  associatedLab?: LabId;
  onLaunchLab?: (labId: LabId) => void;
  onSaveToNotebook?: (notesText: string) => void;
}

type GradeLevel = 'elementary' | 'middle' | 'high_school' | 'ap_honors' | 'college';

const GRADE_LEVELS: { id: GradeLevel; label: string; sub: string; lexile: string }[] = [
  { id: 'elementary', label: 'Elementary', sub: 'Grades 3-5', lexile: '450L-700L' },
  { id: 'middle', label: 'Middle School', sub: 'Grades 6-8', lexile: '750L-1000L' },
  { id: 'high_school', label: 'High School', sub: 'Grades 9-10', lexile: '1050L-1200L' },
  { id: 'ap_honors', label: 'AP / Honors', sub: 'Grades 11-12', lexile: '1250L-1400L' },
  { id: 'college', label: 'College / Research', sub: 'Undergrad', lexile: '1450L+' },
];

export const DiffitLessonModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lesson,
  courseTitle,
  associatedLab,
  onLaunchLab,
  onSaveToNotebook,
}) => {
  const { showToast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<GradeLevel>('middle');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [diffitData, setDiffitData] = useState<DifferentiatedData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Fetch differentiated content whenever modal opens or level changes
  useEffect(() => {
    if (!isOpen) return;

    fetchDifferentiatedContent(selectedLevel);
  }, [isOpen, selectedLevel, lesson.id]);

  const fetchDifferentiatedContent = async (level: GradeLevel) => {
    setIsLoading(true);
    setUserAnswers({});
    try {
      const res = await fetch('/api/curriculum/differentiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          subject: courseTitle,
          originalDescription: lesson.description,
          gradeLevel: level,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setDiffitData(data.data);
      }
    } catch (err) {
      console.error('Diffit fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIdx: number, correctIdx: number) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
    if (optionIdx === correctIdx) {
      soundManager.playSuccess();
      showToast({
        type: 'badge',
        title: 'Correct Answer!',
        message: 'Concept mastery validated (+10 XP).',
      });
    } else {
      soundManager.playClick();
    }
  };

  const handleSaveObservations = () => {
    if (!diffitData || !onSaveToNotebook) return;
    const notes = `[Diffit Adapted Lesson: ${lesson.title} (${selectedLevel.toUpperCase()})]\n\nKey Takeaways:\n${diffitData.keyTakeaways.map((t) => `• ${t}`).join('\n')}\n\nVocabulary:\n${diffitData.vocabularyList.map((v) => `• ${v.term} (${v.partOfSpeech}): ${v.definition}`).join('\n')}\n\nInquiry Prompt:\n${diffitData.socraticPrompt}`;
    onSaveToNotebook(notes);
    soundManager.playSuccess();
    showToast({
      type: 'badge',
      title: 'Saved to Lab Notebook',
      message: `Differentiated notes for ${lesson.title} saved to observations!`,
    });
  };

  const handleCopyPassage = () => {
    if (!diffitData) return;
    navigator.clipboard.writeText(
      `${lesson.title} (${selectedLevel.toUpperCase()})\n\n${diffitData.adaptedPassage}\n\nKey Takeaways:\n${diffitData.keyTakeaways.join('\n')}`
    );
    setHasCopied(true);
    soundManager.playClick();
    setTimeout(() => setHasCopied(false), 2000);
    showToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: 'Adapted lesson text copied.',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 rounded-2xl border border-blue-500/40 shadow-2xl shadow-blue-950/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Diffit AI • Lesson Differentiation Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Adaptive Pedagogy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instantly re-level reading difficulty, scaffolded vocabulary & assessments for <strong>{lesson.title}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grade / Reading Level Selector Tabs */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-mono text-slate-400 mr-2 shrink-0 flex items-center gap-1">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            Target Level:
          </span>
          {GRADE_LEVELS.map((gl) => {
            const isSelected = selectedLevel === gl.id;
            return (
              <button
                key={gl.id}
                onClick={() => {
                  setSelectedLevel(gl.id);
                  soundManager.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 flex flex-col items-start ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 border border-blue-400'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{gl.label}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                    ({gl.lexile})
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-sm font-semibold text-white">
                Differentiating lesson into {GRADE_LEVELS.find((g) => g.id === selectedLevel)?.label}...
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Calibrating Lexile readability bands, extracting pedagogical vocabulary, and generating scaffolded assessment questions.
              </p>
            </div>
          ) : diffitData ? (
            <div className="space-y-6">
              {/* Leveled Passage & Key Takeaways Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Passage (7 cols) */}
                <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Adapted Instructional Passage
                    </span>
                    <button
                      onClick={handleCopyPassage}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{hasCopied ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-200 leading-relaxed space-y-3 font-sans">
                    {diffitData.adaptedPassage.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-slate-300 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-300 font-mono text-[11px] block">
                        Socratic Critical Inquiry Prompt:
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">{diffitData.socraticPrompt}</p>
                    </div>
                  </div>
                </div>

                {/* Key Takeaways & Lab Activity (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Takeaways Card */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold block pb-2 border-b border-slate-800">
                      Essential Concept Takeaways
                    </span>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {diffitData.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Virtual Lab Connection Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                        Virtual Lab Experiment
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 font-bold">
                        Hands-On
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {diffitData.handsOnLabActivity}
                    </p>
                    {associatedLab && onLaunchLab && (
                      <button
                        onClick={() => {
                          soundManager.playSuccess();
                          onLaunchLab(associatedLab);
                          onClose();
                        }}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Launch Related 3D Virtual Lab</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scaffolded Vocabulary List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Targeted Vocabulary & Linguistic Scaffolding
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {diffitData.vocabularyList.length} Words Defined
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {diffitData.vocabularyList.map((vocab, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/30 transition-colors space-y-1.5"
                    >
                      <div className="flex items-baseline justify-between">
                        <h4 className="text-sm font-bold text-white">{vocab.term}</h4>
                        <span className="text-[10px] font-mono text-blue-400 italic">
                          {vocab.partOfSpeech}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        /{vocab.pronunciation}/
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {vocab.definition}
                      </p>
                      <p className="text-[11px] text-slate-400 italic border-t border-slate-900 pt-1">
                        "{vocab.example}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Differentiated Assessment Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Differentiated Formative Check
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Instant Interactive Self-Assessment
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {diffitData.assessmentQuestions.map((q, qIdx) => {
                    const selectedAns = userAnswers[q.id];
                    const isAnswered = selectedAns !== undefined;

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono uppercase text-blue-400 font-bold block">
                            Question {qIdx + 1}
                          </span>
                          <h4 className="text-xs font-semibold text-white leading-tight">
                            {q.question}
                          </h4>

                          <div className="space-y-1.5 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedAns === optIdx;
                              const isCorrect = optIdx === q.correctIndex;

                              let btnClasses =
                                'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                              if (isAnswered) {
                                if (isSelected) {
                                  btnClasses = isCorrect
                                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                    : 'bg-rose-950/80 border-rose-500 text-rose-200';
                                } else if (isCorrect) {
                                  btnClasses = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleSelectOption(q.id, optIdx, q.correctIndex)}
                                  className={`w-full text-left p-2 rounded-lg border text-xs transition-all cursor-pointer flex items-start gap-2 ${btnClasses}`}
                                >
                                  <span className="font-mono text-[10px] text-slate-400 shrink-0 mt-0.5">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span className="leading-tight">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {isAnswered && (
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-850 text-[11px] text-slate-300 leading-relaxed font-sans">
                            <span className="font-bold font-mono text-[10px] text-blue-400 block mb-0.5">
                              Explanation:
                            </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            Powered by Diffit-Style Curriculum Engine • KEV XR
          </span>

          <div className="flex items-center gap-2">
            {onSaveToNotebook && (
              <button
                onClick={handleSaveObservations}
                disabled={!diffitData}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Save to Lab Observations (+20 XP)
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Differentiated Handout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
