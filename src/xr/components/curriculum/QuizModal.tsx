import React, { useState } from 'react';
import { QuizQuestion } from '../../types';
import { Award, CheckCircle, XCircle, X, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../toast/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  questions: QuizQuestion[];
  onPassQuiz: (xpEarned: number) => void;
}

export const QuizModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lessonTitle,
  questions,
  onPassQuiz,
}) => {
  const { showScoreToast } = useToast();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      const finalScore = score;
      const earnedXP = Math.round((finalScore / questions.length) * 50) + 25;
      onPassQuiz(earnedXP);
      showScoreToast(finalScore, questions.length, lessonTitle);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
              Knowledge Checkpoint
            </span>
            <h3 className="font-bold text-white text-sm">{lessonTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!isCompleted ? (
            <div>
              {/* Progress */}
              <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                <span>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="font-mono text-cyan-400 font-semibold">
                  Score: {score}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <h4 className="font-semibold text-white text-base leading-relaxed mb-4">
                {currentQ.question}
              </h4>

              {/* Options */}
              <div className="space-y-2.5 mb-5">
                {currentQ.options.map((opt, idx) => {
                  let btnStyle = 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60';
                  if (isAnswered) {
                    if (idx === currentQ.correctIndex) {
                      btnStyle = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-medium';
                    } else if (idx === selectedOption) {
                      btnStyle = 'bg-red-950/60 border-red-500/60 text-red-200';
                    } else {
                      btnStyle = 'opacity-40 bg-slate-950 border-slate-800 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswered}
                      className={`w-full p-3.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {isAnswered && idx === currentQ.correctIndex && (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                      )}
                      {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Scientific Explanation when answered */}
              {isAnswered && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed mb-5 animate-in fade-in">
                  <span className="font-semibold text-cyan-400 block mb-1">Scientific Insight:</span>
                  {currentQ.explanation}
                </div>
              )}

              {/* Next Button */}
              {isAnswered && (
                <button
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-white text-lg mb-1">Quiz Completed!</h4>
              <p className="text-xs text-slate-400 mb-4">
                You answered {score} of {questions.length} questions correctly.
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 max-w-xs mx-auto mb-6 text-xs flex justify-around">
                <div>
                  <span className="text-slate-500 block">Accuracy</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {Math.round((score / questions.length) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">XP Gained</span>
                  <span className="font-bold text-cyan-400 font-mono text-sm">+50 XP</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={handleRestart}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25 cursor-pointer"
                >
                  Continue Learning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
