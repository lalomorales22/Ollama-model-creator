# Ollama Model Creator
<img width="1388" alt="Screenshot 2025-06-29 at 5 03 37 AM" src="https://github.com/user-attachments/assets/a1d74382-76b1-49e2-b5d7-246c71f72a0f" />

A powerful web application for creating, managing, and deploying custom AI models using Ollama ModelFiles. This intuitive interface makes it easy to build specialized AI assistants without needing to write ModelFiles manually.

![Ollama Model Creator](https://img.shields.io/badge/Ollama-Model%20Creator-blue?style=for-the-badge&logo=ai)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.13-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🚀 What is Ollama Model Creator?

Ollama Model Creator is a comprehensive web application that simplifies the process of creating custom AI models using Ollama. Instead of manually writing ModelFiles, you can use our AI-powered assistant to generate them based on natural language descriptions of what you want your model to do.

## ✨ Key Features

### 🤖 **AI-Powered ModelFile Generation**
- Chat with an AI assistant to describe your desired model behavior
- Automatically generates complete ModelFiles with proper syntax
- Supports all ModelFile instructions (FROM, PARAMETER, SYSTEM, TEMPLATE, etc.)
- Real-time streaming responses with token-by-token display

### 📁 **ModelFile Management**
- Save and organize your ModelFile collection
- Edit, duplicate, and download ModelFiles
- Import ModelFiles into the model creation workflow

### 🛠️ **Visual Model Creation**
- Step-by-step guided model creation process
- Configure parameters with intuitive sliders and inputs
- Real-time ModelFile preview and validation

### 📊 **Model Management Dashboard**
- View all installed Ollama models
- Monitor running models and resource usage
- Real-time system stats (CPU, memory, GPU)
- Model usage analytics with charts
- Recent conversations widget

### ⚡ **Power Features** (NEW!)

#### 🎮 Model Playground
- Dedicated chat interface for testing any model
- Multi-turn conversations with history
- Live parameter tuning (temperature, top_p, top_k, etc.)
- 12 system prompt templates (Code Expert, Creative Writer, Socratic Teacher, etc.)
- Token count and generation stats display
- Export conversations as JSON/Markdown

#### 🔧 Tool Calling Builder
- Visual tool definition builder with JSON schema editor
- Pre-built templates (weather, search, calculator, datetime)
- Tool testing sandbox with auto-execute option
- Export tool definitions as JSON

#### ⚖️ Model Comparison Suite
- Side-by-side comparison of 2-4 models simultaneously
- Same prompt across multiple models
- Blind mode (hidden model names for unbiased comparison)
- Response quality metrics (speed, tokens, etc.)
- Export comparison reports

#### 📝 Advanced ModelFile Editor
- Full-featured Monaco code editor
- Custom syntax highlighting for ModelFile format
- Auto-completion for instructions and parameters
- Real-time validation with error highlighting
- 5 built-in templates (Basic, Code Assistant, Creative Writer, etc.)

#### 🧮 Embeddings Playground
- Text embedding generation interface
- Batch embedding for multiple texts
- Visual embedding preview (dimension values)
- Cosine similarity search demo
- Export embeddings as JSON

#### 📚 Model Library & Discovery
- Curated catalog of 16 popular models
- Category filters (General, Code, Vision, Embedding, Small)
- Model variants selection (different sizes)
- One-click model installation with progress tracking
- Detailed model capabilities and descriptions

### 🔧 **Advanced Features**
- Browse and download models from the official Ollama library
- Monitor system resources and model performance
- Comprehensive help documentation and tutorials
- Customizable settings and preferences
- Dark mode with system preference detection
- Command palette (⌘K) for quick navigation
- Keyboard shortcuts throughout the app

## 🎯 What Can You Create?

- **Coding Assistants** - Specialized for different programming languages
- **Writing Helpers** - Creative writing, technical documentation, copywriting
- **Domain Experts** - Legal, medical, financial, or industry-specific assistants
- **Educational Tutors** - Subject-specific teaching assistants
- **Creative Partners** - Storytelling, brainstorming, and ideation helpers
- **Analysis Tools** - Data interpretation, research, and reporting assistants

## 🛠️ Prerequisites

Before running Ollama Model Creator, make sure you have:

1. **Node.js** (version 18 or higher)
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```

2. **Ollama** installed and running
   - Download from: https://ollama.com
   - Install and start the Ollama service
   - Verify it's running: `ollama list`

3. **At least one base model downloaded**
   ```bash
   ollama pull llama3.2
   # or
   ollama pull mistral
   ```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/lalomorales22/Ollama-model-creator.git
cd Ollama-model-creator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:5173` in your web browser.

## 📖 How to Use

### Creating Your First Custom Model

1. **Start with the AI Assistant**
   - Navigate to the "AI Assistant" page
   - Describe what kind of model you want to create
   - Example: "Create a coding assistant that specializes in Python and provides detailed explanations"

2. **Generate the ModelFile**
   - The AI will generate a complete ModelFile based on your description
   - Review and edit the generated ModelFile if needed
   - Save it to your ModelFiles collection

3. **Create the Model**
   - Go to "Create Model" page
   - Select your saved ModelFile or create a new one
   - Configure parameters (temperature, context length, etc.)
   - Click "Create Model" and wait for the process to complete

4. **Use Your Model**
   - Your custom model will appear in the Models list
   - Use it with Ollama CLI: `ollama run your-model-name`
   - Or integrate it into other applications

### Managing Your Models

- **View Models**: See all installed models in the Models page
- **Monitor Usage**: Check running models and resource consumption
- **Download New Models**: Browse and download from the Ollama library
- **Organize ModelFiles**: Save, edit, and organize your ModelFile templates

## 🏗️ Project Structure

```
Ollama-model-creator/
├── src/
│   ├── components/          # React components
│   │   ├── assistant/       # AI Assistant chat interface
│   │   ├── compare/         # Model comparison suite (NEW)
│   │   ├── create/          # Model creation wizard
│   │   ├── dashboard/       # Main dashboard
│   │   ├── downloads/       # Model download manager
│   │   ├── editor/          # Monaco ModelFile editor (NEW)
│   │   ├── embeddings/      # Embeddings playground (NEW)
│   │   ├── help/            # Help and documentation
│   │   ├── layout/          # App layout components
│   │   ├── library/         # Model library & discovery (NEW)
│   │   ├── models/          # Model management
│   │   ├── modelfiles/      # ModelFile management
│   │   ├── multimodal/      # Image upload & vision (NEW)
│   │   ├── playground/      # Model testing playground (NEW)
│   │   ├── running/         # Running models monitor
│   │   ├── settings/        # App settings
│   │   ├── tools/           # Tool calling builder (NEW)
│   │   └── ui/              # Reusable UI components (shadcn/ui)
│   ├── stores/              # Zustand state management
│   │   ├── chat-store.ts    # Chat history & conversations
│   │   ├── models-store.ts  # Model cache & operations
│   │   ├── settings-store.ts # App settings (persisted)
│   │   ├── connection-store.ts # Ollama connection status
│   │   ├── modelfiles-store.ts # ModelFile collection
│   │   ├── activity-store.ts # Activity feed
│   │   └── ui-store.ts      # UI state (sidebar, palette)
│   ├── hooks/               # Custom React hooks
│   │   ├── useStreamingChat.ts # Real-time streaming with abort
│   │   ├── useOllama.ts     # Model operations
│   │   └── useModelCreation.ts # Model creation flow
│   ├── lib/                 # Utilities & SDK wrapper
│   │   ├── ollama-client.ts # Official ollama-js SDK wrapper
│   │   ├── constants.ts     # App constants
│   │   └── utils.ts         # Utility functions
│   ├── services/            # API services (legacy)
│   └── types/               # TypeScript type definitions
├── ollama-js/               # Official Ollama SDK reference
├── public/                  # Static assets
└── docs/                    # Documentation
```

## 🔧 Configuration

### Ollama Connection Settings

The app connects to Ollama at `http://localhost:11434` by default. You can change this in the Settings page:

1. Go to Settings → Connection
2. Update the Ollama API URL if needed
3. Test the connection
4. Save your settings

### Default Model Settings

Configure default parameters for new models:
- **Default Model**: Base model for new creations
- **Temperature**: Default creativity setting
- **Context Length**: Default context window size

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with neo-brutalist design system
- **UI Components**: shadcn/ui component library
- **State Management**: Zustand with localStorage persistence
- **Ollama Integration**: Official `ollama-js` SDK
- **Code Editor**: Monaco Editor (VS Code's editor)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Routing**: React Router v6

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `⌘/` / `Ctrl+/` | Toggle sidebar |
| `⌘N` / `Ctrl+N` | New chat |
| `⌘1-7` | Navigate to pages |

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Add TypeScript types for new features
- Test your changes thoroughly
- Update documentation as needed
- Ensure responsive design works on all screen sizes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**"Connection Error" - Can't connect to Ollama**
- Ensure Ollama is installed and running
- Check that Ollama is accessible at `http://localhost:11434`
- Try restarting the Ollama service

**"No models found"**
- Download at least one base model: `ollama pull llama3.2`
- Refresh the models list in the app
- Check Ollama installation

**Model creation fails**
- Ensure you have sufficient disk space
- Check that the base model is available
- Verify ModelFile syntax is correct

### Getting Help

- 📖 **Documentation**: Check the Help page in the app
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Open an issue with the "enhancement" label
- 💬 **Discussions**: Use GitHub Discussions for questions

## 🙏 Acknowledgments

- **Ollama Team** - For creating the amazing Ollama platform
- **shadcn** - For the beautiful UI component library
- **Lucide** - For the comprehensive icon set
- **Tailwind CSS** - For the utility-first CSS framework
- **Monaco Editor** - For the powerful code editing experience
- **Framer Motion** - For smooth animations
- **Zustand** - For simple and effective state management

## 🔗 Links

- **Ollama**: https://ollama.com
- **Ollama Documentation**: https://github.com/ollama/ollama/blob/main/docs/modelfile.md
- **Model Library**: https://ollama.com/library
- **GitHub Repository**: https://github.com/lalomorales22/Ollama-model-creator

---

**Made with ❤️ for the AI community**

*Create, customize, and deploy AI models with ease using Ollama Model Creator!*
