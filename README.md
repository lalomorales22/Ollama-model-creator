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
- Download new models from the Ollama library

### 🔧 **Advanced Features**
- Browse and download models from the official Ollama library
- Monitor system resources and model performance
- Comprehensive help documentation and tutorials
- Customizable settings and preferences

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
│   │   ├── create/          # Model creation wizard
│   │   ├── dashboard/       # Main dashboard
│   │   ├── downloads/       # Model download manager
│   │   ├── help/           # Help and documentation
│   │   ├── layout/         # App layout components
│   │   ├── models/         # Model management
│   │   ├── modelfiles/     # ModelFile management
│   │   ├── running/        # Running models monitor
│   │   ├── settings/       # App settings
│   │   └── ui/            # Reusable UI components
│   ├── services/           # API services
│   ├── types/             # TypeScript type definitions
│   └── hooks/             # Custom React hooks
├── public/                # Static assets
└── docs/                 # Documentation
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
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui component library
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React hooks and context

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
- **Shadcn** - For the beautiful UI component library
- **Lucide** - For the comprehensive icon set
- **Tailwind CSS** - For the utility-first CSS framework

## 🔗 Links

- **Ollama**: https://ollama.com
- **Ollama Documentation**: https://github.com/ollama/ollama/blob/main/docs/modelfile.md
- **Model Library**: https://ollama.com/library
- **GitHub Repository**: https://github.com/lalomorales22/Ollama-model-creator

---

**Made with ❤️ for the AI community**

*Create, customize, and deploy AI models with ease using Ollama Model Creator!*
