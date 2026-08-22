
import React, { useState } from 'react';
import { AuthorPersona, EbookProject, Chapter } from '../types';
import { generateMasterPlan } from '../services/gemini';
import { Loader2, Wand2, Search, ListChecks, AlertCircle } from 'lucide-react';

interface ResearchTabProps {
  project: EbookProject;
  setProject: (p: EbookProject) => void;
  persona: AuthorPersona;
}

const ResearchTab: React.FC<ResearchTabProps> = ({ project, setProject, persona }) => {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(project.theme || '');
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!theme || !theme.trim()) return alert('Please enter a theme or outline pointers');
    setLoading(true);
    setError(null);
    try {
      const plan = await generateMasterPlan(theme, persona);
      const newChapters: Chapter[] = (plan.chapters || []).map((c: any, idx: number) => ({
        id: Math.random().toString(36).substr(2, 9),
        number: idx + 1,
        title: c.title || `Chapter ${idx + 1}`,
        overview: c.overview || '',
        content: '',
        summary: '',
        status: 'drafting',
        pointers: ''
      }));

      setProject({
        ...project,
        theme,
        title: plan.title || 'Untitled Book',
        subtitle: plan.subtitle || '',
        targetAudience: plan.targetAudience || 'General Audience',
        chapters: newChapters
      });
    } catch (err: any) {
      console.error("Error generating master plan:", err);
      setError(err?.message || 'Failed to generate master plan. Please verify your API key and network connection.');
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
            Enter your book's core theme or key pointers. The Research Agent will analyze market trends and generate a structured master outline.
          </p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Core Theme & Pointers</label>
            <textarea
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. The psychology of digital burnout in remote workers, including strategies for nervous system recovery"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[120px] transition-all resize-y"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {loading ? 'Generating Master Plan...' : 'Generate Master Plan'}
          </button>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Book Metadata</h4>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Editable</span>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Book Title</label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setProject({ ...project, title: e.target.value })}
                placeholder="e.g. Unplugging the Mind"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Subtitle</label>
              <input
                type="text"
                value={project.subtitle}
                onChange={(e) => setProject({ ...project, subtitle: e.target.value })}
                placeholder="e.g. Strategies for Digital Burnout Recovery"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Target Audience</label>
              <input
                type="text"
                value={project.targetAudience}
                onChange={(e) => setProject({ ...project, targetAudience: e.target.value })}
                placeholder="e.g. Remote workers, HR leads"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
              />
            </div>
          </div>
        </div>
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
              <p className="text-slate-500 text-sm">No plan generated yet. Start by defining a theme or pointers above.</p>
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
