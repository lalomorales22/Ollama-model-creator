import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Brain, 
  MessageSquare, 
  FileText,
  Cpu,
  Download,
  PlayCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Wrench,
  GitCompare,
  Code,
  Binary,
  Library
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navigationItems = [
  { icon: Home, label: 'Dashboard', path: '/', shortcut: '⌘1' },
  { icon: Brain, label: 'Models', path: '/models', shortcut: '⌘2' },
  { icon: MessageSquare, label: 'AI Assistant', path: '/assistant', shortcut: '⌘3' },
  { icon: FileText, label: 'ModelFiles', path: '/modelfiles', shortcut: '⌘4' },
  { icon: Cpu, label: 'Create Model', path: '/create', shortcut: '⌘5' },
  { icon: PlayCircle, label: 'Running', path: '/running', shortcut: '⌘6' },
  { icon: Download, label: 'Downloads', path: '/downloads', shortcut: '⌘7' },
];

// Phase 3 Power Features
const powerFeatures = [
  { icon: Sparkles, label: 'Playground', path: '/playground', color: 'text-purple-500' },
  { icon: Wrench, label: 'Tool Builder', path: '/tools', color: 'text-orange-500' },
  { icon: GitCompare, label: 'Compare', path: '/compare', color: 'text-blue-500' },
  { icon: Code, label: 'Editor', path: '/editor', color: 'text-green-500' },
  { icon: Binary, label: 'Embeddings', path: '/embeddings', color: 'text-cyan-500' },
  { icon: Library, label: 'Library', path: '/library', color: 'text-pink-500' },
];

// Animation variants
const sidebarVariants = {
  expanded: { 
    width: 256,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
  collapsed: { 
    width: 72,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
};

const mobileSidebarVariants = {
  open: { 
    x: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
  closed: { 
    x: -280,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
};

const overlayVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 },
};

const labelVariants = {
  visible: { opacity: 1, x: 0, display: 'block' },
  hidden: { opacity: 0, x: -10, transitionEnd: { display: 'none' } },
};

export function Sidebar() {
  const location = useLocation();
  const { 
    sidebarCollapsed, 
    toggleSidebar, 
    sidebarMobileOpen, 
    setMobileSidebarOpen 
  } = useUIStore();

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Collapse toggle - Desktop only */}
      {!isMobile && (
        <div className="p-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {/* Mobile close button */}
      {isMobile && (
        <div className="p-4 flex justify-between items-center border-b-2 border-gray-100 dark:border-gray-800">
          <span className="font-bold text-lg">Menu</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileSidebarOpen(false)}
            className="w-8 h-8 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto", isMobile ? "p-4" : sidebarCollapsed ? "p-2" : "p-4")}>
        <TooltipProvider delayDuration={0}>
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              const linkContent = (
                <NavLink
                  to={item.path}
                  onClick={() => isMobile && setMobileSidebarOpen(false)}
                  className={cn(
                    "w-full flex items-center rounded-lg border-2 border-black dark:border-gray-700 transition-all duration-200",
                    sidebarCollapsed && !isMobile 
                      ? "justify-center px-2 py-3" 
                      : "space-x-3 px-4 py-3",
                    isActive 
                      ? "bg-black text-white dark:bg-white dark:text-black" 
                      : "bg-white text-black hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {(!sidebarCollapsed || isMobile) && (
                      <motion.span
                        variants={labelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2 }}
                        className="font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              );

              // Wrap in tooltip when collapsed (desktop only)
              if (sidebarCollapsed && !isMobile) {
                return (
                  <li key={item.path}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        <span>{item.label}</span>
                        <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                          {item.shortcut}
                        </kbd>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.path}>{linkContent}</li>;
            })}
          </ul>

          {/* Power Features Section */}
          {(!sidebarCollapsed || isMobile) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                Power Features
              </span>
            </div>
          )}
          <ul className="space-y-1 mt-2">
            {powerFeatures.map((item) => {
              const isActive = location.pathname === item.path;
              
              const linkContent = (
                <NavLink
                  to={item.path}
                  onClick={() => isMobile && setMobileSidebarOpen(false)}
                  className={cn(
                    "w-full flex items-center rounded-lg border-2 transition-all duration-200",
                    sidebarCollapsed && !isMobile 
                      ? "justify-center px-2 py-2" 
                      : "space-x-3 px-3 py-2",
                    isActive 
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                      : "bg-white text-black border-gray-200 hover:border-black dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:hover:border-gray-500"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 flex-shrink-0", !isActive && item.color)} />
                  <AnimatePresence mode="wait">
                    {(!sidebarCollapsed || isMobile) && (
                      <motion.span
                        variants={labelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              );

              if (sidebarCollapsed && !isMobile) {
                return (
                  <li key={item.path}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <span>{item.label}</span>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.path}>{linkContent}</li>;
            })}
          </ul>
        </TooltipProvider>
      </nav>
      
      {/* Footer */}
      <div className={cn(
        "p-4 border-t-2 border-gray-100 dark:border-gray-800",
        sidebarCollapsed && !isMobile && "p-2"
      )}>
        <motion.div
          animate={{ opacity: sidebarCollapsed && !isMobile ? 0 : 1 }}
          className="flex items-center justify-center space-x-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Zap className="w-3 h-3" />
          {(!sidebarCollapsed || isMobile) && (
            <span className="text-xs font-medium">Built with Love</span>
          )}
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={false}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        className="hidden md:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-950 border-r-4 border-black dark:border-gray-700 overflow-hidden z-30"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.aside
        variants={mobileSidebarVariants}
        initial="closed"
        animate={sidebarMobileOpen ? 'open' : 'closed'}
        className="md:hidden fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-950 border-r-4 border-black dark:border-gray-700 z-50 shadow-xl"
      >
        <SidebarContent isMobile />
      </motion.aside>
    </>
  );
}
