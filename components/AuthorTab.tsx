
import React, { useState } from 'react';
import { AuthorPersona } from '../types';
import { scrapeAuthorIdentity } from '../services/gemini';
import { Loader2, Save, Search, Sparkles } from 'lucide-react';

interface AuthorTabProps {
  persona: AuthorPersona;
  setPersona: (p: AuthorPersona) => void;
}

const AuthorTab: React.FC<AuthorTabProps> = ({ persona, setPersona }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleScrape = async () => {
    if (!persona.name) return alert('Please enter author name');
    setLoading(true);
    setStatus('Researching author identity...');
    try {
      const result = await scrapeAuthorIdentity(persona.name, persona.socialHandles);
      setPersona({ ...persona, professionalHistory: result });
      setStatus('Successfully analyzed identity.');
    } catch (error) {
      console.error(error);
      setStatus('Error searching for identity.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPersona({ ...persona, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Author Identity Builder</h2>
          <p className="text-slate-400">Define the core voice and history that will power the AI agent.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Full Name</label>
            <input
              name="name"
              value={persona.name}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Social Handles / Website</label>
            <input
              name="socialHandles"
              value={persona.socialHandles}
              onChange={handleChange}
              placeholder="e.g. @janedoe, janedoe.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleScrape}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-500/20 border border-indigo-500/20 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Auto-Scrape Professional Identity
        </button>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Professional History & Expertise</label>
            <textarea
              name="professionalHistory"
              rows={5}
              value={persona.professionalHistory}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
              placeholder="Auto-generated summary or manual input..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Writing Style (Voice)</label>
              <input
                name="writingStyle"
                value={persona.writingStyle}
                onChange={handleChange}
                placeholder="e.g. Provocative, Data-Driven, Academic, Punchy"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">The Core "Why"</label>
              <input
                name="coreWhy"
                value={persona.coreWhy}
                onChange={handleChange}
                placeholder="Why write this book?"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Defining Personal Stories</label>
            <textarea
              name="personalStories"
              rows={3}
              value={persona.personalStories}
              onChange={handleChange}
              placeholder="Share 1-2 formative stories to weave into the chapters..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 flex items-center gap-1 italic">
            <Sparkles className="w-3 h-3 text-indigo-400" /> {status || 'Identity data ready for drafting.'}
          </p>
          <button className="flex items-center gap-2 bg-slate-50 text-slate-950 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">
            <Save className="w-4 h-4" /> Save Persona
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorTab;
