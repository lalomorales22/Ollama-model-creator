import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './components/dashboard/Dashboard';
import { ModelList } from './components/models/ModelList';
import { AIAssistant } from './components/assistant/AIAssistant';
import { CreateModel } from './components/create/CreateModel';
import { RunningModels } from './components/running/RunningModels';
import { Downloads } from './components/downloads/Downloads';
import { ModelFiles } from './components/modelfiles/ModelFiles';
import { Help } from './components/help/Help';
import { Settings } from './components/settings/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageTransition } from './components/PageTransition';
import { Toaster } from '@/components/ui/toaster';
import { useConnectionStore } from '@/stores/connection-store';
import { useModelsStore } from '@/stores/models-store';
import { useSettingsStore } from '@/stores/settings-store';
// Phase 3 Components
import { Playground } from './components/playground';
import { ToolsPlayground } from './components/tools';
import { ModelComparison } from './components/compare';
import { ModelFileEditor } from './components/editor';
import { EmbeddingsPlayground } from './components/embeddings';
import { ModelLibrary } from './components/library';
import './App.css';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/models" element={<PageTransition><ModelList /></PageTransition>} />
        <Route path="/assistant" element={<PageTransition><AIAssistant /></PageTransition>} />
        <Route path="/create" element={<PageTransition><CreateModel /></PageTransition>} />
        <Route path="/running" element={<PageTransition><RunningModels /></PageTransition>} />
        <Route path="/downloads" element={<PageTransition><Downloads /></PageTransition>} />
        <Route path="/modelfiles" element={<PageTransition><ModelFiles /></PageTransition>} />
        <Route path="/help" element={<PageTransition><Help /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        {/* Phase 3 Routes */}
        <Route path="/playground" element={<PageTransition><Playground /></PageTransition>} />
        <Route path="/tools" element={<PageTransition><ToolsPlayground /></PageTransition>} />
        <Route path="/compare" element={<PageTransition><ModelComparison /></PageTransition>} />
        <Route path="/editor" element={<PageTransition><ModelFileEditor /></PageTransition>} />
        <Route path="/embeddings" element={<PageTransition><EmbeddingsPlayground /></PageTransition>} />
        <Route path="/library" element={<PageTransition><ModelLibrary /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const { checkConnection, startHealthCheck } = useConnectionStore();
  const { fetchModels } = useModelsStore();
  const { autoLoadModels, settings } = useSettingsStore();

  // Apply theme on load
  useEffect(() => {
    const isDark = settings.theme === 'dark' || 
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, [settings.theme]);

  useEffect(() => {
    // Initialize connection on app load
    const init = async () => {
      await checkConnection();
      startHealthCheck(30000); // Check every 30 seconds
      
      // Auto-load models if enabled
      if (autoLoadModels) {
        fetchModels();
      }
    };
    
    init();
  }, [checkConnection, startHealthCheck, fetchModels, autoLoadModels]);

  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <AppLayout>
          <AnimatedRoutes />
        </AppLayout>
        <Toaster />
      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;