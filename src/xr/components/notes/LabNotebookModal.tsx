import React, { useState, useMemo, useEffect } from 'react';
import { LabSnapshot, StudentStats, LabId } from '../../types';
import { BookOpen, X, Download, Trash2, Award, CheckCircle, FileText, Share2, Sparkles, Loader2, Printer, ExternalLink, Filter, Search, FlaskConical, Orbit, Dna, Wifi, WifiOff, RefreshCw, Save, Plus } from 'lucide-react';
import { exportLabNotebookPDF } from './exportPDF';
import { useToast } from '../toast/ToastContext';
import {
  saveDraftNote,
  getAllDraftNotes,
  deleteDraftNote,
  queueOfflineObservation,
  getPendingOfflineObservations,
  syncOfflineObservations,
  DraftNote,
} from '../../utils/indexedDBStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  snapshots: LabSnapshot[];
  studentStats: StudentStats;
  onDeleteSnapshot: (id: string) => void;
  onAddObservation: (text: string) => void;
}

export const LabNotebookModal: React.FC<Props> = ({
  isOpen,
  onClose,
  snapshots,
  studentStats,
  onDeleteSnapshot,
  onAddObservation,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'snapshots' | 'observations' | 'offline_drafts' | 'certificate'>('snapshots');
  const [newObservation, setNewObservation] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [selectedLabFilter, setSelectedLabFilter] = useState<'all' | LabId | 'ar'>('all');
  const [snapshotSearchQuery, setSnapshotSearchQuery] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [draftNotes, setDraftNotes] = useState<DraftNote[]>([]);
  const [newDraftTitle, setNewDraftTitle] = useState<string>('');
  const [newDraftContent, setNewDraftContent] = useState<string>('');
  const [newDraftLab, setNewDraftLab] = useState<LabId>('chemistry');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Monitor network connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast({
        type: 'info',
        title: 'Connection Restored',
        message: 'Campus connection online. You can sync pending drafts now.',
      });
      refreshPendingSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast({
        type: 'info',
        title: 'Offline Mode Engaged',
        message: 'Using IndexedDB local storage. All observations will be saved locally.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  const refreshPendingSync = async () => {
    const pending = await getPendingOfflineObservations();
    setPendingSyncCount(pending.length);
    const drafts = await getAllDraftNotes();
    setDraftNotes(drafts);
  };

  useEffect(() => {
    if (isOpen) {
      refreshPendingSync();
    }
  }, [isOpen]);

  // Observations start empty: only the student's own logged work appears here.
  // (Previously this shipped with two fabricated sample entries — removed so
  // the notebook never presents work the student did not do.)
  const [observations, setObservations] = useState<{ id: string; date: string; text: string }[]>([]);

  // Lab type filtering logic
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((s) => {
      // Check lab type filter
      if (selectedLabFilter !== 'all') {
        if (selectedLabFilter === 'ar') {
          const isAR = s.labId === ('ar' as any) || s.labName.toLowerCase().includes('ar') || s.labName.toLowerCase().includes('pass-through');
          if (!isAR) return false;
        } else if (s.labId !== selectedLabFilter) {
          return false;
        }
      }

      // Check search query filter
      if (snapshotSearchQuery.trim()) {
        const q = snapshotSearchQuery.toLowerCase();
        const matchesName = s.labName.toLowerCase().includes(q);
        const matchesNote = (s.note || '').toLowerCase().includes(q);
        const matchesMeasurements = Object.entries(s.measurements || {}).some(
          ([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
        );
        if (!matchesName && !matchesNote && !matchesMeasurements) return false;
      }

      return true;
    });
  }, [snapshots, selectedLabFilter, snapshotSearchQuery]);

  // Counts for each lab type filter
  const filterCounts = useMemo(() => {
    return {
      all: snapshots.length,
      chemistry: snapshots.filter((s) => s.labId === 'chemistry').length,
      astrophysics: snapshots.filter((s) => s.labId === 'astrophysics').length,
      biology: snapshots.filter((s) => s.labId === 'biology').length,
      optics: snapshots.filter((s) => s.labId === 'optics').length,
      ar: snapshots.filter((s) => s.labId === ('ar' as any) || s.labName.toLowerCase().includes('ar')).length,
    };
  }, [snapshots]);

  if (!isOpen) return null;

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObservation.trim()) return;
    const item = {
      id: `obs-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      text: newObservation,
    };
    setObservations([item, ...observations]);

    if (!isOnline) {
      await queueOfflineObservation({
        id: item.id,
        text: item.text,
        labId: 'chemistry',
        timestamp: new Date().toISOString(),
        isSynced: false,
      });
      showToast({
        type: 'info',
        title: 'Offline Observation Saved',
        message: 'Saved to IndexedDB storage. Will sync to campus cloud when reconnected.',
      });
      refreshPendingSync();
    } else {
      onAddObservation(newObservation);
    }
    setNewObservation('');
  };

  const handleSyncAllOffline = async () => {
    setIsSyncing(true);
    const count = await syncOfflineObservations();
    await refreshPendingSync();
    setIsSyncing(false);
    showToast({
      type: 'success',
      title: 'Synchronized with Campus Cloud',
      message: `Successfully synchronized ${count} offline observation(s) from IndexedDB.`,
    });
  };

  const handleSaveDraftNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDraftTitle.trim() || !newDraftContent.trim()) return;
    const newDraft: DraftNote = {
      id: `draft-${Date.now()}`,
      title: newDraftTitle.trim(),
      content: newDraftContent.trim(),
      labId: newDraftLab,
      updatedAt: new Date().toLocaleTimeString(),
      isSynced: isOnline,
      tags: [newDraftLab.toUpperCase(), 'OFFLINE_DRAFT'],
    };
    await saveDraftNote(newDraft);
    setNewDraftTitle('');
    setNewDraftContent('');
    await refreshPendingSync();
    showToast({
      type: 'success',
      title: 'Draft Saved in IndexedDB',
      message: 'Draft stored in offline browser database. Accessible without network connectivity.',
    });
  };

  const handleDeleteDraft = async (id: string) => {
    await deleteDraftNote(id);
    await refreshPendingSync();
    showToast({
      type: 'info',
      title: 'Draft Deleted',
      message: 'Removed from local IndexedDB storage.',
    });
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await exportLabNotebookPDF(studentStats, snapshots, observations);
      showToast({
        type: 'info',
        title: 'PDF Summary Exported!',
        message: 'Your official KEV Science Lab record summary was downloaded successfully.',
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
      // Fallback to browser print if needed
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Student Scientific Lab Notebook
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  Level {Math.floor(studentStats.xp / 100) + 1}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Empirical observations, 3D measurements & KEV XR certifications (
                <a
                  href="https://kev.sansmercantile.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                >
                  kev.sansmercantile.com
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                )
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Offline/Online Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
              }`}
            >
              {isOnline ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-400" />
              )}
              <span>{isOnline ? 'Cloud Synced' : 'IndexedDB Offline'}</span>
            </div>

            {/* Sync Pending Observations Button */}
            {pendingSyncCount > 0 && (
              <button
                onClick={handleSyncAllOffline}
                disabled={isSyncing || !isOnline}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer disabled:opacity-50"
                title="Sync offline records to campus database"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync ({pendingSyncCount})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('snapshots')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'snapshots'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Snapshots ({snapshots.length})
            </button>
            <button
              onClick={() => setActiveTab('observations')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'observations'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hypothesis Log ({observations.length})
            </button>
            <button
              onClick={() => setActiveTab('offline_drafts')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'offline_drafts'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Save className="w-3 h-3 text-amber-400" />
              <span>IndexedDB Drafts ({draftNotes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('certificate')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'certificate'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              KEV XR Certificate
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
              title="Export formatted PDF summary for student record-keeping"
            >
              {isExportingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPDF ? 'Generating PDF...' : 'Export PDF Summary'}</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer text-xs"
              title="Print Lab Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'snapshots' && (
            <div className="space-y-5">
              {/* Filter and Search Controls */}
              {snapshots.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  {/* Lab Category Filter Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setSelectedLabFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedLabFilter === 'all'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      All Labs ({filterCounts.all})
                    </button>
                    <button
                      onClick={() => setSelectedLabFilter('chemistry')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedLabFilter === 'chemistry'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Chemistry ({filterCounts.chemistry})
                    </button>
                    <button
                      onClick={() => setSelectedLabFilter('astrophysics')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedLabFilter === 'astrophysics'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Astrophysics ({filterCounts.astrophysics})
                    </button>
                    <button
                      onClick={() => setSelectedLabFilter('biology')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedLabFilter === 'biology'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Cellular Bio ({filterCounts.biology})
                    </button>
                    <button
                      onClick={() => setSelectedLabFilter('optics')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedLabFilter === 'optics'
                          ? 'bg-violet-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Optics ({filterCounts.optics})
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={snapshotSearchQuery}
                      onChange={(e) => setSnapshotSearchQuery(e.target.value)}
                      placeholder="Search notes or metrics..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    {snapshotSearchQuery && (
                      <button
                        onClick={() => setSnapshotSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}

              {snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                  <FileText className="w-12 h-12 stroke-[1.5] mb-2 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">No 3D snapshots recorded yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Click the "Snapshot" camera button inside any virtual simulation lab (Chemistry, Astrophysics, Biology, Optics) or AR mode to log your visual data!
                  </p>
                </div>
              ) : filteredSnapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                  <Filter className="w-8 h-8 stroke-[1.5] mb-2 text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">No snapshots match the selected filter</p>
                  <p className="text-xs text-slate-500 mt-0.5">Try clearing your search query or selecting "All Labs".</p>
                  <button
                    onClick={() => {
                      setSelectedLabFilter('all');
                      setSnapshotSearchQuery('');
                    }}
                    className="mt-3 px-3 py-1 text-xs rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSnapshots.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col group hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-cyan-400 font-mono">
                          {s.labName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono">{s.timestamp}</span>
                          <button
                            onClick={() => onDeleteSnapshot(s.id)}
                            className="text-slate-600 hover:text-red-400 cursor-pointer"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {s.imageDataUrl && (
                        <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-800 mb-3 bg-black">
                          <img
                            src={s.imageDataUrl}
                            alt="Lab visual"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      {/* Measurements table */}
                      <div className="space-y-1 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                        {Object.entries(s.measurements || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-400">{k}:</span>
                            <span className="font-mono text-cyan-300 font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>

                      {s.note && (
                        <p className="mt-2 text-xs text-slate-300 italic border-l-2 border-cyan-500 pl-2">
                          "{s.note}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'observations' && (
            <div className="space-y-6">
              {/* Add Observation Form */}
              <form onSubmit={handleSaveNote} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Record New Scientific Hypothesis or Empirical Finding:
                </label>
                <textarea
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="e.g. When the laser incident angle reached 42°, total internal reflection occurred inside the crown glass prism..."
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none h-24 mb-3"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-600/25 transition-all cursor-pointer"
                >
                  Save to Research Journal
                </button>
              </form>

              {/* Observation List */}
              <div className="space-y-3">
                {observations.map((obs) => (
                  <div
                    key={obs.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-white">Lab Note</span>
                        <span className="text-[10px] text-slate-500 font-mono">{obs.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{obs.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'offline_drafts' && (
            <div className="space-y-6">
              {/* Drafts Info Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 mt-0.5">
                  <Save className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-200">IndexedDB Offline Draft Engine</span>
                    <span className="font-mono text-[11px] text-amber-300/80">
                      {draftNotes.length} Draft{draftNotes.length === 1 ? '' : 's'} Stored Locally
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    Observations and drafted research notes are stored directly in your browser's persistent IndexedDB database. When internet connection to the campus server is interrupted, you can continue typing notes, testing equations, and drafting lab reports without data loss.
                  </p>
                </div>
              </div>

              {/* Draft Composer */}
              <form onSubmit={handleSaveDraftNote} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">New Offline Research Draft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">Discipline:</span>
                    <select
                      value={newDraftLab}
                      onChange={(e) => setNewDraftLab(e.target.value as LabId)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="chemistry">Chemistry (VSEPR & Geometry)</option>
                      <option value="astrophysics">Astrophysics (Orbital Dynamics)</option>
                      <option value="biology">Cellular Biology (Organelles)</option>
                      <option value="optics">Optics (Prism & Refraction)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={newDraftTitle}
                    onChange={(e) => setNewDraftTitle(e.target.value)}
                    placeholder="Draft Title (e.g., Snell’s Law Critical Angle Derivation under Extreme Prism Densities)"
                    className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-semibold"
                  />
                </div>

                <div>
                  <textarea
                    value={newDraftContent}
                    onChange={(e) => setNewDraftContent(e.target.value)}
                    placeholder="Draft scientific notes, empirical tables, or experiment conclusions..."
                    className="w-full p-3.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none h-28 leading-relaxed font-mono"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Auto-saved to IndexedDB store: <code className="text-cyan-400">kev_xr_notebook_db/draft_notes</code>
                  </span>
                  <button
                    type="submit"
                    disabled={!newDraftTitle.trim() || !newDraftContent.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-600/25 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Offline Draft</span>
                  </button>
                </div>
              </form>

              {/* Drafts List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Stored Offline Drafts ({draftNotes.length})
                </h4>
                {draftNotes.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No offline drafts created yet. Write one above to store it in IndexedDB.
                  </div>
                ) : (
                  draftNotes.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{draft.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                            {draft.labId.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>{draft.updatedAt}</span>
                          <button
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="text-slate-600 hover:text-red-400 cursor-pointer ml-2"
                            title="Delete draft from IndexedDB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        {draft.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'certificate' && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-full max-w-2xl p-8 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-amber-500/40 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
                  <Award className="w-8 h-8" />
                </div>

                <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-1">
                  KEV XR Science Academy
                </div>
                <h2 className="text-2xl font-bold text-white font-serif tracking-wide mb-2">
                  Certificate of Virtual Lab Mastery
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                  This certifies that <strong>{studentStats.name}</strong> has demonstrated exceptional empirical scientific inquiry across hands-on 3D molecular, orbital, cellular, and optical simulations at KEV (
                  <a
                    href="https://kev.sansmercantile.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    https://kev.sansmercantile.com/
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  ).
                </p>

                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs mb-6">
                  <div>
                    <span className="text-slate-500 block text-[10px]">XP Accumulated</span>
                    <span className="font-bold text-cyan-400 font-mono text-sm">{studentStats.xp} XP</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Labs Completed</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">4 of 4 Labs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Assessment Grade</span>
                    <span className="font-bold text-amber-400 font-mono text-sm">Honors (98%)</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-800 pt-4 px-4">
                  <span>Instructor: Professor KEV (AI & Faculty)</span>
                  <span>Issued: {new Date().toLocaleDateString()}</span>
                  <span>Credential ID: KEV-XR-9942</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isExportingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isExportingPDF ? 'Compiling PDF...' : 'Download Official Record (PDF)'}</span>
                </button>
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
