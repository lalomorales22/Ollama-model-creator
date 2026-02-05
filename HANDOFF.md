# 🤖 Ollama Model Creator - Handoff Document

> **For AI Assistants:** This document provides full context to continue development. Read `TASKS.md` for the complete roadmap.

---

## 📋 Project Overview

| Attribute | Value |
|-----------|-------|
| **App Name** | Ollama Model Creator |
| **Purpose** | Create and manage custom Ollama models with an AI assistant |
| **Tech Stack** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Design System** | Neo-brutalist (thick borders, bold colors, high contrast) |
| **State Management** | Zustand (persisted stores) |
| **Ollama Integration** | Official `ollama-js` SDK |
| **Current Status** | Phase 1 ✅ Phase 2 ✅ Phase 3 ✅ → **Ready for Phase 4** |

---

## 🏗️ Architecture Overview

### Directory Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          # Main layout wrapper
│   │   ├── CollapsibleSidebar.tsx # Animated sidebar with mobile support
│   │   └── Header.tsx             # Top header with search trigger
│   ├── assistant/
│   │   ├── AIAssistant.tsx        # Main chat interface (555 lines)
│   │   └── ChatHistorySidebar.tsx # Conversation management panel
│   ├── playground/                # Phase 3 ✨
│   │   ├── Playground.tsx         # Model testing page (~550 lines)
│   │   ├── ParameterPanel.tsx     # Live parameter controls
│   │   └── SystemPromptEditor.tsx # System prompt templates
│   ├── tools/                     # Phase 3 ✨
│   │   ├── ToolBuilder.tsx        # Visual tool definition builder
│   │   └── ToolsPlayground.tsx    # Tool calling test sandbox
│   ├── compare/                   # Phase 3 ✨
│   │   └── ModelComparison.tsx    # Side-by-side model comparison
│   ├── editor/                    # Phase 3 ✨
│   │   └── ModelFileEditor.tsx    # Monaco-based ModelFile editor
│   ├── embeddings/                # Phase 3 ✨
│   │   └── EmbeddingsPlayground.tsx # Embedding generation & search
│   ├── library/                   # Phase 3 ✨
│   │   └── ModelLibrary.tsx       # Model catalog with one-click pull
│   ├── multimodal/                # Phase 3 ✨
│   │   ├── ImageUpload.tsx        # Drag-and-drop image support
│   │   └── vision-utils.ts        # Vision model detection
│   ├── dashboard/
│   │   └── Dashboard.tsx          # Home page with charts
│   ├── models/
│   │   ├── ModelList.tsx          # Model grid view
│   │   └── ModelCard.tsx          # 3D hover effect cards
│   ├── ui/                        # shadcn/ui components
│   ├── CommandPalette.tsx         # ⌘K quick actions
│   ├── CodeBlock.tsx              # Syntax highlighting + copy
│   ├── ChatMessageContent.tsx     # Markdown + code renderer
│   ├── PageTransition.tsx         # Framer Motion wrapper
│   ├── ConnectionStatus.tsx       # Ollama connection indicator
│   ├── StreamingText.tsx          # Token-by-token rendering
│   └── ErrorBoundary.tsx          # Global error catching
├── stores/
│   ├── connection-store.ts        # Ollama connection state
│   ├── models-store.ts            # Model cache & operations
│   ├── settings-store.ts          # App settings (persisted)
│   ├── chat-store.ts              # Conversations (persisted)
│   ├── modelfiles-store.ts        # ModelFile collection
│   ├── activity-store.ts          # Activity feed
│   ├── ui-store.ts                # UI state (sidebar, palette)
│   └── index.ts                   # Exports all stores
├── hooks/
│   ├── useStreamingChat.ts        # Real-time streaming with abort
│   ├── useOllama.ts               # Model operations
│   ├── useModelCreation.ts        # Model creation flow
│   └── index.ts
├── lib/
│   ├── ollama-client.ts           # SDK wrapper (~270 lines)
│   ├── constants.ts               # Magic strings, defaults
│   └── utils.ts                   # Utility functions
├── services/
│   └── ollama.ts                  # Legacy service (still used by some components)
├── types/
│   ├── index.ts                   # App types
│   └── ollama.ts                  # Ollama-specific types
└── App.tsx                        # Routes with AnimatePresence
```

### Key Dependencies
```json
{
  "ollama": "^0.6.3",              // Official Ollama SDK
  "zustand": "^5.0.11",            // State management
  "framer-motion": "latest",       // Animations
  "recharts": "^2.12.7",           // Dashboard charts
  "react-syntax-highlighter": "latest",  // Code blocks
  "cmdk": "^1.0.0",                // Command palette
  "react-router-dom": "^6.28.0",   // Routing
  "@monaco-editor/react": "^4.x"   // ModelFile editor (Phase 3)
}
```

---

## ✅ What's Been Completed

### Phase 1: Foundation & Core Infrastructure ✅
- Replaced 734-line custom API with official `ollama-js` SDK
- Zustand stores for all state (connection, models, settings, chat, etc.)
- Real-time streaming chat with abort support
- Global error boundary and toast notifications
- Connection health check with auto-retry

### Phase 2: UI/UX Revolution ✅
- **Collapsible Sidebar** - Framer Motion animations, mobile hamburger menu
- **Command Palette** - `⌘K` for quick navigation, theme toggle, actions
- **Page Transitions** - Smooth route animations with AnimatePresence
- **Syntax Highlighting** - Code blocks with copy/download buttons
- **Chat History Sidebar** - Search, rename, export (JSON/Markdown), delete
- **Dashboard Charts** - Model sizes bar chart, storage pie chart
- **Recent Conversations Widget** - Quick access from dashboard
- **Enhanced ModelCard** - 3D tilt hover effect, progress bars
- **Dark Mode** - Fully implemented, toggle via command palette
- **Keyboard Shortcuts** - `⌘K`, `⌘/`, `⌘N`, `⌘1-7`

### Phase 3: Power Features ✅
- **Model Playground** (`/playground`) - Full chat interface with parameter tuning, system prompts, export
- **Tools Playground** (`/tools`) - Visual tool builder with templates, testing sandbox
- **Model Comparison** (`/compare`) - Side-by-side up to 4 models, blind mode, stats
- **ModelFile Editor** (`/editor`) - Monaco editor with syntax highlighting, validation
- **Embeddings Playground** (`/embeddings`) - Generate embeddings, similarity search
- **Model Library** (`/library`) - Curated catalog with one-click pull, progress tracking

---

## 🚀 What's Next: Phase 4 - Polish & Production Ready

**Reference:** See `TASKS.md` Section "Phase 4: Polish & Production Ready" for full details.

### Priority Tasks for Phase 4:

#### 4.1 Performance Optimization
- [ ] Implement React.lazy for route-based code splitting
- [ ] Add Suspense boundaries with fallbacks
- [ ] Memoize expensive computations
- [ ] Virtual scrolling for large model lists
- [ ] Bundle size analysis and optimization

#### 4.2 Accessibility (a11y)
- [ ] Complete keyboard navigation support
- [ ] Screen reader optimization (ARIA labels)
- [ ] Focus management for modals and dialogs
- [ ] Color contrast compliance (WCAG AA)

#### 4.3 Documentation & Testing
- [ ] JSDoc for all components
- [ ] Component library documentation
- [ ] End-to-end test suite
- [ ] Performance benchmarks

#### 4.4 Deployment Preparation
- [ ] Environment configuration
- [ ] Docker support
- [ ] Production build optimization

### Suggested Starting Point
Start with **4.1 Performance Optimization** - use React.lazy to split the new large components (Playground, Compare, Editor) into separate chunks.

---

## 🛠️ Quick Commands

```bash
# Development
npm run dev          # Start dev server → http://localhost:5173

