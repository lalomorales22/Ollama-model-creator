# Ollama Model Creator

<img width="929" height="860" alt="Screenshot 2026-04-03 at 11 29 08 AM" src="https://github.com/user-attachments/assets/59d7acce-1e21-4b62-bd51-9c2070af5d71" />


The definitive companion app for [Ollama](https://ollama.com). Create custom models with a full Modelfile editor, manage running models, test with a live playground, compare models side-by-side, and more — all from a modern web UI with complete Ollama API coverage.

![Ollama Model Creator](https://img.shields.io/badge/Ollama-Model%20Creator-blue?style=for-the-badge&logo=ai)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.13-38B2AC?style=for-the-badge&logo=tailwind-css)

## Ollama API Coverage

Full coverage of every Ollama REST API endpoint:

| Endpoint | Method | Status |
|---|---|---|
| `/api/generate` | POST | Streaming + non-streaming, all options |
| `/api/chat` | POST | Streaming, tools, format, think, keep_alive |
| `/api/create` | POST | All Modelfile instructions, quantize |
| `/api/tags` | GET | List all installed models |
| `/api/show` | POST | Model info with verbose flag |
| `/api/pull` | POST | Download with progress tracking |
| `/api/push` | POST | Push models to registry |
| `/api/copy` | POST | Duplicate models |
| `/api/delete` | DELETE | Remove models |
| `/api/ps` | GET | Running models with VRAM stats |
| `/api/embed` | POST | Text embeddings |
| `/api/blobs/:digest` | HEAD | Blob existence check |
| `/api/version` | GET | Version + health check |
| Load model | - | Empty generate with keep_alive |
| Unload model | - | keep_alive: 0 |

## Features

### Model Creation Wizard

A 5-step guided workflow for creating custom Ollama models with **complete Modelfile support**:

**All 8 Modelfile instructions:**
- `FROM` — Base model, GGUF file, or Safetensors directory
- `PARAMETER` — All 22+ parameters with sliders (see below)
- `SYSTEM` — System prompt with triple-quote support
- `TEMPLATE` — Go template for prompt formatting
- `ADAPTER` — LoRA adapter path (Safetensors or GGUF)
- `LICENSE` — License text
- `MESSAGE` — Preset conversation history (system/user/assistant)
- `REQUIRES` — Minimum Ollama version

**All supported parameters:**

| Category | Parameters |
|---|---|
| Sampling | `temperature`, `top_p`, `top_k`, `min_p`, `typical_p` |
| Repetition | `repeat_penalty`, `repeat_last_n`, `presence_penalty`, `frequency_penalty`, `penalize_newline` |
| Generation | `num_ctx`, `num_predict`, `seed`, `stop` |
| Performance | `num_gpu`, `num_thread`, `num_batch`, `num_keep`, `use_mmap`, `numa` |
| Mirostat | `mirostat`, `mirostat_tau`, `mirostat_eta` |

**Quantization** during creation: `q4_K_M`, `q4_K_S`, `q8_0`

**10 built-in templates:** Coding Assistant, Creative Writer, Documentation Specialist, Data Analyst, Teaching Tutor, Research Assistant, DevOps Engineer, JSON Data Extractor, Reasoning/Chain-of-Thought, Roleplay Character

### Model Playground

Dedicated testing interface with live parameter tuning:
- Multi-turn conversations with streaming
- All 22+ parameters accessible via sliders
- **JSON Mode** toggle (`format: "json"`)
- **Keep-alive** control (1m to forever)
- **Mirostat** sampling with tau/eta controls
- Parameter presets (Precise, Balanced, Creative, Random)
- Stop sequences management
- 12 system prompt templates
- Token count and generation stats (tokens/sec, load time, eval time)
- Export conversations

### Running Models Manager

Monitor and control loaded models:
- **Load models** into memory with keep-alive duration selection
- **Unload models** from memory (releases VRAM)
- Keep-alive presets: 1m, 5m, 15m, 30m, 1h, 24h, forever
- VRAM usage per model with progress bars
- Expiry countdown timers
- Total VRAM allocation overview
- Auto-refresh every 5 seconds

### AI Assistant

Chat-based ModelFile generation:
- Describe your model in natural language
- Auto-generates complete Modelfiles
- Real-time streaming with token-by-token display
- Conversation history with sidebar
- Image support for multimodal models

### Tool Calling Builder

Visual tool definition and testing:
- Drag-and-drop tool parameter builder
- JSON schema editor
- Pre-built templates (weather, search, calculator, datetime)
- Auto-execute mode with tool result injection
- Export tool definitions

### Model Comparison

Side-by-side model evaluation:
- Compare 2-4 models simultaneously
- Same prompt across all models
- Blind mode (hidden model names)
- Response quality metrics
- Export comparison reports

### ModelFile Editor

Full-featured code editor:
- Monaco Editor (VS Code engine)
- Syntax highlighting for Modelfile format
- Auto-completion for instructions and parameters
- Real-time validation with error/warning display

### Embeddings Playground

Text embedding generation and search:
- Single and batch embedding generation
- Visual dimension preview
- Cosine similarity search demo
- Export embeddings as JSON

### Model Library

Curated catalog of 18 popular models:

| Category | Models |
|---|---|
| General | Llama 3.3, Llama 3.2, Llama 3.1, Qwen 3, Gemma 3, Mistral, Mixtral |
| Code | Qwen 2.5 Coder, Code Llama, DeepSeek Coder V2, StarCoder2 |
| Reasoning | DeepSeek R1, Phi-4 |
| Vision | LLaVA, Llama 3.2 Vision |
| Embedding | nomic-embed-text, mxbai-embed-large, all-MiniLM |

### Dashboard

- Installed model count and total storage
- Running models with VRAM stats
- Ollama version display
- Model size distribution charts
- Quick action buttons
- Recent conversations
- Activity feed

### Additional Features

- **Dark mode** with system preference detection (fully themed)
- **Command palette** (`Cmd+K`) for quick navigation
- **Keyboard shortcuts** (`Cmd+1-7` for pages, `Cmd+N` new chat)
- **Settings** — connection, theme, defaults, notifications, debug mode
- **Import/Export** settings as JSON
- **Responsive** design (mobile + desktop)
- **Page transitions** with Framer Motion

## Prerequisites

1. **Node.js** (version 18+)
   ```bash
   node --version
   ```

2. **Ollama** installed and running
   ```bash
   # Install from https://ollama.com
   ollama serve
   ```

3. **At least one model downloaded**
   ```bash
   ollama pull llama3.2
   ```

## Quick Start

```bash
git clone https://github.com/lalomorales22/Ollama-model-creator.git
cd Ollama-model-creator
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Project Structure

```
src/
├── components/
│   ├── assistant/       # AI chat for ModelFile generation
│   ├── compare/         # Model comparison suite
│   ├── create/          # 5-step model creation wizard
│   ├── dashboard/       # Home with analytics
│   ├── downloads/       # Model download manager
│   ├── editor/          # Monaco ModelFile editor
│   ├── embeddings/      # Embeddings playground
│   ├── help/            # Documentation & tutorials
│   ├── layout/          # App shell, sidebar, header
│   ├── library/         # Model catalog & discovery
│   ├── models/          # Installed model grid
│   ├── modelfiles/      # ModelFile collection browser
│   ├── multimodal/      # Image upload & vision utils
│   ├── playground/      # Model testing with all params
│   ├── running/         # Running models with load/unload
│   ├── settings/        # App configuration
│   ├── tools/           # Tool calling builder & sandbox
│   └── ui/              # 40+ shadcn/ui components
├── stores/              # Zustand (7 persisted stores)
│   ├── chat-store.ts
│   ├── models-store.ts
│   ├── settings-store.ts
│   ├── connection-store.ts
│   ├── modelfiles-store.ts
│   ├── activity-store.ts
│   └── ui-store.ts
├── hooks/               # useStreamingChat, useOllama, useModelCreation
├── lib/
│   ├── ollama-client.ts # SDK wrapper with full API coverage
│   ├── constants.ts     # All params, models, templates, presets
│   └── utils.ts
├── services/
│   └── ollama.ts        # High-level service with Modelfile parser/validator
└── types/               # TypeScript definitions
```

## Configuration

### Connection

Default: `http://localhost:11434`. Change in Settings > Connection.

### Default Model Settings

Settings > Models:
- Default model for new creations
- Default temperature and context length
- Auto-load models on startup

### Keep-Alive

Control how long models stay in memory after use. Configurable per-request in the Playground, or when loading models in Running Models. Options: 0 (unload immediately), 1m, 5m (default), 15m, 30m, 1h, 24h, -1 (forever).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5.5 |
| Build | Vite 5.4 |
| Styling | Tailwind CSS 3.4 |
| Components | shadcn/ui (40+ Radix-based) |
| State | Zustand 5.0 (localStorage persistence) |
| Ollama SDK | official `ollama-js` 0.6 |
| Editor | Monaco Editor |
| Animations | Framer Motion 12 |
| Charts | Recharts 2.12 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Routing | React Router 6 |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` | Command palette |
| `Cmd+/` | Toggle sidebar |
| `Cmd+N` | New chat |
| `Cmd+1-7` | Navigate to pages |
| `Escape` | Close dialogs/palette |

## Scripts

```bash
npm run dev       # Development server (localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test
4. Commit: `git commit -m 'Add my feature'`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request

## Troubleshooting

**"Connection Error"**
- Ensure Ollama is running: `ollama serve`
- Check the URL in Settings > Connection (default `http://localhost:11434`)

**"No models found"**
- Download a model: `ollama pull llama3.2`
- Click Refresh in the Models page

**Model creation fails**
- Ensure the base model is installed
- Check the Modelfile validation errors on the Review step
- Verify disk space

**Model won't unload**
- Use Running Models > Unload button
- Or via CLI: `ollama stop <model-name>`

## License

MIT License — see [LICENSE](LICENSE).

## Acknowledgments

- [Ollama](https://ollama.com) — The local LLM platform
- [shadcn/ui](https://ui.shadcn.com) — Component library
- [Lucide](https://lucide.dev) — Icon set
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — Code editor
- [Zustand](https://zustand-demo.pmnd.rs/) — State management
- [Framer Motion](https://www.framer.com/motion/) — Animations

## Links

- **Ollama**: https://ollama.com
- **Ollama API Docs**: https://github.com/ollama/ollama/blob/main/docs/api.md
- **Modelfile Docs**: https://github.com/ollama/ollama/blob/main/docs/modelfile.md
- **Model Library**: https://ollama.com/library
- **This Repo**: https://github.com/lalomorales22/Ollama-model-creator

---

**Made with love for the AI community**
