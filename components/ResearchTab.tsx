
import React, { useState } from 'react';
import { AuthorPersona, EbookProject, Chapter } from '../types';
import { generateMasterPlan } from '../services/gemini';
import { Loader2, Wand2, Search, ListChecks } from 'lucide-react';

interface ResearchTabProps {
  project: EbookProject;
  setProject: (p: EbookProject) => void;
  persona: AuthorPersona;
}

const ResearchTab: React.FC<ResearchTabProps> = ({ project, setProject, persona }) => {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(project.theme);

  const handleGeneratePlan = async () => {
    if (!theme) return alert('Please enter a theme');
    setLoading(true);
    try {
      const plan = await generateMasterPlan(theme, persona);
      const newChapters: Chapter[] = (plan.chapters || []).map((c: any, idx: number) => ({
        id: Math.random().toString(36).substr(2, 9),
        number: idx + 1,
        title: c.title,
        overview: c.overview,
        content: '',
        summary: '',
        status: 'drafting',
        pointers: ''
      }));

      setProject({
        ...project,
        theme,
        title: plan.title || '',
        subtitle: plan.subtitle || '',
        targetAudience: plan.targetAudience || '',
        chapters: newChapters
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="md:col-span-1 space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-lg text-slate-50">The Architect</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Enter your book's core theme. The Research Agent will analyze market trends and generate a structured outline.
          </p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Core Theme</label>
            <textarea
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. The psychology of digital burnout in remote workers"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[100px] transition-all"
            />
          </div>
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            Generate Master Plan
          </button>
        </div>

        {project.title && (
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Metadata</h4>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-200">{project.title}</p>
              <p className="text-xs text-slate-500">{project.subtitle}</p>
              <div className="pt-2">
                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-indigo-400 font-bold border border-slate-700">
                  TARGET: {project.targetAudience.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="md:col-span-2 space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-50 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-indigo-400" /> Master Outline
            </h3>
            <span className="text-xs text-slate-500">{project.chapters.length} Chapters Planned</span>
          </div>

          {!project.chapters.length ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                <Search className="text-slate-600 w-8 h-8" />
              </div>
              <p className="text-slate-500 text-sm">No plan generated yet. Start by defining a theme.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {project.chapters.map((chapter) => (
                <div key={chapter.id} className="group p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 flex-shrink-0 bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center font-bold text-sm border border-slate-700 group-hover:text-indigo-400 group-hover:border-indigo-500/50">
                      {chapter.number}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-100">{chapter.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{chapter.overview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchTab;
