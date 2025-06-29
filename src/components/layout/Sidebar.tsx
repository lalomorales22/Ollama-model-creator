import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Brain, 
  MessageSquare, 
  FileText,
  Cpu,
  Download,
  PlayCircle,
  Zap
} from 'lucide-react';

const navigationItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Brain, label: 'Models', path: '/models' },
  { icon: MessageSquare, label: 'AI Assistant', path: '/assistant' },
  { icon: FileText, label: 'ModelFiles', path: '/modelfiles' },
  { icon: Cpu, label: 'Create Model', path: '/create' },
  { icon: PlayCircle, label: 'Running', path: '/running' },
  { icon: Download, label: 'Downloads', path: '/downloads' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r-4 border-black overflow-y-auto flex flex-col">
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-3 rounded-lg border-2 border-black transition-all duration-200 ${
                    isActive 
                      ? "bg-black text-white" 
                      : "bg-white text-black hover:bg-gray-100"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Built by Bolt logo */}
      <div className="p-4 border-t-2 border-gray-100">
        <div className="flex items-center justify-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Zap className="w-3 h-3" />
          <span className="text-xs font-medium">Built by Bolt</span>
        </div>
      </div>
    </aside>
  );
}