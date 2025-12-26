
import React, { useState } from 'react';
import { AppTab, EbookProject, AuthorPersona } from './types';
import Layout from './components/Layout';
import AuthorTab from './components/AuthorTab';
import ResearchTab from './components/ResearchTab';
import ChaptersTab from './components/ChaptersTab';
import PublishTab from './components/PublishTab';
import AuthPage from './components/AuthPage';

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
        return <PublishTab project={project} />;
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}>
      {renderTab()}
    </Layout>
  );
};

export default App;
