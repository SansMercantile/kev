import React, { useState, useEffect } from 'react';
import { CampusAnnouncement } from '../../types';
import { Bell, ChevronRight, ChevronLeft, Radio, AlertTriangle, Trophy, Calendar, Sparkles } from 'lucide-react';

const INITIAL_ANNOUNCEMENTS: CampusAnnouncement[] = [
  {
    id: 'ann-holiday',
    category: 'event',
    title: 'Seasonal Facility Festival Active: Central Atrium & school wings decorated for Halloween, Christmas, Easter & Thanksgiving.',
    timestamp: 'Live Now',
    urgency: 'high',
    linkAction: 'campus',
  },
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
  onOpenSports?: () => void;
}

export const CampusAnnouncementsTicker: React.FC<Props> = ({ onOpenTournaments, onOpenSports }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);

  // Connect to Campus WebSocket for Real-Time Announcements
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connectWs() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws/campus-chat`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsWsConnected(true);
          // Request latest announcements
          ws?.send(JSON.stringify({ type: 'join', roomId: 'announcements' }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'announcements' && Array.isArray(data.announcements) && data.announcements.length > 0) {
              setAnnouncements(data.announcements);
            } else if (data.type === 'new_announcement' && data.announcement) {
              setAnnouncements((prev) => [data.announcement, ...prev]);
            }
          } catch (e) {
            // ignore
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 10000);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
        };
      } catch (err) {
        setIsWsConnected(false);
      }
    }

    connectWs();

    // Fallback REST fetch in case WebSocket handshake takes a moment
    fetch('/api/campus/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (data.announcements && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        }
      })
      .catch(() => { /* use initial */ });

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const current = announcements[currentIndex] || announcements[0];

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

        <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono">
          <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className={isWsConnected ? 'text-emerald-400' : 'text-amber-400'}>
            {isWsConnected ? 'WEBSOCKET SYNC' : 'POLLING'}
          </span>
        </div>
      </div>

      {/* Rotating Item */}
      <div className="flex-1 mx-3 truncate flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
        onClick={() => {
          if (current.linkAction === 'tournament' && onOpenTournaments) {
            onOpenTournaments();
          } else if (current.linkAction === 'sports' && onOpenSports) {
            onOpenSports();
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