# Build
npm run build        # Production build
npm run preview      # Preview production build

# Lint
npm run lint         # Run ESLint
```

---

## 📝 Important Notes

1. **Ollama Connection:** App expects Ollama running on `localhost:11434`. Connection status shown in header.

2. **State Persistence:** Settings and chat history persist via Zustand middleware to localStorage.

3. **Dark Mode:** Toggle via command palette (`⌘K` → "Toggle Theme") or in Settings page.

4. **Legacy Service:** `src/services/ollama.ts` still exists and is used by some components (ModelCard). Consider migrating to `src/lib/ollama-client.ts`.

5. **SDK Reference:** The `ollama-js/` folder in root contains the cloned official SDK repo for reference.

6. **Chat Store:** Uses `renameConversation(id, title)` not `updateConversation`. Check store interface before using.

---

## 🔗 Key Files to Know

| File | Purpose |
|------|---------|
| `TASKS.md` | Full 4-phase roadmap with checkboxes |
| `src/App.tsx` | Routes and page transitions |
| `src/stores/index.ts` | All store exports |
| `src/lib/ollama-client.ts` | Official SDK wrapper |
| `src/components/assistant/AIAssistant.tsx` | Main chat UI (largest component) |
| `src/components/CommandPalette.tsx` | Quick actions implementation |

---

*Last Updated: Phase 3 Complete - Ready for Phase 4*
