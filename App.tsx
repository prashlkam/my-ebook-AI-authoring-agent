
import React, { useState } from 'react';
import { AppTab, EbookProject, AuthorPersona } from './types';
import Layout from './components/Layout';
import AuthorTab from './components/AuthorTab';
import ResearchTab from './components/ResearchTab';
import ChaptersTab from './components/ChaptersTab';
import PublishTab from './components/PublishTab';
import AuthPage from './components/AuthPage';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-100">Something went wrong</h2>
              <p className="text-sm text-slate-400">An unexpected error occurred during rendering.</p>
            </div>
            {this.state.error?.message && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-red-300 font-mono text-left overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <RotateCcw className="w-4 h-4" /> Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.AUTHOR);
  
  const [persona, setPersona] = useState<AuthorPersona>({
    name: '',
    professionalHistory: '',
    writingStyle: '',
    coreWhy: '',
    personalStories: '',
    socialHandles: ''
  });

  const [project, setProject] = useState<EbookProject>({
    id: 'p1',
    theme: '',
    title: '',
    subtitle: '',
    targetAudience: '',
    authorPersona: persona,
    chapters: []
  });

  const handleLogin = (userData: { email: string }) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case AppTab.AUTHOR:
        return <AuthorTab persona={persona} setPersona={setPersona} />;
      case AppTab.RESEARCH:
        return <ResearchTab project={project} setProject={setProject} persona={persona} />;
      case AppTab.CHAPTERS:
        return <ChaptersTab project={project} setProject={setProject} persona={persona} />;
      case AppTab.PUBLISH:
        return <PublishTab project={project} setProject={setProject} persona={persona} />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}>
        {renderTab()}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
