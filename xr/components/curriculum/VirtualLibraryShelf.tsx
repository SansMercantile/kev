import React, { useState, useEffect } from 'react';
import { LibraryPublication, LabId } from '../../types';
import { VIRTUAL_LIBRARY_PUBLICATIONS } from '../../data/virtualLibrary';
import { xrAuthHeaders, libApi } from '../../lib/xrApi';
import { cachedFetch, onReconnect } from '../../lib/offline';
import { BookOpen, X, Sparkles, ExternalLink, Bookmark, Search, ArrowRight, FlaskConical, Orbit, Dna, Glasses, Award, BookMarked, Layers } from 'lucide-react';
import { useToast } from '../toast/ToastContext';

interface Props {
  onNavigateToLab: (labId: LabId) => void;
}

export const VirtualLibraryShelf: React.FC<Props> = ({ onNavigateToLab }) => {
  const { showToast } = useToast();
  const [selectedBook, setSelectedBook] = useState<LibraryPublication | null>(null);
  const [activeSubject, setActiveSubject] = useState<'all' | LabId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [packTopics, setPackTopics] = useState<{ id: string; title: string; summary: string; keyTerms: string[] }[]>([]);
  const [packOffline, setPackOffline] = useState<boolean>(false);

  const PACK_SUBJECT: Record<LabId, string> = {
    chemistry: 'xr_chem',
    astrophysics: 'xr_astro',
    biology: 'xr_bio',
    optics: 'xr_optics',
  };

  // Offline study packs: versioned topic notes from GET /library/pack,
  // cached in IndexedDB for no-internet study.
  useEffect(() => {
    if (activeSubject === 'all') {
      setPackTopics([]);
      return;
    }
    let cancelled = false;
    // Narrowed once here so the async closure below can index the pack map:
    // TS does not carry the `=== 'all'` early return into the nested function.
    const subject: LabId = activeSubject;
    const packSubject = PACK_SUBJECT[subject];
    async function loadPack() {
      try {
        const data = await cachedFetch<{ pack?: { subjects?: { topics?: { id: string; title: string; summary: string; keyTerms: string[] }[] }[] } }>(
          `${libApi('/library/pack')}?subject=${packSubject}`,
          { ttlMs: 7 * 24 * 3600 * 1000, headers: { ...xrAuthHeaders() } }
        );
        if (!cancelled) {
          setPackTopics(data?.pack?.subjects?.[0]?.topics || []);
          setPackOffline(false);
        }
      } catch {
        if (!cancelled) {
          setPackTopics([]);
          setPackOffline(true);
        }
      }
    }
    loadPack();
    return onReconnect(loadPack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject]);

  const filteredBooks = VIRTUAL_LIBRARY_PUBLICATIONS.filter((book) => {
    if (activeSubject !== 'all' && book.associatedLab !== activeSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(q) ||
        book.authors.toLowerCase().includes(q) ||
        book.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getLabIcon = (labId: LabId) => {
    switch (labId) {
      case 'chemistry':
        return <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />;
      case 'astrophysics':
        return <Orbit className="w-3.5 h-3.5 text-amber-400" />;
      case 'biology':
        return <Dna className="w-3.5 h-3.5 text-emerald-400" />;
      case 'optics':
        return <Glasses className="w-3.5 h-3.5 text-violet-400" />;
    }
  };

  const handleLaunchLabFromBook = (labId: LabId, bookTitle: string) => {
    setSelectedBook(null);
    showToast({
      type: 'info',
      title: 'Testing Theoretical Principles in 3D',
      message: `Transferring empirical parameters from "${bookTitle}" directly to the lab workbench.`,
    });
    onNavigateToLab(labId);
  };

  return (
    <div className="space-y-6">
      {/* Library Top Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white tracking-wide">
                KEV Academy Virtual Science Library
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                Primary Historical Texts & Papers
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Open seminal research manuscripts, historical treatises, and classic textbooks. Discover the original mathematical derivations that power your 3D interactive virtual labs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{VIRTUAL_LIBRARY_PUBLICATIONS.length} Archived Volumes</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 mr-2 font-mono">Discipline:</span>
          {(['all', 'chemistry', 'astrophysics', 'biology', 'optics'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveSubject(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubject === filter
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {filter === 'all'
                ? 'All Publications'
                : filter === 'chemistry'
                ? 'Chemistry & Bonding'
                : filter === 'astrophysics'
                ? 'Celestial Mechanics'
                : filter === 'biology'
                ? 'Genomics & Cell Bio'
                : 'Optics & Photons'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search authors, titles or theories..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Offline study pack: versioned topic notes, cached in IndexedDB */}
      {activeSubject !== 'all' && (packTopics.length > 0 || packOffline) && (
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked className="w-4 h-4 text-emerald-300" />
            <h3 className="text-sm font-bold text-white">Offline study pack</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
              {packOffline ? 'cached copy' : 'synced · works offline'}
            </span>
          </div>
          {packTopics.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {packTopics.map((topic) => (
                <div key={topic.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs font-bold text-white">{topic.title}</div>
                  <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">{topic.summary}</div>
                  <div className="text-[10px] text-emerald-300/80 font-mono mt-1.5">{topic.keyTerms.join(' · ')}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">Study pack unavailable offline — open this discipline once while online to cache it.</p>
          )}
        </div>
      )}

      {/* 3D Visual Book Shelf */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Shelf backboard wooden / metallic gradient */}
        <div className="absolute inset-x-0 bottom-4 h-3 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 rounded-sm shadow-md shadow-black/80 pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pb-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="group cursor-pointer flex flex-col items-center"
            >
              {/* 3D Book Cover Card */}
              <div
                className={`relative w-full aspect-[2/3] max-w-[200px] rounded-r-xl rounded-l-sm bg-gradient-to-br ${book.coverGradient} border-t border-r border-b border-amber-500/30 p-4 shadow-xl group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-amber-500/20 transition-all flex flex-col justify-between overflow-hidden`}
              >
                {/* Book Spine visual crease */}
                <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-black/40 border-r border-white/10" />

                {/* Top Badge */}
                <div className="pl-2 flex items-center justify-between">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-black/50 text-amber-300 border border-amber-400/20">
                    {book.year}
                  </span>
                  <div className="p-1 rounded bg-black/40 text-white">
                    {getLabIcon(book.associatedLab)}
                  </div>
                </div>

                {/* Title & Author on Cover */}
                <div className="pl-2 py-2">
                  <span className="text-[9px] uppercase tracking-wider text-amber-300/80 font-mono block">
                    {book.type === 'classic_textbook' ? 'Treatise' : 'Seminal Paper'}
                  </span>
                  <h3 className="text-xs font-bold text-white font-serif leading-tight mt-1 line-clamp-3">
                    {book.title}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-mono mt-1 line-clamp-1">{book.authors}</p>
                </div>

                {/* Bottom Spine Details */}
                <div className="pl-2 flex items-center justify-between text-[9px] text-amber-200/70 font-mono border-t border-white/10 pt-1.5">
                  <span>{book.pagesCount} pp.</span>
                  <span className="text-cyan-300 font-bold group-hover:underline">Open Text →</span>
                </div>
              </div>

              {/* Label below shelf */}
              <div className="mt-3 text-center w-full px-1">
                <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-amber-400 transition-colors">
                  {book.title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  {book.authors} ({book.year})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Book Reader Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 bg-slate-950 border-b border-slate-800">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-20 rounded-r-md bg-gradient-to-br ${selectedBook.coverGradient} border border-amber-500/40 p-2 flex flex-col justify-between shadow-md`}
                >
                  <span className="text-[8px] font-mono text-amber-300">{selectedBook.year}</span>
                  <span className="text-[7px] font-serif text-white font-bold leading-none line-clamp-2">
                    {selectedBook.title}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedBook.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Published {selectedBook.year}</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-serif">{selectedBook.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Author(s): {selectedBook.authors}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBook(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {/* Overview & Historical Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
                    Theoretical Overview
                  </span>
                  <p className="leading-relaxed text-slate-300">{selectedBook.summary}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    Historical Context
                  </span>
                  <p className="leading-relaxed text-slate-300">{selectedBook.historicalContext}</p>
                </div>
              </div>

              {/* Core Mathematical Formulations */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3 font-mono">
                  Governing Mathematical Equations
                </span>
                <div className="space-y-3">
                  {selectedBook.keyFormulas.map((f, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                      <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm text-cyan-300 font-bold overflow-x-auto">
                        {f.formula}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        <strong className="text-slate-300">Variables:</strong> {f.symbolMeanings}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-mono">
                        <strong className="text-slate-300">KEV XR Application:</strong> {f.application}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical Manuscript Excerpt */}
              <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <span className="text-[10px] font-mono uppercase text-amber-400 tracking-widest block mb-2">
                  Original Manuscript Excerpt
                </span>
                <blockquote className="font-serif italic text-sm text-amber-100/90 leading-relaxed border-l-2 border-amber-400 pl-4">
                  {selectedBook.fullExcerpt}
                </blockquote>
                <div className="mt-3 text-right text-[10px] text-slate-500 font-mono">
                  Citation: {selectedBook.citation}
                </div>
              </div>

              {/* Academic Impact */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Award className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Academic Impact</span>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedBook.academicImpact}</p>
                </div>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Associated Simulation: <span className="text-white capitalize">{selectedBook.associatedLab} Lab</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  Close Volume
                </button>
                <button
                  onClick={() => handleLaunchLabFromBook(selectedBook.associatedLab, selectedBook.title)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  <span>Launch {selectedBook.associatedLab.toUpperCase()} Lab</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
