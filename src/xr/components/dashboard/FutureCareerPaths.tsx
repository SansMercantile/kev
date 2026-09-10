import React, { useState } from 'react';
import { CareerPath, LabId, StudentStats } from '../../types';
import { CAREER_PATHS_DATA } from '../../data/careerPaths';
import { Briefcase, TrendingUp, Sparkles, ArrowRight, Award, Compass, DollarSign, GraduationCap, CheckCircle2, ChevronRight, FlaskConical, Orbit, Dna, Glasses } from 'lucide-react';
import { useToast } from '../toast/ToastContext';

interface Props {
  studentStats: StudentStats;
  onNavigateToLab: (labId: LabId) => void;
}

export const FutureCareerPaths: React.FC<Props> = ({ studentStats, onNavigateToLab }) => {
  const { showToast } = useToast();
  const [selectedCareer, setSelectedCareer] = useState<CareerPath>(CAREER_PATHS_DATA[0]);
  const [activeFilter, setActiveFilter] = useState<'all' | LabId>('all');

  // Compute dynamic match scores based on student's earned badges and completed labs
  const enrichedCareers = CAREER_PATHS_DATA.map((career) => {
    let bonus = 0;
    if (career.foundationalSubjects.includes('chemistry') && studentStats.badges.includes('Spatial Chemist')) {
      bonus += 3;
    }
    if (career.foundationalSubjects.includes('astrophysics') && studentStats.badges.includes('Kepler Navigator')) {
      bonus += 3;
    }
    if (career.foundationalSubjects.includes('biology') && studentStats.badges.includes('Cellular Explorer')) {
      bonus += 3;
    }
    if (career.foundationalSubjects.includes('optics') && studentStats.badges.includes('Optics Virtuoso')) {
      bonus += 3;
    }
    return {
      ...career,
      matchScore: Math.min(99, career.matchScore + bonus),
    };
  });

  const filteredCareers = enrichedCareers.filter((career) => {
    if (activeFilter === 'all') return true;
    return career.foundationalSubjects.includes(activeFilter);
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

  const handleLaunchLab = (labId: LabId, careerTitle: string) => {
    showToast({
      type: 'info',
      title: 'Career Pathway Lab Launched',
      message: `Loading priority simulations mapped to ${careerTitle}.`,
    });
    onNavigateToLab(labId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Future STEM Career Pathway Engine
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                AI Performance Match
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Based on your empirical lab data, high-accuracy quiz answers, and {studentStats.badges.length} earned certifications, our academic engine recommends the following real-world professions and high-priority virtual labs.
            </p>
          </div>
        </div>

        {/* Top Recommendation Highlight */}
        <div className="px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-right min-w-[180px]">
          <span className="text-[10px] uppercase font-mono text-slate-500 block">Top Affinity Match</span>
          <span className="text-sm font-bold text-indigo-300 block">{enrichedCareers[0].title}</span>
          <span className="text-xs font-mono font-bold text-emerald-400">{enrichedCareers[0].matchScore}% Compatibility</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 mr-2 font-mono">Filter by Field:</span>
          {(['all', 'chemistry', 'astrophysics', 'biology', 'optics'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {filter === 'all'
                ? 'All Careers'
                : filter === 'chemistry'
                ? 'Chemistry & Materials'
                : filter === 'astrophysics'
                ? 'Astrophysics & Aerospace'
                : filter === 'biology'
                ? 'Genomics & Biotech'
                : 'Photonics & Optics'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredCareers.length} Matching Professions
        </span>
      </div>

      {/* Main Grid: Left List, Right Detailed Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Careers List Column */}
        <div className="lg:col-span-5 space-y-3">
          {filteredCareers.map((career) => {
            const isSelected = selectedCareer.id === career.id;
            return (
              <div
                key={career.id}
                onClick={() => setSelectedCareer(career)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {career.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{career.industry}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {career.matchScore}% Match
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    {career.foundationalSubjects.map((s) => (
                      <span
                        key={s}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 text-[10px] font-mono text-slate-300 border border-slate-800"
                      >
                        {getLabIcon(s)}
                        <span>{s.toUpperCase()}</span>
                      </span>
                    ))}
                  </div>
                  <span className="font-mono text-[11px] text-amber-300 font-semibold">{career.salaryRange}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Career Spotlight Column */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1">
                  {selectedCareer.industry}
                </span>
                <h3 className="text-xl font-bold text-white">{selectedCareer.title}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {selectedCareer.description}
                </p>
              </div>
              <div className="text-right p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Compensation</span>
                <span className="text-sm font-bold text-amber-400 font-mono block">{selectedCareer.salaryRange}</span>
                <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                  {selectedCareer.careerOutlook}
                </span>
              </div>
            </div>

            {/* Metrics & Degree requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-indigo-400 mt-0.5" />
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Degree Prerequisite</span>
                  <span className="text-slate-200 font-semibold">{selectedCareer.educationDegree}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-cyan-400 mt-0.5" />
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Foundational Subjects</span>
                  <span className="text-slate-200 font-semibold capitalize">
                    {selectedCareer.foundationalSubjects.join(' & ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Competencies & Skills */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Core Industry Competencies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCareer.keySkills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 text-xs font-mono text-cyan-300 border border-slate-800"
                  >
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Virtual Labs to Prioritize */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recommended Priority Virtual Labs
                </h4>
                <span className="text-[10px] text-cyan-400 font-mono">Direct Launch Available</span>
              </div>

              <div className="space-y-2.5">
                {selectedCareer.recommendedNextLabs.map((labTask) => (
                  <div
                    key={labTask.title}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        {getLabIcon(labTask.labId)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{labTask.title}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                            {labTask.labId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{labTask.focus}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLaunchLab(labTask.labId, selectedCareer.title)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>Enter Lab</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Corporate & Research Partners */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block mb-2">
                Industry & Academy Hiring Partners
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedCareer.industryPartners.map((partner) => (
                  <span
                    key={partner}
                    className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono"
                  >
                    {partner}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
