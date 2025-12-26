
import React, { useState, useRef, useEffect } from 'react';
import { EbookProject, Chapter, AuthorPersona } from '../types';
import { draftChapter, tweakBlock, generateCover, checkPlagiarism, humanizeChapter } from '../services/gemini';
import { 
  Loader2, 
  PenTool, 
  Edit3, 
  Image as ImageIcon, 
  Send, 
  ChevronRight, 
  MessageSquare, 
  Sparkles, 
  Wand2, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChaptersTabProps {
  project: EbookProject;
  setProject: (p: EbookProject) => void;
  persona: AuthorPersona;
}

const ChaptersTab: React.FC<ChaptersTabProps> = ({ project, setProject, persona }) => {
  const [activeChapterId, setActiveChapterId] = useState(project.chapters[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [tweakLoading, setTweakLoading] = useState(false);
  const [tweakPrompt, setTweakPrompt] = useState('');
  const [selection, setSelection] = useState<{ text: string; start: number; end: number } | null>(null);
  const [generatingCover, setGeneratingCover] = useState(false);

  const activeChapter = project.chapters.find(c => c.id === activeChapterId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDraft = async () => {
    if (!activeChapter) return;
    setLoading(true);
    try {
      const previousChapters = project.chapters.filter(c => c.number < activeChapter.number);
      const runningSummary = previousChapters.map(c => `Chapter ${c.number}: ${c.summary}`).join('\n');
      
      const { content, summary } = await draftChapter(activeChapter, persona, project, runningSummary);
      
      const updatedChapters = project.chapters.map(c => 
        c.id === activeChapterId ? { ...c, content, summary, status: 'review' as const } : c
      );
      setProject({ ...project, chapters: updatedChapters });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPlagiarism = async () => {
    if (!activeChapter?.content) return;
    setCheckingPlagiarism(true);
    try {
      const { score, report } = await checkPlagiarism(activeChapter.content);
      const status = score > 40 ? 'flagged' : 'review';
      
      const updatedChapters = project.chapters.map(c => 
        c.id === activeChapterId ? { ...c, plagiarismScore: score, plagiarismReport: report, status } : c
      );
      setProject({ ...project, chapters: updatedChapters });
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingPlagiarism(false);
    }
  };

  const handleHumanize = async () => {
    if (!activeChapter?.content) return;
    setHumanizing(true);
    try {
      const humanized = await humanizeChapter(activeChapter.content);
      const updatedChapters = project.chapters.map(c => 
        c.id === activeChapterId ? { ...c, content: humanized, plagiarismScore: undefined, plagiarismReport: undefined, status: 'review' } : c
      );
      setProject({ ...project, chapters: updatedChapters });
    } catch (error) {
      console.error(error);
    } finally {
      setHumanizing(false);
    }
  };

  const handleSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = textareaRef.current.value.substring(start, end);
      if (text) {
        setSelection({ text, start, end });
      } else {
        setSelection(null);
      }
    }
  };

  const handleTweak = async () => {
    if (!selection || !tweakPrompt || !activeChapter) return;
    setTweakLoading(true);
    try {
      const tweakedText = await tweakBlock(selection.text, tweakPrompt);
      const newContent = 
        activeChapter.content.substring(0, selection.start) + 
        tweakedText + 
        activeChapter.content.substring(selection.end);
      
      const updatedChapters = project.chapters.map(c => 
        c.id === activeChapterId ? { ...c, content: newContent } : c
      );
      setProject({ ...project, chapters: updatedChapters });
      setSelection(null);
      setTweakPrompt('');
    } catch (error) {
      console.error(error);
    } finally {
      setTweakLoading(false);
    }
  };

  const handleGenerateCover = async () => {
    setGeneratingCover(true);
    try {
      const url = await generateCover(`${project.title}: ${project.theme}`);
      setProject({ ...project, coverUrl: url });
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingCover(false);
    }
  };

  if (!project.chapters.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <PenTool className="w-12 h-12 mb-4 opacity-10" />
        <p>Generate a Master Plan in the Research tab first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)] animate-in fade-in zoom-in-95 duration-500">
      {/* Sidebar List */}
      <div className="col-span-3 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h3 className="font-bold text-slate-100">Chapters</h3>
          <button 
            onClick={handleGenerateCover}
            disabled={generatingCover}
            className="p-2 hover:bg-slate-800 rounded-lg text-indigo-400 transition-colors border border-transparent hover:border-slate-700"
            title="Generate AI Cover Art"
          >
            {generatingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {project.chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => setActiveChapterId(chapter.id)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                activeChapterId === chapter.id 
                  ? 'bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/30' 
                  : 'text-slate-400 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-600">CH {chapter.number}</span>
                  <span className="truncate text-sm">{chapter.title}</span>
                </div>
                {chapter.status === 'flagged' && <ShieldAlert className="w-3 h-3 text-red-500 flex-shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Main Area */}
      <div className="col-span-9 flex flex-col gap-6">
        {activeChapter && (
          <>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-50">{activeChapter.title}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-400 italic">Drafting with Persona: {persona.name}</p>
                  {activeChapter.plagiarismScore !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${activeChapter.plagiarismScore > 40 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {activeChapter.plagiarismScore > 40 ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      AI Likeness: {activeChapter.plagiarismScore}%
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeChapter.content && (
                  <>
                    <button
                      onClick={handleCheckPlagiarism}
                      disabled={checkingPlagiarism}
                      className="flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
                    >
                      {checkingPlagiarism ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Check Integrity
                    </button>
                    {activeChapter.status === 'flagged' && (
                      <button
                        onClick={handleHumanize}
                        disabled={humanizing}
                        className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors disabled:opacity-50"
                      >
                        {humanizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        Humanize Pass
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={handleDraft}
                  disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {activeChapter.content ? 'Regenerate Draft' : 'Start AI Drafting'}
                </button>
              </div>
            </div>

            {activeChapter.plagiarismReport && activeChapter.status === 'flagged' && (
              <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-200">Integrity Warning</h4>
                  <p className="text-xs text-red-300/80 leading-relaxed">{activeChapter.plagiarismReport}</p>
                </div>
              </div>
            )}

            <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
              {/* Raw Edit / Pointers */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50">
                  <Edit3 className="w-4 h-4" /> Editor / Pointers
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400">Chapter Instructions & Specifics</label>
                    <textarea
                      value={activeChapter.pointers}
                      onChange={(e) => {
                        const updated = project.chapters.map(c => c.id === activeChapterId ? { ...c, pointers: e.target.value } : c);
                        setProject({ ...project, chapters: updated });
                      }}
                      placeholder="Add specific facts, dates, or stories the AI should include in this chapter..."
                      className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-700 transition-all shadow-inner"
                      rows={4}
                    />
                  </div>
                  <div className="relative flex-1 flex flex-col min-h-0">
                    <label className="text-xs font-semibold text-slate-400 mb-2">Full Content (Markdown)</label>
                    <textarea
                      ref={textareaRef}
                      value={activeChapter.content}
                      onMouseUp={handleSelection}
                      onChange={(e) => {
                        const updated = project.chapters.map(c => c.id === activeChapterId ? { ...c, content: e.target.value } : c);
                        setProject({ ...project, chapters: updated });
                      }}
                      className="flex-1 w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-50 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-700 transition-all shadow-inner resize-none min-h-[400px]"
                    />
                    
                    {selection && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-slate-800 shadow-2xl rounded-2xl border border-indigo-500/30 p-4 animate-in fade-in zoom-in duration-200 z-30">
                        <div className="flex items-center gap-2 mb-3">
                          <Wand2 className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">AI Tweak Selection</span>
                        </div>
                        <textarea
                          value={tweakPrompt}
                          onChange={(e) => setTweakPrompt(e.target.value)}
                          placeholder="Instruction: e.g. Make it punchier, simplify jargon..."
                          className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs mb-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-600"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleTweak}
                            disabled={tweakLoading}
                            className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 disabled:opacity-50 transition-all"
                          >
                            {tweakLoading ? 'Processing...' : 'Apply Tweak'}
                          </button>
                          <button
                            onClick={() => setSelection(null)}
                            className="px-3 bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-indigo-400" /> Final View
                  </div>
                  {activeChapter.status === 'review' && (
                    <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md text-[10px] border border-indigo-500/20">IN REVIEW</span>
                  )}
                  {activeChapter.status === 'flagged' && (
                    <span className="bg-red-500/10 text-red-400 px-2.5 py-1 rounded-md text-[10px] border border-red-500/20">FLAGGED</span>
                  )}
                </div>
                <div className="flex-1 p-8 prose prose-invert prose-slate max-w-none overflow-y-auto bg-slate-900/30">
                  {!activeChapter.content ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <MessageSquare className="w-12 h-12 mb-2" />
                      <p className="text-sm font-bold tracking-widest uppercase">Preview Pending</p>
                    </div>
                  ) : (
                    <ReactMarkdown>{activeChapter.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChaptersTab;
