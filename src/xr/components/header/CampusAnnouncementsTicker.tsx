import React, { useState, useEffect } from 'react';
import { CampusAnnouncement } from '../../types';
import { Bell, ChevronRight, ChevronLeft, Radio, AlertTriangle, Trophy, Calendar, Sparkles } from 'lucide-react';

const INITIAL_ANNOUNCEMENTS: CampusAnnouncement[] = [
  {
    id: 'ann-1',
    category: 'tournament',
    title: 'Season 4 Inter-Collegiate VSEPR Assembly Sprint is LIVE! 350 XP Bounty.',
    timestamp: 'Just now',
    urgency: 'high',
    linkAction: 'tournament',
  },
  {
    id: 'ann-2',
    category: 'maintenance',
    title: 'Astrophysics N-Body Supercomputer upgrade scheduled tonight at 02:00 UTC.',
    timestamp: '20m ago',
    urgency: 'medium',
  },
  {
    id: 'ann-3',
    category: 'event',
    title: 'Dr. Sarah Thorne hosting Live VR Quantum Photonics Workshop in Lecture Hall B.',
    timestamp: '1h ago',
    urgency: 'low',
    linkAction: 'lecture',
  },
  {
    id: 'ann-4',
    category: 'academic',
    title: 'Offline Lab Notebook enabled: observations auto-cached via IndexedDB storage.',
    timestamp: '2h ago',
    urgency: 'low',
  },
];

interface Props {
  onOpenTournaments?: () => void;
}

export const CampusAnnouncementsTicker: React.FC<Props> = ({ onOpenTournaments }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [announcements] = useState<CampusAnnouncement[]>(INITIAL_ANNOUNCEMENTS);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const current = announcements[currentIndex];

  const getCategoryIcon = (category: CampusAnnouncement['category']) => {
    switch (category) {
      case 'tournament':
        return <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'maintenance':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'event':
        return <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="w-full bg-slate-950/90 border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-slate-300 overflow-hidden">
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px]">
          <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
          <span className="font-bold">CAMPUS FEED</span>
        </div>
      </div>

      {/* Rotating Item */}
      <div className="flex-1 mx-3 truncate flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
        onClick={() => {
          if (current.linkAction === 'tournament' && onOpenTournaments) {
            onOpenTournaments();
          }
        }}
      >
        {getCategoryIcon(current.category)}
        <span className="text-slate-200 font-medium truncate">{current.title}</span>
        <span className="text-[10px] text-slate-500 shrink-0">({current.timestamp})</span>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Previous Announcement"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] text-slate-500 font-mono px-1">
          {currentIndex + 1}/{announcements.length}
        </span>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Next Announcement"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
