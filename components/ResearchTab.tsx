import React, { useState } from 'react';
import { AuthorPersona, EbookProject, Chapter } from '../types';
import { generateMasterPlan } from '../services/gemini';
import { 
  Loader2, 
  Wand2, 
  Search, 
  ListChecks, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown, 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X 
} from 'lucide-react';

interface ResearchTabProps {
  project: EbookProject;
  setProject: (p: EbookProject) => void;
  persona: AuthorPersona;
}

const ResearchTab: React.FC<ResearchTabProps> = ({ project, setProject, persona }) => {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(project.theme || '');
  const [error, setError] = useState<string | null>(null);

  // Chapter inline editing state
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOverview, setEditOverview] = useState('');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleGeneratePlan = async () => {
    if (!theme || !theme.trim()) return alert('Please enter a theme or outline pointers');
    setLoading(true);
    setError(null);
    try {
      const plan = await generateMasterPlan(theme, persona);
      
      const rawChapters = Array.isArray(plan?.chapters)
        ? plan.chapters
        : (typeof plan?.chapters === 'object' && plan?.chapters !== null)
          ? Object.values(plan.chapters)
          : [];

      const newChapters: Chapter[] = rawChapters.map((c: any, idx: number) => {
        let title = `Chapter ${idx + 1}`;
        let overview = '';

        if (typeof c === 'string') {
          title = c;
        } else if (typeof c === 'object' && c !== null) {
          title = c.title || c.name || `Chapter ${idx + 1}`;
          overview = c.overview || c.description || c.summary || '';
        }

        return {
          id: `ch_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 8)}`,
          number: idx + 1,
          title: String(title || `Chapter ${idx + 1}`),
          overview: String(overview || ''),
          content: '',
          summary: '',
          status: 'drafting' as const,
          pointers: ''
        };
      });

      // Fallback if no chapters returned
      if (newChapters.length === 0) {
        for (let i = 1; i <= 5; i++) {
          newChapters.push({
            id: `ch_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 8)}`,
            number: i,
            title: `Chapter ${i}`,
            overview: '',
            content: '',
            summary: '',
            status: 'drafting' as const,
            pointers: ''
          });
        }
      }

      setProject({
        ...project,
        theme,
        title: typeof plan?.title === 'string' && plan.title.trim() ? plan.title.trim() : (project.title || 'Untitled Book'),
        subtitle: typeof plan?.subtitle === 'string' ? plan.subtitle.trim() : (project.subtitle || ''),
        targetAudience: typeof plan?.targetAudience === 'string' ? plan.targetAudience.trim() : (project.targetAudience || 'General Audience'),
        chapters: newChapters
      });
    } catch (err: any) {
      console.error("Error generating master plan:", err);
      const errMsg = typeof err?.message === 'string' ? err.message : String(err || 'Failed to generate master plan.');
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const reorderChapters = (chapters: Chapter[]): Chapter[] => {
    return chapters.map((c, idx) => ({
      ...c,
      number: idx + 1
    }));
  };

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.chapters.length) return;

    const newChapters = [...project.chapters];
    const [moved] = newChapters.splice(index, 1);
    newChapters.splice(targetIndex, 0, moved);

    setProject({
      ...project,
      chapters: reorderChapters(newChapters)
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newChapters = [...project.chapters];
    const [moved] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(targetIndex, 0, moved);

    setProject({
      ...project,
      chapters: reorderChapters(newChapters)
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const startEditing = (chapter: Chapter) => {
    setEditingChapterId(chapter.id);
    setEditTitle(chapter.title || '');
    setEditOverview(chapter.overview || '');
  };

  const cancelEditing = () => {
    setEditingChapterId(null);
    setEditTitle('');
    setEditOverview('');
  };

  const saveEditing = (chapterId: string) => {
    const updatedChapters = project.chapters.map(c => 
      c.id === chapterId 
        ? { ...c, title: editTitle.trim() || c.title, overview: editOverview.trim() } 
        : c
    );
    setProject({ ...project, chapters: updatedChapters });
    cancelEditing();
  };

  const handleAddChapter = () => {
    const newNum = project.chapters.length + 1;
    const newChapter: Chapter = {
      id: Math.random().toString(36).substr(2, 9),
      number: newNum,
      title: `Chapter ${newNum}: New Chapter`,
      overview: 'Overview and objectives for this chapter...',
      content: '',
      summary: '',
      status: 'drafting',
      pointers: ''
    };
    setProject({
      ...project,
      chapters: [...project.chapters, newChapter]
    });
    startEditing(newChapter);
  };

  const handleDeleteChapter = (chapterId: string) => {
    const remaining = project.chapters.filter(c => c.id !== chapterId);
    setProject({
      ...project,
      chapters: reorderChapters(remaining)
    });
    if (editingChapterId === chapterId) {
      cancelEditing();
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg text-slate-50">Master Outline</h3>
            </div>
            <div className="flex items-center gap-3">
              {project.chapters.length > 0 && (
                <button
                  onClick={handleAddChapter}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Chapter</span>
                </button>
              )}
              <span className="text-xs text-slate-500 font-medium">{project.chapters.length} Chapters Planned</span>
            </div>
          </div>

          {project.chapters.length > 0 && (
            <p className="text-xs text-slate-400 mb-6 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              💡 <span className="text-slate-300 font-medium">Reorder chapters:</span> Drag with the grip handle or use the <ChevronUp className="w-3 h-3 inline text-indigo-400 -mt-0.5" /> <ChevronDown className="w-3 h-3 inline text-indigo-400 -mt-0.5" /> arrows. Chapter numbers update automatically.
            </p>
          )}

          {!project.chapters.length ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                <Search className="text-slate-600 w-8 h-8" />
              </div>
              <p className="text-slate-500 text-sm">No plan generated yet. Start by defining a theme or pointers above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(project.chapters || []).map((chapter, idx) => {
                if (!chapter) return null;
                const isEditing = editingChapterId === chapter.id;
                const isDragged = draggedIndex === idx;
                const isDragTarget = dragOverIndex === idx && draggedIndex !== idx;

                return (
                  <div
                    key={chapter.id || `ch_${idx}`}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`group relative p-4 rounded-xl border transition-all ${
                      isDragged 
                        ? 'opacity-40 border-dashed border-indigo-500 bg-slate-800/30' 
                        : isDragTarget 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-500/10' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/90 hover:bg-slate-800/40'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            Editing Chapter {chapter.number || idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveEditing(chapter.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Chapter title"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <textarea
                          value={editOverview}
                          onChange={(e) => setEditOverview(e.target.value)}
                          placeholder="Chapter overview"
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                        />
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        {/* Drag handle & Up/Down arrows */}
                        <div className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 pt-0.5">
                          <div 
                            draggable={!isEditing}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragEnd={handleDragEnd}
                            className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-300 p-0.5 rounded transition-colors" 
                            title="Drag to reorder chapter"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveChapter(idx, 'up'); }}
                              disabled={idx === 0}
                              className="p-0.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded disabled:opacity-20 disabled:hover:text-slate-500 disabled:hover:bg-transparent transition-colors"
                              title="Move chapter up"
                              aria-label="Move chapter up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveChapter(idx, 'down'); }}
                              disabled={idx === (project.chapters?.length || 1) - 1}
                              className="p-0.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded disabled:opacity-20 disabled:hover:text-slate-500 disabled:hover:bg-transparent transition-colors"
                              title="Move chapter down"
                              aria-label="Move chapter down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Chapter Number Badge */}
                        <div className="w-8 h-8 flex-shrink-0 bg-slate-800 text-slate-300 rounded-lg flex items-center justify-center font-bold text-sm border border-slate-700 group-hover:text-indigo-400 group-hover:border-indigo-500/50 shadow-sm mt-0.5">
                          {chapter.number || idx + 1}
                        </div>

                        {/* Chapter Content Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-slate-100 text-sm truncate">{chapter.title || `Chapter ${idx + 1}`}</h4>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => startEditing(chapter)}
                                className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Edit chapter outline"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteChapter(chapter.id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete chapter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {chapter.overview && (
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{chapter.overview}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchTab;
