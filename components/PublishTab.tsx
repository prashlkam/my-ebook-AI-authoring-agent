import React, { useState } from 'react';
import { EbookProject, AuthorPersona, Chapter } from '../types';
import { generateTTS, draftChapter } from '../services/gemini';
import { 
  Download, 
  FileText, 
  Music, 
  Loader2, 
  Play, 
  CheckCircle2, 
  Cloud, 
  ShieldAlert, 
  BookOpen, 
  Eye, 
  X, 
  FileCode, 
  Copy, 
  Check, 
  Sparkles, 
  FileDown, 
  RotateCw,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PublishTabProps {
  project: EbookProject;
  setProject?: (p: EbookProject) => void;
  persona?: AuthorPersona;
}

// Convert Markdown to clean semantic HTML for standalone book files
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/___(.*?)___/gim, '<strong><em>$1</em></strong>')
    .replace(/__(.*?)__/gim, '<strong>$1</strong>')
    .replace(/_(.*?)_/gim, '<em>$1</em>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>')
    .replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li>$1</li>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>');

  html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  const paragraphs = html
    .split(/\n\s*\n/)
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h1') || 
        trimmed.startsWith('<h2') || 
        trimmed.startsWith('<h3') || 
        trimmed.startsWith('<blockquote') || 
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol')
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return paragraphs;
};

