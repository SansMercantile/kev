import React, { useState, useEffect } from 'react';
import { Sparkles, X, Send, Volume2, VolumeX, Loader2, BookOpen, Lightbulb } from 'lucide-react';
import { LabId } from '../../types';
import { xrApi, xrAuthHeaders } from '../../lib/xrApi';
import { getStudyLevelId } from '../../lib/studyLevel';
import { getAnswerLanguage } from '../../../i18n/index.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeLab: LabId;
  initialQuestion?: string;
}

export const AILabTutorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeLab,
  initialQuestion,
}) => {
  const [question, setQuestion] = useState<string>('');
  const [conversation, setConversation] = useState<
    { role: 'user' | 'assistant'; text: string; time: string; demo?: boolean }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
      handleAskQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  if (!isOpen) return null;

  const handleAskQuestion = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setConversation((prev) => [...prev, { role: 'user', text: q, time: timeStr }]);
    setQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch(xrApi('/tutor'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
        body: JSON.stringify({
          question: q,
          currentLab: activeLab,
          context: `Student is actively running the 3D ${activeLab} simulation at KEV XR Science Academy (https://kev.sansmercantile.com/).`,
          studentLevel: getStudyLevelId(),
          language: getAnswerLanguage(),
        }),
      });

      const data = await res.json();
      const reply = data.answer || 'Let’s look at the physical principles in this 3D model.';

      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          demo: Boolean(data.isDemoGuidance),
        },
      ]);
    } catch (err) {
      console.error('Failed to get response from AI tutor:', err);
      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Notice how the 3D spatial geometry minimizes energy states. Try adjusting your simulation variables to observe the direct physical consequences!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Text-to-speech
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const cleanText = text.replace(/[*_#`$]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const SUGGESTED_PROMPTS: Record<LabId, string[]> = {
    chemistry: [
      'Why is water bent at 104.5° instead of a flat 180° line?',
      'How does thermal kinetic energy affect covalent bond vibrations?',
      'What happens during an exothermic hydrocarbon combustion reaction?',
    ],
    astrophysics: [
      'Explain Kepler’s Second Law: why do planets speed up at perihelion?',
      'How do space probes use gravitational slingshots to reach outer planets?',
      'What is the difference between an elliptical orbit and escape trajectory?',
    ],
    biology: [
      'How do mitochondrial cristae folds maximize ATP energy generation?',
      'Explain the complementary base pairing rule in the DNA double helix.',
      'How does RNA polymerase transcribe DNA into mRNA?',
    ],
    optics: [
      'Why does white light split into a rainbow spectrum inside a glass prism?',
      'What is the critical angle and how does total internal reflection power fiber optics?',
      'How does Snell’s Law calculate the bending of light at a boundary?',
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Professor KEV • AI Science Mentor
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Socratic XR Tutor
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ask questions about your 3D scientific simulation in real time
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isSpeaking && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Message List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-cyan-400 mb-3 border border-slate-700">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                Ready to explore the {activeLab} simulation!
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-5">
                Select a recommended question below or type your own question to get guided scientific insight.
              </p>

              {/* Quick Prompts */}
              <div className="w-full space-y-2 text-left max-w-lg">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Recommended Experiments & Concepts:
                </span>
                {SUGGESTED_PROMPTS[activeLab]?.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(p)}
                    className="w-full p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 text-left transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <span>{p}</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-yellow-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  {msg.role === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        Professor KEV • Socratic Response
                        {msg.demo && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30" title="Static offline guidance — reconnect for a live tutor answer">
                            OFFLINE GUIDANCE
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => handleSpeak(msg.text)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {isSpeaking ? 'Stop Audio' : 'Listen'}
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">{msg.time}</span>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-purple-300 p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 max-w-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Professor KEV is analyzing simulation physics...</span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskQuestion();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about this simulation or request an experiment challenge..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
