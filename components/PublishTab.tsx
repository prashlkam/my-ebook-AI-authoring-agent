
import React, { useState } from 'react';
import { EbookProject } from '../types';
import { generateTTS } from '../services/gemini';
import { Download, FileText, Music, Loader2, Play, CheckCircle2, Cloud, ShieldAlert } from 'lucide-react';

interface PublishTabProps {
  project: EbookProject;
}

const PublishTab: React.FC<PublishTabProps> = ({ project }) => {
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const completedCount = project.chapters.filter(c => c.content && c.status !== 'flagged').length;
  const progress = (completedCount / project.chapters.length) * 100;

  const handleTTSPreview = async (chapterContent: string, chapterId: string) => {
    setTtsLoading(chapterId);
    try {
      const url = await generateTTS(chapterContent);
      setAudioUrl(url);
    } catch (error) {
      console.error(error);
    } finally {
      setTtsLoading(null);
    }
  };

  const downloadPDF = () => {
    // Basic client-side print trigger as a mock for PDF generation
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Cloud className="w-48 h-48 text-indigo-500" />
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-slate-50 tracking-tight">{project.title || 'Untitled Book'}</h2>
              <p className="text-xl text-slate-400 font-medium">{project.subtitle}</p>
            </div>
            {project.coverUrl && (
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <img src={project.coverUrl} className="w-32 h-44 object-cover rounded-xl shadow-2xl ring-1 ring-slate-700 relative z-10" alt="Cover" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span>Publication Readiness</span>
              <span className="text-indigo-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700 shadow-inner">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={downloadPDF}
              className="flex flex-col items-center justify-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group/btn"
            >
              <FileText className="w-8 h-8 text-slate-600 group-hover/btn:text-indigo-400 mb-2 transition-colors" />
              <span className="text-sm font-bold text-slate-200">Export PDF</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">High-Res Layout</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group/btn">
              <Download className="w-8 h-8 text-slate-600 group-hover/btn:text-indigo-400 mb-2 transition-colors" />
              <span className="text-sm font-bold text-slate-200">Kindle (EPUB)</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">KDP Ready Format</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group/btn">
              <Music className="w-8 h-8 text-slate-600 group-hover/btn:text-indigo-400 mb-2 transition-colors" />
              <span className="text-sm font-bold text-slate-200">Audiobook</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Voice Narration</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 space-y-6">
        <h3 className="font-bold text-slate-50 text-lg flex items-center gap-2">
           <Play className="w-5 h-5 text-indigo-400 fill-indigo-400/20" /> Review & Audio Preview
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
                    {chapter.status === 'flagged' ? 'INTEGRITY RISK detected' : chapter.content ? 'Finalized' : 'Draft pending'}
                  </p>
                </div>
              </div>
              
              {chapter.content && (
                <button
                  onClick={() => handleTTSPreview(chapter.content, chapter.id)}
                  className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700"
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
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Preview Playback</p>
            <audio src={audioUrl} controls className="h-8 mt-2 opacity-90 contrast-125 saturate-150 filter invert grayscale brightness-200" autoPlay />
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishTab;
