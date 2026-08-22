
import React, { useState } from 'react';
import { EbookProject, AuthorPersona } from '../types';
import { generateTTS } from '../services/gemini';
import { Download, FileText, Music, Loader2, Play, CheckCircle2, Cloud, ShieldAlert, BookOpen, Eye, X, FileCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PublishTabProps {
  project: EbookProject;
  setProject?: (p: EbookProject) => void;
  persona?: AuthorPersona;
}

const PublishTab: React.FC<PublishTabProps> = ({ project, setProject, persona }) => {
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  const completedCount = project.chapters.filter(c => c.content && c.status !== 'flagged').length;
  const progress = project.chapters.length ? (completedCount / project.chapters.length) * 100 : 0;

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

  const downloadMarkdown = () => {
    let md = `# ${project.title || 'Untitled Ebook'}\n`;
    if (project.subtitle) md += `## ${project.subtitle}\n\n`;
    if (persona?.name) md += `**Author:** ${persona.name}\n\n`;
    if (project.targetAudience) md += `**Target Audience:** ${project.targetAudience}\n\n`;
    if (project.theme) md += `**Core Theme:** ${project.theme}\n\n`;
    
    md += `---\n\n## Table of Contents\n\n`;
    project.chapters.forEach(c => {
      md += `${c.number}. **${c.title}**\n`;
    });
    md += `\n---\n\n`;

    project.chapters.forEach(c => {
      md += `# Chapter ${c.number}: ${c.title}\n\n`;
      if (c.overview) md += `*${c.overview}*\n\n`;
      if (c.content) {
        md += `${c.content}\n\n`;
      } else {
        md += `*[Content Pending Generation]*\n\n`;
      }
      md += `---\n\n`;
    });

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

  const downloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${project.title || 'Untitled Ebook'}</title>
  <style>
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; line-height: 1.8; color: #0f172a; background: #fff; }
    .cover-container { text-align: center; padding: 60px 0; border-bottom: 2px solid #e2e8f0; margin-bottom: 40px; }
    .cover-img { max-height: 450px; border-radius: 12px; box-shadow: 0 20px 30px rgba(0,0,0,0.15); margin-bottom: 24px; }
    h1 { font-size: 2.75rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; line-height: 1.2; }
    h2 { font-weight: 600; color: #475569; margin-top: 0; }
    .meta { font-size: 0.9rem; color: #64748b; margin-top: 24px; }
    .toc { background: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 40px 0; }
    .toc h3 { font-size: 1.25rem; margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
    .toc ol { padding-left: 20px; }
    .toc li { margin-bottom: 8px; font-weight: 500; }
    .chapter { margin-top: 60px; padding-top: 40px; border-top: 1px solid #e2e8f0; page-break-before: always; }
    .chapter-num { text-transform: uppercase; font-size: 0.75rem; font-weight: 700; tracking: 0.1em; color: #6366f1; }
    .chapter-title { font-size: 2rem; margin-top: 4px; margin-bottom: 16px; }
    .overview { font-style: italic; color: #64748b; margin-bottom: 24px; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="cover-container">
    ${project.coverUrl ? `<img src="${project.coverUrl}" class="cover-img" alt="Cover"><br>` : ''}
    <h1>${project.title || 'Untitled Book'}</h1>
    <h2>${project.subtitle || ''}</h2>
    <div class="meta">
      ${persona?.name ? `<p><strong>Author:</strong> ${persona.name}</p>` : ''}
      ${project.targetAudience ? `<p><strong>Target Audience:</strong> ${project.targetAudience}</p>` : ''}
    </div>
  </div>

  <div class="toc">
    <h3>Table of Contents</h3>
    <ol>
      ${project.chapters.map(c => `<li>Chapter ${c.number}: ${c.title}</li>`).join('')}
    </ol>
  </div>

  ${project.chapters.map(c => `
    <div class="chapter">
      <div class="chapter-num">Chapter ${c.number}</div>
      <h2 class="chapter-title">${c.title}</h2>
      ${c.overview ? `<div class="overview">${c.overview}</div>` : ''}
      <div>${c.content ? c.content.replace(/\n/g, '<br>') : '<p><em>[Draft Pending]</em></p>'}</div>
    </div>
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

  return (
    <>
      {/* SCREEN UI */}
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
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

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>Publication Readiness</span>
                <span className="text-indigo-400">{Math.round(progress)}% ({completedCount}/{project.chapters.length} Chapters)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={handlePrintPDF}
                className="flex flex-col items-center justify-center p-5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-2xl transition-all group/btn"
              >
                <FileText className="w-7 h-7 text-indigo-400 group-hover/btn:scale-110 mb-2 transition-transform" />
                <span className="text-sm font-bold text-slate-100">Export Full PDF</span>
                <span className="text-[10px] text-indigo-300 uppercase tracking-tighter">Print to PDF</span>
              </button>

              <button
                onClick={() => setShowPreviewModal(true)}
                className="flex flex-col items-center justify-center p-5 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group/btn"
              >
                <Eye className="w-7 h-7 text-slate-400 group-hover/btn:text-indigo-400 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-200">Full Ebook Reader</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Live Preview</span>
              </button>

              <button
                onClick={downloadMarkdown}
                className="flex flex-col items-center justify-center p-5 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group/btn"
              >
                <FileCode className="w-7 h-7 text-slate-400 group-hover/btn:text-indigo-400 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-200">Markdown (.md)</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Compiled Source</span>
              </button>

              <button
                onClick={downloadHTML}
                className="flex flex-col items-center justify-center p-5 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group/btn"
              >
                <Download className="w-7 h-7 text-slate-400 group-hover/btn:text-indigo-400 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-200">HTML / EPUB</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Standalone Web Document</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 space-y-6">
          <h3 className="font-bold text-slate-50 text-lg flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-400 fill-indigo-400/20" /> Chapter Overview & Audio Narration
          </h3>
          <div className="divide-y divide-slate-800">
            {project.chapters.map((chapter) => (
              <div key={chapter.id} className="py-5 flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  {chapter.content ? (
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
                    <p className={`text-sm font-bold ${chapter.content ? 'text-slate-100' : 'text-slate-600'}`}>
                      Chapter {chapter.number}: {chapter.title}
                    </p>
                    <p className={`text-[10px] uppercase font-black tracking-widest ${chapter.status === 'flagged' ? 'text-red-400' : 'text-slate-500'}`}>
                      {chapter.status === 'flagged' ? 'INTEGRITY RISK detected' : chapter.content ? 'Finalized & Ready' : 'Draft pending'}
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
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintPDF}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
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
                  {project.chapters.map(c => (
                    <div key={c.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-800/50">
                      <span className="text-slate-200">Chapter {c.number}: {c.title}</span>
                      <span className={`text-xs ${c.content ? 'text-emerald-400' : 'text-slate-600'}`}>{c.content ? 'Drafted' : 'Outline'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapters */}
              {project.chapters.map(chapter => (
                <div key={chapter.id} className="space-y-6 pt-6 border-t border-slate-800">
                  <div>
                    <span className="text-xs uppercase font-bold text-indigo-400 tracking-widest">Chapter {chapter.number}</span>
                    <h2 className="text-2xl font-bold text-slate-50 mt-1">{chapter.title}</h2>
                    {chapter.overview && <p className="text-sm text-slate-400 italic mt-2 bg-slate-900 p-4 rounded-xl border border-slate-800">{chapter.overview}</p>}
                  </div>
                  {chapter.content ? (
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
            <p><strong>Total Chapters Planned:</strong> {project.chapters.length}</p>
          </div>
        </div>

        {/* Table of Contents */}
        <div style={{ padding: '60px 20px', pageBreakAfter: 'always' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '32px' }}>Table of Contents</h2>
          <ol style={{ paddingLeft: '24px', lineHeight: '2.2', fontSize: '1.1rem' }}>
            {project.chapters.map(c => (
              <li key={c.id}>
                <strong>Chapter {c.number}:</strong> {c.title}
              </li>
            ))}
          </ol>
        </div>

        {/* Chapter Contents */}
        {project.chapters.map(chapter => (
          <div key={chapter.id} style={{ padding: '60px 20px', pageBreakBefore: 'always' }}>
            <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '16px', marginBottom: '32px' }}>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '2px', color: '#4f46e5', marginBottom: '4px' }}>Chapter {chapter.number}</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>{chapter.title}</h2>
              {chapter.overview && <p style={{ fontStyle: 'italic', color: '#475569', fontSize: '1rem', background: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>{chapter.overview}</p>}
            </div>

            {chapter.content ? (
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
