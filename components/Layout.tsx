
import React, { useState } from 'react';
import { AppTab } from '../types';
import { User, Search, BookOpen, Send, Github, LogOut, ChevronDown } from 'lucide-react';

interface LayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  children: React.ReactNode;
  user?: { email: string } | null;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children, user, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const tabs = [
    { id: AppTab.AUTHOR, icon: User, label: 'Author Identity' },
    { id: AppTab.RESEARCH, icon: Search, label: 'Research' },
    { id: AppTab.CHAPTERS, icon: BookOpen, label: 'Drafting' },
    { id: AppTab.PUBLISH, icon: Send, label: 'Publish' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Ebook Agent
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hidden sm:block">
              <Github className="w-5 h-5" />
            </button>
            
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pl-3 pr-2 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 hidden md:block max-w-[100px] truncate">
                    {user.email}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Signed in as</p>
                        <p className="text-xs font-semibold text-slate-200 truncate">{user.email}</p>
                      </div>
                      <button 
                        onClick={() => {
                          onLogout?.();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm bg-slate-950">
        &copy; 2024 AI Ebook Authoring Agent. Built with Gemini 3.
      </footer>
    </div>
  );
};

export default Layout;
