import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { Toaster } from '@/components/ui/toaster';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/models" element={<ModelList />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/create" element={<CreateModel />} />
            <Route path="/running" element={<RunningModels />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/modelfiles" element={<ModelFiles />} />
            <Route path="/help" element={<Help />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppLayout>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;