const PublishTab: React.FC<PublishTabProps> = ({ project, setProject, persona }) => {
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [copied, setCopied] = useState(false);

  // Batch AI drafting state
  const [batchDrafting, setBatchDrafting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; chapterTitle: string } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const completedCount = (project.chapters || []).filter(c => c.content && c.content.trim().length > 0 && c.status !== 'flagged').length;
  const totalChapters = project.chapters?.length || 0;
  const progress = totalChapters ? (completedCount / totalChapters) * 100 : 0;
  const undraftedCount = totalChapters - completedCount;

  // Batch AI draft all chapters that don't have content yet
  const handleBatchDraftAll = async () => {
    if (!setProject || !project.chapters.length) return;
    setBatchDrafting(true);
    setBatchError(null);

    try {
      let currentChapters = [...project.chapters];
      const undraftedIndices = currentChapters
        .map((c, idx) => (!c.content || !c.content.trim() ? idx : -1))
        .filter(idx => idx !== -1);

      const totalToDraft = undraftedIndices.length;

      for (let step = 0; step < undraftedIndices.length; step++) {
        const chapterIndex = undraftedIndices[step];
        const chapter = currentChapters[chapterIndex];

        setBatchProgress({
          current: step + 1,
          total: totalToDraft,
          chapterTitle: chapter.title || `Chapter ${chapter.number}`
        });

        // Collect running summaries of previous chapters
        const previousChapters = currentChapters.slice(0, chapterIndex);
        const runningSummary = previousChapters
          .filter(c => c.summary || c.overview)
          .map(c => `Chapter ${c.number} (${c.title}): ${c.summary || c.overview}`)
          .join('\n');

        const activePersona = persona || project.authorPersona;
        const { content, summary } = await draftChapter(chapter, activePersona, project, runningSummary);

        currentChapters = currentChapters.map((c, idx) => 
          idx === chapterIndex 
            ? { ...c, content, summary, status: 'review' as const } 
            : c
        );

        setProject({
          ...project,
          chapters: currentChapters
        });
      }
    } catch (err: any) {
      console.error("Batch drafting error:", err);
      setBatchError(typeof err?.message === 'string' ? err.message : 'Batch drafting encountered an error.');
    } finally {
      setBatchDrafting(false);
      setBatchProgress(null);
    }
  };

  const handleTTSPreview = async (chapterContent: string, chapterId: string) => {
    setTtsLoading(chapterId);
    try {
      const url = await generateTTS(chapterContent);
      setAudioUrl(url);
    } catch (error) {
      console.error("TTS preview error:", error);
    } finally {
      setTtsLoading(null);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Compile entire book into clean Markdown format
  const getCompiledMarkdown = () => {
    let md = `# ${project.title || 'Untitled Ebook'}\n`;
    if (project.subtitle) md += `## ${project.subtitle}\n\n`;
    if (persona?.name) md += `**Author:** ${persona.name}\n\n`;
    if (project.targetAudience) md += `**Target Audience:** ${project.targetAudience}\n\n`;
    if (project.theme) md += `**Core Theme:** ${project.theme}\n\n`;
    if (project.coverUrl) md += `![Book Cover](${project.coverUrl})\n\n`;
    
    md += `---\n\n## Table of Contents\n\n`;
    (project.chapters || []).forEach(c => {
      md += `${c.number}. **${c.title}**\n`;
    });
    md += `\n---\n\n`;

    (project.chapters || []).forEach(c => {
      md += `# Chapter ${c.number}: ${c.title}\n\n`;
      if (c.overview) md += `*${c.overview}*\n\n`;
      if (c.content && c.content.trim()) {
        md += `${c.content.trim()}\n\n`;
      } else {
        md += `*[Chapter content draft pending generation - Outline: ${c.overview || 'No outline'} ]*\n\n`;
      }
      md += `---\n\n`;
    });

    return md;
  };

  // Compile entire book into clean Plain Text format
  const getCompiledPlainText = () => {
    let txt = `${(project.title || 'Untitled Ebook').toUpperCase()}\n`;
    if (project.subtitle) txt += `${project.subtitle}\n`;
    if (persona?.name) txt += `By ${persona.name}\n`;
    if (project.targetAudience) txt += `Target Audience: ${project.targetAudience}\n`;
    txt += `\n=========================================\n\n`;
    
    txt += `TABLE OF CONTENTS\n\n`;
    (project.chapters || []).forEach(c => {
      txt += `Chapter ${c.number}: ${c.title}\n`;
    });
    txt += `\n=========================================\n\n`;

    (project.chapters || []).forEach(c => {
      txt += `CHAPTER ${c.number}: ${c.title.toUpperCase()}\n`;
      txt += `-----------------------------------------\n`;
      if (c.overview) txt += `Overview: ${c.overview}\n\n`;
      if (c.content && c.content.trim()) {
        const cleanContent = c.content
          .replace(/#{1,6}\s+/g, '')
          .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/^>\s+/gm, '  ');
        txt += `${cleanContent.trim()}\n\n`;
      } else {
        txt += `[Chapter content pending generation]\n\n`;
      }
      txt += `\n=========================================\n\n`;
    });

    return txt;
  };

  const downloadMarkdown = () => {
    const md = getCompiledMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(project.title || 'Ebook').replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPlainText = () => {
    const txt = getCompiledPlainText();
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(project.title || 'Ebook').replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title || 'Untitled Ebook'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Inter:wght@400;600;800&display=swap');
    body {
      font-family: 'Merriweather', Georgia, serif;
      max-width: 840px;
      margin: 40px auto;
      padding: 0 32px;
      line-height: 1.85;
      color: #1e293b;
      background: #fdfdfd;
    }
    h1, h2, h3, h4, .meta-box, .toc-title {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .cover-container {
      text-align: center;
      padding: 80px 0;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 60px;
      page-break-after: always;
    }
    .cover-img {
      max-height: 480px;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      margin-bottom: 32px;
    }
    h1 {
      font-size: 3rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      line-height: 1.15;
    }
    h2.subtitle {
      font-weight: 500;
      font-size: 1.5rem;
      color: #64748b;
      margin-top: 0;
    }
    .author-byline {
      font-size: 1.15rem;
      font-weight: 600;
      color: #4f46e5;
      margin-top: 24px;
    }
    .meta-box {
      background: #f8fafc;
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      margin: 40px 0;
      font-size: 0.95rem;
      color: #475569;
    }
    .toc {
      background: #f8fafc;
      padding: 40px;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      margin: 60px 0;
      page-break-after: always;
    }
    .toc-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .toc ol {
      padding-left: 24px;
      line-height: 2.2;
    }
    .toc a {
      color: #334155;
      text-decoration: none;
      font-weight: 600;
    }
    .toc a:hover {
      color: #4f46e5;
      text-decoration: underline;
    }
    .chapter {
      margin-top: 80px;
      padding-top: 60px;
      border-top: 1px solid #e2e8f0;
      page-break-before: always;
    }
    .chapter-num {
      text-transform: uppercase;
      font-size: 0.85rem;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #6366f1;
      margin-bottom: 8px;
    }
    .chapter-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .chapter-overview {
      font-style: italic;
      color: #475569;
      margin-bottom: 36px;
      background: #f1f5f9;
      padding: 16px 20px;
      border-radius: 12px;
      border-left: 4px solid #6366f1;
    }
    .chapter-body {
      font-size: 1.125rem;
      color: #1e293b;
    }
    .chapter-body p {
      margin-bottom: 1.5em;
    }
    .chapter-body blockquote {
      border-left: 4px solid #cbd5e1;
      padding-left: 16px;
      margin-left: 0;
      color: #64748b;
      font-style: italic;
    }
    .chapter-body h2, .chapter-body h3 {
      color: #0f172a;
      margin-top: 1.8em;
      margin-bottom: 0.8em;
    }
  </style>
</head>
<body>
  <div class="cover-container">
    ${project.coverUrl ? `<img src="${project.coverUrl}" class="cover-img" alt="Cover"><br>` : ''}
    <h1>${project.title || 'Untitled Book'}</h1>
    ${project.subtitle ? `<h2 class="subtitle">${project.subtitle}</h2>` : ''}
    ${persona?.name ? `<div class="author-byline">By ${persona.name}</div>` : ''}
    <div class="meta-box">
      ${project.targetAudience ? `<p><strong>Target Audience:</strong> ${project.targetAudience}</p>` : ''}
      ${project.theme ? `<p><strong>Core Theme:</strong> ${project.theme}</p>` : ''}
    </div>
  </div>

  <div class="toc">
    <div class="toc-title">Table of Contents</div>
    <ol>
      ${(project.chapters || []).map(c => `<li><a href="#ch-${c.number}">Chapter ${c.number}: ${c.title}</a></li>`).join('')}
    </ol>
  </div>

  ${(project.chapters || []).map(c => `
    <article class="chapter" id="ch-${c.number}">
      <div class="chapter-num">Chapter ${c.number}</div>
      <h2 class="chapter-title">${c.title}</h2>
      ${c.overview ? `<div class="chapter-overview">${c.overview}</div>` : ''}
      <div class="chapter-body">
        ${c.content ? markdownToHtml(c.content) : '<p><em>[Chapter content draft pending generation]</em></p>'}
      </div>
    </article>
  `).join('')}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(project.title || 'Ebook').replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyFullBook = () => {
    const md = getCompiledMarkdown();
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      {/* SCREEN UI */}
      <div className="screen-only no-print max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cloud className="w-48 h-48 text-indigo-500" />
          </div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-start justify-between">
              {isEditingHeader ? (
                <div className="space-y-3 flex-1 mr-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-400">Book Title</label>
                    <input
                      type="text"
                      value={project.title}
                      onChange={(e) => setProject && setProject({ ...project, title: e.target.value })}
                      placeholder="Enter book title..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 text-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-400">Subtitle</label>
                    <input
                      type="text"
                      value={project.subtitle}
                      onChange={(e) => setProject && setProject({ ...project, subtitle: e.target.value })}
                      placeholder="Enter subtitle..."
                      className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors"
                  >
                    Done Editing
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-4xl font-black text-slate-50 tracking-tight">{project.title || 'Untitled Book'}</h2>
                    {setProject && (
                      <button
                        onClick={() => setIsEditingHeader(true)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 transition-all hover:bg-indigo-500/20"
                      >
                        Edit Title & Subtitle
                      </button>
                    )}
                  </div>
                  <p className="text-xl text-slate-400 font-medium">{project.subtitle || 'No subtitle specified yet'}</p>
                  {persona?.name && (
                    <p className="text-sm text-indigo-400 font-semibold">By {persona.name}</p>
                  )}
                </div>
              )}
              {project.coverUrl && (
                <div className="relative group flex-shrink-0">
                  <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                  <img src={project.coverUrl} className="w-32 h-44 object-cover rounded-xl shadow-2xl ring-1 ring-slate-700 relative z-10" alt="Cover" />
                </div>
              )}
            </div>

            {/* Publication Progress & Batch AI Generation */}
            <div className="space-y-4 bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span className="text-slate-400">Manuscript Readiness</span>
                <span className="text-indigo-400 font-extrabold">{Math.round(progress)}% ({completedCount}/{totalChapters} Chapters Completed)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-400 h-full transition-all duration-700 shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>

              {/* Batch Draft Button when undrafted chapters remain */}
              {undraftedCount > 0 && (
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-800/80">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {undraftedCount} chapter{undraftedCount > 1 ? 's' : ''} remaining to be drafted
                    </p>
                    <p className="text-xs text-slate-400">
                      Draft the whole manuscript automatically in one pass using your author voice and running context.
                    </p>
                  </div>
                  <button
                    onClick={handleBatchDraftAll}
                    disabled={batchDrafting}
                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {batchDrafting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Drafting ({batchProgress?.current}/{batchProgress?.total})...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Draft Entire Book with AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {batchProgress && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center gap-3 text-xs text-indigo-300 animate-in fade-in duration-200">
                  <RotateCw className="w-4 h-4 animate-spin text-indigo-400 flex-shrink-0" />
                  <span>Currently drafting: <strong>{batchProgress.chapterTitle}</strong> (Chapter {batchProgress.current} of {batchProgress.total})</span>
                </div>
              )}

              {batchError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{batchError}</span>
                </div>
              )}
            </div>

            {/* Export Actions Grid */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deliver Entire Book (All Formats)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  onClick={handlePrintPDF}
                  className="flex flex-col items-center justify-center p-4 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-2xl transition-all group/btn"
                >
                  <FileText className="w-6 h-6 text-indigo-400 group-hover/btn:scale-110 mb-1.5 transition-transform" />
                  <span className="text-xs font-bold text-slate-100">Export Full PDF</span>
                  <span className="text-[9px] text-indigo-300 uppercase tracking-tighter">Printable PDF</span>
                </button>

                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group/btn"
                >
                  <Eye className="w-6 h-6 text-slate-400 group-hover/btn:text-indigo-400 mb-1.5 transition-colors" />
                  <span className="text-xs font-bold text-slate-200">Full Ebook Reader</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Live Preview</span>
                </button>

                <button
                  onClick={downloadHTML}
                  className="flex flex-col items-center justify-center p-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group/btn"
                >
                  <Download className="w-6 h-6 text-slate-400 group-hover/btn:text-indigo-400 mb-1.5 transition-colors" />
                  <span className="text-xs font-bold text-slate-200">HTML / EPUB</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Standalone Web Book</span>
                </button>

                <button
                  onClick={downloadMarkdown}
                  className="flex flex-col items-center justify-center p-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group/btn"
                >
                  <FileCode className="w-6 h-6 text-slate-400 group-hover/btn:text-indigo-400 mb-1.5 transition-colors" />
                  <span className="text-xs font-bold text-slate-200">Markdown (.md)</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Compiled Source</span>
                </button>

                <button
                  onClick={downloadPlainText}
                  className="flex flex-col items-center justify-center p-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group/btn"
                >
                  <FileDown className="w-6 h-6 text-slate-400 group-hover/btn:text-indigo-400 mb-1.5 transition-colors" />
                  <span className="text-xs font-bold text-slate-200">Plain Text (.txt)</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Unformatted Manuscript</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCopyFullBook}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-indigo-300 font-semibold bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Full Book Copied to Clipboard!' : 'Copy Full Book to Clipboard'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Overview and Audio Narration */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-50 text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-400 fill-indigo-400/20" /> Chapter Overview & Audio Narration
            </h3>
            <span className="text-xs text-slate-500">{totalChapters} Chapters in Book</span>
          </div>

          <div className="divide-y divide-slate-800">
            {(project.chapters || []).map((chapter) => (
              <div key={chapter.id} className="py-5 flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  {chapter.content && chapter.content.trim() ? (
                    chapter.status === 'flagged' ? (
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    )
                  ) : (
                    <div className="w-6 h-6 border-2 border-slate-800 rounded-full bg-slate-950" />
                  )}
                  <div className="space-y-1">
                    <p className={`text-sm font-bold ${chapter.content ? 'text-slate-100' : 'text-slate-500'}`}>
                      Chapter {chapter.number}: {chapter.title}
                    </p>
                    <p className={`text-[10px] uppercase font-black tracking-widest ${chapter.status === 'flagged' ? 'text-red-400' : chapter.content ? 'text-emerald-400/80' : 'text-slate-500'}`}>
                      {chapter.status === 'flagged' ? 'INTEGRITY RISK DETECTED' : chapter.content ? 'Draft Complete & Ready' : 'Draft pending'}
                    </p>
                  </div>
                </div>
                
                {chapter.content && (
                  <button
                    onClick={() => handleTTSPreview(chapter.content, chapter.id)}
                    className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700"
                    title="Audio Narration Preview"
                  >
                    {ttsLoading === chapter.id ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : <Play className="w-5 h-5" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {audioUrl && (
          <div className="fixed bottom-8 right-8 bg-slate-900 text-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700 flex items-center gap-5 animate-in slide-in-from-right-10 z-50">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Music className="w-6 h-6" />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Narration Playback</p>
              <audio src={audioUrl} controls className="h-8 mt-2 opacity-90 contrast-125 saturate-150 filter invert grayscale brightness-200" autoPlay />
            </div>
          </div>
        )}
      </div>

      {/* FULL EBOOK ON-SCREEN READER MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-lg">Full Ebook Reader Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadHTML}
                  className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> HTML
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5" /> Markdown
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-slate-950 text-slate-100">
              {/* Cover */}
              <div className="text-center py-12 border-b border-slate-800">
                {project.coverUrl && (
                  <img src={project.coverUrl} className="max-h-80 mx-auto rounded-2xl shadow-2xl mb-8 border border-slate-800" alt="Cover" />
                )}
                <h1 className="text-3xl font-black text-slate-50 mb-2">{project.title || 'Untitled Book'}</h1>
                <p className="text-lg text-slate-400">{project.subtitle}</p>
                {persona?.name && <p className="text-sm text-indigo-400 font-semibold mt-4">Written by {persona.name}</p>}
              </div>

              {/* Table of Contents */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-slate-300 uppercase tracking-widest text-xs">Table of Contents</h3>
                <div className="space-y-2">
                  {(project.chapters || []).map(c => (
                    <div key={c.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-800/50">
                      <span className="text-slate-200">Chapter {c.number}: {c.title}</span>
                      <span className={`text-xs font-medium ${c.content && c.content.trim() ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {c.content && c.content.trim() ? 'Drafted' : 'Outline Only'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapters */}
              {(project.chapters || []).map(chapter => (
                <div key={chapter.id} className="space-y-6 pt-6 border-t border-slate-800">
                  <div>
                    <span className="text-xs uppercase font-bold text-indigo-400 tracking-widest">Chapter {chapter.number}</span>
                    <h2 className="text-2xl font-bold text-slate-50 mt-1">{chapter.title}</h2>
                    {chapter.overview && (
                      <p className="text-sm text-slate-400 italic mt-2 bg-slate-900 p-4 rounded-xl border border-slate-800">
                        {chapter.overview}
                      </p>
                    )}
                  </div>
                  {chapter.content && chapter.content.trim() ? (
                    <div className="prose prose-invert prose-slate max-w-none text-slate-200 leading-relaxed">
                      <ReactMarkdown>{chapter.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-slate-600 italic text-sm">[Content pending generation]</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY COMPLETE EBOOK HTML DOM (Included in window.print PDF output) */}
      <div id="printable-ebook">
        {/* Cover Page */}
        <div style={{ textAlign: 'center', padding: '60px 20px', pageBreakAfter: 'always', minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {project.coverUrl && (
            <img src={project.coverUrl} alt="Book Cover" style={{ maxHeight: '500px', objectFit: 'contain', marginBottom: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }} />
          )}
          <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '16px', color: '#0f172a' }}>{project.title || 'Untitled Ebook'}</h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '500', color: '#475569', marginBottom: '24px' }}>{project.subtitle}</h2>
          {persona?.name && <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#4f46e5' }}>By {persona.name}</p>}
        </div>

        {/* Title & Metadata Page */}
        <div style={{ padding: '60px 20px', pageBreakAfter: 'always', minHeight: '80vh' }}>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '2px', color: '#64748b', marginBottom: '8px' }}>Master Ebook Edition</p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', color: '#0f172a' }}>{project.title || 'Untitled Book'}</h1>
          {project.subtitle && <p style={{ fontSize: '1.25rem', color: '#334155', marginBottom: '32px' }}>{project.subtitle}</p>}
          
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '40px', lineHeight: '2' }}>
            {persona?.name && <p><strong>Author:</strong> {persona.name}</p>}
            {project.targetAudience && <p><strong>Target Audience:</strong> {project.targetAudience}</p>}
            {project.theme && <p><strong>Core Theme:</strong> {project.theme}</p>}
            <p><strong>Total Chapters Planned:</strong> {project.chapters?.length || 0}</p>
          </div>
        </div>

        {/* Table of Contents */}
        <div style={{ padding: '60px 20px', pageBreakAfter: 'always' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '32px' }}>Table of Contents</h2>
          <ol style={{ paddingLeft: '24px', lineHeight: '2.2', fontSize: '1.1rem' }}>
            {(project.chapters || []).map(c => (
              <li key={c.id}>
                <strong>Chapter {c.number}:</strong> {c.title}
              </li>
            ))}
          </ol>
        </div>

        {/* Chapter Contents */}
        {(project.chapters || []).map(chapter => (
          <div key={chapter.id} style={{ padding: '60px 20px', pageBreakBefore: 'always' }}>
            <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '16px', marginBottom: '32px' }}>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '2px', color: '#4f46e5', marginBottom: '4px' }}>Chapter {chapter.number}</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>{chapter.title}</h2>
              {chapter.overview && <p style={{ fontStyle: 'italic', color: '#475569', fontSize: '1rem', background: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>{chapter.overview}</p>}
            </div>

            {chapter.content && chapter.content.trim() ? (
              <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#1e293b' }}>
                <ReactMarkdown>{chapter.content}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ padding: '32px', background: '#f8fafc', border: '1px border-dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8', fontStyle: 'italic' }}>
                [Chapter content draft pending generation]
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default PublishTab;
