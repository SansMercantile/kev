import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  ClipboardCopy,
  Download,
  FileCheck,
  GraduationCap,
  HelpCircle,
  Printer,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { EDUCATION_TIERS } from '../../data/advancedLabSystemsData';
import { EducationTier, LabId } from '../../types';

interface LabStudyKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  labId: LabId;
  currentTier: EducationTier;
  onSelectTier?: (tier: EducationTier) => void;
  onSaveToNotebook?: (entry: any) => void;
}

export const LabStudyKitModal: React.FC<LabStudyKitModalProps> = ({
  isOpen,
  onClose,
  labId,
  currentTier,
  onSelectTier,
  onSaveToNotebook,
}) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'forms'>('flashcards');
  const [studyKit, setStudyKit] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedForms, setCopiedForms] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadStudyKit();
    }
  }, [isOpen, labId, currentTier]);

  const loadStudyKit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/lab-study-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labId,
          tier: currentTier,
          experimentTitle: `${labId.toUpperCase()} Virtual Experimentation Suite`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStudyKit(data.studyKit);
      }
    } catch (e) {
      // client fallback
      setStudyKit({
        labId,
        tier: currentTier,
        experimentTitle: `${labId.toUpperCase()} Virtual Experimentation Suite`,
        summary: `Adaptive science brief for ${labId} laboratory scaled for ${currentTier} students. Focuses on conservation laws, structural equilibria, and empirical observation.`,
        flashcards: [
          {
            id: 'fc-1',
            term: labId === 'chemistry' ? 'VSEPR Geometry' : labId === 'astrophysics' ? 'Keplerian Resonance' : labId === 'optics' ? 'Total Internal Reflection' : 'Proton Motive Force',
            phonetic: 'VES-per / KEP-ler / KRIT-ih-kuhl',
            definition: 'Fundamental governing law determining molecular shape, orbital paths, or light refraction.',
            relevance: 'Minimizes potential energy and ensures system equilibrium.',
          },
          {
            id: 'fc-2',
            term: 'Empirical Telemetry',
            phonetic: 'em-PEER-ih-kuhl teh-LEM-uh-tree',
            definition: 'Quantitative measurements transmitted from sensor instruments during an active trial.',
            relevance: 'Verifies mathematical models against observed physical phenomena.',
          },
        ],
        printableQuiz: [
          {
            questionNumber: 1,
            question: `In the 3D ${labId} simulation, what is the primary consequence of increasing the independent variable?`,
            options: [
              'A: The system shifts towards minimum potential energy',
              'B: Total energy is spontaneously destroyed',
              'C: Physical constants change their mathematical values',
              'D: Molecular bonds cease to vibrate',
            ],
            correctOption: 'A',
            explanation: 'Physical systems naturally minimize free energy or maximize entropy in equilibrium.',
          },
        ],
        googleFormsExportText: `Title: KEV Academy - ${labId} Assessment (${currentTier})\n\n1. In the 3D ${labId} simulation, what is the primary consequence of increasing the independent variable?\n( ) The system shifts towards minimum potential energy [CORRECT]\n( ) Total energy is spontaneously destroyed\n( ) Physical constants change their mathematical values\n( ) Molecular bonds cease to vibrate`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const tierInfo = EDUCATION_TIERS[currentTier] || EDUCATION_TIERS.high_school;

  const handleCopyForms = () => {
    if (studyKit?.googleFormsExportText) {
      navigator.clipboard.writeText(studyKit.googleFormsExportText);
      setCopiedForms(true);
      setTimeout(() => setCopiedForms(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveToNotebook = () => {
    if (onSaveToNotebook && studyKit) {
      onSaveToNotebook({
        id: `studykit-${Date.now()}`,
        title: `1-Click Study Kit: ${studyKit.experimentTitle} (${tierInfo.shortBadge})`,
        discipline: labId,
        date: new Date().toISOString().split('T')[0],
        notes: `Rigor Tier: ${tierInfo.label}\nSummary: ${studyKit.summary}\nFlashcards:\n${studyKit.flashcards.map((f: any) => `- ${f.term} (${f.phonetic}): ${f.definition}`).join('\n')}\nSelf-Assessment Quiz Included.`,
        tags: ['Study Kit', tierInfo.shortBadge, labId],
      });
      alert('1-Click Study Kit saved to your Lab Notebook!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl shadow-indigo-950/70 text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border-b border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Adaptive Science Brief & 1-Click Study Kit
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  {tierInfo.shortBadge}
                </span>
              </div>
              <p className="text-xs text-indigo-300/80">
                Auto-generated vocabulary flashcards, leveled summaries, and printable assessment quizzes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rigor Selector Bar */}
        {onSelectTier && (
          <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-slate-400 font-medium">Scaffolded Rigor Level:</span>
            <div className="flex items-center gap-1.5">
              {(Object.keys(EDUCATION_TIERS) as EducationTier[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onSelectTier(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    currentTier === t
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {EDUCATION_TIERS[t].shortBadge}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
              <p>Synthesizing scaffolded study materials for {tierInfo.label}...</p>
            </div>
          ) : (
            <>
              {/* Leveled Summary Card */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-slate-950 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Leveled Scientific Brief ({tierInfo.shortBadge})
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300">
                    Lexile: {tierInfo.lexileLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {studyKit.summary}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('flashcards')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'flashcards'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  Vocabulary Flashcards ({studyKit.flashcards.length})
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'quiz'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  Self-Assessment Quiz
                </button>
                <button
                  onClick={() => setActiveTab('forms')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'forms'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  Google Forms & Printable Export
                </button>
              </div>

              {/* Tab 1: Vocabulary Flashcards */}
              {activeTab === 'flashcards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studyKit.flashcards.map((f: any) => (
                    <div
                      key={f.id}
                      className="bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{f.term}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                          {f.phonetic}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{f.definition}</p>
                      <div className="text-[11px] text-indigo-400 pt-1 border-t border-slate-900">
                        <strong className="text-indigo-300">Lab Application: </strong>
                        {f.relevance}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Quiz */}
              {activeTab === 'quiz' && (
                <div className="space-y-4">
                  {studyKit.printableQuiz.map((q: any) => (
                    <div
                      key={q.questionNumber}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                          {q.questionNumber}
                        </span>
                        <div className="text-xs font-semibold text-white leading-relaxed">
                          {q.question}
                        </div>
                      </div>

                      <div className="space-y-1.5 pl-7">
                        {q.options.map((opt: string, i: number) => (
                          <div
                            key={i}
                            className={`p-2 rounded-xl text-xs border transition-colors ${
                              opt.startsWith(q.correctOption)
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            {opt} {opt.startsWith(q.correctOption) && '✓ [Correct Answer]'}
                          </div>
                        ))}
                      </div>

                      <div className="pl-7 text-[11px] text-slate-400 italic">
                        Explanation: {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Google Forms & Printable */}
              {activeTab === 'forms' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Google Forms / LMS Import Format
                      </span>
                      <button
                        onClick={handleCopyForms}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedForms ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <ClipboardCopy className="w-3.5 h-3.5" />
                            <span>Copy Google Forms Text</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3 bg-slate-900 rounded-xl text-[11px] font-mono text-indigo-300 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {studyKit.googleFormsExportText}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Study Sheet</span>
            </button>
            <button
              onClick={handleSaveToNotebook}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Save to Lab Notebook</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
