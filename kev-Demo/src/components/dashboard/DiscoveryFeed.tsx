import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  FlaskConical,
  Orbit,
  Dna,
  Send,
  PlusCircle,
  Filter,
  Search,
  CheckCircle2,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  Camera,
  X,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { LabId, DiscoveryPost, LabSnapshot, StudentStats } from '../../types';
import { SEED_DISCOVERY_POSTS } from '../../data/advancedLabSystemsData';
import { useToast } from '../toast/ToastContext';

interface Props {
  studentStats: StudentStats;
  snapshots: LabSnapshot[];
  onNavigateToLab: (labId: LabId) => void;
  onAwardXP: (xp: number, reason: string) => void;
}

export const DiscoveryFeed: React.FC<Props> = ({
  studentStats,
  snapshots,
  onNavigateToLab,
  onAwardXP,
}) => {
  const { showToast, showXPToast } = useToast();

  const [posts, setPosts] = useState<DiscoveryPost[]>(() => {
    const saved = localStorage.getItem('kev_discovery_posts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* fallback */
      }
    }
    return SEED_DISCOVERY_POSTS;
  });

  const [selectedLabFilter, setSelectedLabFilter] = useState<'all' | LabId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Share form state
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(
    snapshots.length > 0 ? snapshots[0].id : ''
  );
  const [shareTitle, setShareTitle] = useState<string>('');
  const [shareSummary, setShareSummary] = useState<string>('');
  const [shareTags, setShareTags] = useState<string>('VSEPR Theory, Molecular Geometry');
  const [hypothesisConfirmed, setHypothesisConfirmed] = useState<boolean>(true);

  // Sync to local storage
  const savePosts = (newPosts: DiscoveryPost[]) => {
    setPosts(newPosts);
    localStorage.setItem('kev_discovery_posts', JSON.stringify(newPosts));
  };

  const handleToggleLike = (postId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const isLiked = !p.userLiked;
        return {
          ...p,
          userLiked: isLiked,
          kudosCount: isLiked ? p.kudosCount + 1 : Math.max(0, p.kudosCount - 1),
        };
      }
      return p;
    });
    savePosts(updated);
  };

  const handleToggleReaction = (postId: string, reactionId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          reactions: p.reactions.map((r) => {
            if (r.id === reactionId) {
              const userReacted = !r.userReacted;
              return {
                ...r,
                userReacted,
                count: userReacted ? r.count + 1 : Math.max(0, r.count - 1),
              };
            }
            return r;
          }),
        };
      }
      return p;
    });
    savePosts(updated);
  };

  const handleAddComment = (postId: string) => {
    const text = newCommentText[postId]?.trim();
    if (!text) return;

    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `comm-${Date.now()}`,
              authorName: studentStats.name,
              authorAvatar: studentStats.avatar,
              gradeOrCohort: studentStats.grade || 'Grade 9 • Advanced STEM',
              timestamp: 'Just now',
              text,
            },
          ],
        };
      }
      return p;
    });

    savePosts(updated);
    setNewCommentText((prev) => ({ ...prev, [postId]: '' }));
    onAwardXP(10, 'Participated in Peer Scientific Discussion');
    showXPToast(10, 'Peer Review Comment Submitted');
  };

  const handlePublishPost = () => {
    if (!shareTitle.trim() || !shareSummary.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please provide both a discovery title and a scientific summary.',
      });
      return;
    }

    const matchedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId);
    const labId: LabId = matchedSnapshot?.labId || 'chemistry';
    const imageDataUrl = matchedSnapshot?.imageDataUrl || '';
    const measurements = matchedSnapshot?.measurements || {
      'Simulation Mode': 'Standard XR Analysis',
      Status: 'Calibrated',
    };

    const newPost: DiscoveryPost = {
      id: `post-${Date.now()}`,
      studentName: studentStats.name,
      studentAvatar: studentStats.avatar,
      gradeLevel: studentStats.grade || 'Grade 9 • Advanced STEM',
      timestamp: 'Just now',
      labId,
      labTitle: matchedSnapshot?.labName || `${labId.toUpperCase()} Lab Analysis`,
      title: shareTitle.trim(),
      summary: shareSummary.trim(),
      imageDataUrl,
      measurements,
      hypothesisConfirmed,
      tags: shareTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      kudosCount: 1,
      userLiked: true,
      reactions: [
        { id: `r-${Date.now()}-1`, type: 'brilliant', label: 'Brilliant Derivation', icon: '💡', count: 1, userReacted: true },
        { id: `r-${Date.now()}-2`, type: 'verified', label: 'Peer Verified', icon: '🔬', count: 0, userReacted: false },
        { id: `r-${Date.now()}-3`, type: 'novel', label: 'Novel Methodology', icon: '🚀', count: 0, userReacted: false },
      ],
      comments: [],
      replicationPrompt: `Launch ${labId.toUpperCase()} Lab to replicate ${studentStats.name}’s findings.`,
    };

    const updated = [newPost, ...posts];
    savePosts(updated);

    // Reset & close
    setIsShareModalOpen(false);
    setShareTitle('');
    setShareSummary('');

    // Reward XP
    onAwardXP(35, 'Published Research Discovery to KEV Academy Feed');
    showXPToast(35, 'Discovery Shared with Community');
    showToast({
      type: 'success',
      title: 'Discovery Published!',
      message: 'Your lab snapshot and findings are now visible to all KEV Academy peers.',
    });
  };

  const filteredPosts = posts.filter((post) => {
    const matchesLab = selectedLabFilter === 'all' || post.labId === selectedLabFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.summary.toLowerCase().includes(query) ||
      post.studentName.toLowerCase().includes(query) ||
      post.tags.some((t) => t.toLowerCase().includes(query));
    return matchesLab && matchesQuery;
  });

  const getLabIcon = (labId: LabId) => {
    switch (labId) {
      case 'chemistry':
        return <FlaskConical className="w-4 h-4 text-amber-400" />;
      case 'astrophysics':
        return <Orbit className="w-4 h-4 text-purple-400" />;
      case 'optics':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'biology':
        return <Dna className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div id="discovery-feed" className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Peer Science Network
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {posts.length} Scientific Discoveries Shared
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            KEV Academy Discovery Feed
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
            Explore empirical breakthroughs, 3D lab snapshots, and experimental calibrations shared by fellow student researchers across all four academy wings.
          </p>
        </div>

        {/* Share Button */}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Share Your Discovery</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1" />
          {(['all', 'chemistry', 'astrophysics', 'optics', 'biology'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedLabFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedLabFilter === tab
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab === 'all'
                ? 'All Domains'
                : tab === 'chemistry'
                ? '🧪 Chemistry'
                : tab === 'astrophysics'
                ? '🪐 Astrophysics'
                : tab === 'optics'
                ? '🔬 Optics'
                : '🧬 Biology'}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search discoveries & tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Post List */}
      <div className="space-y-5">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No Discoveries Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No shared discoveries match your current filter. Be the first to share an experiment from your lab notebook!
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isCommentsOpen = expandedCommentsPostId === post.id;

            return (
              <div
                key={post.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all shadow-md"
              >
                {/* Post Author Bar */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-cyan-600/20">
                      {post.studentAvatar?.photoUrl ? (
                        <img
                          src={post.studentAvatar.photoUrl}
                          alt={post.studentName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        post.studentName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{post.studentName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono border border-slate-800">
                          {post.gradeLevel}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {post.timestamp} • in {post.labTitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                      {getLabIcon(post.labId)}
                      <span className="capitalize">{post.labId}</span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">{post.title}</h3>
                    {post.hypothesisConfirmed && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Hypothesis Confirmed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{post.summary}</p>

                  {/* 3D Snapshot Image or Visual Card */}
                  {post.imageDataUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-64 flex items-center justify-center">
                      <img
                        src={post.imageDataUrl}
                        alt={post.title}
                        className="w-full h-auto object-contain max-h-64"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-slate-800">
                        Captured in 3D Lab
                      </span>
                    </div>
                  ) : null}

                  {/* Scientific Measurements Grid */}
                  {post.measurements && Object.keys(post.measurements).length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block mb-2 font-semibold flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-cyan-400" />
                        Empirical Lab Telemetry & Parameters
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {Object.entries(post.measurements).map(([key, val]) => (
                          <div key={key} className="p-2 rounded-lg bg-slate-900 border border-slate-800/60">
                            <span className="text-[10px] text-slate-400 block truncate">{key}</span>
                            <span className="font-mono font-bold text-cyan-300 block truncate mt-0.5">
                              {String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {post.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-500" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Social Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  {/* Reaction Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Kudos / Like Button */}
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        post.userLiked
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          post.userLiked ? 'text-rose-400 fill-rose-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{post.kudosCount} Kudos</span>
                    </button>

                    {/* Scientific Reaction Chips */}
                    {post.reactions.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleToggleReaction(post.id, r.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1 border ${
                          r.userReacted
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 border-slate-800'
                        }`}
                        title={r.label}
                      >
                        <span>{r.icon}</span>
                        <span>{r.count}</span>
                      </button>
                    ))}

                    {/* Comments Toggle */}
                    <button
                      onClick={() =>
                        setExpandedCommentsPostId(isCommentsOpen ? null : post.id)
                      }
                      className="px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>{post.comments.length}</span>
                      {isCommentsOpen ? (
                        <ChevronUp className="w-3 h-3 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                      )}
                    </button>
                  </div>

                  {/* Replicate In Lab Button */}
                  <button
                    onClick={() => {
                      onNavigateToLab(post.labId);
                      showToast({
                        type: 'info',
                        title: `Replicating ${post.studentName}’s Experiment`,
                        message: `Loaded ${post.labTitle}. Calibrate parameters to match telemetry!`,
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                    <span>Replicate in Lab</span>
                  </button>
                </div>

                {/* Expanded Comment Thread */}
                {isCommentsOpen && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-3 animate-fade-in">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                      Peer Review Discussion ({post.comments.length})
                    </span>

                    {post.comments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        No peer comments yet. Ask a question or verify their derivation!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {post.comments.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-200">{c.authorName}</span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {c.timestamp}
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Comment Input */}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Write a peer review comment or scientific question..."
                        value={newCommentText[post.id] || ''}
                        onChange={(e) =>
                          setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition-colors shadow-sm"
                        title="Submit peer comment"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Share Discovery Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 md:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Share Lab Discovery</h3>
                  <p className="text-xs text-slate-400">
                    Publish your empirical findings to the KEV Academy Peer Feed (+35 XP)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Snapshot selector */}
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Select Completed Lab Snapshot:
                </label>
                {snapshots.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    No snapshots captured yet. You can still publish findings, or capture a 3D snapshot inside any lab.
                  </div>
                ) : (
                  <select
                    value={selectedSnapshotId}
                    onChange={(e) => {
                      setSelectedSnapshotId(e.target.value);
                      const s = snapshots.find((snap) => snap.id === e.target.value);
                      if (s && !shareTitle) {
                        setShareTitle(s.note || `Empirical Calibration: ${s.labName}`);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    {snapshots.map((snap) => (
                      <option key={snap.id} value={snap.id}>
                        [{snap.labId.toUpperCase()}] {snap.labName} — {snap.timestamp}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Discovery Title:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Measured Total Internal Reflection at Critical Angle 41.2°"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Scientific Summary */}
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Scientific Summary & Observations:
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain your methodology, initial hypothesis, and what the 3D experiment demonstrated..."
                  value={shareSummary}
                  onChange={(e) => setShareSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                />
              </div>

              {/* Hypothesis Confirmed toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">Hypothesis Outcome</span>
                  <span className="text-[11px] text-slate-400">
                    Did empirical lab measurements validate your scientific prediction?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHypothesisConfirmed(!hypothesisConfirmed)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    hypothesisConfirmed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {hypothesisConfirmed ? '✓ Confirmed' : '⚠ Inconclusive / Anomalous'}
                </button>
              </div>

              {/* Scientific Tags */}
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Scientific Tags (comma separated):
                </label>
                <input
                  type="text"
                  placeholder="e.g. VSEPR Theory, Snell Law, Chemiosmosis, Kepler Orbits"
                  value={shareTags}
                  onChange={(e) => setShareTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishPost}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-600/25 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Publish (+35 XP)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
